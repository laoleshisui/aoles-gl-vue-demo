<template>
  <div class="resource-panel">
    <!-- 标签页 -->
    <div class="resource-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.type"
        class="tab-btn"
        :class="{ active: activeTab === tab.type }"
        @click="activeTab = tab.type"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- 工具栏：导入按钮 -->
    <div class="resource-toolbar">
      <button class="import-btn" @click="openFilePicker">
        <span class="import-icon">＋</span> 导入{{ currentTab.label }}
      </button>
      <input
        ref="fileInputRef"
        type="file"
        multiple
        :accept="currentTab.accept"
        style="display: none"
        @change="onFilesSelected"
      />
    </div>

    <!-- 文件网格 -->
    <div v-if="currentFiles.length > 0" class="resource-grid">
      <div
        v-for="item in currentFiles"
        :key="item.id"
        class="resource-item"
        :class="{ loading: item.loading }"
        :title="'点击添加到轨道：' + item.file.name"
        @click="addToTrack(item)"
      >
        <div class="resource-thumb">
          <img v-if="item.thumb" :src="item.thumb" class="thumb-img" />
          <span v-else class="thumb-icon">{{ currentTab.icon }}</span>
          <div v-if="item.loading" class="loading-mask">
            <span class="loading-spinner" />
          </div>
        </div>
        <div class="resource-name">{{ item.file.name }}</div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="resource-empty">
      <span class="empty-icon">{{ currentTab.icon }}</span>
      <p>点击「导入」添加{{ currentTab.label }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { useEngine, createTrackPipeline, usePreviewState } from '@aoles-gl/vue'
import { ElMessage } from 'element-plus'

interface TabConfig {
  type: string
  label: string
  accept: string
  icon: string
  /** addUrlsToTrack 的 material.type */
  materialType: string
}

interface ResourceItem {
  id: string
  file: File
  thumb: string | null
  loading: boolean
}

const tabs: TabConfig[] = [
  { type: 'video',    label: '视频', accept: 'video/*',                icon: '🎬', materialType: 'video'    },
  { type: 'audio',    label: '音频', accept: 'audio/*',                icon: '🎵', materialType: 'audio'    },
  { type: 'image',    label: '图片', accept: 'image/*',                icon: '🖼️', materialType: 'video'    },
  { type: 'subtitle', label: '字幕', accept: '.srt',                   icon: '💬', materialType: 'subtitle' },
  { type: 'font',     label: '字体', accept: '.ttf,.otf,.woff,.woff2', icon: '🔤', materialType: 'font'     },
]

const activeTab = ref<string>('video')
const fileInputRef = ref<HTMLInputElement | null>(null)

// 各 tab 独立维护文件列表
const fileMap = reactive<Record<string, ResourceItem[]>>({
  video:    [],
  audio:    [],
  image:    [],
  subtitle: [],
  font:     [],
})

const currentTab = computed(() => tabs.find(t => t.type === activeTab.value)!)
const currentFiles = computed(() => fileMap[activeTab.value] ?? [])

const engine = useEngine()
const pipeline = createTrackPipeline(engine)
const previewState = usePreviewState(engine)

function openFilePicker() {
  fileInputRef.value?.click()
}

/** 为视频/图片文件生成缩略图 */
async function generateThumb(file: File): Promise<string | null> {
  if (file.type.startsWith('image/')) {
    return URL.createObjectURL(file)
  }
  if (file.type.startsWith('video/')) {
    return new Promise<string | null>(resolve => {
      const video = document.createElement('video')
      const src = URL.createObjectURL(file)
      video.preload = 'metadata'
      video.muted = true
      video.src = src
      video.onloadeddata = () => { video.currentTime = 0.5 }
      video.onseeked = () => {
        const canvas = document.createElement('canvas')
        canvas.width = 120
        canvas.height = 68
        canvas.getContext('2d')?.drawImage(video, 0, 0, 120, 68)
        URL.revokeObjectURL(src)
        resolve(canvas.toDataURL('image/jpeg', 0.7))
      }
      video.onerror = () => { URL.revokeObjectURL(src); resolve(null) }
    })
  }
  return null
}

async function onFilesSelected(event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.files?.length) return

  for (const file of Array.from(input.files)) {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    const item: ResourceItem = { id, file, thumb: null, loading: false }
    fileMap[activeTab.value].push(item)
    // 异步生成缩略图，不阻塞列表渲染
    generateThumb(file).then(thumb => { item.thumb = thumb })
  }

  input.value = '' // 允许重复选取同名文件
}

