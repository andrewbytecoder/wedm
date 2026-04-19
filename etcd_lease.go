package main

import (
	"encoding/json"
	"fmt"
	"strconv"

	clientv3 "go.etcd.io/etcd/client/v3"
)

// EtcdLeaseGet returns JSON { "id", "ttl", "grantedTTL", "keys": ["..."] } for one lease (keys from TimeToLive with attached keys).
func (a *App) EtcdLeaseGet(configJSON, leaseID string) (string, error) {
	ctx, cancel := a.etcdCtx()
	defer cancel()
	cli, err := newEtcdClient(ctx, configJSON)
	if err != nil {
		return "", err
	}
	defer cli.Close()
	idU, err := strconv.ParseUint(leaseID, 10, 64)
	if err != nil {
		return "", fmt.Errorf("lease id: %w", err)
	}
	tlv, err := cli.TimeToLive(ctx, clientv3.LeaseID(idU), clientv3.WithAttachedKeys())
	if err != nil {
		return "", err
	}
	keys := make([]string, 0, len(tlv.Keys))
	for _, kb := range tlv.Keys {
		keys = append(keys, string(kb))
	}
	b, err := json.Marshal(map[string]interface{}{
		"id":         leaseID,
		"ttl":        tlv.TTL,
		"grantedTTL": tlv.GrantedTTL,
		"keys":       keys,
	})
	return string(b), err
}

// EtcdLeasePurgeAll revokes every lease reported by Leases().
func (a *App) EtcdLeasePurgeAll(configJSON string) (string, error) {
	ctx, cancel := a.etcdCtx()
	defer cancel()
	cli, err := newEtcdClient(ctx, configJSON)
	if err != nil {
		return "", err
	}
	defer cli.Close()
	ls, err := cli.Leases(ctx)
	if err != nil {
		return "", err
	}
	var n int
	for _, row := range ls.Leases {
		if _, err := cli.Revoke(ctx, row.ID); err != nil {
			continue
		}
		n++
	}
	b, err := json.Marshal(map[string]interface{}{"revoked": n})
	return string(b), err
}
