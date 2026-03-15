<script setup lang="ts">
import { useRouter } from "vue-router";
import { useUserInfoStore } from "@/stores";
import ErrorPageLayout from "@/components/common/ErrorPageLayout.vue";
import type { ErrorActionButton, ErrorReasonItem } from "@/types/components.d";

const router = useRouter();
const userInfoStore = useUserInfoStore();

// 返回首页
const goHome = () => {
  router.push("/");
};

// 重新登录
const reLogin = () => {
  // 清除用户信息和 token
  userInfoStore.clearUserInfo();
  localStorage.removeItem("taihang-auth");
  localStorage.removeItem("adminToken");

  // 跳转到登录页
  router.push("/login");
};

// 操作按钮配置
const actions: ErrorActionButton[] = [
  { label: "返回首页", icon: "i-carbon-home", type: "primary", onClick: goHome },
  { label: "重新登录", icon: "i-carbon-logout", type: "secondary", onClick: reLogin },
];

// 可能的原因
const reasons: ErrorReasonItem[] = [
  { icon: "i-carbon-error-filled", text: "您的账号权限不足" },
  { icon: "i-carbon-time", text: "登录状态已过期" },
  { icon: "i-carbon-user-role", text: "该资源需要特定角色权限" },
];
</script>

<template>
  <ErrorPageLayout
    error-code="403"
    title="访问被拒绝"
    message="抱歉，您没有权限访问该资源。"
    submessage="请确认您是否具有相应的权限，或联系管理员获取帮助。"
    :reasons="reasons"
    :actions="actions"
  />
</template>
