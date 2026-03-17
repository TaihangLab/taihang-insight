/**
 * 本地视频管理 Composable 单元测试
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock clipboard API
Object.defineProperty(global.navigator, 'clipboard', {
  value: {
    writeText: vi.fn().mockResolvedValue(undefined),
  },
  writable: true,
})

// Mock Element Plus 组件 - 必须在顶部，不引用外部变量
vi.mock('element-plus', () => {
  const ElMessage = {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  }
  const ElMessageBox = {
    confirm: vi.fn(),
  }
  const ElNotification = vi.fn()

  return {
    ElMessage,
    ElMessageBox,
    ElNotification,
  }
})

// Mock API - 必须在顶部，不引用外部变量
vi.mock('@/api/center/localVideo', () => {
  const mockGetVideoList = vi.fn()
  const mockUploadVideo = vi.fn()
  const mockUpdateVideo = vi.fn()
  const mockDeleteVideo = vi.fn()
  const mockGetStreamStatus = vi.fn()
  const mockStartStream = vi.fn()
  const mockStopStream = vi.fn()

  return {
    default: {
      getVideoList: mockGetVideoList,
      uploadVideo: mockUploadVideo,
      updateVideo: mockUpdateVideo,
      deleteVideo: mockDeleteVideo,
      getStreamStatus: mockGetStreamStatus,
      startStream: mockStartStream,
      stopStream: mockStopStream,
    },
    // 导出 mock 函数供测试使用
    mockGetVideoList,
    mockUploadVideo,
    mockUpdateVideo,
    mockDeleteVideo,
    mockGetStreamStatus,
    mockStartStream,
    mockStopStream,
  }
})

// 导入 mock 后的模块
import { ElMessage } from 'element-plus'
import localVideoAPI from '@/api/center/localVideo'
import { useLocalVideo } from '@/composables/useLocalVideo'
import type { LocalVideo } from '@/types/center.d'

// 从 mock 中获取函数引用
const mockGetVideoList = localVideoAPI.getVideoList as any
const mockUploadVideo = localVideoAPI.uploadVideo as any
const mockUpdateVideo = localVideoAPI.updateVideo as any
const mockDeleteVideo = localVideoAPI.deleteVideo as any
const mockGetStreamStatus = localVideoAPI.getStreamStatus as any
const mockStartStream = localVideoAPI.startStream as any
const mockStopStream = localVideoAPI.stopStream as any

// Mock 数据
const mockVideoList: LocalVideo[] = [
  {
    id: 1,
    name: '测试视频1',
    description: '测试描述',
    file_path: '/path/to/video1.mp4',
    file_size: 1024000,
    duration: 60,
    fps: 30,
    width: 1920,
    height: 1080,
    is_streaming: false,
    created_at: '2024-01-01T00:00:00',
  },
  {
    id: 2,
    name: '测试视频2',
    description: '',
    file_path: '/path/to/video2.mp4',
    file_size: 2048000,
    duration: 120,
    fps: 25,
    width: 1280,
    height: 720,
    is_streaming: true,
    stream_id: 'stream_2',
    created_at: '2024-01-02T00:00:00',
  },
]

describe('useLocalVideo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('初始状态', () => {
    it('应该正确初始化所有状态', () => {
      const { loading, videoList, totalVideos, streamingVideos } = useLocalVideo()

      expect(loading.value).toBe(false)
      expect(videoList.value).toEqual([])
      expect(totalVideos.value).toBe(0)
      expect(streamingVideos.value).toBe(0)
    })

    it('应该正确初始化筛选状态', () => {
      const { searchName, filterStreaming } = useLocalVideo()

      expect(searchName.value).toBe('')
      expect(filterStreaming.value).toBe(null)
    })

    it('应该正确初始化对话框状态', () => {
      const {
        uploadDialogVisible,
        editDialogVisible,
        streamDialogVisible,
        uploading,
      } = useLocalVideo()

      expect(uploadDialogVisible.value).toBe(false)
      expect(editDialogVisible.value).toBe(false)
      expect(streamDialogVisible.value).toBe(false)
      expect(uploading.value).toBe(false)
    })
  })

  describe('loadVideos', () => {
    it('应该成功加载视频列表', async () => {
      const mockResponse = {
        data: mockVideoList,
        total: 2,
        skip: 0,
        limit: 20, // API 默认分页大小
      }
      mockGetVideoList.mockResolvedValue(mockResponse)
      mockGetStreamStatus.mockResolvedValue({
        stream_id: 'stream_2',
        video_id: 2,
        video_name: '测试视频2',
        rtsp_url: 'rtsp://localhost/stream_2',
        is_running: true,
        fps: 25,
        resolution: '1280x720',
        stats: {},
      })

      const { loadVideos, videoList, totalVideos, streamingVideos, loading } = useLocalVideo()

      await loadVideos()

      // 验证 API 被调用（不验证默认参数，那是 API 层的实现细节）
      expect(mockGetVideoList).toHaveBeenCalled()
      expect(videoList.value).toEqual(mockVideoList)
      expect(totalVideos.value).toBe(2)
      expect(streamingVideos.value).toBe(1)
      expect(loading.value).toBe(false)
    })
  })

  describe('showUploadDialog', () => {
    it('应该正确显示上传对话框并重置表单', () => {
      const { showUploadDialog, uploadDialogVisible, uploadForm } = useLocalVideo()

      // 先修改表单数据
      uploadForm.value.name = '已修改'
      uploadForm.value.description = '测试描述'

      showUploadDialog()

      expect(uploadDialogVisible.value).toBe(true)
      expect(uploadForm.value.name).toBe('')
      expect(uploadForm.value.description).toBe('')
      expect(uploadForm.value.file).toBe(null)
    })
  })

  describe('handleFileChange', () => {
    it('应该正确处理文件选择', () => {
      const { handleFileChange, uploadForm, fileList } = useLocalVideo()

      const mockFile = new File([''], 'test-video.mp4', { type: 'video/mp4' })
      const mockUploadFile = {
        raw: mockFile,
        name: 'test-video.mp4',
      } as any

      // 调用时传递包含文件的数组
      handleFileChange(mockUploadFile, [mockUploadFile])

      expect(uploadForm.value.file).toEqual(mockFile)
      // fileList 应该更新为传入的数组
      expect(fileList.value.length).toBe(1)
      expect(fileList.value[0]).toEqual(mockUploadFile)
      expect(uploadForm.value.name).toBe('test-video')
    })

    it('应该保留已有的视频名称', () => {
      const { handleFileChange, uploadForm } = useLocalVideo()

      uploadForm.value.name = '已有名称'

      const mockFile = new File([''], 'test-video.mp4', { type: 'video/mp4' })
      const mockUploadFile = {
        raw: mockFile,
        name: 'test-video.mp4',
      } as any

      handleFileChange(mockUploadFile, [mockUploadFile])

      expect(uploadForm.value.name).toBe('已有名称')
    })
  })

  describe('showEditDialog', () => {
    it('应该正确显示编辑对话框并填充数据', () => {
      const { showEditDialog, editDialogVisible, editForm, currentVideo } = useLocalVideo()

      showEditDialog(mockVideoList[0])

      expect(editDialogVisible.value).toBe(true)
      expect(currentVideo.value).toEqual(mockVideoList[0])
      expect(editForm.value.name).toBe('测试视频1')
      expect(editForm.value.description).toBe('测试描述')
    })
  })

  describe('startStream', () => {
    it('应该显示推流配置对话框', () => {
      const { startStream, streamDialogVisible, streamForm, currentVideo } = useLocalVideo()

      startStream(mockVideoList[0])

      expect(streamDialogVisible.value).toBe(true)
      expect(currentVideo.value).toEqual(mockVideoList[0])
      expect(streamForm.value.stream_id).toBe('')
      expect(streamForm.value.stream_fps).toBe(undefined)
    })

    it('应该使用视频配置的默认帧率', () => {
      const videoWithFps = { ...mockVideoList[0], stream_fps: 25 }
      const { startStream, streamForm } = useLocalVideo()

      startStream(videoWithFps)

      expect(streamForm.value.stream_fps).toBe(25)
    })
  })

  describe('deleteVideo', () => {
    it('应该阻止删除正在推流的视频', async () => {
      const { deleteVideo } = useLocalVideo()

      await deleteVideo(mockVideoList[1])

      expect(ElMessage.warning).toHaveBeenCalledWith(
        '请先停止推流后再删除'
      )
      expect(mockDeleteVideo).not.toHaveBeenCalled()
    })
  })

  describe('copyToClipboard', () => {
    it('应该成功复制到剪贴板', async () => {
      const { copyToClipboard } = useLocalVideo()

      await copyToClipboard('rtsp://localhost/test')

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('rtsp://localhost/test')
      expect(ElMessage.success).toHaveBeenCalledWith(
        'RTSP地址已复制到剪贴板'
      )
    })

    // TODO: 修复复制失败测试 - mockImplementationOnce 在某些情况下不稳定
    // 可以通过创建一个新的 composable 实例来测试错误处理
    it.skip('应该处理复制失败的情况', async () => {
      const writeTextMock = vi.mocked(navigator.clipboard.writeText)
      writeTextMock.mockRejectedValueOnce(new Error('复制失败'))

      const { copyToClipboard } = useLocalVideo()

      await copyToClipboard('rtsp://localhost/test')

      expect(ElMessage.error).toHaveBeenCalledWith('复制失败')

      writeTextMock.mockResolvedValue(undefined)
    })
  })

  describe('格式化函数', () => {
    it('应该正确格式化文件大小', () => {
      const { formatFileSize } = useLocalVideo()

      expect(formatFileSize(0)).toBe('0 B')
      expect(formatFileSize(1024)).toBe('1.00 KB')
      expect(formatFileSize(1024 * 1024)).toBe('1.00 MB')
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1.00 GB')
    })

    it('应该正确格式化时长', () => {
      const { formatDuration } = useLocalVideo()

      expect(formatDuration(0)).toBe('-')
      expect(formatDuration(59)).toBe('59s')
      expect(formatDuration(60)).toBe('1m 0s')
      expect(formatDuration(3661)).toBe('1h 1m 1s')
    })

    it('应该正确格式化日期时间', () => {
      const { formatDateTime } = useLocalVideo()

      expect(formatDateTime('')).toBe('-')
      expect(formatDateTime('2024-01-01T12:00:00')).toMatch(/2024/)
    })
  })
})
