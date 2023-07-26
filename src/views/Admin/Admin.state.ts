import { ETopicRequireField, ETopicTeam } from "@/core/constants/enum";
import type { IOption } from "@/core/interfaces/model/option";
import type { IState } from "@/core/interfaces/model/state";
import type { ITopic } from "@/core/interfaces/model/topic";

export const initTopic: ITopic = {
    id: '',
    name: '',
    description: '',
    date: new Date(),
    status: true,
    link: true,
    option: true,
    team: ETopicTeam.ALL,
    requireField: ETopicRequireField.TITLE
}

export const initTopicState: IState<ITopic> = {
    hasError: false,
    data: undefined,
    message: ""
}

export const initOption: IOption = {
    id: '',
    title: '',
    link: '',
    voteBy: [],
    topicId: '',
    voteCount: 0,
}