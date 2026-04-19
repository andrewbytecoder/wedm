<script setup lang="ts">
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
    modelValue: boolean;
    /** Initial profile name suggestion */
    initialName?: string;
}>();

const emit = defineEmits<{
    'update:modelValue': [boolean];
    saveAs: [string];
}>();

const { t } = useI18n();
const profile = ref('');

watch(
    () => [props.modelValue, props.initialName] as const,
    ([open, initial]) => {
        if (open) {
            profile.value = (initial as string) || '';
        }
    },
);

function cancel() {
    emit('update:modelValue', false);
}

function submit() {
    emit('saveAs', profile.value.trim());
}
</script>

<template>
    <v-dialog :model-value="modelValue" max-width="360" persistent @update:model-value="emit('update:modelValue', $event)">
        <v-card>
            <v-toolbar density="comfortable" flat>
                <v-toolbar-title>{{ t('saveAsDialog.title') }}</v-toolbar-title>
            </v-toolbar>
            <v-card-text>
                <v-text-field
                    v-model="profile"
                    autofocus
                    density="comfortable"
                    :label="t('saveAsDialog.profile.label')"
                    :placeholder="t('saveAsDialog.profile.placeholder')"
                />
            </v-card-text>
            <v-card-actions>
                <v-spacer />
                <v-btn variant="text" @click="cancel">{{ t('saveAsDialog.actions.cancel') }}</v-btn>
                <v-btn color="primary" variant="flat" @click="submit">{{ t('saveAsDialog.actions.saveAs') }}</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>
