package backend

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"strconv"
	"strings"

	authpb "go.etcd.io/etcd/api/v3/authpb"
	clientv3 "go.etcd.io/etcd/client/v3"
)

// EtcdAuthUserList returns JSON { "users": ["a","b"] }.
func (a *App) EtcdAuthUserList(configJSON string) (string, error) {
	ctx, cancel := a.etcdCtx()
	defer cancel()
	cli, err := newEtcdClient(ctx, configJSON)
	if err != nil {
		return "", err
	}
	defer cli.Close()
	resp, err := cli.UserList(ctx)
	if err != nil {
		return "", err
	}
	b, err := json.Marshal(map[string]interface{}{"users": resp.Users})
	return string(b), err
}

// EtcdAuthRoleList returns JSON { "roles": ["a","b"] }.
func (a *App) EtcdAuthRoleList(configJSON string) (string, error) {
	ctx, cancel := a.etcdCtx()
	defer cancel()
	cli, err := newEtcdClient(ctx, configJSON)
	if err != nil {
		return "", err
	}
	defer cli.Close()
	resp, err := cli.RoleList(ctx)
	if err != nil {
		return "", err
	}
	b, err := json.Marshal(map[string]interface{}{"roles": resp.Roles})
	return string(b), err
}

// EtcdAuthUserDelete removes a user by name.
func (a *App) EtcdAuthUserDelete(configJSON, name string) (string, error) {
	ctx, cancel := a.etcdCtx()
	defer cancel()
	cli, err := newEtcdClient(ctx, configJSON)
	if err != nil {
		return "", err
	}
	defer cli.Close()
	_, err = cli.UserDelete(ctx, name)
	if err != nil {
		return "", err
	}
	return `{"ok":true}`, nil
}

// EtcdAuthRoleDelete removes a role by name.
func (a *App) EtcdAuthRoleDelete(configJSON, name string) (string, error) {
	ctx, cancel := a.etcdCtx()
	defer cancel()
	cli, err := newEtcdClient(ctx, configJSON)
	if err != nil {
		return "", err
	}
	defer cli.Close()
	_, err = cli.RoleDelete(ctx, name)
	if err != nil {
		return "", err
	}
	return `{"ok":true}`, nil
}

// EtcdAuthUserAdd adds user with password (plain).
func (a *App) EtcdAuthUserAdd(configJSON, name, password string) (string, error) {
	ctx, cancel := a.etcdCtx()
	defer cancel()
	cli, err := newEtcdClient(ctx, configJSON)
	if err != nil {
		return "", err
	}
	defer cli.Close()
	if name == "" {
		return "", fmt.Errorf("user name required")
	}
	_, err = cli.UserAdd(ctx, name, password)
	if err != nil {
		return "", err
	}
	return `{"ok":true}`, nil
}

// EtcdAuthRoleAdd creates an empty role.
func (a *App) EtcdAuthRoleAdd(configJSON, name string) (string, error) {
	ctx, cancel := a.etcdCtx()
	defer cancel()
	cli, err := newEtcdClient(ctx, configJSON)
	if err != nil {
		return "", err
	}
	defer cli.Close()
	if name == "" {
		return "", fmt.Errorf("role name required")
	}
	_, err = cli.RoleAdd(ctx, name)
	if err != nil {
		return "", err
	}
	return `{"ok":true}`, nil
}

// EtcdLeaseList returns JSON { "items": [ {"id":"123","ttl":60} ] } using Leases + TimeToLive (keys omitted for speed).
func (a *App) EtcdLeaseList(configJSON string) (string, error) {
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
	type item struct {
		ID  string `json:"id"`
		TTL int64  `json:"ttl"`
	}
	out := make([]item, 0, len(ls.Leases))
	for _, lsrow := range ls.Leases {
		tlv, err := cli.TimeToLive(ctx, lsrow.ID)
		if err != nil {
			continue
		}
		out = append(out, item{ID: fmt.Sprintf("%d", lsrow.ID), TTL: tlv.TTL})
	}
	b, err := json.Marshal(map[string]interface{}{"items": out})
	return string(b), err
}

// EtcdLeaseRevoke revokes a lease by id string.
func (a *App) EtcdLeaseRevoke(configJSON, leaseID string) (string, error) {
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
	_, err = cli.Revoke(ctx, clientv3.LeaseID(idU))
	if err != nil {
		return "", err
	}
	return `{"ok":true}`, nil
}

