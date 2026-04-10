import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import VitePluginVueDevtools from 'vite-plugin-vue-devtools';

export default defineConfig(({ mode }) => ({
  plugins: [
    vue(),
    VitePluginVueDevtools(),
  ],
  server: {
    port: 4008,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
    // 如需代理后端 API，取消注释并配置
    // proxy: {
    //   '/dataserver': {
    //     target: 'http://localhost:8080',
    //     changeOrigin: true,
    //   },
    //   '/gateway': {
    //     target: 'http://localhost:8080',
    //     changeOrigin: true,
    //   },
    // },
  },
}))
