import { ref } from 'vue'
import { defineStore } from 'pinia'

import { getTopicById } from '@/services/topic.service'
import type { IOption } from '@/core/interfaces/model/option'
import type { ITopic } from '@/core/interfaces/model/topic'
import { useCommonStore } from './_common'
import { getOptionsByTopicId, postNewOption } from '@/services/option.service'

export const useOptionsStore = defineStore('options', () => {
  const common = useCommonStore()
  const currentTopic = ref<ITopic | undefined>(undefined)
  const options = ref<IOption[]>([])

  const createOption = async ({ title, link }: { title: string; link: string }) => {
    common.setLoading(true)
    if (currentTopic.value) {
      await postNewOption(title, link, currentTopic.value.id)
    }
    common.setLoading(false)
  }

  const setCurrentTopic = async (id: string) => {
    common.setLoading(true)
    currentTopic.value = await getTopicById(id)
    common.setLoading(false)
  }

  const setOptions = async (id: string) => {
    common.setLoading(true)
    options.value = await getOptionsByTopicId(id)
    common.setLoading(false)
  }

  return {
    currentTopic,
    options,
    createOption,
    setCurrentTopic,
    setOptions
  }
})
