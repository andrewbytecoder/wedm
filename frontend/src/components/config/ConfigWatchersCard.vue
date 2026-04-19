<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useSettingsStore } from '@/stores/settings';

const { t } = useI18n();
const settings = useSettingsStore();
</script>

<template>
    <v-card variant="outlined" class="pa-4 mb-4">
        <v-card-title>{{ t('settings.watchers.title') }}</v-card-title>
        <v-card-text>
            <v-switch
                v-model="settings.watchers.autoload"
                :label="t('settings.watchers.fields.loadWatchers.label')"
                color="primary"
                hide-details
                density="compact"
            />
            <v-switch
                v-model="settings.watchers.error"
                :label="t('settings.watchers.fields.errorListener.label')"
                color="primary"
                hide-details
                density="compact"
            />
            <v-switch
                v-model="settings.watchers.disconnects"
                :label="t('settings.watchers.fields.disconnectListener.label')"
                color="primary"
                hide-details
                density="compact"
            />
            <v-switch
                v-model="settings.watchers.reconnects"
                :label="t('settings.watchers.fields.reconnectListener.label')"
                color="primary"
                hide-details
                density="compact"
            />
        </v-card-text>
    </v-card>
</template>
