import { defineStore } from 'pinia';
import type { CurrentProfileType } from '@/types';
import { etcdMenuCapabilities } from '@/services/etcdBridge';

export interface EtcdSSLState {
    enabled: boolean;
    certificate: string;
    certKey: string;
    certChain: string;
}

export interface CredentialsState {
    rootCertificate?: string;
    privateKey?: string;
    certChain?: string;
}

function utf8ToBase64(s: string): string {
    return btoa(unescape(encodeURIComponent(s)));
}

function pickSection(doc: Record<string, unknown>): Record<string, unknown> | null {
    const rootEtcd = doc.etcd as Record<string, unknown> | undefined;
    if (rootEtcd && String(rootEtcd.hosts || '').trim()) {
        return doc;
    }
    const profiles = doc.profiles as Record<string, unknown>[] | undefined;
    if (!profiles?.length) {
        return null;
    }
    const want =
        (doc.config as Record<string, unknown> | undefined)?.name ||
        (profiles[0].config as Record<string, unknown> | undefined)?.name ||
        'default';
    return (
        profiles.find(
            (p) => String((p.config as Record<string, unknown> | undefined)?.name) === String(want),
        ) ||
        profiles[0] ||
        null
    );
}

export const useSettingsStore = defineStore('settings', {
    state: () => ({
        separator: '.',
        /** Legacy `store.state.isLimited`: true when user is root-capable (cluster/users/roles/leases menus). */
        isLimited: false,
        profile: {
            name: '',
            host: '',
            port: 2379,
        } as CurrentProfileType,
        profileNames: [] as string[],
        activeProfileName: 'default',
        config: {
            language: 'en' as string,
            animateBg: false,
            background: true,
            name: 'default',
        },
        users: {
            pattern: null as string | null,
        },
        etcd: {
            hosts: '',
            dialTimeout: 30000,
            retry: false,
            port: 2379,
            version: 0,
            ssl: {
                enabled: false,
                certificate: '',
                certKey: '',
                certChain: '',
            } as EtcdSSLState,
        },
        etcdAuth: {
            username: '',
            password: '',
        },
        watchers: {
            autoload: false,
            error: true,
            disconnects: true,
            reconnects: true,
        },
        credentials: null as CredentialsState | null,
    }),
    getters: {
        currentProfileLabel(state): string {
            const u = state.etcdAuth.username;
            const at = u ? '@' : '';
            if (state.profile.name) {
                //  $用来去变量 为字符串
                return `${state.profile.name} - ${u || ''}${at}${state.profile.host}:${state.profile.port}`;
            }
            return '';
        },
        isConfigured(state): boolean {
            return Boolean(
                String(state.etcd.hosts || '').trim() &&
                    state.etcd.port &&
                    state.etcd.dialTimeout,
            );
        },
    },
    actions: {
        applySection(section: Record<string, unknown>) {
            const cfg = (section.config || {}) as Record<string, unknown>;
            const etcd = (section.etcd || {}) as Record<string, unknown>;
            const ssl = (etcd.ssl || {}) as Record<string, unknown>;
            const auth = (section.etcdAuth || {}) as Record<string, unknown>;
            const w = (section.watchers || {}) as Record<string, unknown>;
            const u = (section.users || {}) as Record<string, unknown>;
            this.config = {
                language: String(cfg.language ?? 'en'),
                animateBg: Boolean(cfg.animateBg),
                background: cfg.background !== false,
                name: String(cfg.name ?? 'default'),
            };
            this.activeProfileName = this.config.name;
            this.etcd = {
                hosts: String(etcd.hosts ?? ''),
                dialTimeout: Number(etcd.dialTimeout ?? 30000),
                retry: Boolean(etcd.retry),
                port: Number(etcd.port ?? 2379),
                version: Number(etcd.version ?? 0),
                ssl: {
                    enabled: Boolean(ssl.enabled),
                    certificate: String(ssl.certificate ?? ''),
                    certKey: String(ssl.certKey ?? ''),
                    certChain: String(ssl.certChain ?? ''),
                },
            };
            this.etcdAuth = {
                username: String(auth.username ?? ''),
                password: String(auth.password ?? ''),
            };
            this.watchers = {
                autoload: Boolean(w.autoload),
                error: w.error !== false,
                disconnects: w.disconnects !== false,
                reconnects: w.reconnects !== false,
            };
            this.users = { pattern: (u.pattern as string | null) ?? null };
            this.credentials = (section.credentials as CredentialsState) || null;
            this.profile = {
                name: this.config.name,
                host: this.etcd.hosts,
                port: this.etcd.port,
            };
        },
        async refreshMenuCapabilitiesFromEtcd() {
            if (!this.isConfigured) {
                this.isLimited = false;
                return;
            }
            try {
                const o = await etcdMenuCapabilities();
                this.isLimited = Boolean(o.isRoot);
                if (typeof o.serverVersion === 'number' && o.serverVersion > 0) {
                    this.etcd.version = o.serverVersion;
                }
            } catch {
                this.isLimited = false;
            }
        },
        hydrateFromLocalStorage() {
            const raw = localStorage.getItem('config');
            if (!raw) {
                this.profileNames = [];
                return;
            }
            let doc: Record<string, unknown>;
            try {
                doc = JSON.parse(raw) as Record<string, unknown>;
            } catch {
                return;
            }
            const profs = doc.profiles as Record<string, unknown>[] | undefined;
            this.profileNames = Array.isArray(profs)
                ? profs.map((p) => String((p.config as Record<string, unknown>)?.name ?? '')).filter(Boolean)
                : [];
            const section = pickSection(doc);
            if (!section) {
                return;
            }
            this.applySection(section);
            if (typeof doc.separator === 'string') {
                this.separator = doc.separator;
            }
        },
        loadProfileByName(name: string) {
            // 加载配置文件
            const raw = localStorage.getItem('config');
            if (!raw) {
                return;
            }
            let doc: Record<string, unknown>;
            try {
                doc = JSON.parse(raw) as Record<string, unknown>;
            } catch {
                return;
            }

            //  profiles 字段可能存在也可能不存在，如果不存在就 定义为 undefined
            const profiles = doc.profiles as Record<string, unknown>[] | undefined;
            if (!Array.isArray(profiles)) {
                return;
            }
            const section = profiles.find(
                (p) => String((p.config as Record<string, unknown> | undefined)?.name) === name,
            );
            if (!section) {
                return;
            }
            this.applySection(section);
        },
        buildProfileBlob(): Record<string, unknown> {
            return {
                etcd: { ...this.etcd },
                config: { ...this.config },
                etcdAuth: { ...this.etcdAuth },
                users: { ...this.users },
                watchers: { ...this.watchers },
                ...(this.credentials ? { credentials: { ...this.credentials } } : {}),
            };
        },
        persistSeparator(separator: string) {
            this.separator = separator;
            const raw = localStorage.getItem('config');
            let doc: Record<string, unknown> = {};
            if (raw) {
                try {
                    doc = JSON.parse(raw) as Record<string, unknown>;
                } catch {
                    doc = {};
                }
            }
            doc.separator = separator;
            localStorage.setItem('config', JSON.stringify(doc));
        },
        persistToLocalStorage() {
            //  使用浏览器本次存储
            const raw = localStorage.getItem('config');
            let doc: Record<string, unknown> = {};
            if (raw) {
                try {
                    doc = JSON.parse(raw) as Record<string, unknown>;
                } catch {
                    doc = {};
                }
            }
            if (!Array.isArray(doc.profiles)) {
                doc.profiles = [];
            }
            const blob = this.buildProfileBlob();
            const profiles = doc.profiles as Record<string, unknown>[];
            const idx = profiles.findIndex(
                (p) => String((p.config as Record<string, unknown>)?.name) === this.config.name,
            );
            if (idx === -1) {
                profiles.push(blob);
            } else {
                profiles[idx] = blob;
            }
            const out = {
                ...doc,
                profiles: [...profiles],
                ...blob,
            };
            localStorage.setItem('config', JSON.stringify(out));
            this.hydrateFromLocalStorage();
        },
        setSslFileField(
            field: 'certificate' | 'certKey' | 'certChain',
            fileLabel: string,
            pemText: string,
        ) {
            if (!this.credentials) {
                this.credentials = {};
            }
            const b64 = utf8ToBase64(pemText);
            if (field === 'certificate') {
                this.credentials.rootCertificate = b64;
                this.etcd.ssl.certificate = fileLabel;
            } else if (field === 'certKey') {
                this.credentials.privateKey = b64;
                this.etcd.ssl.certKey = fileLabel;
            } else {
                this.credentials.certChain = b64;
                this.etcd.ssl.certChain = fileLabel;
            }
        },
        clearSslField(field: 'certificate' | 'certKey' | 'certChain') {
            if (field === 'certificate') {
                this.etcd.ssl.certificate = '';
                if (this.credentials) {
                    delete this.credentials.rootCertificate;
                }
            } else if (field === 'certKey') {
                this.etcd.ssl.certKey = '';
                if (this.credentials) {
                    delete this.credentials.privateKey;
                }
            } else {
                this.etcd.ssl.certChain = '';
                if (this.credentials) {
                    delete this.credentials.certChain;
                }
            }
        },
        applyImportedDocument(doc: Record<string, unknown>) {
            localStorage.setItem('config', JSON.stringify(doc));
            this.hydrateFromLocalStorage();
        },
        /** Duplicate current profile state into a new named profile (legacy Save As). */
        saveProfileAs(newName: string): 'ok' | 'empty' | 'duplicate' {
            const trimmed = newName.trim();
            if (!trimmed) {
                return 'empty';
            }
            const raw = localStorage.getItem('config');
            let doc: Record<string, unknown> = {};
            if (raw) {
                try {
                    doc = JSON.parse(raw) as Record<string, unknown>;
                } catch {
                    doc = {};
                }
            }
            if (!Array.isArray(doc.profiles)) {
                doc.profiles = [];
            }
            const profiles = doc.profiles as Record<string, unknown>[];
            const dup = profiles.some(
                (p) => String((p.config as Record<string, unknown> | undefined)?.name) === trimmed,
            );
            if (dup) {
                return 'duplicate';
            }
            const blob = this.buildProfileBlob();
            const cfg = { ...(blob.config as Record<string, unknown>), name: trimmed };
            const nextBlob = { ...blob, config: cfg };
            profiles.push(nextBlob);
            const out = {
                ...doc,
                profiles: [...profiles],
                ...nextBlob,
            };
            localStorage.setItem('config', JSON.stringify(out));
            this.activeProfileName = trimmed;
            this.hydrateFromLocalStorage();
            return 'ok';
        },
    },
});
