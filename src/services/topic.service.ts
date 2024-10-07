import type { ITopicModel } from '@/core/interfaces/model/topic'
import { ETopicTeam } from '@/core/constants/enum'
import { supabase } from '@/plugins/supabase'

/**
 * Create a new topic
 * @param {string} name - The name of the topic
 * @param {string} team - The team associated with the topic
 * @param {string} description - The description of the topic
 * @param {string} expiration - The expiration date and time of the topic
 * @param {string} optionRequiredField - The required field for options
 * @returns {Promise<ITopicModel | null>} - The created topic or null if an error occurred
 */
export const createTopic = async (
  name: string,
  team: string,
  description: string,
  expiration: string,
  optionRequiredField: string
): Promise<ITopicModel | null> => {
  const { data, error } = await supabase
    .from('topics')
    .insert([
      {
        name,
        team,
        description,
        expiration,
        required_field: optionRequiredField
      }
    ])
    .select()
    .single()

  if (error) {
    console.error('Error creating topic:', error)
    return null
  }

  return data as ITopicModel
}

/**
 * Update a topic by its ID
 * @param {number} topicId - The ID of the topic to update
 * @param {Partial<ITopicModel>} updateData - The data to update the topic with
 * @returns {Promise<ITopicModel | null>} - The updated topic or null if an error occurred
 */
export const updateTopicById = async (
  topicId: number,
  updateData: Partial<ITopicModel>
): Promise<ITopicModel | null> => {
  const { data, error } = await supabase
    .from('topics')
    .update(updateData)
    .eq('id', topicId)
    .select()
    .single()

  if (error) {
    console.error('Error updating topic:', error)
    return null
  }

  return data as ITopicModel
}

/**
 * Get list of topics with optional filters
 * @param {Object} filters - The filters to apply
 * @param {boolean | null} [filters.isOpen] - The status of the topics to retrieve (true for open, false for closed, null for all)
 * @param {string | null} [filters.team] - The team to filter topics by (null for all teams)
 * @return {Promise<ITopicModel[] | null>}
 */
export const getTopicList = async (
  filters: {
    isOpen?: boolean
    team?: ETopicTeam
  } = {}
): Promise<ITopicModel[] | null> => {
  let query = supabase.from('topics').select('*')

  if (filters.isOpen) {
    query = query.eq('is_open', filters.isOpen)
  }

  if (filters.team) {
    query = query.eq('team', String(filters.team).toUpperCase())
  }

  query = query.order('updated_at', { ascending: false })

  const { data, error } = await query

  if (error) {
    console.error('Error fetching topics:', error)
    return null
  }

  return data as ITopicModel[]
}

/**
 * Retrieves a topic from the database by its ID.
 *
 * @param {number} topicId - The unique identifier of the topic to retrieve.
 * @return {Promise<ITopicModel|null>} A promise that resolves to the topic data or null if not found.
 * @throws {Error} If there's an error during the database query.
 */
export const getTopicById = async (topicId: number): Promise<ITopicModel | null> => {
  const { data, error } = await supabase.from('topics').select('*').eq('topic_id', topicId)
  if (error) {
    throw new Error(error.message)
  }
  return data?.[0] as ITopicModel | null
}

/**
 * Deletes a topic from the database by its ID.
 *
 * @param {number} topicId - The unique identifier of the topic to delete.
 * @return {Promise<boolean>} A promise that resolves to true if the topic was successfully deleted, false otherwise.
 * @throws {Error} If there's an error during the database operation.
 */
export const deleteTopicById = async (topicId: number): Promise<boolean> => {
  const { error } = await supabase.from('topics').delete().eq('topic_id', topicId)

  if (error) {
    console.error('Error deleting topic:', error)
    throw new Error(error.message)
  }

  return true
}
