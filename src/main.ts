import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import { createI18n } from 'vue-i18n'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

// 引入组件库的样式
import '@aoles-gl/vue/style.css'

// 引入组件库
import AolesGLVue, {
  setupAolesI18n,
  Engine,
  provideEngine,
  initEffects,
} from '@aoles-gl/vue'

import controllerJs from '@aoles-gl/core/wasm/GLController.mjs?url'
import controllerWasm from '@aoles-gl/core/wasm/GLController.wasm?url'

import App from './App.vue'

// 创建 i18n
const i18n = createI18n({
  legacy: false,
  locale: localStorage.getItem('lang') || 'zh',
  fallbackLocale: 'en',
  messages: { en: {}, zh: {} },
})

// 合并组件库的语言包
setupAolesI18n(i18n)

// 创建路由
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: App },
  ],
})

// 创建 app
const app = createApp(App)

// 安装插件
app.use(createPinia())
app.use(router)
app.use(i18n)
app.use(ElementPlus)
app.use(AolesGLVue)

// 创建 Engine 实例并配置 WASM 路径
const engine = new Engine(undefined, undefined, { width: 1920, height: 1080, fps: 30 })
engine.configure({ jsPath: controllerJs, wasmPath: controllerWasm })
engine.configAssetPath({
  basePath: import.meta.env.VITE_ASSERT_BASEPATH || '/'
})

// WASM 就绪后预加载字体和 shader 到 WASM 文件系统（文字渲染必须）
const ASSET_PRELOAD_LIST = [
  '/fonts/NotoSansSC-Regular.ttf',
  '/glsl/text/position_text.glsl',
  '/glsl/video/position.glsl',
  '/glsl/video/effect/hflip.glsl',
]

engine.onWasmReady(async () => {
  const base = (import.meta.env.VITE_ASSERT_BASEPATH || '').replace(/\/$/, '')
  for (const assetPath of ASSET_PRELOAD_LIST) {
    try {
      const res = await fetch(base + assetPath)
      if (!res.ok) { console.warn(`[aoles-gl] 加载失败: ${assetPath}`); continue }
      const buf = new Uint8Array(await res.arrayBuffer())
      // 确保目录存在
      const fs = (engine as any).controllerWasmLoader.module['GLController'].FS
      const parts = assetPath.split('/').filter(Boolean)
      parts.pop()
      let dir = ''
      for (const part of parts) {
        dir += `/${part}`
        try { fs.mkdir(dir) } catch {}
      }
      fs.writeFile(assetPath, buf)
    } catch (e) {
      console.warn(`[aoles-gl] 预加载失败: ${assetPath}`, e)
    }
  }
})

// 初始化特效
initEffects(engine)

// 注入 Engine（必须在 mount 之前）
provideEngine(engine, app)

app.mount('#app')
