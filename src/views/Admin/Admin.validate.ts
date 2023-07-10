// Admin Forms validate rules
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
