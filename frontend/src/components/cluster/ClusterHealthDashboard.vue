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

const virtMemSeries = ref<(number | null)[]>([]);
const allocSeries = ref<(number | null)[]>([]);
const sysSeries = ref<(number | null)[]>([]);
const heapAllocSeries = ref<(number | null)[]>([]);
const cpuRateSeries = ref<(number | null)[]>([]);
const dbSizeInUseSeries = ref<(number | null)[]>([]);
const dbSizeTotalSeries = ref<(number | null)[]>([]);
const currentRevSeries = ref<(number | null)[]>([]);
const compactRevSeries = ref<(number | null)[]>([]);
const grpcStartedRateSeries = ref<(number | null)[]>([]);
const grpcHandledRateSeries = ref<(number | null)[]>([]);
const netRecvRateSeries = ref<(number | null)[]>([]);
const netSentRateSeries = ref<(number | null)[]>([]);
const commitLatencyMsSeries = ref<(number | null)[]>([]);
const compactionKeysRateSeries = ref<(number | null)[]>([]);

const prevMetrics = ref<Record<string, number>>({});
const lastFetchedAtMs = ref<number>(0);

const events = ref<KvStreamEvent[]>([]);
const maxEvents = 80;
const maxPoints = 360; // 5s interval => 30min retention

let pollTimer: number | undefined;
let offKv: (() => void) | undefined;

function counterRate(cur: number | undefined, prev: number | undefined, dtSec: number): number | null {
    if (cur == null || prev == null || dtSec <= 0) return null;
    const diff = cur - prev;
    if (diff < 0) return null; // counter reset
    return diff / dtSec;
}

