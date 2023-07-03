import { REG_URL_FORMAT } from '@/core/utils/regexValidate'

// Admin Forms validate rules
export const linkRules = [
  (value: string) => {
    if (value === '' || !REG_URL_FORMAT.test(value)) {
      return 'Vui lòng nhập link hợp lệ'
    }
    return true
  }
]
export const nameRules = [
  (value: string) => {
    if (value) return true
    return 'Vui lòng nhập tên topic'
  }
]
export const descriptionRules = [
  (value: string) => {
    if (value) return true
    return 'Vui lòng nhập mô tả'
  }
]
