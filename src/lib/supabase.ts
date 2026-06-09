import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      leads: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone: string | null;
          company: string | null;
          source: string;
          message: string | null;
          status: string;
          priority: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          phone?: string | null;
          company?: string | null;
          source?: string;
          message?: string | null;
          status?: string;
          priority?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          phone?: string | null;
          company?: string | null;
          source?: string;
          message?: string | null;
          status?: string;
          priority?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      follow_ups: {
        Row: {
          id: string;
          lead_id: string;
          date: string;
          time: string | null;
          note: string | null;
          reminder_sent: boolean;
          completed: boolean;
          created_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          lead_id: string;
          date: string;
          time?: string | null;
          note?: string | null;
          reminder_sent?: boolean;
          completed?: boolean;
          created_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          lead_id?: string;
          date?: string;
          time?: string | null;
          note?: string | null;
          reminder_sent?: boolean;
          completed?: boolean;
          created_at?: string;
          created_by?: string | null;
        };
      };
      notes: {
        Row: {
          id: string;
          lead_id: string;
          content: string;
          created_at: string;
          created_by: string | null;
          created_by_email: string | null;
        };
        Insert: {
          id?: string;
          lead_id: string;
          content: string;
          created_at?: string;
          created_by?: string | null;
          created_by_email?: string | null;
        };
        Update: {
          id?: string;
          lead_id?: string;
          content?: string;
          created_at?: string;
          created_by?: string | null;
          created_by_email?: string | null;
        };
      };
      status_history: {
        Row: {
          id: string;
          lead_id: string;
          old_status: string | null;
          new_status: string;
          changed_at: string;
          changed_by: string | null;
        };
        Insert: {
          id?: string;
          lead_id: string;
          old_status?: string | null;
          new_status: string;
          changed_at?: string;
          changed_by?: string | null;
        };
        Update: {
          id?: string;
          lead_id?: string;
          old_status?: string | null;
          new_status?: string;
          changed_at?: string;
          changed_by?: string | null;
        };
      };
    };
  };
};

export type Lead = Database['public']['Tables']['leads']['Row'];
export type FollowUp = Database['public']['Tables']['follow_ups']['Row'];
export type Note = Database['public']['Tables']['notes']['Row'];
export type StatusHistory = Database['public']['Tables']['status_history']['Row'];

export const LEAD_STATUSES = ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Converted', 'Closed Lost'] as const;
export const LEAD_PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'] as const;
export const LEAD_SOURCES = ['Website', 'Referral', 'Social Media', 'Direct', 'Email Campaign', 'Other'] as const;

export type LeadStatus = typeof LEAD_STATUSES[number];
export type LeadPriority = typeof LEAD_PRIORITIES[number];
export type LeadSource = typeof LEAD_SOURCES[number];
