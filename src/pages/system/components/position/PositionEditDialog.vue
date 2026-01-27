<template>
  <el-dialog
    :title="dialogTitle"
    v-model="dialogVisible"
    width="600px"
    @close="closeDialog"
  >
    <el-form :model="positionForm" :rules="positionRules" ref="positionFormRef" label-width="100px">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="岗位编码" prop="position_code">
            <el-input v-model="positionForm.position_code" :disabled="!!currentPosition" placeholder="请输入岗位编码"></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="岗位名称" prop="position_name">
            <el-input v-model="positionForm.position_name" placeholder="请输入岗位名称"></el-input>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="类别编码" prop="category_code">
            <el-input v-model="positionForm.category_code" placeholder="请输入类别编码"></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="显示排序" prop="order_num">
            <el-input-number v-model="positionForm.order_num" :min="0" :max="999" controls-position="right" style="width: 100%"></el-input-number>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="显示排序" prop="order_num">
            <el-input-number v-model="positionForm.order_num" :min="0" :max="999" controls-position="right" style="width: 100%"></el-input-number>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="岗位级别">
            <el-select v-model="positionForm.level" placeholder="请选择岗位级别" style="width: 100%">
              <el-option label="高层管理" value="high"></el-option>
              <el-option label="中层管理" value="middle"></el-option>
              <el-option label="基层管理" value="basic"></el-option>
              <el-option label="普通员工" value="staff"></el-option>
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item label="岗位职责">
            <el-input type="textarea" v-model="positionForm.responsibility" :rows="3" placeholder="请输入岗位职责"></el-input>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item label="任职要求">
            <el-input type="textarea" v-model="positionForm.requirements" :rows="3" placeholder="请输入任职要求"></el-input>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="岗位状态">
            <el-radio-group v-model="positionForm.status">
              <el-radio :label="1">正常</el-radio>
              <el-radio :label="0">停用</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="岗位级别">
            <el-select v-model="positionForm.level" placeholder="请选择岗位级别" style="width: 100%">
              <el-option label="高层管理" value="high"></el-option>
              <el-option label="中层管理" value="middle"></el-option>
              <el-option label="基层管理" value="basic"></el-option>
              <el-option label="普通员工" value="staff"></el-option>
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <span slot="footer" class="dialog-footer">
      <el-button @click="fillTestData">智能填充测试数据</el-button>
      <el-button @click="cancel">取消</el-button>
      <el-button type="primary" @click="submitForm">确定</el-button>
    </span>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick } from 'vue'
import type { FormInstance } from 'element-plus'

interface PositionForm {
  id: string | number | null
  position_code: string
  category_code: string
  position_name: string
  order_num: number
  level: string
  responsibility: string
  requirements: string
  status: number
  tenant_id?: string | number
}

interface Position {
  id?: string | number
  position_code?: string
  category_code?: string
  position_name?: string
  order_num?: number
  level?: string
  responsibility?: string
  requirements?: string
  status?: number
  [key: string]: any
}

const props = withDefaults(
  defineProps<{
    visible: boolean
    currentPosition: Position | null
    tenantId: string | number | null
  }>(),
  {
    visible: false,
    currentPosition: null,
    tenantId: null
  }
)

const emit = defineEmits<{
  'update:visible': [value: boolean]
  submit: [data: PositionForm]
}>()

const positionFormRef = ref<FormInstance>()

const positionForm = reactive<PositionForm>({
  id: null,
  position_code: '',
  category_code: '',
  position_name: '',
  order_num: 1,
  level: '',
  responsibility: '',
  requirements: '',
  status: 1
})

const positionRules = {
  position_code: [{ required: true, message: '请输入岗位编码', trigger: 'blur' }],
  position_name: [{ required: true, message: '请输入岗位名称', trigger: 'blur' }],
  category_code: [{ required: true, message: '请输入类别编码', trigger: 'blur' }],
  order_num: [{ required: true, message: '请输入显示排序', trigger: 'blur' }]
}

const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

const dialogTitle = computed(() => (props.currentPosition ? '编辑岗位' : '新增岗位'))

const resetForm = () => {
  Object.assign(positionForm, {
    id: null,
    position_code: '',
    category_code: '',
    position_name: '',
    order_num: 1,
    level: '',
    responsibility: '',
    requirements: '',
    status: 1
  })
}

watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      resetForm()
      if (props.currentPosition) {
        Object.assign(positionForm, props.currentPosition)
      }
    }
  }
)

const submitForm = async () => {
  if (!positionFormRef.value) return

  const valid = await positionFormRef.value.validate()
  if (valid) {
    const formData: PositionForm = { ...positionForm }

    if (props.tenantId) {
      formData.tenant_id = props.tenantId
    }

    emit('submit', formData)
  }
}

const closeDialog = () => {
  emit('update:visible', false)
  nextTick(() => {
    if (positionFormRef.value) {
      positionFormRef.value.clearValidate()
    }
  })
}

const cancel = () => {
  closeDialog()
}

const fillTestData = () => {
  const testData = {
    position_code: `POS${Math.floor(Math.random() * 9000 + 1000)}`,
    category_code: `CAT${Math.floor(Math.random() * 900 + 100)}`,
    position_name: getRandomPositionName(),
    order_num: Math.floor(Math.random() * 100),
    level: getRandomLevel(),
    responsibility: getRandomResponsibility(),
    requirements: getRandomRequirements(),
    status: Math.random() > 0.5 ? 1 : 0
  }

  Object.assign(positionForm, testData)
}

const getRandomPositionName = () => {
  const names = [
    '项目经理',
    '软件工程师',
    '产品经理',
    'UI设计师',
    '测试工程师',
    '运维工程师',
    '数据分析师',
    '前端工程师',
    '后端工程师',
    '全栈工程师',
    '技术总监',
    '人事专员',
    '财务专员',
    '销售经理'
  ]
  return names[Math.floor(Math.random() * names.length)]
}

const getRandomDepartment = () => {
  const departments = [
    '研发部',
    '产品部',
    '设计部',
    '测试部',
    '运营部',
    '人事部',
    '财务部',
    '销售部',
    '市场部',
    '客服部'
  ]
  return departments[Math.floor(Math.random() * departments.length)]
}

const getRandomLevel = () => {
  const levels = ['high', 'middle', 'basic', 'staff']
  return levels[Math.floor(Math.random() * levels.length)]
}

const getRandomResponsibility = () => {
  const responsibilities = [
    '负责项目整体规划与执行',
    '负责产品功能设计与优化',
    '负责系统架构设计与开发',
    '负责产品质量保障',
    '负责系统运维与安全',
    '负责数据分析与报告',
    '负责用户界面设计',
    '负责客户服务与支持'
  ]
  return responsibilities[Math.floor(Math.random() * responsibilities.length)]
}

const getRandomRequirements = () => {
  const requirements = [
    '本科及以上学历，计算机相关专业',
    '3年以上相关工作经验',
    '熟练掌握相关技术栈',
    '良好的沟通协调能力',
    '具备团队合作精神',
    '有项目管理经验者优先',
    '熟悉敏捷开发流程',
    '有大型系统开发经验者优先'
  ]
  const count = Math.floor(Math.random() * 3) + 2
  const shuffled = [...requirements].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count).join('；')
}
</script>

<style scoped>
/* 组件样式继承自父组件的全局样式 */
</style>
