<template>
  <AolesProvider :engine="engine">
    <div class="editor-root">
      <header class="header-bar">
        <div class="brand">
          <img class="brand-logo" :src="`${baseUrl}logo.png`" alt="Pixo" />
          <span class="header-title">Aoles GL Vue</span>
        </div>

        <div class="header-actions">
          <DraftManagerDialog :recovery="draftRecovery" />
          <el-select
            v-if="workspaceId && projects.length"
            v-model="projectId"
            size="small"
            class="project-select"
            :loading="projectsLoading"
            @change="switchProject"
          >
            <el-option v-for="project in projects" :key="project.id" :label="project.name" :value="project.id" />
          </el-select>
          <el-button v-if="workspaceId" size="small" :icon="Plus" @click="openProjectCreate">新建项目</el-button>
          <el-button v-if="currentProject && !currentProject.isDefault" size="small" :icon="Edit" @click="openProjectRename">重命名</el-button>
          <el-button v-if="currentProject && !currentProject.isDefault" size="small" type="danger" plain :icon="Delete" @click="removeCurrentProject">删除项目</el-button>
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
          <el-button
            size="small"
            :icon="Tools"
            @click="healthCheckDialogVisible = true"
          >
            健康检查
          </el-button>
          <el-button size="small" :icon="Grid" @click="skillMarketplaceOpen = true">
            Skill
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

      <WorkspaceContextPanel
        :workspace-id="workspaceId"
        :workspace-name="workspaceName"
        :workspace-role="workspaceRole"
        :project-name="currentProject?.name ?? ''"
        :draft-status="draftStatus"
        :artifacts="cloudArtifacts"
        :loading="cloudArtifactsLoading"
        :error="cloudArtifactsError"
        @refresh="loadCloudArtifacts"
        @move="moveCloudArtifact"
        @remove="removeCloudArtifact"
      />

      <div class="main-content">
        <!-- 左侧资源面板 -->
        <div class="card-style resources-section">
          <ResourceContainer extract-audio :cloud-sync="resourceCloudSync" />
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
            <AiApiKeyConfig
              :configured="Boolean(apiKey)"
              :authenticated="aiAuthenticated"
              :expanded="apiKeyEditorOpen || !aiAuthenticated"
              :auth-label="aiAuthLabel"
              @save="saveAiApiKey"
              @edit="apiKeyEditorOpen = true"
              @cancel="apiKeyEditorOpen = false"
              @clear="clearAiApiKey"
            />
            <AolesAiPanel v-if="aiAuthenticated" :config="aiConfig">
              <template #composer-tools>
                <el-tooltip
                  :content="aiProfileTooltip"
                  placement="top"
                  :show-after="300"
                  :disabled="aiProfileMenuEnabled"
                >
                  <el-dropdown
                    trigger="click"
                    placement="top-start"
                    popper-class="ai-profile-popper"
                    :teleported="false"
                    :disabled="!aiProfileMenuEnabled"
                    @command="selectAiProfile"
                  >
                    <button
                      type="button"
                      class="ai-profile-trigger"
                      :class="{ disabled: !aiProfileMenuEnabled }"
                      :aria-label="aiProfileTooltip"
                      :aria-disabled="!aiProfileMenuEnabled"
                    >
                      <el-icon v-if="aiProfilesLoading" class="is-loading"><Loading /></el-icon>
                      <el-icon v-else><Cpu /></el-icon>
                      <span class="ai-profile-trigger-label">{{ aiProfileButtonLabel }}</span>
                      <el-icon v-if="aiProfileMenuEnabled" class="ai-profile-chevron"><ArrowDown /></el-icon>
                      <el-icon v-else-if="aiProfiles.length && !aiProfilesError"><Lock /></el-icon>
                    </button>
                    <template #dropdown>
                      <el-dropdown-menu class="ai-profile-menu">
                        <el-dropdown-item
                          v-for="profile in aiProfiles"
                          :key="profile.id"
                          :command="profile.id"
                          :class="{ active: profile.id === aiProfile }"
                        >
                          <span class="ai-profile-check">
                            <el-icon v-if="profile.id === aiProfile"><Check /></el-icon>
                          </span>
                          <span class="ai-profile-option-copy">
                            <strong>{{ aiProfileLabels[profile.id] }}</strong>
                            <small>{{ aiProfileDescriptions[profile.id] }}</small>
                          </span>
                        </el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </el-tooltip>
              </template>
            </AolesAiPanel>
          </div>
          <div v-else class="ai-unavailable">
            <strong>AI 助手尚未配置</strong>
            <span>请在 <code>.env.development.local</code> 中设置 <code>VITE_API_AGENT</code>。</span>
          </div>
        </aside>
      </div>

      <!-- 全局配置弹窗 -->
      <GlobalConfigDialog />

      <!-- 健康检查对话框 -->
      <el-dialog
        v-model="healthCheckDialogVisible"
        title="资源健康检查"
        width="90%"
        :close-on-click-modal="false"
      >
        <HealthCheckPanel :engine="engine" />
      </el-dialog>

      <el-dialog v-model="projectDialogVisible" :title="projectDialogMode === 'create' ? '新建项目' : '重命名项目'" width="420px">
        <el-input v-model="projectName" maxlength="80" placeholder="项目名称" @keyup.enter="submitProjectDialog" />
        <template #footer>
          <el-button @click="projectDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="projectsLoading" @click="submitProjectDialog">确定</el-button>
        </template>
      </el-dialog>

      <SkillMarketplaceDialog
        :open="skillMarketplaceOpen"
        :data-server-base-url="dataServerBaseUrl"
        :api-key="apiKey"
        @close="skillMarketplaceOpen = false"
      />
    </div>
  </AolesProvider>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ArrowDown, Check, CircleCheck, Cpu, Delete, Edit, Grid, Loading, Lock, MagicStick, Moon, Plus, Sunny, Tools, VideoPlay } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import {
  createArtifactHttpRepository,
  createArtifactResourceResolver,
  createResourceCloudSyncController,
  createDraftHttpAdapter,
  createProjectRepository,
  createShaderLibraryRepository,
  createWorkspaceRepository,
  getDraftManager,
  type ArtifactRepository,
  type ShaderLibraryRepository,
  type WorkspaceProject,
} from '@aoles-gl/core'
import {
  AolesProvider,
  ControllerPreview,
  AttributeContainer,
  TrackContainer,
  GlobalConfigDialog,
  ResourceContainer,
  useEngine,
  useDraftRecovery,
  usePageState,
  usePreviewState,
  useResourceState,
  useTrackState,
} from '@aoles-gl/vue'
import {
  AolesAiPanel,
  type AolesAiModelProfile,
  type AolesAiProfileInfo,
  type AolesAiProfilesResponse,
  type VueAolesAiConfig,
} from '@aoles-gl/vue/ai'
import AiApiKeyConfig from './components/AiApiKeyConfig.vue'
import DraftManagerDialog from './components/DraftManagerDialog.vue'
import WorkspaceContextPanel from './components/WorkspaceContextPanel.vue'
import SkillMarketplaceDialog from './components/SkillMarketplaceDialog.vue'
import { HealthCheckPanel } from '@aoles-gl/vue'

