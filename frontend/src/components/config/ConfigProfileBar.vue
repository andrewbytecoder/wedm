<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import SaveAsDialog from '@/components/dialogs/SaveAsDialog.vue';
import { useAppStore } from '@/stores/app';
import { useSettingsStore } from '@/stores/settings';

const { t } = useI18n();
const settings = useSettingsStore();
const app = useAppStore();
const saveAsOpen = ref(false);

function loadProfile() {
    settings.loadProfileByName(settings.activeProfileName);
}

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
        <v-row dense align="center">
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
            <v-col cols="12" md="auto" class="d-flex flex-wrap gap-2">
                <v-btn color="success" :disabled="!settings.profileNames.length" @click="loadProfile">
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
