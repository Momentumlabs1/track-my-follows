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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      api_call_log: {
        Row: {
          created_at: string | null
          endpoint: string
          error_message: string | null
          function_name: string
          id: string
          profile_id: string | null
          response_time_ms: number | null
          status_code: number | null
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          error_message?: string | null
          function_name: string
          id?: string
          profile_id?: string | null
          response_time_ms?: number | null
          status_code?: number | null
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          error_message?: string | null
          function_name?: string
          id?: string
          profile_id?: string | null
          response_time_ms?: number | null
          status_code?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "api_call_log_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "tracked_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      follow_events: {
        Row: {
          category: string | null
          detected_at: string
          direction: string
          event_type: string
          gender_tag: string | null
          id: string
          is_initial: boolean
          is_mutual: boolean | null
          is_read: boolean
          notification_sent: boolean | null
          target_avatar_url: string | null
          target_display_name: string | null
          target_follower_count: number | null
          target_is_private: boolean | null
          target_username: string
          tracked_profile_id: string
        }
        Insert: {
          category?: string | null
          detected_at?: string
          direction?: string
          event_type: string
          gender_tag?: string | null
          id?: string
          is_initial?: boolean
          is_mutual?: boolean | null
          is_read?: boolean
          notification_sent?: boolean | null
          target_avatar_url?: string | null
          target_display_name?: string | null
          target_follower_count?: number | null
          target_is_private?: boolean | null
          target_username: string
          tracked_profile_id: string
        }
        Update: {
          category?: string | null
          detected_at?: string
          direction?: string
          event_type?: string
          gender_tag?: string | null
          id?: string
          is_initial?: boolean
          is_mutual?: boolean | null
          is_read?: boolean
          notification_sent?: boolean | null
          target_avatar_url?: string | null
          target_display_name?: string | null
          target_follower_count?: number | null
          target_is_private?: boolean | null
          target_username?: string
          tracked_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follow_events_tracked_profile_id_fkey"
            columns: ["tracked_profile_id"]
            isOneToOne: false
            referencedRelation: "tracked_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      follower_events: {
        Row: {
          category: string | null
          detected_at: string
          event_type: string
          follower_count: number | null
          full_name: string | null
          gender_tag: string | null
          id: string
          instagram_user_id: string
          is_initial: boolean
          is_read: boolean
          is_verified: boolean | null
          profile_id: string
          profile_pic_url: string | null
          username: string
        }
        Insert: {
          category?: string | null
          detected_at?: string
          event_type: string
          follower_count?: number | null
          full_name?: string | null
          gender_tag?: string | null
          id?: string
          instagram_user_id: string
          is_initial?: boolean
          is_read?: boolean
          is_verified?: boolean | null
          profile_id: string
          profile_pic_url?: string | null
          username: string
        }
        Update: {
          category?: string | null
          detected_at?: string
          event_type?: string
          follower_count?: number | null
          full_name?: string | null
          gender_tag?: string | null
          id?: string
          instagram_user_id?: string
          is_initial?: boolean
          is_read?: boolean
          is_verified?: boolean | null
          profile_id?: string
          profile_pic_url?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "follower_events_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "tracked_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_followers: {
        Row: {
          first_seen_at: string
          follower_avatar_url: string | null
          follower_display_name: string | null
          follower_follower_count: number | null
          follower_is_private: boolean | null
          follower_is_verified: boolean | null
          follower_user_id: string | null
          follower_username: string
          id: string
          is_current: boolean
          last_seen_at: string
          tracked_profile_id: string
        }
        Insert: {
          first_seen_at?: string
          follower_avatar_url?: string | null
          follower_display_name?: string | null
          follower_follower_count?: number | null
          follower_is_private?: boolean | null
          follower_is_verified?: boolean | null
          follower_user_id?: string | null
          follower_username: string
          id?: string
          is_current?: boolean
          last_seen_at?: string
          tracked_profile_id: string
        }
        Update: {
          first_seen_at?: string
          follower_avatar_url?: string | null
          follower_display_name?: string | null
          follower_follower_count?: number | null
          follower_is_private?: boolean | null
          follower_is_verified?: boolean | null
          follower_user_id?: string | null
          follower_username?: string
          id?: string
          is_current?: boolean
          last_seen_at?: string
          tracked_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_followers_tracked_profile_id_fkey"
            columns: ["tracked_profile_id"]
            isOneToOne: false
            referencedRelation: "tracked_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_followings: {
        Row: {
          category: string | null
          direction: string
          first_seen_at: string
          following_avatar_url: string | null
          following_display_name: string | null
          following_user_id: string
          following_username: string
          gender_tag: string | null
          id: string
          is_current: boolean
          last_seen_at: string
          tracked_profile_id: string
        }
        Insert: {
          category?: string | null
          direction?: string
          first_seen_at?: string
          following_avatar_url?: string | null
          following_display_name?: string | null
          following_user_id: string
          following_username: string
          gender_tag?: string | null
          id?: string
          is_current?: boolean
          last_seen_at?: string
          tracked_profile_id: string
        }
        Update: {
          category?: string | null
          direction?: string
          first_seen_at?: string
          following_avatar_url?: string | null
          following_display_name?: string | null
          following_user_id?: string
          following_username?: string
          gender_tag?: string | null
          id?: string
          is_current?: boolean
          last_seen_at?: string
          tracked_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_followings_tracked_profile_id_fkey"
            columns: ["tracked_profile_id"]
            isOneToOne: false
            referencedRelation: "tracked_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          plan_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          plan_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          plan_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          created_at: string
          id: string
          max_tracked_profiles: number
          name: string
          price_monthly: number
        }
        Insert: {
          created_at?: string
          id?: string
          max_tracked_profiles?: number
          name: string
          price_monthly?: number
        }
        Update: {
          created_at?: string
          id?: string
          max_tracked_profiles?: number
          name?: string
          price_monthly?: number
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          billing_period: string | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          max_tracked_profiles: number
          plan_type: string
          revenuecat_app_user_id: string | null
          revenuecat_entitlement: string | null
          spy_count: number
          status: string
          store: string | null
          trial_end: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          billing_period?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          max_tracked_profiles?: number
          plan_type?: string
          revenuecat_app_user_id?: string | null
          revenuecat_entitlement?: string | null
          spy_count?: number
          status?: string
          store?: string | null
          trial_end?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          billing_period?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          max_tracked_profiles?: number
          plan_type?: string
          revenuecat_app_user_id?: string | null
          revenuecat_entitlement?: string | null
          spy_count?: number
          status?: string
          store?: string | null
          trial_end?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      tracked_profiles: {
        Row: {
          avatar_url: string | null
          baseline_complete: boolean | null
          created_at: string
          display_name: string | null
          follower_count: number | null
          following_count: number | null
          gender_confidence: string | null
          gender_female_count: number | null
          gender_male_count: number | null
          gender_sample_size: number | null
          gender_unknown_count: number | null
          has_spy: boolean | null
          id: string
          initial_scan_done: boolean | null
          instagram_user_id: string | null
          is_active: boolean
          is_private: boolean | null
          last_baseline_attempt_at: string | null
          last_follower_count: number | null
          last_following_count: number | null
          last_scan_function: string | null
          last_scan_started_at: string | null
          last_scanned_at: string | null
          pending_unfollow_hint: number | null
          previous_follower_count: number | null
          previous_following_count: number | null
          push_scans_today: number | null
          scans_reset_at: string | null
          spy_assigned_at: string | null
          spy_name: string | null
          total_follows_detected: number | null
          total_scans_executed: number | null
          total_unfollows_detected: number | null
          unfollow_scans_today: number | null
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          baseline_complete?: boolean | null
          created_at?: string
          display_name?: string | null
          follower_count?: number | null
          following_count?: number | null
          gender_confidence?: string | null
          gender_female_count?: number | null
          gender_male_count?: number | null
          gender_sample_size?: number | null
          gender_unknown_count?: number | null
          has_spy?: boolean | null
          id?: string
          initial_scan_done?: boolean | null
          instagram_user_id?: string | null
          is_active?: boolean
          is_private?: boolean | null
          last_baseline_attempt_at?: string | null
          last_follower_count?: number | null
          last_following_count?: number | null
          last_scan_function?: string | null
          last_scan_started_at?: string | null
          last_scanned_at?: string | null
          pending_unfollow_hint?: number | null
          previous_follower_count?: number | null
          previous_following_count?: number | null
          push_scans_today?: number | null
          scans_reset_at?: string | null
          spy_assigned_at?: string | null
          spy_name?: string | null
          total_follows_detected?: number | null
          total_scans_executed?: number | null
          total_unfollows_detected?: number | null
          unfollow_scans_today?: number | null
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          baseline_complete?: boolean | null
          created_at?: string
          display_name?: string | null
          follower_count?: number | null
          following_count?: number | null
          gender_confidence?: string | null
          gender_female_count?: number | null
          gender_male_count?: number | null
          gender_sample_size?: number | null
          gender_unknown_count?: number | null
          has_spy?: boolean | null
          id?: string
          initial_scan_done?: boolean | null
          instagram_user_id?: string | null
          is_active?: boolean
          is_private?: boolean | null
          last_baseline_attempt_at?: string | null
          last_follower_count?: number | null
          last_following_count?: number | null
          last_scan_function?: string | null
          last_scan_started_at?: string | null
          last_scanned_at?: string | null
          pending_unfollow_hint?: number | null
          previous_follower_count?: number | null
          previous_following_count?: number | null
          push_scans_today?: number | null
          scans_reset_at?: string | null
          spy_assigned_at?: string | null
          spy_name?: string | null
          total_follows_detected?: number | null
          total_scans_executed?: number | null
          total_unfollows_detected?: number | null
          unfollow_scans_today?: number | null
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      unfollow_checks: {
        Row: {
          created_at: string
          id: string
          new_follows_found: number | null
          tracked_profile_id: string
          unfollows_found: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          new_follows_found?: number | null
          tracked_profile_id: string
          unfollows_found?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          new_follows_found?: number | null
          tracked_profile_id?: string
          unfollows_found?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "unfollow_checks_tracked_profile_id_fkey"
            columns: ["tracked_profile_id"]
            isOneToOne: false
            referencedRelation: "tracked_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          created_at: string
          id: string
          language: string
          push_follows: boolean | null
          push_unfollows: boolean | null
          theme: string | null
          timezone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          language?: string
          push_follows?: boolean | null
          push_unfollows?: boolean | null
          theme?: string | null
          timezone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          language?: string
          push_follows?: boolean | null
          push_unfollows?: boolean | null
          theme?: string | null
          timezone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      count_user_tracked_profiles: {
        Args: { _user_id: string }
        Returns: number
      }
      decrement_gender_count: {
        Args: { p_gender: string; p_profile_id: string }
        Returns: undefined
      }
      delete_own_account: { Args: never; Returns: undefined }
      get_daily_api_calls: { Args: never; Returns: number }
      get_max_tracked_profiles: { Args: { _user_id: string }; Returns: number }
      get_user_limits: { Args: { p_user_id: string }; Returns: Json }
      increment_gender_count: {
        Args: { p_gender: string; p_profile_id: string }
        Returns: undefined
      }
      move_spy: {
        Args: { p_new_profile_id: string; p_user_id: string }
        Returns: undefined
      }
      owns_tracked_profile: {
        Args: { _tracked_profile_id: string; _user_id: string }
        Returns: boolean
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
    Enums: {},
  },
} as const
