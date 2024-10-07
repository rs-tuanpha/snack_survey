import { IVoteModel } from '@/core/interfaces/model/vote'
import { supabase } from '@/plugins/supabase'

/**
 * handle update voteBy and voteCount of Option
 * @param newOptionList
 * @returns 1 on success,
 */
export const voteOption = async (newVote: IVoteModel) => {
  const { error } = await supabase.from('votes').insert(newVote)
  if (error) {
    console.error(error)
    return 0
  }
  return 1
}

/**
 * Sets up a real-time subscription to vote changes for a specific topic.
 *
 * @param {number} topicId - The ID of the topic to subscribe to.
 * @param {function} callback - A function to be called when vote changes occur.
 *                              It receives a payload with the change details.
 * @returns {Promise<RealtimeChannel>} A promise that resolves to the subscribed channel.
 */
export const getRealtimeVoteChanel = async (topicId: number, callback: (payload: any) => void) => {
  return supabase
    .channel('vote_channel')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'votes', filter: `topic_id=eq.${topicId}` },
      callback
    )
    .subscribe()
}
