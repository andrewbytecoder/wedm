<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import Mousetrap from 'mousetrap';
import KeyTreePanel from '@/components/keys/KeyTreePanel.vue';
import KeyEditorPanel from '@/components/keys/KeyEditorPanel.vue';
import DeleteConfirmDialog from '@/components/dialogs/DeleteConfirmDialog.vue';
import PurgeConfirmDialog from '@/components/dialogs/PurgeConfirmDialog.vue';
import NoSelectionDialog from '@/components/dialogs/NoSelectionDialog.vue';
import { buildKeyTreeFromRows, type KeyRow } from '@/lib/buildKeyTree';
import {
    etcdDeleteKeys,
    etcdGetKey,
    etcdListKeys,
    etcdPurgeAllKeys,
    etcdStartKVWatch,
    etcdStopKVWatch,
    etcdTouchKeys,
} from '@/services/etcdBridge';
import { EventsOn } from '../../wailsjs/runtime/runtime';
import { PlatformService } from '@/services/platform.service';
import { useAppStore } from '@/stores/app';
import { useSettingsStore } from '@/stores/settings';

const { t } = useI18n();
const app = useAppStore();
const settings = useSettingsStore();
const platform = new PlatformService();

const loading = ref(false);
const rows = ref<KeyRow[]>([]);
const filter = ref('');
const view = ref<'tree' | 'flat'>('flat');
const selectedKeys = ref<string[]>([]);
const separator = ref(settings.separator);
const editorOpen = ref(false);
const editorMode = ref<'create' | 'edit'>('create');
const editorKey = ref('');
const editorValue = ref('');
const deleteDialog = ref(false);
const deleteBulk = ref(false);
const itemToDelete = ref<KeyRow | null>(null);
const purgeDialog = ref(false);
const noSelectionDialog = ref(false);
const isOpenAll = ref(false);
const helpPanel = ref<number | null>(null);
const treePanelRef = ref<{ setExpandedAll: (open: boolean) => void } | null>(null);
const editorPanelRef = ref<{ submit: () => Promise<void> } | null>(null);

let kvWatchUnsub: (() => void) | undefined;
let softRefreshTimer: ReturnType<typeof setTimeout> | undefined;

function shortenText(text: string, shallShorten: boolean): string {
    if (shallShorten && text.length > 50) {
        return text.slice(0, 50).concat('...');
    }
    return text;
}

const filteredRows = computed(() => {
    const q = filter.value.trim().toLowerCase();
    if (!q) {
        return rows.value;
    }
    return rows.value.filter(
        (r) =>
            r.key.toLowerCase().includes(q) || r.tooltip.toLowerCase().includes(q),
    );
});

const treeData = computed(() => buildKeyTreeFromRows(filteredRows.value, separator.value));

const flatHeaders = computed(() => [
    { title: t('keyManager.columns.key'), key: 'key', sortable: true },
    { title: t('keyManager.columns.value'), key: 'value', sortable: true },
    { title: '', key: 'actions', sortable: false, width: 140 },
]);

async function copyKey(key: string) {
    try {
        await navigator.clipboard.writeText(key);
        app.showMessage(t('common.messages.copyClipboardSuccess'), 'success');
    } catch {
        app.showMessage(t('common.messages.copyClipboardSuccessError'), 'error');
    }
}

async function refresh() {
    loading.value = true;
    selectedKeys.value = [];
    try {
        const r = await etcdListKeys('');
        rows.value = (r.items ?? []).map((it) => ({
            key: it.key,
            value: shortenText(it.value, true),
            tooltip: it.value,
        }));
    } catch (e) {
        app.showMessage(e instanceof Error ? e.message : String(e), 'error');
        rows.value = [];
    } finally {
        loading.value = false;
    }
}

async function softRefreshKeys() {
    if (loading.value) {
        return;
    }
    try {
        const r = await etcdListKeys('');
        rows.value = (r.items ?? []).map((it) => ({
            key: it.key,
            value: shortenText(it.value, true),
            tooltip: it.value,
        }));
    } catch {
        /* keep existing rows */
    }
}