const engine = useEngine()
const pageStore = usePageState(engine)
const previewState = usePreviewState(engine)
const resourceState = useResourceState(engine)
const trackStore = useTrackState(engine)
const legacyProjectId = 'aoles-gl-vue-demo:project:default'
const legacyAutosaveId = 'aoles-gl-vue-demo:autosave'
const projectId = ref(legacyProjectId)
const draftManager = getDraftManager(engine)
const baseUrl = import.meta.env.BASE_URL
const aiOpen = ref(true)
const healthCheckDialogVisible = ref(false)
const skillMarketplaceOpen = ref(false)
const apiKey = ref('')
const dataServerBaseUrl = import.meta.env.VITE_API_DATA_SERVER?.trim().replace(/\/+$/, '') ?? ''
const workspaceId = ref('')
const workspaceName = ref('')
const workspaceRole = ref('')
const projects = ref<WorkspaceProject[]>([])
const projectRepository = ref<ReturnType<typeof createProjectRepository>>()
const artifactRepository = ref<ArtifactRepository>()
const resourceCloudSync = ref<ReturnType<typeof createResourceCloudSyncController>>()
const shaderLibraryRepository = ref<ShaderLibraryRepository>()
const workspaceLoading = ref(false)
const workspaceError = ref('')
const currentProject = ref<WorkspaceProject>()
const projectsLoading = ref(false)
const cloudArtifacts = ref<import('@aoles-gl/core').ArtifactRecord[]>([])
const cloudArtifactsLoading = ref(false)
const cloudArtifactsError = ref('')
const resourceResolver = async (reference: import('@aoles-gl/core').ResourceAssetReference, context: { projectId: string }) => {
  if (!artifactRepository.value || !workspaceId.value) return null
  return createArtifactResourceResolver({ repository: artifactRepository.value, workspaceId: workspaceId.value })(reference, context)
}
const draftRecovery = useDraftRecovery(engine, { projectId: legacyProjectId, resourceResolver })
const projectDialogVisible = ref(false)
const projectDialogMode = ref<'create' | 'rename'>('create')
const projectName = ref('')
const apiKeyEditorOpen = ref(!apiKey.value)
const agentBaseUrl = import.meta.env.VITE_API_AGENT?.trim().replace(/\/+$/, '') ?? ''
const aiEnabled = Boolean(agentBaseUrl)
const aiAuthenticated = computed(() => Boolean(apiKey.value))
const aiAuthLabel = 'API-Key（当前标签页）'
const aiEndpoint = agentBaseUrl.endsWith('/api/chat')
  ? agentBaseUrl
  : `${agentBaseUrl}/api/chat`
