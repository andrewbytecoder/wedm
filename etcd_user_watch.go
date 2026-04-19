package main

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"
	clientv3 "go.etcd.io/etcd/client/v3"
)

type userWatchSpec struct {
	Name        string `json:"name"`
	Key         string `json:"key"`
	Prefix      bool   `json:"prefix"`
	Error       bool   `json:"error"`
	Disconnects bool   `json:"disconnects"`
	Reconnects  bool   `json:"reconnects"`
}

func (a *App) emitWatcherEvent(payload map[string]interface{}) {
	b, _ := json.Marshal(payload)
	runtime.EventsEmit(a.ctx, "watcher:event", string(b))
}

// EtcdStartUserWatch starts a background etcd watch. specJSON:
// {"name","key","prefix","error","disconnects","reconnects"} — flags mirror legacy store watch listener toggles.
func (a *App) EtcdStartUserWatch(configJSON, specJSON string) {
	var spec userWatchSpec
	if err := json.Unmarshal([]byte(specJSON), &spec); err != nil {
		log.Printf("user watch spec: %v", err)
		return
	}
	if spec.Name == "" || spec.Key == "" {
		return
	}
	ctx, cancel := context.WithCancel(context.Background())
	a.userWatchMu.Lock()
	if a.userWatchCancels == nil {
		a.userWatchCancels = make(map[string]context.CancelFunc)
	}
	if prev, ok := a.userWatchCancels[spec.Name]; ok {
		prev()
	}
	a.userWatchCancels[spec.Name] = cancel
	a.userWatchMu.Unlock()
	go a.runUserWatch(ctx, configJSON, spec)
}

// EtcdStopUserWatch stops a named user watch if running.
func (a *App) EtcdStopUserWatch(name string) {
	a.userWatchMu.Lock()
	defer a.userWatchMu.Unlock()
	if a.userWatchCancels == nil {
		return
	}
	if c, ok := a.userWatchCancels[name]; ok {
		c()
		delete(a.userWatchCancels, name)
	}
}

// EtcdStopAllUserWatches stops every named user watch.
func (a *App) EtcdStopAllUserWatches() {
	a.userWatchMu.Lock()
	defer a.userWatchMu.Unlock()
	if a.userWatchCancels == nil {
		return
	}
	for _, c := range a.userWatchCancels {
		c()
	}
	a.userWatchCancels = make(map[string]context.CancelFunc)
}

func (a *App) runUserWatch(ctx context.Context, configJSON string, spec userWatchSpec) {
	backoff := 200 * time.Millisecond
	everHadDisconnect := false

	for {
		if ctx.Err() != nil {
			return
		}

		cli, err := newEtcdClient(ctx, configJSON)
		if err != nil {
			log.Printf("user watch %q: client: %v", spec.Name, err)
			if spec.Error {
				a.emitWatcherEvent(map[string]interface{}{
					"name": spec.Name, "type": "ERROR", "key": "", "value": err.Error(),
				})
			}
			if spec.Disconnects {
				a.emitWatcherEvent(map[string]interface{}{
					"name": spec.Name, "type": "DISCONNECTED", "key": "", "value": err.Error(),
				})
			}
			everHadDisconnect = true
			select {
			case <-ctx.Done():
				return
			case <-time.After(backoff):
			}
			if backoff < 30*time.Second {
				backoff *= 2
			}
			continue
		}

		opts := []clientv3.OpOption{clientv3.WithPrevKV()}
		if spec.Prefix {
			opts = append([]clientv3.OpOption{clientv3.WithPrefix()}, opts...)
		}
		rch := cli.Watch(ctx, spec.Key, opts...)
		backoff = 200 * time.Millisecond

	recvLoop:
		for {
			select {
			case <-ctx.Done():
				_ = cli.Close()
				return
			case wresp, ok := <-rch:
				if !ok {
					if spec.Disconnects {
						a.emitWatcherEvent(map[string]interface{}{
							"name": spec.Name, "type": "DISCONNECTED", "key": "", "value": "watch channel closed",
						})
					}
					everHadDisconnect = true
					break recvLoop
				}
				if wresp.Err() != nil {
					if errors.Is(wresp.Err(), context.Canceled) {
						_ = cli.Close()
						return
					}
					if spec.Error {
						a.emitWatcherEvent(map[string]interface{}{
							"name": spec.Name, "type": "ERROR", "key": "", "value": wresp.Err().Error(),
						})
					}
					if spec.Disconnects {
						a.emitWatcherEvent(map[string]interface{}{
							"name": spec.Name, "type": "DISCONNECTED", "key": "", "value": wresp.Err().Error(),
						})
					}
					everHadDisconnect = true
					break recvLoop
				}

				if spec.Reconnects && everHadDisconnect {
					a.emitWatcherEvent(map[string]interface{}{
						"name": spec.Name, "type": "CONNECTED", "key": spec.Name, "value": "",
					})
					everHadDisconnect = false
				}

				for _, ev := range wresp.Events {
					k := ""
					val := ""
					if ev.Kv != nil {
						k = string(ev.Kv.Key)
						val = string(ev.Kv.Value)
					} else if ev.PrevKv != nil {
						k = string(ev.PrevKv.Key)
						val = string(ev.PrevKv.Value)
					}
					a.emitWatcherEvent(map[string]interface{}{
						"name": spec.Name, "type": ev.Type.String(), "key": k, "value": val,
					})
				}
			}
		}

		_ = cli.Close()

		select {
		case <-ctx.Done():
			return
		case <-time.After(backoff):
		}
		if backoff < 30*time.Second {
			backoff *= 2
		}
	}
}
