<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import Mousetrap from 'mousetrap';
import WatcherEditorPanel from '@/components/watchers/WatcherEditorPanel.vue';
import DeleteConfirmDialog from '@/components/dialogs/DeleteConfirmDialog.vue';
import PurgeConfirmDialog from '@/components/dialogs/PurgeConfirmDialog.vue';
import NoSelectionDialog from '@/components/dialogs/NoSelectionDialog.vue';
import {
    listWatchers,
    purgeWatchers,
    removeWatchersByName,
    saveWatcher,
} from '@/services/watcherStorage';
import { startUserWatchBackend, stopUserWatchBackend, type WatcherListenerFlags } from '@/services/watcherRuntime';
import type { WatcherEntry } from '@/types/watcher';
import { PlatformService } from '@/services/platform.service';
import { useAppStore } from '@/stores/app';
import { useSettingsStore } from '@/stores/settings';

const { t } = useI18n();
const app = useAppStore();
const settings = useSettingsStore();
const platform = new PlatformService();

const listenerFlags = computed<WatcherListenerFlags>(() => ({
    error: settings.watchers.error,
    disconnects: settings.watchers.disconnects,
    reconnects: settings.watchers.reconnects,
}));

const loading = ref(false);
const rows = ref<WatcherEntry[]>([]);
const filter = ref('');
const selected = ref<string[]>([]);
const editorOpen = ref(false);
const editorMode = ref<'create' | 'edit'>('create');
const editorSeed = ref<Partial<WatcherEntry> | null>(null);
const deleteDialog = ref(false);
const deleteBulk = ref(false);
const pendingDeleteName = ref('');
const purgeDialog = ref(false);
const noSelectionDialog = ref(false);
const helpPanel = ref<number | null>(null);

const filtered = computed(() => {
    const q = filter.value.trim().toLowerCase();
    if (!q) {
        return rows.value;
    }
    return rows.value.filter(
        (w) =>
            w.name.toLowerCase().includes(q) ||
            w.key.toLowerCase().includes(q) ||
            String(w.prefix).includes(q),
    );
});

function load() {
    loading.value = true;
    try {
        rows.value = listWatchers();
    } finally {
        loading.value = false;
    }
}

function addItem() {
    editorMode.value = 'create';
    editorSeed.value = {};
    editorOpen.value = true;
}

function editItem(w: WatcherEntry) {
    editorMode.value = 'edit';
    editorSeed.value = { name: w.name };
    editorOpen.value = true;
}

function closeEditor() {
    editorOpen.value = false;
}

function openNoSelection() {
    noSelectionDialog.value = true;
}

function deleteMany() {
    if (!selected.value.length) {
        openNoSelection();
        return;
    }
    deleteBulk.value = true;
    pendingDeleteName.value = '';
    deleteDialog.value = true;
}

function deleteSingle(w: WatcherEntry) {
    deleteBulk.value = false;
    pendingDeleteName.value = w.name;
    deleteDialog.value = true;
}

function cancelDelete() {
    deleteDialog.value = false;
    pendingDeleteName.value = '';
}

async function confirmDelete() {
    const names = deleteBulk.value ? [...selected.value] : pendingDeleteName.value ? [pendingDeleteName.value] : [];
    if (!names.length) {
        cancelDelete();
        return;
    }
    loading.value = true;
    try {
        for (const n of names) {
            await stopUserWatchBackend(n);
        }
        removeWatchersByName(names);
        app.showMessage(t('common.messages.success'), 'success');
        cancelDelete();
        closeEditor();
        selected.value = [];
        load();
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
        for (const w of rows.value) {
            if (w.activated) {
                await stopUserWatchBackend(w.name);
            }
        }
        purgeWatchers();
        app.showMessage(t('common.messages.success'), 'success');
        purgeDialog.value = false;
        closeEditor();
        selected.value = [];
        load();
    } catch (e) {
        app.showMessage(e instanceof Error ? e.message : String(e), 'error');
    } finally {
        loading.value = false;
    }
}

async function toggleWatcher(w: WatcherEntry) {
    loading.value = true;
    try {
        if (w.activated) {
            await stopUserWatchBackend(w.name);
            saveWatcher({ ...w, activated: false }, false);
        } else {
            await startUserWatchBackend(w, listenerFlags.value);
            saveWatcher({ ...w, activated: true }, false);
        }
        load();
    } catch (e) {
        app.showMessage(e instanceof Error ? e.message : String(e), 'error');
    } finally {
        loading.value = false;
    }
}

async function toggleMany() {
    if (!selected.value.length) {
        noSelectionDialog.value = true;
        return;
    }
    loading.value = true;
    try {
        for (const n of selected.value) {
            const w = rows.value.find((x) => x.name === n);
            if (!w) {
                continue;
            }
            if (w.activated) {
                await stopUserWatchBackend(w.name);
                saveWatcher({ ...w, activated: false }, false);
            } else {
                await startUserWatchBackend(w, listenerFlags.value);
                saveWatcher({ ...w, activated: true }, false);
            }
        }
        load();
    } catch (e) {
        app.showMessage(e instanceof Error ? e.message : String(e), 'error');
    } finally {
        loading.value = false;
    }
}

function toggleHelp() {
    helpPanel.value = helpPanel.value === 0 ? null : 0;
}

