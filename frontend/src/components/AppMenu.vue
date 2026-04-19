<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAppStore } from '@/stores/app';
import { useSettingsStore } from '@/stores/settings';

const { t } = useI18n();
const store = useAppStore();
const settings = useSettingsStore();

const isLimited = computed(() => settings.isLimited);
const etcdVersion = computed(() => settings.etcd.version);

function leaseDisabled() {
    return !isLimited.value || etcdVersion.value < 3.3;
}
</script>

<template>
    <v-navigation-drawer v-model="store.drawer" width="260">
        <v-list density="compact" nav>
            <v-list-item to="/configure" prepend-icon="mdi-cog" :title="t('menu.settings')" />
            <v-list-item
                to="/cluster"
                prepend-icon="mdi-cloud-outline"
                :title="t('menu.manageCluster')"
                :disabled="!isLimited"
            />
            <v-list-item to="/keys" prepend-icon="mdi-format-list-bulleted" :title="t('menu.manageKeys')" />
            <v-list-item
                to="/watchers"
                prepend-icon="mdi-eye-outline"
                :title="t('menu.manageWatchers')"
            />
            <v-list-item
                to="/users"
                prepend-icon="mdi-account-outline"
                :title="t('menu.manageUsers')"
                :disabled="!isLimited"
            />
            <v-list-item
                to="/leases"
                prepend-icon="mdi-timer-outline"
                :title="t('menu.manageLeases')"
                :disabled="leaseDisabled()"
            />
            <v-list-item
                to="/roles"
                prepend-icon="mdi-shield-account-outline"
                :title="t('menu.manageRoles')"
                :disabled="!isLimited"
            />
            <v-list-item to="/about" prepend-icon="mdi-information-outline" :title="t('menu.about')" />
        </v-list>
    </v-navigation-drawer>
</template>
