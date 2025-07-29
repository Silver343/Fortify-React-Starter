import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { wayfinder } from "@laravel/vite-plugin-wayfinder";
import { run } from 'vite-plugin-run';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [
        wayfinder({
            routes: false,
        }),
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            ssr: 'resources/js/ssr.tsx',
            refresh: true,
        }),
        react(),
        tailwindcss(),
        run([
            {
                name: 'wayfinder',
                run: ['php', 'artisan', 'wayfinder:generate --skip-routes'],
                pattern: ['routes/**/*.php', 'app/Http/Controllers/**/*.php', 'app/Actions/**/*.php'],
            }
        ])
    ],
    esbuild: {
        jsx: 'automatic',
    },
    resolve: {
        alias: {
            '@': '/resources/js',
            '@actions': '/resources/js/actions',
        },
    },
});