function scheduleSoftRefreshFromWatch() {
    if (softRefreshTimer) {
        clearTimeout(softRefreshTimer);
    }
    softRefreshTimer = setTimeout(() => {
        softRefreshTimer = undefined;
        if (!loading.value && !editorOpen.value) {
            void softRefreshKeys();
        }
    }, 450);
}

function setViewType() {
    view.value = view.value === 'tree' ? 'flat' : 'tree';
    selectedKeys.value = [];
    isOpenAll.value = false;
    treePanelRef.value?.setExpandedAll(false);
}

function toggleOpenAll() {
    isOpenAll.value = !isOpenAll.value;
    treePanelRef.value?.setExpandedAll(isOpenAll.value);
}

function onSeparatorBlur() {
    settings.persistSeparator(separator.value);
}

function openNoSelection() {
    noSelectionDialog.value = true;
}

function deleteMany() {
    if (!selectedKeys.value.length) {
        openNoSelection();
        return;
    }
    deleteBulk.value = true;
    itemToDelete.value = null;
    deleteDialog.value = true;
}

function deleteSingle(row: KeyRow) {
    deleteBulk.value = false;
    itemToDelete.value = row;
    deleteDialog.value = true;
}

function cancelDelete() {
    deleteDialog.value = false;
    itemToDelete.value = null;
}

async function confirmDelete() {
    const keys = deleteBulk.value
        ? [...selectedKeys.value]
        : itemToDelete.value
          ? [itemToDelete.value.key]
          : [];
    if (!keys.length) {
        cancelDelete();
        return;
    }
    loading.value = true;
    try {
        await etcdDeleteKeys(keys);
        app.showMessage(t('common.messages.success'), 'success');
        cancelDelete();
        closeEditor();
        await refresh();
    } catch (e) {
        app.showMessage(e instanceof Error ? e.message : String(e), 'error');
    } finally {
        loading.value = false;
    }
}

function purge() {
    purgeDialog.value = true;
}

function cancelPurge() {
    purgeDialog.value = false;
}

async function confirmPurge() {
    loading.value = true;
    try {
        await etcdPurgeAllKeys();
        app.showMessage(t('common.messages.success'), 'success');
        purgeDialog.value = false;
        closeEditor();
        await refresh();
    } catch (e) {
        app.showMessage(e instanceof Error ? e.message : String(e), 'error');
    } finally {
        loading.value = false;
    }
}

async function touchRow(row: KeyRow) {
    loading.value = true;
    try {
        await etcdTouchKeys([row.key]);
        app.showMessage(t('common.messages.success'), 'success');
        await refresh();
    } catch (e) {
        app.showMessage(e instanceof Error ? e.message : String(e), 'error');
    } finally {
        loading.value = false;
    }
}

async function touchSelected() {
    if (!selectedKeys.value.length) {
        openNoSelection();
        return;
    }
    loading.value = true;
    try {
        await etcdTouchKeys(selectedKeys.value);
        app.showMessage(t('common.messages.success'), 'success');
        await refresh();
    } catch (e) {
        app.showMessage(e instanceof Error ? e.message : String(e), 'error');
    } finally {
        loading.value = false;
    }
}

function closeEditor() {
    editorOpen.value = false;
}

function addItem() {
    closeEditor();
    editorMode.value = 'create';
    editorKey.value = '';
    editorValue.value = '';
    editorOpen.value = true;
}

async function editItem(row: KeyRow) {
    closeEditor();
    editorMode.value = 'edit';
    editorKey.value = row.key;
    loading.value = true;
    try {
        editorValue.value = await etcdGetKey(row.key);
    } catch (e) {
        app.showMessage(e instanceof Error ? e.message : String(e), 'error');
        editorValue.value = row.tooltip;
    } finally {
        loading.value = false;
    }
    editorOpen.value = true;
}

function toggleHelp() {
    helpPanel.value = helpPanel.value === 0 ? null : 0;
}

