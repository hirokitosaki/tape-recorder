import { defineConfig } from 'vite';
export default defineConfig({
    root: 'src',
    publicDir: 'public',
    server: {
        host: true
    },
    build: {
        target: "es2020",
    },
    optimizeDeps: {
        esbuildOptions: { target: "es2020", supported: { bigint: true } },
    },
});