<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import Mousetrap from 'mousetrap';
import ActionEditorDialog from '@/components/watchers/ActionEditorDialog.vue';
import { loadWatcher, saveWatcher } from '@/services/watcherStorage';
import { stopUserWatchBackend } from '@/services/watcherRuntime';
import type { WatcherAction, WatcherEntry } from '@/types/watcher';
import { PlatformService } from '@/services/platform.service';
import { useAppStore } from '@/stores/app';

const props = defineProps<{
    open: boolean;
    mode: 'create' | 'edit';
    /** Seed when opening (edit: existing row) */
    seed: Partial<WatcherEntry> | null;
}>();

const emit = defineEmits<{
    close: [];
    reload: [];
}>();

const { t } = useI18n();
const app = useAppStore();
const platform = new PlatformService();

const name = ref('');
const key = ref('');
const prefix = ref(false);
const actions = ref<WatcherAction[]>([]);
const helpPanel = ref<number | null>(null);
const actionDialog = ref(false);
const actionMode = ref<'create' | 'edit'>('create');
const editingAction = ref<WatcherAction | null>(null);

const defaultAction = (): WatcherAction => ({
    id: '',
    action: { name: 'Print to console', value: 0, type: 1 },
    event: { name: 'put', value: 0, type: 2 },
});

const nameErrors = computed(() => {
    const n = name.value.trim();
    if (!n) {
        return [t('common.validation.required')];
    }
    if (!/^[a-zA-Z0-9]+$/.test(n)) {
        return [t('common.validation.alphanumeric')];
    }
    return [] as string[];
});

const keyErrors = computed(() => {
    if (!key.value.trim()) {
        return [t('common.validation.required')];
    }
    return [] as string[];
});

const formOk = computed(
    () => nameErrors.value.length === 0 && keyErrors.value.length === 0 && actions.value.length > 0,
);

const actionHeaders = computed(() => [
    { title: t('watcherEditor.actionList.columns.action'), key: 'actionName', sortable: true },
    { title: t('watcherEditor.actionList.columns.event'), key: 'eventName', sortable: true },
    { title: '', key: 'actions', sortable: false, width: 100 },
]);

const actionRows = computed(() =>
    actions.value.map((a) => ({
        id: a.id,
        actionName: a.action.name,
        eventName: a.event.name,
        raw: a,
    })),
);

watch(
    () => [props.open, props.mode, props.seed] as const,
    ([open, mode, seed]) => {
        if (!open) {
            return;
        }
        if (mode === 'create') {
            name.value = '';
            key.value = '';
            prefix.value = false;
            actions.value = [];
        } else if (seed?.name) {
            const w = loadWatcher(seed.name) || (seed as WatcherEntry);
            name.value = w.name;
            key.value = w.key;
            prefix.value = Boolean(w.prefix);
            actions.value = (w.actions || []).map((a) => ({ ...a, id: a.id || crypto.randomUUID() }));
        }
    },
);

function openAddAction() {
    actionMode.value = 'create';
    editingAction.value = defaultAction();
    actionDialog.value = true;
}

function openEditAction(row: { raw: WatcherAction }) {
    actionMode.value = 'edit';
    editingAction.value = { ...row.raw, action: { ...row.raw.action }, event: { ...row.raw.event } };
    actionDialog.value = true;
}

function onSaveAction(act: WatcherAction) {
    if (actionMode.value === 'create') {
        const dup = actions.value.some(
            (x) => x.action.name === act.action.name && x.event.name === act.event.name,
        );
        if (dup) {
            app.showMessage(t('watcherEditor.messages.duplicateAction'), 'error');
            return;
        }
        actions.value.push({ ...act, id: crypto.randomUUID() });
    } else if (editingAction.value?.id) {
        const idx = actions.value.findIndex((x) => x.id === editingAction.value!.id);
        if (idx !== -1) {
            actions.value[idx] = { ...act, id: editingAction.value.id };
            actions.value = [...actions.value];
        }
    }
    actionDialog.value = false;
}

function removeAction(row: { raw: WatcherAction }) {
    actions.value = actions.value.filter((a) => a.id !== row.raw.id);
}

async function submit() {
    if (!formOk.value) {
        return;
    }
    const ok = saveWatcher(
        {
            name: name.value.trim(),
            key: key.value.trim(),
            prefix: prefix.value,
            activated: false,
            actions: actions.value.map((a) => ({ ...a })),
        },
        props.mode === 'create',
    );
    if (!ok) {
        app.showMessage(t('watcherEditor.messages.duplicate'), 'error');
        return;
    }
    await stopUserWatchBackend(name.value.trim());
    app.showMessage(t('common.messages.success'), 'success');
    emit('reload');
    if (props.mode === 'create') {
        name.value = '';
        key.value = '';
        prefix.value = false;
        actions.value = [];
    }
}