const aiProfilesEndpoint = `${aiEndpoint.slice(0, -'/api/chat'.length)}/api/ai/profiles`
const aiProfile = ref<AolesAiModelProfile>('balanced')
const aiProfiles = ref<AolesAiProfileInfo[]>([])
const aiProfilesLoading = ref(false)
const aiProfilesError = ref('')
const aiClientSelectable = ref(false)
const aiProfileLabels = {
  fast: '快速',
  balanced: '均衡',
  reasoning: '深度',
  media: '多媒体',
} satisfies Record<AolesAiModelProfile, string>
const aiProfileDescriptions = {
  fast: '低延迟，适合简单操作',
  balanced: '速度与质量均衡',
  reasoning: '适合复杂编辑任务',
  media: '侧重图片与视频理解',
} satisfies Record<AolesAiModelProfile, string>
const aiProfileMenuEnabled = computed(() => (
  aiClientSelectable.value
  && !aiProfilesLoading.value
  && !aiProfilesError.value
  && aiProfiles.value.length > 0
))
const aiProfileButtonLabel = computed(() => {
  if (aiProfilesLoading.value) return '读取档位'
  if (aiProfilesError.value) return '档位不可用'
  if (!aiProfiles.value.length) return '暂无档位'
  return aiProfileLabels[aiProfile.value]
})
const aiProfileTooltip = computed(() => {
  if (aiProfilesLoading.value) return '正在读取服务端档位配置'
  if (aiProfilesError.value) return '档位加载失败，请更换 API-Key 后重试'
  if (!aiProfiles.value.length) return '服务端未提供可用档位'
  if (!aiClientSelectable.value) return `服务端已锁定为${aiProfileLabels[aiProfile.value]}档`
  return '选择 AI 模型档位'
})
const draftStatus = computed(() => {
  const states = Object.values(draftRecovery.syncStates.value ?? {}) as Array<{ status?: string }>
  if (states.some(state => state.status === 'conflict')) return '有冲突'
  if (states.some(state => state.status === 'dirty' || state.status === 'syncing')) return '同步中'
  if (states.some(state => state.status === 'synced') || draftRecovery.drafts.value.length) return '已同步'
  return '仅本地'
})
let aiProfilesRequestId = 0

watch(() => draftRecovery.report.value, (report) => {
  if (!report || report.restored) return
  const missing = report.missingAssets.length
    ? ` 缺失资源：${report.missingAssets.join('、')}`
    : ''
  ElMessage.warning(`草稿恢复失败。${report.error ?? ''}${missing}`.trim())
})

