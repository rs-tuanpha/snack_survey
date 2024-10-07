import { ETopicRequireField, ETopicTeam } from '@/core/constants/enum'
import type { IOptionRealtimeDto } from '@/core/interfaces/model/option'
import type { IState } from '@/core/interfaces/model/state'
import { ITopicCreateDto } from '@/core/interfaces/model/topic'

export const initTopic: ITopicCreateDto = {
  topic_id: 0,
  name: '',
  description: '',
  expiration: '',
  is_open: true,
  is_option_have_link: true,
  team: ETopicTeam.ALL,
  required_field: ETopicRequireField.TITLE,
  created_at: ''
}

export const initTopicState: IState<ITopicCreateDto> = {
  hasError: false,
  data: undefined,
  message: ''
}

export const initOption: IOptionRealtimeDto = {
  option_id: 0,
  name: '',
  link: '',
  voteBy: [],
  topic_id: 0
}
