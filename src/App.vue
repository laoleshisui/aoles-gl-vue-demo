<template>
  <AolesProvider :engine="engine">
    <div class="editor-root">
      <header class="header-bar">
        <div class="brand">
          <img class="brand-logo" :src="`${baseUrl}logo.png`" alt="Pixo" />
          <span class="header-title">Aoles GL Vue</span>
        </div>

        <div class="header-actions">
          <!-- 导出按钮区 -->
          <template v-if="previewState.wasmRuntimeInited">
            <div v-if="trackStore.isExporting" class="export-progress-wrap">
              <span class="export-label">导出中 {{ trackStore.exportProgress }}%</span>
              <el-progress
                :percentage="trackStore.exportProgress"
                :stroke-width="6"
                style="width: 140px;"
                status="striped"
                striped
                striped-flow
              />
              <el-button size="small" type="danger" plain @click="trackStore.stopExport()">取消</el-button>
            </div>
            <el-button
              v-else
              size="small"
              type="primary"
              :icon="VideoPlay"
              @click="handleExport"
            >
              导出视频
            </el-button>
          </template>
          <el-button
            size="small"
            :type="aiOpen ? 'primary' : 'default'"
            :icon="MagicStick"
            :aria-pressed="aiOpen"
            @click="aiOpen = !aiOpen"
          >
            AI 助手
          </el-button>
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

        <aside v-if="aiOpen" class="ai-section">
          <div v-if="aiEnabled" class="ai-panel-shell">
            <div v-if="aiAuthenticated" class="ai-auth-toolbar">
              <span>鉴权：{{ aiAuthLabel }}</span>
              <el-button size="small" text @click="apiKeyEditorOpen = !apiKeyEditorOpen">
                {{ apiKeyEditorOpen ? '返回助手' : '配置 API-Key' }}
              </el-button>
            </div>
            <AiApiKeyConfig
              v-if="apiKeyEditorOpen || !aiAuthenticated"
              :configured="Boolean(apiKey)"
              :can-cancel="aiAuthenticated"
              @save="saveAiApiKey"
              @cancel="apiKeyEditorOpen = false"
              @clear="clearAiApiKey"
            />
            <AolesAiPanel v-else :config="aiConfig" />
          </div>
          <div v-else class="ai-unavailable">
            <strong>AI 助手尚未配置</strong>
            <span>请在 <code>.env.development.local</code> 中设置 <code>VITE_API_AGENT</code>。</span>
          </div>
        </aside>
      </div>

      <!-- 全局配置弹窗 -->
      <GlobalConfigDialog />
    </div>
  </AolesProvider>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { CircleCheck, Loading, MagicStick, Moon, Sunny, VideoPlay } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
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
  useResourceState,
  useTrackState,
} from '@aoles-gl/vue'
import { AolesAiPanel, type VueAolesAiConfig } from '@aoles-gl/vue/ai'
import AiApiKeyConfig from './components/AiApiKeyConfig.vue'

const AI_API_KEY_STORAGE_KEY = 'aoles-gl-vue-demo:ai-api-key'

function readAccessToken() {
  const token = localStorage.getItem('access_token')?.trim()
  return token && token !== 'your-token' ? token : undefined
}

const engine = useEngine()
const pageStore = usePageState(engine)
const previewState = usePreviewState(engine)
const resourceState = useResourceState(engine)
const trackStore = useTrackState(engine)
const baseUrl = import.meta.env.BASE_URL
const aiOpen = ref(true)
const apiKey = ref(sessionStorage.getItem(AI_API_KEY_STORAGE_KEY)?.trim() ?? '')
const apiKeyEditorOpen = ref(!apiKey.value && !readAccessToken())
const agentBaseUrl = import.meta.env.VITE_API_AGENT?.trim().replace(/\/+$/, '') ?? ''
const aiEnabled = Boolean(agentBaseUrl)
const aiAuthenticated = computed(() => Boolean(apiKey.value || readAccessToken()))
const aiAuthLabel = computed(() => apiKey.value ? 'API-Key（当前标签页）' : 'JWT')
const aiEndpoint = agentBaseUrl.endsWith('/api/chat')
  ? agentBaseUrl
  : `${agentBaseUrl}/api/chat`

