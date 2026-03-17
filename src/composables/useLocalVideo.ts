/**
 * 本地视频管理 Composable
 *
 * 提供本地视频的 CRUD 操作和推流控制功能
 */
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import type { FormInstance, FormRules, UploadFile } from 'element-plus'
import localVideoAPI from '@/api/center/localVideo'
import type { LocalVideo } from '@/types/center.d'

/**
 * 视频列表查询参数
 */
export interface LocalVideoQuery {
  name?: string
  is_streaming?: boolean
}

/**
 * 上传表单数据
 */
export interface UploadFormData {
  file: File | null
  name: string
  description: string
  stream_fps?: number
}

/**
 * 编辑表单数据
 */
export interface EditFormData {
  name: string
  description: string
  stream_fps?: number | null
}

/**
 * 推流配置表单数据
 */
export interface StreamFormData {
  stream_id: string
  stream_fps?: number | null
}

/**
 * 使用本地视频管理
 */
export function useLocalVideo() {
  // ==================== 状态 ====================
  const loading = ref(false)
  const videoList = ref<LocalVideo[]>([])
  const totalVideos = ref(0)
  const streamingVideos = ref(0)

  // 查询和筛选
  const searchName = ref('')
  const filterStreaming = ref<boolean | null>(null)

  // 上传相关
  const uploadDialogVisible = ref(false)
  const uploading = ref(false)
  const uploadProgress = ref(0)
  const uploadFormRef = ref<FormInstance>()
  const uploadForm = ref<UploadFormData>({
    file: null,
    name: '',
    description: '',
    stream_fps: undefined,
  })
  const fileList = ref<UploadFile[]>([])
  const uploadRules: FormRules<UploadFormData> = {
    file: [{ required: true, message: '请选择视频文件', trigger: 'change' }],
    name: [
      { required: true, message: '请输入视频名称', trigger: 'blur' },
      { min: 1, max: 255, message: '长度在 1 到 255 个字符', trigger: 'blur' },
    ],
  }

  // 编辑相关
  const editDialogVisible = ref(false)
  const editFormRef = ref<FormInstance>()
  const currentVideo = ref<LocalVideo | null>(null)
  const editForm = ref<EditFormData>({
    name: '',
    description: '',
    stream_fps: null,
  })
  const editRules: FormRules<EditFormData> = {
    name: [
      { required: true, message: '请输入视频名称', trigger: 'blur' },
      { min: 1, max: 255, message: '长度在 1 到 255 个字符', trigger: 'blur' },
    ],
  }

  // 推流配置相关
  const streamDialogVisible = ref(false)
  const streamForm = ref<StreamFormData>({
    stream_id: '',
    stream_fps: null,
  })

  // 推流操作中的视频ID集合（防止重复点击）
  const streamingOperations = ref<Set<number>>(new Set())

  // 定时器
  let timer: number | null = null

  // ==================== 方法 ====================

  /**
   * 加载视频列表
   */
  const loadVideos = async () => {
    loading.value = true
    try {
      const params: LocalVideoQuery = {}
      if (searchName.value) {
        params.name = searchName.value
      }
      if (filterStreaming.value !== null && filterStreaming.value !== undefined) {
        params.is_streaming = filterStreaming.value
      }

      const response = await localVideoAPI.getVideoList(params)

      videoList.value = response.data
      totalVideos.value = response.total
      streamingVideos.value = videoList.value.filter((v) => v.is_streaming).length

      // 获取推流状态
      await loadStreamingStatus()
    } catch (error) {
      ElMessage.error(`加载视频列表失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      loading.value = false
    }
  }

  /**
   * 加载推流状态
   */
  const loadStreamingStatus = async () => {
    for (const video of videoList.value) {
      if (video.is_streaming) {
        try {
          const response = await localVideoAPI.getStreamStatus(video.id)
          if (response) {
            // 更新推流信息
            Object.assign(video, {
              rtsp_url: response.rtsp_url,
              stream_stats: response.stats,
            })
          }
        } catch (error) {
          console.error(`获取视频${video.id}推流状态失败:`, error)
        }
      }
    }
  }

  /**
   * 刷新推流状态（定时调用）
   */
  const refreshStreamingStatus = async () => {
    if (loading.value) return

    const streamingVideosList = videoList.value.filter((v) => v.is_streaming)
    for (const video of streamingVideosList) {
      try {
        const response = await localVideoAPI.getStreamStatus(video.id)
        if (response) {
          Object.assign(video, {
            rtsp_url: response.rtsp_url,
            stream_stats: response.stats,
          })
        } else {
          // 推流状态不一致，刷新列表
          video.is_streaming = false
        }
      } catch (error) {
        console.error(`刷新视频${video.id}推流状态失败:`, error)
      }
    }
  }

  /**
   * 搜索处理
   */
  const handleSearch = () => {
    loadVideos()
  }

  /**
   * 显示上传对话框
   */
  const showUploadDialog = () => {
    uploadForm.value = {
      file: null,
      name: '',
      description: '',
      stream_fps: undefined,
    }
    fileList.value = []
    uploadDialogVisible.value = true
    // 重置表单验证
    uploadFormRef.value?.clearValidate()
  }

  /**
   * 文件选择处理
   */
  const handleFileChange = (file: UploadFile, uploadFileList: UploadFile[]) => {
    uploadForm.value.file = file.raw as File
    fileList.value = uploadFileList

    // 如果没有输入名称，使用文件名（去除扩展名）
    if (!uploadForm.value.name && file.name) {
      uploadForm.value.name = file.name.replace(/\.[^/.]+$/, '')
    }
  }

  /**
   * 提交上传
   */
  const submitUpload = async () => {
    if (!uploadFormRef.value) return

    const valid = await uploadFormRef.value.validate().catch(() => false)
    if (!valid) return

    if (!uploadForm.value.file) {
      ElMessage.error('请选择视频文件')
      return
    }

    uploading.value = true
    const formData = new FormData()
    formData.append('file', uploadForm.value.file)
    formData.append('name', uploadForm.value.name)
    if (uploadForm.value.description) {
      formData.append('description', uploadForm.value.description)
    }
    // 只有当用户明确填写了帧率且值有效时才传递
    if (uploadForm.value.stream_fps && uploadForm.value.stream_fps > 0) {
      formData.append('stream_fps', uploadForm.value.stream_fps.toString())
    }

    try {
      await localVideoAPI.uploadVideo(formData)
      ElMessage.success('视频上传成功')
      uploadDialogVisible.value = false
      loadVideos()
    } catch (error) {
      ElMessage.error(`上传失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      uploading.value = false
      uploadProgress.value = 0
    }
  }

  /**
   * 重置上传表单
   */
  const resetUploadForm = () => {
    uploadFormRef.value?.resetFields()
    uploadForm.value.file = null
    fileList.value = []
  }

  /**
   * 显示编辑对话框
   */
  const showEditDialog = (video: LocalVideo) => {
    currentVideo.value = video
    editForm.value = {
      name: video.name,
      description: video.description || '',
      stream_fps: video.stream_fps ?? null,
    }
    editDialogVisible.value = true
  }

  /**
   * 提交编辑
   */
  const submitEdit = async () => {
    if (!editFormRef.value || !currentVideo.value) return

    const valid = await editFormRef.value.validate().catch(() => false)
    if (!valid) return

    try {
      // 构建更新数据，只传递有效的字段
      const updateData: {
        name: string
        description?: string
        stream_fps?: number
      } = {
        name: editForm.value.name,
        description: editForm.value.description,
      }
      // 只有当用户明确填写了帧率且值有效时才传递
      if (editForm.value.stream_fps && editForm.value.stream_fps > 0) {
        updateData.stream_fps = editForm.value.stream_fps
      }

      await localVideoAPI.updateVideo(currentVideo.value.id, updateData)
      ElMessage.success('视频信息已更新')
      editDialogVisible.value = false
      loadVideos()
    } catch (error) {
      ElMessage.error(`更新失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 开始推流
   */
  const startStream = (video: LocalVideo) => {
    currentVideo.value = video
    streamForm.value = {
      stream_id: '',
      stream_fps: video.stream_fps ?? undefined,
    }
    streamDialogVisible.value = true
  }

  /**
   * 确认开始推流
   */
  const confirmStartStream = async () => {
    if (!currentVideo.value) return

    // 防止重复提交
    if (streamingOperations.value.has(currentVideo.value.id)) {
      ElMessage.warning('推流操作正在进行中，请稍候...')
      return
    }

    // 添加到操作集合中
    streamingOperations.value.add(currentVideo.value.id)

    try {
      const streamFps =
        streamForm.value.stream_fps && streamForm.value.stream_fps > 0
          ? streamForm.value.stream_fps
          : undefined

      const response = await localVideoAPI.startStream(currentVideo.value.id, streamFps)

      ElMessage.success('推流已启动')
      streamDialogVisible.value = false

      // 显示RTSP地址（10秒后自动关闭，也可手动关闭）
      ElNotification({
        title: '推流成功',
        message: `RTSP地址: ${response.rtsp_url}`,
        type: 'success',
        duration: 10000,
        showClose: true,
      })

      loadVideos()
    } catch (error) {
      ElMessage.error(`启动推流失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      // 从操作集合中移除
      streamingOperations.value.delete(currentVideo.value.id!)
    }
  }

  /**
   * 停止推流
   */
  const stopStream = (video: LocalVideo) => {
    ElMessageBox.confirm('确定要停止推流吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
      .then(async () => {
        try {
          await localVideoAPI.stopStream(video.id)
          ElMessage.success('推流已停止')
          loadVideos()
        } catch (error) {
          ElMessage.error(`停止推流失败: ${error instanceof Error ? error.message : '未知错误'}`)
        }
      })
      .catch(() => {
        // 用户取消
      })
  }

  /**
   * 删除视频
   */
  const deleteVideo = (video: LocalVideo) => {
    if (video.is_streaming) {
      ElMessage.warning('请先停止推流后再删除')
      return
    }

    ElMessageBox.confirm(`确定要删除视频"${video.name}"吗？删除后无法恢复。`, '警告', {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'error',
    })
      .then(async () => {
        try {
          await localVideoAPI.deleteVideo(video.id)
          ElMessage.success('视频已删除')
          loadVideos()
        } catch (error) {
          ElMessage.error(`删除失败: ${error instanceof Error ? error.message : '未知错误'}`)
        }
      })
      .catch(() => {
        // 用户取消
      })
  }

  /**
   * 复制到剪贴板
   */
  const copyToClipboard = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        ElMessage.success('RTSP地址已复制到剪贴板')
      })
      .catch(() => {
        ElMessage.error('复制失败')
      })
  }

  /**
   * 格式化文件大小
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
  }

  /**
   * 格式化时长
   */
  const formatDuration = (seconds?: number): string => {
    if (!seconds) return '-'
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)
    if (h > 0) {
      return `${h}h ${m}m ${s}s`
    } else if (m > 0) {
      return `${m}m ${s}s`
    } else {
      return `${s}s`
    }
  }

  /**
   * 格式化日期时间
   */
  const formatDateTime = (dateStr?: string): string => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // ==================== 生命周期 ====================
  onMounted(() => {
    loadVideos()
    // 定时刷新推流状态
    timer = window.setInterval(() => {
      refreshStreamingStatus()
    }, 10000) // 每10秒刷新一次
  })

  onBeforeUnmount(() => {
    if (timer !== null) {
      clearInterval(timer)
    }
  })

  // ==================== 返回 ====================
  return {
    // 状态
    loading,
    videoList,
    totalVideos,
    streamingVideos,
    searchName,
    filterStreaming,
    uploadDialogVisible,
    uploading,
    uploadProgress,
    uploadFormRef,
    uploadForm,
    fileList,
    uploadRules,
    editDialogVisible,
    editFormRef,
    currentVideo,
    editForm,
    editRules,
    streamDialogVisible,
    streamForm,
    streamingOperations,

    // 方法
    loadVideos,
    handleSearch,
    showUploadDialog,
    handleFileChange,
    submitUpload,
    resetUploadForm,
    showEditDialog,
    submitEdit,
    startStream,
    confirmStartStream,
    stopStream,
    deleteVideo,
    copyToClipboard,
    formatFileSize,
    formatDuration,
    formatDateTime,
  }
}
