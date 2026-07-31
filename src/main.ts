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
console.log("import.meta.env.VITE_ASSERT_BASEPATH: ", import.meta.env.VITE_ASSERT_BASEPATH)
const engine = new Engine()
engine.configure({
  jsPath: '/src/wasm/GLController.mjs?url',
  wasmPath: '/src/wasm/GLController.wasm?url',
})
engine.configAssetPath({
  basePath: import.meta.env.VITE_ASSERT_BASEPATH || '/'
})

// 初始化特效
initEffects(engine)

// 注入 Engine（必须在 mount 之前）
provideEngine(engine, app)

app.mount('#app')
