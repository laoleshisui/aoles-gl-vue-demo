<template>
  <div class="ai-api-key-config">
    <strong>配置 AI API-Key</strong>
    <span>请输入 dataserver 为当前账户签发的 API-Key。</span>
    <el-input
      v-model="draft"
      type="password"
      show-password
      clearable
      autocomplete="off"
      placeholder="粘贴 API-Key（不含 Api-Key 前缀）"
      @keyup.enter="save"
    />
    <div class="ai-api-key-actions">
      <el-button type="primary" :disabled="!draft.trim()" @click="save">保存并使用</el-button>
      <el-button v-if="canCancel" @click="$emit('cancel')">取消</el-button>
      <el-button v-if="configured" type="danger" plain @click="$emit('clear')">清除密钥</el-button>
    </div>
    <small>密钥仅保存在当前标签页的 sessionStorage，关闭标签页后自动清除。</small>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  configured: boolean
  canCancel: boolean
}>()

const emit = defineEmits<{
  save: [apiKey: string]
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
</script>

<style scoped>
.ai-api-key-config {
  display: flex;
  height: 100%;
  min-height: 320px;
  box-sizing: border-box;
  flex-direction: column;
  justify-content: center;
  gap: 12px;
  padding: 24px;
  border: 1px solid var(--aoles-color-border);
  border-radius: var(--aoles-panel-radius);
  color: var(--aoles-color-text-muted);
  background: var(--aoles-color-surface);
}

.ai-api-key-config strong {
  color: var(--aoles-color-text);
  font-size: 16px;
}

.ai-api-key-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.ai-api-key-config small {
  line-height: 1.5;
}
</style>
