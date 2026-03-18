import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';
import laravel from 'laravel-vite-plugin';
import { resolve } from 'node:path';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import i18n from 'laravel-vue-i18n/vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const appUrl = env.APP_URL ?? 'http://localhost';
    const appHost = (() => {
        try {
            return new URL(appUrl).hostname;
        } catch {
            return 'localhost';
        }
    })();

    const devPort = Number(env.VITE_DEV_SERVER_PORT || 5173);
    const hmrHost = env.VITE_HMR_HOST || appHost;
    const hmrPort = Number(env.VITE_HMR_PORT || devPort);
    const hmrProtocol = env.VITE_HMR_PROTOCOL || 'ws';

    return {
        plugins: [
            laravel({
                input: ['resources/js/app.ts', 'resources/css/installer.css'],
                ssr: 'resources/js/ssr.ts',
                refresh: true,
            }),
            tailwindcss(),
            vue({
                template: {
                    transformAssetUrls: {
                        base: null,
                        includeAbsolute: false,
                    },
                },
            }),
            i18n(),
        ],
        resolve: {
            alias: {
                '@': path.resolve(__dirname, './resources/js'),
                'ziggy-js': resolve(__dirname, 'vendor/tightenco/ziggy'),
            },
        },
        server: {
            host: '0.0.0.0',
            port: devPort,
            strictPort: true,
            hmr: {
                host: hmrHost,
                clientPort: hmrPort,
                protocol: hmrProtocol,
            },
        },
    };
});
