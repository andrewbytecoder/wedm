package main

import (
	"context"
	"encoding/json"
	"strconv"
	"strings"

	"go.etcd.io/etcd/api/v3/v3rpc/rpctypes"
	clientv3 "go.etcd.io/etcd/client/v3"
)

// parseEtcdVersionFloat parses "3.5.17" -> 3.5 for legacy menu lease gate (parseFloat style).
func parseEtcdVersionFloat(v string) float64 {
	v = strings.TrimSpace(v)
	if v == "" {
		return 0
	}
	parts := strings.Split(v, ".")
	if len(parts) >= 2 {
		f, err := strconv.ParseFloat(parts[0]+"."+parts[1], 64)
		if err == nil {
			return f
		}
	}
	f, _ := strconv.ParseFloat(v, 64)
	return f
}

// isRootForMenu matches legacy AuthService.isRoot + config.service "limited" commit (show cluster/users/roles/leases).
func isRootForMenu(ctx context.Context, cli *clientv3.Client, configJSON string) (bool, error) {
	root, err := parseRootConfig(configJSON)
	if err != nil {
		return false, err
	}
	_, scope, err := extractEtcdBlock(root)
	if err != nil {
		return false, err
	}
	user, _ := authFromScope(scope)
	if strings.TrimSpace(user) == "" {
		// Legacy: !isAuthenticated() -> hasRole returns true -> isRoot true
		return true, nil
	}
	if user == "root" {
		return true, nil
	}
	ug, err := cli.UserGet(ctx, user)
	if err != nil {
		if rpctypes.Error(err) == rpctypes.ErrAuthNotEnabled {
			return true, nil
		}
		return false, err
	}
	for _, r := range ug.Roles {
		if r == "root" {
			return true, nil
		}
	}
	return false, nil
}

// EtcdMenuCapabilities returns JSON { "isRoot": bool, "serverVersion": float64 } for sidebar + lease gate.
func (a *App) EtcdMenuCapabilities(configJSON string) (string, error) {
	ctx, cancel := a.etcdCtx()
	defer cancel()
	cli, err := newEtcdClient(ctx, configJSON)
	if err != nil {
		return "", err
	}
	defer cli.Close()
	isRoot, err := isRootForMenu(ctx, cli, configJSON)
	if err != nil {
		return "", err
	}
	root, _ := parseRootConfig(configJSON)
	etcd, _, _ := extractEtcdBlock(root)
	ep := endpointFromEtcd(etcd)
	st, err := cli.Status(ctx, ep)
	if err != nil {
		out, _ := json.Marshal(map[string]interface{}{
			"isRoot":        isRoot,
			"serverVersion": 0,
			"statusError":   err.Error(),
		})
		return string(out), nil
	}
	ver := parseEtcdVersionFloat(st.Version)
	b, err := json.Marshal(map[string]interface{}{
		"isRoot":        isRoot,
		"serverVersion": ver,
		"version":       st.Version,
	})
	return string(b), err
}
