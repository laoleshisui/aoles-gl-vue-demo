import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/aoles-gl-vue-demo/' : '/',
  plugins: [vue()],
  resolve: {
    dedupe: ['vue', 'pinia'],
  },
  server: {
    port: 4008,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
}))
