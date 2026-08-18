<template>
  <div class="health-check-panel">
    <div class="panel-header">
      <h3>资源健康检查</h3>
      <el-button
        type="primary"
        :loading="isChecking"
        :disabled="isChecking || isRepairing"
        @click="runHealthCheck"
      >
        {{ isChecking ? '检查中...' : '开始检查' }}
      </el-button>
    </div>

    <!-- 检查进度 -->
    <div v-if="isChecking" class="progress-section">
      <el-progress
        :percentage="checkProgress"
        :status="checkProgress === 100 ? 'success' : undefined"
      />
      <p class="progress-text">正在检查资源... {{ currentCheck }}/{{ totalCheck }}</p>
    </div>

    <!-- 修复进度 -->
    <div v-if="isRepairing" class="progress-section">
      <el-progress
        :percentage="repairProgress"
        :status="repairProgress === 100 ? 'success' : undefined"
      />
      <p class="progress-text">正在修复问题... {{ currentRepair }}/{{ totalRepair }}</p>
      <p class="progress-action">{{ repairAction }}</p>
    </div>

    <!-- 检查报告 -->
    <div v-if="report && !isChecking" class="report-section">
      <div class="report-summary">
        <h4>检查报告</h4>
        <div class="summary-cards">
          <div class="summary-card healthy">
            <div class="card-icon">✓</div>
            <div class="card-content">
              <div class="card-value">{{ report.healthyResources }}</div>
              <div class="card-label">健康资源</div>
            </div>
          </div>

          <div class="summary-card total">
            <div class="card-icon">📦</div>
            <div class="card-content">
              <div class="card-value">{{ report.totalResources }}</div>
              <div class="card-label">总资源数</div>
            </div>
          </div>

          <div class="summary-card issues" :class="{ 'has-issues': report.issues.length > 0 }">
            <div class="card-icon">⚠️</div>
            <div class="card-content">
              <div class="card-value">{{ report.issues.length }}</div>
              <div class="card-label">发现问题</div>
            </div>
          </div>
        </div>

        <div v-if="report.issues.length > 0" class="issue-breakdown">
          <h5>问题分类</h5>
          <div class="breakdown-list">
            <div class="breakdown-item" v-if="report.summary.missingFiles > 0">
              <span class="item-label">缺失文件</span>
              <el-tag type="danger">{{ report.summary.missingFiles }}</el-tag>
            </div>
            <div class="breakdown-item" v-if="report.summary.corruptedFiles > 0">
              <span class="item-label">损坏文件</span>
              <el-tag type="danger">{{ report.summary.corruptedFiles }}</el-tag>
            </div>
            <div class="breakdown-item" v-if="report.summary.orphanedFiles > 0">
              <span class="item-label">孤立文件</span>
              <el-tag type="warning">{{ report.summary.orphanedFiles }}</el-tag>
            </div>
            <div class="breakdown-item" v-if="report.summary.sizeMismatches > 0">
              <span class="item-label">大小不匹配</span>
              <el-tag type="warning">{{ report.summary.sizeMismatches }}</el-tag>
            </div>
          </div>
        </div>
      </div>

      <!-- 问题列表 -->
      <div v-if="report.issues.length > 0" class="issues-section">
        <div class="issues-header">
          <h4>问题详情</h4>
          <el-button
            type="warning"
            size="small"
            :loading="isRepairing"
            :disabled="isRepairing || !hasFixableIssues"
            @click="showRepairDialog"
          >
            修复问题
          </el-button>
        </div>

        <el-table :data="paginatedIssues" style="width: 100%">
          <el-table-column prop="severity" label="严重程度" width="100">
            <template #default="{ row }">
              <el-tag
                :type="getSeverityType(row.severity)"
                size="small"
              >
                {{ getSeverityLabel(row.severity) }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="type" label="问题类型" width="120">
            <template #default="{ row }">
              {{ getIssueTypeLabel(row.type) }}
            </template>
          </el-table-column>

          <el-table-column prop="resourceName" label="资源名称" min-width="200">
            <template #default="{ row }">
              {{ row.resourceName || row.opfsPath || '未知' }}
            </template>
          </el-table-column>

          <el-table-column prop="description" label="描述" min-width="300" />

          <el-table-column prop="fixable" label="可修复" width="80" align="center">
            <template #default="{ row }">
              <el-tag :type="row.fixable ? 'success' : 'info'" size="small">
                {{ row.fixable ? '是' : '否' }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>

        <el-pagination
          v-if="report.issues.length > pageSize"
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="report.issues.length"
          layout="prev, pager, next, total"
          class="pagination"
        />
      </div>

      <!-- 无问题提示 -->
      <el-result
        v-else
        icon="success"
        title="所有资源健康"
        sub-title="未发现任何问题"
      />
    </div>

    <!-- 修复结果 -->
    <div v-if="repairResult && !isRepairing" class="repair-result-section">
      <el-alert
        :title="`修复完成: ${repairResult.fixedIssues} 个成功, ${repairResult.failedIssues} 个失败, ${repairResult.skippedIssues} 个跳过`"
        :type="repairResult.failedIssues === 0 ? 'success' : 'warning'"
        :closable="false"
        show-icon
      />

      <div class="repair-actions-list">
        <h5>修复操作</h5>
        <el-scrollbar max-height="300px">
          <div
            v-for="(action, index) in repairResult.actions"
            :key="index"
            class="repair-action-item"
            :class="`action-${action.action}`"
          >
            <div class="action-icon">{{ getActionIcon(action.action) }}</div>
            <div class="action-content">
              <div class="action-description">{{ action.description }}</div>
              <div v-if="action.error" class="action-error">{{ action.error }}</div>
            </div>
          </div>
        </el-scrollbar>
      </div>

      <el-button @click="runHealthCheck" type="primary" style="margin-top: 16px">
        重新检查
      </el-button>
    </div>

    <!-- 修复确认对话框 -->
    <el-dialog
      v-model="repairDialogVisible"
      title="修复确认"
      width="500px"
    >
      <div class="repair-options">
        <el-checkbox v-model="repairOptions.removeOrphanedFiles">
          删除孤立文件（{{ report?.summary.orphanedFiles || 0 }} 个）
        </el-checkbox>
        <p class="option-hint">孤立文件是存在于 OPFS 但在 IndexedDB 中无记录的文件</p>

        <el-alert
          type="warning"
          :closable="false"
          style="margin-top: 16px"
        >
          <template #title>
            注意事项
          </template>
          <ul style="margin: 8px 0; padding-left: 20px;">
            <li>缺失和损坏的文件需要手动重新导入</li>
            <li>修复操作不可撤销</li>
            <li>建议先备份重要数据</li>
          </ul>
        </el-alert>
      </div>

      <template #footer>
        <el-button @click="repairDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="runRepair">开始修复</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { createHealthChecker, type HealthCheckReport, type RepairResult, type HealthIssue } from '@aoles-gl/core';
import type { Engine } from '@/engine';

const props = defineProps<{
  engine?: Engine;
}>();

// 状态
const isChecking = ref(false);
const isRepairing = ref(false);
const report = ref<HealthCheckReport | null>(null);
const repairResult = ref<RepairResult | null>(null);

// 进度
const checkProgress = ref(0);
const currentCheck = ref(0);
const totalCheck = ref(0);

const repairProgress = ref(0);
const currentRepair = ref(0);
const totalRepair = ref(0);
const repairAction = ref('');

// 分页
const currentPage = ref(1);
const pageSize = ref(10);

// 修复对话框
const repairDialogVisible = ref(false);
const repairOptions = ref({
  removeOrphanedFiles: false,
  regenerateMissingFiles: false,
});

// 计算属性
const paginatedIssues = computed(() => {
  if (!report.value) return [];
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return report.value.issues.slice(start, end);
});

const hasFixableIssues = computed(() => {
  return report.value?.issues.some(issue => issue.fixable) || false;
});

// 执行健康检查
async function runHealthCheck() {
  isChecking.value = true;
  checkProgress.value = 0;
  currentCheck.value = 0;
  totalCheck.value = 0;
  report.value = null;
  repairResult.value = null;

  try {
    const checker = createHealthChecker(props.engine);

    const result = await checker.check({
      checkFileSize: true,
      checkOrphanedFiles: true,
      onProgress: (current, total) => {
        currentCheck.value = current;
        totalCheck.value = total;
        checkProgress.value = Math.floor((current / total) * 100);
      },
    });

    report.value = result;
    currentPage.value = 1;

    if (result.issues.length === 0) {
      ElMessage.success('所有资源健康，未发现问题');
    } else {
      ElMessage.warning(`发现 ${result.issues.length} 个问题`);
    }
  } catch (error) {
    console.error('[HealthCheck] 检查失败:', error);
    ElMessage.error(`健康检查失败: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    isChecking.value = false;
  }
}

// 显示修复对话框
function showRepairDialog() {
  repairDialogVisible.value = true;
}

// 执行修复
async function runRepair() {
  if (!report.value) return;

  repairDialogVisible.value = false;
  isRepairing.value = true;
  repairProgress.value = 0;
  currentRepair.value = 0;
  totalRepair.value = 0;
  repairAction.value = '';

  try {
    const checker = createHealthChecker(props.engine);

    const result = await checker.repair(report.value, {
      removeOrphanedFiles: repairOptions.value.removeOrphanedFiles,
      regenerateMissingFiles: repairOptions.value.regenerateMissingFiles,
      onProgress: (current, total, action) => {
        currentRepair.value = current;
        totalRepair.value = total;
        repairProgress.value = Math.floor((current / total) * 100);
        repairAction.value = action;
      },
    });

    repairResult.value = result;

    if (result.failedIssues === 0) {
      ElMessage.success(`修复完成: ${result.fixedIssues} 个问题已解决`);
    } else {
      ElMessage.warning(`修复完成: ${result.fixedIssues} 个成功, ${result.failedIssues} 个失败`);
    }
  } catch (error) {
    console.error('[HealthCheck] 修复失败:', error);
    ElMessage.error(`修复失败: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    isRepairing.value = false;
  }
}

// 辅助函数
function getSeverityType(severity: HealthIssue['severity']) {
  const map = {
    error: 'danger',
    warning: 'warning',
    info: 'info',
  };
  return map[severity];
}

function getSeverityLabel(severity: HealthIssue['severity']) {
  const map = {
    error: '错误',
    warning: '警告',
    info: '信息',
  };
  return map[severity];
}

function getIssueTypeLabel(type: HealthIssue['type']) {
  const map = {
    missing_file: '缺失文件',
    corrupted_file: '损坏文件',
    orphaned_file: '孤立文件',
    size_mismatch: '大小不匹配',
    missing_metadata: '元数据缺失',
  };
  return map[type];
}

function getActionIcon(action: string) {
  const map: Record<string, string> = {
    removed: '🗑️',
    regenerated: '🔄',
    updated: '✏️',
    skipped: '⏭️',
    failed: '❌',
  };
  return map[action] || '•';
}
</script>

<style scoped>
.health-check-panel {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.panel-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

/* 进度区域 */
.progress-section {
  margin-bottom: 24px;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 6px;
}

.progress-text {
  margin-top: 12px;
  font-size: 14px;
  color: #606266;
  text-align: center;
}

.progress-action {
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
  text-align: center;
}

/* 报告摘要 */
.report-summary {
  margin-bottom: 24px;
}

.report-summary h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.summary-card {
  display: flex;
  align-items: center;
  padding: 20px;
  border-radius: 8px;
  background: #f5f7fa;
  gap: 16px;
}

.summary-card.healthy {
  background: #f0f9ff;
  border: 1px solid #d0e8ff;
}

.summary-card.total {
  background: #faf5ff;
  border: 1px solid #ead5ff;
}

.summary-card.issues {
  background: #fff7ed;
  border: 1px solid #fed7aa;
}

.summary-card.issues.has-issues {
  background: #fef2f2;
  border: 1px solid #fecaca;
}

.card-icon {
  font-size: 32px;
  line-height: 1;
}

.card-content {
  flex: 1;
}

.card-value {
  font-size: 28px;
  font-weight: 700;
  color: #303133;
  line-height: 1;
  margin-bottom: 8px;
}

.card-label {
  font-size: 14px;
  color: #606266;
}

/* 问题分类 */
.issue-breakdown {
  padding: 16px;
  background: #f5f7fa;
  border-radius: 6px;
}

.issue-breakdown h5 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.breakdown-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.breakdown-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #fff;
  border-radius: 4px;
}

.item-label {
  font-size: 14px;
  color: #606266;
}

/* 问题区域 */
.issues-section {
  margin-top: 24px;
}

.issues-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.issues-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.pagination {
  margin-top: 16px;
  display: flex;
  justify-content: center;
}

/* 修复结果 */
.repair-result-section {
  margin-top: 24px;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 6px;
}

.repair-actions-list {
  margin-top: 16px;
}

.repair-actions-list h5 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.repair-action-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  margin-bottom: 8px;
  background: #fff;
  border-radius: 4px;
  border-left: 3px solid #dcdfe6;
}

.repair-action-item.action-removed {
  border-left-color: #67c23a;
}

.repair-action-item.action-failed {
  border-left-color: #f56c6c;
}

.repair-action-item.action-skipped {
  border-left-color: #909399;
}

.action-icon {
  font-size: 18px;
  line-height: 1;
}

.action-content {
  flex: 1;
}

.action-description {
  font-size: 14px;
  color: #303133;
}

.action-error {
  margin-top: 4px;
  font-size: 12px;
  color: #f56c6c;
}

/* 修复选项 */
.repair-options {
  padding: 12px 0;
}

.option-hint {
  margin: 8px 0 0 24px;
  font-size: 12px;
  color: #909399;
}
</style>
