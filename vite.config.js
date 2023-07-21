import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'

import {fileURLToPath, URL} from 'node:url'
import glsl from 'rollup-plugin-glsl'

let target = {
    websocket:'ws://in-position.gksw-dt.com:8110',
    websocketYj:'ws://192.168.5.22:8110',
};

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
                target: target.websocket,
                changeOrigin: true,
            }
        }
    }
})
