<template>
  <div class="multimodal-create-wrapper">
    <div class="multimodal-create">
      <!-- 统一卡片容器 -->
      <div class="page-container">
        <!-- 头部导航 -->
        <div class="header-section">
          <div class="header-left">
            <div class="page-title-container">
              <el-button icon="el-icon-arrow-left" link @click="goBack" class="back-btn">
                {{ pageTitle }}
              </el-button>
              <span v-if="showSkillInfo" class="skill-info">
                ({{ skillName }})
                <span class="skill-status">
                  <span class="status-dot" :class="skillData.status === 'online' ? 'online' : 'offline'"></span>
                  {{ skillStatus }}
                </span>
              </span>
            </div>
          </div>
          <div class="header-right" v-if="isCreateMode">
            <el-button @click="saveDraft">保存</el-button>
            <el-button type="primary" @click="saveAndPublish">保存并上线</el-button>
          </div>
          <div class="header-right" v-else-if="isEditMode">
            <el-button @click="cancelEdit">取消编辑</el-button>
            <el-button @click="saveDraft">保存</el-button>
            <el-button type="primary" @click="saveAndPublish">保存并上线</el-button>
          </div>
          <div class="header-right" v-else>
            <!-- 查看模式下，仅未上线技能显示编辑按钮 -->
            <el-button 
              v-if="skillData.status === 'offline'"
              @click="editCurrentSkill"
              :title="'编辑技能'">
              编辑技能
            </el-button>
          </div>
        </div>

        <!-- 主内容区域 -->
        <div class="content-container">
          <!-- 左侧基本参数 -->
          <div class="left-panel">
            <div class="params-card">
              <div class="panel-title">基本参数</div>
              
              <div class="form-section">
              <!-- 技能ID（仅查看模式显示） -->
              <div class="form-item" v-if="isViewMode && skillData.id">
                <label class="form-label">技能ID:</label>
                <div class="skill-id-display">
                  <span class="id-text">{{ skillData.id }}</span>
                  <el-button 
                    link 
                    icon="el-icon-document-copy" 
                    size="small"
                    @click="copyToClipboard(skillData.id)"
                    class="copy-id-btn">
                    复制
                  </el-button>
                </div>
              </div>

              <!-- 技能名称 -->
              <div class="form-item">
                <label class="form-label required">技能名称:</label>
                <el-input 
                  v-model="skillForm.name" 
                  placeholder="请输入技能名称"
                  maxlength="30"
                  show-word-limit
                  :disabled="isViewMode"
                  class="form-input">
                </el-input>
                <div class="form-tips">
                  仅支持数字、中文、大小写英文字母、非特殊符号；不允许空白符，不超过30字符
                </div>
              </div>

              <!-- 技能标签 -->
              <div class="form-item">
                <label class="form-label">技能标签:</label>
                <el-select 
                  v-model="skillForm.categories" 
                  placeholder="请选择标签"
                  :disabled="isViewMode"
                  multiple
                  collapse-tags
                  class="form-input">
                  <el-option label="图像识别" value="图像识别"></el-option>
                  <el-option label="安全监控" value="安全监控"></el-option>
                  <el-option label="异常检测" value="异常检测"></el-option>
                  <el-option label="行为分析" value="行为分析"></el-option>
                  <el-option label="合规检测" value="合规检测"></el-option>
                </el-select>
                <div class="form-tips" v-if="!isViewMode">
                  可添加五个标签，支持多选
                </div>
                <div class="form-tips" v-else>
                  当前技能标签：{{ skillForm.categories && skillForm.categories.length > 0 ? skillForm.categories.join('、') : '无' }}
                </div>
              </div>

              <!-- 技能描述 -->
              <div class="form-item">
                <label class="form-label required">技能描述:</label>
                <el-input 
                  v-model="skillForm.description"
                  type="textarea"
                  placeholder="1.请将您的需求通过疑问句描述出来，问题应能够通过「是」或「否」进行回答，当大模型分析结果为「是」，将输出任务结果；&#10; 2.尽量使用「形容词+名词」形式描述目标，输出结果会更准确的"
                  :rows="6"
                  maxlength="1000"
                  show-word-limit
                  :disabled="isViewMode"
                  class="form-textarea">
                </el-input>
                <div class="form-link">
                  <el-button link @click="showDescriptionExample">技能描述示例</el-button>
                </div>
              </div>
              </div>
            </div>
          </div>

          <!-- 右侧验证和结果 -->
          <div class="right-panel">
            <!-- 效果验证卡片 -->
            <div class="verification-card">
              <div class="verification-section">
                <div class="verification-title-overlay">
                  <span class="verification-icon">🔬</span>
                  <span class="verification-text">效果验证</span>
                  <el-button 
                    icon="el-icon-delete" 
                    link 
                    size="small" 
                    class="clear-btn-overlay"
                    @click="clearUpload">
                    清空
                  </el-button>
                </div>
                
                <div class="upload-area">
                  <el-upload
                    ref="upload"
                    class="upload-dragger"
                    drag
                    :action="uploadAction"
                    :before-upload="beforeUpload"
                    :on-change="handleFileChange"
                    :on-success="handleUploadSuccess"
                    :on-error="handleUploadError"
                    :file-list="fileList"
                    :auto-upload="false"
                    :show-file-list="false"
                    accept=".jpg,.jpeg,.png"
                    :limit="1"
                    :style="{'width': '90%'}">
                    <div class="upload-content" v-if="fileList.length === 0">
                      <i class="el-icon-upload upload-icon"></i>
                      <div class="upload-text">将文件拖拽此处，或点击上传</div>
                      <div class="upload-tips">文件大小不超过 20MB 内，支持JPEG、JPG、PNG格式</div>
                    </div>
                    <div class="upload-preview" v-else>
                      <div class="preview-image-container">
                        <img :src="fileList[0].url" alt="预览图片" class="preview-image" />
                      </div>
                    </div>
                  </el-upload>
                </div>

                <!-- 开始分析按钮 - 移动到效果验证卡片内 -->
                <div class="analysis-action">
                  <el-button 
                    type="primary" 
                    icon="el-icon-cpu"
                    :loading="analyzing"
                    @click="startAnalysis"
                    :disabled="!canAnalyze"
                    class="analysis-btn">
                    {{ analyzing ? '分析中...' : '开始分析' }}
                  </el-button>

                </div>
              </div>
            </div>

            <!-- AI分析结果卡片 -->
            <div class="result-card">
              <div class="result-section">
                <div class="result-title-overlay">
                  <span class="ai-text">AI</span>
                  <span class="result-text">分析结果</span>
                </div>
                
                <div class="result-content">
                  <div v-if="!analysisResult" class="empty-result">
                    <i class="el-icon-warning-outline empty-icon"></i>
                    <div class="empty-text">暂无分析结果，请先配置参数并上传验证数据</div>
                  </div>
                  <div v-else class="analysis-result">{{analysisResult}}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 技能描述示例滑出窗口 -->
    <div v-show="showExamplePanel" class="example-panel-overlay" @click="closeExamplePanel">
      <div class="example-panel" @click.stop>
        <div class="example-header">
          <h3 class="example-title">技能描述示例</h3>
          <el-button icon="el-icon-close" link @click="closeExamplePanel" class="close-btn"></el-button>
        </div>
        
        <div class="example-subtitle">
          您可以通过以下方式描述技能，或直接引用示例查看效果：
        </div>
        
        <div class="example-content">
          <div v-for="(example, index) in exampleList" :key="index" class="example-item">
            <div class="example-image">
              <img :src="example.imagePath" :alt="example.title" />
            </div>
            <div class="example-details">
              <h4 class="example-item-title">{{ example.title }}</h4>
              <p class="example-description">{{ example.description }}</p>
              <el-button 
                type="primary" 
                size="small" 
                @click="useExample(example)"
                class="reference-btn">
                引用
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import centerAPI from '@/api/center'

