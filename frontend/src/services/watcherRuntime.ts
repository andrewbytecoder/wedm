import { etcdStartUserWatch, etcdStopAllUserWatches, etcdStopUserWatch, type UserWatchSpec } from '@/services/etcdBridge';
import { listWatchers } from '@/services/watcherStorage';

/** Mirrors legacy `store.state.watchers` flags passed into `WatcherService.registerWatcherEvents`. */
export type WatcherListenerFlags = {
    error: boolean;
    disconnects: boolean;
    reconnects: boolean;
};

export async function startUserWatchBackend(
    w: { name: string; key: string; prefix: boolean },
    listeners: WatcherListenerFlags,
): Promise<void> {
    const spec: UserWatchSpec = {
        name: w.name,
        key: w.key,
        prefix: w.prefix,
        error: listeners.error,
        disconnects: listeners.disconnects,
        reconnects: listeners.reconnects,
    };
    await etcdStartUserWatch(spec);
}

export async function stopUserWatchBackend(name: string): Promise<void> {
    await etcdStopUserWatch(name);
}

export async function stopAllUserWatchBackends(): Promise<void> {
    await etcdStopAllUserWatches();
}

/** Start Go-side watches for every entry that is marked activated (used with settings autoload). */
export async function rehydrateActivatedWatchers(
    autoload: boolean,
    listeners: WatcherListenerFlags,
): Promise<void> {
    if (!autoload) {
        return;
    }
    const all = listWatchers();
    for (const w of all) {
        if (w.activated && w.name && w.key) {
            try {
                await startUserWatchBackend(w, listeners);
            } catch {
                /* ignore per-watcher */
            }
        }
    }
}
