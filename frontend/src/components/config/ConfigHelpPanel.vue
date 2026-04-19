<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { PlatformService } from '@/services/platform.service';

const { t } = useI18n();
const open = defineModel<boolean>({ default: false });
const tab = ref('info');
const platform = new PlatformService();

function htmlHelp() {
    return platform.getHelp(t('settings.help.etcd'));
}
</script>

<template>
    <div>
        <v-btn size="small" variant="text" class="mb-2" @click="open = !open">
            {{ open ? 'Help (hide)' : t('common.help.tooltip') }}
        </v-btn>
        <v-expand-transition>
            <v-card v-show="open" class="mb-4" variant="outlined">
                <v-card-title class="d-flex align-center">
                    <v-icon class="me-2" color="primary" icon="mdi-help-circle-outline" />
                    {{ t('settings.title') }}
                </v-card-title>
                <v-divider />
                <v-card-text>
                    <v-tabs v-model="tab" color="primary" grow>
                        <v-tab value="info">{{ t('common.help.tabs.info') }}</v-tab>
                        <v-tab value="keys">{{ t('common.help.tabs.shortcuts') }}</v-tab>
                    </v-tabs>
                    <v-tabs-window v-model="tab">
                        <v-tabs-window-item value="info">
                            <div class="pa-2">
                                <h2 class="text-h6">{{ t('common.help.infoTitle') }}</h2>
                                <div class="markdown-body mt-2" v-html="htmlHelp()" />
                            </div>
                        </v-tabs-window-item>
                        <v-tabs-window-item value="keys">
                            <div class="pa-2 text-body-2">
                                <p>
                                    <span class="font-weight-bold">{{ platform.getMeta() }} + ← / →</span>
                                    — {{ t('settings.help.shortcuts.leftArrow') }} /
                                    {{ t('settings.help.shortcuts.rightArrow') }}
                                </p>
                                <p>
                                    <span class="font-weight-bold">{{ platform.getMeta() }} + S</span>
                                    — {{ t('common.help.shortcuts.save') }}
                                </p>
                                <p>
                                    <span class="font-weight-bold">{{ platform.getMeta() }} + H</span>
                                    — {{ t('common.help.shortcuts.help') }}
                                </p>
                            </div>
                        </v-tabs-window-item>
                    </v-tabs-window>
                </v-card-text>
            </v-card>
        </v-expand-transition>
    </div>
</template>
