<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import SaveAsDialog from '@/components/dialogs/SaveAsDialog.vue';
import { useAppStore } from '@/stores/app';
import { useSettingsStore } from '@/stores/settings';

// 语言国际化
const { t } = useI18n();
const settings = useSettingsStore();
const app = useAppStore();
const saveAsOpen = ref(false);

//  加载配置文件
function loadProfile() {
    settings.loadProfileByName(settings.activeProfileName);
}

// 将原先的配置保存为新的配置文件
function onSaveAs(name: string) {
    const r = settings.saveProfileAs(name);
    if (r === 'empty') {
        app.showMessage(t('saveAsDialog.messages.empty'), 'warning');
        return;
    }
    if (r === 'duplicate') {
        app.showMessage(t('saveAsDialog.messages.duplicate'), 'warning');
        return;
    }
    saveAsOpen.value = false;
    app.showMessage(t('settings.messages.success'), 'success');
}


const fontFamilies = [
    { title: 'Roboto (Default)', value: 'Roboto, sans-serif' },
    { title: 'Arial', value: 'Arial, sans-serif' },
    { title: 'Helvetica', value: 'Helvetica, sans-serif' },
    { title: 'Times New Roman', value: '"Times New Roman", serif' },
    { title: 'Courier New', value: '"Courier New", monospace' },
    { title: 'Verdana', value: 'Verdana, sans-serif' },
    { title: 'Georgia', value: 'Georgia, serif' },
    { title: '微软雅黑', value: '"Microsoft YaHei", sans-serif' },
    { title: '宋体', value: 'SimSun, serif' },
    { title: '黑体', value: 'SimHei, sans-serif' },
];

const fontSizes = [
    { title: '12px', value: 12 },
    { title: '13px', value: 13 },
    { title: '14px (Default)', value: 14 },
    { title: '15px', value: 15 },
    { title: '16px', value: 16 },
    { title: '18px', value: 18 },
    { title: '20px', value: 20 },
];

</script>

<template>
    <v-card variant="outlined" class="pa-4 mb-4">
<!--   所有元素上下居中对齐  v-row 一行 将每一行（<v-row>）分为 12 个等宽的列 -->
        <v-row dense align="center">
<!--            v-col 格栅系统-->
<!--            cols="12"  总体12 当使用最小屏幕的情况下，宽度一整行-->
<!--             lg="4" 大型屏幕设备 xl="4"-->
            <v-col cols="12" md="4">
                <v-select
                    v-model="settings.activeProfileName"
                    :items="settings.profileNames"
                    :label="t('settings.profile.fields.profiles.label')"
                    :disabled="!settings.profileNames.length"
                    density="comfortable"
                    hide-details
                />
            </v-col>
<!--             md="auto"  根据内容自适应宽度 当缩放宽度的时候 这一列进行适当缩放，保证所有书看着比较合适 -->
            <v-col cols="12" md="auto" class="d-flex flex-wrap gap-2">
                <v-btn
                    color="success"
                    prepend-icon="mdi-download"
                    :disabled="!settings.profileNames.length"
                    @click="loadProfile"
                >
<!--                start 将图标放到文本的左边, 并和文本保持一定的间距    添加按钮的图标-->
<!--                    <v-icon start icon="mdi-download" />-->
                    {{ t('settings.actions.load') }}
                </v-btn>
                <v-btn
                    color="primary"
                    prepend-icon="mdi-content-save-move"
                    variant="tonal"
                    @click="saveAsOpen = true"
                >
<!--                    <v-icon start icon="mdi-content-save-move" />-->
                    {{ t('saveAsDialog.actions.saveAs') }}
                </v-btn>
            </v-col>
<!--             配置文件名字-->
            <v-col cols="12" md="4">
                <v-text-field
                    v-model="settings.config.name"
                    :label="t('settings.profile.fields.name.label')"
                    density="comfortable"
                    hide-details
                />
            </v-col>
        </v-row>
<!--        如果点击上面的按钮， 在屏幕中心的位置显示，是否显示根据 saveAsOpen 是否为true 来显示 -->
<!--       弹窗实现-->
        <SaveAsDialog
            v-model="saveAsOpen"
            :initial-name="`${settings.config.name}-copy`"
            @save-as="onSaveAs"
        />
    </v-card>

    <v-card variant="outlined" class="pa-4 mb-4">
        <!--   所有元素上下居中对齐  v-row 一行 将每一行（<v-row>）分为 12 个等宽的列 -->
        <v-row dense align="center">
            <v-col cols="12" md="4">
                <v-select
                    v-model="settings.config.language"
                    :items="[
                        { title: 'English', value: 'en' },
                        { title: 'Chinese', value: 'zh' },
                    ]"
                    item-title="title"
                    item-value="value"
                    :label="t('settings.misc.fields.language.label')"
                    density="comfortable"
                    hide-details
                />
            </v-col>
            <v-col cols="12" md="4">
                <v-select
                    v-model="settings.config.fontFamily"
                    :items="fontFamilies"
                    item-title="title"
                    item-value="value"
                    :label="t('settings.misc.fields.fontFamily.label')"
                    density="comfortable"
                    hide-details
                />
            </v-col>
            <v-col cols="12" md="4">
                <v-select
                    v-model="settings.config.fontSize"
                    :items="fontSizes"
                    item-title="title"
                    item-value="value"
                    :label="t('settings.misc.fields.fontSize.label')"
                    density="comfortable"
                    hide-details
                />
            </v-col>
        </v-row>
        <!--        如果点击上面的按钮， 在屏幕中心的位置显示，是否显示根据 saveAsOpen 是否为true 来显示 -->
        <!--       弹窗实现-->
        <SaveAsDialog
            v-model="saveAsOpen"
            :initial-name="`${settings.config.name}-copy`"
            @save-as="onSaveAs"
        />
    </v-card>

</template>
