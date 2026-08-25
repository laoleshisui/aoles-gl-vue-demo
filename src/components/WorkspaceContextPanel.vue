<template>
  <section class="workspace-context-panel" aria-label="工作区上下文">
    <div class="workspace-context-heading">
      <div>
        <span class="context-eyebrow">工作区</span>
        <strong>{{ workspaceName || '未连接数据服务' }}</strong>
        <span v-if="workspaceRole" class="context-role">{{ workspaceRole }}</span>
      </div>
      <el-button v-if="workspaceId" size="small" text @click="resourceVisible = true">云端资源</el-button>
    </div>
    <div class="workspace-context-tree">
      <span class="context-node context-node-workspace">Workspace</span>
      <span class="context-branch">/</span>
      <span class="context-node context-node-project">项目：{{ projectName || '未选择' }}</span>
      <span class="context-branch">/</span>
      <span class="context-node context-node-draft">草稿：{{ draftStatus }}</span>
    </div>
    <div class="workspace-context-meta">
      <span>项目资源 {{ projectCount }}</span>
      <span>共享资源 {{ sharedCount }}</span>
      <span>本地资源由编辑器管理，云端资源由 Workspace 管理</span>
    </div>
  </section>

  <el-dialog v-model="resourceVisible" title="云端资源" width="760px" :close-on-click-modal="false">
    <div class="cloud-resource-toolbar">
      <span>当前项目可见资源：{{ artifacts.length }}</span>
      <el-button size="small" :loading="loading" @click="$emit('refresh')">刷新</el-button>
    </div>
    <el-alert v-if="error" type="warning" :closable="false" show-icon>{{ error }}</el-alert>
    <el-empty v-if="!loading && !artifacts.length" description="当前项目暂无云端资源" />
    <div v-loading="loading" class="cloud-resource-list">
      <div v-for="artifact in artifacts" :key="artifact.id" class="cloud-resource-row">
        <div class="cloud-resource-copy">
          <strong>{{ artifact.name }}</strong>
          <span>{{ artifact.kind }} · {{ artifact.contentType }} · {{ formatSize(artifact.byteSize) }}</span>
          <small>{{ artifact.scope === 'workspace' ? 'Workspace 共享，可被所有项目使用' : '项目专属，仅当前项目使用' }}</small>
        </div>
        <div class="cloud-resource-actions">
          <el-tag size="small" :type="artifact.scope === 'workspace' ? 'success' : 'primary'">
            {{ artifact.scope === 'workspace' ? 'Workspace 共享' : '项目专属' }}
          </el-tag>
          <el-button size="small" @click="$emit('move', artifact)">
            {{ artifact.scope === 'workspace' ? '归属当前项目' : '转为共享' }}
          </el-button>
          <el-popconfirm title="删除云端资源？该操作不可撤销。" confirm-button-text="删除" cancel-button-text="取消" @confirm="$emit('remove', artifact)">
            <template #reference><el-button size="small" type="danger" plain>删除</el-button></template>
          </el-popconfirm>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ArtifactRecord } from '@aoles-gl/core'

const props = defineProps<{
  workspaceId: string
  workspaceName: string
  workspaceRole: string
  projectName: string
  draftStatus: string
  artifacts: ArtifactRecord[]
  loading: boolean
  error?: string
}>()
defineEmits<{ refresh: []; move: [artifact: ArtifactRecord]; remove: [artifact: ArtifactRecord] }>()
const resourceVisible = ref(false)
const projectCount = computed(() => props.artifacts.filter(item => item.scope !== 'workspace').length)
const sharedCount = computed(() => props.artifacts.filter(item => item.scope === 'workspace').length)
const formatSize = (value?: number) => {
  if (value == null) return '大小未知'
  if (value < 1024) return `${value} B`
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`
  return `${(value / 1024 / 1024).toFixed(1)} MB`
}
</script>
