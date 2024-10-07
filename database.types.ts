export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      account: {
        Row: {
          avatar: string | null
          created_at: string | null
          name: string
          team: string
          user_id: number
        }
        Insert: {
          avatar?: string | null
          created_at?: string | null
          name: string
          team: string
          user_id?: number
        }
        Update: {
          avatar?: string | null
          created_at?: string | null
          name?: string
          team?: string
          user_id?: number
        }
        Relationships: []
      }
      options: {
        Row: {
          link: string | null
          name: string
          option_id: number
          topic_id: number
        }
        Insert: {
          link?: string | null
          name: string
          option_id?: number
          topic_id: number
        }
        Update: {
          link?: string | null
          name?: string
          option_id?: number
          topic_id?: number
        }
        Relationships: [
          {
            foreignKeyName: 'options_topic_id_fkey'
            columns: ['topic_id']
            isOneToOne: false
            referencedRelation: 'topics'
            referencedColumns: ['topic_id']
          }
        ]
      }
      topics: {
        Row: {
          created_at: string | null
          description: string | null
          expiration: string | null
          is_open: boolean | null
          is_option_have_link: boolean | null
          name: string
          required_field: boolean | null
          team: string
          topic_id: number
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          expiration?: string | null
          is_open?: boolean | null
          is_option_have_link?: boolean | null
          name: string
          required_field?: boolean | null
          team: string
          topic_id?: number
        }
        Update: {
          created_at?: string | null
          description?: string | null
          expiration?: string | null
          is_open?: boolean | null
          is_option_have_link?: boolean | null
          name?: string
          required_field?: boolean | null
          team?: string
          topic_id?: number
        }
        Relationships: []
      }
      votes: {
        Row: {
          option_id: number
          topic_id: number
          user_id: number
          vote_id: number
          voted_at: string | null
        }
        Insert: {
          option_id: number
          topic_id: number
          user_id: number
          vote_id?: number
          voted_at?: string | null
        }
        Update: {
          option_id?: number
          topic_id?: number
          user_id?: number
          vote_id?: number
          voted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'votes_option_id_fkey'
            columns: ['option_id']
            isOneToOne: false
            referencedRelation: 'options'
            referencedColumns: ['option_id']
          },
          {
            foreignKeyName: 'votes_topic_id_fkey'
            columns: ['topic_id']
            isOneToOne: false
            referencedRelation: 'topics'
            referencedColumns: ['topic_id']
          },
          {
            foreignKeyName: 'votes_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'account'
            referencedColumns: ['user_id']
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, 'public'>]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema['Tables'] & PublicSchema['Views'])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions['schema']]['Tables'] &
        Database[PublicTableNameOrOptions['schema']]['Views'])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions['schema']]['Tables'] &
      Database[PublicTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema['Tables'] & PublicSchema['Views'])
  ? (PublicSchema['Tables'] & PublicSchema['Views'])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends keyof PublicSchema['Tables'] | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
  ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends keyof PublicSchema['Tables'] | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
  ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends keyof PublicSchema['Enums'] | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions['schema']]['Enums']
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions['schema']]['Enums'][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema['Enums']
  ? PublicSchema['Enums'][PublicEnumNameOrOptions]
  : never
