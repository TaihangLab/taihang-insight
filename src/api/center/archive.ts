import { AxiosResponse } from 'axios'
import { authAxios, handleSimpleResponse,  type UnifiedResponse, PageParams } from '@/api/commons'
import type { AlertArchive, ArchiveQueryParams, CreateArchiveRequest, Alert } from './types'

/**
 * 档案管理 API
 * 提供预警档案和预警记录的管理功能
 */

/**
 * 预警记录查询参数
 */
export interface AlertRecordQueryParams extends PageParams {
  name?: string
  device_name?: string
  alert_level?: number
  alert_type?: string
  status?: number
  start_time?: string
  end_time?: string
}

/**
 * 预警记录数据
 */
export interface AlertRecord {
  id: number
  archive_id: number
  name: string
  device_name: string
  alert_time: string
  alert_level: number
  alert_type?: string
  location?: string
  description?: string
  remark?: string
  violation_image_url?: string
  violation_video_url?: string
  extra_data?: any
  created_by?: string
  created_at?: string
  updated_at?: string
}

/**
 * 档案管理 API 类
 */
class ArchiveAPI {
  /**
   * 获取预警档案列表
   * @param params 查询参数
   */
  async getArchiveList(params: ArchiveQueryParams = {}): Promise<AxiosResponse<UnifiedResponse<AlertArchive[]>>> {
    const apiParams = { ...params }

    if (!apiParams.page) {
      apiParams.page = 1
    }

    if (!apiParams.limit) {
      apiParams.limit = 20
    }

    console.log('获取预警档案列表 - API调用参数:', apiParams)

    try {
      const response = await authAxios.get('/api/v1/alert-archives', { params: apiParams })
      console.log('获取预警档案列表成功:', response.data)
      return response
    } catch (error) {
      console.error('获取预警档案列表失败:', error)
      throw error
    }
  }

  /**
   * 获取预警档案详情
   * @param archiveId 档案ID
   */
  async getArchiveDetail(archiveId: number): Promise<AxiosResponse<UnifiedResponse<AlertArchive>>> {
    if (!archiveId) {
      console.error('获取档案详情失败: 缺少档案ID')
      return Promise.reject(new Error('缺少档案ID'))
    }

    console.log('获取预警档案详情:', archiveId)

    try {
      const response = await authAxios.get(`/api/v1/alert-archives/${archiveId}`)
      console.log('获取预警档案详情成功:', response.data)
      return response
    } catch (error) {
      console.error('获取预警档案详情失败:', error)
      throw error
    }
  }

  /**
   * 创建预警档案
   * @param archiveData 档案数据
   */
  async createArchive(archiveData: CreateArchiveRequest): Promise<AxiosResponse<UnifiedResponse<AlertArchive>>> {
    if (!archiveData.name || !archiveData.location || !archiveData.start_time || !archiveData.end_time) {
      console.error('创建档案失败: 缺少必要参数')
      return Promise.reject(new Error('缺少必要参数：档案名称、位置、开始时间和结束时间必须提供'))
    }

    console.log('创建预警档案:', archiveData)

    try {
      const response = await authAxios.post('/api/v1/alert-archives', archiveData)
      console.log('创建预警档案成功:', response.data)
      return response
    } catch (error) {
      console.error('创建预警档案失败:', error)
      throw error
    }
  }

  /**
   * 更新预警档案
   * @param archiveId 档案ID
   * @param archiveData 档案数据
   */
  async updateArchive(archiveId: number, archiveData: Partial<AlertArchive>): Promise<AxiosResponse<UnifiedResponse<AlertArchive>>> {
    if (!archiveId) {
      console.error('更新档案失败: 缺少档案ID')
      return Promise.reject(new Error('缺少档案ID'))
    }

    console.log('更新预警档案:', archiveId, archiveData)

    try {
      const response = await authAxios.put(`/api/v1/alert-archives/${archiveId}`, archiveData)
      console.log('更新预警档案成功:', response.data)
      return response
    } catch (error) {
      console.error('更新预警档案失败:', error)
      throw error
    }
  }

  /**
   * 删除预警档案
   * @param archiveId 档案ID
   */
  async deleteArchive(archiveId: number): Promise<AxiosResponse> {
    if (!archiveId) {
      console.error('删除档案失败: 缺少档案ID')
      return Promise.reject(new Error('缺少档案ID'))
    }

    console.log('删除预警档案:', archiveId)

    try {
      const response = await authAxios.delete(`/api/v1/alert-archives/${archiveId}`)
      console.log('删除预警档案成功:', response.data)
      return response
    } catch (error) {
      console.error('删除预警档案失败:', error)
      throw error
    }
  }

