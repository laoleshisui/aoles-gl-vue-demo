<template>
  <section class="ai-api-key-config" :class="{ expanded }">
    <header class="ai-api-key-header">
      <span class="ai-api-key-status" :class="{ connected: authenticated }" aria-hidden="true" />
      <div class="ai-api-key-summary">
        <strong>{{ authenticated ? 'PixoClip AI 已连接' : '连接 PixoClip AI' }}</strong>
        <small>{{ authenticated ? authLabel : '使用由 PixoClip 签发的 API-Key' }}</small>
      </div>
      <el-button v-if="authenticated && !expanded" size="small" text @click="$emit('edit')">
        更换
      </el-button>
    </header>

    <div v-if="expanded" class="ai-api-key-form">
      <p v-if="authenticated">输入新的 PixoClip API-Key，保存后立即切换。</p>
      <el-input
        v-model="draft"
        type="password"
        show-password
        clearable
        autocomplete="off"
        placeholder="输入 PixoClip API-Key"
        @keyup.enter="save"
      />
      <div class="ai-api-key-actions">
        <el-button type="primary" :disabled="!draft.trim()" @click="save">
          {{ configured ? '更新密钥' : '连接' }}
        </el-button>
        <el-button v-if="authenticated" text @click="$emit('cancel')">取消</el-button>
        <el-button v-if="configured" type="danger" text @click="$emit('clear')">移除</el-button>
      </div>
      <small>仅在当前页面内存中使用，刷新或关闭页面后自动清除。</small>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  configured: boolean
  authenticated: boolean
  expanded: boolean
  authLabel: string
}>()

const emit = defineEmits<{
  save: [apiKey: string]
  edit: []
  cancel: []
  clear: []
}>()

const draft = ref('')

function save() {
  const apiKey = draft.value.trim()
  if (!apiKey) return
  emit('save', apiKey)
  draft.value = ''
}

watch(() => props.expanded, (expanded) => {
  if (!expanded) draft.value = ''
})
</script>

<style scoped>
.ai-api-key-config {
  box-sizing: border-box;
  padding: 10px 12px;
  border: 1px solid var(--aoles-color-border);
  border-radius: var(--aoles-panel-radius);
  color: var(--aoles-color-text-muted);
  background: var(--aoles-color-surface);
}

.ai-api-key-config.expanded {
  padding: 14px;
}

.ai-api-key-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.ai-api-key-status {
  width: 9px;
  height: 9px;
  flex-shrink: 0;
  border-radius: 50%;
  background: var(--el-color-primary);
  box-shadow: 0 0 0 4px var(--el-color-primary-light-9);
}

.ai-api-key-status.connected {
  background: var(--el-color-success);
  box-shadow: 0 0 0 4px var(--el-color-success-light-9);
}

.ai-api-key-summary {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 2px;
}

.ai-api-key-summary strong {
  color: var(--aoles-color-text);
  font-size: 13px;
}

.ai-api-key-summary small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ai-api-key-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 14px;
}

.ai-api-key-form p {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
}

.ai-api-key-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
}

.ai-api-key-form > small {
  font-size: 11px;
  line-height: 1.5;
}
</style>
