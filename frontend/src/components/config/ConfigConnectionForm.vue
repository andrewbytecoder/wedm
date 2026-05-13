<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n';
import { useSettingsStore } from '@/stores/settings';
import { useAppStore } from '@/stores/app';
import { desktop } from '@/services/desktop';
import * as WailsApp from '../../../wailsjs/go/backend/App';

const { t } = useI18n();
const settings = useSettingsStore();
const app = useAppStore();

//  浏览器选择 SSL 文件
async function browseSsl(field: 'certificate' | 'certKey' | 'certChain') {
    const path = await desktop.openSSLFilePath();
    if (!path) {
        return;
    }
    const pem = await desktop.readTextFile(path);
    const label = path.replace(/^.*[/\\]/, '');
    settings.setSslFileField(field, label, pem);
}
//  清理证书文件的缓存
function clearSsl(field: 'certificate' | 'certKey' | 'certChain') {
    settings.clearSslField(field);
}

interface EtcdConfig {
    hosts: string;
    port: number;
    dialTimeout: number;
    retry: boolean;
    version: number;
    ssl: {
        enabled: boolean;
        certificate: string;
        certKey: string;
        certChain: string;
    }
    auth: {
        username: string;
        password: string;
    }
}


const etcdConfig = ref<EtcdConfig>({
    hosts: settings.etcd.hosts,
    port: settings.etcd.port,
    dialTimeout: settings.etcd.dialTimeout,
    retry: settings.etcd.retry,
    version: settings.etcd.version,
    ssl: {
        enabled: settings.etcd.ssl.enabled,
        certificate: settings.etcd.ssl.certificate,
        certKey: settings.etcd.ssl.certKey,
        certChain: settings.etcd.ssl.certChain,
    },
    auth: {
        username: settings.etcdAuth.username,
        password: settings.etcdAuth.password,
    },
});

// 监听 etcdConfig 的变化，同步到 settings store
watch(
    etcdConfig,
    (newConfig) => {
        // 同步 ETCD 配置
        settings.etcd.hosts = newConfig.hosts;
        settings.etcd.port = newConfig.port;
        settings.etcd.dialTimeout = newConfig.dialTimeout;
        settings.etcd.retry = newConfig.retry;
        settings.etcd.version = newConfig.version;

        // 同步 SSL 配置
        settings.etcd.ssl.enabled = newConfig.ssl.enabled;
        settings.etcd.ssl.certificate = newConfig.ssl.certificate;
        settings.etcd.ssl.certKey = newConfig.ssl.certKey;
        settings.etcd.ssl.certChain = newConfig.ssl.certChain;

        // 同步认证配置
        settings.etcdAuth.username = newConfig.auth.username;
        settings.etcdAuth.password = newConfig.auth.password;
    },
    { deep: true }
);


async function testConnection() {
    try {
        // 构建当前界面的配置（未保存的最新数据）
        const currentConfig = JSON.stringify({
            etcd: {
                hosts: etcdConfig.value.hosts,
                port: etcdConfig.value.port,
                dialTimeout: etcdConfig.value.dialTimeout,
                retry: etcdConfig.value.retry,
                version: etcdConfig.value.version,
                ssl: etcdConfig.value.ssl,
            },
            etcdAuth: {
                username: etcdConfig.value.auth.username,
                password: etcdConfig.value.auth.password,
            },
        });

        const raw = await WailsApp.EtcdPing(currentConfig);
        const st = JSON.parse(raw) as Record<string, unknown>;
        const ver = Number.parseFloat(String(st.version ?? '0'));
        if (!Number.isNaN(ver)) {
            etcdConfig.value.version = ver;
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
        <v-card-title>
            {{ t('settings.etcd.title') }}
        </v-card-title>
        <v-card-text>
            <v-text-field
                v-model="etcdConfig.hosts"
                :label="t('settings.etcd.fields.endpoint.label')"
                density="comfortable"
                class="mb-2"
            />
            <v-text-field
                v-model.number="etcdConfig.port"
                type="number"
                :label="t('settings.etcd.fields.port.label')"
                density="comfortable"
                class="mb-2"
            />
<!--             type="number" 添加number 类型会自动添加能增加 减少按钮-->
            <v-text-field
                v-model.number="etcdConfig.dialTimeout"
                type="number"
                :label="t('settings.etcd.fields.timeout.label')"
                density="comfortable"
                class="mb-2"
            />
            <v-switch
                v-model="etcdConfig.retry"
                :label="t('settings.etcd.fields.retries.label')"
                color="primary"
                hide-details
                class="mb-4"
            />

            <v-divider class="my-4" />
            <div class="text-subtitle-2 mb-2">TLS</div>
            <v-switch
                v-model="etcdConfig.ssl.enabled"
                label="TLS / SSL"
                color="primary"
                hide-details
                class="mb-2"
            />
            <v-row dense v-if="etcdConfig.ssl.enabled">
                <v-col cols="12" md="8">
                    <v-text-field
                        v-model="etcdConfig.ssl.certificate"
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
            <v-row dense v-if="etcdConfig.ssl.enabled">
                <v-col cols="12" md="8">
                    <v-text-field
                        v-model="etcdConfig.ssl.certKey"
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
            <v-row dense v-if="etcdConfig.ssl.enabled">
                <v-col cols="12" md="8">
                    <v-text-field
                        v-model="etcdConfig.ssl.certChain"
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
                v-model="etcdConfig.auth.username"
                :label="t('settings.auth.fields.username.label')"
                density="comfortable"
                class="mb-2"
            />
            <v-text-field
                v-model="etcdConfig.auth.password"
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
