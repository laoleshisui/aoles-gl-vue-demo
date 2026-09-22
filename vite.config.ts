import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/aoles-gl-vue-demo/' : '/',
  plugins: [vue()],
  resolve: {
    dedupe: ['vue', 'pinia'],
  },
  optimizeDeps: {
    // The editor package is linked from the workspace. Rebuild its graph when
    // the linked dist changes so the attribute panel does not stay stale.
    force: true,
    include: ['@aoles-gl/core', '@aoles-gl/vue', '@aoles-gl/vue/ai'],
  },
  server: {
    port: 4008,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
}))