// EtcdAuthUserGet returns JSON { "roles": ["r1", ...] }.
func (a *App) EtcdAuthUserGet(configJSON, name string) (string, error) {
	ctx, cancel := a.etcdCtx()
	defer cancel()
	cli, err := newEtcdClient(ctx, configJSON)
	if err != nil {
		return "", err
	}
	defer cli.Close()
	resp, err := cli.UserGet(ctx, name)
	if err != nil {
		return "", err
	}
	b, err := json.Marshal(map[string]interface{}{"roles": resp.Roles})
	return string(b), err
}

// EtcdAuthUserGrantRole grants a role to a user.
func (a *App) EtcdAuthUserGrantRole(configJSON, user, role string) (string, error) {
	ctx, cancel := a.etcdCtx()
	defer cancel()
	cli, err := newEtcdClient(ctx, configJSON)
	if err != nil {
		return "", err
	}
	defer cli.Close()
	_, err = cli.UserGrantRole(ctx, user, role)
	if err != nil {
		return "", err
	}
	return `{"ok":true}`, nil
}

// EtcdAuthUserRevokeRole revokes a role from a user.
func (a *App) EtcdAuthUserRevokeRole(configJSON, user, role string) (string, error) {
	ctx, cancel := a.etcdCtx()
	defer cancel()
	cli, err := newEtcdClient(ctx, configJSON)
	if err != nil {
		return "", err
	}
	defer cli.Close()
	_, err = cli.UserRevokeRole(ctx, user, role)
	if err != nil {
		return "", err
	}
	return `{"ok":true}`, nil
}

// EtcdAuthUserChangePassword changes a user's password (plain text over local IPC only).
func (a *App) EtcdAuthUserChangePassword(configJSON, user, password string) (string, error) {
	ctx, cancel := a.etcdCtx()
	defer cancel()
	cli, err := newEtcdClient(ctx, configJSON)
	if err != nil {
		return "", err
	}
	defer cli.Close()
	_, err = cli.UserChangePassword(ctx, user, password)
	if err != nil {
		return "", err
	}
	return `{"ok":true}`, nil
}

func parseAuthPermType(s string) (clientv3.PermissionType, error) {
	switch strings.ToLower(strings.ReplaceAll(s, " ", "")) {
	case "read", "r":
		return clientv3.PermissionType(authpb.READ), nil
	case "write", "w":
		return clientv3.PermissionType(authpb.WRITE), nil
	case "readwrite", "rw", "read&write":
		return clientv3.PermissionType(authpb.READWRITE), nil
	}
	return clientv3.PermissionType(-1), fmt.Errorf("invalid permission type %q", s)
}

func authGrantKeyRange(mode, key string) (k, rangeEnd string, err error) {
	switch strings.ToLower(strings.TrimSpace(mode)) {
	case "all":
		return "", clientv3.GetPrefixRangeEnd(""), nil
	case "prefix":
		if key == "" {
			return "", "", fmt.Errorf("prefix key required")
		}
		return key, clientv3.GetPrefixRangeEnd(key), nil
	case "normal", "":
		return key, "", nil
	default:
		return "", "", fmt.Errorf("invalid mode %q", mode)
	}
}

func authPermRangesEqual(a *authpb.Permission, keyStr, rangeEndStr string) bool {
	return bytes.Equal(a.Key, []byte(keyStr)) && bytes.Equal(a.RangeEnd, []byte(rangeEndStr))
}

func authHasPermissionRange(perms []*authpb.Permission, keyStr, rangeEndStr string) bool {
	for _, p := range perms {
		if authPermRangesEqual(p, keyStr, rangeEndStr) {
			return true
		}
	}
	return false
}

func authClassifyPermission(p *authpb.Permission) (mode, keyDisplay string) {
	k := string(p.Key)
	re := string(p.RangeEnd)
	if k == "" && re == string([]byte{0}) {
		return "all", "*"
	}
	if re == "" {
		return "normal", k
	}
	if re == clientv3.GetPrefixRangeEnd(k) {
		return "prefix", k
	}
	return "range", k
}

func authPermTypeString(pt authpb.Permission_Type) string {
	switch pt {
	case authpb.READ:
		return "Read"
	case authpb.WRITE:
		return "Write"
	case authpb.READWRITE:
		return "Readwrite"
	default:
		return pt.String()
	}
}

