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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      checklist_template_items: {
        Row: {
          assignee_type: string | null
          created_at: string
          due_offset_anchor: string | null
          due_offset_days: number | null
          id: string
          label: string
          section: string
          sort_order: number
          template_id: string
          updated_at: string
          vendor_category: string | null
        }
        Insert: {
          assignee_type?: string | null
          created_at?: string
          due_offset_anchor?: string | null
          due_offset_days?: number | null
          id?: string
          label: string
          section?: string
          sort_order?: number
          template_id: string
          updated_at?: string
          vendor_category?: string | null
        }
        Update: {
          assignee_type?: string | null
          created_at?: string
          due_offset_anchor?: string | null
          due_offset_days?: number | null
          id?: string
          label?: string
          section?: string
          sort_order?: number
          template_id?: string
          updated_at?: string
          vendor_category?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checklist_template_items_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "checklist_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_templates: {
        Row: {
          created_at: string
          id: string
          is_default: boolean
          name: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean
          name: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean
          name?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      coaching_episodes: {
        Row: {
          created_at: string
          duration_seconds: number
          episode_number: number
          id: string
          key_takeaway: string | null
          media_path: string | null
          media_type: string
          title: string
          topic_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          duration_seconds?: number
          episode_number?: number
          id?: string
          key_takeaway?: string | null
          media_path?: string | null
          media_type: string
          title: string
          topic_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number
          episode_number?: number
          id?: string
          key_takeaway?: string | null
          media_path?: string | null
          media_type?: string
          title?: string
          topic_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coaching_episodes_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "coaching_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      coaching_progress: {
        Row: {
          completed: boolean
          created_at: string
          episode_id: string
          id: string
          last_position_seconds: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          episode_id: string
          id?: string
          last_position_seconds?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          episode_id?: string
          id?: string
          last_position_seconds?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coaching_progress_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "coaching_episodes"
            referencedColumns: ["id"]
          },
        ]
      }
      coaching_topics: {
        Row: {
          created_at: string
          description: string | null
          id: string
          sort_order: number
          thumbnail_path: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          sort_order?: number
          thumbnail_path?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          sort_order?: number
          thumbnail_path?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          company: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          role_label: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          role_label?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          role_label?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      listing_checklist_items: {
        Row: {
          assignee_type: string | null
          completed_at: string | null
          created_at: string
          done: boolean
          due_date: string | null
          id: string
          label: string
          listing_id: string
          section: string
          sort_order: number
          updated_at: string
          user_id: string
          vendor_id: string | null
        }
        Insert: {
          assignee_type?: string | null
          completed_at?: string | null
          created_at?: string
          done?: boolean
          due_date?: string | null
          id?: string
          label: string
          listing_id: string
          section?: string
          sort_order?: number
          updated_at?: string
          user_id: string
          vendor_id?: string | null
        }
        Update: {
          assignee_type?: string | null
          completed_at?: string | null
          created_at?: string
          done?: boolean
          due_date?: string | null
          id?: string
          label?: string
          listing_id?: string
          section?: string
          sort_order?: number
          updated_at?: string
          user_id?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "listing_checklist_items_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_checklist_items_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          address: string
          assigned_to: string | null
          bathrooms: number | null
          bedrooms: number | null
          city: string | null
          created_at: string
          description: string | null
          expiration_date: string | null
          features: string[] | null
          garage_spaces: number | null
          id: string
          listing_date: string | null
          listing_type: Database["public"]["Enums"]["listing_type"]
          lot_size: string | null
          mls_number: string | null
          notes: string | null
          price: number | null
          property_type: string | null
          seller_name: string | null
          sqft: number | null
          state: string | null
          status: Database["public"]["Enums"]["listing_status"]
          updated_at: string
          user_id: string
          year_built: number | null
          zip: string | null
        }
        Insert: {
          address: string
          assigned_to?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          city?: string | null
          created_at?: string
          description?: string | null
          expiration_date?: string | null
          features?: string[] | null
          garage_spaces?: number | null
          id?: string
          listing_date?: string | null
          listing_type?: Database["public"]["Enums"]["listing_type"]
          lot_size?: string | null
          mls_number?: string | null
          notes?: string | null
          price?: number | null
          property_type?: string | null
          seller_name?: string | null
          sqft?: number | null
          state?: string | null
          status?: Database["public"]["Enums"]["listing_status"]
          updated_at?: string
          user_id: string
          year_built?: number | null
          zip?: string | null
        }
        Update: {
          address?: string
          assigned_to?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          city?: string | null
          created_at?: string
          description?: string | null
          expiration_date?: string | null
          features?: string[] | null
          garage_spaces?: number | null
          id?: string
          listing_date?: string | null
          listing_type?: Database["public"]["Enums"]["listing_type"]
          lot_size?: string | null
          mls_number?: string | null
          notes?: string | null
          price?: number | null
          property_type?: string | null
          seller_name?: string | null
          sqft?: number | null
          state?: string | null
          status?: Database["public"]["Enums"]["listing_status"]
          updated_at?: string
          user_id?: string
          year_built?: number | null
          zip?: string | null
        }
        Relationships: []
      }
      marketing_insights: {
        Row: {
          created_at: string
          hook_text: string
          id: string
          image_path: string | null
          insight_body: string
          social_caption: string
          sort_order: number
          talk_track: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          hook_text: string
          id?: string
          image_path?: string | null
          insight_body?: string
          social_caption?: string
          sort_order?: number
          talk_track?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          hook_text?: string
          id?: string
          image_path?: string | null
          insight_body?: string
          social_caption?: string
          sort_order?: number
          talk_track?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      open_houses: {
        Row: {
          created_at: string
          date: string
          end_time: string
          id: string
          listing_id: string
          notes: string | null
          start_time: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          end_time: string
          id?: string
          listing_id: string
          notes?: string | null
          start_time: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          end_time?: string
          id?: string
          listing_id?: string
          notes?: string | null
          start_time?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "open_houses_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          completed_at: string | null
          cost: number | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          listing_id: string | null
          priority: Database["public"]["Enums"]["priority_level"]
          status: Database["public"]["Enums"]["order_status"]
          title: string
          transaction_id: string | null
          updated_at: string
          user_id: string
          vendor_email: string | null
          vendor_name: string | null
          vendor_phone: string | null
        }
        Insert: {
          completed_at?: string | null
          cost?: number | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          listing_id?: string | null
          priority?: Database["public"]["Enums"]["priority_level"]
          status?: Database["public"]["Enums"]["order_status"]
          title: string
          transaction_id?: string | null
          updated_at?: string
          user_id: string
          vendor_email?: string | null
          vendor_name?: string | null
          vendor_phone?: string | null
        }
        Update: {
          completed_at?: string | null
          cost?: number | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          listing_id?: string | null
          priority?: Database["public"]["Enums"]["priority_level"]
          status?: Database["public"]["Enums"]["order_status"]
          title?: string
          transaction_id?: string | null
          updated_at?: string
          user_id?: string
          vendor_email?: string | null
          vendor_name?: string | null
          vendor_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          contact_id: string | null
          created_at: string
          description: string | null
          due_date: string | null
          handled_by: string | null
          id: string
          listing_id: string | null
          order_id: string | null
          parent_task_id: string | null
          priority: Database["public"]["Enums"]["priority_level"]
          status: Database["public"]["Enums"]["task_status"]
          task_type: Database["public"]["Enums"]["task_type"]
          title: string
          transaction_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          handled_by?: string | null
          id?: string
          listing_id?: string | null
          order_id?: string | null
          parent_task_id?: string | null
          priority?: Database["public"]["Enums"]["priority_level"]
          status?: Database["public"]["Enums"]["task_status"]
          task_type?: Database["public"]["Enums"]["task_type"]
          title: string
          transaction_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          handled_by?: string | null
          id?: string
          listing_id?: string | null
          order_id?: string | null
          parent_task_id?: string | null
          priority?: Database["public"]["Enums"]["priority_level"]
          status?: Database["public"]["Enums"]["task_status"]
          task_type?: Database["public"]["Enums"]["task_type"]
          title?: string
          transaction_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      transaction_checklist_items: {
        Row: {
          assignee_type: string | null
          completed_at: string | null
          created_at: string
          done: boolean
          due_date: string | null
          handled_by: string | null
          id: string
          label: string
          notes: string | null
          section: string
          service_type: string | null
          sort_order: number
          transaction_id: string
          updated_at: string
          user_id: string
          vendor_id: string | null
        }
        Insert: {
          assignee_type?: string | null
          completed_at?: string | null
          created_at?: string
          done?: boolean
          due_date?: string | null
          handled_by?: string | null
          id?: string
          label: string
          notes?: string | null
          section?: string
          service_type?: string | null
          sort_order?: number
          transaction_id: string
          updated_at?: string
          user_id: string
          vendor_id?: string | null
        }
        Update: {
          assignee_type?: string | null
          completed_at?: string | null
          created_at?: string
          done?: boolean
          due_date?: string | null
          handled_by?: string | null
          id?: string
          label?: string
          notes?: string | null
          section?: string
          service_type?: string | null
          sort_order?: number
          transaction_id?: string
          updated_at?: string
          user_id?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transaction_checklist_items_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_checklist_items_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          buyer_name: string | null
          closing_date: string | null
          contract_price: number | null
          created_at: string
          earnest_money_amount: number | null
          earnest_money_due: string | null
          health_score: number | null
          id: string
          listing_id: string | null
          notes: string | null
          seller_name: string | null
          stage: Database["public"]["Enums"]["transaction_stage"]
          updated_at: string
          user_id: string
        }
        Insert: {
          buyer_name?: string | null
          closing_date?: string | null
          contract_price?: number | null
          created_at?: string
          earnest_money_amount?: number | null
          earnest_money_due?: string | null
          health_score?: number | null
          id?: string
          listing_id?: string | null
          notes?: string | null
          seller_name?: string | null
          stage?: Database["public"]["Enums"]["transaction_stage"]
          updated_at?: string
          user_id: string
        }
        Update: {
          buyer_name?: string | null
          closing_date?: string | null
          contract_price?: number | null
          created_at?: string
          earnest_money_amount?: number | null
          earnest_money_due?: string | null
          health_score?: number | null
          id?: string
          listing_id?: string | null
          notes?: string | null
          seller_name?: string | null
          stage?: Database["public"]["Enums"]["transaction_stage"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vendors: {
        Row: {
          category: string | null
          company: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
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
      apply_template_to_listing: {
        Args: { _listing_id: string; _template_id: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "agent" | "tc" | "admin"
      listing_status:
        | "new"
        | "signed"
        | "coming_soon"
        | "active"
        | "live"
        | "under_contract"
        | "photography_scheduled"
      listing_type: "buyer" | "seller"
      order_status: "pending" | "in_progress" | "completed" | "cancelled"
      priority_level: "low" | "normal" | "high" | "urgent"
      task_status: "todo" | "in_progress" | "done"
      task_type:
        | "todo"
        | "email"
        | "call"
        | "meeting"
        | "follow_up"
        | "document"
      transaction_stage:
        | "contract_intake"
        | "day_1"
        | "earnest_money"
        | "inspection"
        | "loan_appraisal"
        | "title"
        | "pre_close"
        | "closing"
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
      app_role: ["agent", "tc", "admin"],
      listing_status: [
        "new",
        "signed",
        "coming_soon",
        "active",
        "live",
        "under_contract",
        "photography_scheduled",
      ],
      listing_type: ["buyer", "seller"],
      order_status: ["pending", "in_progress", "completed", "cancelled"],
      priority_level: ["low", "normal", "high", "urgent"],
      task_status: ["todo", "in_progress", "done"],
      task_type: ["todo", "email", "call", "meeting", "follow_up", "document"],
      transaction_stage: [
        "contract_intake",
        "day_1",
        "earnest_money",
        "inspection",
        "loan_appraisal",
        "title",
        "pre_close",
        "closing",
      ],
    },
  },
} as const
