package backend

import (
	"bytes"
	"context"
	"fmt"
	"strings"

	authpb "go.etcd.io/etcd/api/v3/authpb"
	"go.etcd.io/etcd/api/v3/v3rpc/rpctypes"
	clientv3 "go.etcd.io/etcd/client/v3"
)

// byteRange is an etcd key interval [start, end) when end is non-empty; otherwise a single key == start.
type byteRange struct {
	start []byte
	end   []byte
}

type kvPair struct {
	Key   string
	Value string
}

func permAllowsRead(p *authpb.Permission) bool {
	return p != nil && (p.PermType == authpb.READ || p.PermType == authpb.READWRITE)
}

func permAllowsWrite(p *authpb.Permission) bool {
	return p != nil && (p.PermType == authpb.WRITE || p.PermType == authpb.READWRITE)
}

// authKeyRanges returns merged permission ranges for the configured user, or unrestricted=true for root / no user / auth off.
func authKeyRanges(ctx context.Context, cli *clientv3.Client, configJSON string) (reads, writes []byteRange, unrestricted bool, err error) {
	root, e := parseRootConfig(configJSON)
	if e != nil {
		return nil, nil, false, e
	}
	_, scope, e := extractEtcdBlock(root)
	if e != nil {
		return nil, nil, false, e
	}
	user, _ := authFromScope(scope)
	if strings.TrimSpace(user) == "" {
		return nil, nil, true, nil
	}

	ug, err := cli.UserGet(ctx, user)
	if err != nil {
		if rpctypes.Error(err) == rpctypes.ErrAuthNotEnabled {
			return nil, nil, true, nil
		}
		return nil, nil, false, err
	}
	if user == "root" {
		return nil, nil, true, nil
	}
	for _, r := range ug.Roles {
		if r == "root" {
			return nil, nil, true, nil
		}
	}

	seenRole := map[string]struct{}{}
	for _, roleName := range ug.Roles {
		if _, ok := seenRole[roleName]; ok {
			continue
		}
		seenRole[roleName] = struct{}{}
		rg, err := cli.RoleGet(ctx, roleName)
		if err != nil {
			if rpctypes.Error(err) == rpctypes.ErrRoleNotFound {
				continue
			}
			return nil, nil, false, err
		}
		for _, p := range rg.Perm {
			start := append([]byte(nil), p.Key...)
			end := append([]byte(nil), p.RangeEnd...)
			br := byteRange{start: start, end: end}
			if permAllowsRead(p) {
				reads = append(reads, br)
			}
			if permAllowsWrite(p) {
				writes = append(writes, br)
			}
		}
	}
	return reads, writes, false, nil
}

func keyInRanges(k string, ranges []byteRange) bool {
	kb := []byte(k)
	for _, br := range ranges {
		if len(br.end) == 0 {
			if bytes.Equal(kb, br.start) {
				return true
			}
			continue
		}
		if bytes.Compare(kb, br.start) >= 0 && bytes.Compare(kb, br.end) < 0 {
			return true
		}
	}
	return false
}

// listKeysMerged lists keys respecting auth read ranges (legacy KeyService.loadAllKeys + mkAuthQueries for reads).
func listKeysMerged(ctx context.Context, cli *clientv3.Client, configJSON, prefix string, limit int64) ([]kvPair, error) {
	reads, _, full, err := authKeyRanges(ctx, cli, configJSON)
	if err != nil {
		return nil, err
	}
	if full {
		resp, err := cli.Get(ctx, prefix, clientv3.WithPrefix(), clientv3.WithLimit(limit))
		if err != nil {
			return nil, err
		}
		out := make([]kvPair, 0, len(resp.Kvs))
		for _, pair := range resp.Kvs {
			out = append(out, kvPair{Key: string(pair.Key), Value: string(pair.Value)})
		}
		return out, nil
	}
	if len(reads) == 0 {
		return nil, nil
	}
	seen := make(map[string]struct{}, 1024)
	out := make([]kvPair, 0, 256)
	for _, br := range reads {
		var resp *clientv3.GetResponse
		var err error
		if len(br.end) == 0 {
			resp, err = cli.Get(ctx, string(br.start))
		} else {
			resp, err = cli.Get(ctx, string(br.start), clientv3.WithRange(string(br.end)))
		}
		if err != nil {
			return nil, err
		}
		for _, pair := range resp.Kvs {
			k := string(pair.Key)
			if prefix != "" && !strings.HasPrefix(k, prefix) {
				continue
			}
			if _, ok := seen[k]; ok {
				continue
			}
			seen[k] = struct{}{}
			out = append(out, kvPair{Key: k, Value: string(pair.Value)})
			if int64(len(out)) >= limit {
				return out, nil
			}
		}
	}
	return out, nil
}

func purgeByWriteRanges(ctx context.Context, cli *clientv3.Client, writes []byteRange) (int64, error) {
	var total int64
	for _, br := range writes {
		var dr *clientv3.DeleteResponse
		var err error
		if len(br.end) == 0 {
			dr, err = cli.Delete(ctx, string(br.start))
		} else {
			dr, err = cli.Delete(ctx, string(br.start), clientv3.WithRange(string(br.end)))
		}
		if err != nil {
			return total, err
		}
		total += dr.Deleted
	}
	return total, nil
}

func assertKeysWritable(keys []string, writes []byteRange) error {
	for _, k := range keys {
		if k == "" {
			continue
		}
		if !keyInRanges(k, writes) {
			return fmt.Errorf("permission denied for key %q (outside your write ranges)", k)
		}
	}
	return nil
}
