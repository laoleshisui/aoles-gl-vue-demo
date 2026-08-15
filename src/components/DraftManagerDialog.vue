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

    <div v-loading="recovery.status.value === 'restoring'" class="draft-list">
      <el-empty v-if="!drafts.length" description="暂无草稿" :image-size="76" />
      <div v-for="draft in drafts" :key="draft.draftId" class="draft-list-item">
        <div class="draft-list-copy">
          <div class="draft-list-title">
            <strong>{{ draft.title || (isAutosave(draft.draftId) ? '自动保存' : '未命名草稿') }}</strong>
            <el-tag v-if="isAutosave(draft.draftId)" size="small" type="primary">自动</el-tag>
          </div>
          <span>{{ formatDate(draft.updatedAt) }} · 版本 {{ draft.revision }}</span>
        </div>
        <div class="draft-list-actions">
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
import { Delete, Document, FolderChecked, FolderOpened, Refresh } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const props = defineProps<{ recovery: any }>()
const visible = ref(false)
const title = ref('')
const saving = ref(false)
const busyDraftId = ref('')
const drafts = computed(() => props.recovery.drafts.value)

watch(visible, open => {
  if (open) void props.recovery.refreshDrafts()
})

const isAutosave = (draftId: string) => draftId === props.recovery.autosaveDraftId
const formatDate = (value: number) => new Date(value).toLocaleString()

async function refresh() {
  try {
    await props.recovery.refreshDrafts()
  } catch (error) {
    ElMessage.error(`读取草稿失败：${error instanceof Error ? error.message : String(error)}`)
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
