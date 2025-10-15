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
      clinic_responsible: {
        Row: {
          clinic_id: string
          council: string | null
          council_uf: string | null
          created_at: string
          email: string | null
          id: string
          is_deputy: boolean | null
          name: string
          phone: string | null
          registration: string | null
          role: string | null
        }
        Insert: {
          clinic_id: string
          council?: string | null
          council_uf?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_deputy?: boolean | null
          name: string
          phone?: string | null
          registration?: string | null
          role?: string | null
        }
        Update: {
          clinic_id?: string
          council?: string | null
          council_uf?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_deputy?: boolean | null
          name?: string
          phone?: string | null
          registration?: string | null
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clinic_responsible_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      clinics: {
        Row: {
          city: string | null
          clinic_name: string
          cnes: string | null
          cnpj: string | null
          created_at: string
          district: string | null
          email: string | null
          hours: string | null
          id: string
          legal_name: string | null
          maps_url: string | null
          number: string | null
          phone: string | null
          state: string | null
          street: string | null
          updated_at: string
          website: string | null
          whatsapp: string | null
          zip: string | null
        }
        Insert: {
          city?: string | null
          clinic_name: string
          cnes?: string | null
          cnpj?: string | null
          created_at?: string
          district?: string | null
          email?: string | null
          hours?: string | null
          id?: string
          legal_name?: string | null
          maps_url?: string | null
          number?: string | null
          phone?: string | null
          state?: string | null
          street?: string | null
          updated_at?: string
          website?: string | null
          whatsapp?: string | null
          zip?: string | null
        }
        Update: {
          city?: string | null
          clinic_name?: string
          cnes?: string | null
          cnpj?: string | null
          created_at?: string
          district?: string | null
          email?: string | null
          hours?: string | null
          id?: string
          legal_name?: string | null
          maps_url?: string | null
          number?: string | null
          phone?: string | null
          state?: string | null
          street?: string | null
          updated_at?: string
          website?: string | null
          whatsapp?: string | null
          zip?: string | null
        }
        Relationships: []
      }
      events: {
        Row: {
          created_at: string
          description: string | null
          event_date: string
          event_time: string | null
          event_type: string
          id: string
          severity: number | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_date: string
          event_time?: string | null
          event_type: string
          id?: string
          severity?: number | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          event_date?: string
          event_time?: string | null
          event_type?: string
          id?: string
          severity?: number | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      medications: {
        Row: {
          active_ingredient: string | null
          batch_number: string | null
          concentration: string | null
          created_at: string
          expiry_date: string | null
          form: string | null
          gtin: string | null
          id: string
          manufacturer: string | null
          name: string
          route: string | null
          updated_at: string
        }
        Insert: {
          active_ingredient?: string | null
          batch_number?: string | null
          concentration?: string | null
          created_at?: string
          expiry_date?: string | null
          form?: string | null
          gtin?: string | null
          id?: string
          manufacturer?: string | null
          name: string
          route?: string | null
          updated_at?: string
        }
        Update: {
          active_ingredient?: string | null
          batch_number?: string | null
          concentration?: string | null
          created_at?: string
          expiry_date?: string | null
          form?: string | null
          gtin?: string | null
          id?: string
          manufacturer?: string | null
          name?: string
          route?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      oncology_meds: {
        Row: {
          adjustments: Json | null
          atc_code: string | null
          biosimilar_flag: boolean | null
          black_box_warnings: string | null
          common_adverse_events: string[] | null
          contraindications: string[] | null
          dosage_forms: string[] | null
          dosing_standard: string | null
          drug_class: string | null
          drug_name_inn_dcb: string
          id: string
          indications_oncology: string[] | null
          inserted_at: string | null
          interactions_key: string[] | null
          line_of_therapy: string | null
          manufacturer_originator: string | null
          monitoring: string[] | null
          notes: string | null
          pediatric_approved: boolean | null
          pregnancy_lactation: string | null
          reference_sources: string[] | null
          regimen_examples: string[] | null
          route: string[] | null
          status_brazil_anvisa: string | null
          strengths: string[] | null
          synonyms_brand_generic: string[] | null
          updated_at: string | null
        }
        Insert: {
          adjustments?: Json | null
          atc_code?: string | null
          biosimilar_flag?: boolean | null
          black_box_warnings?: string | null
          common_adverse_events?: string[] | null
          contraindications?: string[] | null
          dosage_forms?: string[] | null
          dosing_standard?: string | null
          drug_class?: string | null
          drug_name_inn_dcb: string
          id?: string
          indications_oncology?: string[] | null
          inserted_at?: string | null
          interactions_key?: string[] | null
          line_of_therapy?: string | null
          manufacturer_originator?: string | null
          monitoring?: string[] | null
          notes?: string | null
          pediatric_approved?: boolean | null
          pregnancy_lactation?: string | null
          reference_sources?: string[] | null
          regimen_examples?: string[] | null
          route?: string[] | null
          status_brazil_anvisa?: string | null
          strengths?: string[] | null
          synonyms_brand_generic?: string[] | null
          updated_at?: string | null
        }
        Update: {
          adjustments?: Json | null
          atc_code?: string | null
          biosimilar_flag?: boolean | null
          black_box_warnings?: string | null
          common_adverse_events?: string[] | null
          contraindications?: string[] | null
          dosage_forms?: string[] | null
          dosing_standard?: string | null
          drug_class?: string | null
          drug_name_inn_dcb?: string
          id?: string
          indications_oncology?: string[] | null
          inserted_at?: string | null
          interactions_key?: string[] | null
          line_of_therapy?: string | null
          manufacturer_originator?: string | null
          monitoring?: string[] | null
          notes?: string | null
          pediatric_approved?: boolean | null
          pregnancy_lactation?: string | null
          reference_sources?: string[] | null
          regimen_examples?: string[] | null
          route?: string[] | null
          status_brazil_anvisa?: string | null
          strengths?: string[] | null
          synonyms_brand_generic?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          allergies: string | null
          birth_date: string | null
          city: string | null
          cpf: string | null
          created_at: string
          current_medications: string | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          first_name: string
          id: string
          last_name: string | null
          medical_history: string | null
          phone: string | null
          rg: string | null
          state: string | null
          updated_at: string
          user_id: string
          zip: string | null
        }
        Insert: {
          address?: string | null
          allergies?: string | null
          birth_date?: string | null
          city?: string | null
          cpf?: string | null
          created_at?: string
          current_medications?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name: string
          id?: string
          last_name?: string | null
          medical_history?: string | null
          phone?: string | null
          rg?: string | null
          state?: string | null
          updated_at?: string
          user_id: string
          zip?: string | null
        }
        Update: {
          address?: string | null
          allergies?: string | null
          birth_date?: string | null
          city?: string | null
          cpf?: string | null
          created_at?: string
          current_medications?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name?: string
          id?: string
          last_name?: string | null
          medical_history?: string | null
          phone?: string | null
          rg?: string | null
          state?: string | null
          updated_at?: string
          user_id?: string
          zip?: string | null
        }
        Relationships: []
      }
      reminders: {
        Row: {
          active: boolean | null
          created_at: string
          cycle: string | null
          id: string
          medication: string
          time: string
          type: string
          updated_at: string
          urgent: boolean | null
          user_id: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          cycle?: string | null
          id?: string
          medication: string
          time: string
          type: string
          updated_at?: string
          urgent?: boolean | null
          user_id: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          cycle?: string | null
          id?: string
          medication?: string
          time?: string
          type?: string
          updated_at?: string
          urgent?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      timeline_events: {
        Row: {
          created_at: string
          details: string | null
          id: number
          kind: string
          occurred_at: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: never
          kind: string
          occurred_at?: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: never
          kind?: string
          occurred_at?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      user_clinic_connections: {
        Row: {
          clinic_id: string
          connected_at: string
          id: string
          user_id: string
        }
        Insert: {
          clinic_id: string
          connected_at?: string
          id?: string
          user_id: string
        }
        Update: {
          clinic_id?: string
          connected_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_clinic_connections_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      user_events: {
        Row: {
          created_at: string
          description: string | null
          event_date: string
          event_time: string
          event_type: string
          id: string
          severity: number | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_date: string
          event_time: string
          event_type?: string
          id?: string
          severity?: number | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          event_date?: string
          event_time?: string
          event_type?: string
          id?: string
          severity?: number | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_medications: {
        Row: {
          clinic_id: string | null
          dose: string | null
          frequency: string | null
          id: string
          instructions: string | null
          medication_id: string
          scanned_at: string
          user_id: string
        }
        Insert: {
          clinic_id?: string | null
          dose?: string | null
          frequency?: string | null
          id?: string
          instructions?: string | null
          medication_id: string
          scanned_at?: string
          user_id: string
        }
        Update: {
          clinic_id?: string | null
          dose?: string | null
          frequency?: string | null
          id?: string
          instructions?: string | null
          medication_id?: string
          scanned_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_medications_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_medications_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
        ]
      }
      user_stats: {
        Row: {
          adherence_percentage: number | null
          current_cycle: string | null
          id: string
          next_appointment_date: string | null
          total_cycles: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          adherence_percentage?: number | null
          current_cycle?: string | null
          id?: string
          next_appointment_date?: string | null
          total_cycles?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          adherence_percentage?: number | null
          current_cycle?: string | null
          id?: string
          next_appointment_date?: string | null
          total_cycles?: number | null
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
      [_ in never]: never
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
