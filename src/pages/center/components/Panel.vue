<script setup lang="ts">
interface Props {
  title: string;
}

defineProps<Props>();
</script>

<template>
  <div class="bg-gradient-to-b from-[rgba(6,30,93,0.8)] to-[rgba(4,20,63,0.9)] border border-[rgba(35,88,148,0.5)] rounded-0.25 p-4 relative shadow-[0_4px_15px_rgba(0,0,0,0.3)] flex flex-col flex-1 min-h-0 overflow-hidden">
    <div class="text-[#00FFFF] text-16px mb-2 pl-2.5 border-l-3 border-[#00FFFF] text-left flex-shrink-0">
      {{ title }}
    </div>
    <div class="flex-1 min-h-0">
      <slot></slot>
    </div>
  </div>
</template>
