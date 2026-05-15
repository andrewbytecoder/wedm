<script setup lang="ts">
import { onMounted, onUnmounted, ref, shallowRef } from 'vue';
import { useI18n } from 'vue-i18n';
import mousetrap from 'mousetrap';
import { PlatformService } from '@/services/platform.service';
import {
    fetchAlarmsForMember,
    fetchClusterMaintenanceStatus,
    listClusterMembers,
    type ClusterMember,
} from '@/services/cluster.service';
import ClusterHealthDashboard from '@/components/cluster/ClusterHealthDashboard.vue';
import type { GenericObject } from '@/types';
import { useAppStore } from '@/stores/app';
const { t } = useI18n();
const appStore = useAppStore();
const platformService = shallowRef(new PlatformService());

const showHelp = ref(false);
const helpTab = ref('info');
const loadError = ref<string | null>(null);

const data = ref<{ members: ClusterMember[]; header: GenericObject }>({
    members: [],
    header: {},
});

const health = ref<Record<string, { alarms: unknown[] }>>({});
const statusDialog = ref(false);
const currentStats = ref<{
    dbSize?: string | number;
    leader?: string | number;
    raftIndex?: string | number;
    raftTerm?: string | number;
    version?: string;
} | null>(null);

function getIcon(id: string) {
    if (!health.value[id]) {
        return 'mdi-minus';
    }
    return health.value[id].alarms.length ? 'mdi-close-circle' : 'mdi-check-circle';
}

function getColor(id: string): string {
    if (!health.value[id]) {
        return 'grey';
    }
    return health.value[id].alarms.length ? 'error' : 'success';
}

async function fetchMembers() {
    loadError.value = null;
    try {
        const res = await listClusterMembers();
        data.value = res;
    } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        loadError.value = msg;
        data.value = { members: [], header: {} };
        appStore.showMessage(`${t('cluster.title')}: ${msg}`, 'warning');
    }
}

async function healthCheck(id: string) {
    try {
        const res = await fetchAlarmsForMember(id);
        health.value[id] = { alarms: res.alarms ?? [] };
        await fetchMembers();
    } catch (e) {
        appStore.showMessage(e instanceof Error ? e.message : String(e), 'error');
    }
}

async function status() {
    try {
        const st = await fetchClusterMaintenanceStatus();
        currentStats.value = {
            dbSize: st.dbSize,
            leader: String(st.leader),
            raftIndex: st.raftIndex,
            raftTerm: st.raftTerm,
            version: String(st.version),
        };
        statusDialog.value = true;
    } catch (e) {
        appStore.showMessage(e instanceof Error ? e.message : String(e), 'error');
    }
}

function cancelStatusDialog() {
    statusDialog.value = false;
}

let hotkeys: ReturnType<typeof mousetrap> | null = null;

onMounted(() => {
    hotkeys = mousetrap(document.body);
    hotkeys.bind(['ctrl+h', 'command+h'], (e) => {
        e.preventDefault();
        showHelp.value = !showHelp.value;
    });
    void fetchMembers();
});

onUnmounted(() => {
    hotkeys?.unbind(['ctrl+h', 'command+h']);
});
</script>

