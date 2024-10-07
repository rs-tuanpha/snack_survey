import { ETopicRequireField } from '@/core/constants/enum'
import type { ITopicCreateDto } from '@/core/interfaces/model/topic'
import { REG_URL_FORMAT } from '@/core/utils/regexValidate'

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
export const titleRules = [
  (value: string) => {
    if (value) return true
    return 'Vui lòng nhập tên option'
  }
]
// validate link rules
export const linkRules = [
  (value: string | null) => {
    if (!value || !REG_URL_FORMAT.test(value)) {
      return 'Vui lòng nhập link hợp lệ'
    }
    return true
  }
]
// handle validate add option
export const handleValidateAddOption = (
  option: { link: string | null; title: string },
  topic: ITopicCreateDto
) => {
  if (topic.required_field === ETopicRequireField.LINK) {
    return linkRules[0](option.link)
  }
  if (topic.required_field === ETopicRequireField.TITLE) {
    return titleRules[0](option.title)
  }
  return linkRules[0](option.link) === true && titleRules[0](option.title) === true
}

export const checkTitleRequired = (topic: ITopicCreateDto) => {
  return (
    topic.required_field === ETopicRequireField.ALL ||
    topic.required_field === ETopicRequireField.TITLE
  )
}

export const checkLinkRequired = (topic: ITopicCreateDto) => {
  return (
    topic.required_field === ETopicRequireField.ALL ||
    topic.required_field === ETopicRequireField.LINK
  )
}
