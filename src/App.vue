<template>
  <AolesProvider :engine="engine">
    <div class="editor-root">
      <header class="header-bar">
        <div class="brand">
          <span class="brand-mark" aria-hidden="true">
            <el-icon><VideoCamera /></el-icon>
          </span>
          <span class="header-title">Aoles GL Vue</span>
        </div>

        <div class="header-actions">
          <span
            class="runtime-status"
            :class="previewState.wasmRuntimeInited ? 'runtime-status-ready' : 'runtime-status-loading'"
          >
            <el-icon v-if="previewState.wasmRuntimeInited"><CircleCheck /></el-icon>
            <el-icon v-else class="is-loading"><Loading /></el-icon>
            {{ previewState.wasmRuntimeInited ? 'WASM Ready' : 'Loading WASM...' }}
          </span>
          <el-tooltip :content="pageStore.isDark ? '切换到浅色模式' : '切换到深色模式'" placement="bottom">
            <button
              class="theme-toggle"
              type="button"
              :aria-label="pageStore.isDark ? '切换到浅色模式' : '切换到深色模式'"
              @click="pageStore.isDark = !pageStore.isDark"
            >
              <el-icon v-if="pageStore.isDark"><Sunny /></el-icon>
              <el-icon v-else><Moon /></el-icon>
            </button>
          </el-tooltip>
        </div>
      </header>

      <div class="main-content">
        <!-- 左侧资源面板 -->
        <div class="card-style resources-section">
          <ResourceContainer extract-audio />
        </div>

        <!-- 右侧主区域 -->
        <div class="right-section">
          <!-- 上：预览 + 属性 -->
          <div class="preview-attr-row">
            <div class="card-style preview-section">
              <ControllerPreview />
            </div>
            <div class="card-style attr-section">
              <AttributeContainer />
            </div>
          </div>

          <!-- 下：轨道 -->
          <div class="card-style track-section">
            <TrackContainer />
          </div>
        </div>
      </div>

      <!-- 全局配置弹窗 -->
      <GlobalConfigDialog />
    </div>
  </AolesProvider>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, watch } from 'vue'
import { CircleCheck, Loading, Moon, Sunny, VideoCamera } from '@element-plus/icons-vue'
import {
  AolesProvider,
  ControllerPreview,
  AttributeContainer,
  TrackContainer,
  GlobalConfigDialog,
  ResourceContainer,
  useEngine,
  usePageState,
  usePreviewState,
} from '@aoles-gl/vue'

const engine = useEngine()
const pageStore = usePageState(engine)
const previewState = usePreviewState(engine)

function syncDocumentTheme(isDark: boolean) {
  document.documentElement.classList.toggle('dark', isDark)
}

onMounted(() => {
  syncDocumentTheme(pageStore.isDark)
})

watch(() => pageStore.isDark, syncDocumentTheme)

onBeforeUnmount(() => {
  document.documentElement.classList.remove('dark')
})
</script>

<style>
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #f3f5f7;
}

html.dark,
html.dark body {
  background: #12151a;
}

#app {
  height: 100%;
}

.editor-root {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--aoles-color-canvas);
  color: var(--aoles-color-text);
  padding: 8px 12px 12px;
  box-sizing: border-box;
}

.header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 44px;
  flex-shrink: 0;
  margin-bottom: 10px;
}

.brand,
.header-actions,
.runtime-status {
  display: flex;
  align-items: center;
}

.brand {
  gap: 8px;
}

.brand-mark {
  display: grid;
  width: 24px;
  height: 24px;
  place-items: center;
  border-radius: var(--aoles-control-radius);
  background: var(--aoles-color-primary);
  color: #fff;
}

.header-title {
  color: var(--aoles-color-text);
  font-size: 14px;
  font-weight: 600;
}

.header-actions {
  gap: 12px;
}

.runtime-status {
  gap: 5px;
  font-size: 12px;
}

.runtime-status-loading {
  color: var(--aoles-color-warning);
}

.runtime-status-ready {
  color: var(--aoles-color-success);
}

.theme-toggle {
  display: grid;
  width: 30px;
  height: 30px;
  padding: 0;
  place-items: center;
  border: 0;
  border-radius: var(--aoles-control-radius);
  background: transparent;
  color: var(--aoles-color-text-muted);
  cursor: pointer;
  font-size: 17px;
  transition: background-color var(--aoles-motion-duration), color var(--aoles-motion-duration);
}

.theme-toggle:hover {
  background: var(--aoles-color-surface-muted);
  color: var(--aoles-color-text);
}

.card-style {
  border: 1px solid var(--aoles-color-border);
  border-radius: var(--aoles-panel-radius);
  background: var(--aoles-color-surface);
  box-shadow: var(--aoles-shadow-panel);
}

.main-content {
  display: flex;
  flex: 1;
  flex-direction: row;
  overflow: hidden;
  gap: var(--aoles-panel-gap);
}

.resources-section {
  display: flex;
  overflow: hidden;
  width: 200px;
  flex-shrink: 0;
}

.full-size {
  width: 100%;
  height: 100%;
  min-width: 0;
}

.right-section {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  gap: var(--aoles-panel-gap);
  flex-grow: 1;
  min-width: 0;
}

.preview-attr-row {
  display: flex;
  flex: 1;
  flex-direction: row;
  flex-wrap: nowrap;
  gap: var(--aoles-panel-gap);
}

.preview-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.attr-section {
  flex-shrink: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.track-section {
  overflow: hidden;
}

/* 响应式 */
@media (max-width: 1024px) {
  .main-content,
  .preview-attr-row {
    flex-direction: column !important;
  }
}

/* 滚动条 */
::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-track {
  background: var(--aoles-color-surface-muted);
}
::-webkit-scrollbar-thumb {
  background: var(--aoles-color-border-strong);
  border-radius: 9999px;
}
</style>
