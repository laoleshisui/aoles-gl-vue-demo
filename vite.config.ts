import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import VitePluginVueDevtools from 'vite-plugin-vue-devtools';

export default defineConfig(({ mode }) => ({
  plugins: [
    vue(),
    VitePluginVueDevtools(),
  ],
  resolve: {
    dedupe: ['vue', 'pinia', 'vue-router'],
  },
  server: {
    port: 4008,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
}))
