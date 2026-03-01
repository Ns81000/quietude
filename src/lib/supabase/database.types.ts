export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          study_field: string | null;
          learn_style: string | null;
          study_time: string | null;
          is_onboarded: boolean;
          theme_mood: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name?: string | null;
          study_field?: string | null;
          learn_style?: string | null;
          study_time?: string | null;
          is_onboarded?: boolean;
          theme_mood?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          study_field?: string | null;
          learn_style?: string | null;
          study_time?: string | null;
          is_onboarded?: boolean;
          theme_mood?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      otp_codes: {
        Row: {
          id: string;
          email: string;
          code_hash: string;
          expires_at: string;
          verified: boolean;
          attempts: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          code_hash: string;
          expires_at: string;
          verified?: boolean;
          attempts?: number;
          created_at?: string;
        };
        Update: {
          verified?: boolean;
          attempts?: number;
        };
        Relationships: [];
      };
      learning_paths: {
        Row: {
          id: string;
          user_id: string;
          title: string | null;
          subject: string;
          education_level: string | null;
          topic_type: string | null;
          source_type: string | null;
          source_url: string | null;
          source_text: string | null;
          source_file_name: string | null;
          topic_map: Json | null;
          topics: Json | null;
          needs_study_plan: boolean;
          status: string;
          current_topic_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          user_id: string;
          title?: string | null;
          subject: string;
          education_level?: string | null;
          topic_type?: string | null;
          source_type?: string | null;
          source_url?: string | null;
          source_text?: string | null;
          source_file_name?: string | null;
          topic_map?: Json | null;
          topics?: Json | null;
          needs_study_plan?: boolean;
          status?: string;
          current_topic_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string | null;
          subject?: string;
          education_level?: string | null;
          topic_type?: string | null;
          source_type?: string | null;
          source_url?: string | null;
          source_text?: string | null;
          source_file_name?: string | null;
          topic_map?: Json | null;
          topics?: Json | null;
          needs_study_plan?: boolean;
          status?: string;
          current_topic_id?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      quiz_sessions: {
        Row: {
          id: string;
          user_id: string;
          topic_id: string;
          path_id: string;
          subject: string | null;
          is_dig_deeper: boolean;
          is_retake: boolean;
          config: Json;
          questions: Json;
          answers: Json;
          score: number | null;
          total: number;
          score_pct: number | null;
          passed: boolean | null;
          started_at: string;
          submitted_at: string | null;
          time_taken_secs: number | null;
          created_at: string;
        };
        Insert: {
          id: string;
          user_id: string;
          topic_id: string;
          path_id: string;
          subject?: string | null;
          is_dig_deeper?: boolean;
          is_retake?: boolean;
          config: Json;
          questions: Json;
          answers?: Json;
          score?: number | null;
          total: number;
          score_pct?: number | null;
          passed?: boolean | null;
          started_at: string;
          submitted_at?: string | null;
          time_taken_secs?: number | null;
          created_at?: string;
        };
        Update: {
          answers?: Json;
          score?: number | null;
          score_pct?: number | null;
          passed?: boolean | null;
          submitted_at?: string | null;
          time_taken_secs?: number | null;
        };
        Relationships: [];
      };
      notes: {
        Row: {
          id: string;
          user_id: string;
          topic_id: string;
          topic_title: string;
          subject: string;
          content_html: string;
          session_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          user_id: string;
          topic_id: string;
          topic_title: string;
          subject: string;
          content_html: string;
          session_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          content_html?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_sessions: {
        Row: {
          id: string;
          user_id: string;
          session_token: string;
          expires_at: string;
          device_info: string | null;
          created_at: string;
          last_active_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          session_token: string;
          expires_at: string;
          device_info?: string | null;
          created_at?: string;
          last_active_at?: string;
        };
        Update: {
          expires_at?: string;
          last_active_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type LearningPath = Database['public']['Tables']['learning_paths']['Row'];
export type QuizSession = Database['public']['Tables']['quiz_sessions']['Row'];
export type Note = Database['public']['Tables']['notes']['Row'];
export type UserSession = Database['public']['Tables']['user_sessions']['Row'];
