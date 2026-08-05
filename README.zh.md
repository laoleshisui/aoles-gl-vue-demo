<div align="center">
  <img src="./public/favicon.ico" width="80" height="80" alt="Aoles GL logo" />
  <h1>Aoles GL — Vue Test</h1>
  <p><strong><a href="https://github.com/laoleshisui/aoles-gl-vue-open">aoles-gl-vue</a> 的集成示例项目 — 基于 Vue 3 + WebGL/OpenGL 的高性能 Web 视频编辑器组件库</strong></p>
  <p>
    <img src="https://img.shields.io/badge/Vue-3.4+-42b883?logo=vue.js&logoColor=white" alt="Vue 3" />
    <img src="https://img.shields.io/badge/TypeScript-5.4+-3178c6?logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Vite-5-646cff?logo=vite&logoColor=white" alt="Vite" />
    <img src="https://img.shields.io/badge/WASM-enabled-654ff0?logo=webassembly&logoColor=white" alt="WASM" />
  </p>
  <p>
    <a href="./README.md">English</a> · <a href="./README.zh.md">中文</a>
  </p>
</div>

---

## 这是什么？

这是 [`aoles-gl-vue`](https://github.com/laoleshisui/aoles-gl-vue-open) 的官方集成示例项目 —— 一个基于 Vue 3 + WebGL/OpenGL 的专业级 Web 视频编辑器组件库。

项目展示了完整的真实接入方案：六个编辑器组件全部组合使用、WASM 配置、资源路径设置、i18n 初始化，以及用于服务端渲染的导出回调接入。可作为你将 `aoles-gl-vue` 集成到自己项目时的参考。

## ✨ 示例内容

- **完整编辑器布局** — 六个组件（`HeaderContainer`、`ResourcesContainer`、`ControllerPreview`、`AttributeContainer`、`TrackContainer`、`GlobalConfigDialog`）组合成完整的编辑器界面
- **WASM 配置** — 通过 `usePageState` 配置 `wasmConfig`（`.mjs` + `.wasm` 路径）
- **资源路径配置** — 使用 `configAssetPath` 配合环境变量，支持 CDN 托管字体和 GLSL 着色器
- **自定义资源注册** — 通过 `registerFont` / `registerTransition` 注册自定义字体和转场（见 `src/customAssets.ts`）
- **导出回调** — 通过 `generateCallback` 将控制器 JSON 提交到后端渲染服务（见 `src/glcontroller.ts`）
- **必要的 HTTP 头** — Vite 中配置 `Cross-Origin-Opener-Policy` 和 `Cross-Origin-Embedder-Policy`，以支持 SharedArrayBuffer / WASM

## 📋 前置要求

- Node.js 18+
- pnpm 11.18.0
- 将 `aoles-gl-web-package` 仓库克隆到本仓库同级目录
- [`aoles-gl-vue`](https://github.com/laoleshisui/aoles-gl-vue-open#-installation) 所需的 peer dependencies 均已包含在本项目的 `package.json` 中

## 🚀 快速开始

**1. 克隆并安装依赖**

```bash
git clone https://github.com/laoleshisui/aoles-gl-vue-test.git
cd aoles-gl-vue-test
pnpm packages:install
```

**2. 配置环境变量**

```bash
# .env.development
VITE_ASSERT_BASEPATH=https://your-cdn.com/assets/
```

该路径会传入 `configAssetPath`，告知组件库从哪里加载字体、GLSL 着色器等静态资源。

**3. 放置 WASM 文件**

将 `GLController.mjs` 和 `GLController.wasm` 放入 `src/wasm/` 目录。这两个文件是驱动渲染引擎的 WebAssembly 二进制文件。

**4. 启动开发服务器**

```bash
pnpm dev
# → http://localhost:4008
```

`pnpm packages:install` 会在同级包仓库中构建可发布 tarball，并安装这些
发布产物，而不是链接源码目录。`@aoles-gl/core` 和 `@aoles-gl/vue` 的
`0.1.0` 发布后，可执行 `npm run registry:verify` 验证 registry 中的
正式版本。

## 📁 项目结构

```
src/
├── main.ts          # 应用初始化 — 插件、i18n、WASM 配置、资源路径
├── App.vue          # 使用全部六个组件的完整编辑器布局
├── glcontroller.ts  # 导出回调 — 将控制器 JSON 提交到后端渲染服务
├── customAssets.ts  # 示例：注册自定义字体和转场特效
└── wasm/            # GLController.mjs + GLController.wasm（不提交到仓库）
```

## ⚙️ 关键配置

**main.ts — 完整初始化顺序**

```ts
import AolesGLVue, { setupAolesI18n, usePageState, configAssetPath } from 'aoles-gl-vue'
import 'aoles-gl-vue/style.css'

// 1. 初始化 i18n
const i18n = createI18n({ legacy: false, locale: 'zh' })
setupAolesI18n(i18n)

// 2. 安装插件
app.use(AolesGLVue)

// 3. 配置资源路径（必须在 mount 之前）
configAssetPath({ basePath: import.meta.env.VITE_ASSERT_BASEPATH || '/' })

// 4. 配置 WASM 路径（必须在 mount 之前）
const pageStore = usePageState()
pageStore.wasmConfig = {
  jsPath: '/src/wasm/GLController.mjs?url',
  wasmPath: '/src/wasm/GLController.wasm?url',
}

// 5. 配置导出回调
pageStore.generateCallback = GLControllerExport
```

**Vite — 必要的 COOP/COEP 响应头**

```ts
server: {
  headers: {
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Embedder-Policy': 'require-corp',
  }
}
```

这两个响应头是 `SharedArrayBuffer` 的必要条件，而 WASM 依赖它才能正常运行。

## 💬 交流群

<div align="center">
  <img src="./public/image/cover/qq_group.png" width="200" alt="QQ 交流群" />
</div>

## 🔗 相关项目

- [aoles-gl-vue](https://github.com/laoleshisui/aoles-gl-vue-open) — 本项目所集成的组件库

## 📄 开源协议

[Apache-2.0](./LICENSE) © laoleshisui