function pushPoint(label: string, p: ClusterDashboardPayload) {
    const m = p.metrics ?? {};
    const prev = prevMetrics.value;
    const dt = lastFetchedAtMs.value > 0 ? (p.fetchedAtMs - lastFetchedAtMs.value) / 1000 : 0;

    const rss = m.process_resident_memory_bytes;
    const heap = m.go_memstats_heap_inuse_bytes;
    const mvcc = m.etcd_debugging_mvcc_keys_total;

    timeLabels.value.push(label);
    rssSeries.value.push(rss != null ? rss / (1024 * 1024) : null);
    heapSeries.value.push(heap != null ? heap / (1024 * 1024) : null);
    mvccKeysSeries.value.push(mvcc != null ? mvcc : null);
    rpcKeySeries.value.push(typeof p.keyCount === 'number' ? p.keyCount : null);

    // Memory
    virtMemSeries.value.push(m.process_virtual_memory_bytes != null ? m.process_virtual_memory_bytes / (1024 * 1024) : null);
    allocSeries.value.push(m.go_memstats_alloc_bytes != null ? m.go_memstats_alloc_bytes / (1024 * 1024) : null);
    sysSeries.value.push(m.go_memstats_sys_bytes != null ? m.go_memstats_sys_bytes / (1024 * 1024) : null);
    heapAllocSeries.value.push(m.go_memstats_heap_alloc_bytes != null ? m.go_memstats_heap_alloc_bytes / (1024 * 1024) : null);

    // CPU rate (cores)
    cpuRateSeries.value.push(counterRate(m.process_cpu_seconds_total, prev.process_cpu_seconds_total, dt));

    // DB size (MB)
    dbSizeInUseSeries.value.push(m.etcd_mvcc_db_total_size_in_use_in_bytes != null ? m.etcd_mvcc_db_total_size_in_use_in_bytes / (1024 * 1024) : null);
    dbSizeTotalSeries.value.push(m.etcd_mvcc_db_total_size_in_bytes != null ? m.etcd_mvcc_db_total_size_in_bytes / (1024 * 1024) : null);

    // Revision
    currentRevSeries.value.push(m.etcd_debugging_mvcc_current_revision ?? null);
    compactRevSeries.value.push(m.etcd_debugging_mvcc_compact_revision ?? null);

    // gRPC rate (req/s)
    grpcStartedRateSeries.value.push(counterRate(m.grpc_server_started_total, prev.grpc_server_started_total, dt));
    grpcHandledRateSeries.value.push(counterRate(m.grpc_server_handled_total, prev.grpc_server_handled_total, dt));

    // Network rate (KB/s)
    const netRecv = counterRate(m.etcd_network_client_grpc_received_bytes_total, prev.etcd_network_client_grpc_received_bytes_total, dt);
    const netSent = counterRate(m.etcd_network_client_grpc_sent_bytes_total, prev.etcd_network_client_grpc_sent_bytes_total, dt);
    netRecvRateSeries.value.push(netRecv != null ? netRecv / 1024 : null);
    netSentRateSeries.value.push(netSent != null ? netSent / 1024 : null);

    // Disk commit latency (ms)
    const commitSum = m.etcd_disk_backend_commit_duration_seconds_sum;
    const commitCount = m.etcd_disk_backend_commit_duration_seconds_count;
    let commitMs: number | null = null;
    if (commitSum != null && commitCount != null && commitCount > 0) {
        const prevSum = prev.etcd_disk_backend_commit_duration_seconds_sum;
        const prevCount = prev.etcd_disk_backend_commit_duration_seconds_count;
        if (prevSum != null && prevCount != null && commitCount > prevCount) {
            commitMs = ((commitSum - prevSum) / (commitCount - prevCount)) * 1000;
        }
    }
    commitLatencyMsSeries.value.push(commitMs);

    // Compaction keys rate (keys/s)
    compactionKeysRateSeries.value.push(counterRate(m.etcd_debugging_mvcc_db_compaction_keys_total, prev.etcd_debugging_mvcc_db_compaction_keys_total, dt));

    while (timeLabels.value.length > maxPoints) {
        timeLabels.value.shift();
        rssSeries.value.shift();
        heapSeries.value.shift();
        mvccKeysSeries.value.shift();
        rpcKeySeries.value.shift();
        virtMemSeries.value.shift();
        allocSeries.value.shift();
        sysSeries.value.shift();
        heapAllocSeries.value.shift();
        cpuRateSeries.value.shift();
        dbSizeInUseSeries.value.shift();
        dbSizeTotalSeries.value.shift();
        currentRevSeries.value.shift();
        compactRevSeries.value.shift();
        grpcStartedRateSeries.value.shift();
        grpcHandledRateSeries.value.shift();
        netRecvRateSeries.value.shift();
        netSentRateSeries.value.shift();
        commitLatencyMsSeries.value.shift();
        compactionKeysRateSeries.value.shift();
    }

    prevMetrics.value = { ...m };
    lastFetchedAtMs.value = p.fetchedAtMs;
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
                    <v-col cols="12" lg="6"><v-skeleton-loader type="image" height="260" /></v-col>
                    <v-col cols="12" lg="6"><v-skeleton-loader type="image" height="260" /></v-col>
                    <v-col cols="12" lg="6"><v-skeleton-loader type="image" height="260" /></v-col>
                    <v-col cols="12" lg="6"><v-skeleton-loader type="image" height="260" /></v-col>
                    <v-col cols="12" lg="6"><v-skeleton-loader type="image" height="260" /></v-col>
                    <v-col cols="12" lg="6"><v-skeleton-loader type="image" height="260" /></v-col>
                    <v-col cols="12" lg="6"><v-skeleton-loader type="image" height="260" /></v-col>
                    <v-col cols="12" lg="6"><v-skeleton-loader type="image" height="260" /></v-col>
                    <v-col cols="12" lg="6"><v-skeleton-loader type="image" height="260" /></v-col>
                    <v-col cols="12" lg="6"><v-skeleton-loader type="image" height="220" /></v-col>
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
                :virt-mb="virtMemSeries"
                :alloc-mb="allocSeries"
                :sys-mb="sysSeries"
                :heap-alloc-mb="heapAllocSeries"
                :cpu-rate="cpuRateSeries"
                :db-size-in-use-mb="dbSizeInUseSeries"
                :db-size-total-mb="dbSizeTotalSeries"
                :current-rev="currentRevSeries"
                :compact-rev="compactRevSeries"
                :grpc-started-rate="grpcStartedRateSeries"
                :grpc-handled-rate="grpcHandledRateSeries"
                :net-recv-kbps="netRecvRateSeries"
                :net-sent-kbps="netSentRateSeries"
                :commit-latency-ms="commitLatencyMsSeries"
                :compaction-keys-rate="compactionKeysRateSeries"
            />

            <ClusterDashboardKvStream class="mt-4" :events="events" />
        </v-card-text>
    </v-card>
</template>
