/**
 * 缓存管理Store模块
 * 提供手动缓存管理功能，替代全局拦截请求的缓存机制
 */

const cacheModule = {
  namespaced: true,

  state: {
    // 缓存数据存储
    cacheData: {},
    // 缓存元数据（如过期时间等）
    cacheMeta: {}
  },

  mutations: {
    /**
     * 设置缓存项
     */
    SET_CACHE_ITEM(state, { key, value, ttl = 600000 }) { // 默认10分钟过期
      state.cacheData[key] = value;
      state.cacheMeta[key] = {
        timestamp: Date.now(),
        ttl
      };
    },

    /**
     * 删除缓存项
     */
    REMOVE_CACHE_ITEM(state, key) {
      delete state.cacheData[key];
      delete state.cacheMeta[key];
    },

    /**
     * 清空所有缓存
     */
    CLEAR_ALL_CACHE(state) {
      state.cacheData = {};
      state.cacheMeta = {};
    },

    /**
     * 清理过期缓存
     */
    CLEAN_EXPIRED_CACHE(state) {
      const now = Date.now();
      Object.keys(state.cacheMeta).forEach(key => {
        const meta = state.cacheMeta[key];
        if (now - meta.timestamp > meta.ttl) {
          delete state.cacheData[key];
          delete state.cacheMeta[key];
        }
      });
    }
  },

  actions: {
    /**
     * 设置缓存项
     */
    setCacheItem({ commit }, { key, value, ttl }) {
      commit('SET_CACHE_ITEM', { key, value, ttl });
    },

    /**
     * 获取缓存项
     */
    getCacheItem({ state }, key) {
      // 检查是否存在且未过期
      const meta = state.cacheMeta[key];
      if (meta) {
        const now = Date.now();
        if (now - meta.timestamp <= meta.ttl) {
          return state.cacheData[key];
        } else {
          // 过期，删除该项
          this.commit('cache/REMOVE_CACHE_ITEM', key);
        }
      }
      return null;
    },

    /**
     * 删除缓存项
     */
    removeCacheItem({ commit }, key) {
      commit('REMOVE_CACHE_ITEM', key);
    },

    /**
     * 清空所有缓存
     */
    clearAllCache({ commit }) {
      commit('CLEAR_ALL_CACHE');
    },

    /**
     * 清理过期缓存
     */
    cleanExpiredCache({ commit }) {
      commit('CLEAN_EXPIRED_CACHE');
    }
  },

  getters: {
    /**
     * 获取缓存项的getter
     */
    getCachedData: (state) => (key) => {
      // 检查是否存在且未过期
      const meta = state.cacheMeta[key];
      if (meta) {
        const now = Date.now();
        if (now - meta.timestamp <= meta.ttl) {
          return state.cacheData[key];
        } else {
          // 过期，返回null（但不自动删除，留给清理任务处理）
          return null;
        }
      }
      return null;
    },

    /**
     * 检查缓存是否存在且未过期
     */
    hasValidCache: (state) => (key) => {
      const meta = state.cacheMeta[key];
      if (meta) {
        const now = Date.now();
        return (now - meta.timestamp <= meta.ttl);
      }
      return false;
    }
  }
};

export default cacheModule;