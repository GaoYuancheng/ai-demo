import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { Result } from '@/types';

const request = axios.create({
  baseURL: '/api/v1',
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

request.interceptors.response.use(
  (response) => {
    const result = response.data as Result<unknown>;
    if (result.code !== 200) {
      return Promise.reject(new Error(result.message || '请求失败'));
    }
    return response;
  },
  (error: AxiosError<Result<unknown>>) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    const message = error.response?.data?.message || error.message || '网络错误';
    return Promise.reject(new Error(message));
  }
);

export default request;
