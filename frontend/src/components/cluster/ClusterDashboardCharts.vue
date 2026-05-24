<script setup lang="ts">
import { computed } from 'vue';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { LineChart, BarChart } from 'echarts/charts';
import {
    GridComponent,
    TooltipComponent,
    LegendComponent,
    TitleComponent,
} from 'echarts/components';
import VChart from 'vue-echarts';
import { useI18n } from 'vue-i18n';

use([
    CanvasRenderer,
    LineChart,
    BarChart,
    GridComponent,
    TooltipComponent,
    LegendComponent,
    TitleComponent,
]);

const { t } = useI18n();

const props = defineProps<{
    timeLabels: string[];
    rssMb: (number | null)[];
    heapMb: (number | null)[];
    mvccKeys: (number | null)[];
    rpcKeyCount: (number | null)[];
    leaseBuckets: { name: string; value: number }[];
    virtMb: (number | null)[];
    allocMb: (number | null)[];
    sysMb: (number | null)[];
    heapAllocMb: (number | null)[];
    cpuRate: (number | null)[];
    dbSizeInUseMb: (number | null)[];
    dbSizeTotalMb: (number | null)[];
    currentRev: (number | null)[];
    compactRev: (number | null)[];
    grpcStartedRate: (number | null)[];
    grpcHandledRate: (number | null)[];
    netRecvKbps: (number | null)[];
    netSentKbps: (number | null)[];
    commitLatencyMs: (number | null)[];
    compactionKeysRate: (number | null)[];
}>();

/** 降低定时刷新时的重绘与布局抖动 */
const chartUpdateOpts = {
    lazyUpdate: true
};

const anim = {
    animationDurationUpdate: 0,
};

const makeXAxis = () => ({
    type: 'category',
    data: props.timeLabels,
    boundaryGap: false,
});

const makeGrid = (bottom = 56) => ({ left: 64, right: 16, top: 40, bottom });
const makeTitle = (text: string) => ({ text, left: 'center', top: 4, textStyle: { fontSize: 13 } });

const memOption = computed(() => ({
    ...anim,
    title: makeTitle(t('cluster.dashboard.charts.memoryTitle')),
    tooltip: { trigger: 'axis' },
    legend: { data: ['RSS', 'Virtual', 'Alloc', 'Heap inuse', 'Sys', 'Heap alloc'], bottom: 0 },
    grid: makeGrid(),
    xAxis: makeXAxis(),
    yAxis: { type: 'value', name: 'MB', nameLocation: 'end', nameGap: 8 },
    series: [
        { name: 'RSS', type: 'line', smooth: true, showSymbol: false, data: props.rssMb },
        { name: 'Virtual', type: 'line', smooth: true, showSymbol: false, data: props.virtMb },
        { name: 'Alloc', type: 'line', smooth: true, showSymbol: false, data: props.allocMb },
        { name: 'Heap inuse', type: 'line', smooth: true, showSymbol: false, data: props.heapMb },
        { name: 'Sys', type: 'line', smooth: true, showSymbol: false, data: props.sysMb },
        { name: 'Heap alloc', type: 'line', smooth: true, showSymbol: false, data: props.heapAllocMb },
    ],
}));

const virMemOption = computed(() => ({
    ...anim,
    title: makeTitle(t('cluster.dashboard.charts.virtualMemoryTitle')),
    tooltip: { trigger: 'axis' },
    legend: { data: ['Virtual'], bottom: 0 },
    grid: makeGrid(),
    xAxis: makeXAxis(),
    yAxis: { type: 'value', name: 'MB', nameLocation: 'end', nameGap: 8 },
    series: [
        { name: 'Virtual', type: 'line', smooth: true, showSymbol: false, data: props.virtMb },
    ],
}));

const cpuOption = computed(() => ({
    ...anim,
    title: makeTitle(t('cluster.dashboard.charts.cpuTitle')),
    tooltip: { trigger: 'axis' },
    legend: { data: ['CPU cores'], bottom: 0 },
    grid: makeGrid(),
    xAxis: makeXAxis(),
    yAxis: { type: 'value', name: 'cores', nameLocation: 'end', nameGap: 8 },
    series: [
        { name: 'CPU cores', type: 'line', smooth: true, showSymbol: false, data: props.cpuRate, areaStyle: { opacity: 0.15 } },
    ],
}));

