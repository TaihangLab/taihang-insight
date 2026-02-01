import { AxiosResponse } from 'axios'
import visionAIAxios, { handleSimpleResponse, type UnifiedResponse } from './base'
import type { Camera, CameraQueryParams, AITask } from './types'
/**
 * 摄像头管理 API
 * 提供摄像头的增删改查操作
 */

/**
 * 摄像头管理 API 类
 */
class CameraAPI {
  /**
   * 获取摄像头列表
   * @param params 查询参数
   * @returns 摄像头列表响应
   */
  async getCameraList(params: CameraQueryParams = {}): Promise<AxiosResponse<UnifiedResponse<Camera[]>>> {
    const apiParams = { ...params }

    if (!apiParams.page) {
      apiParams.page = 1
    }

    if (!apiParams.limit) {
      apiParams.limit = 10
    } else {
      apiParams.limit = Math.min(params.limit || 10, 100)
    }

    console.log('获取摄像头列表 - API调用参数:', apiParams)

    try {
      const response = await visionAIAxios.get('/api/v1/cameras/ai/list', { params: apiParams })
      return this.transformCameraListResponse(response)
    } catch (error) {
      console.error('获取摄像头列表失败:', error)
      throw error
    }
  }

  /**
   * 转换摄像头列表响应数据
   */
  private transformCameraListResponse(response: AxiosResponse): AxiosResponse {
    const originalData = response.data

    if (originalData && originalData.code !== undefined) {
      return response
    }

    const transformedData: UnifiedResponse<Camera[]> = {
      code: 0,
      msg: 'success',
      data: [],
      total: 0
    }

    if (originalData && originalData.cameras) {
      transformedData.data = originalData.cameras.map((camera: any) => ({
        id: camera.id,
        name: camera.name || '未命名摄像头',
        camera_uuid: camera.camera_uuid || '-',
        location: camera.location || '-',
        status: camera.status || false,
        tags: camera.tags || [],
        camera_type: camera.camera_type || '-',
        skill_names: camera.skill_names || []
      }))
      transformedData.total = originalData.total || transformedData.data.length

      if (originalData.page) transformedData.page = originalData.page
      if (originalData.limit) transformedData.limit = originalData.limit
      if (originalData.pages) transformedData.pages = originalData.pages
    } else if (originalData && originalData.data && originalData.data.cameras) {
      transformedData.data = originalData.data.cameras.map((camera: any) => ({
        id: camera.id,
        name: camera.name || '未命名摄像头',
        camera_uuid: camera.camera_uuid || '-',
        location: camera.location || '-',
        status: camera.status || false,
        tags: camera.tags || [],
        camera_type: camera.camera_type || '-',
        skill_names: camera.skill_names || []
      }))
      transformedData.total = originalData.data.total || transformedData.data.length

      if (originalData.data.page) transformedData.page = originalData.data.page
      if (originalData.data.limit) transformedData.limit = originalData.data.limit
      if (originalData.data.pages) transformedData.pages = originalData.data.pages
    } else {
      console.error('无法解析摄像头列表数据格式:', originalData)
      transformedData.data = []
      transformedData.total = 0
    }

    response.data = transformedData
    console.log('摄像头列表响应转换完成:', response.data)

    return response
  }

  /**
   * 获取摄像头详情
   * @param cameraId 摄像头ID
   */
  async getCameraDetail(cameraId: number | string): Promise<AxiosResponse> {
    try {
      return await visionAIAxios.get(`/api/v1/cameras/${cameraId}`)
    } catch (error) {
      console.error('获取摄像头详情失败:', error)
      throw error
    }
  }

  /**
   * 更新摄像头信息
   * @param cameraId 摄像头ID
   * @param updateData 更新数据
   */
  async updateCamera(cameraId: number | string, updateData: Partial<Camera>): Promise<AxiosResponse> {
    if (!cameraId) {
      console.error('更新摄像头失败: 缺少摄像头ID')
      return Promise.reject(new Error('缺少摄像头ID'))
    }

    console.log('更新摄像头数据:', cameraId, updateData)

    try {
      return await visionAIAxios.put(`/api/v1/cameras/${cameraId}`, updateData)
        .then(response => handleSimpleResponse(response, '更新摄像头'))
    } catch (error) {
      console.error('更新摄像头失败:', error)
      throw error
    }
  }

  /**
   * 获取摄像头关联的AI任务
   * @param cameraId 摄像头ID
   */
  async getCameraAITasks(cameraId: number | string): Promise<AxiosResponse<UnifiedResponse<AITask[]>>> {
    if (!cameraId) {
      console.error('获取摄像头关联任务失败: 缺少摄像头ID')
      return Promise.reject(new Error('缺少摄像头ID'))
    }

    try {
      return await visionAIAxios.get(`/api/v1/ai-tasks/camera/id/${cameraId}`)
    } catch (error) {
      console.error('获取摄像头关联任务失败:', error)
      throw error
    }
  }
}

// 导出单例实例
export default new CameraAPI()
