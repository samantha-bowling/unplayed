export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      donors: {
        Row: {
          approved: boolean
          created_at: string
          display_name: string
          id: string
          source: string
        }
        Insert: {
          approved?: boolean
          created_at?: string
          display_name: string
          id?: string
          source?: string
        }
        Update: {
          approved?: boolean
          created_at?: string
          display_name?: string
          id?: string
          source?: string
        }
        Relationships: []
      }
      game_picks: {
        Row: {
          filters: Json | null
          game_id: number
          id: string
          picked_at: string
          user_id: string
        }
        Insert: {
          filters?: Json | null
          game_id: number
          id?: string
          picked_at?: string
          user_id: string
        }
        Update: {
          filters?: Json | null
          game_id?: number
          id?: string
          picked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_picks_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_picks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          categories: string[] | null
          created_at: string
          genres: string[] | null
          header_image: string | null
          id: number
          image_url: string | null
          metacritic_score: number | null
          name: string
          price_cents: number | null
          release_date: string | null
          updated_at: string
        }
        Insert: {
          categories?: string[] | null
          created_at?: string
          genres?: string[] | null
          header_image?: string | null
          id: number
          image_url?: string | null
          metacritic_score?: number | null
          name: string
          price_cents?: number | null
          release_date?: string | null
          updated_at?: string
        }
        Update: {
          categories?: string[] | null
          created_at?: string
          genres?: string[] | null
          header_image?: string | null
          id?: number
          image_url?: string | null
          metacritic_score?: number | null
          name?: string
          price_cents?: number | null
          release_date?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_games: {
        Row: {
          acquisition_date: string | null
          created_at: string
          dust_score: number | null
          game_id: number
          hidden: boolean | null
          id: string
          last_played_date: string | null
          notes: string | null
          playtime_minutes: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          acquisition_date?: string | null
          created_at?: string
          dust_score?: number | null
          game_id: number
          hidden?: boolean | null
          id?: string
          last_played_date?: string | null
          notes?: string | null
          playtime_minutes?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          acquisition_date?: string | null
          created_at?: string
          dust_score?: number | null
          game_id?: number
          hidden?: boolean | null
          id?: string
          last_played_date?: string | null
          notes?: string | null
          playtime_minutes?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_games_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_games_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          id: string
          last_sync: string | null
          steam_avatar: string | null
          steam_id: string
          steam_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          last_sync?: string | null
          steam_avatar?: string | null
          steam_id: string
          steam_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          last_sync?: string | null
          steam_avatar?: string | null
          steam_id?: string
          steam_name?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_dust_score: {
        Args: {
          acquisition_date: string
          release_date: string
          playtime_minutes: number
        }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
