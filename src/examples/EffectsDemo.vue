<!--
  @aoles-gl/effects 在 Vue 3 项目中的使用示例

  文件位置: src/examples/EffectsDemo.vue
-->

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  TRANSITIONS,
  TEXT_EFFECTS,
  VIDEO_EFFECTS,
  getAllEffects,
  searchEffects,
  getTransitionPath,
  type EffectEntry,
} from '@aoles-gl/effects';

// 方式 1: 直接导入 GLSL URL (推荐)
import bookFlipUrl from '@aoles-gl/effects/glsl/transitions/book_flip.glsl?url';
import cubeUrl from '@aoles-gl/effects/glsl/transitions/cube.glsl?url';

const selectedEffect = ref<EffectEntry | null>(null);
const allEffects = ref<EffectEntry[]>([]);
const category = ref<string>('all');

const filteredEffects = computed(() => {
  if (category.value === 'all') {
    return allEffects.value;
  }
  return searchEffects({ category: category.value });
});

const categoryStats = computed(() => ({
  all: allEffects.value.length,
  transition: searchEffects({ category: 'transition' }).length,
  text: searchEffects({ category: 'text' }).length,
  video: searchEffects({ category: 'video' }).length,
  effect: searchEffects({ category: 'effect' }).length,
}));

onMounted(() => {
  // 加载所有效果
  allEffects.value = getAllEffects();

  console.log('Total effects loaded:', allEffects.value.length);
  console.log('Transitions:', Object.keys(TRANSITIONS).length);
  console.log('Text effects:', Object.keys(TEXT_EFFECTS).length);
  console.log('Video effects:', Object.keys(VIDEO_EFFECTS).length);
});

const handleCategoryChange = (cat: string) => {
  category.value = cat;
};

const handleEffectSelect = (effect: EffectEntry) => {
  selectedEffect.value = effect;
  console.log('Selected effect:', effect);

  // 在实际应用中，你可以这样使用:
  // engine.addTransition({
  //   glsl_path: effect.path,
  //   startTime: 0,
  //   duration: 1000,
  // });
};

const getEffectCategory = (effect: EffectEntry) => {
  if (effect.metadata.category === 'transition') return 'transitions';
  if (effect.metadata.category === 'text') return 'text';
  if (effect.metadata.category === 'video') return 'video';
  return 'effects';
};

const exampleCode = `// 1. 导入效果常量和辅助函数
import { TRANSITIONS, getTransitionPath } from '@aoles-gl/effects';

// 2. 使用常量获取路径
const path = getTransitionPath(TRANSITIONS.BOOK_FLIP);
console.log(path); // '/glsl/transitions/book_flip.glsl'

// 3. 或者直接导入 GLSL URL
import bookFlipUrl from '@aoles-gl/effects/glsl/transitions/book_flip.glsl?url';

// 4. 搜索 3D 效果
const effects3D = searchEffects({ tags: ['3d'] });
console.log('Found', effects3D.length, '3D effects');

// 5. 在 Vue 组件中使用
const transition = ref({
  glsl_path: bookFlipUrl, // 或使用 path
  startTime: 0,
  duration: 1000,
});

// 6. 应用到引擎
engine.addTransition(transition.value);`;
</script>

