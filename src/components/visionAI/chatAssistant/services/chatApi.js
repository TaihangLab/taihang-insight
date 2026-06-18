import axios from 'axios';
const config = require('../../../../../config/index.js');

const chatAxios = axios.create({
  baseURL: config.API_BASE_URL,
  timeout: 15000,
});

chatAxios.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers['access-token'] = token;
  return cfg;
});

export default {
  healthCheck() {
    return chatAxios.get('/api/v1/chat/health', { timeout: 8000 });
  },

  getConversations(params = {}) {
    return chatAxios.get('/api/v1/chat/conversations', { params });
  },

  getMessages(conversationId) {
    return chatAxios.get(`/api/v1/chat/conversations/${conversationId}/messages`);
  },

  deleteConversation(conversationId) {
    return chatAxios.delete(`/api/v1/chat/conversations/${conversationId}`);
  },

  clearConversations() {
    return chatAxios.delete('/api/v1/chat/conversations');
  },

  createGroup(name) {
    const form = new FormData();
    form.append('name', name);
    return chatAxios.post('/api/v1/chat/groups', form);
  },

  getGroups() {
    return chatAxios.get('/api/v1/chat/groups');
  },

  deleteGroup(groupId) {
    return chatAxios.delete(`/api/v1/chat/groups/${groupId}`);
  },

  updateConversationGroup(conversationId, groupId) {
    return chatAxios.put(`/api/v1/chat/conversations/${conversationId}/group`, {
      group_id: groupId || null,
    });
  },

  autoGenerateTitle(conversationId) {
    return chatAxios.post(`/api/v1/chat/conversations/${conversationId}/title`, null, {
      timeout: 60000,
    });
  },

  updateConversationTitle(conversationId, title) {
    return chatAxios.put(`/api/v1/chat/conversations/${conversationId}/title`, { title });
  },

  stopGeneration(conversationId, messageId, partialContent) {
    return chatAxios.post(`/api/v1/chat/conversations/${conversationId}/stop`, {
      message_id: messageId,
      partial_content: partialContent,
    });
  },

  getBaseUrl() {
    return config.API_BASE_URL;
  },

  getToken() {
    return localStorage.getItem('token') || '';
  },
};
