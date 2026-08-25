<template>
  <el-button size="small" :icon="Document" @click="visible = true">草稿</el-button>

  <el-dialog v-model="visible" title="草稿管理" width="680px" :close-on-click-modal="false">
    <div class="draft-save-row">
      <el-input
        v-model="title"
        maxlength="80"
        placeholder="草稿名称（可选）"
        @keyup.enter="saveSnapshot"
      />
      <el-button
        type="primary"
        :icon="FolderChecked"
        :loading="saving"
        :disabled="recovery.status.value === 'restoring'"
        @click="saveSnapshot"
      >
        保存快照
      </el-button>
      <el-tooltip content="刷新草稿列表">
        <el-button :icon="Refresh" circle aria-label="刷新草稿列表" @click="refresh" />
      </el-tooltip>
    </div>

    <div class="draft-sync-row">
      <span :class="['draft-sync-status', `is-${syncStatus}`]">{{ syncStatusLabel }}</span>
      <span v-if="recovery.pendingSyncCount?.value">待同步 {{ recovery.pendingSyncCount.value }}</span>
      <el-button size="small" :loading="syncing" @click="syncNow">同步云端</el-button>
    </div>

    <div v-loading="recovery.status.value === 'restoring'" class="draft-list">
      <el-empty v-if="!drafts.length" description="暂无草稿" :image-size="76" />
      <div v-for="draft in drafts" :key="draft.draftId" class="draft-list-item">
        <div class="draft-list-copy">
          <div class="draft-list-title">
            <template v-if="editingDraftId === draft.draftId">
              <el-input
                v-model="editingTitle"
                size="small"
                maxlength="80"
                aria-label="草稿名称"
                @keyup.enter="renameDraft(draft.draftId)"
              />
              <el-button :icon="Check" circle aria-label="保存名称" @click="renameDraft(draft.draftId)" />
              <el-button :icon="Close" circle aria-label="取消重命名" @click="cancelRename" />
            </template>
            <template v-else>
              <strong>{{ draft.title || (isAutosave(draft.draftId) ? '自动保存' : '未命名草稿') }}</strong>
              <el-button
                v-if="!isAutosave(draft.draftId)"
                :icon="Edit"
                link
                title="重命名草稿"
                aria-label="重命名草稿"
                @click="startRename(draft)"
              />
            </template>
            <el-tag v-if="isAutosave(draft.draftId)" size="small" type="primary">自动</el-tag>
          </div>
          <span>
            {{ formatDate(draft.updatedAt) }} · 版本 {{ draft.revision }}
            <template v-if="syncState(draft.draftId)"> · {{ syncStateLabel(syncState(draft.draftId)?.status) }}</template>
          </span>
        </div>
        <div class="draft-list-actions">
          <template v-if="syncState(draft.draftId)?.status === 'conflict'">
            <el-button size="small" @click="resolveConflict(draft.draftId, 'keep-local')">保留本地</el-button>
            <el-button size="small" @click="resolveConflict(draft.draftId, 'use-remote')">采用云端</el-button>
          </template>
          <el-popconfirm
            title="恢复这个草稿？当前编辑内容会先保存到自动草稿。"
            confirm-button-text="恢复"
            cancel-button-text="取消"
            @confirm="restoreDraft(draft.draftId)"
          >
            <template #reference>
              <el-button :icon="FolderOpened" :loading="busyDraftId === draft.draftId" :disabled="Boolean(busyDraftId)">
                恢复
              </el-button>
            </template>
          </el-popconfirm>
          <el-popconfirm
            :title="isAutosave(draft.draftId) ? '删除自动草稿？' : '删除这个草稿？'"
            confirm-button-text="删除"
            cancel-button-text="取消"
            @confirm="deleteDraft(draft.draftId)"
          >
            <template #reference>
              <el-button
                type="danger"
                plain
                :icon="Delete"
                circle
                title="删除草稿"
                aria-label="删除草稿"
                :loading="busyDraftId === draft.draftId"
                :disabled="Boolean(busyDraftId)"
              />
            </template>
          </el-popconfirm>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Check, Close, Delete, Document, Edit, FolderChecked, FolderOpened, Refresh } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const props = defineProps<{ recovery: any }>()
const visible = ref(false)
const title = ref('')
const saving = ref(false)
const busyDraftId = ref('')
const syncing = ref(false)
const syncStates = ref<Record<string, any>>({})
const editingDraftId = ref('')
const editingTitle = ref('')
const drafts = computed(() => props.recovery.drafts.value)

