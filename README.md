<div align="center">
  <img src="./public/favicon.ico" width="80" height="80" alt="Aoles GL logo" />
  <h1>Aoles GL — Vue Test</h1>
  <p><strong>Integration demo app for <a href="https://github.com/laoleshisui/aoles-gl-vue-open">aoles-gl-vue</a> — a high-performance web video editor component library</strong></p>
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

## What is this?

This is the official integration demo for [`aoles-gl-vue`](https://github.com/laoleshisui/aoles-gl-vue-open) — a professional-grade web video editor component library powered by Vue 3 + WebGL/OpenGL.

It shows a complete, real-world setup: all six editor components wired together, WASM configured, asset paths set, i18n initialized, and an export callback hooked up for server-side rendering. Use it as a reference when integrating `aoles-gl-vue` into your own project.

## ✨ What it demonstrates

- **Full editor layout** — all six components (`HeaderContainer`, `ResourcesContainer`, `ControllerPreview`, `AttributeContainer`, `TrackContainer`, `GlobalConfigDialog`) composed into a complete editor UI
- **WASM setup** — how to configure `wasmConfig` (`.mjs` + `.wasm` paths) via `usePageState`
- **Asset path configuration** — using `configAssetPath` with an environment variable for CDN-hosted fonts and GLSL shaders
- **Custom assets** — registering custom fonts and transitions via `registerFont` / `registerTransition` (see `src/customAssets.ts`)
- **Export callback** — wiring up `generateCallback` to post the controller JSON to a backend render service (see `src/glcontroller.ts`)
- **Required HTTP headers** — `Cross-Origin-Opener-Policy` and `Cross-Origin-Embedder-Policy` configured in Vite for SharedArrayBuffer / WASM support

## 📋 Prerequisites

- Node.js 18+
- The peer dependencies listed in [`aoles-gl-vue`](https://github.com/laoleshisui/aoles-gl-vue-open#-installation) are all included in this project's `package.json`

## 🚀 Getting Started

**1. Clone and install**

```bash
git clone https://github.com/laoleshisui/aoles-gl-vue-test.git
cd aoles-gl-vue-test
npm install
```

**2. Configure environment**

```bash
# .env.development
VITE_ASSERT_BASEPATH=https://your-cdn.com/assets/
```

This path is passed to `configAssetPath` and tells the library where to load fonts, GLSL shaders, and other static assets from.

**3. Place WASM files**

Put `GLController.mjs` and `GLController.wasm` in `src/wasm/`. These are the WebAssembly binaries that power the rendering engine.

**4. Run**

```bash
npm run dev
# → http://localhost:4008
```

## 📁 Project Structure

```
src/
├── main.ts          # App bootstrap — plugins, i18n, WASM config, asset path
├── App.vue          # Full editor layout using all six components
├── glcontroller.ts  # Export callback — posts controller JSON to render backend
├── customAssets.ts  # Example: registering custom fonts and transitions
└── wasm/            # GLController.mjs + GLController.wasm (not committed)
```

## ⚙️ Key Configuration

**main.ts — the full setup sequence**

```ts
import AolesGLVue, { setupAolesI18n, usePageState, configAssetPath } from 'aoles-gl-vue'
import 'aoles-gl-vue/style.css'

// 1. i18n
const i18n = createI18n({ legacy: false, locale: 'en' })
setupAolesI18n(i18n)

// 2. Install plugin
app.use(AolesGLVue)

// 3. Asset path (must be before mount)
configAssetPath({ basePath: import.meta.env.VITE_ASSERT_BASEPATH || '/' })

// 4. WASM config (must be before mount)
const pageStore = usePageState()
pageStore.wasmConfig = {
  jsPath: '/src/wasm/GLController.mjs?url',
  wasmPath: '/src/wasm/GLController.wasm?url',
}

// 5. Export callback
pageStore.generateCallback = GLControllerExport
```

**Vite — required COOP/COEP headers**

```ts
server: {
  headers: {
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Embedder-Policy': 'require-corp',
  }
}
```

These headers are required for `SharedArrayBuffer`, which WASM relies on.

## 💬 Community

<div align="center">
  <img src="./public/image/cover/qq_group.png" width="200" alt="QQ Group" />
</div>

## 🔗 Related

- [aoles-gl-vue](https://github.com/laoleshisui/aoles-gl-vue-open) — the component library this project integrates

## 📄 License

[Apache-2.0](./LICENSE) © laoleshisui
