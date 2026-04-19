<script setup lang="ts">
import { onUnmounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import Mousetrap from 'mousetrap';
import { etcdLeaseGet, type LeaseDetail } from '@/services/etcdBridge';
import { PlatformService } from '@/services/platform.service';
import { useAppStore } from '@/stores/app';

const props = defineProps<{
    open: boolean;
    leaseId: string;
}>();

const emit = defineEmits<{
    close: [];
}>();

const { t } = useI18n();
const app = useAppStore();
const platform = new PlatformService();

const loading = ref(false);
const detail = ref<LeaseDetail | null>(null);
const remaining = ref(0);
const remainingLabel = ref('');
const helpPanel = ref<number | null>(null);

let tick: ReturnType<typeof setInterval> | undefined;
let syncLease: ReturnType<typeof setInterval> | undefined;

function clearTimers() {
    if (tick) {
        clearInterval(tick);
        tick = undefined;
    }
    if (syncLease) {
        clearInterval(syncLease);
        syncLease = undefined;
    }
}

async function refreshTtlFromServer() {
    if (!props.leaseId) {
        return;
    }
    try {
        const d = await etcdLeaseGet(props.leaseId);
        detail.value = d;
        remaining.value = Number(d.ttl);
        remainingLabel.value = formatRemaining(remaining.value);
    } catch {
        /* keep local countdown if cluster is briefly unavailable */
    }
}

function formatRemaining(sec: number): string {
    if (sec < 0) {
        return '—';
    }
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h} hours / ${m} minutes / ${s} seconds`;
}

async function loadDetail() {
    if (!props.leaseId) {
        detail.value = null;
        return;
    }
    loading.value = true;
    try {
        const d = await etcdLeaseGet(props.leaseId);
        detail.value = d;
        remaining.value = Number(d.ttl);
        remainingLabel.value = formatRemaining(remaining.value);
    } catch (e) {
        app.showMessage(e instanceof Error ? e.message : String(e), 'error');
        detail.value = null;
    } finally {
        loading.value = false;
    }
}

watch(
    () => [props.open, props.leaseId] as const,
    async ([open, id]) => {
        clearTimers();
        if (!open || !id) {
            return;
        }
        await loadDetail();
        tick = setInterval(() => {
            remaining.value -= 1;
            remainingLabel.value = formatRemaining(remaining.value);
        }, 1000);
        syncLease = setInterval(() => {
            void refreshTtlFromServer();
        }, 4000);
    },
);

onUnmounted(() => {
    clearTimers();
    Mousetrap.unbind(['mod+h', 'ctrl+h', 'esc']);
});

function bindHotkeys() {
    Mousetrap.bind(['mod+h', 'ctrl+h'], () => {
        helpPanel.value = helpPanel.value === 0 ? null : 0;
        return false;
    });
    Mousetrap.bind('esc', () => {
        if (props.open) {
            emit('close');
        }
        return false;
    });
}

watch(
    () => props.open,
    (open) => {
        Mousetrap.unbind(['mod+h', 'ctrl+h', 'esc']);
        if (open) {
            bindHotkeys();
        }
    },
);
</script>

<template>
    <v-card v-if="open" variant="outlined">
        <v-expansion-panels v-model="helpPanel" class="mb-2">
            <v-expansion-panel>
                <v-expansion-panel-title>{{ t('leaseEditor.title') }} — {{ t('common.help.tooltip') }}</v-expansion-panel-title>
                <v-expansion-panel-text>
                    <div class="markdown-help text-body-2" v-html="platform.getHelp(t('leaseEditor.help.text'))" />
                    <p class="text-caption mt-2">
                        <strong>{{ platform.getMeta() }} + H</strong> — {{ t('common.help.shortcuts.help') }} ·
                        <strong>Esc</strong> — {{ t('common.help.shortcuts.closeEditor') }}
                    </p>
                </v-expansion-panel-text>
            </v-expansion-panel>
        </v-expansion-panels>

        <v-toolbar density="comfortable" flat>
            <v-toolbar-title>{{ t('leaseEditor.title') }}: {{ leaseId }}</v-toolbar-title>
            <v-spacer />
            <v-btn variant="text" @click="emit('close')">{{ t('common.actions.close.label') }}</v-btn>
        </v-toolbar>

        <v-card-text>
            <v-progress-linear v-if="loading" indeterminate />
            <template v-else-if="detail">
                <v-text-field
                    :model-value="String(detail.grantedTTL)"
                    readonly
                    density="comfortable"
                    :label="t('leaseEditor.fields.grant.label')"
                />
                <v-text-field
                    :model-value="remainingLabel"
                    readonly
                    density="comfortable"
                    :label="t('leaseEditor.fields.remainingDate.label')"
                />
                <h3 class="text-subtitle-1 mt-4">{{ t('leaseEditor.subtitle') }}</h3>
                <v-card variant="tonal" max-height="220" class="overflow-y-auto pa-2">
                    <div v-for="k in detail.keys" :key="k" class="text-body-2">{{ k }}</div>
                    <div v-if="!detail.keys.length" class="text-caption text-medium-emphasis">
                        {{ t('common.lists.nodata') }}
                    </div>
                </v-card>
            </template>
        </v-card-text>
    </v-card>
</template>

<style scoped>
.markdown-help :deep(p) {
    margin-bottom: 0.5rem;
}
.markdown-help :deep(ul) {
    margin: 0.25rem 0 0.5rem 1.25rem;
}
</style>
