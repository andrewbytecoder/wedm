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
                <v-btn color="success" :disabled="!settings.profileNames.length" @click="loadProfile" >
                    <v-icon start icon="mdi-download" />
                    {{ t('settings.actions.load') }}
                </v-btn>
                <v-btn color="primary" variant="tonal" @click="saveAsOpen = true">
                    <v-icon start icon="mdi-content-save-move" />
                    {{ t('saveAsDialog.actions.saveAs') }}
                </v-btn>
            </v-col>
            <v-col cols="12" md="4">
                <v-text-field
                    v-model="settings.config.name"
                    :label="t('settings.profile.fields.name.label')"
                    density="comfortable"
                    hide-details
                />
            </v-col>
            <v-col cols="12" md="3">
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
        </v-row>

        <SaveAsDialog
            v-model="saveAsOpen"
            :initial-name="`${settings.config.name}-copy`"
            @save-as="onSaveAs"
        />
    </v-card>
</template>
