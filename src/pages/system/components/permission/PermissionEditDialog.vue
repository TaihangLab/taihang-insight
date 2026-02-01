<template>
  <el-dialog
    :title="dialogTitle"
    v-model="dialogVisible"
    width="800px"
    @close="closeDialog"
  >
    <DevTools v-if="dialogVisible" v-model="permissionForm" type="permission" :enabled="isDev" />

    <el-form :model="permissionForm" :rules="permissionRules" ref="permissionFormRef" label-width="110px">
      <!-- 父节点选择（仅编辑模式） -->
      <el-form-item v-if="!isCreate && dialogVisible" label="父节点" prop="parent_id">
        <el-tree-select
          v-model="permissionForm.parent_id"
          :data="parentOptions"
          :props="{ label: 'permission_name', value: 'id', children: 'children' }"
          :render-after-expand="false"
          check-strictly
          clearable
          placeholder="可重新选择父节点调整结构"
          style="width: 100%;"
        />
        <div class="form-tip">重新选择父节点可调整权限树结构</div>
      </el-form-item>

      <!-- 权限类型 -->
      <el-form-item label="权限类型" prop="permission_type">
        <el-radio-group v-model="permissionForm.permission_type" @change="handleTypeChange">
          <el-radio value="folder">文件夹</el-radio>
          <el-radio value="menu">页面菜单</el-radio>
          <el-radio value="button">操作按钮</el-radio>
        </el-radio-group>
        <div v-if="parentNode && isCreate" class="form-tip">
          父节点：{{ parentNode.permission_name }} ({{ getTypeLabel(parentNode.node_type) }})
        </div>
      </el-form-item>

      <el-divider content-position="left">基本信息</el-divider>

      <!-- 权限名称 -->
      <el-form-item label="权限名称" prop="permission_name">
        <el-input v-model="permissionForm.permission_name" placeholder="如：用户管理"></el-input>
      </el-form-item>

      <!-- 路由路径 / API 路径 -->
      <el-form-item
        :label="permissionForm.permission_type === 'button' ? 'API 路径' : '路由路径'"
        prop="path"
      >
        <el-input
          v-model="permissionForm.path"
          :placeholder="permissionForm.permission_type === 'button' ? '如：/api/v1/rbac/users' : '如：/system/user-management'"
          @input="handlePathInput"
        ></el-input>
        <div class="form-tip">
          {{ permissionForm.permission_type === 'button' ? '接口请求路径，用于前端权限校验' : '前端路由路径，如 /system/user' }}
        </div>
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

      <!-- 组件路径 (仅 folder 和 menu 类型) -->
      <el-form-item
        v-if="permissionForm.permission_type !== 'button'"
        label="组件路径"
        prop="component"
      >
        <el-input v-model="permissionForm.component" placeholder="如：@/pages/system/userManagement.vue"></el-input>
        <div class="form-tip">支持 @ 别名，相对路径</div>
      </el-form-item>

      <!-- 图标 (仅 folder 和 menu 类型) -->
      <el-form-item
        v-if="permissionForm.permission_type !== 'button'"
        label="图标"
        prop="icon"
      >
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

      <!-- HTTP 方法 (仅按钮类型) -->
      <el-form-item
        v-if="permissionForm.permission_type === 'button'"
        label="HTTP 方法"
        prop="method"
      >
        <el-select v-model="permissionForm.method" placeholder="请选择请求方法" style="width: 100%;">
          <el-option label="GET" value="GET" />
          <el-option label="POST" value="POST" />
          <el-option label="PUT" value="PUT" />
          <el-option label="DELETE" value="DELETE" />
          <el-option label="PATCH" value="PATCH" />
        </el-select>
        <div class="form-tip">按钮权限对应的 HTTP 请求方法</div>
      </el-form-item>

      <el-divider content-position="left">显示设置</el-divider>

      <!-- 显示选项 -->
      <el-form-item label="显示选项" v-if="permissionForm.permission_type !== 'button'">
        <el-checkbox v-model="permissionForm.visible">在菜单中显示</el-checkbox>
        <el-checkbox v-if="permissionForm.permission_type === 'folder'" v-model="permissionForm.layout">需要 Layout</el-checkbox>
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
import DevTools from '@/components/common/DevTools.vue'
import type { PermissionTreeNode, PermissionType } from '@/types/rbac/permission'
import { PermissionNodeType } from '@/types/rbac/permission'

interface PermissionForm {
  permission_type: 'folder' | 'menu' | 'button'
  permission_name: string
  permission_code: string
  path: string
  component?: string
  icon?: string
  sort_order: number
  description?: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  visible?: boolean
  layout?: boolean
  status: number
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
  permission_type: 'folder',
  permission_name: '',
  permission_code: '',
  path: '',
  component: '',
  icon: '',
  sort_order: 1,
  description: '',
  method: 'POST',
  visible: true,
  layout: true,
  status: 0,
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
    { pattern: /^[a-zA-Z:_/]+$/, message: '权限编码只能包含字母、冒号、下划线和斜杠', trigger: 'blur' }
  ],
  path: [
    { required: true, message: '请输入路由路径', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9/{}-]+$/, message: '路由路径只能包含字母、数字、斜杠、短横线和路径参数', trigger: 'blur' }
  ]
}

