<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import AppMenu from '@/components/AppMenu.vue';
import WhatsNewDialog from '@/components/dialogs/WhatsNewDialog.vue';
import { listWatchers } from '@/services/watcherStorage';
import { rehydrateActivatedWatchers } from '@/services/watcherRuntime';
import { useAppStore } from '@/stores/app';
import { useSettingsStore } from '@/stores/settings';
import { applyFontSettings } from '@/i18n/font'
import { EventsOn } from '../wailsjs/runtime';
import { useTheme } from 'vuetify'

const theme = useTheme()
const { t } = useI18n();
const store = useAppStore();
const settings = useSettingsStore();
const showWhatsNew = ref(false);

// 主题列表和当前索引
const themeList = ['vscode-dark', 'vscode-light', 'kite-dark', 'kite-light', 'dark', 'light']
const currentThemeIndex = ref(0)

// 获取当前主题名称用于显示图标
const getCurrentThemeIcon = () => {
    const currentTheme = themeList[currentThemeIndex.value]
    if (currentTheme.includes('dark')) {
        return 'mdi-weather-night'
    }
    return 'mdi-weather-sunny'
}

// 获取当前主题的提示文本
const getCurrentThemeTooltip = () => {
    const currentTheme = themeList[currentThemeIndex.value]
    const themeNames: Record<string, string> = {
        'vscode-dark': 'VSCode Dark',
        'vscode-light': 'VSCode Light',
        'kite-dark': 'Kite Dark',
        'kite-light': 'Kite Light',
        'dark': 'Dark',
        'light': 'Light'
    }
    return `Theme: ${themeNames[currentTheme] || currentTheme}`
}

// 切换到下一个主题
const toggleTheme = () => {
    currentThemeIndex.value = (currentThemeIndex.value + 1) % themeList.length
    const nextTheme = themeList[currentThemeIndex.value]
    theme.change(nextTheme)

    // 保存主题选择到 localStorage
    localStorage.setItem('selected-theme', nextTheme)

    // 根据主题添加对应的 CSS 类
    document.body.classList.remove('vscode-dark-theme', 'vscode-light-theme')
    if (nextTheme === 'vscode-dark') {
        document.body.classList.add('vscode-dark-theme')
    } else if (nextTheme === 'vscode-light') {
        document.body.classList.add('vscode-light-theme')
    }
}

function bridgeTypeToEventName(tpe: string): string {
    const u = tpe.toUpperCase();
    if (u === 'PUT') {
        return 'put';
    }
    if (u === 'DELETE') {
        return 'delete';
    }
    if (u === 'ERROR') {
        return 'error';
    }
    if (u === 'DISCONNECTED') {
        return 'disconnected';
    }
    if (u === 'CONNECTED') {
        return 'connected';
    }
    return tpe.toLowerCase();
}

function formatWatcherMessage(eventName: string, key: string, value: string): string {
    const date = new Date().toISOString();
    if (eventName === 'put') {
        return `${date}: The key "${key}" has been changed. New value: "${value}"`;
    }
    if (eventName === 'delete') {
        return `${date}: The key "${key}" has been deleted.`;
    }
    if (eventName === 'error') {
        return `${date}: Error: ${value}`;
    }
    if (eventName === 'disconnected') {
        return `${date}: The watcher has been disconnected. Error: ${value}`;
    }
    if (eventName === 'connected') {
        return `${date}: The watcher "${key}" has been successfully reconnected!`;
    }
    return `${date}: ${eventName} on "${key}"`;
}

function dispatchUserActionOutputs(msg: string, out: number) {
    if (out === 0) {
        console.log(msg);
    } else if (out === 1) {
        store.showMessage(msg, 'info');
    } else if (out === 2) {
        try {
            if (typeof Notification !== 'undefined') {
                if (Notification.permission === 'granted') {
                    new Notification('ETCD Manager', { body: msg });
                } else if (Notification.permission === 'default') {
                    void Notification.requestPermission().then((p) => {
                        if (p === 'granted') {
                            new Notification('ETCD Manager', { body: msg });
                        }
                    });
                }
            }
        } catch {
            /* ignore */
        }
    }
}

function onWatcherBridgeEvent(raw: string) {
    let o: Record<string, unknown>;
    try {
        o = JSON.parse(raw) as Record<string, unknown>;
    } catch {
        return;
    }
    if (o.error && !o.type) {
        console.error('[watcher]', o.error);
        return;
    }
    const name = String(o.name ?? '');
    const eventName = bridgeTypeToEventName(String(o.type ?? ''));
    const key = String(o.key ?? '');
    const value = String(o.value ?? '');
    const msg = formatWatcherMessage(eventName, key, value);

    /* Legacy `registerWatcherEvents`: error / disconnected / connected always use console (output 0). */
    if (eventName === 'error' || eventName === 'disconnected' || eventName === 'connected') {
        console.log(msg);
        return;
    }

    const w = listWatchers().find((x) => x.name === name);
    if (!w) {
        return;
    }
    for (const act of w.actions) {
        if (act.event.name !== eventName) {
            continue;
        }
        dispatchUserActionOutputs(msg, act.action.value);
    }
}

