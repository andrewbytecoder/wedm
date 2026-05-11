<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import AppMenu from '@/components/AppMenu.vue';
import WhatsNewDialog from '@/components/dialogs/WhatsNewDialog.vue';
import { listWatchers } from '@/services/watcherStorage';
import { rehydrateActivatedWatchers } from '@/services/watcherRuntime';
import { useAppStore } from '@/stores/app';
import { useSettingsStore } from '@/stores/settings';
import { EventsOn } from '../wailsjs/runtime';

const { t } = useI18n();
const store = useAppStore();
const settings = useSettingsStore();
const showWhatsNew = ref(false);

function bridgeTypeToEventName(tpe: string): string {
    const u = tpe.toUpperCase();
    if (u === 'PUT') {
        return 'put';
    }
    if (u === 'DELETE') {
        return 'delete';
    }
    if (u === 'ERROR') {
        return 'error';
    }
    if (u === 'DISCONNECTED') {
        return 'disconnected';
    }
    if (u === 'CONNECTED') {
        return 'connected';
    }
    return tpe.toLowerCase();
}

function formatWatcherMessage(eventName: string, key: string, value: string): string {
    const date = new Date().toISOString();
    if (eventName === 'put') {
        return `${date}: The key "${key}" has been changed. New value: "${value}"`;
    }
    if (eventName === 'delete') {
        return `${date}: The key "${key}" has been deleted.`;
    }
    if (eventName === 'error') {
        return `${date}: Error: ${value}`;
    }
    if (eventName === 'disconnected') {
        return `${date}: The watcher has been disconnected. Error: ${value}`;
    }
    if (eventName === 'connected') {
        return `${date}: The watcher "${key}" has been successfully reconnected!`;
    }
    return `${date}: ${eventName} on "${key}"`;
}

function dispatchUserActionOutputs(msg: string, out: number) {
    if (out === 0) {
        console.log(msg);
    } else if (out === 1) {
        store.showMessage(msg, 'info');
    } else if (out === 2) {
        try {
            if (typeof Notification !== 'undefined') {
                if (Notification.permission === 'granted') {
                    new Notification('ETCD Manager', { body: msg });
                } else if (Notification.permission === 'default') {
                    void Notification.requestPermission().then((p) => {
                        if (p === 'granted') {
                            new Notification('ETCD Manager', { body: msg });
                        }
                    });
                }
            }
        } catch {
            /* ignore */
        }
    }
}

function onWatcherBridgeEvent(raw: string) {
    let o: Record<string, unknown>;
    try {
        o = JSON.parse(raw) as Record<string, unknown>;
    } catch {
        return;
    }
    if (o.error && !o.type) {
        console.error('[watcher]', o.error);
        return;
    }
    const name = String(o.name ?? '');
    const eventName = bridgeTypeToEventName(String(o.type ?? ''));
    const key = String(o.key ?? '');
    const value = String(o.value ?? '');
    const msg = formatWatcherMessage(eventName, key, value);

    /* Legacy `registerWatcherEvents`: error / disconnected / connected always use console (output 0). */
    if (eventName === 'error' || eventName === 'disconnected' || eventName === 'connected') {
        console.log(msg);
        return;
    }

    const w = listWatchers().find((x) => x.name === name);
    if (!w) {
        return;
    }
    for (const act of w.actions) {
        if (act.event.name !== eventName) {
            continue;
        }
        dispatchUserActionOutputs(msg, act.action.value);
    }
}

let offWatcherEvent: (() => void) | undefined;

onMounted(async () => {
    await store.loadDesktopMetadata();
    settings.hydrateFromLocalStorage();
    void settings.refreshMenuCapabilitiesFromEtcd();
    const v = store.version || 'dev';
    if (!localStorage.getItem(`news${v}`)) {
        showWhatsNew.value = true;
    }
    offWatcherEvent = EventsOn('watcher:event', onWatcherBridgeEvent);
    if (settings.isConfigured) {
        void rehydrateActivatedWatchers(settings.watchers.autoload, {
            error: settings.watchers.error,
            disconnects: settings.watchers.disconnects,
            reconnects: settings.watchers.reconnects,
        });
    }
});

onUnmounted(() => {
    offWatcherEvent?.();
});
</script>

<template>
    <v-app>
        <v-app-bar density="comfortable" flat>
            <v-app-bar-nav-icon
                :aria-label="t('shell.toggleMenu')"
                @click="store.drawer = !store.drawer"
            />
            <v-toolbar-title>etcd manager</v-toolbar-title>
            <v-spacer />
            <span v-if="settings.currentProfileLabel" class="text-caption me-4">
                {{ t('shell.profile') }}: {{ settings.currentProfileLabel }}
            </span>
            <span v-if="store.version" class="text-caption text-medium-emphasis">
                v{{ store.version }}
            </span>
        </v-app-bar>

        <AppMenu />

        <v-main>
            <router-view />
        </v-main>

        <v-snackbar
            :model-value="store.message.show"
            :color="store.message.color"
            :timeout="store.message.timeout"
            location="bottom"
            @update:model-value="(v: boolean) => { if (!v) store.hideMessage(); }"
        >
            {{ store.message.text }}
        </v-snackbar>

        <WhatsNewDialog v-model="showWhatsNew" :version="store.version || 'dev'" />
    </v-app>
</template>
