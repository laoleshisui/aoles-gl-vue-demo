# aoles-gl-vue-test 适配说明

## 改动概述

测试项目已适配新的资源配置系统，使用 `configAssetPath` 替代硬编码的环境变量。

## 修改的文件

### 1. src/main.ts

**改动前：**
```typescript
import AolesGLVue, { setupAolesI18n, usePageState } from 'aoles-gl-vue'

// ... 其他代码

app.use(AolesGLVue)

// 配置 WASM 路径
const pageStore = usePageState()
pageStore.wasmConfig = { ... }
```

**改动后：**
```typescript
import AolesGLVue, { setupAolesI18n, usePageState, configAssetPath } from 'aoles-gl-vue'

// ... 其他代码

app.use(AolesGLVue)

// 配置资源路径（字体、GLSL shader 等静态资源）
configAssetPath({
  basePath: import.meta.env.VITE_ASSERT_BASEPATH || '/'
})

// 配置 WASM 路径
const pageStore = usePageState()
pageStore.wasmConfig = { ... }
```

### 2. src/customAssets.ts (新增)

提供自定义资源注册示例：
- `setupCustomFonts()` - 注册自定义字体
- `setupCustomTransitions()` - 注册自定义转场特效

## 环境变量

`.env` 文件中的 `VITE_ASSERT_BASEPATH` 保持不变：

```bash
# 静态资源 CDN 路径（字体、GLSL 着色器等）
VITE_ASSERT_BASEPATH=https://oss.pixoclip.com/pixoclip/
```

现在这个环境变量通过 `configAssetPath()` 函数使用，而不是在组件库内部直接读取。

## 使用说明

### 基础使用（当前配置）

```typescript
// main.ts
import { configAssetPath } from 'aoles-gl-vue'

// 从环境变量读取资源路径
configAssetPath({
  basePath: import.meta.env.VITE_ASSERT_BASEPATH || '/'
})
```

### 注册自定义字体

```typescript
// main.ts
import { configAssetPath, registerFont } from 'aoles-gl-vue'

configAssetPath({
  basePath: import.meta.env.VITE_ASSERT_BASEPATH || '/'
})

// 注册自定义字体
registerFont({
  value: 'CustomFont',
  label: 'My Custom Font',
  data: { path: '/fonts/CustomFont.ttf' }
})
```

### 注册自定义转场特效

```typescript
// main.ts
import { configAssetPath, registerTransition } from 'aoles-gl-vue'

configAssetPath({
  basePath: import.meta.env.VITE_ASSERT_BASEPATH || '/'
})

// 注册自定义转场特效
registerTransition({
  value: 'CustomTransition',
  label: 'My Custom Transition',
  data: {
    name: 'My Custom Transition',
    controller_key: 'transition_key_custom',
    transition_duration_ts: 15,
    path: '/glsl/video/transition/custom.glsl',
    uniforms: []
  }
})
```

### 使用示例文件

如果需要注册自定义资源，可以使用 `src/customAssets.ts`：

```typescript
// main.ts
import { configAssetPath } from 'aoles-gl-vue'
import { setupCustomFonts, setupCustomTransitions } from './customAssets'

// 1. 配置资源路径
configAssetPath({
  basePath: import.meta.env.VITE_ASSERT_BASEPATH || '/'
})

// 2. 注册自定义资源
setupCustomFonts()
setupCustomTransitions()
```

## 测试步骤

1. **安装依赖**
   ```bash
   cd /Users/yangxian/dev/aoles-gl-vue-test
   npm install
   ```

2. **启动开发服务器**
   ```bash
   npm run dev
   ```

3. **验证资源加载**
   - 打开浏览器开发者工具
   - 查看 Network 标签
   - 确认字体和 GLSL 文件从正确的路径加载（应该是 `https://oss.pixoclip.com/pixoclip/...`）

4. **测试自定义资源（可选）**
   - 取消 `src/customAssets.ts` 中的注释
   - 在 `main.ts` 中导入并调用
   - 确认自定义资源正确注册

## 优势

1. **解耦**：资源路径配置不再依赖组件库内部的环境变量
2. **灵活**：可以在运行时动态配置资源路径
3. **可扩展**：支持注册自定义字体和转场特效
4. **类型安全**：完整的 TypeScript 类型支持

## 注意事项

1. **配置顺序**：必须在使用组件前调用 `configAssetPath()`
2. **资源路径**：确保 `VITE_ASSERT_BASEPATH` 指向的资源文件可访问
3. **CORS**：如果使用跨域 CDN，确保配置了正确的 CORS 头

## 相关文档

- [aoles-gl-vue-open/ASSET_CONFIG.md](../aoles-gl-vue-open/ASSET_CONFIG.md) - 资源路径配置详细指南
- [aoles-gl-vue-open/CUSTOM_ASSETS.md](../aoles-gl-vue-open/CUSTOM_ASSETS.md) - 自定义资源注册详细指南
- [aoles-gl-vue-open/REFACTOR_SUMMARY.md](../aoles-gl-vue-open/REFACTOR_SUMMARY.md) - 重构总结
