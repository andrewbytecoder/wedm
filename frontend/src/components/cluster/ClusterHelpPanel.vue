<script setup lang="ts">
import { ref, shallowRef } from 'vue';
import { useI18n } from 'vue-i18n';
import { PlatformService } from '@/services/platform.service';

const { t } = useI18n();
const open = defineModel<boolean>({ default: false });
const helpTab = ref('info');

const platformService = shallowRef(new PlatformService());

</script>

<template>
    <div>
        <v-btn size="small" variant="text" class="mb-2" @click="open = !open">
            {{ open ? 'Help (hide)' : t('common.help.tooltip') }}
        </v-btn>
        <v-expand-transition>
            <v-card v-show="open" class="mb-4" variant="outlined">
                <v-card-title class="d-flex align-center">
<!--                    v-tooltip  负责调用具名插槽，并把具体的属性传递给对应的模版 -->
                    <v-tooltip location="bottom" max-width="220">
                        <template #activator="{ props: tip }">
                            <v-icon
                                v-bind="tip"
                                data-test="health.help.icon"
                                color="primary"
                                class="me-2"
                                icon="mdi-help-circle-outline"
                            />
                        </template>
                        <span data-test="health.help.span">{{ t('common.help.tooltip') }}</span>
                    </v-tooltip>
                    <span data-test="health.title.toolbar-title">{{ t('cluster.title') }}</span>
                </v-card-title>
<!--                横线-->
                <v-divider color="secondary" />
<!--                文本card -->
                <v-card-text>
                    <v-tabs v-model="helpTab" color="primary" grow>
                        <v-tab value="info" data-test="health.help-info.tab">
                            {{t('common.help.tabs.info')}}
                        </v-tab>
                        <v-tab value="keys" data-test="health.help-shortcuts.tab">{{
                                t('common.help.tabs.shortcuts')
                            }}</v-tab>
                    </v-tabs>
                    <v-tabs-window v-model="helpTab">
                        <v-tabs-window-item value="info">
                            <v-card flat class="pa-2">
                                <h2 data-test="health.help-info-title.h3" class="text-h6">
                                    {{ t('common.help.infoTitle') }}
                                </h2>
                                <p class="my-3" />
                                <div
                                    data-test="health.help-text.p"
                                    class="markdown-body"
                                    v-html="platformService.getHelp(t('cluster.help.text'))"
                                />
                            </v-card>
                        </v-tabs-window-item>
                        <v-tabs-window-item value="keys">
                            <v-card flat class="pa-2">
                                <v-row align="center">
                                    <v-col cols="12" sm="2">
                                        <p
                                            data-test="health.help-shortcuts-rounded.p"
                                            class="rounded text-caption font-weight-bold"
                                        >
                                            {{ `${platformService.getMeta()} + H` }}
                                        </p>
                                    </v-col>
                                    <v-col cols="12" sm="10">
                                        <p data-test="health.help-shortcuts-help.p" class="text-body-2">
                                            {{ t('common.help.shortcuts.help') }}
                                        </p>
                                    </v-col>
                                </v-row>
                            </v-card>
                        </v-tabs-window-item>
                    </v-tabs-window>
                </v-card-text>
            </v-card>
        </v-expand-transition>
    </div>
</template>
