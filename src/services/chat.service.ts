/**
 * 聊天助手服务
 */

import axiosInstance from './config/axios'
import type {
  ApiResponse,
  ChatMessage,
  ChatConversation,
  ChatRequest,
  ChatResponse,
  ConversationListParams
} from './types'

export class ChatService {
  private readonly basePath = '/api/v1/chat'

  /**
   * 发送聊天消息（流式响应）
   */
  async sendChatMessage(
    chatData: ChatRequest,
    onChunk: (chunk: string) => void,
    onError?: (error: Error) => void
  ): Promise<void> {
    const response = await fetch(`${axiosInstance.defaults.baseURL}${this.basePath}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(chatData)
    })

    if (!response.ok) {
      const error = await response.text()
      onError?.(new Error(error))
      return
    }

    const reader = response.body?.getReader()
    if (!reader) {
      onError?.(new Error('无法读取响应流'))
      return
    }

    const decoder = new TextDecoder()

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.substring(6)
            if (data === '[DONE]') continue

            try {
              const parsed = JSON.parse(data)
              const content = parsed.choices?.[0]?.delta?.content
              if (content) {
                onChunk(content)
              }
            } catch (e) {
              console.error('解析流式数据失败:', e)
            }
          }
        }
      }
    } catch (error) {
      onError?.(error as Error)
    }
  }

  /**
   * 获取会话列表
   */
  async getChatConversations(params?: ConversationListParams): Promise<ApiResponse<ChatConversation[]>> {
    const response = await axiosInstance.get<any, ApiResponse<ChatConversation[]>>(
      `${this.basePath}/conversations`,
      { params }
    )
    return response
  }

  /**
   * 获取会话消息
   */
  async getChatMessages(conversationId: string, params?: { limit?: number }): Promise<ApiResponse<ChatMessage[]>> {
    const response = await axiosInstance.get<any, ApiResponse<ChatMessage[]>>(
      `${this.basePath}/conversations/${conversationId}/messages`,
      { params }
    )
    return response
  }

  /**
   * 删除会话
   */
  async deleteChatConversation(conversationId: string): Promise<ApiResponse<{ message: string }>> {
    const response = await axiosInstance.delete<any, ApiResponse<{ message: string }>>(
      `${this.basePath}/conversations/${conversationId}`
    )
    return response
  }

  /**
   * 清空所有会话
   */
  async clearAllChatConversations(): Promise<ApiResponse<{ message: string }>> {
    const response = await axiosInstance.delete<any, ApiResponse<{ message: string }>>(
      `${this.basePath}/conversations`
    )
    return response
  }

  /**
   * 快速聊天（无会话历史）
   */
  async quickChat(
    message: string,
    stream: boolean = false,
    systemPrompt?: string,
    onChunk?: (chunk: string) => void
  ): Promise<ApiResponse<{ message: string; conversation_id: string }>> {
    const formData = new FormData()
    formData.append('message', message)
    formData.append('stream', stream.toString())
    if (systemPrompt) {
      formData.append('system_prompt', systemPrompt)
    }

    if (stream && onChunk) {
      // 流式响应
      const response = await fetch(`${axiosInstance.defaults.baseURL}${this.basePath}/quick`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      })

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.substring(6)
              if (data === '[DONE]') continue

              try {
                const parsed = JSON.parse(data)
                const content = parsed.choices?.[0]?.delta?.content
                if (content) {
                  onChunk(content)
                }
              } catch (e) {
                console.error('解析流式数据失败:', e)
              }
            }
          }
        }
      }

      return { message: '', conversation_id: '' } as any
    } else {
      // 非流式响应
      const response = await axiosInstance.post<any, ApiResponse<{ message: string; conversation_id: string }>>(
        `${this.basePath}/quick`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      )
      return response
    }
  }

  /**
   * 获取可用模型列表
   */
  async getChatModels(): Promise<ApiResponse<{ object: string; data: any[] }>> {
    const response = await axiosInstance.get<any, ApiResponse<{ object: string; data: any[] }>>(
      `${this.basePath}/models`
    )
    return response
  }

  /**
   * 检查聊天服务健康状态
   */
  async checkChatHealth(): Promise<ApiResponse<{
    status: string
    llm_service: boolean
    redis_service: boolean
    model: string
    provider: string
  }>> {
    const response = await axiosInstance.get<any, ApiResponse<{
      status: string
      llm_service: boolean
      redis_service: boolean
      model: string
      provider: string
    }>>(`${this.basePath}/health`)
    return response
  }

  /**
   * 创建分组
   */
  async createGroup(name: string): Promise<ApiResponse<{ group_id: string }>> {
    const formData = new FormData()
    formData.append('name', name)

    const response = await axiosInstance.post<any, ApiResponse<{ group_id: string }>>(
      `${this.basePath}/groups`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' }
      }
    )
    return response
  }

  /**
   * 获取分组列表
   */
  async getGroups(): Promise<ApiResponse<any[]>> {
    const response = await axiosInstance.get<any, ApiResponse<any[]>>(`${this.basePath}/groups`)
    return response
  }

  /**
   * 删除分组
   */
  async deleteGroup(groupId: string): Promise<ApiResponse<{ message: string }>> {
    const response = await axiosInstance.delete<any, ApiResponse<{ message: string }>>(
      `${this.basePath}/groups/${groupId}`
    )
    return response
  }

  /**
   * 更新会话分组
   */
  async updateConversationGroup(conversationId: string, groupId: string | null): Promise<ApiResponse<{ message: string }>> {
    const formData = new FormData()
    if (groupId) {
      formData.append('group_id', groupId)
    }

    const response = await axiosInstance.put<any, ApiResponse<{ message: string }>>(
      `${this.basePath}/conversations/${conversationId}/group`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' }
      }
    )
    return response
  }

  /**
   * 获取分组内的对话列表
   */
  async getGroupConversations(groupId: string, params?: { limit?: number }): Promise<ApiResponse<any[]>> {
    const response = await axiosInstance.get<any, ApiResponse<any[]>>(
      `${this.basePath}/groups/${groupId}/conversations`,
      { params }
    )
    return response
  }

  /**
   * 自动生成会话标题
   */
  async autoGenerateTitle(conversationId: string): Promise<ApiResponse<{ title: string }>> {
    const response = await axiosInstance.post<any, ApiResponse<{ title: string }>>(
      `${this.basePath}/conversations/${conversationId}/auto-title`
    )
    return response
  }

  /**
   * 更新会话标题
   */
  async updateConversationTitle(conversationId: string, title: string): Promise<ApiResponse<{ title: string }>> {
    const formData = new FormData()
    formData.append('title', title)

    const response = await axiosInstance.put<any, ApiResponse<{ title: string }>>(
      `${this.basePath}/conversations/${conversationId}/title`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' }
      }
    )
    return response
  }

  /**
   * 保存消息到会话
   */
  async saveMessageToConversation(
    conversationId: string,
    role: 'user' | 'assistant' | 'system',
    content: string,
    messageId?: string
  ): Promise<ApiResponse<{ saved_at: string }>> {
    const formData = new FormData()
    formData.append('role', role)
    formData.append('content', content)
    if (messageId) {
      formData.append('message_id', messageId)
    }

    const response = await axiosInstance.post<any, ApiResponse<{ saved_at: string }>>(
      `${this.basePath}/conversations/${conversationId}/save-message`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' }
      }
    )
    return response
  }

  /**
   * 停止生成
   */
  async stopGeneration(conversationId: string, messageId: string, partialContent: string): Promise<ApiResponse<any>> {
    const formData = new FormData()
    formData.append('message_id', messageId)
    formData.append('partial_content', partialContent)

    const response = await axiosInstance.post<any, ApiResponse<any>>(
      `${this.basePath}/conversations/${conversationId}/stop-generation`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' }
      }
    )
    return response
  }
}

// 导出单例
export default new ChatService()
