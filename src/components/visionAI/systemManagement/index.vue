<template>
  <div class="system-management-container">
    <h1>系统管理</h1>
    
    <el-tabs type="border-card">
      <el-tab-pane label="租户管理">
        <TenantManagement />
      </el-tab-pane>
      <el-tab-pane label="用户管理">
        <UserManagement />
      </el-tab-pane>
      <el-tab-pane label="角色管理">
        <RoleManagement />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
import TenantManagement from './rbac/tenantManagement.vue';
import UserManagement from '../../pages/system/userManagement.vue';
import RoleManagement from '../../pages/system/roleManagement.vue';

export default {
  name: 'SystemManagement',
  components: {
    TenantManagement,
    UserManagement,
    RoleManagement
  }
}
</script>

<style scoped>
.system-management-container {
  padding: 20px;
}
</style>