import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import wails from '@wailsio/runtime/plugins/vite';
import vuetify from 'vite-plugin-vuetify';
import path from 'node:path';

export default defineConfig({
    plugins: [vue(), vuetify({ autoImport: true }), wails('./bindings')],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
        },
    },
    clearScreen: false,
    server: {
        host: '127.0.0.1',
        port: Number(process.env.WAILS_VITE_PORT) || 34115,
        strictPort: true,
        hmr: {
            overlay: true,
        },
        watch: {
            ignored: [
                '**/node_modules/**',
                '**/.git/**',
                '**/dist/**',
                '**/build/**',
                '!**/src/**',
            ],
        },
    },
    base: './',
});
