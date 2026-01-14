import rbacAxios from './base';

// sessionStorage 缓存配置
const TENANT_CACHE_KEY = 'rbac_tenants_cache';
const TENANT_CACHE_TIMESTAMP_KEY = 'rbac_tenants_cache_timestamp';
const CACHE_EXPIRY_MS = 30 * 60 * 1000; // 缓存过期时间：30分钟

class TenantService {
  /**
   * 从缓存获取租户列表
   * @returns {Object|null} 缓存的租户数据或null
   */
  static _getFromCache() {
    try {
      const cachedData = sessionStorage.getItem(TENANT_CACHE_KEY);
      const cachedTimestamp = sessionStorage.getItem(TENANT_CACHE_TIMESTAMP_KEY);

      if (!cachedData || !cachedTimestamp) {
        return null;
      }

      // 检查缓存是否过期
      const now = Date.now();
      if (now - parseInt(cachedTimestamp) > CACHE_EXPIRY_MS) {
        this._clearCache();
        return null;
      }

      return JSON.parse(cachedData);
    } catch (error) {
      console.warn('读取租户缓存失败:', error);
      return null;
    }
  }

  /**
   * 将租户列表存入缓存
   * @param {Object} data 租户数据
   */
  static _setCache(data) {
    try {
      sessionStorage.setItem(TENANT_CACHE_KEY, JSON.stringify(data));
      sessionStorage.setItem(TENANT_CACHE_TIMESTAMP_KEY, Date.now().toString());
    } catch (error) {
      console.warn('写入租户缓存失败:', error);
    }
  }

  /**
   * 清除租户缓存
   */
  static _clearCache() {
    try {
      sessionStorage.removeItem(TENANT_CACHE_KEY);
      sessionStorage.removeItem(TENANT_CACHE_TIMESTAMP_KEY);
    } catch (error) {
      console.warn('清除租户缓存失败:', error);
    }
  }

  /**
   * 获取租户列表（带缓存）
   * @param {Object} params 查询参数
   * @param {Boolean} forceRefresh 是否强制刷新缓存
   * @returns {Promise<Object>} 租户列表数据
   */
  static async getTenants(params = {}, forceRefresh = false) {
    try {
      // 如果没有查询参数（分页等），尝试从缓存获取
      const isEmptyParams = Object.keys(params).length === 0 ||
        (Object.keys(params).length === 2 && params.page && params.size);

      if (isEmptyParams && !forceRefresh) {
        const cachedData = this._getFromCache();
        if (cachedData) {
          console.log('[TenantService] 从缓存获取租户列表');
          return cachedData;
        }
      }

      // 从服务器获取数据
      console.log('[TenantService] 从服务器获取租户列表');
      const response = await rbacAxios.get('/api/v1/rbac/tenants', { params });

      // 如果是全量查询（没有特定过滤条件），则缓存结果
      if (isEmptyParams && response && response.success !== false) {
        this._setCache(response);
      }

      return response;
    } catch (error) {
      console.error('获取租户列表失败:', error);
      throw error;
    }
  }

  /**
   * 创建租户（创建成功后清除缓存）
   * @param {Object} tenantData 租户数据
   * @returns {Promise<Object>}
   */
  static async createTenant(tenantData) {
    try {
      const response = await rbacAxios.post('/api/v1/rbac/tenants', tenantData);
      // 创建成功后清除缓存
      this._clearCache();
      return response;
    } catch (error) {
      console.error('创建租户失败:', error);
      throw error;
    }
  }

  /**
   * 更新租户（更新成功后清除缓存）
   * @param {String} tenantCode 租户编码
   * @param {Object} tenantData 租户数据
   * @returns {Promise<Object>}
   */
  static async updateTenant(tenantCode, tenantData) {
    try {
      const response = await rbacAxios.put(`/api/v1/rbac/tenants/${tenantCode}`, tenantData);
      // 更新成功后清除缓存
      this._clearCache();
      return response;
    } catch (error) {
      console.error('更新租户失败:', error);
      throw error;
    }
  }

  /**
   * 删除租户（删除成功后清除缓存）
   * @param {String} tenantCode 租户编码
   * @returns {Promise<Object>}
   */
  static async deleteTenant(tenantCode) {
    try {
      const response = await rbacAxios.delete(`/api/v1/rbac/tenants/${tenantCode}`);
      // 删除成功后清除缓存
      this._clearCache();
      return response;
    } catch (error) {
      console.error('删除租户失败:', error);
      throw error;
    }
  }

  /**
   * 手动刷新租户缓存
   * @returns {Promise<Object>}
   */
  static async refreshCache() {
    return await this.getTenants({}, true);
  }
}

export default TenantService;