const keysOption = computed(() => ({
    ...anim,
    title: makeTitle(t('cluster.dashboard.charts.keysTitle')),
    tooltip: { trigger: 'axis' },
    legend: { data: ['/metrics mvcc keys', t('cluster.dashboard.charts.visibleKeysSeries')], bottom: 0 },
    grid: makeGrid(),
    xAxis: makeXAxis(),
    yAxis: { type: 'value', nameLocation: 'end', nameGap: 8 },
    series: [
        { name: '/metrics mvcc keys', type: 'line', smooth: true, showSymbol: false, data: props.mvccKeys },
        {
            name: t('cluster.dashboard.charts.visibleKeysSeries'),
            type: 'line',
            smooth: true,
            showSymbol: false,
            data: props.rpcKeyCount,
        },
    ],
}));

const dbSizeOption = computed(() => ({
    ...anim,
    title: makeTitle(t('cluster.dashboard.charts.dbSizeTitle')),
    tooltip: { trigger: 'axis' },
    legend: { data: ['DB in-use', 'DB total'], bottom: 0 },
    grid: makeGrid(),
    xAxis: makeXAxis(),
    yAxis: { type: 'value', name: 'MB', nameLocation: 'end', nameGap: 8 },
    series: [
        { name: 'DB in-use', type: 'line', smooth: true, showSymbol: false, data: props.dbSizeInUseMb },
        { name: 'DB total', type: 'line', smooth: true, showSymbol: false, data: props.dbSizeTotalMb },
    ],
}));

const revOption = computed(() => ({
    ...anim,
    title: makeTitle(t('cluster.dashboard.charts.revTitle')),
    tooltip: { trigger: 'axis' },
    legend: { data: ['Current revision', 'Compact revision'], bottom: 0 },
    grid: makeGrid(),
    xAxis: makeXAxis(),
    yAxis: { type: 'value', nameLocation: 'end', nameGap: 8 },
    series: [
        { name: 'Current revision', type: 'line', smooth: true, showSymbol: false, data: props.currentRev },
        { name: 'Compact revision', type: 'line', smooth: true, showSymbol: false, data: props.compactRev },
    ],
}));

const grpcOption = computed(() => ({
    ...anim,
    title: makeTitle(t('cluster.dashboard.charts.grpcTitle')),
    tooltip: { trigger: 'axis' },
    legend: { data: ['Started', 'Handled'], bottom: 0 },
    grid: makeGrid(),
    xAxis: makeXAxis(),
    yAxis: { type: 'value', name: 'req/s', nameLocation: 'end', nameGap: 8 },
    series: [
        { name: 'Started', type: 'line', smooth: true, showSymbol: false, data: props.grpcStartedRate },
        { name: 'Handled', type: 'line', smooth: true, showSymbol: false, data: props.grpcHandledRate },
    ],
}));

const netOption = computed(() => ({
    ...anim,
    title: makeTitle(t('cluster.dashboard.charts.netTitle')),
    tooltip: { trigger: 'axis' },
    legend: { data: ['Received', 'Sent'], bottom: 0 },
    grid: makeGrid(),
    xAxis: makeXAxis(),
    yAxis: { type: 'value', name: 'KB/s', nameLocation: 'end', nameGap: 8 },
    series: [
        { name: 'Received', type: 'line', smooth: true, showSymbol: false, data: props.netRecvKbps, areaStyle: { opacity: 0.15 } },
        { name: 'Sent', type: 'line', smooth: true, showSymbol: false, data: props.netSentKbps, areaStyle: { opacity: 0.15 } },
    ],
}));

const commitOption = computed(() => ({
    ...anim,
    title: makeTitle(t('cluster.dashboard.charts.commitTitle')),
    tooltip: { trigger: 'axis' },
    legend: { data: ['Avg latency'], bottom: 0 },
    grid: makeGrid(),
    xAxis: makeXAxis(),
    yAxis: { type: 'value', name: 'ms', nameLocation: 'end', nameGap: 8 },
    series: [
        { name: 'Avg latency', type: 'line', smooth: true, showSymbol: false, data: props.commitLatencyMs },
    ],
}));

