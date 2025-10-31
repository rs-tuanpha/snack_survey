import type { ITopic } from '@/core/interfaces/model/topic'
import type { IOption } from '@/core/interfaces/model/option'
import type { IState } from '@/core/interfaces/model/state'
import { ETopicTeam, ETopicVoteType } from '@/core/constants/enum'

// Initial topic state for form
export const initTopic: Partial<ITopic> = {
  _id: '',
  title: '',
  description: '',
  team: ETopicTeam.ALL,
  voteType: ETopicVoteType.SINGLE,
  isActive: true,
  startDate: undefined,
  endDate: undefined,
}

// Initial topic state wrapper
export const initTopicState: IState<ITopic> = {
  hasError: false,
  data: undefined,
  message: '',
}

// Initial option state
export const initOption: Partial<IOption> = {
  _id: '',
  title: '',
  link: '',
  topicId: '',
  voteCount: 0,
}
