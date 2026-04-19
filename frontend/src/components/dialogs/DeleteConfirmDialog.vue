<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

defineProps<{
    modelValue: boolean;
    contentParams: Record<string, unknown>;
}>();

const emit = defineEmits<{
    'update:modelValue': [boolean];
    confirm: [];
    cancel: [];
}>();

function onCancel() {
    emit('update:modelValue', false);
    emit('cancel');
}

function onConfirm() {
    emit('confirm');
}
</script>

<template>
    <v-dialog :model-value="modelValue" max-width="440" @update:model-value="emit('update:modelValue', $event)">
        <v-card>
            <v-card-title>{{ t('deleteDialog.title') }}</v-card-title>
            <v-card-text>{{ t('deleteDialog.content', contentParams) }}</v-card-text>
            <v-card-actions>
                <v-spacer />
                <v-btn variant="text" @click="onCancel">{{ t('deleteDialog.actions.cancel') }}</v-btn>
                <v-btn color="error" variant="flat" @click="onConfirm">{{ t('deleteDialog.actions.remove') }}</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>
