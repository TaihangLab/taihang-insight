import { AxiosResponse } from 'axios'
import { authAxios,  type UnifiedResponse, PageParams } from '@/api/commons'
/**
 * Chat Assistant API
 *
 * 智能助手相关API接口
 */

/**
 * 聊天消息数据
 */
export interface ChatMessage {
  message: string
  conversation_id?: string | null
  system_prompt?: string | null
  stream?: boolean
  temperature?: number | null
  max_tokens?: number | null
  context_length?: number
  model?: string | null
}

/**
 * 会话消息
 */
export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  message_id?: string
  timestamp?: string
}

/**
 * 会话信息
 */
export interface Conversation {
  conversation_id: string
  title: string
  message_count: number
  last_message_time: string
  created_at: string
  group_id?: string | null
}

/**
 * 分组信息
 */
export interface Group {
  id: string
  name: string
  conversation_count: number
  created_at: string
  updated_at: string
}

/**
 * 流式回调函数类型
 */
export type StreamCallback = (chunk: string, fullResponse: string, conversationId: string) => void
export type StreamErrorCallback = (error: Error) => void
export type StreamCompleteCallback = (fullResponse: string, conversationId: string) => void

/**
 * 流式控制器
 */
export interface StreamController {
  close: () => void
}

/**
 * Chat Assistant API
 */
