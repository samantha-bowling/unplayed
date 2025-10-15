export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
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
      admin_audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          metadata: Json | null
          target_user_id: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          target_user_id?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          target_user_id?: string | null
          user_id?: string | null
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
      game_dust_breakdowns: {
        Row: {
          age_score: number
          current_dust_score: number
          game_id: number
          game_name: string
          genre_score: number
          header_image: string | null
          id: string
          image_url: string | null
          last_calculated: string
          ownership_score: number
          playtime_factor: number
          playtime_minutes: number | null
          price_score: number
          quality_score: number
          release_date: string | null
          user_id: string
        }
        Insert: {
          age_score?: number
          current_dust_score?: number
          game_id: number
          game_name: string
          genre_score?: number
          header_image?: string | null
          id?: string
          image_url?: string | null
          last_calculated?: string
          ownership_score?: number
          playtime_factor?: number
          playtime_minutes?: number | null
          price_score?: number
          quality_score?: number
          release_date?: string | null
          user_id: string
        }
        Update: {
          age_score?: number
          current_dust_score?: number
          game_id?: number
          game_name?: string
          genre_score?: number
          header_image?: string | null
          id?: string
          image_url?: string | null
          last_calculated?: string
          ownership_score?: number
          playtime_factor?: number
          playtime_minutes?: number | null
          price_score?: number
          quality_score?: number
          release_date?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_dust_breakdowns_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
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
      leaderboard_calculation_locks: {
        Row: {
          expires_at: string
          id: string
          lock_key: string
          locked_at: string
          locked_by: string
        }
        Insert: {
          expires_at?: string
          id?: string
          lock_key: string
          locked_at?: string
          locked_by: string
        }
        Update: {
          expires_at?: string
          id?: string
          lock_key?: string
          locked_at?: string
          locked_by?: string
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
      security_events: {
        Row: {
          actor_user_id: string | null
          event_type: string
          happened_at: string
          id: number
          metadata: Json | null
          target: string | null
        }
        Insert: {
          actor_user_id?: string | null
          event_type: string
          happened_at?: string
          id?: number
          metadata?: Json | null
          target?: string | null
        }
        Update: {
          actor_user_id?: string | null
          event_type?: string
          happened_at?: string
          id?: number
          metadata?: Json | null
          target?: string | null
        }
        Relationships: []
      }
      steam_app_metadata: {
        Row: {
          appid: number
          header_url: string | null
          icon_url: string | null
          logo_url: string | null
          name: string | null
          updated_at: string | null
        }
        Insert: {
          appid: number
          header_url?: string | null
          icon_url?: string | null
          logo_url?: string | null
          name?: string | null
          updated_at?: string | null
        }
        Update: {
          appid?: number
          header_url?: string | null
          icon_url?: string | null
          logo_url?: string | null
          name?: string | null
          updated_at?: string | null
        }
        Relationships: []
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
      steam_call_logs: {
        Row: {
          attempts: number
          created_at: string | null
          duration_ms: number
          endpoint: string
          err_code: string | null
          id: number
          status: number
          user_id: string | null
        }
        Insert: {
          attempts: number
          created_at?: string | null
          duration_ms: number
          endpoint: string
          err_code?: string | null
          id?: number
          status: number
          user_id?: string | null
        }
        Update: {
          attempts?: number
          created_at?: string | null
          duration_ms?: number
          endpoint?: string
          err_code?: string | null
          id?: number
          status?: number
          user_id?: string | null
        }
        Relationships: []
      }
      user_clean_score_breakdowns: {
        Row: {
          backlog_conversion_score: number
          clean_streak_days: number
          diversity_score: number
          id: string
          last_calculated: string
          recency_score: number
          recently_played_count: number
          session_depth_score: number
          user_id: string
        }
        Insert: {
          backlog_conversion_score?: number
          clean_streak_days?: number
          diversity_score?: number
          id?: string
          last_calculated?: string
          recency_score?: number
          recently_played_count?: number
          session_depth_score?: number
          user_id: string
        }
        Update: {
          backlog_conversion_score?: number
          clean_streak_days?: number
          diversity_score?: number
          id?: string
          last_calculated?: string
          recency_score?: number
          recently_played_count?: number
          session_depth_score?: number
          user_id?: string
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
      user_genre_stats: {
        Row: {
          color_hex: string
          game_count: number
          genre_name: string
          id: string
          last_calculated: string
          percentage: number
          user_id: string
        }
        Insert: {
          color_hex?: string
          game_count?: number
          genre_name: string
          id?: string
          last_calculated?: string
          percentage?: number
          user_id: string
        }
        Update: {
          color_hex?: string
          game_count?: number
          genre_name?: string
          id?: string
          last_calculated?: string
          percentage?: number
          user_id?: string
        }
        Relationships: []
      }
      user_metrics: {
        Row: {
          average_dust_score: number | null
          calculation_version: number
          clean_score: number
          clean_score_tier: string | null
          clean_streak: number
          id: string
          last_calculated: string
          played_games: number
          recently_played_count: number | null
          total_dust_score: number
          total_games: number
          total_library_value_cents: number | null
          total_playtime_hours: number | null
          unplayed_games: number
          unplayed_value_cents: number | null
          user_id: string
        }
        Insert: {
          average_dust_score?: number | null
          calculation_version?: number
          clean_score?: number
          clean_score_tier?: string | null
          clean_streak?: number
          id?: string
          last_calculated?: string
          played_games?: number
          recently_played_count?: number | null
          total_dust_score?: number
          total_games?: number
          total_library_value_cents?: number | null
          total_playtime_hours?: number | null
          unplayed_games?: number
          unplayed_value_cents?: number | null
          user_id: string
        }
        Update: {
          average_dust_score?: number | null
          calculation_version?: number
          clean_score?: number
          clean_score_tier?: string | null
          clean_streak?: number
          id?: string
          last_calculated?: string
          played_games?: number
          recently_played_count?: number | null
          total_dust_score?: number
          total_games?: number
          total_library_value_cents?: number | null
          total_playtime_hours?: number | null
          unplayed_games?: number
          unplayed_value_cents?: number | null
          user_id?: string
        }
        Relationships: []
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
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          synced_at: string | null
          synced_from_metadata: boolean | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          synced_at?: string | null
          synced_from_metadata?: boolean | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          synced_at?: string | null
          synced_from_metadata?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      user_shelf_life: {
        Row: {
          game_id: number
          id: string
          last_calculated: string
          playtime_minutes: number | null
          release_date: string | null
          shelf_life_rank: number
          user_id: string
          years_old: number | null
        }
        Insert: {
          game_id: number
          id?: string
          last_calculated?: string
          playtime_minutes?: number | null
          release_date?: string | null
          shelf_life_rank: number
          user_id: string
          years_old?: number | null
        }
        Update: {
          game_id?: number
          id?: string
          last_calculated?: string
          playtime_minutes?: number | null
          release_date?: string | null
          shelf_life_rank?: number
          user_id?: string
          years_old?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_shelf_life_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      user_spending_metrics: {
        Row: {
          confidence_score: number
          created_at: string
          currency: string
          free_games: number
          games_missing_price_data: number
          games_with_price_data: number
          id: string
          last_calculated: string
          paid_games: number
          total_games: number
          total_saved_cents: number | null
          total_spent_cents: number
          unplayed_games: number
          unplayed_saved_cents: number | null
          unplayed_spent_cents: number
          updated_at: string
          user_id: string
        }
        Insert: {
          confidence_score?: number
          created_at?: string
          currency?: string
          free_games?: number
          games_missing_price_data?: number
          games_with_price_data?: number
          id?: string
          last_calculated?: string
          paid_games?: number
          total_games?: number
          total_saved_cents?: number | null
          total_spent_cents?: number
          unplayed_games?: number
          unplayed_saved_cents?: number | null
          unplayed_spent_cents?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          confidence_score?: number
          created_at?: string
          currency?: string
          free_games?: number
          games_missing_price_data?: number
          games_with_price_data?: number
          id?: string
          last_calculated?: string
          paid_games?: number
          total_games?: number
          total_saved_cents?: number | null
          total_spent_cents?: number
          unplayed_games?: number
          unplayed_saved_cents?: number | null
          unplayed_spent_cents?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          background_animation_pack: string
          created_at: string
          id: string
          last_sync: string | null
          leaderboard_opted_out_explicitly: boolean | null
          leaderboard_prompt_shown: boolean | null
          leaderboard_visibility: string
          onboarding_complete: boolean | null
          profile_badge_1: string
          profile_badge_2: string
          profile_badge_3: string
          profile_tagline: string | null
          profile_theme: string
          profile_username: string | null
          role: string | null
          show_mint_glow: boolean
          steam_avatar: string | null
          steam_id: string
          steam_name: string
          updated_at: string
        }
        Insert: {
          background_animation_pack?: string
          created_at?: string
          id: string
          last_sync?: string | null
          leaderboard_opted_out_explicitly?: boolean | null
          leaderboard_prompt_shown?: boolean | null
          leaderboard_visibility?: string
          onboarding_complete?: boolean | null
          profile_badge_1?: string
          profile_badge_2?: string
          profile_badge_3?: string
          profile_tagline?: string | null
          profile_theme?: string
          profile_username?: string | null
          role?: string | null
          show_mint_glow?: boolean
          steam_avatar?: string | null
          steam_id: string
          steam_name: string
          updated_at?: string
        }
        Update: {
          background_animation_pack?: string
          created_at?: string
          id?: string
          last_sync?: string | null
          leaderboard_opted_out_explicitly?: boolean | null
          leaderboard_prompt_shown?: boolean | null
          leaderboard_visibility?: string
          onboarding_complete?: boolean | null
          profile_badge_1?: string
          profile_badge_2?: string
          profile_badge_3?: string
          profile_tagline?: string | null
          profile_theme?: string
          profile_username?: string | null
          role?: string | null
          show_mint_glow?: boolean
          steam_avatar?: string | null
          steam_id?: string
          steam_name?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      steam_errors_last_24h: {
        Row: {
          endpoint: string | null
          err_code: string | null
          hits: number | null
          status: number | null
        }
        Relationships: []
      }
      steam_latency_last_24h: {
        Row: {
          avg_ms: number | null
          calls: number | null
          endpoint: string | null
          p50_ms: number | null
          p95_ms: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_dust_score: {
        Args: {
          acquisition_date: string
          playtime_minutes: number
          release_date: string
        }
        Returns: number
      }
      calculate_enhanced_dust_score: {
        Args: {
          genres?: string[]
          metacritic_score?: number
          playtime_minutes: number
          price_cents?: number
          release_date: string
        }
        Returns: Json
      }
      calculate_user_metrics_with_clean_score: {
        Args: { p_user_id: string }
        Returns: Json
      }
      calculate_user_spending_metrics: {
        Args: { p_user_id: string }
        Returns: Json
      }
      can_user_refresh_prices: {
        Args: { p_user_id: string }
        Returns: Json
      }
      get_clean_game_price: {
        Args: { p_fallback_price_cents?: number; p_game_id: number }
        Returns: Json
      }
      get_dust_score_breakdown: {
        Args: {
          acquisition_date: string
          game_id: number
          playtime_minutes: number
          release_date: string
        }
        Returns: Json
      }
      get_stale_prices_for_refresh: {
        Args: { batch_size?: number }
        Returns: {
          app_id: number
          days_since_check: number
          priority_score: number
          user_request_count: number
        }[]
      }
      get_total_game_count: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_user_game_dust_breakdown: {
        Args: { p_user_game_id: string }
        Returns: Json
      }
      get_user_library_stats: {
        Args: { p_user_id: string }
        Returns: Json
      }
      has_role: {
        Args: {
          check_role: Database["public"]["Enums"]["app_role"]
          check_user_id: string
        }
        Returns: boolean
      }
      increment: {
        Args: { value: number }
        Returns: number
      }
      is_admin: {
        Args: { check_user_id?: string }
        Returns: boolean
      }
      is_current_user_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_current_user_admin_legacy: {
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
          message: string
          total_count: number
          updated_count: number
        }[]
      }
      sync_user_roles_from_metadata: {
        Args: Record<PropertyKey, never>
        Returns: {
          errors_count: number
          synced_count: number
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
      upsert_user_spending_metrics: {
        Args: { p_user_id: string }
        Returns: Json
      }
      validate_and_clean_game_price: {
        Args: { price_cents: number }
        Returns: number
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
