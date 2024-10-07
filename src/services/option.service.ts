import type { IOptionModel, IOptionVoteCountDto } from '@/core/interfaces/model/option'
import { supabase } from '@/plugins/supabase'

/**
 * Get list all options
 * @return {Promise<IOptionModel[]>}
 */
export const getAllOptions = async (): Promise<IOptionModel[]> => {
  const { data, error } = await supabase.from('options').select('*')
  if (error) {
    console.error(error)
    return []
  }
  return data as IOptionModel[]
}

/**
 * Get list option by topic id and order by voteCount (descending)
 * @param {string} topicId
 * @return options collection with specific topicId
 */
export const getOptionsByTopicId = async (topicId: number) => {
  const { data, error } = await supabase
    .from('options')
    .select(
      `
      option_id,
      topic_id,
      name,
      link,
      votes (
        vote_id
      )
    `
    )
    .eq('topic_id', topicId)
    .order('votes.count', { ascending: false })
  if (error) {
    throw new Error(error.message)
  }
  return data.map((item) => {
    const { votes, ...rest } = item
    return { ...rest, vote_count: votes.length } as IOptionVoteCountDto
  })
}

/**
 * get option by id from firebase
 */
export const getOptionById = async (optionId: number): Promise<IOptionModel> => {
  const { data, error } = await supabase.from('options').select('*').eq('option_id', optionId)
  if (error) {
    throw new Error(error.message)
  }
  return data[0] as IOptionModel
}

/**
 * create new option
 * @param {string} title
 * @param {string} link
 * @param {string} topicId
 */
export const postNewOption = async (title: string, link: string, topicId: number) => {
  const newOption = {
    name: title,
    link,
    topic_id: topicId
  } as any as IOptionModel
  const { data, error } = await supabase.from('options').insert(newOption)
  if (error) {
    throw new Error(error.message)
  }
  return data
}

/**
 * update option data to firebase
 * @param {IOptionModel} option
 */
export const putOptionData = async (option: IOptionModel) => {
  const { data, error } = await supabase
    .from('options')
    .update(option)
    .eq('option_id', option.option_id)
  if (error) {
    throw new Error(error.message)
  }
  return data
}

/**
 * Subscribes to real-time updates for options associated with a specific topic
 *
 * @param {number} topicId - The ID of the topic to monitor for option changes
 * @param {function} callback - A function to be called when changes occur
 * @param {Object} callback.payload - The payload containing the changed data
 * @returns {Promise<RealtimeChannel>} A promise that resolves to the subscribed channel
 *
 * @example
 * const unsubscribe = await getRealtimeOptionChannel(123, (payload) => {
 *   console.log('Event type:', payload.eventType);
 *   console.log('New data:', payload.new);
 *   console.log('Old data:', payload.old);
 * });
 *
 * // Later, to unsubscribe:
 * unsubscribe();
 */
export const getRealtimeOptionListChannel = async (
  topicId: number,
  callback: (payload: any) => void
) => {
  return supabase
    .channel('option_channel')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'options', filter: `topic_id=eq.${topicId}` },
      callback
    )
    .subscribe()
}

/**
 * Deletes an option from the database by its ID.
 *
 * @param {number} optionId - The unique identifier of the option to delete.
 * @return {Promise<boolean>} A promise that resolves to true if the option was successfully deleted, false otherwise.
 * @throws {Error} If there's an error during the database operation.
 */
export const deleteOptionById = async (optionId: number): Promise<boolean> => {
  const { error } = await supabase.from('options').delete().eq('option_id', optionId)

  if (error) {
    console.error('Error deleting option:', error)
    throw new Error(error.message)
  }

  return true
}
