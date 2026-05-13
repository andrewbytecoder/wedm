<script setup lang="ts">
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
    modelValue: boolean;
    /** Initial profile name suggestion */
    initialName?: string;
}>();

//  emit 子组件向父组件抛出变量值
//  v-model绑定的 不需要和父组件名字一致
//  'update:modelValue': [boolean]; 标准用法
//  vue会自动将 v-model 拆分成 :mode-value 和  @update:model-value="saveAsOpen = $event"
//  接收一个参数 参数为string
//      'update:modelValue': [boolean];  使用v-model 进行绑定的是直接进行赋值
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

//  用于更新 对端的update指定 或者@指定的值
function cancel() {
    emit('update:modelValue', false);
}

function submit() {
    emit('saveAs', profile.value.trim());
}
</script>

<template>
<!--     父组件传入值和子组件接收值的变量名字可以随意定义，只要是 v-model: 就能对应 mode-value 和 update-->
    <v-dialog :model-value="modelValue" max-width="360" persistent @update:model-value="emit('update:modelValue', $event)">
        <v-card
            color="indigo"
            variant="outlined"
        >
<!--           标题-->
            <v-toolbar density="comfortable" flat>
                <v-toolbar-title>{{ t('saveAsDialog.title') }}</v-toolbar-title>
            </v-toolbar>
<!--            文本输入框-->
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
<!--                 增加空间填充-->
                <v-spacer />
<!--                并排两个按钮额-->
                <v-btn
                    prepend-icon="mdi-cancel"
                    color="primary"
                    variant="tonal"
                    @click="cancel"
                >
                    {{ t('saveAsDialog.actions.cancel') }}
                </v-btn>
                <v-btn
                    prepend-icon="mdi-content-save-settings"
                    color="primary"
                    variant="flat"
                    @click="submit"
                >
                    {{ t('saveAsDialog.actions.saveAs') }}
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>
