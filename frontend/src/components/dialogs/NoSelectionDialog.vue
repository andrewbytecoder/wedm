<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

defineProps<{
    modelValue: boolean;
}>();

const emit = defineEmits<{
    'update:modelValue': [boolean];
}>();
</script>

<template>
    <v-dialog :model-value="modelValue" max-width="400" @update:model-value="emit('update:modelValue', $event)">
        <v-card>
            <v-card-title>{{ t('noSelectionDialog.title') }}</v-card-title>
            <v-card-text>{{ t('noSelectionDialog.content') }}</v-card-text>
            <v-card-actions>
                <v-spacer />
                <v-btn color="primary" variant="flat" @click="emit('update:modelValue', false)">{{
                    t('noSelectionDialog.actions.ok')
                }}</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>