function bindHotkeys() {
    Mousetrap.bind(['mod+t', 'ctrl+t'], () => {
        void touchSelected();
        return false;
    });
    Mousetrap.bind(['mod+r', 'ctrl+r'], () => {
        deleteMany();
        return false;
    });
    Mousetrap.bind(['mod+h', 'ctrl+h'], () => {
        toggleHelp();
        return false;
    });
    Mousetrap.bind('esc', () => {
        if (editorOpen.value) {
            closeEditor();
        }
        return false;
    });
    Mousetrap.bind(['mod+s', 'ctrl+s'], () => {
        if (editorOpen.value) {
            void editorPanelRef.value?.submit();
        }
        return false;
    });
}

function unbindHotkeys() {
    Mousetrap.unbind(['mod+t', 'ctrl+t', 'mod+r', 'ctrl+r', 'mod+h', 'ctrl+h', 'esc', 'mod+s', 'ctrl+s']);
}

onMounted(() => {
    settings.hydrateFromLocalStorage();
    separator.value = settings.separator;
    void refresh();
    bindHotkeys();
    kvWatchUnsub = EventsOn('etcd:kv', () => scheduleSoftRefreshFromWatch());
    void etcdStartKVWatch();
});

onUnmounted(() => {
    unbindHotkeys();
    kvWatchUnsub?.();
    kvWatchUnsub = undefined;
    void etcdStopKVWatch();
    if (softRefreshTimer) {
        clearTimeout(softRefreshTimer);
    }
});
</script>