  /**
   * 批量删除预警档案
   * @param archiveIds 档案ID数组
   */
  async batchDeleteArchives(archiveIds: number[]): Promise<AxiosResponse> {
    if (!archiveIds || !Array.isArray(archiveIds) || archiveIds.length === 0) {
      console.error('批量删除档案失败: 缺少档案ID数组')
      return Promise.reject(new Error('缺少档案ID数组'))
    }

    console.log('批量删除预警档案:', archiveIds)

    try {
      const response = await authAxios.delete('/api/v1/alert-archives/batch', {
        data: { archive_ids: archiveIds }
      })
      console.log('批量删除预警档案成功:', response.data)
      return response
    } catch (error) {
      console.error('批量删除预警档案失败:', error)
      throw error
    }
  }

  /**
   * 获取档案下的预警记录列表
   * @param archiveId 档案ID
   * @param params 查询参数
   */
  async getArchiveAlerts(archiveId: number, params: AlertRecordQueryParams = {}): Promise<AxiosResponse<UnifiedResponse<Alert[]>>> {
    if (!archiveId) {
      console.error('获取档案预警记录失败: 缺少档案ID')
      return Promise.reject(new Error('缺少档案ID'))
    }

    const apiParams = { ...params }

    if (!apiParams.page) {
      apiParams.page = 1
    }

    if (!apiParams.limit) {
      apiParams.limit = 20
    }

    console.log('获取档案预警记录列表 - API调用参数:', archiveId, apiParams)

    try {
      const response = await authAxios.get(`/api/v1/alert-archives/${archiveId}/alerts`, { params: apiParams })
      console.log('获取档案预警记录列表成功:', response.data)
      return response
    } catch (error) {
      console.error('获取档案预警记录列表失败:', error)
      throw error
    }
  }

  /**
   * 添加预警记录到档案
   * @param recordData 预警记录数据
   */
  async addAlertRecord(recordData: Partial<AlertRecord>): Promise<AxiosResponse<UnifiedResponse<AlertRecord>>> {
    if (!recordData.archive_id || !recordData.name || !recordData.device_name || !recordData.alert_time || !recordData.alert_level) {
      console.error('添加预警记录失败: 缺少必要参数')
      return Promise.reject(new Error('缺少必要参数：档案ID、预警名称、设备名称、预警时间和预警等级必须提供'))
    }

    console.log('添加预警记录:', recordData)

    try {
      const response = await authAxios.post('/api/v1/alert-archives/alerts', recordData)
      console.log('添加预警记录成功:', response.data)
      return response
    } catch (error) {
      console.error('添加预警记录失败:', error)
      throw error
    }
  }

  /**
   * 获取预警记录详情
   * @param recordId 记录ID
   */
  async getAlertRecordDetail(recordId: number): Promise<AxiosResponse<UnifiedResponse<AlertRecord>>> {
    if (!recordId) {
      console.error('获取预警记录详情失败: 缺少记录ID')
      return Promise.reject(new Error('缺少记录ID'))
    }

    console.log('获取预警记录详情:', recordId)

    try {
      const response = await authAxios.get(`/api/v1/alert-archives/alerts/${recordId}`)
      console.log('获取预警记录详情成功:', response.data)
      return response
    } catch (error) {
      console.error('获取预警记录详情失败:', error)
      throw error
    }
  }

  /**
   * 更新预警记录
   * @param recordId 记录ID
   * @param recordData 记录数据
   */
  async updateAlertRecord(recordId: number, recordData: Partial<AlertRecord>): Promise<AxiosResponse<UnifiedResponse<AlertRecord>>> {
    if (!recordId) {
      console.error('更新预警记录失败: 缺少记录ID')
      return Promise.reject(new Error('缺少记录ID'))
    }

    console.log('更新预警记录:', recordId, recordData)

    try {
      const response = await authAxios.put(`/api/v1/alert-archives/alerts/${recordId}`, recordData)
      console.log('更新预警记录成功:', response.data)
      return response
    } catch (error) {
      console.error('更新预警记录失败:', error)
      throw error
    }
  }

