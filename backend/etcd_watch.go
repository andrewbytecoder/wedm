package backend

import (
	"context"
	"encoding/json"
	"errors"
	"log"

	"github.com/wailsapp/wails/v2/pkg/runtime"
	clientv3 "go.etcd.io/etcd/client/v3"
)

// EtcdStopKVWatch stops the background watch started by EtcdStartKVWatch.
func (a *App) EtcdStopKVWatch() {
	a.watchMu.Lock()
	defer a.watchMu.Unlock()
	a.stopKVWatchLocked()
}

// EtcdStartKVWatch watches the whole keyspace and emits Wails events "etcd:kv" with JSON payloads for list refresh.
func (a *App) EtcdStartKVWatch(configJSON string) {
	a.watchMu.Lock()
	defer a.watchMu.Unlock()
	a.stopKVWatchLocked()
	ctx, cancel := context.WithCancel(context.Background())
	a.kvWatchCancel = cancel
	go a.runKVWatch(ctx, configJSON)
}

func (a *App) runKVWatch(ctx context.Context, configJSON string) {
	cli, err := newEtcdClient(ctx, configJSON)
	if err != nil {
		log.Printf("etcd KV watch: client: %v", err)
		return
	}
	defer cli.Close()

	rch := cli.Watch(ctx, "\x00", clientv3.WithFromKey())
	for {
		select {
		case <-ctx.Done():
			return
		case wresp, ok := <-rch:
			if !ok {
				return
			}
			if wresp.Err() != nil {
				if !errors.Is(wresp.Err(), context.Canceled) {
					log.Printf("etcd KV watch: %v", wresp.Err())
				}
				return
			}
			for _, ev := range wresp.Events {
				payload := map[string]interface{}{
					"type":       ev.Type.String(),
					"key":        string(ev.Kv.Key),
					"revision":   ev.Kv.ModRevision,
					"isCanceled": wresp.Canceled,
				}
				b, _ := json.Marshal(payload)
				runtime.EventsEmit(a.ctx, "etcd:kv", string(b))
			}
		}
	}
}

// EtcdStopKeyRevisionWatch stops the per-key revision stream.
func (a *App) EtcdStopKeyRevisionWatch() {
	a.watchMu.Lock()
	defer a.watchMu.Unlock()
	a.stopKeyRevWatchLocked()
}

// EtcdStartKeyRevisionWatch streams watch events for one key from revision 1 (legacy key-editor behaviour).
func (a *App) EtcdStartKeyRevisionWatch(configJSON, key string) {
	a.watchMu.Lock()
	defer a.watchMu.Unlock()
	a.stopKeyRevWatchLocked()
	if key == "" {
		return
	}
	ctx, cancel := context.WithCancel(context.Background())
	a.revWatchCancel = cancel
	go a.runKeyRevisionWatch(ctx, configJSON, key)
}

func (a *App) runKeyRevisionWatch(ctx context.Context, configJSON, key string) {
	cli, err := newEtcdClient(ctx, configJSON)
	if err != nil {
		log.Printf("etcd key revision watch: client: %v", err)
		return
	}
	defer cli.Close()

	rch := cli.Watch(ctx, key, clientv3.WithRev(1))
	for {
		select {
		case <-ctx.Done():
			return
		case wresp, ok := <-rch:
			if !ok {
				return
			}
			if wresp.Err() != nil {
				if !errors.Is(wresp.Err(), context.Canceled) {
					b, _ := json.Marshal(map[string]interface{}{
						"error": wresp.Err().Error(),
						"key":   key,
					})
					runtime.EventsEmit(a.ctx, "etcd:keyrev", string(b))
				}
				return
			}
			for _, ev := range wresp.Events {
				val := string(ev.Kv.Value)
				payload := map[string]interface{}{
					"etcdKey":        string(ev.Kv.Key),
					"value":          val,
					"version":        ev.Kv.Version,
					"createRevision": ev.Kv.CreateRevision,
					"modRevision":    ev.Kv.ModRevision,
					"type":           ev.Type.String(),
				}
				b, _ := json.Marshal(payload)
				runtime.EventsEmit(a.ctx, "etcd:keyrev", string(b))
			}
		}
	}
}
