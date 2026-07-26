import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

const resolvePath = (p) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
    base: './',
    plugins: [react(), tailwindcss()],
    server: {
        host: true,
        port: 5173,
        strictPort: true,
    },
    build: {
        outDir: 'dist',
        emptyOutDir: true,
        rollupOptions: {
            input: {
                main: resolvePath('./index.html'),
                bar: resolvePath('./bar.html')
            },
        },
    },
});