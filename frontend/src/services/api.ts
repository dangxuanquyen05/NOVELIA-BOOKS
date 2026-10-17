import axios, { AxiosError } from 'axios';
import type { ApiResponse, SystemHealthData } from '../types/api';
import type { AuthResponse, LoginFormData, RegisterFormData, User } from '../types/auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 10000,
});

// Interceptor cho Request: đính kèm JWT Bearer token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('novelia_access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor cho Response: log & handle lỗi tập trung
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string }>) => {
    if (error.response?.status === 401) {
      // Khi token hết hạn hoặc không hợp lệ, xóa token khỏi storage
      localStorage.removeItem('novelia_access_token');
      localStorage.removeItem('novelia_user');
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (credentials: LoginFormData): Promise<ApiResponse<AuthResponse>> => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
    return response.data;
  },

  register: async (data: Omit<RegisterFormData, 'confirmPassword'>): Promise<ApiResponse<AuthResponse>> => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/register', data);
    return response.data;
  },

  getMe: async (): Promise<ApiResponse<User>> => {
    const response = await apiClient.get<ApiResponse<User>>('/auth/me');
    return response.data;
  },
};

export const adminService = {
  getDashboardStats: async (): Promise<ApiResponse<Record<string, unknown>>> => {
    const response = await apiClient.get<ApiResponse<Record<string, unknown>>>('/admin/dashboard-stats');
    return response.data;
  },
};

export const systemService = {
  checkHealth: async (): Promise<ApiResponse<SystemHealthData>> => {
    const response = await apiClient.get<ApiResponse<SystemHealthData>>('/health');
    return response.data;
  },
};
