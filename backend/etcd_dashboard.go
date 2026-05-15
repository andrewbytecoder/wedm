package backend

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"

	clientv3 "go.etcd.io/etcd/client/v3"
)

// EtcdClusterDashboard returns JSON for the cluster health dashboard: header, status, members,
// MVCC-visible key counts (respecting auth read ranges), lease summaries, and selected Prometheus /metrics samples.
func (a *App) EtcdClusterDashboard(configJSON string) (string, error) {
	ctx, cancel := a.etcdCtx()
	defer cancel()
	cli, err := newEtcdClient(ctx, configJSON)
	if err != nil {
		return "", err
	}
	defer cli.Close()
	root, err := parseRootConfig(configJSON)
	if err != nil {
		return "", err
	}
	etcd, scope, err := extractEtcdBlock(root)
	if err != nil {
		return "", err
	}
	ep := endpointFromEtcd(etcd)

	memList, err := cli.MemberList(ctx)
	if err != nil {
		return "", err
	}
	type member struct {
		ID         string   `json:"id"`
		Name       string   `json:"name"`
		ClientURLs []string `json:"clientURLs"`
	}
	members := make([]member, 0, len(memList.Members))
	for _, m := range memList.Members {
		members = append(members, member{
			ID:         fmt.Sprintf("%d", m.ID),
			Name:       string(m.Name),
			ClientURLs: append([]string(nil), m.ClientURLs...),
		})
	}

	st, err := cli.Status(ctx, ep)
	if err != nil {
		return "", err
	}

	keyCount, kcErr := countKeysInReadScope(ctx, cli, configJSON)
	leases, leaseN, lsErr := leaseSummariesForDashboard(ctx, cli, 400)
	metrics, mURL, mErr := fetchEtcdPrometheusMetrics(etcd, scope, ep, 12*time.Second)

	out := map[string]interface{}{
		"fetchedAtMs": time.Now().UnixMilli(),
		"header": map[string]interface{}{
			"cluster_id": fmt.Sprintf("%d", memList.Header.ClusterId),
			"member_id":  fmt.Sprintf("%d", memList.Header.MemberId),
			"revision":   memList.Header.Revision,
			"raft_term":  memList.Header.RaftTerm,
		},
		"status": map[string]interface{}{
			"version":   st.Version,
			"dbSize":    st.DbSize,
			"leader":    fmt.Sprintf("%x", st.Leader),
			"raftIndex": st.RaftIndex,
			"raftTerm":  st.RaftTerm,
		},
		"members":         members,
		"memberCount":     len(members),
		"keyCount":        keyCount,
		"keyCountError":   errString(kcErr),
		"leases":          leases,
		"leaseCount":      leaseN,
		"leaseListError":  errString(lsErr),
		"metrics":         metrics,
		"metricsURL":      mURL,
		"metricsError":    mErr,
		"metricsKeyCount": len(metrics),
	}
	b, err := json.Marshal(out)
	return string(b), err
}

func errString(e error) string {
	if e == nil {
		return ""
	}
	return e.Error()
}

func countKeysInReadScope(ctx context.Context, cli *clientv3.Client, configJSON string) (int64, error) {
	reads, _, full, err := authKeyRanges(ctx, cli, configJSON)
	if err != nil {
		return 0, err
	}
	if full {
		resp, err := cli.Get(ctx, "\x00", clientv3.WithFromKey(), clientv3.WithCountOnly())
		if err != nil {
			return 0, err
		}
		return resp.Count, nil
	}
	if len(reads) == 0 {
		return 0, nil
	}
	var total int64
	for _, br := range reads {
		var resp *clientv3.GetResponse
		var err error
		if len(br.end) == 0 {
			resp, err = cli.Get(ctx, string(br.start), clientv3.WithCountOnly())
		} else {
			resp, err = cli.Get(ctx, string(br.start), clientv3.WithRange(string(br.end)), clientv3.WithCountOnly())
		}
		if err != nil {
			return 0, err
		}
		total += resp.Count
	}
	return total, nil
}

