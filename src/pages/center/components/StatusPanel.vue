<script setup lang="ts">
import type { UITimeRange } from '@/types/center/components';

interface Props {
  statusTimeRange: UITimeRange;
}

interface Emits {
  (e: 'changeStatusTimeRange', range: UITimeRange): void;
}

defineProps<Props>();
const emit = defineEmits<Emits>();

const timeRangeLabels: Record<UITimeRange, string> = {
  day: '本日',
  week: '本周',
  month: '本月'
};
</script>

<template>
  <div class="flex-1 overflow-hidden min-h-0 flex flex-col">
    <!-- 标签切换 -->
    <div class="flex mb-2 border-b border-[rgba(0,255,255,0.2)]">
      <div
        v-for="(label, key) in timeRangeLabels"
        :key="key"
        :class="[
          'py-2 px-3 cursor-pointer text-13px relative transition-all duration-300',
          statusTimeRange === key ? 'text-[#00FFFF]' : 'text-[#7EAEE5]'
        ]"
        @click="emit('changeStatusTimeRange', key)"
      >
        {{ label }}
        <div
          v-if="statusTimeRange === key"
          class="absolute bottom--0.25 left-0 w-full h-0.5 bg-[#00FFFF]"
        ></div>
      </div>
    </div>

    <!-- 图表容器 -->
    <div class="flex-1 min-h-0 relative">
      <slot></slot>
    </div>
  </div>
</template>
