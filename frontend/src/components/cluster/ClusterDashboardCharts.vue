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
}>();

/** 降低定时刷新时的重绘与布局抖动 */
const chartUpdateOpts = {
    lazyUpdate: true
};

const anim = {
    animationDurationUpdate: 0,
};

const memOption = computed(() => ({
    ...anim,
    title: { text: t('cluster.dashboard.charts.memoryTitle'), left: 'center', top: 4, textStyle: { fontSize: 13 } },
    tooltip: { trigger: 'axis' },
    legend: { data: ['RSS', 'Heap inuse'], bottom: 0 },
    grid: { left: 64, right: 16, top: 40, bottom: 56 },
    xAxis: { type: 'category', data: props.timeLabels, boundaryGap: false },
    yAxis: { type: 'value', name: 'MB', nameLocation: 'end', nameGap: 8 },
    series: [
        { name: 'RSS', type: 'line', smooth: true, showSymbol: false, data: props.rssMb },
        { name: 'Heap inuse', type: 'line', smooth: true, showSymbol: false, data: props.heapMb },
    ],
}));

const keysOption = computed(() => ({
    ...anim,
    title: { text: t('cluster.dashboard.charts.keysTitle'), left: 'center', top: 4, textStyle: { fontSize: 13 } },
    tooltip: { trigger: 'axis' },
    legend: { data: ['/metrics mvcc keys', t('cluster.dashboard.charts.visibleKeysSeries')], bottom: 0 },
    grid: { left: 64, right: 16, top: 40, bottom: 56 },
    xAxis: { type: 'category', data: props.timeLabels, boundaryGap: false },
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

const leaseOption = computed(() => ({
    ...anim,
    title: { text: t('cluster.dashboard.charts.leaseTitle'), left: 'center', top: 4, textStyle: { fontSize: 13 } },
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
                <v-chart class="dash-chart" :option="keysOption" :update-options="chartUpdateOpts" autoresize />
            </v-card>
        </v-col>
        <v-col cols="12">
            <v-card variant="outlined" class="pa-2">
                <v-chart class="dash-chart dash-chart--short" :option="leaseOption" :update-options="chartUpdateOpts" autoresize />
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