const chatAssistantAPI = {
  /**
   * 创建流式聊天连接
   * @param chatData 聊天数据
   * @param onMessage 接收消息回调
   * @param onError 错误回调
   * @param onComplete 完成回调
   * @returns 包含abort方法的控制器对象
   */
  async createChatStream(
    chatData: ChatMessage,
    onMessage: StreamCallback,
    onError: StreamErrorCallback,
    onComplete: StreamCompleteCallback
  ): Promise<StreamController> {
    try {
      console.log('创建流式聊天连接:', chatData)

      // 创建AbortController用于取消请求
      const abortController = new AbortController()

      // 构建JSON请求体
      const requestBody = {
        message: chatData.message,
        stream: true,
        system_prompt: chatData.system_prompt,
        conversation_id: chatData.conversation_id || null
      }

      // 获取baseURL
      const baseURL = authAxios.defaults.baseURL || ''

      // 发起POST请求
      const response = await fetch(`${baseURL}/api/chat/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/plain',
          // 添加认证头（如果有）
          ...(localStorage.getItem('token') && {
            'access-token': localStorage.getItem('token') || ''
          })
        },
        body: JSON.stringify(requestBody),
        signal: abortController.signal
      })

      if (!response.ok) {
        throw new Error(`HTTP错误! 状态: ${response.status}`)
      }

      // 获取流式读取器
      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('无法获取响应流')
      }

      const decoder = new TextDecoder()
      let fullResponse = ''
      let buffer = ''

      // 用于存储会话ID的变量
      let conversationId = chatData.conversation_id || ''

      // 创建返回的控制器对象
      const controller: StreamController = {
        close: () => {
          abortController.abort()
          reader.cancel()
        }
      }

      // 开始读取流式数据
      const readStream = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read()

            if (done) {
              if (onComplete) onComplete(fullResponse, conversationId)
              break
            }

            // 解码数据块
            const chunk = decoder.decode(value, { stream: true })
            buffer += chunk

            // 处理完整的数据行
            const lines = buffer.split('\n')
            buffer = lines.pop() || '' // 保留最后不完整的行

            for (const line of lines) {
              if (line.trim() === '') continue

              if (line.startsWith('data: ')) {
                const data = line.slice(6) // 去掉 "data: " 前缀

                if (data === '[DONE]') {
                  if (onComplete) onComplete(fullResponse, conversationId)
                  return
                }

                try {
                  const parsed = JSON.parse(data)

                  // 提取会话ID（如果存在）
                  if (parsed.conversation_id && !conversationId) {
                    conversationId = parsed.conversation_id
                    console.log('获取到新的会话ID:', conversationId)
                  }

                  // 提取消息内容
                  if (parsed.choices && parsed.choices[0] && parsed.choices[0].delta && parsed.choices[0].delta.content) {
                    const content = parsed.choices[0].delta.content
                    fullResponse += content
                    if (onMessage) onMessage(content, fullResponse, conversationId)
                  }
                } catch (parseError) {
                  console.error('解析JSON数据错误:', parseError, 'data:', data)
                }
              }
            }
          }
        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') {
            console.log('流式聊天请求被取消')
            return
          }
          console.error('读取流式数据错误:', error)
          if (onError) onError(error as Error)
        }
      }

      // 开始读取
      readStream()

      return controller

    } catch (error) {
      console.error('创建流式聊天连接失败:', error)
      if (onError) onError(error as Error)
      throw error
    }
  },

  /**
   * 获取会话列表
   * @param params 查询参数
   * @returns axios响应
   */
  getChatConversations(params: PageParams = {}) {
    return authAxios.get('/api/chat/conversations', {
      params: {
        limit: params.limit || 20
      }
    })
  },

  /**
   * 获取会话消息
   * @param conversationId 会话ID
   * @param params 查询参数
   * @returns axios响应
   */
  getChatMessages(conversationId: string, params: PageParams = {}) {
    console.log('获取会话消息:', conversationId, params)
    return authAxios.get(`/api/chat/conversations/${conversationId}/messages`, {
      params: {
        limit: params.limit || 50
      }
    })
  },

  /**
   * 删除会话
   * @param conversationId 会话ID
   * @returns axios响应
   */
  deleteChatConversation(conversationId: string) {
    console.log('删除会话:', conversationId)
    return authAxios.delete(`/api/chat/conversations/${conversationId}`)
  },

  /**
   * 自动生成对话标题
   * @param conversationId 会话ID
   * @returns Promise
   */
  autoGenerateTitle(conversationId: string) {
    return authAxios.post(`/api/chat/conversations/${conversationId}/auto-title`)
  },

  /**
   * 更新会话标题
   * @param conversationId 会话ID
   * @param title 新的标题
   * @returns Promise
   */
  updateConversationTitle(conversationId: string, title: string) {
    const formData = new FormData()
    formData.append('title', title)
    return authAxios.put(`/api/chat/conversations/${conversationId}/title`, formData)
  },

  /**
   * 更新会话分组
   * @param conversationId 会话ID
   * @param groupId 分组ID，null表示移动到无分组
   * @returns Promise
   */
  updateConversationGroup(conversationId: string, groupId: string | null) {
    const formData = new FormData()
    if (groupId) {
      formData.append('group_id', groupId)
    }
    return authAxios.put(`/api/chat/conversations/${conversationId}/group`, formData)
  },

  /**
   * 停止生成并保存部分内容（模仿Cursor的停止机制）
   * @param conversationId 会话ID
   * @param messageId 助手消息ID
   * @param partialContent 已生成的部分内容
   * @returns Promise
   */
  stopGeneration(conversationId: string, messageId: string, partialContent = '') {
    console.log('停止生成并保存:', conversationId, messageId, partialContent.length)
    const formData = new FormData()
    formData.append('message_id', messageId)
    formData.append('partial_content', partialContent)
    return authAxios.post(`/api/chat/conversations/${conversationId}/stop-generation`, formData)
  },

  /**
   * 创建分组
   * @param name 分组名称
   * @returns Promise
   */
  createGroup(name: string) {
    const formData = new FormData()
    formData.append('name', name)
    return authAxios.post('/api/chat/groups', formData)
  },

  /**
   * 获取分组列表
   * @returns Promise
   */
  getGroups() {
    return authAxios.get('/api/chat/groups')
  },

  /**
   * 删除分组
   * @param groupId 分组ID
   * @returns Promise
   */
  deleteGroup(groupId: string) {
    return authAxios.delete(`/api/chat/groups/${groupId}`)
  }
}

export default chatAssistantAPI
