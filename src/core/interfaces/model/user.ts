export interface IAccountModel {
  /** supabase fields */
  avatar: string | null
  created_at: string | null
  name: string
  team: string
  user_id: number
}

export interface IAccountVoteDto {
  user_id: number
  name: string
  avatar: string | null
}
