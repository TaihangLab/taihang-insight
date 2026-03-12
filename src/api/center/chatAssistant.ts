import { authAxios, type PageParams } from '@/api/commons'
import type { ChatMessage, ChatChunk, ChatStreamOptions } from '@/types/center.d'
import { normalizePageParams } from '@/api/utils/pageUtils'

/**
 * Chat Assistant API
 *
 * 智能助手相关API接口
 */
const chatAssistantAPI = {
  /**
   * 创建流式聊天连接
   * @param chatData 聊天数据
   * @param options 流式选项（包含取消信号）
   * @returns 异步迭代器，用于遍历聊天数据块
   *
   * @example
   * ```typescript
   * const abortController = new AbortController()
   * try {
   *   for await (const chunk of chatAssistantAPI.createChatStream(data, { signal: abortController.signal })) {
   *     console.log(chunk.content)
   *     if (chunk.done) break
   *   }
   * } catch (error) {
   *   console.error('聊天失败:', error)
   * }
   * ```
   */
  async *createChatStream(
    chatData: ChatMessage,
    options?: ChatStreamOptions
  ): AsyncIterable<ChatChunk> {
    const abortController = new AbortController()

    // 支持外部传入的取消信号
    if (options?.signal) {
      options.signal.addEventListener('abort', () => abortController.abort())
    }

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
    const response = await fetch(`${baseURL}/api/v1/chat/chat`, {
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

    try {
      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          // 流结束，yield 最后一个数据块
          yield {
            content: '',
            fullResponse,
            conversationId,
            done: true
          }
          return
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
              yield {
                content: '',
                fullResponse,
                conversationId,
                done: true
              }
              return
            }

            try {
              const parsed = JSON.parse(data)

              // 提取会话ID（如果存在）
              if (parsed.conversation_id && !conversationId) {
                conversationId = parsed.conversation_id
              }

              // 提取消息内容
              if (parsed.choices && parsed.choices[0] && parsed.choices[0].delta && parsed.choices[0].delta.content) {
                const content = parsed.choices[0].delta.content
                fullResponse += content

                yield {
                  content,
                  fullResponse,
                  conversationId,
                  done: false
                }
              }
            } catch {
              // JSON解析错误，忽略
            }
          }
        }
      }
    } finally {
      reader.cancel()
    }
  },

  /**
   * 获取会话列表
   * @param params 查询参数
   * @returns axios响应
   */
  getChatConversations(params: PageParams = {}) {
    return authAxios.get('/api/v1/chat/conversations', {
      params: normalizePageParams(params)
    })
  },

  /**
   * 获取会话消息
   * @param conversationId 会话ID
   * @param params 查询参数
   * @returns axios响应
   */
  getChatMessages(conversationId: string, params: PageParams = {}) {
    const normalized = normalizePageParams(params)
    return authAxios.get(`/api/v1/chat/conversations/${conversationId}/messages`, {
      params: {
        ...normalized,
        limit: normalized.limit * 2  // 消息列表默认显示更多
      }
    })
  },

  /**
   * 删除会话
   * @param conversationId 会话ID
   * @returns axios响应
   */
  deleteChatConversation(conversationId: string) {
    return authAxios.delete(`/api/v1/chat/conversations/${conversationId}`)
  },

  /**
   * 自动生成对话标题
   * @param conversationId 会话ID
   * @returns Promise
   */
  autoGenerateTitle(conversationId: string) {
    return authAxios.post(`/api/v1/chat/conversations/${conversationId}/auto-title`)
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
    return authAxios.put(`/api/v1/chat/conversations/${conversationId}/title`, formData)
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
    return authAxios.put(`/api/v1/chat/conversations/${conversationId}/group`, formData)
  },

  /**
   * 停止生成并保存部分内容（模仿Cursor的停止机制）
   * @param conversationId 会话ID
   * @param messageId 助手消息ID
   * @param partialContent 已生成的部分内容
   * @returns Promise
   */
  stopGeneration(conversationId: string, messageId: string, partialContent = '') {
    const formData = new FormData()
    formData.append('message_id', messageId)
    formData.append('partial_content', partialContent)
    return authAxios.post(`/api/v1/chat/conversations/${conversationId}/stop-generation`, formData)
  },

  /**
   * 创建分组
   * @param name 分组名称
   * @returns Promise
   */
  createGroup(name: string) {
    const formData = new FormData()
    formData.append('name', name)
    return authAxios.post('/api/v1/chat/groups', formData)
  },

  /**
   * 获取分组列表
   * @returns Promise
   */
  getGroups() {
    return authAxios.get('/api/v1/chat/groups')
  },

  /**
   * 删除分组
   * @param groupId 分组ID
   * @returns Promise
   */
  deleteGroup(groupId: string) {
    return authAxios.delete(`/api/v1/chat/groups/${groupId}`)
  }
}

export default chatAssistantAPI
