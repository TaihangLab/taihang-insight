<template>
  <el-dialog
    v-model="dialogVisible"
    :title="`为用户【${userName}】分配角色`"
    width="700px"
    :before-close="handleClose"
  >
    <div class="role-assignment-container">
      <el-form label-width="100px">
        <el-form-item label="用户名称">
          <span>{{ userName }}</span>
        </el-form-item>
        <el-form-item label="角色分配">
          <div class="role-search">
            <el-input
              v-model="searchKeyword"
              prefix-icon="Search"
              placeholder="输入角色名称搜索"
              clearable
              @input="filterRoles"
            />
          </div>
          <div class="role-list-container">
            <el-checkbox-group v-model="selectedRoleIds">
              <el-checkbox v-for="role in filteredRoles" :key="role.id" :value="role.id">
                <div class="role-item">
                  <span class="role-name">{{ role.role_name }}</span>
                  <span class="role-code">({{ role.role_code }})</span>
                </div>
              </el-checkbox>
            </el-checkbox-group>
          </div>
        </el-form-item>
      </el-form>
    </div>
    <template v-slot:footer>
<span  class="dialog-footer">
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleSubmit" :loading="submitting">确定分配</el-button>
    </span>
</template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { ElMessage } from "element-plus";
import associationService from "@/api/system/associationService";
import type { User } from "@/types/rbac/user";
import type { Role } from "@/types/rbac/role";

const props = withDefaults(
  defineProps<{
    visible: boolean;
    user?: User | null;
  }>(),
  {
    user: null,
  },
);

const emit = defineEmits<{
  "update:visible": [value: boolean];
  submit: [];
}>();

const searchKeyword = ref("");
const filteredRoles = ref<Role[]>([]);
const selectedRoleIds = ref<number[]>([]);
const allRoles = ref<Role[]>([]);
const submitting = ref(false);

const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit("update:visible", value),
});

const userName = computed(() => {
  return props.user?.nick_name || "";
});

watch(
  () => props.visible,
  (val) => {
    if (val && props.user) {
      loadRolesAndUserRoles();
    }
  },
);

const loadRolesAndUserRoles = async () => {
  try {
    // 获取用户的租户ID（必须存在）
    const tenantId = props.user?.tenant_id;

    // 获取用户ID - 后端使用 user_id (string) 作为主键
    const userId = props.user?.user_id;

    console.log('加载角色数据 - tenantId:', tenantId, 'userId:', userId, '完整用户对象:', props.user);

    if (!userId) {
      throw new Error('用户ID不存在');
    }

    if (!tenantId) {
      throw new Error('用户租户ID不存在');
    }

    // 并行加载所有角色和用户已有角色
    const [rolesRes, userRolesRes] = await Promise.all([
      // 传递 tenant_id 参数，确保只获取同一租户的角色
      associationService.getRoles({ skip: 0, limit: 1000, tenant_id: tenantId }),
      associationService.getUserRoles(userId),
    ]);

    console.log('角色 API 响应:', rolesRes);
    console.log('用户角色 API 响应:', userRolesRes);

    // 处理角色数据
    // 响应拦截器会提取 data.data，如果没有分页字段则直接返回 data.data
    let rolesData: Role[] = [];
    if (Array.isArray(rolesRes)) {
      // 直接是数组（响应拦截器已提取）
      rolesData = rolesRes;
    } else if (rolesRes?.data) {
      // 有 .data 属性（分页数据）
      rolesData = Array.isArray(rolesRes.data)
        ? rolesRes.data
        : (rolesRes.data as any).items || [];
    }

    console.log('处理后的角色数据:', rolesData);
    allRoles.value = rolesData;
    filteredRoles.value = rolesData;

    // 处理用户已有角色
    // 响应拦截器对于非分页数据直接返回 data.data
    let userRoles: Role[] = [];
    if (Array.isArray(userRolesRes)) {
      userRoles = userRolesRes;
    } else if (userRolesRes?.data && Array.isArray(userRolesRes.data)) {
      userRoles = userRolesRes.data;
    }

    console.log('处理后的用户角色:', userRoles);
    selectedRoleIds.value = userRoles.map((r: Role) => r.role_id || r.id);
  } catch (error: unknown) {
    console.error("加载角色数据失败:", error);
    ElMessage.error(`加载角色数据失败: ${error.message}`);
  }
};

const handleClose = () => {
  emit("update:visible", false);
  searchKeyword.value = "";
  filteredRoles.value = [];
  selectedRoleIds.value = [];
  allRoles.value = [];
};

const handleSubmit = async () => {
  try {
    submitting.value = true;

    // 后端使用 user_id (string) 作为主键
    const userId = props.user?.user_id;

    if (!userId) {
      ElMessage.error("用户ID不存在");
      return;
    }

    if (selectedRoleIds.value.length === 0) {
      ElMessage.warning("请至少选择一个角色");
      return;
    }

    await associationService.assignRolesToUser(userId, selectedRoleIds.value);

    ElMessage.success("角色分配成功");
    emit("submit");
    handleClose();
  } catch (error: unknown) {
    console.error("角色分配失败:", error);
    ElMessage.error(`角色分配失败: ${error.message}`);
  } finally {
    submitting.value = false;
  }
};

const filterRoles = () => {
  if (!searchKeyword.value) {
    filteredRoles.value = allRoles.value;
  } else {
    const keyword = searchKeyword.value.toLowerCase();
    filteredRoles.value = allRoles.value.filter(
      (role) =>
        role.role_name.toLowerCase().includes(keyword) ||
        role.role_code.toLowerCase().includes(keyword),
    );
  }
};
</script>

<style scoped>
.role-assignment-container {
  max-height: 500px;
  overflow-y: auto;
}

.role-search {
  margin-bottom: 15px;
}

.role-list-container {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 10px;
  max-height: 350px;
  overflow-y: auto;
}

.role-list-container :deep(.el-checkbox) {
  display: block;
  margin-bottom: 10px;
  margin-left: 10px;
}

.role-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.role-name {
  font-weight: 500;
}

.role-code {
  font-size: 12px;
  color: #909399;
}
</style>
