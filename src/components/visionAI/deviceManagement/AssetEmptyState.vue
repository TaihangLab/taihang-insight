<template>
  <div class="asset-empty-state" :class="{ 'asset-empty-state--compact': compact }">
    <div class="asset-empty-state__icon">
      <i :class="icon" />
    </div>
    <p class="asset-empty-state__title">{{ title }}</p>
    <p v-if="description" class="asset-empty-state__desc">{{ description }}</p>
    <div v-if="$slots.default" class="asset-empty-state__actions">
      <slot />
    </div>
  </div>
</template>

<script>
export default {
  name: 'AssetEmptyState',
  props: {
    icon: {
      type: String,
      default: 'el-icon-folder-opened',
    },
    title: {
      type: String,
      default: '暂无数据',
    },
    description: {
      type: String,
      default: '',
    },
    compact: {
      type: Boolean,
      default: false,
    },
  },
};
</script>
