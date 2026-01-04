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
      profiles: {
        Row: {
          created_at: string
          eco_creds: number
          email: string
          id: string
          name: string
          phone: string | null
          total_reports: number
          total_scans: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          eco_creds?: number
          email: string
          id?: string
          name: string
          phone?: string | null
          total_reports?: number
          total_scans?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          eco_creds?: number
          email?: string
          id?: string
          name?: string
          phone?: string | null
          total_reports?: number
          total_scans?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      redemptions: {
        Row: {
          created_at: string
          id: string
          redeemed_at: string
          reward_id: string
          snapcreds_spent: number
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          redeemed_at?: string
          reward_id: string
          snapcreds_spent: number
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          redeemed_at?: string
          reward_id?: string
          snapcreds_spent?: number
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "redemptions_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string
          description: string | null
          eco_creds_earned: number
          id: string
          image_url: string | null
          latitude: number | null
          location: string
          longitude: number | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          eco_creds_earned?: number
          id?: string
          image_url?: string | null
          latitude?: number | null
          location: string
          longitude?: number | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          eco_creds_earned?: number
          id?: string
          image_url?: string | null
          latitude?: number | null
          location?: string
          longitude?: number | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      rewards: {
        Row: {
          cost: number
          created_at: string
          description: string
          id: string
          image_url: string | null
          is_active: boolean
          is_sold_out: boolean
          name: string
          stock_count: number | null
          tier: Database["public"]["Enums"]["reward_tier"]
          updated_at: string
        }
        Insert: {
          cost: number
          created_at?: string
          description: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_sold_out?: boolean
          name: string
          stock_count?: number | null
          tier: Database["public"]["Enums"]["reward_tier"]
          updated_at?: string
        }
        Update: {
          cost?: number
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_sold_out?: boolean
          name?: string
          stock_count?: number | null
          tier?: Database["public"]["Enums"]["reward_tier"]
          updated_at?: string
        }
        Relationships: []
      }
      scans: {
        Row: {
          confidence_score: number | null
          created_at: string
          disposal_instructions: string
          eco_creds_earned: number
          eco_tips: string
          environmental_impact: string
          id: string
          image_url: string | null
          item_name: string
          latitude: number | null
          longitude: number | null
          user_id: string
          waste_category: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          disposal_instructions: string
          eco_creds_earned?: number
          eco_tips: string
          environmental_impact: string
          id?: string
          image_url?: string | null
          item_name: string
          latitude?: number | null
          longitude?: number | null
          user_id: string
          waste_category: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          disposal_instructions?: string
          eco_creds_earned?: number
          eco_tips?: string
          environmental_impact?: string
          id?: string
          image_url?: string | null
          item_name?: string
          latitude?: number | null
          longitude?: number | null
          user_id?: string
          waste_category?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string
          gemini_api_key: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          gemini_api_key?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          gemini_api_key?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      leaderboard_view: {
        Row: {
          eco_creds: number | null
          id: string | null
          name: string | null
          rank: number | null
          total_reports: number | null
          total_scans: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_leaderboard: {
        Args: never
        Returns: {
          eco_creds: number
          id: string
          name: string
          rank: number
          total_reports: number
          total_scans: number
        }[]
      }
      redeem_reward: {
        Args: { p_reward_id: string; p_user_id: string }
        Returns: Json
      }
    }
    Enums: {
      reward_tier: "digital" | "food" | "gift_card" | "impact"
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
      reward_tier: ["digital", "food", "gift_card", "impact"],
    },
  },
} as const
