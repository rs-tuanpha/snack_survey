import { ref, readonly, type Ref } from 'vue'
import type { ApiError } from '@/types/error'

// ============================================================================
// ERROR HANDLING SERVICE
// ============================================================================

export function useErrorHandler() {
  const error: Ref<string | null> = ref(null)
  const loading: Ref<boolean> = ref(false)

  /**
   * Handle API error and set user-friendly message
   */
  const handleError = (err: any) => {
    console.error('API Error:', err)

    if (err?.message) {
      error.value = err.message
    } else if (typeof err === 'string') {
      error.value = err
    } else {
      error.value = 'Đã xảy ra lỗi không xác định'
    }
  }

  /**
   * Clear error message
   */
  const clearError = () => {
    error.value = null
  }

  /**
   * Execute async function with error handling
   */
  const executeWithErrorHandling = async <T>(
    asyncFn: () => Promise<T>,
    options?: {
      onSuccess?: (result: T) => void
      onError?: (error: ApiError) => void
      clearErrorOnStart?: boolean
    }
  ): Promise<T | null> => {
    try {
      if (options?.clearErrorOnStart !== false) {
        clearError()
      }
      loading.value = true

      const result = await asyncFn()

      if (options?.onSuccess) {
        options.onSuccess(result)
      }

      return result
    } catch (err) {
      handleError(err)

      if (options?.onError) {
        options.onError(err as ApiError)
      }

      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Show error message with auto-clear
   */
  const showError = (message: string, autoClearMs = 5000) => {
    error.value = message

    if (autoClearMs > 0) {
      setTimeout(() => {
        clearError()
      }, autoClearMs)
    }
  }

  /**
   * Check if error is a specific type
   */
  const isErrorType = (err: any, code: number): boolean => {
    return err?.code === code
  }

  /**
   * Get error message for specific error code
   */
  const getErrorMessage = (code: number): string => {
    const errorMessages: Record<number, string> = {
      400: 'Dữ liệu không hợp lệ',
      401: 'Bạn cần đăng nhập để tiếp tục',
      403: 'Bạn không có quyền thực hiện hành động này',
      404: 'Không tìm thấy dữ liệu',
      409: 'Dữ liệu đã tồn tại',
      422: 'Dữ liệu không hợp lệ',
      500: 'Lỗi máy chủ, vui lòng thử lại sau',
      502: 'Lỗi kết nối máy chủ',
      503: 'Dịch vụ tạm thời không khả dụng',
      504: 'Hết thời gian chờ phản hồi từ máy chủ'
    }

    return errorMessages[code] || 'Đã xảy ra lỗi không xác định'
  }

  return {
    error: readonly(error),
    loading: readonly(loading),
    handleError,
    clearError,
    executeWithErrorHandling,
    showError,
    isErrorType,
    getErrorMessage
  }
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
  useErrorHandler
}
