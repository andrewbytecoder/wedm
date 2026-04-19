package main

import (
	"context"
	"crypto/tls"
	"crypto/x509"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"math"
	"strconv"
	"strings"
	"time"

	clientv3 "go.etcd.io/etcd/client/v3"
)

func parseRootConfig(configJSON string) (map[string]interface{}, error) {
	var root map[string]interface{}
	if err := json.Unmarshal([]byte(configJSON), &root); err != nil {
		return nil, err
	}
	return root, nil
}

func extractEtcdBlock(root map[string]interface{}) (etcd map[string]interface{}, scope map[string]interface{}, err error) {
	if e, ok := root["etcd"].(map[string]interface{}); ok && etcdBlockUsable(e) {
		return e, root, nil
	}
	profs, ok := root["profiles"].([]interface{})
	if !ok {
		return nil, nil, fmt.Errorf("etcd configuration missing")
	}
	for _, p := range profs {
		pm, ok := p.(map[string]interface{})
		if !ok {
			continue
		}
		e, ok := pm["etcd"].(map[string]interface{})
		if ok && etcdBlockUsable(e) {
			return e, pm, nil
		}
	}
	return nil, nil, fmt.Errorf("etcd configuration missing")
}

func etcdBlockUsable(e map[string]interface{}) bool {
	hosts, _ := e["hosts"].(string)
	if strings.TrimSpace(hosts) == "" {
		return false
	}
	return portPositive(e["port"])
}

func portPositive(p interface{}) bool {
	switch v := p.(type) {
	case float64:
		return v > 0 && v < math.MaxInt32
	case int:
		return v > 0
	case int64:
		return v > 0
	case string:
		n, err := strconv.Atoi(strings.TrimSpace(v))
		return err == nil && n > 0
	default:
		return false
	}
}

func endpointFromEtcd(e map[string]interface{}) string {
	hosts, _ := e["hosts"].(string)
	hosts = strings.TrimSpace(hosts)
	var port int
	switch v := e["port"].(type) {
	case float64:
		port = int(v)
	case int:
		port = v
	case int64:
		port = int(v)
	case string:
		port, _ = strconv.Atoi(strings.TrimSpace(v))
	}
	if strings.Contains(hosts, ":") && !strings.HasPrefix(hosts, "[") {
		if port == 0 {
			return hosts
		}
	}
	return fmt.Sprintf("%s:%d", hosts, port)
}

func dialTimeoutFromEtcd(e map[string]interface{}) time.Duration {
	ms := 30000.0
	switch v := e["dialTimeout"].(type) {
	case float64:
		ms = v
	case int:
		ms = float64(v)
	case string:
		if n, err := strconv.Atoi(strings.TrimSpace(v)); err == nil {
			ms = float64(n)
		}
	}
	if ms <= 0 {
		ms = 30000
	}
	return time.Duration(ms) * time.Millisecond
}

func authFromScope(scope map[string]interface{}) (user, pass string) {
	a, ok := scope["etcdAuth"].(map[string]interface{})
	if !ok || a == nil {
		return "", ""
	}
	user, _ = a["username"].(string)
	pass, _ = a["password"].(string)
	return user, pass
}

func tlsConfigFromScope(etcd map[string]interface{}, scope map[string]interface{}) (*tls.Config, error) {
	ssl, ok := etcd["ssl"].(map[string]interface{})
	if !ok || ssl == nil {
		return nil, nil
	}
	en, _ := ssl["enabled"].(bool)
	if !en {
		return nil, nil
	}
	cred, ok := scope["credentials"].(map[string]interface{})
	if !ok || cred == nil {
		return nil, fmt.Errorf("TLS enabled but credentials block missing")
	}
	rootPEM, err := materializePEM(cred["rootCertificate"])
	if err != nil {
		return nil, fmt.Errorf("root certificate: %w", err)
	}
	pool := x509.NewCertPool()
	if !pool.AppendCertsFromPEM(rootPEM) {
		return nil, fmt.Errorf("failed to parse CA PEM")
	}
	cfg := &tls.Config{RootCAs: pool, MinVersion: tls.VersionTLS12}

	if pk, err := materializePEM(cred["privateKey"]); err == nil && len(pk) > 0 {
		if cc, err := materializePEM(cred["certChain"]); err == nil && len(cc) > 0 {
			cert, err := tls.X509KeyPair(cc, pk)
			if err != nil {
				return nil, fmt.Errorf("client cert: %w", err)
			}
			cfg.Certificates = []tls.Certificate{cert}
		}
	}
	return cfg, nil
}

func materializePEM(v interface{}) ([]byte, error) {
	if v == nil {
		return nil, nil
	}
	switch t := v.(type) {
	case string:
		if t == "" {
			return nil, nil
		}
		if strings.Contains(t, "-----BEGIN") {
			return []byte(t), nil
		}
		b, err := base64.StdEncoding.DecodeString(t)
		if err != nil {
			return []byte(t), nil
		}
		return b, nil
	case map[string]interface{}:
		if typ, _ := t["type"].(string); typ == "Buffer" {
			arr, ok := t["data"].([]interface{})
			if !ok {
				return nil, fmt.Errorf("buffer field")
			}
			out := make([]byte, 0, len(arr))
			for _, x := range arr {
				n, ok := x.(float64)
				if !ok {
					return nil, fmt.Errorf("buffer element")
				}
				out = append(out, byte(n))
			}
			return out, nil
		}
	}
	return nil, fmt.Errorf("unsupported PEM encoding")
}

func newEtcdClient(ctx context.Context, configJSON string) (*clientv3.Client, error) {
	root, err := parseRootConfig(configJSON)
	if err != nil {
		return nil, err
	}
	etcd, scope, err := extractEtcdBlock(root)
	if err != nil {
		return nil, err
	}
	ep := endpointFromEtcd(etcd)
	tlsCfg, err := tlsConfigFromScope(etcd, scope)
	if err != nil {
		return nil, err
	}
	user, pass := authFromScope(scope)
	cfg := clientv3.Config{
		Endpoints:            []string{ep},
		DialTimeout:          dialTimeoutFromEtcd(etcd),
		DialKeepAliveTime:    30 * time.Second,
		DialKeepAliveTimeout: 10 * time.Second,
		Username:             user,
		Password:             pass,
		TLS:                  tlsCfg,
	}
	cli, err := clientv3.New(cfg)
	if err != nil {
		return nil, err
	}
	// quick ping
	pctx, cancel := context.WithTimeout(ctx, dialTimeoutFromEtcd(etcd))
	defer cancel()
	if _, err := cli.Status(pctx, ep); err != nil {
		_ = cli.Close()
		return nil, err
	}
	return cli, nil
}
