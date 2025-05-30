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
      account_deletions: {
        Row: {
          deleted_at: string
          feedback: string | null
          id: string
          metadata: Json | null
          reason: string | null
          user_id: string
          username: string | null
        }
        Insert: {
          deleted_at?: string
          feedback?: string | null
          id?: string
          metadata?: Json | null
          reason?: string | null
          user_id: string
          username?: string | null
        }
        Update: {
          deleted_at?: string
          feedback?: string | null
          id?: string
          metadata?: Json | null
          reason?: string | null
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      donors: {
        Row: {
          amount_cents: number | null
          approved: boolean
          created_at: string
          display_name: string
          donation_id: string | null
          hidden: boolean | null
          id: string
          source: string
          thank_you_message: string | null
          tier: string | null
          tier_updated_at: string | null
        }
        Insert: {
          amount_cents?: number | null
          approved?: boolean
          created_at?: string
          display_name: string
          donation_id?: string | null
          hidden?: boolean | null
          id?: string
          source?: string
          thank_you_message?: string | null
          tier?: string | null
          tier_updated_at?: string | null
        }
        Update: {
          amount_cents?: number | null
          approved?: boolean
          created_at?: string
          display_name?: string
          donation_id?: string | null
          hidden?: boolean | null
          id?: string
          source?: string
          thank_you_message?: string | null
          tier?: string | null
          tier_updated_at?: string | null
        }
        Relationships: []
      }
      game_estimates: {
        Row: {
          completionist_hours: number | null
          confidence: number | null
          game_id: number
          hltb_title: string | null
          last_updated: string | null
          main_extra_hours: number | null
          main_hours: number | null
        }
        Insert: {
          completionist_hours?: number | null
          confidence?: number | null
          game_id: number
          hltb_title?: string | null
          last_updated?: string | null
          main_extra_hours?: number | null
          main_hours?: number | null
        }
        Update: {
          completionist_hours?: number | null
          confidence?: number | null
          game_id?: number
          hltb_title?: string | null
          last_updated?: string | null
          main_extra_hours?: number | null
          main_hours?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "game_estimates_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: true
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
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
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      game_prices: {
        Row: {
          app_id: number
          currency: string | null
          discount_percent: number | null
          final_price_cents: number | null
          initial_price_cents: number | null
          last_checked: string | null
          last_user_request: string | null
          priority_score: number | null
          user_request_count: number | null
        }
        Insert: {
          app_id: number
          currency?: string | null
          discount_percent?: number | null
          final_price_cents?: number | null
          initial_price_cents?: number | null
          last_checked?: string | null
          last_user_request?: string | null
          priority_score?: number | null
          user_request_count?: number | null
        }
        Update: {
          app_id?: number
          currency?: string | null
          discount_percent?: number | null
          final_price_cents?: number | null
          initial_price_cents?: number | null
          last_checked?: string | null
          last_user_request?: string | null
          priority_score?: number | null
          user_request_count?: number | null
        }
        Relationships: []
      }
      games: {
        Row: {
          categories: string[] | null
          created_at: string
          description: string | null
          developer: string[] | null
          genres: string[] | null
          header_image: string | null
          id: number
          image_url: string | null
          metacritic_score: number | null
          name: string
          platforms: string[] | null
          price_cents: number | null
          publisher: string[] | null
          release_date: string | null
          screenshots: string[] | null
          updated_at: string
        }
        Insert: {
          categories?: string[] | null
          created_at?: string
          description?: string | null
          developer?: string[] | null
          genres?: string[] | null
          header_image?: string | null
          id: number
          image_url?: string | null
          metacritic_score?: number | null
          name: string
          platforms?: string[] | null
          price_cents?: number | null
          publisher?: string[] | null
          release_date?: string | null
          screenshots?: string[] | null
          updated_at?: string
        }
        Update: {
          categories?: string[] | null
          created_at?: string
          description?: string | null
          developer?: string[] | null
          genres?: string[] | null
          header_image?: string | null
          id?: number
          image_url?: string | null
          metacritic_score?: number | null
          name?: string
          platforms?: string[] | null
          price_cents?: number | null
          publisher?: string[] | null
          release_date?: string | null
          screenshots?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      leaderboard_snapshots: {
        Row: {
          clean_score: number
          dust_score: number
          id: string
          is_anonymous: boolean
          library_value_cents: number | null
          played_games: number
          previous_ranking: number | null
          rank_change: number | null
          ranking: number | null
          snapshot_date: string
          total_games: number
          unplayed_games: number
          user_id: string
          username: string | null
        }
        Insert: {
          clean_score: number
          dust_score: number
          id?: string
          is_anonymous?: boolean
          library_value_cents?: number | null
          played_games?: number
          previous_ranking?: number | null
          rank_change?: number | null
          ranking?: number | null
          snapshot_date?: string
          total_games?: number
          unplayed_games?: number
          user_id: string
          username?: string | null
        }
        Update: {
          clean_score?: number
          dust_score?: number
          id?: string
          is_anonymous?: boolean
          library_value_cents?: number | null
          played_games?: number
          previous_ranking?: number | null
          rank_change?: number | null
          ranking?: number | null
          snapshot_date?: string
          total_games?: number
          unplayed_games?: number
          user_id?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leaderboard_snapshots_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      steam_app_queue: {
        Row: {
          app_id: number
          attempts: number | null
          created_at: string | null
          last_attempt: string | null
          name: string | null
          priority: number | null
          status: string | null
        }
        Insert: {
          app_id: number
          attempts?: number | null
          created_at?: string | null
          last_attempt?: string | null
          name?: string | null
          priority?: number | null
          status?: string | null
        }
        Update: {
          app_id?: number
          attempts?: number | null
          created_at?: string | null
          last_attempt?: string | null
          name?: string | null
          priority?: number | null
          status?: string | null
        }
        Relationships: []
      }
      steam_app_sync: {
        Row: {
          id: string
          last_sync: string | null
          processed_apps: number | null
          status: string | null
          total_apps: number | null
        }
        Insert: {
          id?: string
          last_sync?: string | null
          processed_apps?: number | null
          status?: string | null
          total_apps?: number | null
        }
        Update: {
          id?: string
          last_sync?: string | null
          processed_apps?: number | null
          status?: string | null
          total_apps?: number | null
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
      user_price_refresh_logs: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          games_requested: number
          games_updated: number
          id: string
          refresh_type: string
          status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          games_requested?: number
          games_updated?: number
          id?: string
          refresh_type: string
          status: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          games_requested?: number
          games_updated?: number
          id?: string
          refresh_type?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string
          id: string
          last_sync: string | null
          leaderboard_visibility: string
          onboarding_complete: boolean | null
          role: string | null
          steam_avatar: string | null
          steam_id: string
          steam_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          last_sync?: string | null
          leaderboard_visibility?: string
          onboarding_complete?: boolean | null
          role?: string | null
          steam_avatar?: string | null
          steam_id: string
          steam_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          last_sync?: string | null
          leaderboard_visibility?: string
          onboarding_complete?: boolean | null
          role?: string | null
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
      calculate_enhanced_dust_score: {
        Args: {
          release_date: string
          playtime_minutes: number
          price_cents?: number
          genres?: string[]
          metacritic_score?: number
        }
        Returns: Json
      }
      can_user_refresh_prices: {
        Args: { p_user_id: string }
        Returns: Json
      }
      get_dust_score_breakdown: {
        Args: {
          game_id: number
          acquisition_date: string
          release_date: string
          playtime_minutes: number
        }
        Returns: Json
      }
      get_stale_prices_for_refresh: {
        Args: { batch_size?: number }
        Returns: {
          app_id: number
          priority_score: number
          user_request_count: number
          days_since_check: number
        }[]
      }
      get_user_game_dust_breakdown: {
        Args: { p_user_game_id: string }
        Returns: Json
      }
      increment: {
        Args: { value: number }
        Returns: number
      }
      is_current_user_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      mark_onboarding_complete: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      recalculate_all_dust_scores: {
        Args: Record<PropertyKey, never>
        Returns: {
          updated_count: number
          total_count: number
          message: string
        }[]
      }
      track_user_price_request: {
        Args: { p_app_ids: number[] }
        Returns: undefined
      }
      update_leaderboard_clean_rankings: {
        Args: { snapshot_timestamp: string }
        Returns: undefined
      }
      update_leaderboard_dust_rankings: {
        Args: { snapshot_timestamp: string }
        Returns: undefined
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
