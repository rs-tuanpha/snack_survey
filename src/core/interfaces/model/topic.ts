import type { ETopicRequireField, ETopicTeam } from '@/core/constants/enum'

export interface ITopicModel {
  /** supabase */
  topic_id: number
  name: string
  description: string | null
  expiration: string | null
  is_open: boolean | null
  is_option_have_link: boolean | null
  required_field: string | null
  is_multiple_vote: boolean | null
  team: string
  created_at: string | null
  updated_at: string | null
}

export interface ITopicCreateDto {
  /** supabase */
  topic_id: number
  name: string
  description: string | null
  expiration: string | null
  is_open: boolean | null
  is_option_have_link: boolean | null
  is_multiple_vote: boolean | null
  required_field: `${ETopicRequireField}` | null
  team: `${ETopicTeam}`
  created_at: string | null
  updated_at: string | null
}
