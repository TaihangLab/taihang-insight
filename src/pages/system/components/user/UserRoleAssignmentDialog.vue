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
              <el-checkbox
                v-for="role in filteredRoles"
                :key="role.id"
                :value="role.id"
              >
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
    <span slot="footer" class="dialog-footer">
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleSubmit" :loading="submitting">
        确定分配
      </el-button>
    </span>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import associationService from '@/api/rbac/associationService'
import type { User } from '@/types/rbac/user'
import type { Role } from '@/types/rbac/role'

const props = withDefaults(
  defineProps<{
    visible: boolean
    user?: User | null
  }>(),
  {
    user: null
  }
)

const emit = defineEmits<{
  'update:visible': [value: boolean]
  submit: []
}>()

const searchKeyword = ref('')
const filteredRoles = ref<Role[]>([])
const selectedRoleIds = ref<number[]>([])
const allRoles = ref<Role[]>([])
const submitting = ref(false)

const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

const userName = computed(() => {
  return props.user?.nick_name || ''
})

watch(
  () => props.visible,
  (val) => {
    if (val && props.user) {
      loadRolesAndUserRoles()
    }
  }
)

const loadRolesAndUserRoles = async () => {
  try {
    // 并行加载所有角色和用户已有角色
    const [rolesRes, userRolesRes] = await Promise.all([
      associationService.getRoles({ skip: 0, limit: 1000 }),
      associationService.getUserRoles(props.user.id)
    ])

    // 处理角色数据 - 支持 { items, total } 和直接数组两种格式
    if (rolesRes?.data) {
      const rolesData = Array.isArray(rolesRes.data) ? rolesRes.data : ((rolesRes.data as any).items || [])
      allRoles.value = rolesData
      filteredRoles.value = rolesData
    }

    if (userRolesRes?.data) {
      // 提取用户已有的角色ID
      const existingRoles = Array.isArray(userRolesRes.data) ? userRolesRes.data : [userRolesRes.data]
      selectedRoleIds.value = existingRoles.map((r: Role) => r.id)
    }
  } catch (error: any) {
    console.error('加载角色数据失败:', error)
    ElMessage.error(`加载角色数据失败: ${error.message}`)
  }
}

const handleClose = () => {
  emit('update:visible', false)
  searchKeyword.value = ''
  filteredRoles.value = []
  selectedRoleIds.value = []
  allRoles.value = []
}

const handleSubmit = async () => {
  try {
    submitting.value = true

    const userIdentifier = props.user.id

    if (selectedRoleIds.value.length === 0) {
      ElMessage.warning('请至少选择一个角色')
      return
    }

    await associationService.assignRolesToUser(userIdentifier, selectedRoleIds.value)

    ElMessage.success('角色分配成功')
    emit('submit')
    handleClose()
  } catch (error: any) {
    console.error('角色分配失败:', error)
    ElMessage.error(`角色分配失败: ${error.message}`)
  } finally {
    submitting.value = false
  }
}

const filterRoles = () => {
  if (!searchKeyword.value) {
    filteredRoles.value = allRoles.value
  } else {
    const keyword = searchKeyword.value.toLowerCase()
    filteredRoles.value = allRoles.value.filter(
      role =>
        role.role_name.toLowerCase().includes(keyword) ||
        role.role_code.toLowerCase().includes(keyword)
    )
  }
}
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