func leaseSummariesForDashboard(ctx context.Context, cli *clientv3.Client, max int) ([]map[string]interface{}, int, error) {
	ls, err := cli.Leases(ctx)
	if err != nil {
		return nil, 0, err
	}
	n := len(ls.Leases)
	out := make([]map[string]interface{}, 0, min(n, max))
	for i, row := range ls.Leases {
		if i >= max {
			break
		}
		tlv, err := cli.TimeToLive(ctx, row.ID, clientv3.WithAttachedKeys())
		if err != nil {
			continue
		}
		keys := make([]string, 0, len(tlv.Keys))
		for _, kb := range tlv.Keys {
			keys = append(keys, string(kb))
		}
		sample := append([]string(nil), keys...)
		if len(sample) > 5 {
			sample = sample[:5]
		}
		out = append(out, map[string]interface{}{
			"id":         fmt.Sprintf("%d", row.ID),
			"ttl":        tlv.TTL,
			"grantedTTL": tlv.GrantedTTL,
			"keyCount":   len(keys),
			"keysSample": sample,
		})
	}
	return out, n, nil
}

func fetchEtcdPrometheusMetrics(etcd map[string]interface{}, scope map[string]interface{}, ep string, timeout time.Duration) (map[string]float64, string, string) {
	tlsCfg, err := tlsConfigFromScope(etcd, scope)
	if err != nil {
		return nil, "", err.Error()
	}
	scheme := "http"
	if tlsCfg != nil {
		scheme = "https"
	}
	metricsURL := fmt.Sprintf("%s://%s/metrics", scheme, ep)
	tr := &http.Transport{
		TLSClientConfig: tlsCfg,
	}
	client := &http.Client{Transport: tr, Timeout: timeout}
	req, err := http.NewRequest(http.MethodGet, metricsURL, nil)
	if err != nil {
		return nil, metricsURL, err.Error()
	}
	user, pass := authFromScope(scope)
	if user != "" {
		req.SetBasicAuth(user, pass)
	}
	resp, err := client.Do(req)
	if err != nil {
		return nil, metricsURL, err.Error()
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, metricsURL, fmt.Sprintf("HTTP %d", resp.StatusCode)
	}
	body, err := io.ReadAll(io.LimitReader(resp.Body, 4<<20))
	if err != nil {
		return nil, metricsURL, err.Error()
	}
	m := parsePrometheusForDashboard(string(body))
	return m, metricsURL, ""
}

// parsePrometheusForDashboard extracts a small stable subset of gauges/counters for charts.
func parsePrometheusForDashboard(text string) map[string]float64 {
	out := make(map[string]float64)
	sumCounters := map[string]bool{
		"etcd_debugging_mvcc_keys_total": true,
		"grpc_server_started_total":      true,
		"grpc_server_handled_total":      true,
	}
	sc := bufio.NewScanner(strings.NewReader(text))
	buf := make([]byte, 0, 64*1024)
	sc.Buffer(buf, 1024*1024)
	for sc.Scan() {
		line := strings.TrimSpace(sc.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		fields := strings.Fields(line)
		if len(fields) < 2 {
			continue
		}
		namePart := fields[0]
		valStr := fields[len(fields)-1]
		if len(fields) >= 3 {
			if _, err := strconv.ParseInt(valStr, 10, 64); err == nil {
				valStr = fields[len(fields)-2]
			}
		}
		v, err := strconv.ParseFloat(valStr, 64)
		if err != nil {
			continue
		}
		base := namePart
		if i := strings.IndexByte(namePart, '{'); i >= 0 {
			base = namePart[:i]
		}
		if !prometheusLineWanted(base) {
			continue
		}
		if sumCounters[base] {
			out[base] += v
		} else {
			out[base] = v
		}
	}
	return out
}

func prometheusLineWanted(base string) bool {
	allowed := []string{
		"process_cpu_seconds_total",
		"process_resident_memory_bytes",
		"process_virtual_memory_bytes",
		"go_memstats_alloc_bytes",
		"go_memstats_heap_inuse_bytes",
		"go_memstats_sys_bytes",
		"go_memstats_heap_alloc_bytes",
		"etcd_debugging_mvcc_keys_total",
		"etcd_mvcc_db_total_size_in_use_in_bytes",
		"etcd_mvcc_db_total_size_in_bytes",
		"etcd_server_version",
		"etcd_server_health",
		"grpc_server_started_total",
		"grpc_server_handled_total",
		"etcd_disk_backend_commit_duration_seconds_sum",
		"etcd_disk_backend_commit_duration_seconds_count",
		"etcd_network_client_grpc_received_bytes_total",
		"etcd_network_client_grpc_sent_bytes_total",
		"etcd_debugging_mvcc_db_compaction_keys_total",
		"etcd_debugging_mvcc_current_revision",
		"etcd_debugging_mvcc_compact_revision",
	}
	for _, p := range allowed {
		if base == p {
			return true
		}
	}
	return false
}