  /**
   * 删除预警记录
   * @param recordId 记录ID
   * @param archiveId 档案ID（可选）
   */
  async deleteAlertRecord(recordId: number, archiveId?: number | null): Promise<AxiosResponse> {
    if (!recordId) {
      console.error('删除预警记录失败: 缺少记录ID')
      return Promise.reject(new Error('缺少记录ID'))
    }

    console.log('删除预警记录:', recordId, '档案ID:', archiveId)

    let url = `/api/v1/alert-archives/alerts/${recordId}`
    if (archiveId) {
      url += `?archive_id=${archiveId}`
    }

    try {
      const response = await authAxios.delete(url)
      console.log('删除预警记录成功:', response.data)
      return response
    } catch (error) {
      console.error('删除预警记录失败:', error)
      throw error
    }
  }

  /**
   * 批量删除预警记录
   * @param recordIds 记录ID数组
   */
  async batchDeleteAlertRecords(recordIds: number[]): Promise<AxiosResponse> {
    if (!recordIds || !Array.isArray(recordIds) || recordIds.length === 0) {
      console.error('批量删除预警记录失败: 缺少记录ID数组')
      return Promise.reject(new Error('缺少记录ID数组'))
    }

    console.log('批量删除预警记录:', recordIds)

    try {
      const response = await authAxios.post('/api/v1/alert-archives/alerts/batch-delete', {
        record_ids: recordIds
      })
      console.log('批量删除预警记录成功:', response.data)
      return response
    } catch (error) {
      console.error('批量删除预警记录失败:', error)
      throw error
    }
  }

  /**
   * 上传档案图片
   * @param archiveId 档案ID
   * @param imageFile 图片文件
   */
  async uploadArchiveImage(archiveId: number, imageFile: File): Promise<AxiosResponse> {
    if (!archiveId || !imageFile) {
      console.error('上传档案图片失败: 缺少必要参数')
      return Promise.reject(new Error('缺少档案ID或图片文件'))
    }

    console.log('准备上传档案图片:', archiveId, imageFile.name, imageFile.type, imageFile.size)

    const formData = new FormData()
    formData.append('image', imageFile)

    const config = {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent: any) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        console.log('档案图片上传进度:', percentCompleted + '%')
      }
    }

    try {
      const response = await authAxios.post(`/api/v1/alert-archives/${archiveId}/upload/image`, formData, config)
      console.log('档案图片上传成功:', response.data)
      return response
    } catch (error) {
      console.error('档案图片上传失败:', error)
      throw error
    }
  }

  /**
   * 上传预警记录图片
   * @param recordId 记录ID
   * @param imageFile 图片文件
   */
  async uploadRecordImage(recordId: number, imageFile: File): Promise<AxiosResponse> {
    if (!recordId || !imageFile) {
      console.error('上传预警记录图片失败: 缺少必要参数')
      return Promise.reject(new Error('缺少记录ID或图片文件'))
    }

    console.log('准备上传预警记录图片:', recordId, imageFile.name, imageFile.type, imageFile.size)

    const formData = new FormData()
    formData.append('image', imageFile)

    const config = {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent: any) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        console.log('预警记录图片上传进度:', percentCompleted + '%')
      }
    }

    try {
      const response = await authAxios.post(`/api/v1/alert-archives/alerts/${recordId}/upload/image`, formData, config)
      console.log('预警记录图片上传成功:', response.data)
      return response
    } catch (error) {
      console.error('预警记录图片上传失败:', error)
      throw error
    }
  }

  /**
   * 上传预警记录视频
   * @param recordId 记录ID
   * @param videoFile 视频文件
   */
  async uploadRecordVideo(recordId: number, videoFile: File): Promise<AxiosResponse> {
    if (!recordId || !videoFile) {
      console.error('上传预警记录视频失败: 缺少必要参数')
      return Promise.reject(new Error('缺少记录ID或视频文件'))
    }

    console.log('准备上传预警记录视频:', recordId, videoFile.name, videoFile.type, videoFile.size)

    const formData = new FormData()
    formData.append('video', videoFile)

    const config = {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent: any) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        console.log('预警记录视频上传进度:', percentCompleted + '%')
      }
    }

    try {
      const response = await authAxios.post(`/api/v1/alert-archives/alerts/${recordId}/upload/video`, formData, config)
      console.log('预警记录视频上传成功:', response.data)
      return response
    } catch (error) {
      console.error('预警记录视频上传失败:', error)
      throw error
    }
  }
}

// 导出单例实例
export default new ArchiveAPI()
