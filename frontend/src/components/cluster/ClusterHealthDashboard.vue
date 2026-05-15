<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, shallowRef } from 'vue';
import { useI18n } from 'vue-i18n';
import { EventsOn } from '../../../wailsjs/runtime';
import {
    etcdClusterDashboard,
    etcdStartKVWatch,
    etcdStopKVWatch,
    type ClusterDashboardLeaseRow,
    type ClusterDashboardPayload,
} from '@/services/etcdBridge';
import { useAppStore } from '@/stores/app';
import ClusterDashboardCharts from '@/components/cluster/ClusterDashboardCharts.vue';
import ClusterDashboardMetaStrip from '@/components/cluster/ClusterDashboardMetaStrip.vue';
import ClusterDashboardKvStream, { type KvStreamEvent } from '@/components/cluster/ClusterDashboardKvStream.vue';

const { t } = useI18n();
const app = useAppStore();

/** 仅手动点击刷新时显示，避免定时拉取触发布局抖动 */
const manualRefreshing = ref(false);
const pollError = ref<string | null>(null);
const payload = shallowRef<ClusterDashboardPayload | null>(null);
const isLoading = ref(true);

const timeLabels = ref<string[]>([]);
const rssSeries = ref<(number | null)[]>([]);
const heapSeries = ref<(number | null)[]>([]);
const mvccKeysSeries = ref<(number | null)[]>([]);
const rpcKeySeries = ref<(number | null)[]>([]);

const events = ref<KvStreamEvent[]>([]);
const maxEvents = 80;
const maxPoints = 48;

let pollTimer: number | undefined;
let offKv: (() => void) | undefined;

function pushPoint(label: string, p: ClusterDashboardPayload) {
    const m = p.metrics ?? {};
    const rss = m.process_resident_memory_bytes;
    const heap = m.go_memstats_heap_inuse_bytes;
    const mvcc = m.etcd_debugging_mvcc_keys_total;

    timeLabels.value.push(label);
    rssSeries.value.push(rss != null ? rss / (1024 * 1024) : null);
    heapSeries.value.push(heap != null ? heap / (1024 * 1024) : null);
    mvccKeysSeries.value.push(mvcc != null ? mvcc : null);
    rpcKeySeries.value.push(typeof p.keyCount === 'number' ? p.keyCount : null);

    while (timeLabels.value.length > maxPoints) {
        timeLabels.value.shift();
        rssSeries.value.shift();
        heapSeries.value.shift();
        mvccKeysSeries.value.shift();
        rpcKeySeries.value.shift();
    }
}

function leaseBuckets(leases: ClusterDashboardLeaseRow[], otherLabel: string) {
    let a = 0;
    let b = 0;
    let c = 0;
    let d = 0;
    let e = 0;
    for (const row of leases) {
        const ttl = row.ttl;
        if (ttl < 0) {
            e++;
        } else if (ttl <= 10) {
            a++;
        } else if (ttl <= 60) {
            b++;
        } else if (ttl <= 300) {
            c++;
        } else {
            d++;
        }
    }
    return [
        { name: '≤10s', value: a },
        { name: '11–60s', value: b },
        { name: '1–5m', value: c },
        { name: '>5m', value: d },
        { name: otherLabel, value: e },
    ];
}

const leaseBars = computed(() => leaseBuckets(payload.value?.leases ?? [], t('cluster.dashboard.charts.leaseOther')));

async function refresh(opts?: { silent?: boolean }) {
    const silent = opts?.silent === true;
    if (!silent) {
        manualRefreshing.value = true;
        pollError.value = null;
    }
    try {
        const p = await etcdClusterDashboard();
        payload.value = p;
        const label = new Date(p.fetchedAtMs).toLocaleTimeString();
        pushPoint(label, p);
        if (silent) {
            pollError.value = null;
        }
        isLoading.value = false;
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        pollError.value = msg;
        isLoading.value = false;
        if (!silent) {
            app.showMessage(msg, 'error');
        }
    } finally {
        if (!silent) {
            manualRefreshing.value = false;
        }
    }
}

const metricsSubtitle = computed(() => {
    const p = payload.value;
    if (!p) {
        return '';
    }
    if (p.metricsError) {
        return t('cluster.dashboard.metricsError', { detail: p.metricsError });
    }
    const url = p.metricsURL.length > 44 ? `${p.metricsURL.slice(0, 44)}…` : p.metricsURL;
    return t('cluster.dashboard.metricsOk', { n: p.metricsKeyCount, url });
});

onMounted(() => {
    void etcdStartKVWatch();
    offKv = EventsOn('etcd:kv', (raw: string) => {
        try {
            const o = JSON.parse(raw) as { type?: string; key?: string; revision?: number };
            events.value.unshift({
                at: Date.now(),
                type: String(o.type ?? '?'),
                key: String(o.key ?? ''),
                revision: Number(o.revision ?? 0),
            });
            if (events.value.length > maxEvents) {
                events.value.length = maxEvents;
            }
        } catch {
            /* ignore */
        }
    });
    void refresh({ silent: true });
    pollTimer = window.setInterval(() => void refresh({ silent: true }), 5000);
});

onUnmounted(() => {
    if (pollTimer) {
        clearInterval(pollTimer);
    }
    offKv?.();
    void etcdStopKVWatch();
});
</script>

<template>
    <v-card variant="outlined" class="mb-4">
        <v-card-title class="d-flex flex-wrap align-center gap-2">
            <span>{{ t('cluster.dashboard.title') }}</span>
            <v-spacer />
            <v-chip v-if="metricsSubtitle" size="small" color="surface-variant" variant="tonal" class="text-caption">
                {{ metricsSubtitle }}
            </v-chip>
            <v-btn
                icon="mdi-refresh"
                variant="text"
                :loading="manualRefreshing"
                :title="t('cluster.dashboard.refresh')"
                @click="refresh()"
            />
        </v-card-title>
        <v-divider />
        <v-card-text>
            <ClusterDashboardMetaStrip :payload="payload" :poll-error="pollError" />

            <div v-if="isLoading" class="mt-4">
                <v-row dense>
                    <v-col cols="12" lg="6">
                        <v-skeleton-loader type="image" height="260" />
                    </v-col>
                    <v-col cols="12" lg="6">
                        <v-skeleton-loader type="image" height="260" />
                    </v-col>
                    <v-col cols="12">
                        <v-skeleton-loader type="image" height="220" />
                    </v-col>
                </v-row>
            </div>

            <ClusterDashboardCharts
                v-else
                class="mt-4"
                :time-labels="timeLabels"
                :rss-mb="rssSeries"
                :heap-mb="heapSeries"
                :mvcc-keys="mvccKeysSeries"
                :rpc-key-count="rpcKeySeries"
                :lease-buckets="leaseBars"
            />

            <ClusterDashboardKvStream class="mt-4" :events="events" />
        </v-card-text>
    </v-card>
</template>