const aiConfig: VueAolesAiConfig & { storageKey: string } = {
  endpoint: aiEndpoint,
  storageKey: 'aoles-gl-vue-demo:ai-sessions',
  getToken: () => apiKey.value ? undefined : readAccessToken(),
  headers: () => apiKey.value
    ? { Authorization: `Api-Key ${apiKey.value}` }
    : {},
  getAssets: () => resourceState.resources.value
    .filter(resource => (
      resource.status === 'ready'
      && (resource.type === 'video' || resource.type === 'audio' || resource.type === 'image')
    ))
    .map(resource => ({
      id: resource.id,
      type: resource.type,
      prompt: resource.name,
      urls: [{
        id: resource.id,
        url: resource.url,
        origin_url: null,
        ...resource.metadata,
      }],
    })),
  authorizeToolCall: ({ name }) => {
    if (name === 'removeClip' || name === 'removeTrack') {
      return window.confirm('允许 AI 助手删除编辑器内容吗？')
    }
    return true
  },
  onError: error => {
    console.error('[aoles-gl-ai]', error)
    const message = error instanceof Error ? error.message : String(error)
    if (/401|invalid (token|credentials|api key)/i.test(message)) {
      ElMessage.error('AI 鉴权失败，请检查 API-Key 或重新登录。')
    }
  },
}

function saveAiApiKey(value: string) {
  sessionStorage.setItem(AI_API_KEY_STORAGE_KEY, value)
  apiKey.value = value
  apiKeyEditorOpen.value = false
}

function clearAiApiKey() {
  sessionStorage.removeItem(AI_API_KEY_STORAGE_KEY)
  apiKey.value = ''
  apiKeyEditorOpen.value = !readAccessToken()
}

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

function handleExport() {
  // width/height/fps/sample_rate 由 C++ 端从渲染 context 自动读取，无需传入。
  // 若需要自定义编码参数，可传第二、三个参数：
  // trackStore.startExport('/tmp/export_out.mp4',
  //   { bps: 8_000_000, codec_name: 'libx264' },
  //   { codec_name: 'aac', bps: 192000 }
  // )
  trackStore.startExport('/tmp/export_out.mp4')
}
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

.brand-logo {
  display: block;
  width: 48px;
  height: 24px;
  object-fit: contain;
}

.header-title {
  color: var(--aoles-color-text);
  font-size: 14px;
  font-weight: 600;
}

.header-actions {
  gap: 12px;
}

.export-progress-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  border-radius: var(--aoles-control-radius);
  background: var(--aoles-color-surface-muted);
}

.export-label {
  font-size: 12px;
  color: var(--aoles-color-text-muted);
  white-space: nowrap;
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

.ai-section {
  width: min(380px, 30vw);
  min-width: 320px;
  flex-shrink: 0;
  overflow: hidden;
}

.ai-panel-shell {
  display: flex;
  height: 100%;
  min-height: 0;
  flex-direction: column;
  gap: 8px;
}

.ai-panel-shell > :last-child {
  min-height: 0;
  flex: 1;
}

.ai-auth-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px;
  border: 1px solid var(--aoles-color-border);
  border-radius: var(--aoles-control-radius);
  color: var(--aoles-color-text-muted);
  background: var(--aoles-color-surface);
  font-size: 12px;
}

.ai-unavailable {
  display: flex;
  height: 100%;
  min-height: 320px;
  box-sizing: border-box;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px;
  border: 1px solid var(--aoles-color-border);
  border-radius: var(--aoles-panel-radius);
  color: var(--aoles-color-text-muted);
  background: var(--aoles-color-surface);
  text-align: center;
}

.ai-unavailable strong {
  color: var(--aoles-color-text);
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

  .ai-section {
    width: 100%;
    min-width: 0;
    height: 420px;
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