const aiConfig = computed<VueAolesAiConfig & { storageKey: string }>(() => ({
  endpoint: aiEndpoint,
  storageKey: 'aoles-gl-vue-demo:ai-sessions',
  getModelProfile: () => aiProfile.value,
  headers: () => apiKey.value
    ? { Authorization: `Api-Key ${apiKey.value}` }
    : {},
  ...(workspaceId.value && artifactRepository.value && shaderLibraryRepository.value ? {
    shaderDesign: {
      register: true,
      artifactPersistence: {
        workspaceId: workspaceId.value,
        projectId: projectId.value,
        scope: 'project',
        repository: artifactRepository.value,
        shaderLibrary: shaderLibraryRepository.value,
      },
    },
  } : {}),
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
      ElMessage.error('AI 鉴权失败，请检查 PixoClip API-Key。')
    } else if (/tool round limit/i.test(message)) {
      ElMessage.warning('AI 操作步骤过多，已自动停止。请缩小任务范围后重试。')
    } else {
      ElMessage.error(`AI 请求失败：${message}`)
    }
  },
}))

function isAiModelProfile(value: unknown): value is AolesAiModelProfile {
  return typeof value === 'string'
    && Object.prototype.hasOwnProperty.call(aiProfileLabels, value)
}

function resetAiProfiles() {
  aiProfile.value = 'balanced'
  aiProfiles.value = []
  aiProfilesLoading.value = false
  aiProfilesError.value = ''
  aiClientSelectable.value = false
}

function selectAiProfile(profile: AolesAiModelProfile) {
  if (!aiProfileMenuEnabled.value || !isAiModelProfile(profile)) return
  if (!aiProfiles.value.some(item => item.id === profile)) return
  aiProfile.value = profile
}

