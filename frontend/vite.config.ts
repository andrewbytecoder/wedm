import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vuetify from 'vite-plugin-vuetify';
import path from 'node:path';

export default defineConfig({
    plugins: [vue(), vuetify({ autoImport: true })],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
        },
    },
    clearScreen: false,
    server: {
        port: 34115,
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
