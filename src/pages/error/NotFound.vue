<script setup lang="ts">
import { useRouter } from 'vue-router'
import ErrorPageLayout from '@/components/common/ErrorPageLayout.vue'
import type { ErrorActionButton, ErrorReasonItem } from '@/types/components.d'

const router = useRouter()

// 返回首页
const goHome = () => {
  router.push('/')
}

// 返回上一页
const goBack = () => {
  router.back()
}

// 操作按钮配置
const actions: ErrorActionButton[] = [
  { label: '返回首页', icon: 'i-carbon-home', type: 'primary', onClick: goHome },
  { label: '返回上一页', icon: 'i-carbon-arrow-left', type: 'secondary', onClick: goBack }
]

// 可能的原因
const reasons: ErrorReasonItem[] = [
  { icon: 'i-carbon-link', text: '输入的网址有误或链接已失效' },
  { icon: 'i-carbon-user-locked', text: '您没有权限访问该页面' },
  { icon: 'i-carbon-development', text: '该页面正在开发中' }
]
</script>

<template>
  <ErrorPageLayout
    error-code="404"
    title="页面不存在"
    message="抱歉，您访问的页面不存在或已被移除。"
    submessage="请检查您输入的网址是否正确，或返回首页重新导航。"
    :reasons="reasons"
    :actions="actions"
  />
</template>
