<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
    modelValue: boolean;
    /** Display text (caller may pass `t('...')` result). */
    message: string;
    title?: string;
    okText?: string;
}>();

const emit = defineEmits<{
    'update:modelValue': [boolean];
    close: [];
}>();

const { t } = useI18n();

const titleText = computed(() => props.title || t('messageDialog.title'));
const okLabel = computed(() => props.okText || t('messageDialog.actions.ok'));

function onClose() {
    emit('update:modelValue', false);
    emit('close');
}
</script>

<template>
    <v-dialog :model-value="modelValue" max-width="360" @update:model-value="emit('update:modelValue', $event)">
        <v-card>
            <v-toolbar density="comfortable" flat>
                <v-toolbar-title>{{ titleText }}</v-toolbar-title>
            </v-toolbar>
            <v-card-text>{{ message }}</v-card-text>
            <v-card-actions>
                <v-spacer />
                <v-btn color="primary" variant="flat" @click="onClose">{{ okLabel }}</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>
