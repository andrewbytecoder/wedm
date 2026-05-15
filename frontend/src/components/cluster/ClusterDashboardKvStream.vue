<script setup lang="ts">
import { useI18n } from 'vue-i18n';

export type KvStreamEvent = {
    at: number;
    type: string;
    key: string;
    revision: number;
};

const { t } = useI18n();

defineProps<{
    events: KvStreamEvent[];
}>();
</script>

<template>
    <v-card variant="outlined">
        <v-card-title class="text-subtitle-1">{{ t('cluster.dashboard.events.title') }}</v-card-title>
        <v-divider />
        <v-card-text class="pa-0">
            <v-list v-if="events.length" class="event-scroller py-0" density="compact">
                <v-list-item v-for="(ev, i) in events" :key="i" :title="ev.key" :subtitle="`${ev.type} · rev ${ev.revision}`">
                    <template #append>
                        <span class="text-caption text-medium-emphasis">{{ new Date(ev.at).toLocaleTimeString() }}</span>
                    </template>
                </v-list-item>
            </v-list>
            <p v-else class="text-body-2 text-medium-emphasis pa-4">{{ t('cluster.dashboard.events.empty') }}</p>
        </v-card-text>
    </v-card>
</template>

<style scoped>
.event-scroller {
    max-height: 220px;
    overflow-y: auto;
}
</style>