<template>
  <div class="effects-demo">
    <h1>@aoles-gl/effects 示例</h1>

    <!-- 分类过滤 -->
    <div class="category-filters">
      <el-button
        :type="category === 'all' ? 'primary' : 'default'"
        @click="handleCategoryChange('all')"
      >
        全部 ({{ categoryStats.all }})
      </el-button>
      <el-button
        :type="category === 'transition' ? 'primary' : 'default'"
        @click="handleCategoryChange('transition')"
      >
        转场效果 ({{ categoryStats.transition }})
      </el-button>
      <el-button
        :type="category === 'text' ? 'primary' : 'default'"
        @click="handleCategoryChange('text')"
      >
        文字效果 ({{ categoryStats.text }})
      </el-button>
      <el-button
        :type="category === 'video' ? 'primary' : 'default'"
        @click="handleCategoryChange('video')"
      >
        视频效果 ({{ categoryStats.video }})
      </el-button>
      <el-button
        :type="category === 'effect' ? 'primary' : 'default'"
        @click="handleCategoryChange('effect')"
      >
        特效 ({{ categoryStats.effect }})
      </el-button>
    </div>

    <!-- 效果列表 -->
    <div class="effects-grid">
      <div
        v-for="effect in filteredEffects"
        :key="effect.id"
        class="effect-card"
        :class="{ selected: selectedEffect?.id === effect.id }"
        @click="handleEffectSelect(effect)"
      >
        <h3>{{ effect.metadata.name }}</h3>
        <p class="effect-id">{{ effect.id }}</p>
        <p class="effect-category">{{ effect.metadata.category }}</p>
        <div v-if="effect.metadata.tags" class="effect-tags">
          <el-tag
            v-for="tag in effect.metadata.tags"
            :key="tag"
            size="small"
            type="info"
          >
            {{ tag }}
          </el-tag>
        </div>
      </div>
    </div>

    <!-- 选中效果详情 -->
    <el-card v-if="selectedEffect" class="effect-details" shadow="hover">
      <template #header>
        <h2>选中效果详情</h2>
      </template>

      <el-descriptions :column="1" border>
        <el-descriptions-item label="ID">
          {{ selectedEffect.id }}
        </el-descriptions-item>
        <el-descriptions-item label="名称">
          {{ selectedEffect.metadata.name }}
        </el-descriptions-item>
        <el-descriptions-item label="分类">
          <el-tag>{{ selectedEffect.metadata.category }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="路径">
          <code>{{ selectedEffect.path }}</code>
        </el-descriptions-item>
        <el-descriptions-item v-if="selectedEffect.metadata.description" label="描述">
          {{ selectedEffect.metadata.description }}
        </el-descriptions-item>
        <el-descriptions-item v-if="selectedEffect.metadata.tags" label="标签">
          <el-tag
            v-for="tag in selectedEffect.metadata.tags"
            :key="tag"
            style="margin-right: 5px"
          >
            {{ tag }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>

      <h3 style="margin-top: 20px">使用方式:</h3>
      <el-input
        type="textarea"
        :rows="10"
        :value="`// 方式 1: 使用路径
const path = '${selectedEffect.path}';

// 方式 2: 使用导入 (需要在文件顶部)
import effectUrl from '@aoles-gl/effects/glsl/${getEffectCategory(selectedEffect)}/${selectedEffect.id}.glsl?url';

// 应用到引擎
const transition = ref({
  glsl_path: effectUrl, // 或使用 path
  startTime: 0,
  duration: 1000,
});

engine.addTransition(transition.value);`"
        readonly
      />
    </el-card>

    <!-- 使用示例代码 -->
    <el-card class="code-examples" shadow="hover">
      <template #header>
        <h2>代码示例</h2>
      </template>

      <el-input
        type="textarea"
        :rows="15"
        :value="exampleCode"
        readonly
      />
    </el-card>
  </div>
</template>

<style scoped>
.effects-demo {
  padding: 20px;
}

.category-filters {
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
}

.effects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
  margin-bottom: 20px;
}

.effect-card {
  border: 1px solid #dcdfe6;
  padding: 15px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.3s;
}

.effect-card:hover {
  border-color: #409eff;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.effect-card.selected {
  border: 2px solid #409eff;
  background-color: #ecf5ff;
}

.effect-card h3 {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
}

.effect-id {
  margin: 0 0 4px 0;
  font-size: 12px;
  color: #909399;
  font-family: monospace;
}

.effect-category {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: #606266;
}

.effect-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.effect-details,
.code-examples {
  margin-top: 20px;
}

code {
  font-family: 'Courier New', Courier, monospace;
  background-color: #f4f4f5;
  padding: 2px 6px;
  border-radius: 3px;
}
</style>
