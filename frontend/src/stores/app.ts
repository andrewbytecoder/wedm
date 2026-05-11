import { defineStore } from 'pinia';
import { desktop } from '@/services/desktop';

export const useAppStore = defineStore('app', {
    state: () => ({
        isLimited: false,
        etcdVersion: 3.5,
        version: '',
        packageMeta: null as Record<string, unknown> | null,
        currentProfileLabel: '',
        drawer: true,
        message: {
            text: '',
            color: 'error' as string,
            //  显示4 秒
            timeout: 4000,
            show: false,
        },
    }),
    actions: {
        async loadDesktopMetadata() {
            this.version = await desktop.getAppVersion();
            const raw = await desktop.getPackageMetadataJSON();
            this.packageMeta = JSON.parse(raw) as Record<string, unknown>;
        },
        //  这里更新值，在 App.vue中的v-snackbar 显示提示信息
        showMessage(text: string, color = 'error') {
            this.message = { ...this.message, text, color, show: true };
        },
        hideMessage() {
            this.message.show = false;
        },
    },
});
