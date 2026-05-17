import 'vuetify/styles';
// materialdesignicons 中所有的图标集合，导入到本地
import '@mdi/font/css/materialdesignicons.css';
import { createVuetify } from 'vuetify';
import { md2 } from 'vuetify/blueprints'
import colors from 'vuetify/util/colors'

//  引入图标， 具体图标进入到css里面直接搜索即可
//  import '@mdi/font/css/materialdesignicons.css';

export default createVuetify({
    blueprint: md2,
    theme: {
        defaultTheme: 'vscode-dark',
        themes: {
            'vscode-dark': {
                dark: true,
                colors: {
                    // VSCode 主色调 - 蓝色
                    primary: '#007acc',
                    secondary: '#3a3d41',

                    // VSCode 成功色 - 绿色
                    success: '#4ec9b0',

                    // VSCode 警告色 - 橙色
                    warning: '#cca700',

                    // VSCode 错误色 - 红色
                    error: '#f44747',

                    // VSCode 信息色
                    info: '#569cd6',

                    // VSCode 背景色
                    background: '#1e1e1e',
                    surface: '#252526',

                    // VSCode 文本颜色
                    'on-background': '#cccccc',
                    'on-surface': '#cccccc',
                },
            },
            'vscode-light': {
                dark: false,
                colors: {
                    // VSCode Light 主题色
                    primary: '#007acc',
                    secondary: '#e8e8e8',

                    success: '#4ec9b0',
                    warning: '#cca700',
                    error: '#f44747',
                    info: '#569cd6',

                    // VSCode Light 背景色
                    background: '#ffffff',
                    surface: '#f3f3f3',

                    // VSCode Light 文本颜色
                    'on-background': '#333333',
                    'on-surface': '#333333',
                },
            },
            'kite-dark': {
                dark: true,
                colors: {
                    // Kite 暗黑主题 - 主色调蓝色
                    primary: '#0ea5e9',
                    secondary: '#475569',

                    // Kite 成功色 - 绿色
                    success: '#22c55e',

                    // Kite 警告色 - 橙色
                    warning: '#f59e0b',

                    // Kite 错误色 - 红色
                    error: '#ef4444',

                    // Kite 信息色 - 蓝色
                    info: '#3b82f6',

                    // Kite 背景色 - 超深灰色
                    background: '#0f172a',
                    surface: '#1e293b',

                    // Kite 文本颜色
                    'on-background': '#e2e8f0',
                    'on-surface': '#cbd5e1',
                },
            },
            'kite-light': {
                dark: false,
                colors: {
                    // Kite 亮色主题 - 主色调蓝色
                    primary: '#0ea5e9',
                    secondary: '#94a3b8',

                    // Kite 成功色 - 绿色
                    success: '#22c55e',

                    // Kite 警告色 - 橙色
                    warning: '#f59e0b',

                    // Kite 错误色 - 红色
                    error: '#ef4444',

                    // Kite 信息色 - 蓝色
                    info: '#3b82f6',

                    // Kite 背景色 - 白色
                    background: '#ffffff',
                    surface: '#f8fafc',

                    // Kite 文本颜色
                    'on-background': '#0f172a',
                    'on-surface': '#334155',
                },
            },
            dark: {
                dark: true,
                colors: {
                    primary: colors.blue.darken2,
                    secondary: colors.grey.darken3,
                    success: colors.green.accent3,
                    warning: colors.amber.base,
                    error: colors.red.accent3,
                    info: colors.blue.base,
                    background: '#121212',
                    surface: '#1e1e1e',
                    'on-background': '#ffffff',
                    'on-surface': '#ffffff',
                },
            },
            light: {
                dark: false,
                colors: {
                    primary: colors.blue.darken2,
                    secondary: colors.grey.lighten4,
                    success: colors.green.base,
                    warning: colors.amber.darken3,
                    error: colors.red.darken2,
                    info: colors.blue.base,
                    background: '#ffffff',
                    surface: '#fafafa',
                    'on-background': '#000000',
                    'on-surface': '#000000',
                },
            },
        },
    },
});
