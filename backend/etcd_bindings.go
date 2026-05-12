package backend

import (
	"context"
	"encoding/json"
	"fmt"
	"strconv"
	"time"

	clientv3 "go.etcd.io/etcd/client/v3"
)

func (a *App) etcdCtx() (context.Context, context.CancelFunc) {
	return context.WithTimeout(context.Background(), 45*time.Second)
}

// EtcdPing checks connectivity and returns server version JSON.
func (a *App) EtcdPing(configJSON string) (string, error) {
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
	etcd, _, err := extractEtcdBlock(root)
	if err != nil {
		return "", err
	}
	ep := endpointFromEtcd(etcd)
	st, err := cli.Status(ctx, ep)
	if err != nil {
		return "", err
	}
	out := map[string]interface{}{
		"version":   st.Version,
		"dbSize":    st.DbSize,
		"raftIndex": st.RaftIndex,
		"raftTerm":  st.RaftTerm,
		"leader":    st.Leader,
	}
	b, err := json.Marshal(out)
	return string(b), err
}

// EtcdMemberList returns JSON compatible with the legacy `health.vue` / `StatsService.listMembers` shape.
func (a *App) EtcdMemberList(configJSON string) (string, error) {
	ctx, cancel := a.etcdCtx()
	defer cancel()
	cli, err := newEtcdClient(ctx, configJSON)
	if err != nil {
		return "", err
	}
	defer cli.Close()
	resp, err := cli.MemberList(ctx)
	if err != nil {
		return "", err
	}
	type member struct {
		ID         string   `json:"ID"`
		Name       string   `json:"name"`
		ClientURLs []string `json:"clientURLs"`
		PeerURLs   []string `json:"peerURLs"`
	}
	members := make([]member, 0, len(resp.Members))
	for _, m := range resp.Members {
		members = append(members, member{
			ID:         strconv.FormatUint(m.ID, 10),
			Name:       string(m.Name),
			ClientURLs: append([]string(nil), m.ClientURLs...),
			PeerURLs:   append([]string(nil), m.PeerURLs...),
		})
	}
	out := map[string]interface{}{
		"header": map[string]interface{}{
			"cluster_id": strconv.FormatUint(resp.Header.ClusterId, 10),
			"member_id":  strconv.FormatUint(resp.Header.MemberId, 10),
			"revision":   resp.Header.Revision,
			"raft_term":  resp.Header.RaftTerm,
		},
		"members": members,
	}
	b, err := json.Marshal(out)
	return string(b), err
}

// EtcdListKeys returns JSON `{ "items": [ {"key":"...", "value":"..."} ] }` for keys with prefix (empty = all, limited).
func (a *App) EtcdListKeys(configJSON, prefix string) (string, error) {
	ctx, cancel := a.etcdCtx()
	defer cancel()
	cli, err := newEtcdClient(ctx, configJSON)
	if err != nil {
		return "", err
	}
	defer cli.Close()
	const limit int64 = 20000
	pairs, err := listKeysMerged(ctx, cli, configJSON, prefix, limit)
	if err != nil {
		return "", err
	}
	type kv struct {
		Key   string `json:"key"`
		Value string `json:"value"`
	}
	items := make([]kv, 0, len(pairs))
	for _, pair := range pairs {
		items = append(items, kv{Key: pair.Key, Value: pair.Value})
	}
	b, err := json.Marshal(map[string]interface{}{"items": items})
	return string(b), err
}

// EtcdGetKey returns the string value for a single key (empty string if missing).
func (a *App) EtcdGetKey(configJSON, key string) (string, error) {
	ctx, cancel := a.etcdCtx()
	defer cancel()
	cli, err := newEtcdClient(ctx, configJSON)
	if err != nil {
		return "", err
	}
	defer cli.Close()
	resp, err := cli.Get(ctx, key)
	if err != nil {
		return "", err
	}
	if len(resp.Kvs) == 0 {
		return "", nil
	}
	return string(resp.Kvs[0].Value), nil
}

// EtcdPutKey writes a key; leaseSeconds <= 0 means no lease.
func (a *App) EtcdPutKey(configJSON, key, value string, leaseSeconds int) (string, error) {
	ctx, cancel := a.etcdCtx()
	defer cancel()
	cli, err := newEtcdClient(ctx, configJSON)
	if err != nil {
		return "", err
	}
	defer cli.Close()
	var putOpts []clientv3.OpOption
	if leaseSeconds > 0 {
		lgr, err := cli.Grant(ctx, int64(leaseSeconds))
		if err != nil {
			return "", err
		}
		putOpts = append(putOpts, clientv3.WithLease(lgr.ID))
	}
	pr, err := cli.Put(ctx, key, value, putOpts...)
	if err != nil {
		return "", err
	}
	out, _ := json.Marshal(map[string]interface{}{"revision": pr.Header.Revision})
	return string(out), nil
}

