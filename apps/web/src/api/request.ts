import axios, { type AxiosRequestConfig } from 'axios';
import antdStatic from '../utils/antdStatic';
import { buildLoginRedirectUrl } from '../utils/auth-redirect';

declare module 'axios' {
  interface AxiosRequestConfig {
    suppressErrorToast?: boolean;
    suppressAuthRedirect?: boolean;
  }
}

const request = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

// 请求拦截器：自动附加 Authorization token
request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// 响应拦截器：提取 data 字段 + 统一错误处理
request.interceptors.response.use(
  (response) => response.data.data,
  (error) => {
    const config = error.config as
      | (AxiosRequestConfig & {
          suppressErrorToast?: boolean;
          suppressAuthRedirect?: boolean;
        })
      | undefined;
    const suppressAuthRedirect = config?.suppressAuthRedirect === true;
    const suppressErrorToast = config?.suppressErrorToast === true;

    if (
      error.response?.status === 401 &&
      !config?.url?.includes('/auth/login') &&
      !suppressAuthRedirect
    ) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = buildLoginRedirectUrl();
    } else if (!suppressErrorToast) {
      const rawMsg = error.response?.data?.message;
      const msg = Array.isArray(rawMsg) ? rawMsg.join('；') : (rawMsg ?? '操作失败');
      antdStatic.message?.error(msg);
    }
    return Promise.reject(error.response?.data);
  },
);

export default request;
