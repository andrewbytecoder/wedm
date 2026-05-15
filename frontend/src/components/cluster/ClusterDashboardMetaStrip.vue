<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { ClusterDashboardPayload } from '@/services/etcdBridge';

const { t } = useI18n();

const props = defineProps<{
    payload: ClusterDashboardPayload | null;
    pollError: string | null;
}>();

function formatBytes(n: number | undefined): string {
    if (n == null || Number.isNaN(n)) {
        return '—';
    }
    if (n < 1024) {
        return `${n} B`;
    }
    const kb = n / 1024;
    if (kb < 1024) {
        return `${kb.toFixed(1)} KiB`;
    }
    const mb = kb / 1024;
    if (mb < 1024) {
        return `${mb.toFixed(1)} MiB`;
    }
    return `${(mb / 1024).toFixed(2)} GiB`;
}

const revision = computed(() => String(props.payload?.header?.revision ?? '—'));
</script>

<template>
    <div>
        <v-alert v-if="pollError" type="error" density="compact" variant="tonal" class="mb-3">
            {{ pollError }}
        </v-alert>
        <v-row dense>
            <v-col cols="6" sm="4" md="2">
                <v-sheet border rounded class="pa-3 text-center">
                    <div class="text-caption text-medium-emphasis">{{ t('cluster.dashboard.meta.members') }}</div>
                    <div class="text-h6">{{ payload?.memberCount ?? '—' }}</div>
                </v-sheet>
            </v-col>
            <v-col cols="6" sm="4" md="2">
                <v-sheet border rounded class="pa-3 text-center">
                    <div class="text-caption text-medium-emphasis">{{ t('cluster.dashboard.meta.revision') }}</div>
                    <div class="text-h6 text-truncate">{{ revision }}</div>
                </v-sheet>
            </v-col>
            <v-col cols="6" sm="4" md="2">
                <v-sheet border rounded class="pa-3 text-center">
                    <div class="text-caption text-medium-emphasis">{{ t('cluster.dashboard.meta.keys') }}</div>
                    <div class="text-h6">{{ payload?.keyCount ?? '—' }}</div>
                </v-sheet>
            </v-col>
            <v-col cols="6" sm="4" md="2">
                <v-sheet border rounded class="pa-3 text-center">
                    <div class="text-caption text-medium-emphasis">{{ t('cluster.dashboard.meta.leases') }}</div>
                    <div class="text-h6">{{ payload?.leaseCount ?? '—' }}</div>
                </v-sheet>
            </v-col>
            <v-col cols="6" sm="4" md="2">
                <v-sheet border rounded class="pa-3 text-center">
                    <div class="text-caption text-medium-emphasis">{{ t('cluster.dashboard.meta.dbSize') }}</div>
                    <div class="text-h6">{{ formatBytes(payload?.status?.dbSize) }}</div>
                </v-sheet>
            </v-col>
            <v-col cols="6" sm="4" md="2">
                <v-sheet border rounded class="pa-3 text-center">
                    <div class="text-caption text-medium-emphasis">{{ t('cluster.dashboard.meta.version') }}</div>
                    <div class="text-h6 text-truncate">{{ payload?.status?.version ?? '—' }}</div>
                </v-sheet>
            </v-col>
        </v-row>
        <v-alert
            v-if="payload?.keyCountError"
            type="warning"
            density="compact"
            variant="tonal"
            class="mt-2"
        >
            {{ payload.keyCountError }}
        </v-alert>
        <v-alert
            v-if="payload?.leaseListError"
            type="warning"
            density="compact"
            variant="tonal"
            class="mt-2"
        >
            {{ payload.leaseListError }}
        </v-alert>
    </div>
</template>
