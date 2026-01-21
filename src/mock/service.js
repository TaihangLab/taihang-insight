// Mock服务管理器
class MockService {
  constructor() {
    console.log('正在初始化Mock服务...');
    console.log("是否启用Mock服务： " + import.meta.env.VITE_MOCK_ENABLED);
    this.isEnabled = true
    this.mockData = {};
  }

  // 启用Mock服务
  enable() {
    this.isEnabled = true;
    console.log('Mock服务已启用');
  }

  // 禁用Mock服务
  disable() {
    this.isEnabled = false;
    console.log('Mock服务已禁用');
  }

  // 检查Mock服务是否启用
  isEnabled() {
    return this.isEnabled;
  }

  // 注册Mock数据
  registerData(key, data) {
    this.mockData[key] = data;
  }

  // 获取Mock数据
  getData(key) {
    if (!this.isEnabled) {
      return null;
    }
    return this.mockData[key] || null;
  }

  // 模拟API延迟
  async delay(ms = 1000) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 模拟API调用
  async mockApiCall(apiName, params = {}, delayMs = 1000) {
    if (!this.isEnabled) {
      return null;
    }

    await this.delay(delayMs);
    
    // 这里可以根据apiName返回相应的模拟数据
    const mockResponses = {
      // 示例API响应
      getTenants: {
        data: {
          items: [
            { tenant_id: 'TNT001', tenant_name: '测试租户1', company_name: '测试公司1' },
            { tenant_id: 'TNT002', tenant_name: '测试租户2', company_name: '测试公司2' }
          ],
          total: 2
        }
      }
    };

    return mockResponses[apiName] || { data: {} };
  }
}

// 创建全局实例
const mockService = new MockService();

export default mockService;