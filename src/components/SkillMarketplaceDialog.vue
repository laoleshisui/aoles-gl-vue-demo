<script setup lang="ts">
import { computed, onMounted } from 'vue'
import {
  SkillMarketplace,
  createAolesSkillManager,
  createAolesSkillPersistence,
  createSkillHttpRepository,
} from '@aoles-gl/vue/ai'

const props = defineProps<{
  open: boolean
  dataServerBaseUrl: string
  apiKey: string
  authorizationScheme: 'Bearer' | 'Api-Key'
}>()
const emit = defineEmits<{ close: [] }>()

const repository = computed(() => createSkillHttpRepository({
  baseUrl: props.dataServerBaseUrl,
  getAccessToken: () => props.apiKey,
  authorizationScheme: props.authorizationScheme,
}))
const manager = computed(() => createAolesSkillManager({
  repository: repository.value,
  persistence: createAolesSkillPersistence('aoles-gl-vue-demo:skills'),
}))

onMounted(() => { void manager.value.restore() })
</script>

<template>
  <el-dialog
    class="skill-marketplace-dialog"
    title="Skill Marketplace"
    :model-value="open"
    width="1180px"
    top="4vh"
    :close-on-click-modal="false"
    @close="emit('close')"
  >
    <div v-if="!dataServerBaseUrl" class="skill-marketplace-dialog__warning">
      <strong>Skill 服务尚未配置</strong>
      <span>请设置 VITE_API_DATA_SERVER 后重新启动开发服务器。</span>
    </div>
    <div v-else class="skill-marketplace-dialog__content">
      <div v-if="!apiKey" class="skill-marketplace-dialog__notice">
        <strong>当前为访客模式</strong>
        <span>登录后可使用“我的提交”和发布功能。</span>
      </div>
      <SkillMarketplace :manager="manager" :repository="repository" />
    </div>
  </el-dialog>
</template>

<style>
.skill-marketplace-dialog { max-width: calc(100vw - 24px); }
.skill-marketplace-dialog .el-dialog__body { padding-top: 8px; }
.skill-marketplace-dialog__content { display: grid; grid-template-rows: auto minmax(0, 1fr); gap: 10px; height: min(760px, calc(92vh - 82px)); min-height: 440px; }
.skill-marketplace-dialog__content > .aoles-skill-marketplace { min-height: 0; }
.skill-marketplace-dialog__notice, .skill-marketplace-dialog__warning { display: flex; flex-wrap: wrap; gap: 6px 10px; align-items: baseline; padding: 9px 11px; border: 1px solid #b8d8f4; border-radius: 6px; color: #195b8f; background: #eef7ff; font-size: 12px; }
.skill-marketplace-dialog__warning { border-color: #efd38a; color: #76530b; background: #fff8df; }
@media (max-width: 720px) {
  .skill-marketplace-dialog { top: 8px !important; max-width: calc(100vw - 16px); margin: 0 auto; }
  .skill-marketplace-dialog__content { height: calc(100vh - 92px); min-height: 0; }
}
</style>