function bindHotkeys() {
    Mousetrap.bind(['mod+o', 'ctrl+o'], () => {
        void toggleMany();
        return false;
    });
    Mousetrap.bind(['mod+p', 'ctrl+p'], () => {
        purge();
        return false;
    });
    Mousetrap.bind(['mod+r', 'ctrl+r'], () => {
        deleteMany();
        return false;
    });
    Mousetrap.bind(['mod+a', 'ctrl+a'], () => {
        addItem();
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
}

function unbindHotkeys() {
    Mousetrap.unbind(['mod+o', 'ctrl+o', 'mod+p', 'ctrl+p', 'mod+r', 'ctrl+r', 'mod+a', 'ctrl+a', 'mod+h', 'ctrl+h', 'esc']);
}

onMounted(() => {
    bindHotkeys();
    load();
});

onUnmounted(() => {
    unbindHotkeys();
});
</script>

<template>
    <v-container fluid class="pa-4">
        <v-row align="start">
            <v-col cols="12" :md="editorOpen ? 7 : 12">
                <v-expansion-panels v-model="helpPanel" class="mb-3">
                    <v-expansion-panel>
                        <v-expansion-panel-title>{{ t('watcherManager.title') }} — {{ t('common.help.tooltip') }}</v-expansion-panel-title>
                        <v-expansion-panel-text>
                            <div class="markdown-help text-body-2" v-html="platform.getHelp(t('watcherManager.help.text'))" />
                            <p class="text-caption mt-2">
                                <strong>{{ platform.getMeta() }} + A</strong> — {{ t('common.help.shortcuts.openEditor') }} ·
                                <strong>{{ platform.getMeta() }} + R</strong> — {{ t('common.help.shortcuts.remove') }} ·
                                <strong>{{ platform.getMeta() }} + P</strong> — {{ t('common.help.shortcuts.purge') }} ·
                                <strong>{{ platform.getMeta() }} + O</strong> — {{ t('watcherManager.help.shortcuts.toggle') }} ·
                                <strong>{{ platform.getMeta() }} + H</strong> — {{ t('common.help.shortcuts.help') }} ·
                                <strong>Esc</strong> — {{ t('common.help.shortcuts.closeEditor') }}
                            </p>
                        </v-expansion-panel-text>
                    </v-expansion-panel>
                </v-expansion-panels>

                <v-card variant="outlined">
                    <v-toolbar density="comfortable" flat>
                        <v-toolbar-title>{{ t('watcherManager.title') }}</v-toolbar-title>
                        <v-spacer />
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
                        <v-btn color="error" class="me-2" variant="tonal" @click="purge">
                            <v-icon start icon="mdi-delete-forever" />
                            {{ t('common.actions.purgeAll.label') }}
                        </v-btn>
                        <v-btn class="me-2" color="primary" variant="tonal" @click="toggleMany">
                            <v-icon start icon="mdi-bell" />
                            {{ t('watcherManager.actions.notificationToggle.label') }}
                        </v-btn>
                        <v-btn class="me-2" color="primary" variant="tonal" @click="deleteMany">
                            <v-icon start icon="mdi-delete" />
                            {{ t('common.actions.removeAll.label') }}
                        </v-btn>
                        <v-btn color="primary" variant="tonal" class="me-2" @click="addItem">
                            <v-icon start icon="mdi-plus" />
                            {{ t('common.actions.create.label') }}
                        </v-btn>
                        <v-btn color="primary" :loading="loading" @click="load">
                            <v-icon start icon="mdi-refresh" />
                            {{ t('keyManager.actions.refresh') }}
                        </v-btn>
                    </v-toolbar>

                    <v-data-table
                        v-model="selected"
                        density="compact"
                        :headers="[
                            { title: t('watcherManager.columns.name'), key: 'name', sortable: true },
                            { title: t('watcherManager.columns.key'), key: 'key', sortable: true },
                            { title: t('watcherManager.columns.prefix'), key: 'prefix', sortable: true },
                            { title: '', key: 'actions', sortable: false, width: 140 },
                        ]"
                        :items="filtered"
                        :loading="loading"
                        item-value="name"
                        show-select
                    >
                        <template #item.prefix="{ item }">
                            <v-icon :icon="item.prefix ? 'mdi-check' : 'mdi-close'" size="small" />
                        </template>
                        <template #item.actions="{ item }">
                            <v-btn icon="mdi-pencil" size="small" variant="text" @click="editItem(item)" />
                            <v-btn icon="mdi-delete" size="small" variant="text" color="error" @click="deleteSingle(item)" />
                            <v-btn
                                :icon="item.activated ? 'mdi-bell' : 'mdi-bell-off'"
                                size="small"
                                variant="text"
                                @click="toggleWatcher(item)"
                            />
                        </template>
                    </v-data-table>
                </v-card>
            </v-col>

            <v-col v-if="editorOpen" cols="12" md="5">
                <WatcherEditorPanel
                    :open="editorOpen"
                    :mode="editorMode"
                    :seed="editorSeed"
                    @close="closeEditor"
                    @reload="load"
                />
            </v-col>
        </v-row>

        <DeleteConfirmDialog
            v-model="deleteDialog"
            :content-params="{
                type: deleteBulk ? t('common.items.watcher', 2) : pendingDeleteName,
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
            :content-params="{ type: t('common.items.watcher', 2) }"
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
</style>
