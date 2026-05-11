import type { NavigationGuardReturn, RouteLocationNormalized } from 'vue-router';
import { useAppStore } from '@/stores/app';
import { messages } from '@/i18n/messages';

type EtcdSlice = { hosts?: string; port?: string | number };

function parseConfigRaw(raw: string | null): Record<string, unknown> | null {
    if (raw == null || raw === '') {
        return null;
    }
    try {
        return JSON.parse(raw) as Record<string, unknown>;
    } catch {
        return null;
    }
}

/** Same key the legacy Electron app used (`vue-localstorage` + `LocalStorageService`). */
function readStoredConfigRoot(): Record<string, unknown> | null {
    const raw = localStorage.getItem('config');
    return parseConfigRaw(raw);
}

function isNonEmptyHosts(hosts: unknown): hosts is string {
    return typeof hosts === 'string' && hosts.trim() !== '';
}

function isPortProvided(port: unknown): boolean {
    if (port === undefined || port === null) {
        return false;
    }
    if (typeof port === 'number') {
        return !Number.isNaN(port) && port > 0;
    }
    if (typeof port === 'string') {
        const n = Number(port.trim());
        return port.trim() !== '' && !Number.isNaN(n) && n > 0;
    }
    return false;
}

/**
 * Legacy `config.vue` persists `{ profiles: [...], ...newConfig }`, so `etcd` often lives on
 * the root after save, but older / imported files may only have `profiles[].etcd`.
 */
function extractEtcd(cfg: Record<string, unknown> | null): EtcdSlice | null {
    if (!cfg) {
        return null;
    }
    const root = cfg.etcd as EtcdSlice | undefined;
    if (root && isNonEmptyHosts(root.hosts) && isPortProvided(root.port)) {
        return root;
    }
    const profiles = cfg.profiles as Array<Record<string, unknown>> | undefined;
    if (!Array.isArray(profiles)) {
        return null;
    }
    for (const p of profiles) {
        const e = p?.etcd as EtcdSlice | undefined;
        if (e && isNonEmptyHosts(e.hosts) && isPortProvided(e.port)) {
            return e;
        }
    }
    return null;
}

export function isConfiguredGuard(
    from?: RouteLocationNormalized,
): NavigationGuardReturn {
    const store = useAppStore();
    const root = readStoredConfigRoot();
    const etcd = extractEtcd(root);
    if (!etcd) {
        const alreadyOnSettings = from?.path === '/configure';
        if (!alreadyOnSettings) {
            const lang = (root?.config as { language?: string } | undefined)?.language;
            const text =
                lang === 'zh'
                    ? messages.zh.guard.incompleteConfig
                    : messages.en.guard.incompleteConfig;
            store.showMessage(text, 'warning');
        }
        return { path: '/configure' };
    }
    return true;
}
