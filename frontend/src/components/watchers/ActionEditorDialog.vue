<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type { WatcherAction } from '@/types/watcher';

const props = defineProps<{
    modelValue: boolean;
    mode: 'create' | 'edit';
    initial: WatcherAction;
}>();

const emit = defineEmits<{
    'update:modelValue': [boolean];
    save: [WatcherAction];
}>();

const { t } = useI18n();

const actionPick = ref(props.initial.action.value);
const eventPick = ref(props.initial.event.value);

const actions = computed(() => [
    { title: 'Print to console', value: 0 },
    { title: 'Notification', value: 1 },
    { title: 'Desktop notofication', value: 2 },
]);

const events = computed(() => [
    { title: 'put', value: 0 },
    { title: 'delete', value: 1 },
]);

watch(
    () => [props.modelValue, props.initial] as const,
    ([open]) => {
        if (open) {
            actionPick.value = props.initial.action.value;
            eventPick.value = props.initial.event.value;
        }
    },
);

const title = computed(() =>
    props.mode === 'edit' ? t('common.titles.edit') : t('common.titles.new'),
);

function close() {
    emit('update:modelValue', false);
}

function submit() {
    const a = actions.value.find((x) => x.value === actionPick.value)!;
    const e = events.value.find((x) => x.value === eventPick.value)!;
    const out: WatcherAction = {
        id: props.initial.id,
        action: { name: a.title, value: a.value, type: 1 },
        event: { name: e.title, value: e.value, type: 2 },
    };
    emit('save', out);
    close();
}
</script>

<template>
    <v-dialog :model-value="modelValue" max-width="420" persistent @update:model-value="emit('update:modelValue', $event)">
        <v-card>
            <v-toolbar density="comfortable" flat>
                <v-toolbar-title>{{ t('actionEditor.title') }} — {{ title }}</v-toolbar-title>
            </v-toolbar>
            <v-card-text>
                <v-select
                    v-model="actionPick"
                    :items="actions"
                    item-title="title"
                    item-value="value"
                    density="comfortable"
                    :label="t('actionEditor.fields.action.label')"
                />
                <v-select
                    v-model="eventPick"
                    :items="events"
                    item-title="title"
                    item-value="value"
                    density="comfortable"
                    :label="t('actionEditor.fields.event.label')"
                />
            </v-card-text>
            <v-card-actions>
                <v-spacer />
                <v-btn variant="text" @click="close">{{ t('common.actions.close.label') }}</v-btn>
                <v-btn color="primary" @click="submit">{{ t('common.actions.add') }}</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>
