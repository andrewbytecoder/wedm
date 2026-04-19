import type { WatcherEntry } from '@/types/watcher';

const LS_KEY = 'watchers';

export function listWatchers(): WatcherEntry[] {
    try {
        const raw = localStorage.getItem(LS_KEY);
        if (!raw) {
            return [];
        }
        const arr = JSON.parse(raw) as unknown;
        if (!Array.isArray(arr)) {
            return [];
        }
        return arr as WatcherEntry[];
    } catch {
        return [];
    }
}

export function saveWatchersAll(entries: WatcherEntry[]): void {
    localStorage.setItem(LS_KEY, JSON.stringify(entries));
}

export function saveWatcher(entry: WatcherEntry, isCreate: boolean): boolean {
    const all = listWatchers();
    const idx = all.findIndex((w) => w.name === entry.name);
    if (isCreate && idx !== -1) {
        return false;
    }
    if (idx === -1) {
        all.push(entry);
    } else {
        all[idx] = entry;
    }
    saveWatchersAll(all);
    return true;
}

export function removeWatchersByName(names: string[]): void {
    const set = new Set(names);
    saveWatchersAll(listWatchers().filter((w) => !set.has(w.name)));
}

export function purgeWatchers(): void {
    localStorage.removeItem(LS_KEY);
}

export function loadWatcher(name: string): WatcherEntry | undefined {
    return listWatchers().find((w) => w.name === name);
}
