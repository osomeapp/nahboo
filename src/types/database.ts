// Database Types for Supabase Integration
// Auto-generated and maintained TypeScript types for enterprise-scale database

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      analytics_events: {
        Row: {
          id: string
          user_id: string | null
          session_id: string
          event_name: string
          properties: Json
          page_url: string | null
          referrer: string | null
          device_info: Json
          experiment_ids: string[]
          variant_ids: string[]
          country_code: string | null
          region: string | null
          city: string | null
          created_at: string
          partition_date: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          session_id: string
          event_name: string
          properties?: Json
          page_url?: string | null
          referrer?: string | null
          device_info?: Json
          experiment_ids?: string[]
          variant_ids?: string[]
          country_code?: string | null
          region?: string | null
          city?: string | null
          created_at?: string
          partition_date?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          session_id?: string
          event_name?: string
          properties?: Json
          page_url?: string | null
          referrer?: string | null
          device_info?: Json
          experiment_ids?: string[]
          variant_ids?: string[]
          country_code?: string | null
          region?: string | null
          city?: string | null
          created_at?: string
          partition_date?: string
        }
      }
      audit_log: {
        Row: {
          id: string
          table_name: string
          operation: 'INSERT' | 'UPDATE' | 'DELETE'
          user_id: string | null
          old_data: Json | null
          new_data: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          table_name: string
          operation: 'INSERT' | 'UPDATE' | 'DELETE'
          user_id?: string | null
          old_data?: Json | null
          new_data?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          table_name?: string
          operation?: 'INSERT' | 'UPDATE' | 'DELETE'
          user_id?: string | null
          old_data?: Json | null
          new_data?: Json | null
          created_at?: string
        }
      }
      content: {
        Row: {
          id: string
          title: string
          description: string | null
          content_type: 'video' | 'quiz' | 'link' | 'ai_lesson' | 'interactive' | 'text'
          difficulty_level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
          metadata: Json
          subject: string
          tags: string[]
          age_groups: string[]
          status: 'draft' | 'published' | 'archived' | 'flagged'
          published_at: string | null
          ai_generated: boolean
          ai_tutor_id: string | null
          source_prompt: string | null
          created_by: string | null
          organization_id: string | null
          view_count: number
          like_count: number
          completion_rate: number
          average_rating: number
          created_at: string
          updated_at: string
          shard_key: number
          partition_date: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          content_type: 'video' | 'quiz' | 'link' | 'ai_lesson' | 'interactive' | 'text'
          difficulty_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert'
          metadata?: Json
          subject: string
          tags?: string[]
          age_groups?: string[]
          status?: 'draft' | 'published' | 'archived' | 'flagged'
          published_at?: string | null
          ai_generated?: boolean
          ai_tutor_id?: string | null
          source_prompt?: string | null
          created_by?: string | null
          organization_id?: string | null
          view_count?: number
          like_count?: number
          completion_rate?: number
          average_rating?: number
          created_at?: string
          updated_at?: string
          shard_key?: number
          partition_date?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          content_type?: 'video' | 'quiz' | 'link' | 'ai_lesson' | 'interactive' | 'text'
          difficulty_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert'
          metadata?: Json
          subject?: string
          tags?: string[]
          age_groups?: string[]
          status?: 'draft' | 'published' | 'archived' | 'flagged'
          published_at?: string | null
          ai_generated?: boolean
          ai_tutor_id?: string | null
          source_prompt?: string | null
          created_by?: string | null
          organization_id?: string | null
          view_count?: number
          like_count?: number
          completion_rate?: number
          average_rating?: number
          created_at?: string
          updated_at?: string
          shard_key?: number
          partition_date?: string
        }
      }
      interactions: {
        Row: {
          id: string
          user_id: string
          content_id: string
          interaction_type: 'view' | 'like' | 'share' | 'complete' | 'start' | 'pause' | 'resume' | 'quiz_attempt' | 'ai_feedback'
          session_id: string
          device_type: 'web' | 'mobile' | 'tablet'
          user_agent: string | null
          time_spent: number
          progress_percentage: number
          interaction_data: Json
          subject: string | null
          difficulty_level: string | null
          created_at: string
          shard_key: number | null
          partition_date: string
        }
        Insert: {
          id?: string
          user_id: string
          content_id: string
          interaction_type: 'view' | 'like' | 'share' | 'complete' | 'start' | 'pause' | 'resume' | 'quiz_attempt' | 'ai_feedback'
          session_id: string
          device_type?: 'web' | 'mobile' | 'tablet'
          user_agent?: string | null
          time_spent?: number
          progress_percentage?: number
          interaction_data?: Json
          subject?: string | null
          difficulty_level?: string | null
          created_at?: string
          shard_key?: number | null
          partition_date?: string
        }
        Update: {
          id?: string
          user_id?: string
          content_id?: string
          interaction_type?: 'view' | 'like' | 'share' | 'complete' | 'start' | 'pause' | 'resume' | 'quiz_attempt' | 'ai_feedback'
          session_id?: string
          device_type?: 'web' | 'mobile' | 'tablet'
          user_agent?: string | null
          time_spent?: number
          progress_percentage?: number
          interaction_data?: Json
          subject?: string | null
          difficulty_level?: string | null
          created_at?: string
          shard_key?: number | null
          partition_date?: string
        }
      }
      learning_paths: {
        Row: {
          id: string
          title: string
          description: string | null
          subject: string
          difficulty_level: string
          estimated_duration: number | null
          content_sequence: string[]
          prerequisites: string[]
          ai_generated: boolean
          ai_prompt: string | null
          personalization_data: Json
          target_age_groups: string[]
          target_use_cases: string[]
          created_by: string | null
          organization_id: string | null
          status: 'draft' | 'published' | 'archived'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          subject: string
          difficulty_level?: string
          estimated_duration?: number | null
          content_sequence?: string[]
          prerequisites?: string[]
          ai_generated?: boolean
          ai_prompt?: string | null
          personalization_data?: Json
          target_age_groups?: string[]
          target_use_cases?: string[]
          created_by?: string | null
          organization_id?: string | null
          status?: 'draft' | 'published' | 'archived'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          subject?: string
          difficulty_level?: string
          estimated_duration?: number | null
          content_sequence?: string[]
          prerequisites?: string[]
          ai_generated?: boolean
          ai_prompt?: string | null
          personalization_data?: Json
          target_age_groups?: string[]
          target_use_cases?: string[]
          created_by?: string | null
          organization_id?: string | null
          status?: 'draft' | 'published' | 'archived'
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: 'achievement' | 'reminder' | 'system' | 'ai_recommendation' | 'social'
          title: string
          message: string
          related_content_id: string | null
          related_path_id: string | null
          action_url: string | null
          channels: string[]
          priority: 'low' | 'medium' | 'high' | 'urgent'
          is_read: boolean
          is_sent: boolean
          sent_at: string | null
          created_at: string
          expires_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          type: 'achievement' | 'reminder' | 'system' | 'ai_recommendation' | 'social'
          title: string
          message: string
          related_content_id?: string | null
          related_path_id?: string | null
          action_url?: string | null
          channels?: string[]
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          is_read?: boolean
          is_sent?: boolean
          sent_at?: string | null
          created_at?: string
          expires_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'achievement' | 'reminder' | 'system' | 'ai_recommendation' | 'social'
          title?: string
          message?: string
          related_content_id?: string | null
          related_path_id?: string | null
          action_url?: string | null
          channels?: string[]
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          is_read?: boolean
          is_sent?: boolean
          sent_at?: string | null
          created_at?: string
          expires_at?: string | null
        }
      }
      organizations: {
        Row: {
          id: string
          name: string
          type: 'school' | 'university' | 'company' | 'nonprofit' | null
          domain: string | null
          settings: Json
          plan: 'free' | 'basic' | 'pro' | 'enterprise'
          max_users: number
          billing_email: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          type?: 'school' | 'university' | 'company' | 'nonprofit' | null
          domain?: string | null
          settings?: Json
          plan?: 'free' | 'basic' | 'pro' | 'enterprise'
          max_users?: number
          billing_email?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          type?: 'school' | 'university' | 'company' | 'nonprofit' | null
          domain?: string | null
          settings?: Json
          plan?: 'free' | 'basic' | 'pro' | 'enterprise'
          max_users?: number
          billing_email?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      profiles: {
        Row: {
          id: string
          name: string
          email: string
          avatar_url: string | null
          created_at: string
          updated_at: string
          subjects: string[]
          level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
          age_group: 'child' | 'teen' | 'adult' | 'senior'
          use_case: 'student' | 'employee' | 'personal' | 'teacher'
          language: string
          timezone: string
          total_study_time: number
          streak_days: number
          last_active: string | null
          organization_id: string | null
          role: 'student' | 'teacher' | 'admin' | 'super_admin'
          is_verified: boolean
          is_blocked: boolean
          parental_consent: boolean
          shard_key: number
        }
        Insert: {
          id: string
          name: string
          email: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
          subjects?: string[]
          level?: 'beginner' | 'intermediate' | 'advanced' | 'expert'
          age_group?: 'child' | 'teen' | 'adult' | 'senior'
          use_case?: 'student' | 'employee' | 'personal' | 'teacher'
          language?: string
          timezone?: string
          total_study_time?: number
          streak_days?: number
          last_active?: string | null
          organization_id?: string | null
          role?: 'student' | 'teacher' | 'admin' | 'super_admin'
          is_verified?: boolean
          is_blocked?: boolean
          parental_consent?: boolean
          shard_key?: number
        }
        Update: {
          id?: string
          name?: string
          email?: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
          subjects?: string[]
          level?: 'beginner' | 'intermediate' | 'advanced' | 'expert'
          age_group?: 'child' | 'teen' | 'adult' | 'senior'
          use_case?: 'student' | 'employee' | 'personal' | 'teacher'
          language?: string
          timezone?: string
          total_study_time?: number
          streak_days?: number
          last_active?: string | null
          organization_id?: string | null
          role?: 'student' | 'teacher' | 'admin' | 'super_admin'
          is_verified?: boolean
          is_blocked?: boolean
          parental_consent?: boolean
          shard_key?: number
        }
      }
      user_progress: {
        Row: {
          id: string
          user_id: string
          content_id: string | null
          learning_path_id: string | null
          status: 'not_started' | 'in_progress' | 'completed' | 'skipped'
          progress_percentage: number
          time_spent: number
          quiz_scores: Json
          best_score: number
          attempts_count: number
          ai_feedback: Json
          personalized_notes: string | null
          started_at: string | null
          completed_at: string | null
          last_accessed: string
        }
        Insert: {
          id?: string
          user_id: string
          content_id?: string | null
          learning_path_id?: string | null
          status?: 'not_started' | 'in_progress' | 'completed' | 'skipped'
          progress_percentage?: number
          time_spent?: number
          quiz_scores?: Json
          best_score?: number
          attempts_count?: number
          ai_feedback?: Json
          personalized_notes?: string | null
          started_at?: string | null
          completed_at?: string | null
          last_accessed?: string
        }
        Update: {
          id?: string
          user_id?: string
          content_id?: string | null
          learning_path_id?: string | null
          status?: 'not_started' | 'in_progress' | 'completed' | 'skipped'
          progress_percentage?: number
          time_spent?: number
          quiz_scores?: Json
          best_score?: number
          attempts_count?: number
          ai_feedback?: Json
          personalized_notes?: string | null
          started_at?: string | null
          completed_at?: string | null
          last_accessed?: string
        }
      }
    }
    Views: {
      content_performance_by_subject: {
        Row: {
          subject: string | null
          difficulty_level: string | null
          total_content: number | null
          avg_views: number | null
          avg_likes: number | null
          avg_completion_rate: number | null
          avg_rating: number | null
          total_views: number | null
          total_likes: number | null
        }
        Insert: {
          subject?: string | null
          difficulty_level?: string | null
          total_content?: number | null
          avg_views?: number | null
          avg_likes?: number | null
          avg_completion_rate?: number | null
          avg_rating?: number | null
          total_views?: number | null
          total_likes?: number | null
        }
        Update: {
          subject?: string | null
          difficulty_level?: string | null
          total_content?: number | null
          avg_views?: number | null
          avg_likes?: number | null
          avg_completion_rate?: number | null
          avg_rating?: number | null
          total_views?: number | null
          total_likes?: number | null
        }
      }
      popular_content: {
        Row: {
          id: string | null
          title: string | null
          description: string | null
          content_type: string | null
          subject: string | null
          difficulty_level: string | null
          view_count: number | null
          like_count: number | null
          completion_rate: number | null
          average_rating: number | null
          created_at: string | null
          published_at: string | null
          popularity_score: number | null
          trending_score: number | null
        }
        Insert: {
          id?: string | null
          title?: string | null
          description?: string | null
          content_type?: string | null
          subject?: string | null
          difficulty_level?: string | null
          view_count?: number | null
          like_count?: number | null
          completion_rate?: number | null
          average_rating?: number | null
          created_at?: string | null
          published_at?: string | null
          popularity_score?: number | null
          trending_score?: number | null
        }
        Update: {
          id?: string | null
          title?: string | null
          description?: string | null
          content_type?: string | null
          subject?: string | null
          difficulty_level?: string | null
          view_count?: number | null
          like_count?: number | null
          completion_rate?: number | null
          average_rating?: number | null
          created_at?: string | null
          published_at?: string | null
          popularity_score?: number | null
          trending_score?: number | null
        }
      }
      user_engagement_summary: {
        Row: {
          user_id: string | null
          name: string | null
          subjects: string[] | null
          level: string | null
          age_group: string | null
          content_viewed: number | null
          content_completed: number | null
          avg_time_spent: number | null
          last_interaction: string | null
          active_days_last_30: number | null
          engagement_score: number | null
        }
        Insert: {
          user_id?: string | null
          name?: string | null
          subjects?: string[] | null
          level?: string | null
          age_group?: string | null
          content_viewed?: number | null
          content_completed?: number | null
          avg_time_spent?: number | null
          last_interaction?: string | null
          active_days_last_30?: number | null
          engagement_score?: number | null
        }
        Update: {
          user_id?: string | null
          name?: string | null
          subjects?: string[] | null
          level?: string | null
          age_group?: string | null
          content_viewed?: number | null
          content_completed?: number | null
          avg_time_spent?: number | null
          last_interaction?: string | null
          active_days_last_30?: number | null
          engagement_score?: number | null
        }
      }
    }
    Functions: {
      batch_update_progress: {
        Args: {
          updates: Json[]
        }
        Returns: number
      }
      check_child_protection: {
        Args: {
          target_user_id: string
        }
        Returns: boolean
      }
      cleanup_old_data: {
        Args: {
          days_to_keep?: number
        }
        Returns: string
      }
      get_personalized_recommendations: {
        Args: {
          target_user_id: string
          content_limit?: number
          diversity_factor?: number
        }
        Returns: {
          content_id: string
          title: string
          content_type: string
          subject: string
          difficulty_level: string
          relevance_score: number
          reason: string
        }[]
      }
      get_trending_content: {
        Args: {
          target_subject?: string
          days_back?: number
          result_limit?: number
        }
        Returns: {
          content_id: string
          title: string
          content_type: string
          subject: string
          trending_score: number
          view_growth: number
        }[]
      }
      get_user_analytics: {
        Args: {
          target_user_id: string
          days_back?: number
        }
        Returns: Json
      }
      refresh_analytics_views: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      search_content: {
        Args: {
          search_query: string
          subject_filter?: string
          difficulty_filter?: string
          content_type_filter?: string
          result_limit?: number
        }
        Returns: {
          content_id: string
          title: string
          description: string
          content_type: string
          subject: string
          difficulty_level: string
          search_rank: number
          popularity_score: number
        }[]
      }
      update_content_metrics: {
        Args: {
          content_uuid: string
        }
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