const compactionOption = computed(() => ({
    ...anim,
    title: makeTitle(t('cluster.dashboard.charts.compactionTitle')),
    tooltip: { trigger: 'axis' },
    legend: { data: ['Compaction keys'], bottom: 0 },
    grid: makeGrid(),
    xAxis: makeXAxis(),
    yAxis: { type: 'value', name: 'keys/s', nameLocation: 'end', nameGap: 8 },
    series: [
        { name: 'Compaction keys', type: 'line', smooth: true, showSymbol: false, data: props.compactionKeysRate, areaStyle: { opacity: 0.15 } },
    ],
}));

const leaseOption = computed(() => ({
    ...anim,
    title: makeTitle(t('cluster.dashboard.charts.leaseTitle')),
    tooltip: { trigger: 'axis' },
    grid: { left: 64, right: 16, top: 40, bottom: 32 },
    xAxis: {
        type: 'category',
        data: props.leaseBuckets.map((b) => b.name),
        axisLabel: { interval: 0, rotate: 24 },
    },
    yAxis: { type: 'value', name: t('cluster.dashboard.charts.leaseAxis'), nameLocation: 'end', nameGap: 8 },
    series: [{ type: 'bar', data: props.leaseBuckets.map((b) => b.value), itemStyle: { color: '#5c6bc0' } }],
}));
</script>

<template>
    <v-row dense>
        <v-col cols="12" lg="6">
            <v-card variant="outlined" class="pa-2">
                <v-chart class="dash-chart" :option="memOption" :update-options="chartUpdateOpts" autoresize />
            </v-card>
        </v-col>
        <v-col cols="12" lg="6">
            <v-card variant="outlined" class="pa-2">
                <v-chart class="dash-chart" :option="virMemOption" :update-options="chartUpdateOpts" autoresize />
            </v-card>
        </v-col>

        <v-col cols="12" lg="6">
            <v-card variant="outlined" class="pa-2">
                <v-chart class="dash-chart" :option="cpuOption" :update-options="chartUpdateOpts" autoresize />
            </v-card>
        </v-col>
        <v-col cols="12" lg="6">
            <v-card variant="outlined" class="pa-2">
                <v-chart class="dash-chart" :option="keysOption" :update-options="chartUpdateOpts" autoresize />
            </v-card>
        </v-col>
        <v-col cols="12" lg="6">
            <v-card variant="outlined" class="pa-2">
                <v-chart class="dash-chart" :option="dbSizeOption" :update-options="chartUpdateOpts" autoresize />
            </v-card>
        </v-col>
        <v-col cols="12" lg="6">
            <v-card variant="outlined" class="pa-2">
                <v-chart class="dash-chart" :option="revOption" :update-options="chartUpdateOpts" autoresize />
            </v-card>
        </v-col>
        <v-col cols="12" lg="6">
            <v-card variant="outlined" class="pa-2">
                <v-chart class="dash-chart" :option="grpcOption" :update-options="chartUpdateOpts" autoresize />
            </v-card>
        </v-col>
        <v-col cols="12" lg="6">
            <v-card variant="outlined" class="pa-2">
                <v-chart class="dash-chart" :option="netOption" :update-options="chartUpdateOpts" autoresize />
            </v-card>
        </v-col>
        <v-col cols="12" lg="6">
            <v-card variant="outlined" class="pa-2">
                <v-chart class="dash-chart" :option="commitOption" :update-options="chartUpdateOpts" autoresize />
            </v-card>
        </v-col>
        <v-col cols="12" lg="6">
            <v-card variant="outlined" class="pa-2">
                <v-chart class="dash-chart" :option="compactionOption" :update-options="chartUpdateOpts" autoresize />
            </v-card>
        </v-col>
        <v-col cols="12" lg="12">
            <v-card variant="outlined" class="pa-2">
                <v-chart class="dash-chart--short" :option="leaseOption" :update-options="chartUpdateOpts" autoresize />
            </v-card>
        </v-col>
    </v-row>
</template>

<style scoped>
.dash-chart {
    height: 260px;
    width: 100%;
}
.dash-chart--short {
    height: 220px;
}
</style>
