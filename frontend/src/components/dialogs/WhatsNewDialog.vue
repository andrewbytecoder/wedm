<script setup lang="ts">
import { marked } from 'marked';
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { desktop } from '@/services/desktop';

const props = defineProps<{
    modelValue: boolean;
    version: string;
}>();

const emit = defineEmits<{
    'update:modelValue': [boolean];
}>();

const { t } = useI18n();
const html = ref('');
const loading = ref(false);
const hideNext = ref(false);

watch(hideNext, (v) => {
    if (v && props.version) {
        localStorage.setItem(`news${props.version}`, '1');
    }
});

watch(
    () => props.modelValue,
    async (open) => {
        if (!open) {
            return;
        }
        hideNext.value = false;
        if (html.value) {
            return;
        }
        loading.value = true;
        try {
            const md = await desktop.getWhatsNewMarkdown();
            html.value = marked.parse(md) as string;
        } catch {
            html.value = `<p>${t('common.messages.error')}</p>`;
        } finally {
            loading.value = false;
        }
    },
);

function close() {
    emit('update:modelValue', false);
}
</script>

<template>
    <v-dialog
        :model-value="modelValue"
        max-width="720"
        scrollable
        persistent
        @update:model-value="emit('update:modelValue', $event)"
    >
        <v-card>
            <v-toolbar density="comfortable" flat>
                <v-toolbar-title>{{ t('whatsNewDialog.title', { version }) }}</v-toolbar-title>
            </v-toolbar>
            <v-card-text>
                <v-progress-linear v-if="loading" indeterminate />
                <div v-else class="markdown-body text-body-2" v-html="html" />
            </v-card-text>
            <v-checkbox
                v-model="hideNext"
                class="mx-4 mb-2"
                hide-details
                density="comfortable"
                :label="t('whatsNewDialog.dontshow')"
            />
            <v-card-actions>
                <v-spacer />
                <v-btn color="primary" variant="flat" @click="close">{{ t('whatsNewDialog.actions.cancel') }}</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<style scoped>
.markdown-body :deep(p) {
    margin-bottom: 0.5rem;
}
.markdown-body :deep(ul) {
    margin: 0.25rem 0 0.5rem 1.25rem;
}
</style>
