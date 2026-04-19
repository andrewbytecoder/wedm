/** KV watcher definitions (legacy `localStorage.watchers` + WatcherEntry). */

export interface WatcherActionPayload {
    name: string;
    type: number;
    value: number;
}

export interface WatcherAction {
    id: string;
    action: WatcherActionPayload;
    event: WatcherActionPayload;
}

export interface WatcherEntry {
    name: string;
    key: string;
    prefix: boolean;
    activated: boolean;
    actions: WatcherAction[];
}
