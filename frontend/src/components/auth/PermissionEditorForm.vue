<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { etcdAuthRoleGrantPermission } from '@/services/etcdBridge';
import { useAppStore } from '@/stores/app';

const props = defineProps<{
    roleName: string;
}>();

const emit = defineEmits<{
    granted: [];
}>();

const { t } = useI18n();
const app = useAppStore();

const radios = ref<'normal' | 'prefix' | 'all'>('normal');
const key = ref('');
const perm = ref<'Read' | 'Write' | 'Readwrite'>('Read');
const granting = ref(false);

const permItems = computed(() => [
    { title: 'Read', value: 'Read' as const },
    { title: 'Write', value: 'Write' as const },
    { title: 'Read & Write', value: 'Readwrite' as const },
]);

const keyErrors = computed(() => {
    if (radios.value === 'all') {
        return [] as string[];
    }
    const k = key.value.trim();
    if (!k) {
        return [t('common.validation.required')];
    }
    return [];
});

const formOk = computed(() => {
    if (!props.roleName) {
        return false;
    }
    if (radios.value === 'all') {
        return true;
    }
    return keyErrors.value.length === 0;
});

watch(
    () => props.roleName,
    () => {
        key.value = '';
        radios.value = 'normal';
        perm.value = 'Read';
    },
);

watch(radios, (m) => {
    if (m === 'all') {
        key.value = '';
    }
});

async function grant() {
    if (!formOk.value) {
        return;
    }
    granting.value = true;
    try {
        await etcdAuthRoleGrantPermission({
            role: props.roleName,
            mode: radios.value,
            key: key.value.trim(),
            perm: perm.value,
            checkDuplicate: true,
        });
        app.showMessage(t('common.messages.success'), 'success');
        emit('granted');
        key.value = '';
        radios.value = 'normal';
        perm.value = 'Read';
    } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (msg.includes('duplicate permission')) {
            app.showMessage(t('permissionEditor.messages.duplicateKey'), 'error');
        } else {
            app.showMessage(msg, 'error');
        }
    } finally {
        granting.value = false;
    }
}
</script>

<template>
    <v-card variant="tonal" class="pa-2">
        <v-card-subtitle class="text-subtitle-1">{{ t('roleEditor.actions.permissions') }}</v-card-subtitle>
        <v-card-text>
            <v-text-field
                v-if="radios !== 'all'"
                v-model="key"
                density="comfortable"
                :label="t('permissionEditor.fields.key.label')"
                :placeholder="t('permissionEditor.fields.key.placeholder')"
                :error-messages="keyErrors"
            />
            <v-radio-group v-model="radios" inline density="comfortable" hide-details class="mb-2">
                <v-radio value="prefix" :label="t('permissionEditor.fields.prefix.label')" />
                <v-radio value="normal" :label="t('permissionEditor.fields.normal.label')" />
                <v-radio value="all" :label="t('permissionEditor.fields.all.label')" />
            </v-radio-group>
            <v-select
                v-model="perm"
                :items="permItems"
                item-title="title"
                item-value="value"
                density="comfortable"
                :label="t('permissionEditor.fields.permission.label')"
            />
            <v-btn color="primary" :disabled="!formOk" :loading="granting" class="mt-2" @click="grant">
                <v-icon start icon="mdi-plus" />
                {{ t('permissionEditor.actions.grant.label') }}
            </v-btn>
        </v-card-text>
    </v-card>
</template>