const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

const isCreate = computed(() => props.mode === 'create')
const parentNode = computed(() => props.parentNode)

// 检测是否为开发环境
const isDev = computed(() => {
  return import.meta.env.DEV
})

const dialogTitle = computed(() => {
  if (isCreate.value) {
    return parentNode.value ? `新增子权限 - ${parentNode.value.permission_name}` : '新增权限'
  }
  return `编辑权限 - ${props.node?.permission_name || ''}`
})

/**
 * 获取所有子节点ID（递归）
 */
const getAllChildIds = (node: PermissionTreeNode): number[] => {
  const ids = [node.id]
  if (node.children && node.children.length > 0) {
    node.children.forEach(child => {
      ids.push(...getAllChildIds(child))
    })
  }
  return ids
}

/**
 * 父节点选择器选项类型（简化版，只需要显示和选择用）
 */
interface ParentOption {
  id: number
  permission_name: string
  children?: ParentOption[]
}

/**
 * 过滤父节点选项（排除当前节点及其子节点）
 */
const parentOptions = computed((): ParentOption[] => {
  // 如果没有权限树数据，返回只有根节点选项
  if (!props.permissionTree || props.permissionTree.length === 0) {
    return [{ id: -1, permission_name: '（作为根节点）' }]
  }

  // 获取当前节点的所有子节点ID
  const excludeIds = props.node ? getAllChildIds(props.node) : []

  // 递归过滤节点
  const filterTree = (nodes: PermissionTreeNode[]): ParentOption[] => {
    return nodes
      .filter(node => !excludeIds.includes(node.id))
      .map(node => ({
        id: node.id,
        permission_name: node.permission_name,
        children: node.children ? filterTree(node.children) : undefined
      }))
  }

  // 添加一个"根节点"选项，使用 -1 作为特殊标识
  return [
    { id: -1, permission_name: '（作为根节点）' },
    ...filterTree(props.permissionTree)
  ]
})

watch(() => props.visible, (newVal) => {
  if (newVal) {
    initForm()
  }
})

const getTypeLabel = (type: 'folder' | 'menu' | 'button' | PermissionNodeType) => {
  const labels: Record<string, string> = {
    folder: '文件夹',
    menu: '页面菜单',
    button: '操作按钮'
  }
  return labels[type as string] || type
}

const initForm = () => {
  if (isCreate.value) {
    // 新增模式 - folder > menu > button 三级结构
    permissionForm.value = {
      permission_type: parentNode.value?.node_type === 'folder' ? 'menu'
                    : parentNode.value?.node_type === 'menu' ? 'button'
                    : 'folder',
      permission_name: '',
      permission_code: '',
      path: '',
      component: '',
      icon: '',
      sort_order: 1,
      description: '',
      method: 'POST',
      visible: true,
      layout: true,
      status: 0,
      parent_id: parentNode.value?.id || null
    }

    // 如果有父节点，生成默认的权限码前缀
    if (parentNode.value) {
      generateCode()
    }
  } else if (props.node) {
    // 编辑模式 - 从节点类型映射到表单类型
    const node = props.node
    const nodeTypeToFormType = (nodeType: PermissionNodeType): 'folder' | 'menu' | 'button' => {
      if (nodeType === 'folder') return 'folder'
      if (nodeType === 'menu') return 'menu'
      return 'button'
    }

    permissionForm.value = {
      permission_type: nodeTypeToFormType(node.node_type),
      permission_name: node.permission_name || '',
      permission_code: node.permission_code || '',
      path: node.path || '',
      component: node.component || '',
      icon: node.icon || '',
      sort_order: node.sort_order || 1,
      description: '', // 后端没有这个字段，留空
      method: 'POST', // 默认 POST
      visible: node.visible ?? true,
      layout: true, // 默认值
      status: node.status ?? 0,
      parent_id: node.parent_id ?? null
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
  const parentCode = parentNode.value?.permission_code || ''

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
      // 页面菜单：添加 :view 后缀
      code = code.replace(/\//g, ':') + ':view'
      break
    case 'button':
      // 操作按钮：基于父页面菜单
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

    console.log('[PermissionEditDialog] 表单数据:', permissionForm.value)
    console.log('[PermissionEditDialog] parent_id:', permissionForm.value.parent_id, typeof permissionForm.value.parent_id)

    // 构建提交数据，使用蛇形命名
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
    // button 类型添加 method 字段
    if (permissionForm.value.permission_type === 'button' && permissionForm.value.method) {
      submitData.method = permissionForm.value.method
    }
    // parent_id 处理：-1 表示根节点（传递 null），其他值正常传递
    if (permissionForm.value.parent_id !== null && permissionForm.value.parent_id !== undefined) {
      submitData.parent_id = permissionForm.value.parent_id === -1 ? null : permissionForm.value.parent_id
      console.log('[PermissionEditDialog] 设置 parent_id:', submitData.parent_id)
    } else {
      console.log('[PermissionEditDialog] parent_id 为 null/undefined，不传递')
    }

    console.log('[PermissionEditDialog] 提交数据:', submitData)
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