// EtcdDeleteKeys deletes keys; keysJSON is a JSON string array, e.g. `["a","b"]`.
func (a *App) EtcdDeleteKeys(configJSON, keysJSON string) (string, error) {
	var keys []string
	if err := json.Unmarshal([]byte(keysJSON), &keys); err != nil {
		return "", fmt.Errorf("keys json: %w", err)
	}
	ctx, cancel := a.etcdCtx()
	defer cancel()
	cli, err := newEtcdClient(ctx, configJSON)
	if err != nil {
		return "", err
	}
	defer cli.Close()
	_, writes, full, err := authKeyRanges(ctx, cli, configJSON)
	if err != nil {
		return "", err
	}
	if !full {
		if err := assertKeysWritable(keys, writes); err != nil {
			return "", err
		}
	}
	deleted := int64(0)
	for _, k := range keys {
		if k == "" {
			continue
		}
		dr, err := cli.Delete(ctx, k)
		if err != nil {
			return "", err
		}
		deleted += dr.Deleted
	}
	b, _ := json.Marshal(map[string]int64{"deleted": deleted})
	return string(b), nil
}

// EtcdTouchKeys refreshes keys by rewriting the same value (keysJSON = JSON string array).
func (a *App) EtcdTouchKeys(configJSON, keysJSON string) (string, error) {
	var keys []string
	if err := json.Unmarshal([]byte(keysJSON), &keys); err != nil {
		return "", fmt.Errorf("keys json: %w", err)
	}
	ctx, cancel := a.etcdCtx()
	defer cancel()
	cli, err := newEtcdClient(ctx, configJSON)
	if err != nil {
		return "", err
	}
	defer cli.Close()
	_, writes, full, err := authKeyRanges(ctx, cli, configJSON)
	if err != nil {
		return "", err
	}
	if !full {
		if err := assertKeysWritable(keys, writes); err != nil {
			return "", err
		}
	}
	n := 0
	for _, k := range keys {
		if k == "" {
			continue
		}
		gr, err := cli.Get(ctx, k)
		if err != nil {
			return "", err
		}
		if len(gr.Kvs) == 0 {
			continue
		}
		val := string(gr.Kvs[0].Value)
		// Preserve existing lease (matches etcd3 put().touch() semantics).
		if _, err := cli.Put(ctx, k, val, clientv3.WithIgnoreLease()); err != nil {
			return "", err
		}
		n++
	}
	b, _ := json.Marshal(map[string]int{"touched": n})
	return string(b), nil
}

// EtcdPurgeAllKeys deletes every key in the namespace (dangerous; matches legacy purge).
func (a *App) EtcdPurgeAllKeys(configJSON string) (string, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 120*time.Second)
	defer cancel()
	cli, err := newEtcdClient(ctx, configJSON)
	if err != nil {
		return "", err
	}
	defer cli.Close()
	_, writes, full, err := authKeyRanges(ctx, cli, configJSON)
	if err != nil {
		return "", err
	}
	var deleted int64
	if full {
		resp, derr := cli.Delete(ctx, "\x00", clientv3.WithFromKey())
		if derr != nil {
			return "", derr
		}
		deleted = resp.Deleted
	} else {
		deleted, err = purgeByWriteRanges(ctx, cli, writes)
		if err != nil {
			return "", err
		}
	}
	b, _ := json.Marshal(map[string]int64{"deleted": deleted})
	return string(b), nil
}

// EtcdPutKeyTx: createOnly=true uses a compare-and-create transaction; otherwise updates with ignoreLease (edit).
func (a *App) EtcdPutKeyTx(configJSON, key, value string, leaseSeconds int, createOnly bool) (string, error) {
	ctx, cancel := a.etcdCtx()
	defer cancel()
	cli, err := newEtcdClient(ctx, configJSON)
	if err != nil {
		return "", err
	}
	defer cli.Close()

	if !createOnly {
		pr, err := cli.Put(ctx, key, value, clientv3.WithIgnoreLease())
		if err != nil {
			return "", err
		}
		b, _ := json.Marshal(map[string]interface{}{"succeeded": true, "revision": pr.Header.Revision})
		return string(b), nil
	}

	var putOp clientv3.Op
	if leaseSeconds > 0 {
		lgr, err := cli.Grant(ctx, int64(leaseSeconds))
		if err != nil {
			return "", err
		}
		putOp = clientv3.OpPut(key, value, clientv3.WithLease(lgr.ID))
	} else {
		putOp = clientv3.OpPut(key, value)
	}
	txn := cli.Txn(ctx)
	cmp := clientv3.Compare(clientv3.CreateRevision(key), "=", 0)
	tresp, err := txn.If(cmp).Then(putOp).Commit()
	if err != nil {
		return "", err
	}
	b, _ := json.Marshal(map[string]interface{}{
		"succeeded": tresp.Succeeded,
		"revision":  tresp.Header.Revision,
	})
	return string(b), nil
}