/** 点击素材项，将其添加到轨道 */
async function addToTrack(item: ResourceItem) {
  if (item.loading) return
  item.loading = true
  const blobUrl = URL.createObjectURL(item.file)
  try {
    // 以当前播放头位置作为片段起始帧（与参考实现一致）
    const startTime = Number(previewState.currentTS) + 1

    // addUrlsToTrack 内部已经处理了视频音频分离
    // 当添加视频文件时，会自动提取音频并创建独立的音频轨道
    await pipeline.addUrlsToTrack(
      {
        type: currentTab.value.materialType,
        urls: [{ url: blobUrl, file: item.file }],
      },
      { startTime }
    )
    ElMessage.success(`已添加到轨道：${item.file.name}`)
  } catch (err) {
    console.error('[ResourcePanel] addToTrack failed:', err)
    ElMessage.error('添加失败，请检查控制台')
  } finally {
    item.loading = false
  }
}
</script>

<style scoped>
.resource-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  padding: 12px 10px;
  box-sizing: border-box;
  gap: 10px;
}

/* ---- tabs ---- */
.resource-tabs {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.tab-btn {
  padding: 4px 10px;
  border: 1px solid rgba(229, 231, 235, 0.8);
  border-radius: 8px;
  background: transparent;
  font-size: 12px;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.15s;
}

.tab-btn:hover {
  background: rgba(99, 102, 241, 0.08);
  border-color: rgba(99, 102, 241, 0.3);
  color: #4f46e5;
}

.tab-btn.active {
  background: rgba(99, 102, 241, 0.12);
  border-color: rgba(99, 102, 241, 0.5);
  color: #4f46e5;
  font-weight: 600;
}

/* ---- toolbar ---- */
.resource-toolbar {
  flex-shrink: 0;
}

.import-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  width: 100%;
  padding: 8px 12px;
  border: 1.5px dashed rgba(99, 102, 241, 0.4);
  border-radius: 10px;
  background: rgba(99, 102, 241, 0.04);
  color: #4f46e5;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  justify-content: center;
}

.import-btn:hover {
  background: rgba(99, 102, 241, 0.1);
  border-color: rgba(99, 102, 241, 0.7);
}

.import-icon {
  font-size: 16px;
  line-height: 1;
}

/* ---- grid ---- */
.resource-grid {
  flex: 1;
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  align-content: start;
}

.resource-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  cursor: pointer;
  border-radius: 8px;
  padding: 4px;
  transition: background 0.15s;
}

.resource-item:hover {
  background: rgba(99, 102, 241, 0.07);
}

.resource-item.loading {
  pointer-events: none;
  opacity: 0.6;
}

.resource-thumb {
  position: relative;
  width: 100%;
  aspect-ratio: 16/9;
  border-radius: 6px;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
}

.thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumb-icon {
  font-size: 24px;
}

.loading-mask {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.resource-name {
  font-size: 11px;
  color: #6b7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ---- empty ---- */
.resource-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: #9ca3af;
}

.empty-icon {
  font-size: 36px;
  opacity: 0.5;
}

.resource-empty p {
  font-size: 12px;
  margin: 0;
}

/* scrollbar */
.resource-grid::-webkit-scrollbar { width: 4px; }
.resource-grid::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 9999px;
}
</style>
