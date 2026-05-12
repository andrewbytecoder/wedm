package backend

import (
	"encoding/json"
	"fmt"
	"strconv"
)

// EtcdMaintenanceStatus returns JSON matching legacy IStatusResponse fields used in cluster dialog.
func (a *App) EtcdMaintenanceStatus(configJSON string) (string, error) {
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
		"dbSize":    st.DbSize,
		"leader":    fmt.Sprintf("%x", st.Leader),
		"raftIndex": st.RaftIndex,
		"raftTerm":  st.RaftTerm,
		"version":   st.Version,
	}
	b, err := json.Marshal(out)
	return string(b), err
}

// EtcdMaintenanceAlarmsForMember returns JSON { "alarms": [...] } for alarms affecting memberID (decimal string).
func (a *App) EtcdMaintenanceAlarmsForMember(configJSON, memberIDStr string) (string, error) {
	ctx, cancel := a.etcdCtx()
	defer cancel()
	cli, err := newEtcdClient(ctx, configJSON)
	if err != nil {
		return "", err
	}
	defer cli.Close()
	wantID, err := strconv.ParseUint(memberIDStr, 10, 64)
	if err != nil {
		return "", fmt.Errorf("member id: %w", err)
	}
	ar, err := cli.AlarmList(ctx)
	if err != nil {
		return "", err
	}
	var alarms []map[string]interface{}
	for _, m := range ar.Alarms {
		if m == nil {
			continue
		}
		if m.MemberID == wantID {
			alarms = append(alarms, map[string]interface{}{
				"memberID": fmt.Sprintf("%d", m.MemberID),
				"alarm":    m.Alarm.String(),
			})
		}
	}
	b, _ := json.Marshal(map[string]interface{}{"alarms": alarms})
	return string(b), nil
}