<template>
    <v-container fluid class="pa-4">
        <v-alert v-if="loadError" type="warning" variant="tonal" class="mb-4" prominent>
            {{ loadError }}
        </v-alert>

        <ClusterHealthDashboard />

        <v-expand-transition>
            <v-card v-show="showHelp" class="mb-4" variant="outlined">
                <v-card-title class="d-flex align-center">
                    <v-tooltip location="bottom" max-width="220">
                        <template #activator="{ props: tip }">
                            <v-icon
                                v-bind="tip"
                                data-test="health.help.icon"
                                color="primary"
                                class="me-2"
                                icon="mdi-help-circle-outline"
                            />
                        </template>
                        <span data-test="health.help.span">{{ t('common.help.tooltip') }}</span>
                    </v-tooltip>
                    <span data-test="health.title.toolbar-title">{{ t('cluster.title') }}</span>
                </v-card-title>
                <v-divider />
                <v-card-text>
                    <v-tabs v-model="helpTab" color="primary" grow>
                        <v-tab value="info" data-test="health.help-info.tab">{{
                            t('common.help.tabs.info')
                        }}</v-tab>
                        <v-tab value="keys" data-test="health.help-shortcuts.tab">{{
                            t('common.help.tabs.shortcuts')
                        }}</v-tab>
                    </v-tabs>
                    <v-tabs-window v-model="helpTab">
                        <v-tabs-window-item value="info">
                            <v-card flat class="pa-2">
                                <h2 data-test="health.help-info-title.h3" class="text-h6">
                                    {{ t('common.help.infoTitle') }}
                                </h2>
                                <p class="my-3" />
                                <div
                                    data-test="health.help-text.p"
                                    class="markdown-body"
                                    v-html="platformService.getHelp(t('cluster.help.text'))"
                                />
                            </v-card>
                        </v-tabs-window-item>
                        <v-tabs-window-item value="keys">
                            <v-card flat class="pa-2">
                                <v-row align="center">
                                    <v-col cols="12" sm="2">
                                        <p
                                            data-test="health.help-shortcuts-rounded.p"
                                            class="rounded text-caption font-weight-bold"
                                        >
                                            {{ `${platformService.getMeta()} + H` }}
                                        </p>
                                    </v-col>
                                    <v-col cols="12" sm="10">
                                        <p data-test="health.help-shortcuts-help.p" class="text-body-2">
                                            {{ t('common.help.shortcuts.help') }}
                                        </p>
                                    </v-col>
                                </v-row>
                            </v-card>
                        </v-tabs-window-item>
                    </v-tabs-window>
                </v-card-text>
            </v-card>
        </v-expand-transition>

        <v-card variant="outlined" class="mb-4">
            <v-list density="compact">
                <v-list-item>
                    <v-list-item-title data-test="health.header-clusterId.tile-content">
                        {{ t('cluster.header.clusterId') }}:
                    </v-list-item-title>
                    <template #append>
                        <span data-test="health.data-header-clusterId.tile-content">{{
                            data.header.cluster_id
                        }}</span>
                    </template>
                </v-list-item>
                <v-list-item>
                    <v-list-item-title data-test="health.header-memberId.tile-content">
                        {{ t('cluster.header.memberId') }}:
                    </v-list-item-title>
                    <template #append>
                        <span data-test="health.data-header-memberId.tile-content">{{
                            data.header.member_id
                        }}</span>
                    </template>
                </v-list-item>
                <v-list-item>
                    <v-list-item-title data-test="health.header-revision.tile-content">
                        {{ t('cluster.header.revision') }}:
                    </v-list-item-title>
                    <template #append>
                        <span data-test="health.data-header-revision.tile-content">{{
                            data.header.revision
                        }}</span>
                    </template>
                </v-list-item>
                <v-list-item>
                    <v-list-item-title data-test="health.header-raftTerm.tile-content">
                        {{ t('cluster.header.raftTerm') }}:
                    </v-list-item-title>
                    <template #append>
                        <span data-test="health.data-header-raftTerm.tile-content">{{
                            data.header.raft_term
                        }}</span>
                    </template>
                </v-list-item>
            </v-list>
        </v-card>

        <v-toolbar density="comfortable" flat class="mb-2">
            <v-toolbar-title data-test="health.cluster-subtitle.toolbar-title">
                {{ t('cluster.subtitle') }}
            </v-toolbar-title>
            <v-divider class="mx-2" inset vertical />
            <v-spacer />
        </v-toolbar>

        <v-row dense>
            <v-col
                v-for="item in data.members"
                :key="item.ID"
                cols="12"
                sm="6"
                md="4"
                lg="3"
            >
                <v-card variant="outlined">
                    <v-card-title
                        data-test="health.cluster-propName.card-title"
                        class="text-subtitle-1 font-weight-bold"
                    >
                        {{ item.name }}
                    </v-card-title>
                    <v-divider />
                    <v-list density="compact">
                        <v-list-item>
                            <v-list-item-title data-test="health.cluster-columns-id.tile-content">
                                {{ t('cluster.columns.id') }}:
                            </v-list-item-title>
                            <template #append>
                                <span data-test="health.cluster-propItem-id.tile-content">{{
                                    item.ID
                                }}</span>
                            </template>
                        </v-list-item>
                        <v-list-item>
                            <v-list-item-title data-test="health.cluster-columns-clientUrl.tile-content">
                                {{ t('cluster.columns.clientUrls') }}:
                            </v-list-item-title>
                            <template #append>
                                <span
                                    data-test="health.cluster-propItem-clientUrl.tile-content"
                                    class="text-caption text-break"
                                    >{{ item.clientURLs.join(',') }}</span
                                >
                            </template>
                        </v-list-item>
                        <v-list-item>
                            <v-list-item-title data-test="health.cluster-columns-peerUrl.tile-content">
                                {{ t('cluster.columns.peerUrls') }}:
                            </v-list-item-title>
                            <template #append>
                                <span
                                    data-test="health.cluster-propitem-peerUrl.tile-content"
                                    class="text-caption text-break"
                                    >{{ item.peerURLs.join(',') }}</span
                                >
                            </template>
                        </v-list-item>
                    </v-list>
                    <v-card-actions class="bg-surface-variant">
                        <v-tooltip location="bottom" max-width="220">
                            <template #activator="{ props: tip }">
                                <v-btn
                                    v-bind="tip"
                                    data-test="health.cluster-healthCheck.button"
                                    icon="mdi-heart"
                                    variant="text"
                                    color="warning"
                                    @click="healthCheck(item.ID)"
                                />
                            </template>
                            <span data-test="health.actions-check.span">{{
                                t('cluster.actions.check')
                            }}</span>
                        </v-tooltip>
                        <v-tooltip location="bottom" max-width="220">
                            <template #activator="{ props: tip }">
                                <v-btn
                                    v-bind="tip"
                                    data-test="health.cluster-status.button"
                                    icon="mdi-information"
                                    variant="text"
                                    color="warning"
                                    @click="status()"
                                />
                            </template>
                            <span data-test="health.actions-status.span">{{
                                t('cluster.actions.status')
                            }}</span>
                        </v-tooltip>
                        <v-spacer />
                        <v-icon
                            data-test="health.props-item-id.icon"
                            :color="getColor(item.ID)"
                            :icon="getIcon(item.ID)"
                        />
                    </v-card-actions>
                </v-card>
            </v-col>
        </v-row>

        <v-dialog v-model="statusDialog" max-width="420" persistent>
            <v-card v-if="currentStats">
                <v-card-title data-test="health.cluster-dialogs-info-title.toolbar-title">
                    {{ t('cluster.dialogs.info.title') }}
                </v-card-title>
                <v-divider />
                <v-list density="compact">
                    <v-list-item>
                        <v-list-item-title>{{ t('cluster.dialogs.info.labels.db') }}:</v-list-item-title>
                        <template #append>{{ currentStats.dbSize }}</template>
                    </v-list-item>
                    <v-list-item>
                        <v-list-item-title>{{
                            t('cluster.dialogs.info.labels.leader')
                        }}:</v-list-item-title>
                        <template #append>{{ currentStats.leader }}</template>
                    </v-list-item>
                    <v-list-item>
                        <v-list-item-title>{{
                            t('cluster.dialogs.info.labels.raftIndex')
                        }}:</v-list-item-title>
                        <template #append>{{ currentStats.raftIndex }}</template>
                    </v-list-item>
                    <v-list-item>
                        <v-list-item-title>{{
                            t('cluster.dialogs.info.labels.raftTerm')
                        }}:</v-list-item-title>
                        <template #append>{{ currentStats.raftTerm }}</template>
                    </v-list-item>
                    <v-list-item>
                        <v-list-item-title>{{
                            t('cluster.dialogs.info.labels.version')
                        }}:</v-list-item-title>
                        <template #append>{{ currentStats.version }}</template>
                    </v-list-item>
                </v-list>
                <v-card-actions>
                    <v-spacer />
                    <v-btn
                        data-test="health.cluster-dialogs-close.button"
                        color="warning"
                        variant="tonal"
                        @click="cancelStatusDialog"
                    >
                        {{ t('cluster.dialogs.info.actions.close') }}
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-container>
</template>

<style scoped>
.markdown-body :deep(p) {
    margin-bottom: 0.5rem;
}
</style>
