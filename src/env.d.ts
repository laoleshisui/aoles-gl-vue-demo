/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module '*.glsl?url' {
  const url: string
  export default url
}

interface ImportMetaEnv {
  readonly VITE_API_DATA_SERVER?: string
  readonly VITE_API_GATEWAY: string
  readonly VITE_API_AGENT?: string
  readonly VITE_ASSERT_BASEPATH: string
  readonly VITE_IS_DEBUG: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
