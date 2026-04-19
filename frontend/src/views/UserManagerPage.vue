<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import UserEditorPanel from '@/components/auth/UserEditorPanel.vue';
import DeleteConfirmDialog from '@/components/dialogs/DeleteConfirmDialog.vue';
import { etcdAuthRoleList, etcdAuthUserDelete, etcdAuthUserList } from '@/services/etcdBridge';
import { useAppStore } from '@/stores/app';
import { useSettingsStore } from '@/stores/settings';

const { t } = useI18n();
const app = useAppStore();
const settings = useSettingsStore();

const loading = ref(false);
const users = ref<string[]>([]);
const roles = ref<string[]>([]);
const filter = ref('');
const editorOpen = ref(false);
const editorMode = ref<'create' | 'edit'>('create');
const editName = ref('');
const delOpen = ref(false);
const pendingDelete = ref('');

const filteredUsers = computed(() => {
    const q = filter.value.trim().toLowerCase();
    if (!q) {
        return users.value;
    }
    return users.value.filter((u) => u.toLowerCase().includes(q));
});

async function load() {
    loading.value = true;
    try {
        const [u, r] = await Promise.all([etcdAuthUserList(), etcdAuthRoleList()]);
        users.value = u;
        roles.value = r;
    } catch (e) {
        app.showMessage(e instanceof Error ? e.message : String(e), 'error');
        users.value = [];
        roles.value = [];
    } finally {
        loading.value = false;
    }
}

function openCreate() {
    editorMode.value = 'create';
    editName.value = '';
    editorOpen.value = true;
}

function openEdit(name: string) {
    editorMode.value = 'edit';
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

async function confirmDelete() {
    const name = pendingDelete.value;
    if (!name) {
        return;
    }
    loading.value = true;
    try {
        await etcdAuthUserDelete(name);
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

function onDeleteDialogClosed(v: boolean) {
    if (!v) {
        pendingDelete.value = '';
    }
}

onMounted(() => {
    settings.hydrateFromLocalStorage();
    void load();
});
</script>

<template>
    <v-container fluid class="pa-4">
        <v-row align="start">
            <v-col cols="12" :md="editorOpen ? 7 : 12">
                <v-card variant="outlined">
                    <v-toolbar density="comfortable" flat>
                        <v-toolbar-title>{{ t('userManager.title') }}</v-toolbar-title>
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
                        <v-btn color="primary" variant="tonal" @click="openCreate">
                            <v-icon start icon="mdi-account-plus" />
                            {{ t('common.actions.create.label') }}
                        </v-btn>
                    </v-toolbar>
                    <v-data-table
                        density="compact"
                        :headers="[
                            { title: t('userManager.columns.name'), key: 'name', sortable: true },
                            { title: '', key: 'actions', sortable: false, width: 120 },
                        ]"
                        :items="filteredUsers.map((name) => ({ name }))"
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
                <UserEditorPanel
                    :open="editorOpen"
                    :mode="editorMode"
                    :user-name="editName"
                    :all-roles="roles"
                    @close="closeEditor"
                    @saved="void load()"
                />
            </v-col>
        </v-row>

        <DeleteConfirmDialog
            v-model="delOpen"
            :content-params="{ type: pendingDelete }"
            @update:model-value="onDeleteDialogClosed"
            @confirm="confirmDelete"
        />
    </v-container>
</template>
