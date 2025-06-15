import { ENV_CONFIG } from '@/core/constants/app'
import { EStatusCode } from '@/core/constants/enum'
import axios, { type AxiosRequestConfig } from 'axios'
import Cookies from 'js-cookie'

const instance = axios.create({
  baseURL: ENV_CONFIG.API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

instance.interceptors.request.use(
  async (config: any) => {
    const token = Cookies.get('auth_token')
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

instance.interceptors.response.use(
  (response) => {
    const statusCode = response?.data?.status_code

    switch (statusCode) {
      case EStatusCode.BAD_REQUEST:
        return
      case EStatusCode.NOT_FOUND:
        return

      case EStatusCode.INTERNAL_SERVER_ERROR:
        return

      default:
      // return
    }

    return response.data
  },
  (error) => {
    return Promise.reject(error)
  }
)

const api = {
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    return instance<T>(url, { method: 'get', url, ...config }).then((response) => response as T)
  },
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    return instance<T>(url, { method: 'post', url, data, ...config }).then(
      (response) => response as T
    )
  }
}

export default api