function bindHotkeys() {
    Mousetrap.bind(['mod+x', 'ctrl+x'], () => {
        if (props.open) {
            openAddAction();
        }
        return false;
    });
    Mousetrap.bind(['mod+h', 'ctrl+h'], () => {
        helpPanel.value = helpPanel.value === 0 ? null : 0;
        return false;
    });
    Mousetrap.bind('esc', () => {
        if (props.open) {
            emit('close');
        }
        return false;
    });
}

function unbind() {
    Mousetrap.unbind(['mod+x', 'ctrl+x', 'mod+h', 'ctrl+h', 'esc']);
}

watch(
    () => props.open,
    (open) => {
        unbind();
        if (open) {
            bindHotkeys();
        }
    },
);

onMounted(() => {
    if (props.open) {
        bindHotkeys();
    }
});

onUnmounted(() => {
    unbind();
});
</script>

<template>
    <v-card v-if="open" variant="outlined">
        <v-expansion-panels v-model="helpPanel" class="mb-2">
            <v-expansion-panel>
                <v-expansion-panel-title>{{ t('watcherManager.title') }} — {{ t('common.help.tooltip') }}</v-expansion-panel-title>
                <v-expansion-panel-text>
                    <div class="markdown-help text-body-2" v-html="platform.getHelp(t('watcherEditor.help.text'))" />
                    <p class="text-caption mt-2">
                        <strong>{{ platform.getMeta() }} + X</strong> — {{ t('watcherEditor.help.shortcuts.addAction') }} ·
                        <strong>{{ platform.getMeta() }} + H</strong> — {{ t('common.help.shortcuts.help') }} ·
                        <strong>Esc</strong> — {{ t('common.help.shortcuts.closeEditor') }}
                    </p>
                </v-expansion-panel-text>
            </v-expansion-panel>
        </v-expansion-panels>

        <v-toolbar density="comfortable" flat>
            <v-toolbar-title>{{ mode === 'create' ? t('common.titles.new') : name }}</v-toolbar-title>
            <v-spacer />
            <v-btn variant="text" @click="emit('close')">{{ t('common.actions.close.label') }}</v-btn>
        </v-toolbar>

        <v-card-text>
            <v-text-field
                v-model="name"
                density="comfortable"
                :readonly="mode === 'edit'"
                :label="t('watcherEditor.fields.name.label')"
                :placeholder="t('watcherEditor.fields.name.placeholder')"
                :error-messages="nameErrors"
            />
            <v-text-field
                v-model="key"
                density="comfortable"
                :label="t('watcherEditor.fields.key.label')"
                :placeholder="t('watcherEditor.fields.key.placeholder')"
                :error-messages="keyErrors"
            />
            <v-checkbox v-model="prefix" density="comfortable" :label="t('watcherEditor.fields.prefix.label')" />

            <v-data-table
                class="mt-2"
                density="compact"
                :headers="actionHeaders"
                :items="actionRows"
                item-value="id"
            >
                <template #item.actions="{ item }">
                    <v-btn icon="mdi-pencil" size="small" variant="text" @click="openEditAction(item)" />
                    <v-btn icon="mdi-delete" size="small" variant="text" color="error" @click="removeAction(item)" />
                </template>
            </v-data-table>

            <div class="d-flex flex-wrap gap-2 mt-4">
                <v-btn color="primary" :disabled="!formOk" @click="submit">
                    <v-icon start icon="mdi-content-save" />
                    {{ mode === 'create' ? t('common.actions.create.label') : t('common.actions.save') }}
                </v-btn>
                <v-btn color="primary" variant="tonal" @click="openAddAction">
                    <v-icon start icon="mdi-plus" />
                    {{ t('watcherEditor.actions.actions.label') }}
                </v-btn>
                <v-btn variant="text" @click="emit('close')">{{ t('common.actions.close.label') }}</v-btn>
            </div>
        </v-card-text>

        <ActionEditorDialog
            v-model="actionDialog"
            :mode="actionMode"
            :initial="editingAction || defaultAction()"
            @save="onSaveAction"
        />
    </v-card>
</template>

<style scoped>
.markdown-help :deep(p) {
    margin-bottom: 0.5rem;
}
.markdown-help :deep(ul) {
    margin: 0.25rem 0 0.5rem 1.25rem;
}
</style>
