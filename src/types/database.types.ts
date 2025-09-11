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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_audit_logs: {
        Row: {
          action: string
          actor_id: string
          created_at: string | null
          entity: string
          entity_id: string | null
          id: string
          metadata: Json | null
        }
        Insert: {
          action: string
          actor_id: string
          created_at?: string | null
          entity: string
          entity_id?: string | null
          id?: string
          metadata?: Json | null
        }
        Update: {
          action?: string
          actor_id?: string
          created_at?: string | null
          entity?: string
          entity_id?: string | null
          id?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      athlete_logs: {
        Row: {
          athlete_id: string
          completed_at: string | null
          created_at: string | null
          exercise_id: string
          id: string
          notes: string | null
          reps: number | null
          rpe: number | null
          weight: number | null
        }
        Insert: {
          athlete_id: string
          completed_at?: string | null
          created_at?: string | null
          exercise_id: string
          id?: string
          notes?: string | null
          reps?: number | null
          rpe?: number | null
          weight?: number | null
        }
        Update: {
          athlete_id?: string
          completed_at?: string | null
          created_at?: string | null
          exercise_id?: string
          id?: string
          notes?: string | null
          reps?: number | null
          rpe?: number | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "athlete_logs_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "athlete_logs_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      check_ins: {
        Row: {
          athlete_id: string
          bodyweight: number | null
          created_at: string | null
          date: string
          energy: number | null
          id: string
          liquids_ml: number | null
          measurements: Json | null
          mood: number | null
          notes: string | null
          sleep_hours: number | null
          steps: number | null
          updated_at: string | null
        }
        Insert: {
          athlete_id: string
          bodyweight?: number | null
          created_at?: string | null
          date?: string
          energy?: number | null
          id?: string
          liquids_ml?: number | null
          measurements?: Json | null
          mood?: number | null
          notes?: string | null
          sleep_hours?: number | null
          steps?: number | null
          updated_at?: string | null
        }
        Update: {
          athlete_id?: string
          bodyweight?: number | null
          created_at?: string | null
          date?: string
          energy?: number | null
          id?: string
          liquids_ml?: number | null
          measurements?: Json | null
          mood?: number | null
          notes?: string | null
          sleep_hours?: number | null
          steps?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "check_ins_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_athlete_links: {
        Row: {
          athlete_id: string
          coach_id: string
          created_at: string | null
          id: string
          status: Database["public"]["Enums"]["link_status"]
          updated_at: string | null
        }
        Insert: {
          athlete_id: string
          coach_id: string
          created_at?: string | null
          id?: string
          status?: Database["public"]["Enums"]["link_status"]
          updated_at?: string | null
        }
        Update: {
          athlete_id?: string
          coach_id?: string
          created_at?: string | null
          id?: string
          status?: Database["public"]["Enums"]["link_status"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coach_athlete_links_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_athlete_links_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          created_at: string | null
          cues: string | null
          id: string
          name: string
          order_index: number
          percent: number | null
          program_day_id: string
          reps: number | null
          rest_seconds: number | null
          rpe: number | null
          sets: number | null
          weight: number | null
        }
        Insert: {
          created_at?: string | null
          cues?: string | null
          id?: string
          name: string
          order_index?: number
          percent?: number | null
          program_day_id: string
          reps?: number | null
          rest_seconds?: number | null
          rpe?: number | null
          sets?: number | null
          weight?: number | null
        }
        Update: {
          created_at?: string | null
          cues?: string | null
          id?: string
          name?: string
          order_index?: number
          percent?: number | null
          program_day_id?: string
          reps?: number | null
          rest_seconds?: number | null
          rpe?: number | null
          sets?: number | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "exercises_program_day_id_fkey"
            columns: ["program_day_id"]
            isOneToOne: false
            referencedRelation: "program_days"
            referencedColumns: ["id"]
          },
        ]
      }
      message_attachments: {
        Row: {
          created_at: string | null
          duration_seconds: number | null
          file_name: string
          file_size: number | null
          id: string
          message_id: string
          mime_type: string | null
          storage_path: string
          type: Database["public"]["Enums"]["attachment_type"]
        }
        Insert: {
          created_at?: string | null
          duration_seconds?: number | null
          file_name: string
          file_size?: number | null
          id?: string
          message_id: string
          mime_type?: string | null
          storage_path: string
          type: Database["public"]["Enums"]["attachment_type"]
        }
        Update: {
          created_at?: string | null
          duration_seconds?: number | null
          file_name?: string
          file_size?: number | null
          id?: string
          message_id?: string
          mime_type?: string | null
          storage_path?: string
          type?: Database["public"]["Enums"]["attachment_type"]
        }
        Relationships: [
          {
            foreignKeyName: "message_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          created_at: string | null
          id: string
          sender_id: string
          text: string | null
          thread_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          sender_id: string
          text?: string | null
          thread_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          sender_id?: string
          text?: string | null
          thread_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "threads"
            referencedColumns: ["id"]
          },
        ]
      }
      program_days: {
        Row: {
          created_at: string | null
          day_number: number
          id: string
          notes: string | null
          program_id: string
          title: string | null
        }
        Insert: {
          created_at?: string | null
          day_number: number
          id?: string
          notes?: string | null
          program_id: string
          title?: string | null
        }
        Update: {
          created_at?: string | null
          day_number?: number
          id?: string
          notes?: string | null
          program_id?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "program_days_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      programs: {
        Row: {
          athlete_id: string
          coach_id: string
          created_at: string | null
          end_date: string | null
          id: string
          notes: string | null
          start_date: string
          template_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          athlete_id: string
          coach_id: string
          created_at?: string | null
          end_date?: string | null
          id?: string
          notes?: string | null
          start_date?: string
          template_id?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          athlete_id?: string
          coach_id?: string
          created_at?: string | null
          end_date?: string | null
          id?: string
          notes?: string | null
          start_date?: string
          template_id?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "programs_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programs_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programs_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          coach_id: string
          created_at: string | null
          description: string
          features: Json | null
          id: string
          price_text: string
          title: string
          updated_at: string | null
        }
        Insert: {
          coach_id: string
          created_at?: string | null
          description: string
          features?: Json | null
          id?: string
          price_text: string
          title: string
          updated_at?: string | null
        }
        Update: {
          coach_id?: string
          created_at?: string | null
          description?: string
          features?: Json | null
          id?: string
          price_text?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "services_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      templates: {
        Row: {
          coach_id: string
          created_at: string | null
          description: string | null
          id: string
          title: string
          type: Database["public"]["Enums"]["template_type"]
          updated_at: string | null
        }
        Insert: {
          coach_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          title: string
          type?: Database["public"]["Enums"]["template_type"]
          updated_at?: string | null
        }
        Update: {
          coach_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          title?: string
          type?: Database["public"]["Enums"]["template_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "templates_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      threads: {
        Row: {
          athlete_id: string
          athlete_unread_count: number | null
          coach_id: string
          coach_unread_count: number | null
          created_at: string | null
          id: string
          last_message_at: string | null
          updated_at: string | null
        }
        Insert: {
          athlete_id: string
          athlete_unread_count?: number | null
          coach_id: string
          coach_unread_count?: number | null
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          updated_at?: string | null
        }
        Update: {
          athlete_id?: string
          athlete_unread_count?: number | null
          coach_id?: string
          coach_unread_count?: number | null
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "threads_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "threads_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          locale: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          first_name?: string | null
          id: string
          last_name?: string | null
          locale?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          locale?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_or_create_thread: {
        Args: { p_athlete_id: string; p_coach_id: string }
        Returns: string
      }
      mark_thread_as_read: {
        Args: { p_thread_id: string; p_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      attachment_type: "image" | "video" | "file"
      link_status: "active" | "inactive" | "pending"
      template_type: "strength" | "nutrition" | "rehab"
      user_role: "athlete" | "coach" | "admin"
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
      attachment_type: ["image", "video", "file"],
      link_status: ["active", "inactive", "pending"],
      template_type: ["strength", "nutrition", "rehab"],
      user_role: ["athlete", "coach", "admin"],
    },
  },
} as const