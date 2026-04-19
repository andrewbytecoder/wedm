<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import RoleEditorPanel from '@/components/auth/RoleEditorPanel.vue';
import DeleteConfirmDialog from '@/components/dialogs/DeleteConfirmDialog.vue';
import { etcdAuthRoleAdd, etcdAuthRoleDelete, etcdAuthRoleList } from '@/services/etcdBridge';
import { useAppStore } from '@/stores/app';

const { t } = useI18n();
const app = useAppStore();

const loading = ref(false);
const roles = ref<string[]>([]);
const filter = ref('');
const addOpen = ref(false);
const newName = ref('');
const delOpen = ref(false);
const pendingDelete = ref('');
const editorOpen = ref(false);
const editName = ref('');

const filteredRoles = computed(() => {
    const q = filter.value.trim().toLowerCase();
    if (!q) {
        return roles.value;
    }
    return roles.value.filter((r) => r.toLowerCase().includes(q));
});

async function load() {
    loading.value = true;
    try {
        roles.value = await etcdAuthRoleList();
    } catch (e) {
        app.showMessage(e instanceof Error ? e.message : String(e), 'error');
        roles.value = [];
    } finally {
        loading.value = false;
    }
}

async function addRole() {
    if (!newName.value.trim()) {
        return;
    }
    loading.value = true;
    try {
        await etcdAuthRoleAdd(newName.value.trim());
        app.showMessage(t('common.messages.success'), 'success');
        addOpen.value = false;
        newName.value = '';
        await load();
    } catch (e) {
        app.showMessage(e instanceof Error ? e.message : String(e), 'error');
    } finally {
        loading.value = false;
    }
}

function openEdit(name: string) {
    editName.value = name;
    editorOpen.value = true;
}

function closeEditor() {
    editorOpen.value = false;
}

function askDelete(name: string) {
    pendingDelete.value = name;
    delOpen.value = true;
}

function onDeleteDialogClosed(v: boolean) {
    if (!v) {
        pendingDelete.value = '';
    }
}

async function confirmDelete() {
    const name = pendingDelete.value;
    if (!name) {
        return;
    }
    loading.value = true;
    try {
        await etcdAuthRoleDelete(name);
        app.showMessage(t('common.messages.success'), 'success');
        delOpen.value = false;
        pendingDelete.value = '';
        if (editName.value === name) {
            closeEditor();
        }
        await load();
    } catch (e) {
        app.showMessage(e instanceof Error ? e.message : String(e), 'error');
    } finally {
        loading.value = false;
    }
}

onMounted(() => {
    void load();
});
</script>

<template>
    <v-container fluid class="pa-4">
        <v-row align="start">
            <v-col cols="12" :md="editorOpen ? 7 : 12">
                <v-card variant="outlined">
                    <v-toolbar density="comfortable" flat>
                        <v-toolbar-title>{{ t('roleManager.title') }}</v-toolbar-title>
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
                        <v-btn color="primary" class="me-2" :loading="loading" @click="load">
                            <v-icon start icon="mdi-refresh" />
                            {{ t('keyManager.actions.refresh') }}
                        </v-btn>
                        <v-btn color="primary" variant="tonal" @click="addOpen = true">
                            <v-icon start icon="mdi-shield-plus" />
                            {{ t('common.actions.create.label') }}
                        </v-btn>
                    </v-toolbar>
                    <v-data-table
                        density="compact"
                        :headers="[
                            { title: t('roleManager.columns.name'), key: 'name', sortable: true },
                            { title: '', key: 'actions', sortable: false, width: 120 },
                        ]"
                        :items="filteredRoles.map((name) => ({ name }))"
                        :loading="loading"
                        item-value="name"
                    >
                        <template #item.actions="{ item }">
                            <v-btn icon="mdi-pencil" size="small" variant="text" @click="openEdit(item.name)" />
                            <v-btn
                                icon="mdi-delete"
                                size="small"
                                variant="text"
                                color="error"
                                :disabled="item.name === 'root'"
                                @click="askDelete(item.name)"
                            />
                        </template>
                    </v-data-table>
                </v-card>
            </v-col>

            <v-col v-if="editorOpen" cols="12" md="5">
                <RoleEditorPanel :open="editorOpen" :role-name="editName" @close="closeEditor" />
            </v-col>
        </v-row>

        <v-dialog v-model="addOpen" max-width="420">
            <v-card>
                <v-card-title>{{ t('common.actions.create.label') }}</v-card-title>
                <v-card-text>
                    <v-text-field v-model="newName" :label="t('roleEditor.fields.name.label')" density="comfortable" />
                </v-card-text>
                <v-card-actions>
                    <v-spacer />
                    <v-btn variant="text" @click="addOpen = false">{{ t('deleteDialog.actions.cancel') }}</v-btn>
                    <v-btn color="primary" @click="addRole">{{ t('common.actions.create.label') }}</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <DeleteConfirmDialog
            v-model="delOpen"
            :content-params="{ type: pendingDelete }"
            @update:model-value="onDeleteDialogClosed"
            @confirm="confirmDelete"
        />
    </v-container>
</template>
