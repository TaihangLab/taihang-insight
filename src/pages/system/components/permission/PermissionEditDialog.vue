<template>
  <el-dialog
    :title="dialogTitle"
    v-model="dialogVisible"
    width="800px"
    @close="closeDialog"
  >
    <el-form :model="permissionForm" :rules="permissionRules" ref="permissionFormRef" label-width="110px">
      <!-- 权限类型 -->
      <el-form-item label="权限类型" prop="permission_type">
        <el-radio-group v-model="permissionForm.permission_type" @change="handleTypeChange">
          <el-radio value="folder">文件夹</el-radio>
          <el-radio value="menu">页面</el-radio>
          <el-radio value="button">按钮</el-radio>
        </el-radio-group>
        <div v-if="parentNode" class="form-tip">
          父节点：{{ parentNode.permission_name }} ({{ getTypeLabel(parentNode.permission_type) }})
        </div>
      </el-form-item>

      <el-divider content-position="left">基本信息</el-divider>

      <!-- 权限名称 -->
      <el-form-item label="权限名称" prop="permission_name">
        <el-input v-model="permissionForm.permission_name" placeholder="如：用户管理"></el-input>
      </el-form-item>

      <!-- 路由路径 -->
      <el-form-item label="路由路径" prop="path">
        <el-input
          v-model="permissionForm.path"
          placeholder="如：/system/user-management"
          @input="handlePathInput"
        ></el-input>
      </el-form-item>

      <!-- 权限编码 -->
      <el-form-item label="权限编码" prop="permission_code">
        <el-input v-model="permissionForm.permission_code" placeholder="自动生成或手动输入">
          <template #append>
            <el-button @click="generateCode">生成</el-button>
          </template>
        </el-input>
        <div class="form-tip">
          格式：system:user 或 system:user:view
        </div>
      </el-form-item>

      <!-- 组件路径 (仅菜单类型) -->
      <el-form-item
        v-if="permissionForm.permission_type === 'menu'"
        label="组件路径"
        prop="component"
      >
        <el-input v-model="permissionForm.component" placeholder="如：@/pages/system/userManagement.vue"></el-input>
        <div class="form-tip">支持 @ 别名，相对路径</div>
      </el-form-item>

      <!-- 图标 -->
      <el-form-item label="图标" prop="icon">
        <el-input v-model="permissionForm.icon" placeholder="如：User"></el-input>
      </el-form-item>

      <!-- 排序 -->
      <el-form-item label="排序" prop="sort_order">
        <el-input-number
          v-model="permissionForm.sort_order"
          :min="1"
          :max="9999"
          style="width: 100%;"
        ></el-input-number>
      </el-form-item>

      <!-- 描述 -->
      <el-form-item label="描述" prop="description">
        <el-input
          v-model="permissionForm.description"
          type="textarea"
          :rows="2"
          placeholder="权限说明文字"
        ></el-input>
      </el-form-item>

      <!-- API配置 (仅按钮类型) -->
      <template v-if="permissionForm.permission_type === 'button'">
        <el-divider content-position="left">API 配置</el-divider>

        <el-form-item label="API 地址" prop="api_path">
          <el-input v-model="permissionForm.api_path" placeholder="/api/system/user"></el-input>
          <div class="form-tip">必须以 /api/ 开头</div>
        </el-form-item>

        <el-form-item label="请求方式" prop="methods">
          <el-radio-group v-model="permissionForm.methods">
            <el-radio value="GET">GET</el-radio>
            <el-radio value="POST">POST</el-radio>
            <el-radio value="PUT">PUT</el-radio>
            <el-radio value="PATCH">PATCH</el-radio>
            <el-radio value="DELETE">DELETE</el-radio>
          </el-radio-group>
        </el-form-item>
      </template>

      <el-divider content-position="left">显示设置</el-divider>

      <!-- 显示选项 -->
      <el-form-item label="显示选项" v-if="permissionForm.permission_type !== 'button'">
        <el-checkbox v-model="permissionForm.visible">在菜单中显示</el-checkbox>
        <el-checkbox v-if="permissionForm.permission_type === 'menu'" v-model="permissionForm.layout">需要 Layout</el-checkbox>
      </el-form-item>

      <!-- 状态 -->
      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="permissionForm.status">
          <el-radio :value="0">启用</el-radio>
          <el-radio :value="1">禁用</el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="cancel">取消</el-button>
      <el-button type="primary" @click="submitForm" :loading="submitting">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import type { PermissionTreeNode, PermissionType } from '@/types/rbac/permission'

interface PermissionForm {
  permission_type: PermissionType
  permission_name: string
  permission_code: string
  path: string
  component?: string
  icon?: string
  sort_order: number
  description?: string
  visible?: boolean
  layout?: boolean
  status: number
  api_path?: string
  methods?: string
  parent_id?: number | null
}

const props = defineProps<{
  visible: boolean
  mode?: 'create' | 'edit'
  node?: PermissionTreeNode | null
  parentNode?: PermissionTreeNode | null
  permissionTree?: PermissionTreeNode[]
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  submit: [data: Record<string, unknown>]
}>()

const permissionFormRef = ref<FormInstance>()
const submitting = ref(false)

const permissionForm = ref<PermissionForm>({
  permission_type: 'menu',
  permission_name: '',
  permission_code: '',
  path: '',
  component: '',
  icon: '',
  sort_order: 1,
  description: '',
  visible: true,
  layout: true,
  status: 0,
  api_path: '',
  methods: '',
  parent_id: null
})

