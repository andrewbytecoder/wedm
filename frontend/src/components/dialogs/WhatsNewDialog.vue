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

//  国际化，将传入的文本，根据当前语言进行翻译
const { t } = useI18n();
const html = ref('');
const loading = ref(false);
const hideNext = ref(false);

watch(hideNext, (v) => {
    //  一旦在界面上勾选，则保存到本地，下次不再显示
    if (v && props.version) {
        // 浏览器内置全局API 不需要引用直接可以在任何地方使用
        // 存储到自己的缓存里面了
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
        max-width="700"
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
<!--             一旦勾选按钮后期将不会再弹窗 -->
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