async function loadAiProfiles() {
  const requestId = ++aiProfilesRequestId
  const key = apiKey.value
  if (!key) {
    resetAiProfiles()
    return
  }

  aiProfilesLoading.value = true
  aiProfilesError.value = ''
  try {
    const response = await fetch(aiProfilesEndpoint, {
      headers: { Authorization: `Api-Key ${key}` },
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)

    const payload = await response.json() as Partial<AolesAiProfilesResponse>
    const profiles = Array.isArray(payload.profiles)
      ? payload.profiles.filter(profile => isAiModelProfile(profile?.id))
      : []
    if (!profiles.length) throw new Error('服务端没有返回可用的 AI 模型档位')
    if (requestId !== aiProfilesRequestId) return

    const defaultProfile = isAiModelProfile(payload.defaultProfile)
      && profiles.some(profile => profile.id === payload.defaultProfile)
      ? payload.defaultProfile
      : profiles[0].id
    aiProfiles.value = profiles
    aiClientSelectable.value = payload.clientSelectable === true
    aiProfile.value = aiClientSelectable.value
      && profiles.some(profile => profile.id === aiProfile.value)
      ? aiProfile.value
      : defaultProfile
  } catch (error) {
    if (requestId !== aiProfilesRequestId) return
    aiProfiles.value = []
    aiClientSelectable.value = false
    aiProfilesError.value = error instanceof Error ? error.message : String(error)
    ElMessage.warning('AI 模型档位加载失败，请检查服务地址和 API-Key。')
  } finally {
    if (requestId === aiProfilesRequestId) aiProfilesLoading.value = false
  }
}

function saveAiApiKey(value: string) {
  const keyChanged = apiKey.value !== value
  apiKey.value = value
  apiKeyEditorOpen.value = false
  if (!keyChanged) void loadAiProfiles()
}

async function connectDataServer(key: string) {
  workspaceId.value = ''
  workspaceName.value = ''
  workspaceRole.value = ''
  artifactRepository.value = undefined
  resourceCloudSync.value = undefined
  shaderLibraryRepository.value = undefined
  workspaceError.value = ''
  currentProject.value = undefined
  projects.value = []
  cloudArtifacts.value = []
  projectRepository.value = undefined
  projectId.value = legacyProjectId
  draftManager.clearSync()
  if (!key || !dataServerBaseUrl) return
  workspaceLoading.value = true
  try {
    const options = {
      baseUrl: dataServerBaseUrl,
      getAccessToken: () => apiKey.value,
      authorizationScheme: 'Api-Key' as const,
    }
    const workspaceRepository = createWorkspaceRepository(options)
    const workspace = await workspaceRepository.ensurePersonal()
    const projectApi = createProjectRepository(options)
    projectsLoading.value = true
    const defaultProject = await projectApi.ensureDefault(workspace.id)
    const projectList = await projectApi.list(workspace.id)
    projects.value = projectList
    projectRepository.value = projectApi
    currentProject.value = defaultProject
    const autosaveIdMap = {
      [legacyAutosaveId]: `${engine.resourceNamespace}:autosave:${encodeURIComponent(defaultProject.id)}`,
    }
    const migratedCount = (
      await draftRecovery.migrateProject(engine.resourceNamespace, defaultProject.id, { draftIdMap: autosaveIdMap })
    ) + (
      await draftRecovery.migrateProject(legacyProjectId, defaultProject.id, { draftIdMap: autosaveIdMap })
    )
    workspaceId.value = workspace.id
    workspaceName.value = workspace.name
    workspaceRole.value = workspace.role
    artifactRepository.value = createArtifactHttpRepository(options)
    resourceCloudSync.value = createResourceCloudSyncController({
      manager: resourceState.manager,
      repository: artifactRepository.value,
      workspaceId: workspace.id,
      projectId: defaultProject.id,
    })
    shaderLibraryRepository.value = createShaderLibraryRepository(options)
    draftManager.configureSync({
      remote: createDraftHttpAdapter(options),
      context: {
        scopeKey: workspace.id,
        projectId: defaultProject.id,
      },
    })
    projectId.value = defaultProject.id
    await draftRecovery.setProjectId(defaultProject.id)
    await resourceState.manager.ready
    // Reconnect local resources to ready artifacts by digest/size. This is a
    // metadata-only pass and never uploads files during page initialization.
    await resourceCloudSync.value.reconcile()
    await loadCloudArtifacts()
    if (migratedCount > 0) ElMessage.info(`已将 ${migratedCount} 个本地草稿迁移到默认项目`)
  } catch (error) {
    workspaceError.value = error instanceof Error ? error.message : String(error)
    ElMessage.warning(`数据服务连接失败：${workspaceError.value}`)
  } finally {
    projectsLoading.value = false
    workspaceLoading.value = false
  }
}

async function loadCloudArtifacts() {
  if (!workspaceId.value || !projectId.value || !artifactRepository.value) {
    cloudArtifacts.value = []
    return
  }
  cloudArtifactsLoading.value = true
  cloudArtifactsError.value = ''
  try {
    cloudArtifacts.value = (await artifactRepository.value.list(workspaceId.value, { projectId: projectId.value })).artifacts
  } catch (error) {
    cloudArtifactsError.value = error instanceof Error ? error.message : String(error)
  } finally {
    cloudArtifactsLoading.value = false
  }
}

async function switchProject(nextProjectId: string) {
  const next = projects.value.find(project => project.id === nextProjectId)
  if (!next || next.id === currentProject.value?.id || !workspaceId.value || !projectRepository.value) return
  const previous = currentProject.value
  projectsLoading.value = true
  try {
    await draftRecovery.saveNow()
    draftManager.clearSync()
    projectId.value = next.id
    currentProject.value = next
    resourceCloudSync.value = artifactRepository.value
      ? createResourceCloudSyncController({
        manager: resourceState.manager,
        repository: artifactRepository.value,
        workspaceId: workspaceId.value,
        projectId: next.id,
      })
      : undefined
    draftManager.configureSync({
      remote: createDraftHttpAdapter({
        baseUrl: dataServerBaseUrl,
        getAccessToken: () => apiKey.value,
        authorizationScheme: 'Api-Key' as const,
      }),
      context: { scopeKey: workspaceId.value, projectId: next.id },
    })
    await draftRecovery.setProjectId(next.id)
    await resourceState.manager.ready
    await resourceCloudSync.value?.reconcile()
    await draftRecovery.refreshDrafts()
    await loadCloudArtifacts()
  } catch (error) {
    projectId.value = previous?.id ?? projectId.value
    currentProject.value = previous
    ElMessage.error(`切换项目失败：${error instanceof Error ? error.message : String(error)}`)
  } finally {
    projectsLoading.value = false
  }
}

async function moveCloudArtifact(artifact: import('@aoles-gl/core').ArtifactRecord) {
  if (!workspaceId.value || !artifactRepository.value || !projectId.value) return
  try {
    const updated = await artifactRepository.value.updateScope(workspaceId.value, artifact.id, artifact.scope === 'workspace'
      ? { scope: 'project', projectId: projectId.value }
      : { scope: 'workspace' })
    cloudArtifacts.value = cloudArtifacts.value.map(item => item.id === updated.id ? updated : item)
    ElMessage.success(updated.scope === 'workspace' ? '资源已转为 Workspace 共享' : '资源已归属当前项目')
  } catch (error) {
    const status = (error as { status?: number }).status
    ElMessage.error(status === 409 ? '资源仍被项目 Shader 引用，暂不能迁移' : `资源迁移失败：${error instanceof Error ? error.message : String(error)}`)
  }
}

async function removeCloudArtifact(artifact: import('@aoles-gl/core').ArtifactRecord) {
  if (!workspaceId.value || !artifactRepository.value) return
  try {
    await artifactRepository.value.remove(workspaceId.value, artifact.id)
    cloudArtifacts.value = cloudArtifacts.value.filter(item => item.id !== artifact.id)
    ElMessage.success('云端资源已删除')
  } catch (error) {
    ElMessage.error(`删除资源失败：${error instanceof Error ? error.message : String(error)}`)
  }
}

function openProjectCreate() {
  projectDialogMode.value = 'create'
  projectName.value = ''
  projectDialogVisible.value = true
}

function openProjectRename() {
  if (!currentProject.value) return
  projectDialogMode.value = 'rename'
  projectName.value = currentProject.value.name
  projectDialogVisible.value = true
}

async function submitProjectDialog() {
  const name = projectName.value.trim()
  if (!name || !workspaceId.value || !projectRepository.value) return
  projectsLoading.value = true
  try {
    const next = projectDialogMode.value === 'create'
      ? await projectRepository.value.create(workspaceId.value, { name })
      : await projectRepository.value.update(workspaceId.value, currentProject.value!.id, { name })
    projects.value = projectDialogMode.value === 'create'
      ? [...projects.value, next]
      : projects.value.map(project => project.id === next.id ? next : project)
    projectDialogVisible.value = false
    if (projectDialogMode.value === 'create') await switchProject(next.id)
    else currentProject.value = next
  } catch (error) {
    ElMessage.error(`项目操作失败：${error instanceof Error ? error.message : String(error)}`)
  } finally {
    projectsLoading.value = false
  }
}

async function removeCurrentProject() {
  const current = currentProject.value
  if (!current || current.isDefault || !projectRepository.value || !workspaceId.value) return
  if (!window.confirm(`确定删除项目“${current.name}”吗？`)) return
  try {
    await projectRepository.value.remove(workspaceId.value, current.id)
    projects.value = projects.value.filter(project => project.id !== current.id)
    const fallback = projects.value.find(project => project.isDefault) ?? projects.value[0]
    if (fallback) await switchProject(fallback.id)
  } catch (error) {
    const status = (error as { status?: number }).status
    ElMessage.error(status === 409
      ? '该项目仍有项目资源或项目 Shader，请先迁移资源到其他项目或 Workspace 共享后再删除'
      : `删除项目失败：${error instanceof Error ? error.message : String(error)}`)
  }
}

function clearAiApiKey() {
  apiKey.value = ''
  apiKeyEditorOpen.value = true
}

function syncDocumentTheme(isDark: boolean) {
  document.documentElement.classList.toggle('dark', isDark)
}

onMounted(() => {
  syncDocumentTheme(pageStore.isDark)
})

watch(() => pageStore.isDark, syncDocumentTheme)
watch(apiKey, () => {
  void loadAiProfiles()
  void connectDataServer(apiKey.value)
}, { immediate: true })

onBeforeUnmount(() => {
  aiProfilesRequestId += 1
  document.documentElement.classList.remove('dark')
})

function handleExport() {
  // width/height/fps/sample_rate 由 C++ 端从渲染 context 自动读取，无需传入。
  // 若需要自定义编码参数，可传第二、三个参数：
  // trackStore.startExport('/opfs/export_out.mp4',
  //   { bps: 8_000_000, codec_name: 'libx264' },
  //   { codec_name: 'aac', bps: 192000 }
  // )
  trackStore.startExport('/opfs/export_out.mp4')
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

.workspace-context-panel {
  flex-shrink: 0;
  margin-bottom: 10px;
  padding: 10px 12px;
  border: 1px solid var(--aoles-color-border);
  border-radius: var(--aoles-panel-radius);
  background: var(--aoles-color-surface);
}
.workspace-context-heading,
.workspace-context-tree,
.workspace-context-meta,
.cloud-resource-toolbar,
.cloud-resource-actions {
  display: flex;
  align-items: center;
}
.workspace-context-heading { justify-content: space-between; gap: 12px; }
.workspace-context-heading > div { display: flex; align-items: center; gap: 8px; min-width: 0; }
.workspace-context-heading strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.context-eyebrow { color: var(--aoles-color-text-muted); font-size: 11px; text-transform: uppercase; }
.context-role { color: var(--aoles-color-text-muted); font-size: 11px; }
.workspace-context-tree { gap: 7px; margin-top: 8px; font-size: 12px; }
.context-branch { color: var(--aoles-color-text-muted); }
.context-node { padding: 3px 7px; border-radius: 5px; }
.context-node-workspace { color: #075985; background: #e0f2fe; }
.context-node-project { color: #166534; background: #dcfce7; }
.context-node-draft { color: #92400e; background: #fef3c7; }
.workspace-context-meta { flex-wrap: wrap; gap: 12px; margin-top: 8px; color: var(--aoles-color-text-muted); font-size: 11px; }
.cloud-resource-toolbar { justify-content: space-between; margin-bottom: 12px; color: var(--aoles-color-text-muted); font-size: 12px; }
.cloud-resource-list { max-height: 52vh; overflow-y: auto; }
.cloud-resource-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 12px 0; border-bottom: 1px solid var(--aoles-color-border); }
.cloud-resource-copy { display: flex; min-width: 0; flex-direction: column; gap: 4px; }
.cloud-resource-copy strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cloud-resource-copy span, .cloud-resource-copy small { color: var(--aoles-color-text-muted); font-size: 12px; }
.cloud-resource-actions { flex-shrink: 0; gap: 8px; }

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

.ai-panel-shell > .aoles-ai-panel {
  min-height: 0;
  flex: 1;
}

.ai-profile-trigger {
  display: inline-flex;
  min-width: 0;
  max-width: 180px;
  height: 28px;
  align-items: center;
  gap: 5px;
  padding: 0 8px;
  border: 1px solid transparent;
  border-radius: 6px;
  color: var(--aoles-color-text-muted);
  background: transparent;
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  transition: background-color var(--aoles-motion-duration), color var(--aoles-motion-duration);
}

.ai-profile-trigger:not(.disabled):hover {
  color: var(--aoles-color-text);
  background: var(--aoles-color-surface-muted);
}

.ai-profile-trigger.disabled {
  cursor: default;
  opacity: .7;
}

.ai-profile-trigger-label {
  overflow: hidden;
  min-width: 0;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ai-profile-chevron {
  font-size: 11px;
}

.ai-profile-menu {
  min-width: 218px;
  padding: 4px;
  color: var(--aoles-color-text);
  background: transparent;
}

.ai-profile-popper.el-popper {
  border-color: var(--aoles-color-border);
  background: var(--aoles-color-surface-raised);
  box-shadow: var(--aoles-shadow-panel);
}

.ai-profile-popper.el-popper .el-popper__arrow::before {
  border-color: var(--aoles-color-border);
  background: var(--aoles-color-surface-raised);
}

.ai-profile-menu .el-dropdown-menu__item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-radius: 5px;
  line-height: 1.2;
}

.ai-profile-menu .el-dropdown-menu__item.active {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.ai-profile-menu .el-dropdown-menu__item:not(.is-disabled):focus,
.ai-profile-menu .el-dropdown-menu__item:not(.is-disabled):hover {
  color: var(--aoles-color-text);
  background: var(--aoles-color-surface-muted);
}

.ai-profile-check {
  display: inline-flex;
  width: 14px;
  flex-shrink: 0;
}

.ai-profile-option-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 3px;
}

.ai-profile-option-copy strong {
  color: inherit;
  font-size: 12px;
  font-weight: 600;
}

.ai-profile-option-copy small {
  color: var(--aoles-color-text-muted);
  font-size: 11px;
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