const permissionRules: FormRules<PermissionForm> = {
  permission_type: [{ required: true, message: '请选择权限类型', trigger: 'change' }],
  permission_name: [
    { required: true, message: '请输入权限名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  permission_code: [
    { required: true, message: '请输入权限编码', trigger: 'blur' },
    { pattern: /^[a-z:_/]+$/, message: '权限编码只能包含小写字母、冒号、下划线和斜杠', trigger: 'blur' }
  ],
  path: [
    { required: true, message: '请输入路由路径', trigger: 'blur' },
    { pattern: /^[a-z0-9/-/]+$/, message: '路由路径只能包含小写字母、数字、斜杠和短横线', trigger: 'blur' }
  ]
}

const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

const isCreate = computed(() => props.mode === 'create')
const parentNode = computed(() => props.parentNode)

const dialogTitle = computed(() => {
  if (isCreate.value) {
    return parentNode ? `新增子权限 - ${parentNode.permission_name}` : '新增权限'
  }
  return `编辑权限 - ${props.node?.permission_name || ''}`
})

watch(() => props.visible, (newVal) => {
  if (newVal) {
    initForm()
  }
})

const getTypeLabel = (type: PermissionType) => {
  const labels: Record<PermissionType, string> = {
    folder: '文件夹',
    menu: '页面',
    button: '按钮',
    page: '页面'
  }
  return labels[type] || type
}

const initForm = () => {
  if (isCreate.value) {
    // 新增模式
    permissionForm.value = {
      permission_type: parentNode?.permission_type === 'folder' ? 'menu'
                    : parentNode?.permission_type === 'menu' ? 'button'
                    : 'folder',
      permission_name: '',
      permission_code: '',
      path: '',
      component: '',
      icon: '',
      sort_order: 1,
      description: '',
      visible: true,
      layout: true,
      status: 0,
      api_path: '',
      methods: '',
      parent_id: parentNode?.id || null
    }

    // 如果有父节点，生成默认的权限码前缀
    if (parentNode.value) {
      generateCode()
    }
  } else if (props.node) {
    // 编辑模式
    const node = props.node
    permissionForm.value = {
      permission_type: node.permissionType || 'menu',
      permission_name: node.permissionName || '',
      permission_code: node.permissionCode || '',
      path: node.path || '',
      component: node.component || '',
      icon: node.icon || '',
      sort_order: node.sortOrder || 1,
      description: '', // 后端没有这个字段，留空
      visible: node.visible ?? true,
      layout: node.layout ?? true,
      status: node.status ?? 0,
      api_path: '', // 后端可能没有
      methods: '', // 后端可能没有
      parent_id: node.parentId || null
    }
  }
}

const handleTypeChange = () => {
  generateCode()
}

const handlePathInput = () => {
  // 确保路径以 / 开头
  if (permissionForm.value.path && !permissionForm.value.path.startsWith('/')) {
    permissionForm.value.path = '/' + permissionForm.value.path
  }
  generateCode()
}

const generateCode = () => {
  let path = permissionForm.value.path
  const parentCode = parentNode.value?.permissionCode || ''

  if (!path && parentNode.value?.path) {
    path = parentNode.value.path
  }

  if (!path) return

  // 构建权限码
  let code = path
    if (code.startsWith('/')) code = code.substring(1)

  switch (permissionForm.value.permission_type) {
    case 'folder':
      // 文件夹：使用路径本身
      code = code.replace(/\//g, ':').replace(/-/g, '_')
      break
    case 'menu':
      // 页面：添加 :view 后缀
      code = code.replace(/\//g, ':') + ':view'
      break
    case 'button':
      // 按钮：基于父页面
      if (parentCode) {
        if (parentCode.endsWith(':view')) {
          code = parentCode.replace(':view', ':create')
        } else {
          code = parentCode + ':create'
        }
      }
      break
  }

  permissionForm.value.permission_code = code
}

const submitForm = async () => {
  if (!permissionFormRef.value) return

  try {
    await permissionFormRef.value.validate()

    submitting.value = true

    // 构建提交数据
    const submitData: Record<string, unknown> = {
      permission_type: permissionForm.value.permission_type,
      permission_name: permissionForm.value.permission_name,
      permission_code: permissionForm.value.permission_code,
      path: permissionForm.value.path,
      sort_order: permissionForm.value.sort_order,
      description: permissionForm.value.description,
      visible: permissionForm.value.visible ? 1 : 0,
      status: permissionForm.value.status
    }

    // 添加可选字段
    if (permissionForm.value.component) {
      submitData.component = permissionForm.value.component
    }
    if (permissionForm.value.icon) {
      submitData.icon = permissionForm.value.icon
    }
    if (permissionForm.value.parent_id !== null) {
      submitData.parent_id = permissionForm.value.parent_id
    }
    if (permissionForm.value.permission_type === 'button') {
      if (permissionForm.value.api_path) {
        submitData.api_path = permissionForm.value.api_path
      }
      if (permissionForm.value.methods) {
        submitData.methods = permissionForm.value.methods
      }
    }

    emit('submit', submitData)
  } catch (error) {
    console.error('表单验证失败:', error)
  } finally {
    submitting.value = false
  }
}

const closeDialog = () => {
  emit('update:visible', false)
  nextTick(() => {
    if (permissionFormRef.value) {
      permissionFormRef.value.clearValidate()
    }
  })
}

const cancel = () => {
  closeDialog()
}
</script>

<style scoped>
.form-tip {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
  line-height: 1.5;
}
</style>
