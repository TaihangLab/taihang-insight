<template>
  <!-- 有子菜单 -->
  <el-sub-menu v-if="hasChildren" :index="String(item.id)">
    <template #title>
      <el-icon v-if="iconName">
        <component :is="iconName" />
      </el-icon>
      <span>{{ item.menu_name }}</span>
    </template>

    <!-- 递归渲染子菜单 -->
    <MenuItem
      v-for="child in item.children"
      :key="child.id"
      :item="child"
    />
  </el-sub-menu>

  <!-- 无子菜单 -->
  <el-menu-item v-else :index="item.path">
    <el-icon v-if="iconName">
      <component :is="iconName" />
    </el-icon>
    <span>{{ item.menu_name }}</span>
  </el-menu-item>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import * as ElementPlusIcons from '@element-plus/icons-vue'
import type { MenuItem } from '@/api/auth/types'

interface Props {
  item: MenuItem
}

const props = defineProps<Props>()

/**
 * 是否有子菜单
 */
const hasChildren = computed(() => {
  return props.item.children && props.item.children.length > 0
})

/**
 * 获取图标组件
 */
const iconName = computed(() => {
  const icon = props.item.icon

  if (!icon) {
    return null
  }

  // 如果图标已经在 iconMap 中处理过（组件名形式）
  if (ElementPlusIcons[icon]) {
    return icon
  }

  // 否则返回 null，让父级处理
  return null
})
</script>
