<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAppStore } from '@/stores/app';
import { desktop } from '@/services/desktop';
import type { GenericObject } from '@/types';

const { t } = useI18n();
const appStore = useAppStore();

const year = new Date().getFullYear();
const contributorsOpen = ref(false);

const version = computed(() => appStore.version || '—');
const packageMeta = computed(() => appStore.packageMeta);

function toggleContributors() {
    contributorsOpen.value = !contributorsOpen.value;
}

function getContributors(): GenericObject[] {
    const list = (packageMeta.value?.collaborators as string[] | undefined) ?? [];
    return list.map((c: string) => {
        const data = c.match(/([^<]+) <([^>]+)>/i) || [];
        const obj: GenericObject = {
            name: (data[1] as string) || c,
        };
        if (data[2]) {
            obj.email = data[2];
        }
        return obj;
    });
}

function goHome() {
    const url = packageMeta.value?.homepage as string | undefined;
    if (url) {
        void desktop.openExternalURL(url);
    }
}

function goToIssues() {
    const bugs = packageMeta.value?.bugs as { url?: string } | undefined;
    if (bugs?.url) {
        void desktop.openExternalURL(bugs.url);
    }
}

</script>

<template>
    <v-container class="d-flex justify-center pa-6">
        <v-row justify="center" align="start" dense>
            <v-col cols="12" md="6" lg="5">
                <v-card variant="elevated" max-width="520">
                    <v-card-text class="text-center">
                        <h3 class="text-h5 mb-2" data-test="about.headline.h3">
                            ETCD Manager
                        </h3>
                        <div class="mb-2" data-test="about.version.div">
                            {{ t('about.version') }}: {{ version }}
                        </div>
                        <div class="d-flex justify-center my-4">
                            <img
                                data-test="about.logo.img"
                                src="/assets/logo2.svg"
                                alt="ETCD Manager"
                                style="max-width: 220px; height: auto"
                            />
                        </div>
                        <h3 class="text-subtitle-1 mb-2" data-test="about.subheading-tagline.h3">
                            {{ t('about.tagline') }}
                        </h3>
                        <div class="text-body-2 mb-4" data-test="about.copyright.div">
                            {{ t('about.copyright', { year }) }}
                        </div>
                        <v-toolbar density="compact" flat color="surface" rounded>
                            <v-spacer />
                            <v-tooltip location="bottom" max-width="220">
                                <template #activator="{ props }">
                                    <v-btn
                                        v-bind="props"
                                        data-test="about.bug-report.button"
                                        icon="mdi-bug"
                                        variant="text"
                                        @click="goToIssues"
                                    />
                                </template>
                                <span>{{ t('about.actions.bugs') }}</span>
                            </v-tooltip>
                            <v-tooltip location="bottom" max-width="220">
                                <template #activator="{ props }">
                                    <v-btn
                                        v-bind="props"
                                        data-test="about.donate.button"
                                        icon="mdi-cash"
                                        variant="text"
                                        disabled
                                    />
                                </template>
                                <span>{{ t('about.actions.donate') }}</span>
                            </v-tooltip>
                            <v-tooltip location="bottom" max-width="220">
                                <template #activator="{ props }">
                                    <v-btn
                                        v-bind="props"
                                        data-test="about.update.button"
                                        icon="mdi-update"
                                        variant="text"
                                        disabled
                                    />
                                </template>
                                <span>{{ t('about.actions.updates') }}</span>
                            </v-tooltip>
                            <v-tooltip location="bottom" max-width="220">
                                <template #activator="{ props }">
                                    <v-btn
                                        v-bind="props"
                                        data-test="about.home.button"
                                        icon="mdi-home"
                                        variant="text"
                                        @click="goHome"
                                    />
                                </template>
                                <span>{{ t('about.actions.github') }}</span>
                            </v-tooltip>
                            <v-tooltip location="bottom" max-width="220">
                                <template #activator="{ props }">
                                    <v-btn
                                        v-bind="props"
                                        data-test="about.contributors.button"
                                        icon="mdi-account-multiple"
                                        variant="text"
                                        @click="toggleContributors"
                                    />
                                </template>
                                <span data-test="about.actions-credits.span">{{
                                    t('about.actions.credits')
                                }}</span>
                            </v-tooltip>
                            <v-spacer />
                        </v-toolbar>
                    </v-card-text>
                </v-card>
            </v-col>
            <v-expand-transition>
                <v-col v-show="contributorsOpen" cols="12" md="6" lg="5">
                    <v-card max-width="520" variant="elevated">
                        <v-card-text>
                            <h2 class="text-subtitle-1 mb-2" data-test="about.subheading-contributors.h2">
                                Contributors
                            </h2>
                            <v-list density="compact">
                                <v-list-item
                                    v-for="(contributor, index) of getContributors()"
                                    :key="index"
                                >
                                    <v-list-item-title data-test="about.contributor.list-tile-content">
                                        {{ contributor.name }}
                                    </v-list-item-title>
                                    <template v-if="contributor.email" #append>
                                        <v-btn
                                            :href="`mailto:${String(contributor.email)}`"
                                            icon="mdi-email"
                                            size="small"
                                            color="primary"
                                            variant="flat"
                                        />
                                    </template>
                                </v-list-item>
                            </v-list>
                        </v-card-text>
                    </v-card>
                </v-col>
            </v-expand-transition>
        </v-row>
    </v-container>
</template>