let offWatcherEvent: (() => void) | undefined;

onMounted(async () => {
    await store.loadDesktopMetadata();
    settings.hydrateFromLocalStorage();
    void settings.refreshMenuCapabilitiesFromEtcd();

    // 应用字体设置
    applyFontSettings(settings.config.fontFamily, settings.config.fontSize);

    const v = store.version || 'dev';
    if (!localStorage.getItem(`news${v}`)) {
        showWhatsNew.value = true;
    }

    // 恢复之前保存的主题
    const savedTheme = localStorage.getItem('selected-theme')
    if (savedTheme && themeList.includes(savedTheme)) {
        currentThemeIndex.value = themeList.indexOf(savedTheme)
        theme.change(savedTheme)

        // 应用对应的 CSS 类
        if (savedTheme === 'vscode-dark') {
            document.body.classList.add('vscode-dark-theme')
        } else if (savedTheme === 'vscode-light') {
            document.body.classList.add('vscode-light-theme')
        }
    } else {
        // 默认使用 vscode-dark
        theme.change('vscode-dark')
        document.body.classList.add('vscode-dark-theme')
    }

    offWatcherEvent = EventsOn('watcher:event', onWatcherBridgeEvent);
    if (settings.isConfigured) {
        void rehydrateActivatedWatchers(settings.watchers.autoload, {
            error: settings.watchers.error,
            disconnects: settings.watchers.disconnects,
            reconnects: settings.watchers.reconnects,
        });
    }
});

const socialLinks = [
    {
        icon: 'mdi-github',
        url: 'https://github.com/andrewbytecoder/wedm',  // 替换为您的 GitHub 地址
        tooltip: 'GitHub Repository'
    },
    {
        icon: 'mdi-email',
        url: 'mailto:wangyazhoujy@gmail.com',  // 替换为您的邮箱
        tooltip: 'Contact wangyazhoujy@gmail.com'
    },
    {
        icon: 'mdi-sina-weibo',
        url: 'https://weibo.com/andrewbytecoder',  // 替换为您的 Instagram
        tooltip: 'Follow us on sina'
    },
];

function openLink(url: string) {
    if (url.startsWith('mailto:')) {
        window.location.href = url;  // 使用系统默认邮件客户端
    } else {
        window.open(url, '_blank');   // 其他链接在新标签页打开
    }
}

onUnmounted(() => {
    offWatcherEvent?.();
});
</script>

<template>
    <v-app>
        <v-app-bar
            density="comfortable"
            scroll-behavior="hide elevate"
            rounded
        >
<!--            点击图标显示导航栏-->
            <v-app-bar-nav-icon
                :aria-label="t('shell.toggleMenu')"
                @click="store.drawer = !store.drawer"
            />
            <v-toolbar-title>wails etcd desktop manager</v-toolbar-title>
            <v-spacer />
<!--            右上角提示信息-->
            <span v-if="settings.currentProfileLabel" class="text-caption me-4">
                {{ t('shell.profile') }}: {{ settings.currentProfileLabel }}
            </span>
<!--            如果版本信息非空，显示版本信息-->
            <span v-if="store.version" class="text-caption text-medium-emphasis">
                v{{ store.version }}
            </span>
            <v-tooltip
                location="bottom"
            >
                <template #activator="{ props }">
                    <v-btn
                        v-bind="props"
                        @click="toggleTheme"
                        :icon="getCurrentThemeIcon()"
                    ></v-btn>
                </template>
                <span>{{ getCurrentThemeTooltip() }}</span>
            </v-tooltip>
        </v-app-bar>
<!--    点击跳转到对应的路由-->
        <AppMenu />

        <v-main>
            <router-view />
<!--             添加脚注 flex-column 垂直排列 -->
            <v-footer app color="surface-light" class="px-4 flex-column py-2">
                <div class="d-flex ga-3">
                    <v-tooltip
                        v-for="link in socialLinks"
                        :key="link.icon"
                        location="top"
                    >
<!--                        具名插槽应用 -->
                        <template #activator="{ props }">
                            <v-btn
                                v-bind="props"
                                :icon="link.icon"
                                density="comfortable"
                                variant="text"
                                @click="openLink(link.url)"
                            ></v-btn>
                        </template>
                        <span>{{ link.tooltip }}</span>
                    </v-tooltip>
                </div>
                <v-divider class="my-2" thickness="2" width="50"></v-divider>
                <div class="text-center w-100 text-caption">
                    © {{ new Date().getFullYear() }} — <strong>wails etcd desktop manager</strong>. All rights reserved.
                </div>
            </v-footer>
        </v-main>

<!--        这里显示弹窗，当 show 为true的时候显示 -->
        <v-snackbar
            :model-value="store.message.show"
            :color="store.message.color"
            :timeout="store.message.timeout"
            location="bottom"
            @update:model-value="(v: boolean) => { if (!v) store.hideMessage(); }"
        >
            {{ store.message.text }}
        </v-snackbar>

        <WhatsNewDialog v-model="showWhatsNew" :version="store.version || 'dev'" />

        <v-spacer />

    </v-app>
</template>
