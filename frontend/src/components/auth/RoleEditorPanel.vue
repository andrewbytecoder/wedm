<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import Mousetrap from 'mousetrap';
import PermissionEditorForm from '@/components/auth/PermissionEditorForm.vue';
import { etcdAuthRoleGet, etcdAuthRoleRevokePermission, type RolePermRow } from '@/services/etcdBridge';
import { PlatformService } from '@/services/platform.service';
import { useAppStore } from '@/stores/app';

const props = defineProps<{
    open: boolean;
    roleName: string;
}>();

const emit = defineEmits<{
    close: [];
}>();

const { t } = useI18n();
const app = useAppStore();
const platform = new PlatformService();

const loading = ref(false);
const perms = ref<RolePermRow[]>([]);
const helpPanel = ref<number | null>(null);

const headers = computed(() => [
    { title: t('roleEditor.columns.key'), key: 'keyDisplay', sortable: true },
    { title: t('roleEditor.columns.prefix'), key: 'isPrefix', sortable: true },
    { title: t('roleEditor.columns.permission'), key: 'perm', sortable: true },
    { title: '', key: 'actions', sortable: false, width: 80 },
]);

async function loadPerms() {
    if (!props.roleName) {
        perms.value = [];
        return;
    }
    loading.value = true;
    try {
        perms.value = await etcdAuthRoleGet(props.roleName);
    } catch (e) {
        app.showMessage(e instanceof Error ? e.message : String(e), 'error');
        perms.value = [];
    } finally {
        loading.value = false;
    }
}

watch(
    () => [props.open, props.roleName] as const,
    ([open]) => {
        if (open) {
            void loadPerms();
        }
    },
    { immediate: true },
);

async function revoke(row: RolePermRow) {
    loading.value = true;
    try {
        await etcdAuthRoleRevokePermission({
            role: props.roleName,
            keyB64: row.keyB64,
            rangeEndB64: row.rangeEndB64,
        });
        app.showMessage(t('common.messages.success'), 'success');
        await loadPerms();
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
    Mousetrap.bind(['mod+h', 'ctrl+h'], () => {
        toggleHelp();
        return false;
    });
    Mousetrap.bind('esc', () => {
        if (props.open) {
            emit('close');
        }
        return false;
    });
}

function unbindHotkeys() {
    Mousetrap.unbind(['mod+h', 'ctrl+h', 'esc']);
}

watch(
    () => props.open,
    (open) => {
        unbindHotkeys();
        if (open) {
            bindHotkeys();
        }
    },
);

onUnmounted(() => {
    unbindHotkeys();
});
</script>

<template>
    <v-card v-if="open" variant="outlined">
        <v-expansion-panels v-model="helpPanel" class="mb-2">
            <v-expansion-panel>
                <v-expansion-panel-title>{{ t('roleManager.title') }} — {{ t('common.help.tooltip') }}</v-expansion-panel-title>
                <v-expansion-panel-text>
                    <div class="markdown-help text-body-2" v-html="platform.getHelp(t('roleEditor.help.text'))" />
                    <p class="text-caption mt-2">
                        <strong>{{ platform.getMeta() }} + H</strong> — {{ t('common.help.shortcuts.help') }} ·
                        <strong>Esc</strong> — {{ t('common.help.shortcuts.closeEditor') }}
                    </p>
                </v-expansion-panel-text>
            </v-expansion-panel>
        </v-expansion-panels>

        <v-toolbar density="comfortable" flat>
            <v-toolbar-title>{{ props.roleName }}</v-toolbar-title>
            <v-spacer />
            <v-btn variant="text" @click="emit('close')">{{ t('common.actions.close.label') }}</v-btn>
        </v-toolbar>

        <v-card-text>
            <PermissionEditorForm :role-name="props.roleName" @granted="void loadPerms()" />

            <v-data-table
                class="mt-4"
                density="compact"
                :headers="headers"
                :items="perms"
                :loading="loading"
                item-value="keyB64"
            >
                <template #item.isPrefix="{ item }">
                    <v-icon :icon="item.isPrefix ? 'mdi-check' : 'mdi-close'" size="small" />
                </template>
                <template #item.actions="{ item }">
                    <v-btn icon="mdi-delete" size="small" variant="text" color="error" @click="revoke(item)" />
                </template>
            </v-data-table>
        </v-card-text>
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
