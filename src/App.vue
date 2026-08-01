<template>
  <div class="editor-root">
    <!-- Header：应用层自行实现，不再由库提供 -->
    <div class="card-style header-section">
      <div class="app-header">
        <span class="app-title">Editor</span>
        <button class="add-text-btn" @click="addCustomText">+ 添加文字</button>
      </div>
    </div>

    <div class="main-content">
      <!-- 左侧资源面板 -->
      <div class="card-style resources-section">
        <ResourcePanel />
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
</template>

<script setup lang="ts">
import {
  ControllerPreview,
  AttributeContainer,
  TrackContainer,
  GlobalConfigDialog,
  useEngine,
  usePreviewState,
  createTrackPipeline,
} from '@aoles-gl/vue'
import ResourcePanel from './components/ResourcePanel.vue'

const engine = useEngine()
const previewState = usePreviewState(engine)
const pipeline = createTrackPipeline(engine)

async function addCustomText() {
  await pipeline.addResource(
    {
      name: '请输入文字',   // name 才是引擎实际渲染的文字内容，content 无效
      fontSize: 25,
      fontFamily: 'NotoSansSC',
      type: 'text',
    },
    { startTime: Number(previewState.currentTS) + 1 }
  )
  // 强制刷新一帧，否则暂停状态下不会重新渲染
  await pipeline.renderCurrentFrame()
}
</script>

<style>
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

#app {
  height: 100%;
}

.editor-root {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  padding: 16px;
  padding-bottom: 0;
  box-sizing: border-box;
}

.dark .editor-root {
  background: linear-gradient(135deg, #111827 0%, #030712 100%);
}

.card-style {
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  background: rgba(255,255,255,0.8);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(229,231,235,0.5);
}

.dark .card-style {
  background: rgba(31,41,55,0.8);
  border-color: rgba(55,65,81,0.5);
}

.header-section {
  margin-bottom: 16px;
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
}

.app-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.dark .app-title {
  color: #f9fafb;
}

.add-text-btn {
  padding: 6px 14px;
  border-radius: 8px;
  border: 1px solid rgba(99, 102, 241, 0.3);
  background: rgba(99, 102, 241, 0.1);
  color: #4f46e5;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.add-text-btn:hover {
  background: rgba(99, 102, 241, 0.2);
  border-color: rgba(99, 102, 241, 0.5);
}

.dark .add-text-btn {
  border-color: rgba(139, 92, 246, 0.4);
  background: rgba(139, 92, 246, 0.15);
  color: #a78bfa;
}

.dark .add-text-btn:hover {
  background: rgba(139, 92, 246, 0.25);
  border-color: rgba(139, 92, 246, 0.6);
}


.main-content {
  display: flex;
  flex: 1;
  flex-direction: row;
  overflow: hidden;
  gap: 16px;
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
  gap: 16px;
  padding-top: 4px;
  flex-grow: 1;
  min-width: 0;
}

.preview-attr-row {
  display: flex;
  flex: 1;
  flex-direction: row;
  flex-wrap: nowrap;
  gap: 16px;
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
  background: #f1f5f9;
}
::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 9999px;
}
</style>
