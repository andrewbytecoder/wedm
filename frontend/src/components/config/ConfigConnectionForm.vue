<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useSettingsStore } from '@/stores/settings';
import { useAppStore } from '@/stores/app';
import { desktop } from '@/services/desktop';
import { etcdPing } from '@/services/etcdBridge';

const { t } = useI18n();
const settings = useSettingsStore();
const app = useAppStore();

async function browseSsl(field: 'certificate' | 'certKey' | 'certChain') {
    const path = await desktop.openSSLFilePath();
    if (!path) {
        return;
    }
    const pem = await desktop.readTextFile(path);
    const label = path.replace(/^.*[/\\]/, '');
    settings.setSslFileField(field, label, pem);
}

function clearSsl(field: 'certificate' | 'certKey' | 'certChain') {
    settings.clearSslField(field);
}

async function testConnection() {
    try {
        const st = await etcdPing();
        const ver = Number.parseFloat(String(st.version ?? '0'));
        if (!Number.isNaN(ver)) {
            settings.etcd.version = ver;
        }
        app.showMessage(t('settings.messages.connectSuccess'), 'success');
    } catch (e) {
        app.showMessage(e instanceof Error ? e.message : String(e), 'error');
    }
}

async function exportConfig() {
    const path = await desktop.openExportConfigPath('etcd-manager-settings.json');
    if (!path) {
        return;
    }
    settings.persistToLocalStorage();
    const doc = localStorage.getItem('config') ?? '{}';
    await desktop.writeTextFile(path, doc);
    app.showMessage(t('common.messages.success'), 'success');
}

async function importConfig() {
    const path = await desktop.openImportConfigPath();
    if (!path) {
        return;
    }
    try {
        const txt = await desktop.readTextFile(path);
        settings.applyImportedDocument(JSON.parse(txt) as Record<string, unknown>);
        app.showMessage(t('settings.messages.success'), 'success');
    } catch {
        app.showMessage(t('common.messages.invalidFileError'), 'error');
    }
}
</script>

<template>
    <v-card variant="outlined" class="pa-4 mb-4">
        <v-card-title>{{ t('settings.etcd.title') }}</v-card-title>
        <v-card-text>
            <v-text-field
                v-model="settings.etcd.hosts"
                :label="t('settings.etcd.fields.endpoint.label')"
                density="comfortable"
                class="mb-2"
            />
            <v-text-field
                v-model.number="settings.etcd.port"
                type="number"
                :label="t('settings.etcd.fields.port.label')"
                density="comfortable"
                class="mb-2"
            />
            <v-text-field
                v-model.number="settings.etcd.dialTimeout"
                type="number"
                :label="t('settings.etcd.fields.timeout.label')"
                density="comfortable"
                class="mb-2"
            />
            <v-switch
                v-model="settings.etcd.retry"
                :label="t('settings.etcd.fields.retries.label')"
                color="primary"
                hide-details
                class="mb-4"
            />

            <v-divider class="my-4" />
            <div class="text-subtitle-2 mb-2">TLS</div>
            <v-switch
                v-model="settings.etcd.ssl.enabled"
                label="TLS / SSL"
                color="primary"
                hide-details
                class="mb-2"
            />
            <v-row dense>
                <v-col cols="12" md="8">
                    <v-text-field
                        v-model="settings.etcd.ssl.certificate"
                        :label="t('settings.etcd.fields.certificate.label')"
                        readonly
                        density="comfortable"
                    />
                </v-col>
                <v-col cols="auto" class="d-flex align-center ga-1">
                    <v-btn size="small" @click="browseSsl('certificate')">{{
                        t('settings.actions.browse')
                    }}</v-btn>
                    <v-btn size="small" variant="text" @click="clearSsl('certificate')">{{
                        t('settings.actions.clear')
                    }}</v-btn>
                </v-col>
            </v-row>
            <v-row dense>
                <v-col cols="12" md="8">
                    <v-text-field
                        v-model="settings.etcd.ssl.certKey"
                        :label="t('settings.etcd.fields.certKey.label')"
                        readonly
                        density="comfortable"
                    />
                </v-col>
                <v-col cols="auto" class="d-flex align-center ga-1">
                    <v-btn size="small" @click="browseSsl('certKey')">{{
                        t('settings.actions.browse')
                    }}</v-btn>
                    <v-btn size="small" variant="text" @click="clearSsl('certKey')">{{
                        t('settings.actions.clear')
                    }}</v-btn>
                </v-col>
            </v-row>
            <v-row dense>
                <v-col cols="12" md="8">
                    <v-text-field
                        v-model="settings.etcd.ssl.certChain"
                        :label="t('settings.etcd.fields.certChain.label')"
                        readonly
                        density="comfortable"
                    />
                </v-col>
                <v-col cols="auto" class="d-flex align-center ga-1">
                    <v-btn size="small" @click="browseSsl('certChain')">{{
                        t('settings.actions.browse')
                    }}</v-btn>
                    <v-btn size="small" variant="text" @click="clearSsl('certChain')">{{
                        t('settings.actions.clear')
                    }}</v-btn>
                </v-col>
            </v-row>

            <v-divider class="my-4" />
            <div class="text-subtitle-2 mb-2">{{ t('settings.auth.title') }}</div>
            <v-text-field
                v-model="settings.etcdAuth.username"
                :label="t('settings.auth.fields.username.label')"
                density="comfortable"
                class="mb-2"
            />
            <v-text-field
                v-model="settings.etcdAuth.password"
                :label="t('settings.auth.fields.password.label')"
                type="password"
                density="comfortable"
                class="mb-4"
            />

            <v-row dense class="ga-2">
                <v-btn color="primary" @click="testConnection">{{
                    t('settings.actions.testConnection')
                }}</v-btn>
                <v-btn variant="tonal" @click="importConfig">Import JSON</v-btn>
                <v-btn variant="tonal" @click="exportConfig">Export JSON</v-btn>
            </v-row>
        </v-card-text>
    </v-card>
</template>
