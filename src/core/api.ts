import axios, { HttpStatusCode, type AxiosError } from 'axios';
import { getCookieRaw, CookieKeys } from '@/core/utils/cookieUtils'

// Simple utilities for API use - using type-safe CookieKeys
const cookieUtils = {
  get: (key: keyof typeof CookieKeys): string | null => getCookieRaw(CookieKeys[key])
}

const localStorageUtils = {
  get: <T>(key: string, defaultValue: T): T => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch {
      return defaultValue
    }
  }
}
import { useAuthStore } from '@/stores/auth';
import { ERROR_MESSAGES, type ApiError } from '@/types/error';
import authService from '@/services/auth.service';

// Create structured error response
function createStructuredError(error: AxiosError): ApiError {
  const status = error.response?.status || 500;
  const responseData = error.response?.data as any;

  // Get user-friendly message
  let message = ERROR_MESSAGES[HttpStatusCode.InternalServerError]!;

  // Override with server message if available and more specific
  if (responseData?.message) {
    message = responseData.message;
  }

  // Handle validation errors
  if (status === 400 && responseData?.errors) {
    const validationErrors = Array.isArray(responseData.errors)
      ? responseData.errors.map((err: any) => err.message || err).join(', ')
      : responseData.errors;
    message = `Lỗi xác thực: ${validationErrors}`;
  }

  return {
    message,
    code: status,
    details: responseData?.errors || responseData,
    originalError: error
  };
}

const api = axios.create({
  baseURL: process.env.VUE_APP_API_BASE_URL || 'http://localhost:3000',
  headers: {
    'content-type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    // Priority order: AuthStore -> AuthStorage (cookies) -> LocalStorage (fallback)
    const authStore = useAuthStore();
    let token = authStore.accessToken;

    // If no token in store, try to get from cookies
    if (!token) {
      token = cookieUtils.get('ACCESS_TOKEN');
    }

    // If still no token, fallback to localStorage (for backward compatibility)
    if (!token) {
      token = localStorageUtils.get<string>('access_token', '') ||
              localStorageUtils.get<string>('jwt-token', '');
    }

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const authStore = useAuthStore();

    // Handle 401 Unauthorized - try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // Call refresh token API through auth service
        const refreshResponse = await authService.refreshToken();

        // Check if refresh was successful (has accessToken)
        if (refreshResponse.data.accessToken) {
          // Update auth store with new token
          authStore.updateAccessToken(refreshResponse.data.accessToken);

          // Update the original request with new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.accessToken}`;
          }

          // Retry the original request with new token
          return api(originalRequest);
        } else {
          // Refresh failed, clear auth state and redirect
          authStore.clearToken();
          window.location.href = '/snack_survey/#/login';
          return Promise.reject(new Error('Token refresh failed'));
        }
      } catch (refreshError) {
        // Refresh failed, clear auth state and redirect
        authStore.clearToken();
        window.location.href = '/snack_survey/#/login';
        return Promise.reject(refreshError);
      }
    }

    // Create structured error response
    const structuredError = createStructuredError(error);
    return Promise.reject(structuredError);
  }
);

// const apiWrapper = {
//   get: <T = any>(url: string, config?: AxiosRequestConfig) => api.get<T>(url, config),
//   post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => api.post<T>(url, data, config),
//   put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => api.put<T>(url, data, config),
//   delete: <T = any>(url: string, config?: AxiosRequestConfig) => api.delete<T>(url, config),
// };

export default api;
