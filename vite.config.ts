import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import viteTsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
    base: process.env.PUBLIC_URL || '/',
    plugins: [react(), viteTsconfigPaths()],
    server: {
        port: 3300,
        host: true,
        proxy: {
            '/api': {
                target: process.env.VITE_BTC_GIFTCARD_API_URL_ENV || 'http://localhost:3202',
                changeOrigin: true,
            },
        },
    },
    build: {
        outDir: 'build',
        sourcemap: false,
        minify: 'esbuild',
        rollupOptions: {
            output: {
                manualChunks: {
                    'react-vendor': ['react', 'react-dom'],
                    'redux-vendor': ['redux', 'react-redux', 'redux-persist'],
                    'router-vendor': ['react-router-dom'],
                },
            },
        },
    },
    envPrefix: 'VITE_',
})
