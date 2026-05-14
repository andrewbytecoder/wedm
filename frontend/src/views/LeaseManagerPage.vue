<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useHotkey } from 'vuetify';
import LeaseEditorPanel from '@/components/leases/LeaseEditorPanel.vue';
import DeleteConfirmDialog from '@/components/dialogs/DeleteConfirmDialog.vue';
import PurgeConfirmDialog from '@/components/dialogs/PurgeConfirmDialog.vue';
import NoSelectionDialog from '@/components/dialogs/NoSelectionDialog.vue';
import { etcdLeaseList, etcdLeasePurgeAll, etcdLeaseRevoke } from '@/services/etcdBridge';
import { PlatformService } from '@/services/platform.service';
import { useAppStore } from '@/stores/app';

const { t } = useI18n();
const app = useAppStore();
const platform = new PlatformService();

const loading = ref(false);
const items = ref<{ id: string; ttl: number }[]>([]);
const filter = ref('');
const selected = ref<string[]>([]);
const editorOpen = ref(false);
const editId = ref('');
const deleteDialog = ref(false);
const deleteBulk = ref(false);
const pendingSingleId = ref('');
const purgeDialog = ref(false);
const noSelectionDialog = ref(false);
const helpPanel = ref<number | null>(null);

const filteredItems = computed(() => {
    const q = filter.value.trim().toLowerCase();
    if (!q) {
        return items.value;
    }
    return items.value.filter((it) => it.id.includes(q) || String(it.ttl).includes(q));
});

async function load() {
    loading.value = true;
    try {
        items.value = await etcdLeaseList();
    } catch (e) {
        app.showMessage(e instanceof Error ? e.message : String(e), 'error');
        items.value = [];
    } finally {
        loading.value = false;
    }
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
    pendingSingleId.value = '';
    deleteDialog.value = true;
}

function deleteSingle(id: string) {
    deleteBulk.value = false;
    pendingSingleId.value = id;
    deleteDialog.value = true;
}

function cancelDelete() {
    deleteDialog.value = false;
    pendingSingleId.value = '';
}

async function confirmDelete() {
    const ids = deleteBulk.value ? [...selected.value] : pendingSingleId.value ? [pendingSingleId.value] : [];
    if (!ids.length) {
        cancelDelete();
        return;
    }
    loading.value = true;
    try {
        for (const id of ids) {
            await etcdLeaseRevoke(id);
        }
        app.showMessage(t('common.messages.success'), 'success');
        cancelDelete();
        closeEditor();
        selected.value = [];
        await load();
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
        await etcdLeasePurgeAll();
        app.showMessage(t('common.messages.success'), 'success');
        purgeDialog.value = false;
        closeEditor();
        selected.value = [];
        await load();
    } catch (e) {
        app.showMessage(e instanceof Error ? e.message : String(e), 'error');
    } finally {
        loading.value = false;
    }
}

function openEditor(id: string) {
    editId.value = id;
    editorOpen.value = true;
}

function closeEditor() {
    editorOpen.value = false;
}

function toggleHelp() {
    helpPanel.value = helpPanel.value === 0 ? null : 0;
}

function tryOpenEditorFromSelection() {
    if (!selected.value.length) {
        openNoSelection();
        return;
    }
    openEditor(selected.value[0]);
}

/** useHotkey 在原生 input 聚焦时不触发；行勾选后焦点留在 checkbox 上，需移开焦点快捷键才生效 */
function onTableSelectionChange(_rows: string[]) {
    //  勾选之后只要鼠标移动走，焦点就自动移开，避免快捷键失效
    void nextTick(() => {
        const active = document.activeElement;
        if (
            active instanceof HTMLInputElement &&
            active.type === 'checkbox' &&
            active.closest('.v-data-table')
        ) {
            active.blur();
        }
    });
}

useHotkey('ctrl+a', (e) => {
    e.preventDefault();
    tryOpenEditorFromSelection();
});

useHotkey('ctrl+r', (e) => {
    e.preventDefault();
    deleteMany();
});

useHotkey('ctrl+p', (e) => {
    e.preventDefault();
    purge();
});

useHotkey('ctrl+h', (e) => {
    e.preventDefault();
    toggleHelp();
});

useHotkey('esc', (e) => {
    e.preventDefault();
    if (editorOpen.value) {
        closeEditor();
    }
});

onMounted(() => {
    void load();
});
</script>

<template>
    <v-container fluid class="pa-4">
        <v-row align="start">
            <v-col cols="12" :md="editorOpen ? 7 : 12">
                <v-expansion-panels v-model="helpPanel" class="mb-3">
                    <v-expansion-panel>
                        <v-expansion-panel-title>{{ t('leaseManager.title') }} — {{ t('common.help.tooltip') }}</v-expansion-panel-title>
                        <v-expansion-panel-text>
                            <div class="markdown-help text-body-2" v-html="platform.getHelp(t('leaseManager.help.text'))" />
                            <p class="text-caption mt-2">
                                <strong>Ctrl + A</strong> — {{ t('common.help.shortcuts.openEditor') }} ·
                                <strong>Ctrl + R</strong> — {{ t('common.help.shortcuts.remove') }} ·
                                <strong>Ctrl + P</strong> — {{ t('common.help.shortcuts.purge') }} ·
                                <strong>Ctrl + H</strong> — {{ t('common.help.shortcuts.help') }} ·
                                <strong>Esc</strong> — {{ t('common.help.shortcuts.closeEditor') }}
                            </p>
                        </v-expansion-panel-text>
                    </v-expansion-panel>
                </v-expansion-panels>

                <v-card variant="outlined">
                    <v-toolbar density="comfortable" flat>
                        <v-toolbar-title>{{ t('leaseManager.title') }}</v-toolbar-title>
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
                        <v-btn class="me-2" color="primary" variant="tonal" @click="deleteMany">
                            <v-icon start icon="mdi-delete" />
                            {{ t('common.actions.removeAll.label') }}
                        </v-btn>
                        <v-btn color="primary" :loading="loading" @click="load">
                            <v-icon start icon="mdi-refresh" />
                            {{ t('keyManager.actions.refresh') }}
                        </v-btn>
                    </v-toolbar>
                    <v-data-table
                        v-model="selected"
                        density="compact"
                        @update:model-value="onTableSelectionChange"
                        :headers="[
                            { title: t('leaseManager.columns.id'), key: 'id', sortable: true },
                            { title: t('leaseEditor.fields.grant.label'), key: 'ttl', sortable: true },
                            { title: '', key: 'actions', sortable: false, width: 120 },
                        ]"
                        :items="filteredItems"
                        :loading="loading"
                        item-value="id"
                        show-select
                    >
                        <template #item.actions="{ item }">
                            <v-btn
                                icon="mdi-eye"
                                size="small"
                                variant="text"
                                @click="openEditor(item.id)"
                            />
                            <v-btn
                                icon="mdi-delete"
                                size="small"
                                variant="text"
                                color="error"
                                @click="deleteSingle(item.id)"
                            />
                        </template>
                    </v-data-table>
                </v-card>
            </v-col>

            <v-col v-if="editorOpen" cols="12" md="5">
                <LeaseEditorPanel :open="editorOpen" :lease-id="editId" @close="closeEditor" />
            </v-col>
        </v-row>

        <DeleteConfirmDialog
            v-model="deleteDialog"
            :content-params="{
                type: deleteBulk ? t('common.items.lease', 2) : t('common.items.lease', 1),
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
            :content-params="{ type: t('common.items.lease', 2) }"
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
