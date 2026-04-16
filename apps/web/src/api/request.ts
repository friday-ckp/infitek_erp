import axios from 'axios';

// axios 实例占位
// 拦截器在 Story 1.2/1.5 中补全
const request = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

// 请求拦截器（Story 1.5 补全）
request.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error),
);

// 响应拦截器（Story 1.5 补全）
request.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error),
);

export default request;
