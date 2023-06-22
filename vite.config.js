import { defineConfig } from 'vite';
export default defineConfig({
    root: 'src',
    base: '/tape-recorder/',
    publicDir: 'public',
    server: {
        host: true
    },
    build: {
        target: "es2020",
        outDir: '../dist',
    },
    optimizeDeps: {
        esbuildOptions: { target: "es2020", supported: { bigint: true } },
    },
});