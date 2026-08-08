<template>
  <div class="effects-gallery">
    <h1>Aoles GL Effects Gallery</h1>

    <!-- 统计信息 -->
    <div class="stats-grid">
      <StatCard label="Total" :count="allEffectsCount" color="#3b82f6" />
      <StatCard label="Transitions" :count="transitionsCount" color="#8b5cf6" />
      <StatCard label="Text Effects" :count="textEffectsCount" color="#ec4899" />
      <StatCard label="Video Effects" :count="videoEffectsCount" color="#10b981" />
    </div>

    <!-- 搜索和过滤 -->
    <div class="filters">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="搜索效果名称或描述..."
        class="search-input"
      />

      <select v-model="selectedCategory" class="category-select">
        <option value="all">全部</option>
        <option value="transition">转场效果</option>
        <option value="text">文字效果</option>
        <option value="video">视频效果</option>
      </select>
    </div>

    <!-- 效果列表 -->
    <div class="effects-grid">
      <div
        v-for="effect in filteredEffects"
        :key="effect.id"
        class="effect-card"
      >
        <div class="effect-header">
          <h3>{{ effect.metadata.name }}</h3>
          <span
            class="category-badge"
            :style="{ backgroundColor: getCategoryColor(effect.category) }"
          >
            {{ getCategoryLabel(effect.category) }}
          </span>
        </div>

        <p v-if="effect.metadata.description" class="effect-description">
          {{ effect.metadata.description }}
        </p>

        <div class="effect-meta">
          <div>ID: {{ effect.id }}</div>
          <div class="effect-path">
            Path: {{ getEffectPath(effect) }}
          </div>
        </div>
      </div>
    </div>

    <div v-if="filteredEffects.length === 0" class="empty-state">
      未找到匹配的效果
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  TRANSITIONS,
  TEXT_EFFECTS,
  VIDEO_EFFECTS,
  getAllEffects,
  searchEffects,
  getTransitionPath,
  getTextEffectPath,
  getVideoEffectPath,
} from '@aoles-gl/effects';

// 状态
const selectedCategory = ref<'all' | 'transition' | 'text' | 'video'>('all');
const searchQuery = ref('');

// 统计数据
const allEffectsCount = computed(() => getAllEffects().length);
const transitionsCount = computed(() => Object.keys(TRANSITIONS).length);
const textEffectsCount = computed(() => Object.keys(TEXT_EFFECTS).length);
const videoEffectsCount = computed(() => Object.keys(VIDEO_EFFECTS).length);

// 获取效果列表
const effects = computed(() => {
  if (selectedCategory.value === 'all') {
    return getAllEffects();
  }
  return searchEffects({ category: selectedCategory.value });
});

// 根据搜索关键词过滤
const filteredEffects = computed(() => {
  if (!searchQuery.value) {
    return effects.value;
  }

  const query = searchQuery.value.toLowerCase();
  return effects.value.filter(effect =>
    effect.metadata.name.toLowerCase().includes(query) ||
    effect.metadata.description?.toLowerCase().includes(query)
  );
});

// 辅助函数
const getEffectPath = (effect: ReturnType<typeof getAllEffects>[0]) => {
  switch (effect.category) {
    case 'transition':
      return getTransitionPath(effect.id);
    case 'text':
      return getTextEffectPath(effect.id);
    case 'video':
      return getVideoEffectPath(effect.id);
    default:
      return '';
  }
};

const getCategoryColor = (category: string): string => {
  switch (category) {
    case 'transition': return '#8b5cf6';
    case 'text': return '#ec4899';
    case 'video': return '#10b981';
    default: return '#6b7280';
  }
};

const getCategoryLabel = (category: string): string => {
  switch (category) {
    case 'transition': return '转场';
    case 'text': return '文字';
    case 'video': return '视频';
    default: return category;
  }
};
</script>

<script lang="ts">
import { defineComponent } from 'vue';

// StatCard 子组件
const StatCard = defineComponent({
  props: {
    label: { type: String, required: true },
    count: { type: Number, required: true },
    color: { type: String, required: true },
  },
  template: `
    <div class="stat-card" :style="{ backgroundColor: color }">
      <div class="stat-count">{{ count }}</div>
      <div class="stat-label">{{ label }}</div>
    </div>
  `,
});

export { StatCard };
</script>

<style scoped>
.effects-gallery {
  padding: 20px;
  font-family: system-ui, -apple-system, sans-serif;
}

h1 {
  margin-bottom: 24px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  padding: 16px;
  border-radius: 8px;
  color: #fff;
}

.stat-count {
  font-size: 28px;
  font-weight: bold;
}

.stat-label {
  font-size: 14px;
  opacity: 0.9;
  margin-top: 4px;
}

.filters {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.search-input {
  flex: 1;
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid #d1d5db;
  font-size: 14px;
}

.category-select {
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid #d1d5db;
  font-size: 14px;
}

.effects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.effect-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  background-color: #fff;
}

.effect-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.effect-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.category-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  color: #fff;
}

.effect-description {
  margin: 8px 0;
  font-size: 13px;
  color: #6b7280;
  line-height: 1.4;
}

.effect-meta {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f3f4f6;
  font-size: 12px;
  color: #9ca3af;
  font-family: monospace;
}

.effect-path {
  margin-top: 4px;
  word-break: break-all;
}

.empty-state {
  text-align: center;
  padding: 48px;
  color: #9ca3af;
  font-size: 14px;
}
</style>