// EtcdAuthRoleGet returns JSON { "perms": [ { "keyB64", "rangeEndB64", "perm", "mode", "keyDisplay", "isPrefix" } ] }.
func (a *App) EtcdAuthRoleGet(configJSON, role string) (string, error) {
	ctx, cancel := a.etcdCtx()
	defer cancel()
	cli, err := newEtcdClient(ctx, configJSON)
	if err != nil {
		return "", err
	}
	defer cli.Close()
	resp, err := cli.RoleGet(ctx, role)
	if err != nil {
		return "", err
	}
	type permDTO struct {
		KeyB64      string `json:"keyB64"`
		RangeEndB64 string `json:"rangeEndB64"`
		Perm        string `json:"perm"`
		Mode        string `json:"mode"`
		KeyDisplay  string `json:"keyDisplay"`
		IsPrefix    bool   `json:"isPrefix"`
	}
	out := make([]permDTO, 0, len(resp.Perm))
	for _, p := range resp.Perm {
		mode, disp := authClassifyPermission(p)
		out = append(out, permDTO{
			KeyB64:      base64.StdEncoding.EncodeToString(p.Key),
			RangeEndB64: base64.StdEncoding.EncodeToString(p.RangeEnd),
			Perm:        authPermTypeString(p.PermType),
			Mode:        mode,
			KeyDisplay:  disp,
			IsPrefix:    mode == "prefix" || mode == "all",
		})
	}
	b, err := json.Marshal(map[string]interface{}{"perms": out})
	return string(b), err
}

type etcdRolePermGrantBody struct {
	Role           string `json:"role"`
	Mode           string `json:"mode"`
	Key            string `json:"key"`
	Perm           string `json:"perm"`
	CheckDuplicate *bool  `json:"checkDuplicate"`
}

// EtcdAuthRoleGrantPermission grants a permission from JSON body (mode: normal|prefix|all, perm: Read|Write|Readwrite).
func (a *App) EtcdAuthRoleGrantPermission(configJSON, body string) (string, error) {
	var req etcdRolePermGrantBody
	if err := json.Unmarshal([]byte(body), &req); err != nil {
		return "", err
	}
	checkDup := true
	if req.CheckDuplicate != nil {
		checkDup = *req.CheckDuplicate
	}
	ctx, cancel := a.etcdCtx()
	defer cancel()
	cli, err := newEtcdClient(ctx, configJSON)
	if err != nil {
		return "", err
	}
	defer cli.Close()
	k, re, err := authGrantKeyRange(req.Mode, req.Key)
	if err != nil {
		return "", err
	}
	permType, err := parseAuthPermType(req.Perm)
	if err != nil {
		return "", err
	}
	if checkDup {
		rg, err := cli.RoleGet(ctx, req.Role)
		if err != nil {
			return "", err
		}
		if authHasPermissionRange(rg.Perm, k, re) {
			return "", fmt.Errorf("duplicate permission range")
		}
	}
	_, err = cli.RoleGrantPermission(ctx, req.Role, k, re, permType)
	if err != nil {
		return "", err
	}
	return `{"ok":true}`, nil
}

type etcdRolePermRevokeBody struct {
	Role        string `json:"role"`
	KeyB64      string `json:"keyB64"`
	RangeEndB64 string `json:"rangeEndB64"`
}

// EtcdAuthRoleRevokePermission revokes an exact permission range (use keyB64/rangeEndB64 from EtcdAuthRoleGet).
func (a *App) EtcdAuthRoleRevokePermission(configJSON, body string) (string, error) {
	var req etcdRolePermRevokeBody
	if err := json.Unmarshal([]byte(body), &req); err != nil {
		return "", err
	}
	kb, err := base64.StdEncoding.DecodeString(req.KeyB64)
	if err != nil {
		return "", fmt.Errorf("keyB64: %w", err)
	}
	reb, err := base64.StdEncoding.DecodeString(req.RangeEndB64)
	if err != nil {
		return "", fmt.Errorf("rangeEndB64: %w", err)
	}
	ctx, cancel := a.etcdCtx()
	defer cancel()
	cli, err := newEtcdClient(ctx, configJSON)
	if err != nil {
		return "", err
	}
	defer cli.Close()
	_, err = cli.RoleRevokePermission(ctx, req.Role, string(kb), string(reb))
	if err != nil {
		return "", err
	}
	return `{"ok":true}`, nil
}