export default {
  name: 'MultimodalReviewCreate',
  data() {
    return {
      skillForm: {
        name: '',
        categories: [],
        description: ''
      },
      skillData: {}, // 存储原始技能数据
      originalSkillForm: null, // 用于取消编辑时恢复数据
      fileList: [],
      uploadAction: '#',
      analyzing: false,
      analysisResult: '',
      currentMode: 'create', // 'create', 'view', 'edit'
      currentSkillId: null,
      showExamplePanel: false, // 控制示例窗口显示
      exampleList: [ // 技能描述示例列表
        {
          title: '作业未穿工作服识别',
          description: '图中是否有人在操作软管但没有穿连体裤？',
          imagePath: '@/components/visionAI/skillManagement/example/imgs/example01.jpeg',
          categories: ['安全监控', '行为分析']
        },
        {
          title: '天气异常识别',
          description: '图片是否是一个下雨天？',
          imagePath: '@/components/visionAI/skillManagement/example/imgs/example02.jpeg',
          categories: ['图像识别', '异常检测']
        },
        {
          title: '人员驾驶识别',
          description: '图中的人坐在车里吗？',
          imagePath: '@/components/visionAI/skillManagement/example/imgs/example03.jpeg',
          categories: ['图像识别', '行为分析']
        },
        {
          title: '倚靠栏杆识别',
          description: '图中的人是否靠在栏杆上？',
          imagePath: '@/components/visionAI/skillManagement/example/imgs/example04.jpeg',
          categories: ['安全监控', '合规检测']
        }
      ]
    }
  },
  created() {
    this.initPage()
  },
  watch: {
    '$route'(to, from) {
      // 监听路由变化，重新初始化页面
      this.initPage()
    }
  },
  computed: {
    canAnalyze() {
      return this.skillForm.name && 
             this.skillForm.description && 
             this.fileList.length > 0
    },
    
    isViewMode() {
      return this.currentMode === 'view'
    },
    
    isEditMode() {
      return this.currentMode === 'edit'
    },
    
    isCreateMode() {
      return this.currentMode === 'create'
    },
    
    pageTitle() {
      if (this.isViewMode) return '技能详情'
      if (this.isEditMode) return '编辑技能'
      return '创建技能'
    },

    skillName() {
      return this.skillData.name || ''
    },

    skillStatus() {
      return this.skillData.status === 'online' ? '已上线' : '未上线'
    },

    showSkillInfo() {
      return (this.isViewMode || this.isEditMode) && this.skillData.name
    }
  },
  methods: {
    // 初始化页面
    initPage() {
      const { id, mode } = this.$route.query
      
      if (id && mode) {
        this.currentSkillId = id
        this.currentMode = mode
        this.loadSkillData(id)
      } else {
        this.currentMode = 'create'
      }
    },

    // 根据ID获取技能（通过API）
    async getSkillById(skillId) {
      try {
        const response = await centerAPI.reviewSkill.getReviewSkillDetail(skillId)
        console.log('获取技能详情响应:', response.data)
        
        // 修复数据解析逻辑，处理后端统一响应格式
        let skillData = null
        
        // 后端的获取技能详情接口直接返回技能对象
        if (response.skill_id) {
          skillData = response
        } else if (response.id) {
          skillData = response
        }
        
        if (skillData) {
          // 转换数据格式
          return {
            id: skillData.skill_id || skillData.id,
            name: skillData.name || skillData.skill_name,
            description: skillData.description,
            status: skillData.status ? 'online' : 'offline',
            categories: skillData.tags || skillData.skill_tags || [],
            skill_id: skillData.skill_id || skillData.id,
            internal_id: skillData.id,
            created_at: skillData.created_at,
            updated_at: skillData.updated_at,
            version: skillData.version,
            prompt_template: skillData.prompt_template,
            system_prompt: skillData.system_prompt
          }
        }
        return null
      } catch (error) {
        console.error('获取技能详情失败:', error)
        throw error
      }
    },

    // 加载技能数据（通过API）
    async loadSkillData(skillId) {
      try {
        const skill = await this.getSkillById(skillId)
        
        if (skill) {
          this.skillData = { ...skill }
          this.skillForm = {
            name: skill.name,
            categories: skill.categories || [],
            description: skill.description
          }
          
          // 检查如果技能已上线，且路由模式是编辑，则强制切换到查看模式
          if (skill.status === 'online' && this.currentMode === 'edit') {
            this.currentMode = 'view'
            this.$message.warning('已上线的技能不可编辑，已自动切换到查看模式')
          }
          
          // 如果是查看模式，设置一个示例分析结果
          if (this.isViewMode) {
            this.analysisResult = '该技能已配置完成，能够有效识别图像中的目标对象，置信度达到95%以上。'
          }
          
          // 强制触发视图更新
          this.$nextTick(() => {
            this.$forceUpdate()
          })
        } else {
          this.$message.error('未找到对应的技能信息')
          // 返回到列表页
          this.$router.push('/skillManage/multimodalReview')
        }
      } catch (error) {
        console.error('加载技能数据失败:', error)
        this.$message.error('加载技能数据失败: ' + (error.message || '未知错误'))
        // 返回到列表页
        this.$router.push('/skillManage/multimodalReview')
      }
    },

    goBack() {
      this.$router.go(-1)
    },

    // 编辑当前技能
    editCurrentSkill() {
      // 检查技能状态，已上线的技能不可编辑
      if (this.skillData.status === 'online') {
        this.$message.warning('已上线的技能不可编辑，请先下线后再编辑')
        return
      }
      
      // 保存原始数据，用于取消编辑时恢复
      this.originalSkillForm = {
        name: this.skillData.name || '',
        categories: [...(this.skillData.categories || [])],
        description: this.skillData.description || ''
      }
      
      this.currentMode = 'edit'
      
      // 确保表单数据与当前技能数据同步
      this.skillForm = {
        name: this.skillData.name || '',
        categories: [...(this.skillData.categories || [])],
        description: this.skillData.description || ''
      }
      
      this.$message.success('已切换到编辑模式，现在可以修改技能信息')
    },

    // 取消编辑
    cancelEdit() {
      this.$confirm('确认取消编辑吗？未保存的修改将丢失', '取消编辑', {
        confirmButtonText: '确认取消',
        cancelButtonText: '继续编辑',
        type: 'warning'
      }).then(() => {
        // 恢复原始数据
        if (this.originalSkillForm) {
          this.skillForm = { ...this.originalSkillForm }
        }
        
        this.currentMode = 'view'
        this.$message.info('已取消编辑')
      }).catch(() => {
        // 用户选择继续编辑，不做任何操作
      })
    },



    async saveDraft() {
      if (!this.validateForm()) return
      
            try {
        console.log('开始执行保存草稿操作...')
        
        // 确保不设置上线状态
        if (this.skillForm.status === 'online') {
          delete this.skillForm.status
        }
        
        // 更新技能数据（草稿状态）
        const success = await this.updateSkillData()
        
        console.log('保存草稿操作结果:', success)
        
        if (success) {
          this.$message.success('技能已保存为草稿')
          
          // 如果是编辑模式，切换回查看模式
          if (this.isEditMode) {
            console.log('编辑模式，切换到查看模式')
            this.currentMode = 'view'
            // 重新加载数据以确保状态同步
            await this.loadSkillData(this.currentSkillId)
          } else {
            // 如果是创建模式，返回列表页
            console.log('创建模式完成，准备跳转到列表页')
            this.$router.push('/skillManage/multimodalReview')
          }
        } else {
          this.$message.error('保存失败，请检查输入数据')
        }
      } catch (error) {
        console.error('保存草稿失败:', error)
        this.$message.error('保存失败: ' + (error.message || '未知错误'))
      }
    },

    async saveAndPublish() {
      if (!this.validateForm()) return
      
      const actionText = this.isEditMode ? '保存修改并上线' : '保存并上线'
      
      this.$confirm(`确认${actionText}该技能吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }).then(async () => {
        try {
          console.log('开始执行保存并发布操作...')
          
          // 设置为上线状态并保存
          const success = await this.updateSkillData(true)
          
          console.log('保存并发布操作结果:', success)
          
          if (success) {
            this.$message.success(`技能已${actionText}`)
            
            // 如果是编辑模式，切换回查看模式
            if (this.isEditMode) {
              console.log('编辑模式，切换到查看模式')
              this.currentMode = 'view'
              // 重新加载数据以确保状态同步
              await this.loadSkillData(this.currentSkillId)
            } else {
              // 如果是创建模式，返回列表页
              console.log('创建并发布模式完成，准备跳转到列表页')
              this.$router.push('/skillManage/multimodalReview')
            }
          } else {
            this.$message.error(`${actionText}失败，请检查输入数据`)
          }
        } catch (error) {
          console.error('保存并发布失败:', error)
          this.$message.error('操作失败: ' + (error.message || '未知错误'))
        }
      }).catch(() => {
        this.$message.info('已取消操作')
      })
    },

    // 更新技能数据（通过API）
    async updateSkillData(shouldPublish = false) {
      try {
        // 准备更新的技能数据
        const skillData = {
          skill_name: this.skillForm.name.trim(),
          description: this.skillForm.description.trim(),
          skill_tags: [...(this.skillForm.categories || [])],
          prompt_template: this.skillForm.description.trim() // 前端没有单独的提示词字段，使用描述作为提示词
        }
        
        let success = false
        let skillId = null
        
        if (this.isCreateMode || !this.currentSkillId) {
          // 创建新技能
          console.log('创建新技能:', skillData)
          const response = await centerAPI.reviewSkill.createReviewSkill(skillData)
          
          // 检查响应数据结构
          console.log('创建技能响应:', response.data)
          
          // 根据后端实际响应格式进行解析
          if (response.skill) {
            // 后端返回格式：{ success: true, message: "...", skill: {...} }
            const newSkill = response.skill
            this.skillData = {
              id: newSkill.skill_id,
              name: newSkill.name,
              description: newSkill.description,
              status: newSkill.status ? 'online' : 'offline',
              categories: newSkill.tags || [],
              skill_id: newSkill.skill_id,
              internal_id: newSkill.id,
              created_at: newSkill.created_at,
              version: newSkill.version
            }
            this.currentSkillId = newSkill.skill_id
            skillId = newSkill.skill_id
            success = true
          } else if (response.skill_id) {
            // 兼容不同的响应格式
            const newSkill = response
            this.skillData = {
              id: newSkill.skill_id,
              name: newSkill.name,
              description: newSkill.description,
              status: newSkill.status ? 'online' : 'offline',
              categories: newSkill.tags || [],
              skill_id: newSkill.skill_id,
              internal_id: newSkill.id,
              created_at: newSkill.created_at,
              version: newSkill.version
            }
            this.currentSkillId = newSkill.skill_id
            skillId = newSkill.skill_id
            success = true
          } else {
            // 如果响应状态码成功，但数据结构不符合预期，也认为是成功的
            if (response.status === 200 || response.status === 201) {
              console.log('创建技能成功，但响应数据结构不符合预期，尝试使用响应数据')
              // 尝试直接使用响应数据
              if (response.data && response.data.id) {
                this.currentSkillId = response.data.id
                skillId = response.data.id
                success = true
              }
            }
          }
        } else {
          // 更新现有技能
          skillId = this.skillData.skill_id || this.currentSkillId
          console.log('更新现有技能:', skillId, skillData)
          const response = await centerAPI.reviewSkill.updateReviewSkill(skillId, skillData)
          
          console.log('更新技能响应:', response.data, 'status:', response.status)
          
          // 检查响应是否成功
          if (response.status === 200 || response.status === 201) {
            // 重新加载技能数据
            await this.loadSkillData(skillId)
            success = true
          } else {
            console.error('更新技能失败，状态码:', response.status)
          }
        }
        
        // 发布技能（如果需要上线）
        if (success && (shouldPublish || this.skillForm.status === 'online') && skillId) {
          console.log('准备发布技能:', skillId, '发布标记:', shouldPublish, '表单状态:', this.skillForm.status)
          try {
            const publishResponse = await centerAPI.reviewSkill.publishReviewSkill(skillId)
            console.log('发布技能响应:', publishResponse)

            // 发布成功，更新状态
            this.skillData.status = 'online'
            console.log('技能发布成功，状态已更新为online')
          } catch (publishError) {
            console.error('发布技能时出错:', publishError)
            throw publishError
          }
        }
        
        if (success) {
          console.log('技能数据保存成功，skillId:', skillId)
        } else {
          console.log('技能数据保存失败')
        }
        return success
      } catch (error) {
        console.error('保存技能数据失败:', error)
        
        // 提供更详细的错误信息
        let errorMessage = '保存失败'
        if (error.response && error.response.data && error.response.data.detail) {
          errorMessage = error.response.data.detail
        } else if (error.response && error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message
        } else if (error.message) {
          errorMessage = error.message
        }
        
        this.$message.error(errorMessage)
        return false
      }
    },

    validateForm() {
      if (!this.skillForm.name) {
        this.$message.warning('请输入技能名称')
        return false
      }
      if (!this.skillForm.name.trim()) {
        this.$message.warning('技能名称不能为空')
        return false
      }
      if (this.skillForm.name.length > 30) {
        this.$message.warning('技能名称不能超过30个字符')
        return false
      }
      if (!this.skillForm.description) {
        this.$message.warning('请输入技能描述')
        return false
      }
      if (!this.skillForm.description.trim()) {
        this.$message.warning('技能描述不能为空')
        return false
      }
      if (this.skillForm.description.length > 1000) {
        this.$message.warning('技能描述不能超过1000个字符')
        return false
      }
      
      return true
    },

    beforeUpload(file) {
      const isValidType = ['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)
      const isLt20M = file.size / 1024 / 1024 < 20

      if (!isValidType) {
        this.$message.error('只支持JPEG、JPG、PNG格式的图片!')
        return false
      }
      if (!isLt20M) {
        this.$message.error('上传文件大小不能超过 20MB!')
        return false
      }
      
      return true // 允许继续处理
    },

    handleFileChange(file, fileList) {
      // 清空之前的文件，只保留最新上传的文件
      if (fileList.length > 1) {
        // 如果有多个文件，只保留最新的
        this.fileList = [fileList[fileList.length - 1]]
      } else {
        this.fileList = [...fileList]
      }
      
      // 为最新文件创建预览URL
      if (this.fileList.length > 0 && this.fileList[0].raw) {
        const fileUrl = URL.createObjectURL(this.fileList[0].raw)
        this.fileList[0].url = fileUrl
        this.$message.success(`文件 ${this.fileList[0].name} 上传成功`)
      }
    },

    handleUploadSuccess(response, file, fileList) {
      this.$message.success('文件上传成功')
    },

    handleUploadError(err, file, fileList) {
      this.$message.error('文件上传失败')
    },

    clearUpload(silent = false) {
      // 释放之前创建的对象URL，避免内存泄漏
      this.fileList.forEach(file => {
        if (file.url && file.url.startsWith('blob:')) {
          URL.revokeObjectURL(file.url)
        }
      })
      
      this.fileList = []
      this.analysisResult = ''
      
      // 强制更新upload组件
      this.$nextTick(() => {
        const uploadComponent = this.$refs.upload
        if (uploadComponent) {
          uploadComponent.clearFiles()
        }
      })
      
      if (!silent) {
        this.$message.success('已清空上传文件')
      }
    },

    async startAnalysis() {
      if (!this.canAnalyze) {
        this.$message.warning('请先填写完整信息并上传验证文件')
        return
      }

      this.analyzing = true
      
      try {
        let imageFile = null
        
        if (this.fileList.length > 0) {
          const fileItem = this.fileList[0]
          
          if (fileItem.raw) {
            // 用户上传的文件，直接使用raw属性
            imageFile = fileItem.raw
          } else if (fileItem.url) {
            // 示例图片，需要通过URL获取文件数据
            try {
              const response = await fetch(fileItem.url)
              if (!response.ok) {
                throw new Error(`无法加载示例图片: ${response.status}`)
              }
              const blob = await response.blob()
              // 创建File对象
              imageFile = new File([blob], fileItem.name, { type: blob.type || 'image/jpeg' })
            } catch (fetchError) {
              console.error('获取示例图片失败:', fetchError)
              throw new Error('无法加载示例图片，请重新选择图片')
            }
          }
        }
        
        if (!imageFile) {
          throw new Error('未找到图片文件，请重新上传')
        }
        
        // 获取用户提示词（使用技能描述作为提示词）
        const userPrompt = this.skillForm.description.trim()
        if (!userPrompt) {
          throw new Error('请先填写技能描述')
        }
        
        console.log('开始分析图片:', {
          fileName: imageFile.name,
          fileSize: imageFile.size,
          fileType: imageFile.type,
          userPrompt: userPrompt
        })
        
        // 调用预览测试API
        const response = await centerAPI.reviewSkill.previewTestReviewSkill(imageFile, userPrompt)

        // 格式化显示结果
        const reviewResult = response.review_result || '无复判结果'
        const analysisResult = response.analysis_result || {}

        // 构建显示内容
        let displayText = `复判结果: ${reviewResult}\n`

        // 格式化分析结果
        if (typeof analysisResult === 'object' && analysisResult !== null) {
          displayText += '详细分析:\n'
          // 遍历所有键值对
          Object.keys(analysisResult).forEach(key => {
            const value = analysisResult[key]
            if (typeof value === 'boolean') {
              displayText += `• ${key}: ${value}\n`
            } else {
              displayText += `• ${key}: ${value}\n`
            }
          })
        } else {
          displayText += `详细分析: ${analysisResult}`
        }

        this.analysisResult = displayText
        this.$message.success('AI分析完成')
        
      } catch (error) {
        console.error('预览测试失败:', error)
        this.analysisResult = `分析失败：${error.message || '未知错误'}`
                this.$message.error('分析失败: ' + (error.message || '未知错误'))
        } finally {
          this.analyzing = false
        }
    },

    showDescriptionExample() {
      this.showExamplePanel = true
    },

    // 关闭示例窗口
    closeExamplePanel() {
      this.showExamplePanel = false
    },

    // 使用示例
    useExample(example) {
      // 检查是否为查看模式
      if (this.isViewMode) {
        this.$message.warning('查看模式下不能修改技能信息')
        return
      }

      this.$confirm(`确认引用"${example.title}"示例吗？这将替换当前的技能名称、描述和标签`, '引用示例', {
        confirmButtonText: '确定引用',
        cancelButtonText: '取消',
        type: 'info'
      }).then(() => {
        // 填充技能名称和描述
        this.skillForm.name = example.title
        this.skillForm.description = example.description
        this.skillForm.categories = [...example.categories]

        // 清空之前的文件
        this.clearUpload(true)

        // 创建文件对象并添加到fileList
        const fileName = example.imagePath.split('/').pop()
        const fileObj = {
          name: fileName,
          url: example.imagePath,
          raw: null // 示例图片不需要raw对象
        }
        this.fileList = [fileObj]

        // 关闭示例窗口
        this.closeExamplePanel()

        this.$message.success(`已成功引用"${example.title}"示例`)
      }).catch(() => {
        this.$message.info('已取消引用')
      })
    },

    // 复制到剪贴板
    async copyToClipboard(text) {
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(text)
          this.$message.success('技能ID已复制到剪贴板')
        } else {
          // 兼容旧浏览器
          const textArea = document.createElement('textarea')
          textArea.value = text
          textArea.style.position = 'fixed'
          textArea.style.left = '-999999px'
          textArea.style.top = '-999999px'
          document.body.appendChild(textArea)
          textArea.focus()
          textArea.select()
          document.execCommand('copy')
          document.body.removeChild(textArea)
          this.$message.success('技能ID已复制到剪贴板')
        }
      } catch (err) {
        console.error('复制失败:', err)
        this.$message.error('复制失败，请手动复制')
      }
    },


    }
}
</script>

<style scoped>
.multimodal-create-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}

.multimodal-create {
  padding: 20px;
  background-color: #f5f5f5;
  height: calc(100vh - 100px);
  display: flex;
  flex-direction: column;
}

.page-container {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  height: calc(100vh - 80px);
}

.page-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, rgba(0, 0, 0, 0.05) 50%, transparent 100%);
  z-index: 1;
}

.header-section {
  background: white;
  padding: 12px 24px;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
  min-height: 30px;
}

.header-left {
  flex: 1;
  overflow: hidden;
}

.page-title-container {
  display: flex;
  align-items: baseline;
  text-align: left;
  justify-content: flex-start;
  line-height: 1.5;
}

.back-btn {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  padding: 0;
  margin-right: 8px;
  white-space: nowrap;
  line-height: 1.5;
  display: inline-flex;
  align-items: center;
}

.back-btn:hover {
  color: #3b82f6;
}

.skill-info {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  display: inline-flex;
  align-items: baseline;
  gap: 8px;
  line-height: 1.5;
}

.skill-status {
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  line-height: 1.5;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-dot.online {
  background-color: #10b981;
}

.status-dot.offline {
  background-color: #6b7280;
}

.header-right {
  display: flex;
  gap: 12px;
}

.header-right .el-button {
  height: 32px;
  padding: 6px 16px;
  font-size: 14px;
  border-radius: 6px;
  font-weight: 500;
}

/* .header-right .el-button--primary {
  background: linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #06b6d4 100%);
  border: none;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4), 0 2px 4px rgba(30, 64, 175, 0.3);
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  font-weight: 600;
  letter-spacing: 0.3px;
}

.header-right .el-button--primary::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.6s ease;
}

.header-right .el-button--primary:hover {
  background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #0891b2 100%);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.5), 0 4px 8px rgba(30, 64, 175, 0.4);
  transform: translateY(-2px);
}

.header-right .el-button--primary:hover::before {
  left: 100%;
}

.header-right .el-button--primary:active {
  transform: translateY(0px);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
}

.header-right .el-button:not(.el-button--primary) {
  background: #f5f7fa;
  border-color: #e4e7ed;
  color: #606266;
  transition: all 0.3s ease;
}

.header-right .el-button:not(.el-button--primary):hover {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border-color: #3b82f6;
  color: #1e3a8a;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
  transform: translateY(-1px);
} */

.content-container {
  flex: 1;
  display: flex;
  gap: 24px;
  padding: 20px 24px 24px 24px;
  overflow: hidden;
  position: relative;
  z-index: 2;
}

.left-panel {
  width: 480px;
  flex-shrink: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding-right: 12px;
}

.params-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  padding: 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.params-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 20% 20%, rgba(30, 64, 175, 0.08) 0%, transparent 50%),
    radial-gradient(circle at 90% 90%, rgba(59, 130, 246, 0.10) 0%, transparent 50%),
    radial-gradient(circle at 40% 90%, rgba(6, 182, 212, 0.07) 0%, transparent 50%),
    linear-gradient(135deg,
      rgba(30, 64, 175, 0.06) 0%,
      rgba(59, 130, 246, 0.08) 25%,
      rgba(6, 182, 212, 0.06) 50%,
      rgba(30, 64, 175, 0.07) 75%,
      rgba(59, 130, 246, 0.08) 100%);
  border-radius: 12px;
  pointer-events: none;
  z-index: 1;
}

.params-card > * {
  position: relative;
  z-index: 2;
}

.right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 100%;
  overflow: hidden;
  padding-left: 12px;
}

.verification-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  padding: 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  position: relative;
  overflow: hidden;
}

.verification-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 15% 15%, rgba(30, 64, 175, 0.09) 0%, transparent 45%),
    radial-gradient(circle at 85% 85%, rgba(59, 130, 246, 0.11) 0%, transparent 45%),
    radial-gradient(circle at 50% 10%, rgba(6, 182, 212, 0.08) 0%, transparent 40%),
    linear-gradient(135deg,
      rgba(30, 64, 175, 0.07) 0%,
      rgba(59, 130, 246, 0.09) 25%,
      rgba(6, 182, 212, 0.07) 50%,
      rgba(30, 64, 175, 0.08) 75%,
      rgba(59, 130, 246, 0.09) 100%);
  border-radius: 12px;
  pointer-events: none;
  z-index: 1;
}

.verification-card > * {
  position: relative;
  z-index: 2;
}

.result-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  padding: 20px;
  height: 180px;
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
}

.result-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 25% 25%, rgba(30, 64, 175, 0.08) 0%, transparent 50%),
    radial-gradient(circle at 75% 75%, rgba(59, 130, 246, 0.10) 0%, transparent 50%),
    radial-gradient(circle at 60% 20%, rgba(6, 182, 212, 0.07) 0%, transparent 45%),
    linear-gradient(135deg,
      rgba(30, 64, 175, 0.06) 0%,
      rgba(59, 130, 246, 0.08) 25%,
      rgba(6, 182, 212, 0.06) 50%,
      rgba(30, 64, 175, 0.07) 75%,
      rgba(59, 130, 246, 0.08) 100%);
  border-radius: 12px;
  pointer-events: none;
  z-index: 1;
}

.result-card > * {
  position: relative;
  z-index: 2;
}

.panel-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e4e7ed;
  flex-shrink: 0;
}

.form-section {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.form-item {
  margin-bottom: 24px;
}

.form-item:last-child {
  margin-bottom: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.form-label {
  display: block;
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
  font-weight: 500;
}

.form-label.required::before {
  content: '*';
  color: #f56c6c;
  margin-right: 4px;
}

.form-input {
  width: 100%;
}

.form-textarea {
  width: 100%;
  flex: 1;
}

.form-textarea :deep(.el-textarea__inner) {
  height: 100% !important;
  min-height: 120px !important;
  resize: none !important;
}

.form-tips {
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
  line-height: 1.4;
}

.form-link {
  margin-top: 8px;
}

.form-link .el-button {
  padding: 0;
  font-size: 12px;
  color: #3b82f6;
}

/* 技能状态显示样式 */
.skill-status-display {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
}

.skill-status-display .status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.skill-status-display .status-dot.online {
  background-color: #10b981;
}

.skill-status-display .status-dot.offline {
  background-color: #6b7280;
}

.skill-status-display .status-text {
  font-size: 14px;
  color: #374151;
  font-weight: 500;
}

/* 技能ID显示样式 */
.skill-id-display {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
}

.skill-id-display .id-text {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 12px;
  color: #374151;
  flex: 1;
  word-break: break-all;
}

.copy-id-btn {
  color: #3b82f6 !important;
  padding: 2px 8px !important;
  font-size: 12px !important;
  border: 1px solid rgba(59, 130, 246, 0.2) !important;
  border-radius: 4px !important;
  background: rgba(59, 130, 246, 0.05) !important;
  flex-shrink: 0;
}

.copy-id-btn:hover {
  background: rgba(59, 130, 246, 0.1) !important;
  border-color: rgba(59, 130, 246, 0.3) !important;
}

.verification-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
}

.result-section {
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  position: relative;
  flex-shrink: 0;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  flex: 1;
}

.result-title-overlay {
  position: absolute;
  top: -8px;
  left: -8px;
  z-index: 10;
  display: flex;
  align-items: baseline;
  gap: 4px;
  background: rgba(255, 255, 255, 0.95);
  padding: 8px 12px;
  border-radius: 6px;
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.ai-text {
  font-family: 'Arial Black', 'Microsoft YaHei', sans-serif;
  font-size: 18px;
  font-weight: 900;
  background: linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #06b6d4 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 0 10px rgba(59, 130, 246, 0.3);
  letter-spacing: 1px;
  position: relative;
}

.ai-text::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, #1e40af 0%, #3b82f6 50%, #06b6d4 100%);
  border-radius: 1px;
  opacity: 0.6;
}

.result-text {
  font-family: 'Microsoft YaHei', sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: #606266;
  letter-spacing: 0.5px;
}

.verification-title-overlay {
  position: absolute;
  top: -8px;
  left: -8px;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.95);
  padding: 8px 12px;
  border-radius: 6px;
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.verification-icon {
  font-size: 16px;
  filter: drop-shadow(0 0 8px rgba(102, 126, 234, 0.4));
}

.verification-text {
  font-family: 'Microsoft YaHei', 'Arial', sans-serif;
  font-size: 16px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 1px;
  position: relative;
}

.verification-text::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  border-radius: 1px;
  opacity: 0.5;
}

.clear-btn-overlay {
  color: #909399;
  padding: 0;
  font-size: 12px;
  margin-left: auto;
}

.clear-btn-overlay:hover {
  color: #f56c6c;
}

.clear-btn {
  color: #909399;
  padding: 0;
  font-size: 12px;
}

.clear-btn:hover {
  color: #f56c6c;
}

.upload-area {
  width: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 360px;
  min-height: 360px;
  margin-top: 8px;
}

.verification-card .upload-dragger {
  width: 90% !important;
  height: 360px !important;
  min-height: 360px !important;
}

.verification-card .upload-dragger :deep(.el-upload) {
  width: 100% !important;
  height: 100% !important;
}

.verification-card .upload-dragger :deep(.el-upload-dragger) {
  width: 100% !important;
  height: 360px !important;
  min-height: 360px !important;
  border: 2px dashed #d9d9d9;
  border-radius: 8px;
  background: #fafafa;
  transition: all 0.3s ease;
}

.verification-card .upload-dragger :deep(.el-upload) {
  width: 100% !important;
  height: 100% !important;
}

.verification-card .upload-dragger :deep(.el-upload-dragger) {
  width: 100% !important;
  height: 360px !important;
  min-height: 360px !important;
  border: 2px dashed #d9d9d9;
  border-radius: 8px;
  background: #fafafa;
  transition: all 0.3s ease;
}

.verification-card .upload-dragger :deep(.el-upload-dragger:hover) {
  border-color: #3b82f6;
  background: #eff6ff;
}

.verification-card .upload-dragger :deep(.el-upload-dragger:hover) {
  border-color: #3b82f6;
  background: #eff6ff;
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 360px;
  min-height: 360px;
  padding: 40px 20px;
  box-sizing: border-box;
}

.upload-icon {
  font-size: 48px;
  color: #c0c4cc;
  margin-bottom: 16px;
}

.upload-text {
  font-size: 16px;
  color: #606266;
  margin-bottom: 8px;
  font-weight: 500;
}

.upload-tips {
  font-size: 14px;
  color: #909399;
  text-align: center;
  line-height: 1.4;
}

.upload-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 360px;
  min-height: 360px;
  padding: 15px;
  box-sizing: border-box;
}

.preview-image-container {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-image {
  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  display: block;
  border-radius: 8px;
}





.analysis-action {
  text-align: center;
  /* padding: 16px 0 0 0; */
  flex-shrink: 0;
  border-top: 1px solid #f0f2f5;
  margin-top: 16px;
}

.analysis-btn {
  /* padding: 12px 32px; */
  font-size: 14px;
  font-weight: 600;
  border-radius: 20px;
  margin-bottom: 6px;
  /* background: linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #06b6d4 100%);
  border: none;
  color: white;
  box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2); */
}

/* .analysis-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.analysis-btn:hover::before {
  left: 100%;
}

.analysis-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.6);
  background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #0891b2 100%);
}

.analysis-btn:active {
  transform: translateY(0);
}

.analysis-btn.is-loading {
  background: linear-gradient(135deg, #a0a0a0 0%, #808080 100%);
  box-shadow: 0 4px 15px rgba(160, 160, 160, 0.4);
} */



.result-content {
  flex: 1;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  background: #fafafa;
  display: flex;
  flex-direction: column;
  padding: 16px;
  margin-top: 8px;
  overflow-y: auto;
}

.empty-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  flex: 1;
}

.empty-icon {
  font-size: 28px;
  color: #c0c4cc;
  margin-bottom: 8px;
}

.empty-text {
  font-size: 14px;
  color: #909399;
}

.analysis-result {
  font-size: 14px;
  color: #303133;
  line-height: 1.6;
  white-space: pre-wrap;
  text-align: left;
  padding: 12px 16px;
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  font-family: 'Microsoft YaHei', 'PingFang SC', -apple-system, BlinkMacSystemFont, sans-serif;
}

/* 技能描述示例滑出窗口样式 */
.example-panel-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: stretch;
  justify-content: flex-end;
}

.example-panel {
  width: 600px;
  background: white;
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.15);
  animation: slideInRight 0.3s ease-out;
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.example-header {
  padding: 20px 24px;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  flex-shrink: 0;
}

.example-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.close-btn {
  padding: 8px;
  color: #909399;
  font-size: 16px;
}

.close-btn:hover {
  color: #606266;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
}

.example-subtitle {
  padding: 16px 24px;
  color: #606266;
  font-size: 14px;
  line-height: 1.5;
  background: #f8fafc;
  border-bottom: 1px solid #e4e7ed;
  flex-shrink: 0;
}

.example-content {
  flex: 1;
  padding: 20px 24px;
  overflow-y: auto;
  background: #fafafa;
}

.example-item {
  display: flex;
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  border: 1px solid #f0f2f5;
  position: relative;
  overflow: hidden;
}

.example-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg,
      rgba(59, 130, 246, 0.05) 0%,
      rgba(30, 64, 175, 0.03) 25%,
      rgba(6, 182, 212, 0.04) 50%,
      rgba(59, 130, 246, 0.05) 75%,
      rgba(30, 64, 175, 0.03) 100%);
  border-radius: 12px;
  pointer-events: none;
  z-index: 1;
}

.example-item > * {
  position: relative;
  z-index: 2;
}

.example-item:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.example-item:last-child {
  margin-bottom: 0;
}

.example-image {
  width: 160px;
  height: 120px;
  flex-shrink: 0;
  margin-right: 20px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.example-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.example-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.example-item-title {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  line-height: 1.4;
}

.example-description {
  margin: 0 0 16px 0;
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
  flex: 1;
}

.reference-btn {
  align-self: flex-start;
  padding: 8px 20px;
  font-size: 13px;
  font-weight: 500;
  border-radius: 6px;
  /* background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); */
  border: none;
  color: white;
  /* box-shadow: 0 2px 6px rgba(59, 130, 246, 0.3); */
  /* transition: all 0.3s ease; */
}

/* .reference-btn:hover {
  background: linear-gradient(135deg, #1d4ed8 0%, #1e3a8a 100%);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
  transform: translateY(-1px);
}

.reference-btn:active {
  transform: translateY(0);
} */

/* 响应式设计 */
@media (max-width: 1024px) {
  .content-container {
    flex-direction: column;
    gap: 16px;
  }
  
  .left-panel {
    width: 100%;
    padding-right: 0;
  }
  
  .right-panel {
    padding-left: 0;
  }

  .example-panel {
    width: 100%;
    max-width: 500px;
  }

  .example-item {
    flex-direction: column;
  }

  .example-image {
    width: 100%;
    height: 200px;
    margin-right: 0;
    margin-bottom: 16px;
  }
}
</style> 