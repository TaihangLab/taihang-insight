/**
 * Axios 实例配置
 * 使用 Vite 环境变量配置 base URL
 */

import axios, { AxiosInstance, AxiosError, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import router from "@/router";

// 从环境变量获取 API 基础 URL
// 开发环境使用代理，不需要完整 URL
const getBaseURL = (): string => {
  // 在开发环境中，使用代理，所以 baseURL 为空
  // 代理配置在 vite.config.ts 中
  return import.meta.env.MODE === "development" ? "" : import.meta.env.VITE_API_BASE_URL || "";
};

// 创建 axios 实例
const axiosInstance: AxiosInstance = axios.create({
  baseURL: getBaseURL(),
  timeout: 15000,
  withCredentials: false, // 避免 CORS 错误
  headers: {
    "Content-Type": "application/json",
  },
});

// 请求拦截器 - 添加 token
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 直接从 localStorage 获取 Admin-Token
    const token = localStorage.getItem("Admin-Token");

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  },
);

// 响应拦截器 - 统一处理响应和错误
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    const originalData = response.data as Record<string, unknown>;

    // 处理 code 格式的响应
    // 后端统一使用 code: 0 表示成功
    if (originalData && typeof originalData.code !== "undefined") {
      if (originalData.code === 0) {
        return response.data;
      }
      return Promise.reject(new Error(String(originalData.message || "请求失败")));
    }

    // 处理 success 格式的响应
    if (originalData && typeof originalData.success !== "undefined") {
      return response.data;
    }

    // 直接返回原始数据
    return response.data;
  },
  (error: AxiosError) => {
    // 处理 401 未授权错误
    if (error.response && error.response.status === 401) {
      // 清除 Admin-Token
      localStorage.removeItem("Admin-Token");

      // 使用 router 跳转到登录页
      router.push("/login");
      return Promise.reject(new Error("未授权，请重新登录"));
    }

    // 返回错误信息
    const errorData: unknown = error.response?.data;
    const errorMessage: string =
      (errorData as { detail?: string; message?: string })?.detail ||
      (errorData as { detail?: string; message?: string })?.message ||
      error.message ||
      "请求失败";

    return Promise.reject(new Error(errorMessage));
  },
);

// 自定义参数序列化函数
const paramsSerializer = (params: Record<string, unknown>): string => {
  const queryParams: string[] = [];

  for (const key in params) {
    if (params[key] !== undefined) {
      if (Array.isArray(params[key])) {
        // 对于数组参数，使用重复的键名传递每个值
        params[key].forEach((value: unknown) => {
          queryParams.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
        });
      } else {
        queryParams.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(params[key]))}`);
      }
    }
  }

  return queryParams.join("&");
};

// 配置参数序列化
axiosInstance.defaults.paramsSerializer = paramsSerializer;

export default axiosInstance;

// 导出 base URL 供其他地方使用（如 SSE 连接）
export const getApiBaseURL = (): string => {
  return import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
};
