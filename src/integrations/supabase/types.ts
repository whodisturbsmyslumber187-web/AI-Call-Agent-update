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
      agent_chat_messages: {
        Row: {
          created_at: string
          from_business_id: string
          id: string
          message: string
          message_type: string
          to_business_id: string | null
        }
        Insert: {
          created_at?: string
          from_business_id: string
          id?: string
          message?: string
          message_type?: string
          to_business_id?: string | null
        }
        Update: {
          created_at?: string
          from_business_id?: string
          id?: string
          message?: string
          message_type?: string
          to_business_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_chat_messages_from_business_id_fkey"
            columns: ["from_business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_chat_messages_to_business_id_fkey"
            columns: ["to_business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_config: {
        Row: {
          created_at: string
          id: string
          instructions: string
          menu: string
          restaurant_hours: string
          restaurant_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          instructions?: string
          menu?: string
          restaurant_hours?: string
          restaurant_name?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          instructions?: string
          menu?: string
          restaurant_hours?: string
          restaurant_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      agent_learnings: {
        Row: {
          business_id: string
          category: string
          confidence: number
          created_at: string
          id: string
          learned_response: string
          source: string
          status: string
          trigger_phrase: string
        }
        Insert: {
          business_id: string
          category?: string
          confidence?: number
          created_at?: string
          id?: string
          learned_response?: string
          source?: string
          status?: string
          trigger_phrase?: string
        }
        Update: {
          business_id?: string
          category?: string
          confidence?: number
          created_at?: string
          id?: string
          learned_response?: string
          source?: string
          status?: string
          trigger_phrase?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_learnings_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_requests: {
        Row: {
          approved_by: string | null
          business_id: string
          created_at: string
          details: Json
          id: string
          request_type: string
          requested_by: string
          status: string
        }
        Insert: {
          approved_by?: string | null
          business_id: string
          created_at?: string
          details?: Json
          id?: string
          request_type?: string
          requested_by?: string
          status?: string
        }
        Update: {
          approved_by?: string | null
          business_id?: string
          created_at?: string
          details?: Json
          id?: string
          request_type?: string
          requested_by?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "approval_requests_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      availability_slots: {
        Row: {
          business_id: string
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          is_available: boolean
          start_time: string
        }
        Insert: {
          business_id: string
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          is_available?: boolean
          start_time: string
        }
        Update: {
          business_id?: string
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          is_available?: boolean
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "availability_slots_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          agent_mode: string
          closing_techniques: string
          created_at: string
          default_language: string
          greeting_message: string
          id: string
          industry: string
          instructions: string
          knowledge_base: string
          livekit_enabled: boolean
          livekit_room_prefix: string | null
          llm_api_endpoint: string | null
          llm_api_key_name: string | null
          llm_model: string
          llm_provider: string
          name: string
          objection_handling: string
          sales_script: string
          status: string
          supported_languages: string[]
          timezone: string
          tts_api_endpoint: string | null
          tts_api_key_name: string | null
          tts_provider: string
          tts_voice_id: string | null
          updated_at: string
          upsell_prompts: string
          user_id: string
          voice: string
        }
        Insert: {
          agent_mode?: string
          closing_techniques?: string
          created_at?: string
          default_language?: string
          greeting_message?: string
          id?: string
          industry?: string
          instructions?: string
          knowledge_base?: string
          livekit_enabled?: boolean
          livekit_room_prefix?: string | null
          llm_api_endpoint?: string | null
          llm_api_key_name?: string | null
          llm_model?: string
          llm_provider?: string
          name: string
          objection_handling?: string
          sales_script?: string
          status?: string
          supported_languages?: string[]
          timezone?: string
          tts_api_endpoint?: string | null
          tts_api_key_name?: string | null
          tts_provider?: string
          tts_voice_id?: string | null
          updated_at?: string
          upsell_prompts?: string
          user_id: string
          voice?: string
        }
        Update: {
          agent_mode?: string
          closing_techniques?: string
          created_at?: string
          default_language?: string
          greeting_message?: string
          id?: string
          industry?: string
          instructions?: string
          knowledge_base?: string
          livekit_enabled?: boolean
          livekit_room_prefix?: string | null
          llm_api_endpoint?: string | null
          llm_api_key_name?: string | null
          llm_model?: string
          llm_provider?: string
          name?: string
          objection_handling?: string
          sales_script?: string
          status?: string
          supported_languages?: string[]
          timezone?: string
          tts_api_endpoint?: string | null
          tts_api_key_name?: string | null
          tts_provider?: string
          tts_voice_id?: string | null
          updated_at?: string
          upsell_prompts?: string
          user_id?: string
          voice?: string
        }
        Relationships: []
      }
      calendar_connections: {
        Row: {
          business_id: string
          created_at: string
          google_calendar_id: string | null
          id: string
          last_synced_at: string | null
          sync_enabled: boolean
        }
        Insert: {
          business_id: string
          created_at?: string
          google_calendar_id?: string | null
          id?: string
          last_synced_at?: string | null
          sync_enabled?: boolean
        }
        Update: {
          business_id?: string
          created_at?: string
          google_calendar_id?: string | null
          id?: string
          last_synced_at?: string | null
          sync_enabled?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "calendar_connections_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      call_logs: {
        Row: {
          business_id: string
          caller_name: string | null
          caller_number: string | null
          created_at: string
          direction: string
          duration_seconds: number | null
          ended_at: string | null
          id: string
          outcome: string | null
          recording_url: string | null
          started_at: string
          transcript: string | null
        }
        Insert: {
          business_id: string
          caller_name?: string | null
          caller_number?: string | null
          created_at?: string
          direction?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          outcome?: string | null
          recording_url?: string | null
          started_at?: string
          transcript?: string | null
        }
        Update: {
          business_id?: string
          caller_name?: string | null
          caller_number?: string | null
          created_at?: string
          direction?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          outcome?: string | null
          recording_url?: string | null
          started_at?: string
          transcript?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "call_logs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      call_queue: {
        Row: {
          business_id: string
          caller_name: string | null
          caller_number: string | null
          created_at: string
          estimated_wait: number | null
          id: string
          position: number
          status: string
        }
        Insert: {
          business_id: string
          caller_name?: string | null
          caller_number?: string | null
          created_at?: string
          estimated_wait?: number | null
          id?: string
          position?: number
          status?: string
        }
        Update: {
          business_id?: string
          caller_name?: string | null
          caller_number?: string | null
          created_at?: string
          estimated_wait?: number | null
          id?: string
          position?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "call_queue_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      call_routing_rules: {
        Row: {
          action: string
          business_id: string
          condition_type: string
          condition_value: string
          created_at: string
          id: string
          is_active: boolean
          priority: number
          target: string
        }
        Insert: {
          action?: string
          business_id: string
          condition_type?: string
          condition_value?: string
          created_at?: string
          id?: string
          is_active?: boolean
          priority?: number
          target?: string
        }
        Update: {
          action?: string
          business_id?: string
          condition_type?: string
          condition_value?: string
          created_at?: string
          id?: string
          is_active?: boolean
          priority?: number
          target?: string
        }
        Relationships: [
          {
            foreignKeyName: "call_routing_rules_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      call_scores: {
        Row: {
          agent_performance: number
          call_log_id: string
          created_at: string
          customer_satisfaction: number
          id: string
          key_moments: string
          sentiment: string
          summary: string
        }
        Insert: {
          agent_performance?: number
          call_log_id: string
          created_at?: string
          customer_satisfaction?: number
          id?: string
          key_moments?: string
          sentiment?: string
          summary?: string
        }
        Update: {
          agent_performance?: number
          call_log_id?: string
          created_at?: string
          customer_satisfaction?: number
          id?: string
          key_moments?: string
          sentiment?: string
          summary?: string
        }
        Relationships: [
          {
            foreignKeyName: "call_scores_call_log_id_fkey"
            columns: ["call_log_id"]
            isOneToOne: false
            referencedRelation: "call_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_contacts: {
        Row: {
          call_status: string
          called_at: string | null
          campaign_id: string
          contact_id: string
          created_at: string
          duration_seconds: number | null
          id: string
        }
        Insert: {
          call_status?: string
          called_at?: string | null
          campaign_id: string
          contact_id: string
          created_at?: string
          duration_seconds?: number | null
          id?: string
        }
        Update: {
          call_status?: string
          called_at?: string | null
          campaign_id?: string
          contact_id?: string
          created_at?: string
          duration_seconds?: number | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_contacts_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_contacts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          business_id: string
          created_at: string
          id: string
          name: string
          scheduled_at: string | null
          script: string
          status: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          name: string
          scheduled_at?: string | null
          script?: string
          status?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          name?: string
          scheduled_at?: string | null
          script?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          business_id: string
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
        }
        Insert: {
          business_id: string
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          business_id: string | null
          created_at: string
          customer_name: string | null
          duration_seconds: number | null
          ended_at: string | null
          id: string
          started_at: string
          status: string
        }
        Insert: {
          business_id?: string | null
          created_at?: string
          customer_name?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          started_at?: string
          status?: string
        }
        Update: {
          business_id?: string | null
          created_at?: string
          customer_name?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          started_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_profiles: {
        Row: {
          business_id: string
          created_at: string
          email: string | null
          id: string
          last_contact_at: string | null
          name: string
          notes: string
          phone: string | null
          sentiment_score: number | null
          tags: string[]
          total_calls: number
          total_spend: number
        }
        Insert: {
          business_id: string
          created_at?: string
          email?: string | null
          id?: string
          last_contact_at?: string | null
          name?: string
          notes?: string
          phone?: string | null
          sentiment_score?: number | null
          tags?: string[]
          total_calls?: number
          total_spend?: number
        }
        Update: {
          business_id?: string
          created_at?: string
          email?: string | null
          id?: string
          last_contact_at?: string | null
          name?: string
          notes?: string
          phone?: string | null
          sentiment_score?: number | null
          tags?: string[]
          total_calls?: number
          total_spend?: number
        }
        Relationships: [
          {
            foreignKeyName: "customer_profiles_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboard_layouts: {
        Row: {
          created_at: string
          id: string
          layout_json: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          layout_json?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          layout_json?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      industry_templates: {
        Row: {
          created_at: string
          greeting: string
          icon: string
          id: string
          industry: string
          instructions: string
          knowledge_base_template: string
          name: string
          sales_script: string
        }
        Insert: {
          created_at?: string
          greeting?: string
          icon?: string
          id?: string
          industry: string
          instructions?: string
          knowledge_base_template?: string
          name: string
          sales_script?: string
        }
        Update: {
          created_at?: string
          greeting?: string
          icon?: string
          id?: string
          industry?: string
          instructions?: string
          knowledge_base_template?: string
          name?: string
          sales_script?: string
        }
        Relationships: []
      }
      knowledge_base_items: {
        Row: {
          business_id: string
          content: string
          created_at: string
          file_name: string | null
          file_type: string | null
          file_url: string | null
          id: string
          title: string
        }
        Insert: {
          business_id: string
          content?: string
          created_at?: string
          file_name?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          title: string
        }
        Update: {
          business_id?: string
          content?: string
          created_at?: string
          file_name?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_base_items_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      message_templates: {
        Row: {
          business_id: string
          channel: string
          created_at: string
          id: string
          is_active: boolean
          template_text: string
          trigger_event: string
        }
        Insert: {
          business_id: string
          channel?: string
          created_at?: string
          id?: string
          is_active?: boolean
          template_text?: string
          trigger_event?: string
        }
        Update: {
          business_id?: string
          channel?: string
          created_at?: string
          id?: string
          is_active?: boolean
          template_text?: string
          trigger_event?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_templates_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      phone_numbers: {
        Row: {
          business_id: string
          created_at: string
          direction: string
          id: string
          label: string | null
          phone_number: string
          provider: string
          provider_sid: string | null
          status: string
        }
        Insert: {
          business_id: string
          created_at?: string
          direction?: string
          id?: string
          label?: string | null
          phone_number: string
          provider?: string
          provider_sid?: string | null
          status?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          direction?: string
          id?: string
          label?: string | null
          phone_number?: string
          provider?: string
          provider_sid?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "phone_numbers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          business_id: string | null
          conversation_id: string | null
          created_at: string
          date: string
          email: string
          guests: number
          id: string
          name: string
          phone: string | null
          status: string
          time: string
        }
        Insert: {
          business_id?: string | null
          conversation_id?: string | null
          created_at?: string
          date: string
          email: string
          guests?: number
          id?: string
          name: string
          phone?: string | null
          status?: string
          time: string
        }
        Update: {
          business_id?: string | null
          conversation_id?: string | null
          created_at?: string
          date?: string
          email?: string
          guests?: number
          id?: string
          name?: string
          phone?: string | null
          status?: string
          time?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      voicemails: {
        Row: {
          audio_url: string | null
          business_id: string
          caller_name: string | null
          caller_number: string | null
          created_at: string
          id: string
          status: string
          transcription: string
        }
        Insert: {
          audio_url?: string | null
          business_id: string
          caller_name?: string | null
          caller_number?: string | null
          created_at?: string
          id?: string
          status?: string
          transcription?: string
        }
        Update: {
          audio_url?: string | null
          business_id?: string
          caller_name?: string | null
          caller_number?: string | null
          created_at?: string
          id?: string
          status?: string
          transcription?: string
        }
        Relationships: [
          {
            foreignKeyName: "voicemails_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      webhooks: {
        Row: {
          business_id: string
          created_at: string
          event_type: string
          id: string
          is_active: boolean
          last_status_code: number | null
          last_triggered_at: string | null
          secret: string
          target_url: string
        }
        Insert: {
          business_id: string
          created_at?: string
          event_type?: string
          id?: string
          is_active?: boolean
          last_status_code?: number | null
          last_triggered_at?: string | null
          secret?: string
          target_url?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          event_type?: string
          id?: string
          is_active?: boolean
          last_status_code?: number | null
          last_triggered_at?: string | null
          secret?: string
          target_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhooks_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
