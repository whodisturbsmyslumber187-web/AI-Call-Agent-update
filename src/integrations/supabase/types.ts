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
      ab_tests: {
        Row: {
          business_id: string
          created_at: string
          ended_at: string | null
          id: string
          name: string
          started_at: string | null
          status: string
          traffic_split: number
          variant_a_instructions: string
          variant_b_instructions: string
          winner: string | null
        }
        Insert: {
          business_id: string
          created_at?: string
          ended_at?: string | null
          id?: string
          name?: string
          started_at?: string | null
          status?: string
          traffic_split?: number
          variant_a_instructions?: string
          variant_b_instructions?: string
          winner?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string
          ended_at?: string | null
          id?: string
          name?: string
          started_at?: string | null
          status?: string
          traffic_split?: number
          variant_a_instructions?: string
          variant_b_instructions?: string
          winner?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ab_tests_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_log: {
        Row: {
          action: string
          business_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json
          user_id: string | null
        }
        Insert: {
          action?: string
          business_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json
          user_id?: string | null
        }
        Update: {
          action?: string
          business_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
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
      api_credentials: {
        Row: {
          created_at: string
          credential_key: string
          credential_value_encrypted: string
          id: string
          is_configured: boolean
          name: string
          provider: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credential_key?: string
          credential_value_encrypted?: string
          id?: string
          is_configured?: boolean
          name?: string
          provider?: string
          user_id: string
        }
        Update: {
          created_at?: string
          credential_key?: string
          credential_value_encrypted?: string
          id?: string
          is_configured?: boolean
          name?: string
          provider?: string
          user_id?: string
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          permissions: Json
          rate_limit: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          permissions?: Json
          rate_limit?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          permissions?: Json
          rate_limit?: number
          user_id?: string
        }
        Relationships: []
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
      bulk_call_entries: {
        Row: {
          attempt_count: number
          business_id: string
          contact_name: string
          contact_phone: string
          created_at: string
          duration_seconds: number | null
          id: string
          job_id: string
          last_attempt_at: string | null
          max_attempts: number
          outcome: string | null
          status: string
          transcript_summary: string | null
        }
        Insert: {
          attempt_count?: number
          business_id: string
          contact_name?: string
          contact_phone?: string
          created_at?: string
          duration_seconds?: number | null
          id?: string
          job_id: string
          last_attempt_at?: string | null
          max_attempts?: number
          outcome?: string | null
          status?: string
          transcript_summary?: string | null
        }
        Update: {
          attempt_count?: number
          business_id?: string
          contact_name?: string
          contact_phone?: string
          created_at?: string
          duration_seconds?: number | null
          id?: string
          job_id?: string
          last_attempt_at?: string | null
          max_attempts?: number
          outcome?: string | null
          status?: string
          transcript_summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bulk_call_entries_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bulk_call_entries_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "bulk_call_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      bulk_call_jobs: {
        Row: {
          business_id: string
          calls_per_minute: number
          campaign_id: string | null
          completed: number
          completed_at: string | null
          concurrency_limit: number
          created_at: string
          failed: number
          id: string
          in_progress: number
          job_type: string
          name: string
          started_at: string | null
          status: string
          total_contacts: number
        }
        Insert: {
          business_id: string
          calls_per_minute?: number
          campaign_id?: string | null
          completed?: number
          completed_at?: string | null
          concurrency_limit?: number
          created_at?: string
          failed?: number
          id?: string
          in_progress?: number
          job_type?: string
          name?: string
          started_at?: string | null
          status?: string
          total_contacts?: number
        }
        Update: {
          business_id?: string
          calls_per_minute?: number
          campaign_id?: string | null
          completed?: number
          completed_at?: string | null
          concurrency_limit?: number
          created_at?: string
          failed?: number
          id?: string
          in_progress?: number
          job_type?: string
          name?: string
          started_at?: string | null
          status?: string
          total_contacts?: number
        }
        Relationships: [
          {
            foreignKeyName: "bulk_call_jobs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bulk_call_jobs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      bulk_marketing_entries: {
        Row: {
          attempt_count: number
          business_id: string
          callback_at: string | null
          contact_name: string
          contact_phone: string
          created_at: string
          delivery_result: string | null
          id: string
          job_id: string
          sms_sid: string | null
          status: string
        }
        Insert: {
          attempt_count?: number
          business_id: string
          callback_at?: string | null
          contact_name?: string
          contact_phone?: string
          created_at?: string
          delivery_result?: string | null
          id?: string
          job_id: string
          sms_sid?: string | null
          status?: string
        }
        Update: {
          attempt_count?: number
          business_id?: string
          callback_at?: string | null
          contact_name?: string
          contact_phone?: string
          created_at?: string
          delivery_result?: string | null
          id?: string
          job_id?: string
          sms_sid?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "bulk_marketing_entries_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bulk_marketing_entries_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "bulk_marketing_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      bulk_marketing_jobs: {
        Row: {
          audio_url: string | null
          business_id: string
          callback_number: string
          caller_id: string
          completed: number
          completed_at: string | null
          concurrency_limit: number
          created_at: string
          failed: number
          id: string
          in_progress: number
          job_type: string
          message_content: string
          name: string
          rate_per_minute: number
          ring_count: number
          scheduled_at: string | null
          started_at: string | null
          status: string
          total_contacts: number
        }
        Insert: {
          audio_url?: string | null
          business_id: string
          callback_number?: string
          caller_id?: string
          completed?: number
          completed_at?: string | null
          concurrency_limit?: number
          created_at?: string
          failed?: number
          id?: string
          in_progress?: number
          job_type?: string
          message_content?: string
          name?: string
          rate_per_minute?: number
          ring_count?: number
          scheduled_at?: string | null
          started_at?: string | null
          status?: string
          total_contacts?: number
        }
        Update: {
          audio_url?: string | null
          business_id?: string
          callback_number?: string
          caller_id?: string
          completed?: number
          completed_at?: string | null
          concurrency_limit?: number
          created_at?: string
          failed?: number
          id?: string
          in_progress?: number
          job_type?: string
          message_content?: string
          name?: string
          rate_per_minute?: number
          ring_count?: number
          scheduled_at?: string | null
          started_at?: string | null
          status?: string
          total_contacts?: number
        }
        Relationships: [
          {
            foreignKeyName: "bulk_marketing_jobs_business_id_fkey"
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
          barge_in_enabled: boolean
          closing_techniques: string
          created_at: string
          default_ivr_menu_id: string | null
          default_language: string
          endpointing_threshold_ms: number
          greeting_audio_url: string | null
          greeting_message: string
          hold_music_url: string | null
          id: string
          industry: string
          instructions: string
          ivr_enabled: boolean
          knowledge_base: string
          livekit_enabled: boolean
          livekit_room_prefix: string | null
          llm_api_endpoint: string | null
          llm_api_key_name: string | null
          llm_model: string
          llm_provider: string
          name: string
          objection_handling: string
          personality_formality: number
          personality_friendliness: number
          personality_humor: number
          personality_urgency: number
          sales_script: string
          status: string
          stt_model: string
          stt_provider: string
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
          voicemail_detection_enabled: boolean
        }
        Insert: {
          agent_mode?: string
          barge_in_enabled?: boolean
          closing_techniques?: string
          created_at?: string
          default_ivr_menu_id?: string | null
          default_language?: string
          endpointing_threshold_ms?: number
          greeting_audio_url?: string | null
          greeting_message?: string
          hold_music_url?: string | null
          id?: string
          industry?: string
          instructions?: string
          ivr_enabled?: boolean
          knowledge_base?: string
          livekit_enabled?: boolean
          livekit_room_prefix?: string | null
          llm_api_endpoint?: string | null
          llm_api_key_name?: string | null
          llm_model?: string
          llm_provider?: string
          name: string
          objection_handling?: string
          personality_formality?: number
          personality_friendliness?: number
          personality_humor?: number
          personality_urgency?: number
          sales_script?: string
          status?: string
          stt_model?: string
          stt_provider?: string
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
          voicemail_detection_enabled?: boolean
        }
        Update: {
          agent_mode?: string
          barge_in_enabled?: boolean
          closing_techniques?: string
          created_at?: string
          default_ivr_menu_id?: string | null
          default_language?: string
          endpointing_threshold_ms?: number
          greeting_audio_url?: string | null
          greeting_message?: string
          hold_music_url?: string | null
          id?: string
          industry?: string
          instructions?: string
          ivr_enabled?: boolean
          knowledge_base?: string
          livekit_enabled?: boolean
          livekit_room_prefix?: string | null
          llm_api_endpoint?: string | null
          llm_api_key_name?: string | null
          llm_model?: string
          llm_provider?: string
          name?: string
          objection_handling?: string
          personality_formality?: number
          personality_friendliness?: number
          personality_humor?: number
          personality_urgency?: number
          sales_script?: string
          status?: string
          stt_model?: string
          stt_provider?: string
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
          voicemail_detection_enabled?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "businesses_default_ivr_menu_id_fkey"
            columns: ["default_ivr_menu_id"]
            isOneToOne: false
            referencedRelation: "ivr_menus"
            referencedColumns: ["id"]
          },
        ]
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
      call_dispositions: {
        Row: {
          business_id: string
          call_log_id: string
          created_at: string
          disposition: string
          id: string
          next_action: string | null
          next_action_date: string | null
          notes: string
        }
        Insert: {
          business_id: string
          call_log_id: string
          created_at?: string
          disposition?: string
          id?: string
          next_action?: string | null
          next_action_date?: string | null
          notes?: string
        }
        Update: {
          business_id?: string
          call_log_id?: string
          created_at?: string
          disposition?: string
          id?: string
          next_action?: string | null
          next_action_date?: string | null
          notes?: string
        }
        Relationships: [
          {
            foreignKeyName: "call_dispositions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_dispositions_call_log_id_fkey"
            columns: ["call_log_id"]
            isOneToOne: false
            referencedRelation: "call_logs"
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
      call_summaries: {
        Row: {
          action_items: Json
          business_id: string
          call_log_id: string
          created_at: string
          id: string
          key_topics: string[]
          summary: string
        }
        Insert: {
          action_items?: Json
          business_id: string
          call_log_id: string
          created_at?: string
          id?: string
          key_topics?: string[]
          summary?: string
        }
        Update: {
          action_items?: Json
          business_id?: string
          call_log_id?: string
          created_at?: string
          id?: string
          key_topics?: string[]
          summary?: string
        }
        Relationships: [
          {
            foreignKeyName: "call_summaries_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_summaries_call_log_id_fkey"
            columns: ["call_log_id"]
            isOneToOne: false
            referencedRelation: "call_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      call_transfers: {
        Row: {
          business_id: string
          call_log_id: string
          completed_at: string | null
          context_summary: string
          created_at: string
          id: string
          initiated_at: string
          status: string
          transfer_to: string
          transfer_type: string
        }
        Insert: {
          business_id: string
          call_log_id: string
          completed_at?: string | null
          context_summary?: string
          created_at?: string
          id?: string
          initiated_at?: string
          status?: string
          transfer_to?: string
          transfer_type?: string
        }
        Update: {
          business_id?: string
          call_log_id?: string
          completed_at?: string | null
          context_summary?: string
          created_at?: string
          id?: string
          initiated_at?: string
          status?: string
          transfer_to?: string
          transfer_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "call_transfers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_transfers_call_log_id_fkey"
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
          calls_per_minute: number
          campaign_type: string
          concurrency_limit: number
          created_at: string
          id: string
          max_retries: number
          name: string
          retry_delay_minutes: number
          scheduled_at: string | null
          script: string
          status: string
        }
        Insert: {
          business_id: string
          calls_per_minute?: number
          campaign_type?: string
          concurrency_limit?: number
          created_at?: string
          id?: string
          max_retries?: number
          name: string
          retry_delay_minutes?: number
          scheduled_at?: string | null
          script?: string
          status?: string
        }
        Update: {
          business_id?: string
          calls_per_minute?: number
          campaign_type?: string
          concurrency_limit?: number
          created_at?: string
          id?: string
          max_retries?: number
          name?: string
          retry_delay_minutes?: number
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
      competitor_mentions: {
        Row: {
          business_id: string
          call_log_id: string | null
          competitor_name: string
          context: string
          created_at: string
          id: string
        }
        Insert: {
          business_id: string
          call_log_id?: string | null
          competitor_name?: string
          context?: string
          created_at?: string
          id?: string
        }
        Update: {
          business_id?: string
          call_log_id?: string | null
          competitor_name?: string
          context?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "competitor_mentions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competitor_mentions_call_log_id_fkey"
            columns: ["call_log_id"]
            isOneToOne: false
            referencedRelation: "call_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_segments: {
        Row: {
          business_id: string
          created_at: string
          filter_criteria: Json
          id: string
          name: string
        }
        Insert: {
          business_id: string
          created_at?: string
          filter_criteria?: Json
          id?: string
          name?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          filter_criteria?: Json
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_segments_business_id_fkey"
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
          lead_intent: string
          lead_score: number
          lead_status: string
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
          lead_intent?: string
          lead_score?: number
          lead_status?: string
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
          lead_intent?: string
          lead_score?: number
          lead_status?: string
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
      dnc_list: {
        Row: {
          added_at: string
          business_id: string
          id: string
          phone_number: string
          reason: string
        }
        Insert: {
          added_at?: string
          business_id: string
          id?: string
          phone_number: string
          reason?: string
        }
        Update: {
          added_at?: string
          business_id?: string
          id?: string
          phone_number?: string
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "dnc_list_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      inbound_capacity_config: {
        Row: {
          auto_scale: boolean
          business_id: string
          created_at: string
          id: string
          max_concurrent_calls: number
          overflow_action: string
          overflow_target: string
        }
        Insert: {
          auto_scale?: boolean
          business_id: string
          created_at?: string
          id?: string
          max_concurrent_calls?: number
          overflow_action?: string
          overflow_target?: string
        }
        Update: {
          auto_scale?: boolean
          business_id?: string
          created_at?: string
          id?: string
          max_concurrent_calls?: number
          overflow_action?: string
          overflow_target?: string
        }
        Relationships: [
          {
            foreignKeyName: "inbound_capacity_config_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
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
      ivr_menus: {
        Row: {
          business_id: string
          created_at: string
          fallback_action: string
          fallback_target: string | null
          greeting_audio_url: string | null
          greeting_text: string
          id: string
          is_active: boolean
          max_retries: number
          name: string
          template_type: string
          timeout_seconds: number
        }
        Insert: {
          business_id: string
          created_at?: string
          fallback_action?: string
          fallback_target?: string | null
          greeting_audio_url?: string | null
          greeting_text?: string
          id?: string
          is_active?: boolean
          max_retries?: number
          name?: string
          template_type?: string
          timeout_seconds?: number
        }
        Update: {
          business_id?: string
          created_at?: string
          fallback_action?: string
          fallback_target?: string | null
          greeting_audio_url?: string | null
          greeting_text?: string
          id?: string
          is_active?: boolean
          max_retries?: number
          name?: string
          template_type?: string
          timeout_seconds?: number
        }
        Relationships: [
          {
            foreignKeyName: "ivr_menus_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      ivr_options: {
        Row: {
          action: string
          agent_instructions: string | null
          business_id: string
          created_at: string
          digit: string
          id: string
          is_active: boolean
          ivr_menu_id: string
          label: string
          mask_caller_id: boolean
          priority: number
          record_call: boolean
          target_phone: string | null
        }
        Insert: {
          action?: string
          agent_instructions?: string | null
          business_id: string
          created_at?: string
          digit?: string
          id?: string
          is_active?: boolean
          ivr_menu_id: string
          label?: string
          mask_caller_id?: boolean
          priority?: number
          record_call?: boolean
          target_phone?: string | null
        }
        Update: {
          action?: string
          agent_instructions?: string | null
          business_id?: string
          created_at?: string
          digit?: string
          id?: string
          is_active?: boolean
          ivr_menu_id?: string
          label?: string
          mask_caller_id?: boolean
          priority?: number
          record_call?: boolean
          target_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ivr_options_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ivr_options_ivr_menu_id_fkey"
            columns: ["ivr_menu_id"]
            isOneToOne: false
            referencedRelation: "ivr_menus"
            referencedColumns: ["id"]
          },
        ]
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
      number_assignments: {
        Row: {
          business_id: string
          created_at: string
          forward_to_phone: string | null
          handler_name: string | null
          handler_type: string
          id: string
          ivr_menu_id: string | null
          mask_caller_id: boolean
          monitor_enabled: boolean
          phone_number_id: string
          record_calls: boolean
        }
        Insert: {
          business_id: string
          created_at?: string
          forward_to_phone?: string | null
          handler_name?: string | null
          handler_type?: string
          id?: string
          ivr_menu_id?: string | null
          mask_caller_id?: boolean
          monitor_enabled?: boolean
          phone_number_id: string
          record_calls?: boolean
        }
        Update: {
          business_id?: string
          created_at?: string
          forward_to_phone?: string | null
          handler_name?: string | null
          handler_type?: string
          id?: string
          ivr_menu_id?: string | null
          mask_caller_id?: boolean
          monitor_enabled?: boolean
          phone_number_id?: string
          record_calls?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "number_assignments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "number_assignments_ivr_menu_id_fkey"
            columns: ["ivr_menu_id"]
            isOneToOne: false
            referencedRelation: "ivr_menus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "number_assignments_phone_number_id_fkey"
            columns: ["phone_number_id"]
            isOneToOne: true
            referencedRelation: "phone_numbers"
            referencedColumns: ["id"]
          },
        ]
      }
      phone_numbers: {
        Row: {
          assigned_handler_name: string | null
          assigned_handler_type: string
          business_id: string
          created_at: string
          direction: string
          forward_to_phone: string | null
          id: string
          ivr_menu_id: string | null
          label: string | null
          mask_caller_id: boolean
          phone_number: string
          provider: string
          provider_sid: string | null
          record_calls: boolean
          status: string
        }
        Insert: {
          assigned_handler_name?: string | null
          assigned_handler_type?: string
          business_id: string
          created_at?: string
          direction?: string
          forward_to_phone?: string | null
          id?: string
          ivr_menu_id?: string | null
          label?: string | null
          mask_caller_id?: boolean
          phone_number: string
          provider?: string
          provider_sid?: string | null
          record_calls?: boolean
          status?: string
        }
        Update: {
          assigned_handler_name?: string | null
          assigned_handler_type?: string
          business_id?: string
          created_at?: string
          direction?: string
          forward_to_phone?: string | null
          id?: string
          ivr_menu_id?: string | null
          label?: string | null
          mask_caller_id?: boolean
          phone_number?: string
          provider?: string
          provider_sid?: string | null
          record_calls?: boolean
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
          {
            foreignKeyName: "phone_numbers_ivr_menu_id_fkey"
            columns: ["ivr_menu_id"]
            isOneToOne: false
            referencedRelation: "ivr_menus"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          created_at: string
          id: string
          setting_key: string
          setting_value: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          setting_key: string
          setting_value?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          setting_key?: string
          setting_value?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      provider_failover_config: {
        Row: {
          backup_provider: string
          business_id: string
          created_at: string
          current_failure_count: number
          id: string
          is_failed_over: boolean
          max_failures_before_switch: number
          primary_provider: string
        }
        Insert: {
          backup_provider?: string
          business_id: string
          created_at?: string
          current_failure_count?: number
          id?: string
          is_failed_over?: boolean
          max_failures_before_switch?: number
          primary_provider?: string
        }
        Update: {
          backup_provider?: string
          business_id?: string
          created_at?: string
          current_failure_count?: number
          id?: string
          is_failed_over?: boolean
          max_failures_before_switch?: number
          primary_provider?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_failover_config_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
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
      revenue_entries: {
        Row: {
          amount: number
          business_id: string
          created_at: string
          description: string
          entry_date: string
          id: string
          source: string
        }
        Insert: {
          amount?: number
          business_id: string
          created_at?: string
          description?: string
          entry_date?: string
          id?: string
          source?: string
        }
        Update: {
          amount?: number
          business_id?: string
          created_at?: string
          description?: string
          entry_date?: string
          id?: string
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "revenue_entries_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_reports: {
        Row: {
          created_at: string
          frequency: string
          id: string
          is_active: boolean
          last_sent_at: string | null
          recipients: string[]
          report_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          frequency?: string
          id?: string
          is_active?: boolean
          last_sent_at?: string | null
          recipients?: string[]
          report_type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          frequency?: string
          id?: string
          is_active?: boolean
          last_sent_at?: string | null
          recipients?: string[]
          report_type?: string
          user_id?: string
        }
        Relationships: []
      }
      sla_alerts: {
        Row: {
          acknowledged: boolean
          alert_type: string
          business_id: string
          created_at: string
          id: string
          message: string
          sla_rule_id: string
        }
        Insert: {
          acknowledged?: boolean
          alert_type?: string
          business_id: string
          created_at?: string
          id?: string
          message?: string
          sla_rule_id: string
        }
        Update: {
          acknowledged?: boolean
          alert_type?: string
          business_id?: string
          created_at?: string
          id?: string
          message?: string
          sla_rule_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sla_alerts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sla_alerts_sla_rule_id_fkey"
            columns: ["sla_rule_id"]
            isOneToOne: false
            referencedRelation: "sla_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      sla_rules: {
        Row: {
          business_id: string
          created_at: string
          id: string
          is_active: boolean
          rule_type: string
          threshold_value: number
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          rule_type?: string
          threshold_value?: number
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          rule_type?: string
          threshold_value?: number
        }
        Relationships: [
          {
            foreignKeyName: "sla_rules_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_templates: {
        Row: {
          body: string
          business_id: string
          category: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          variables: Json
        }
        Insert: {
          body?: string
          business_id: string
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          variables?: Json
        }
        Update: {
          body?: string
          business_id?: string
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          variables?: Json
        }
        Relationships: [
          {
            foreignKeyName: "sms_templates_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      telegram_commands_log: {
        Row: {
          command: string
          created_at: string
          id: string
          response_summary: string
          user_id: string
        }
        Insert: {
          command?: string
          created_at?: string
          id?: string
          response_summary?: string
          user_id: string
        }
        Update: {
          command?: string
          created_at?: string
          id?: string
          response_summary?: string
          user_id?: string
        }
        Relationships: []
      }
      telegram_config: {
        Row: {
          bot_token_secret_name: string
          chat_id: string
          created_at: string
          id: string
          is_active: boolean
          notifications: Json
          user_id: string
        }
        Insert: {
          bot_token_secret_name?: string
          chat_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          notifications?: Json
          user_id: string
        }
        Update: {
          bot_token_secret_name?: string
          chat_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          notifications?: Json
          user_id?: string
        }
        Relationships: []
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