const syncState = (draftId: string) => syncStates.value[draftId]
const syncStateLabel = (status?: string) => ({
  'local-only': '仅本地',
  dirty: '待同步',
  syncing: '同步中',
  synced: '已同步',
  conflict: '有冲突',
  error: '同步失败',
  deleted: '待删除',
}[status ?? ''] ?? '云端')
const syncStatus = computed(() => {
  const states = Object.values(syncStates.value)
  if (states.some(state => state.status === 'conflict')) return 'conflict'
  if (states.some(state => state.status === 'error')) return 'error'
  if (states.some(state => state.status === 'syncing')) return 'syncing'
  if (states.some(state => state.status === 'dirty' || state.status === 'deleted')) return 'dirty'
  return props.recovery.drafts.value.length ? 'synced' : 'local-only'
})
const syncStatusLabel = computed(() => syncStateLabel(syncStatus.value))

watch(() => props.recovery.syncStates.value, value => {
  syncStates.value = value
}, { deep: true, immediate: true })

watch(visible, open => {
  if (open) void refresh()
})

const isAutosave = (draftId: string) => draftId === (props.recovery.autosaveDraftId?.value ?? props.recovery.autosaveDraftId)
const formatDate = (value: number) => new Date(value).toLocaleString()

function startRename(draft: any) {
  editingDraftId.value = draft.draftId
  editingTitle.value = draft.title ?? ''
}

function cancelRename() {
  editingDraftId.value = ''
  editingTitle.value = ''
}

async function renameDraft(draftId: string) {
  try {
    await props.recovery.renameDraft(draftId, editingTitle.value)
    cancelRename()
    ElMessage.success('草稿名称已更新')
  } catch (error) {
    ElMessage.error(`重命名失败：${error instanceof Error ? error.message : String(error)}`)
  }
}

async function refresh() {
  try {
    await props.recovery.refreshDrafts()
  } catch (error) {
    ElMessage.error(`读取草稿失败：${error instanceof Error ? error.message : String(error)}`)
  }
}

async function syncNow() {
  syncing.value = true
  try {
    await props.recovery.syncNow()
    await refresh()
    ElMessage.success('云端同步完成')
  } catch (error) {
    ElMessage.error(`云端同步失败：${error instanceof Error ? error.message : String(error)}`)
  } finally {
    syncing.value = false
  }
}

async function resolveConflict(draftId: string, resolution: 'keep-local' | 'use-remote') {
  busyDraftId.value = draftId
  try {
    await props.recovery.resolveConflict(draftId, resolution)
    await refresh()
    ElMessage.success(resolution === 'keep-local' ? '已保留本地版本，等待重新同步' : '已采用云端版本')
  } catch (error) {
    ElMessage.error(`处理冲突失败：${error instanceof Error ? error.message : String(error)}`)
  } finally {
    busyDraftId.value = ''
  }
}

async function saveSnapshot() {
  saving.value = true
  try {
    const document = await props.recovery.saveSnapshot(title.value)
    if (!document) throw new Error('编辑器尚未完成初始化')
    title.value = ''
    ElMessage.success('草稿已保存')
  } catch (error) {
    ElMessage.error(`保存草稿失败：${error instanceof Error ? error.message : String(error)}`)
  } finally {
    saving.value = false
  }
}

async function restoreDraft(draftId: string) {
  busyDraftId.value = draftId
  try {
    const report = await props.recovery.restoreDraft(draftId)
    if (!report?.restored) throw new Error(report?.error ?? '草稿恢复失败')
    ElMessage.success('草稿已恢复')
    visible.value = false
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : String(error))
  } finally {
    busyDraftId.value = ''
  }
}

async function deleteDraft(draftId: string) {
  busyDraftId.value = draftId
  try {
    await props.recovery.deleteDraft(draftId)
    ElMessage.success('草稿已删除')
  } catch (error) {
    ElMessage.error(`删除草稿失败：${error instanceof Error ? error.message : String(error)}`)
  } finally {
    busyDraftId.value = ''
  }
}
</script>

<style scoped>
.draft-save-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto 32px;
  gap: 8px;
  margin-bottom: 16px;
}

.draft-list {
  max-height: min(52vh, 520px);
  overflow-y: auto;
}

.draft-sync-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
  color: var(--aoles-color-text-muted);
  font-size: 12px;
}

.draft-sync-status.is-conflict,
.draft-sync-status.is-error {
  color: var(--el-color-danger);
}

.draft-sync-status.is-dirty,
.draft-sync-status.is-syncing {
  color: var(--el-color-warning);
}

.draft-sync-status.is-synced {
  color: var(--el-color-success);
}

.draft-list-item {
  display: flex;
  min-height: 58px;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 0;
  border-bottom: 1px solid var(--aoles-color-border);
}

.draft-list-item:last-child {
  border-bottom: 0;
}

.draft-list-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 5px;
}

.draft-list-copy > span {
  color: var(--aoles-color-text-muted);
  font-size: 12px;
}

.draft-list-title,
.draft-list-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.draft-list-title strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 640px) {
  .draft-save-row {
    grid-template-columns: minmax(0, 1fr) 32px;
  }

  .draft-save-row > :nth-child(2) {
    grid-column: 1 / -1;
    grid-row: 2;
  }

  .draft-list-item {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