<template>
    <v-container fluid class="pa-4">
        <v-expansion-panels v-model="helpPanel" class="mb-3">
            <v-expansion-panel>
                <v-expansion-panel-title>{{ t('keyManager.title') }} — {{ t('common.help.tooltip') }}</v-expansion-panel-title>
                <v-expansion-panel-text>
                    <div class="markdown-help text-body-2" v-html="platform.getHelp(t('keyManager.help.text'))" />
                    <p class="text-caption mt-2">
                        <strong>{{ platform.getMeta() }} + R</strong> — {{ t('common.help.shortcuts.remove') }} ·
                        <strong>{{ platform.getMeta() }} + T</strong> — {{ t('keyManager.help.shortcuts.touch') }} ·
                        <strong>{{ platform.getMeta() }} + S</strong> — {{ t('common.help.shortcuts.save') }} ·
                        <strong>{{ platform.getMeta() }} + H</strong> — {{ t('common.help.shortcuts.help') }} ·
                        <strong>Esc</strong> — {{ t('common.help.shortcuts.closeEditor') }}
                    </p>
                </v-expansion-panel-text>
            </v-expansion-panel>
        </v-expansion-panels>

        <v-row align="start">
            <v-col cols="12" :md="editorOpen ? 7 : 12">
                <v-card variant="outlined">
                    <v-toolbar density="comfortable" flat>
                        <v-toolbar-title>{{ t('keyManager.title') }}</v-toolbar-title>
                        <v-spacer />
                        <v-btn class="me-2" variant="tonal" @click="setViewType">
                            <v-icon start :icon="view === 'tree' ? 'mdi-view-list' : 'mdi-file-tree'" />
                            {{ t(`keyManager.actions.${view === 'tree' ? 'flat' : 'tree'}View`) }}
                        </v-btn>
                        <v-btn v-if="view === 'tree'" class="me-2" variant="tonal" @click="toggleOpenAll">
                            <v-icon start :icon="isOpenAll ? 'mdi-lock' : 'mdi-lock-open-variant'" />
                            {{
                                isOpenAll
                                    ? t('common.actions.openAll.label.close')
                                    : t('common.actions.openAll.label.open')
                            }}
                        </v-btn>
                        <v-text-field
                            v-if="view === 'tree'"
                            v-model="separator"
                            density="compact"
                            hide-details
                            class="me-2"
                            style="max-width: 120px"
                            :label="t('keyManager.treeview.separator')"
                            @blur="onSeparatorBlur"
                        />
                        <v-text-field
                            v-model="filter"
                            hide-details
                            density="compact"
                            clearable
                            prepend-inner-icon="mdi-magnify"
                            :placeholder="t('common.lists.filter')"
                            class="me-2"
                            style="max-width: 260px"
                        />
                        <v-btn color="primary" class="me-2" :loading="loading" @click="refresh">
                            <v-icon start icon="mdi-refresh" />
                            {{ t('keyManager.actions.refresh') }}
                        </v-btn>
                        <v-btn class="me-2" color="primary" variant="tonal" @click="addItem">
                            <v-icon start icon="mdi-plus" />
                            {{ t('common.actions.create.label') }}
                        </v-btn>
                        <v-btn class="me-2" variant="tonal" @click="touchSelected">
                            <v-icon start icon="mdi-hand-back-right" />
                            {{ t('keyManager.actions.touchAll.label') }}
                        </v-btn>
                        <v-btn class="me-2" color="error" variant="tonal" @click="deleteMany">
                            <v-icon start icon="mdi-delete" />
                            {{ t('common.actions.removeAll.label') }}
                        </v-btn>
                        <v-btn color="error" variant="flat" @click="purge">
                            <v-icon start icon="mdi-delete-forever" />
                            {{ t('common.actions.purgeAll.label') }}
                        </v-btn>
                    </v-toolbar>

                    <KeyTreePanel
                        v-if="view === 'tree'"
                        ref="treePanelRef"
                        :nodes="treeData"
                        :model-value="selectedKeys"
                        @update:model-value="selectedKeys = $event"
                        @edit="editItem"
                        @remove="deleteSingle"
                        @touch="touchRow"
                    />

                    <v-data-table
                        v-else
                        v-model="selectedKeys"
                        :headers="flatHeaders"
                        :items="filteredRows"
                        :loading="loading"
                        item-value="key"
                        show-select
                        density="compact"
                        class="elevation-0"
                    >
                        <template #item.key="{ item }">
                            <span class="cursor-copy" @dblclick="copyKey(item.key)">{{ item.key }}</span>
                        </template>
                        <template #item.value="{ item }">
                            <v-tooltip location="bottom" max-width="560">
                                <template #activator="{ props: tip }">
                                    <span v-bind="tip">{{ item.value }}</span>
                                </template>
                                {{ item.tooltip }}
                            </v-tooltip>
                        </template>
                        <template #item.actions="{ item }">
                            <v-btn icon="mdi-pencil" size="small" variant="text" @click="editItem(item)" />
                            <v-btn
                                icon="mdi-delete"
                                size="small"
                                variant="text"
                                color="error"
                                @click="deleteSingle(item)"
                            />
                            <v-btn icon="mdi-hand-back-right" size="small" variant="text" @click="touchRow(item)" />
                        </template>
                    </v-data-table>
                </v-card>
            </v-col>

            <v-col v-if="editorOpen" cols="12" md="5">
                <KeyEditorPanel
                    ref="editorPanelRef"
                    :open="editorOpen"
                    :mode="editorMode"
                    :initial-key="editorKey"
                    :initial-value="editorValue"
                    @close="closeEditor"
                    @saved="void refresh()"
                />
            </v-col>
        </v-row>

        <DeleteConfirmDialog
            v-model="deleteDialog"
            :content-params="{
                type: deleteBulk ? t('common.items.key', 2) : t('common.items.key', 1),
            }"
            @update:model-value="(v: boolean) => {
                if (!v) {
                    cancelDelete();
                }
            }"
            @confirm="confirmDelete"
        />

        <PurgeConfirmDialog
            v-model="purgeDialog"
            :content-params="{ type: t('common.items.key', 2) }"
            @update:model-value="(v: boolean) => {
                if (!v) {
                    cancelPurge();
                }
            }"
            @confirm="confirmPurge"
        />

        <NoSelectionDialog v-model="noSelectionDialog" />
    </v-container>
</template>

<style scoped>
.markdown-help :deep(p) {
    margin-bottom: 0.5rem;
}
.markdown-help :deep(ul) {
    margin: 0.25rem 0 0.5rem 1.25rem;
}
.cursor-copy {
    cursor: copy;
}
</style>
