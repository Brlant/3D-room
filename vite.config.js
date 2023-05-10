import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'

import {fileURLToPath, URL} from 'node:url'
import glsl from 'rollup-plugin-glsl'

export default defineConfig({
    plugins: [vue(), glsl({
        include: "**/*.glsl",
        exclude: ['**/index.html']
    })],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        }
    },
    build: {},
    server: {
        host: '0.0.0.0',
        port: 5173,
        proxy: {
            '/api': {
                target: '',
                changeOrigin: true,
            }
        }
    }
})
