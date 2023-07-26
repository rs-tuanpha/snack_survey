import { ETopicRequireField } from "@/core/constants/enum"
import type { ITopic } from "@/core/interfaces/model/topic"
import { REG_URL_FORMAT } from "@/core/utils/regexValidate"

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
  (value: string) => {
    if (value === '' || !REG_URL_FORMAT.test(value)) {
      return 'Vui lòng nhập link hợp lệ'
    }
    return true
  }
]
// handle validate add option
export const handleValidateAddOption = (option: {link: string, title: string}, topic: ITopic) => {
  if (topic.requireField === ETopicRequireField.LINK) {
    return linkRules[0](option.link)
  }
  if (topic.requireField === ETopicRequireField.TITLE) {
    return titleRules[0](option.title)
  }
  return linkRules[0](option.link) === true && titleRules[0](option.title) === true
}

export const checkTitleRequired = (topic: ITopic) => {
  return topic.requireField === ETopicRequireField.ALL || topic.requireField === ETopicRequireField.TITLE
}

export const checkLinkRequired = (topic: ITopic) => {
  return topic.requireField === ETopicRequireField.ALL || topic.requireField === ETopicRequireField.LINK
}