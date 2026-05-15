<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useHotkey } from 'vuetify';
import { i18n } from '@/i18n';
import { useSettingsStore } from '@/stores/settings';
import { useAppStore } from '@/stores/app';
import ConfigHelpPanel from '@/components/config/ConfigHelpPanel.vue';
import ConfigProfileBar from '@/components/config/ConfigProfileBar.vue';
import ConfigConnectionForm from '@/components/config/ConfigConnectionForm.vue';
import ConfigWatchersCard from '@/components/config/ConfigWatchersCard.vue';
import ConfigMiscCard from '@/components/config/ConfigMiscCard.vue';
import { rehydrateActivatedWatchers, stopAllUserWatchBackends } from '@/services/watcherRuntime';
import { applyFontSettings } from '@/i18n/font'

const { t } = useI18n();
const settings = useSettingsStore();
const app = useAppStore();

const tab = ref(0);
const helpOpen = ref(false);

const totalTabs = 4;

function persist() {
    settings.persistToLocalStorage();

    const lang = settings.config.language === 'zh' ? 'zh' : 'en';
    i18n.global.locale.value = lang;
    document.querySelector('html')?.setAttribute('lang', lang);

    applyFontSettings(settings.config.fontFamily, settings.config.fontSize);

    app.showMessage(t('settings.messages.success'), 'success');

    const hasHost = String(settings.etcd.hosts || '').trim();
    const hasPort = settings.etcd.port;
    if (hasHost && hasPort) {
        void settings.refreshMenuCapabilitiesFromEtcd();
        void (async () => {
            await stopAllUserWatchBackends();
            await rehydrateActivatedWatchers(settings.watchers.autoload, {
                error: settings.watchers.error,
                disconnects: settings.watchers.disconnects,
                reconnects: settings.watchers.reconnects,
            });
        })();
    }
}

useHotkey('ctrl+s', (e) => {
    e.preventDefault();
    persist();
});

useHotkey('ctrl+h', (e) => {
    e.preventDefault();
    helpOpen.value = !helpOpen.value;
});

useHotkey('ctrl+arrowleft', (e) => {
    e.preventDefault();
    if (tab.value > 0) {
        tab.value--;
    }
});

useHotkey('ctrl+arrowright', (e) => {
    e.preventDefault();
    if (tab.value < totalTabs - 1) {
        tab.value++;
    }
});

onMounted(() => {
    settings.hydrateFromLocalStorage();
    applyFontSettings(settings.config.fontFamily, settings.config.fontSize);
});

</script>

<template>
    <v-container fluid class="pa-4">
        <ConfigHelpPanel v-model="helpOpen" />
        <v-tabs v-model="tab" bg-color="surface" class="mb-4" rounded>
            <v-tab :value="0">{{ t('settings.etcd.title') }}</v-tab>
            <v-tab :value="1">{{ t('settings.profile.title') }}</v-tab>
            <v-tab :value="2">{{ t('settings.watchers.title') }}</v-tab>
            <v-tab :value="3">{{ t('settings.misc.title') }}</v-tab>
        </v-tabs>
        <v-tabs-window v-model="tab">
            <v-tabs-window-item :value="0">
                <ConfigConnectionForm />
            </v-tabs-window-item>
            <v-tabs-window-item :value="1">
                <ConfigProfileBar />
            </v-tabs-window-item>
            <v-tabs-window-item :value="2">
                <ConfigWatchersCard />
            </v-tabs-window-item>
            <v-tabs-window-item :value="3">
                <ConfigMiscCard />
            </v-tabs-window-item>
        </v-tabs-window>

        <v-row class="mt-4">
            <v-btn color="primary" size="large" @click="persist">
                {{ t('settings.actions.submit') }}
            </v-btn>
        </v-row>
    </v-container>
</template>
