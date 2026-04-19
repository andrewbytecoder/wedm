<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useSettingsStore } from '@/stores/settings';

const { t } = useI18n();
const settings = useSettingsStore();

const usersPattern = computed({
    get: () => settings.users.pattern ?? '',
    set: (v: string) => {
        settings.users.pattern = v === '' ? null : v;
    },
});
</script>

<template>
    <v-card variant="outlined" class="pa-4 mb-4">
        <v-card-title>{{ t('settings.misc.title') }}</v-card-title>
        <v-card-text>
            <v-switch
                v-model="settings.config.animateBg"
                :label="t('settings.misc.fields.animateBg.label')"
                color="primary"
                hide-details
                density="compact"
            />
            <v-switch
                v-model="settings.config.background"
                :label="t('settings.misc.fields.bg.label')"
                color="primary"
                hide-details
                density="compact"
            />
            <v-text-field
                v-model="usersPattern"
                :label="t('settings.users.fields.pwpattern.label')"
                density="comfortable"
                class="mt-4"
            />
        </v-card-text>
    </v-card>
</template>
