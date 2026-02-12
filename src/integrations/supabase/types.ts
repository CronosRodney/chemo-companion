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
      connection_invites: {
        Row: {
          created_at: string | null
          doctor_user_id: string
          expires_at: string | null
          id: string
          invite_code: string
          patient_email: string
          status: string | null
        }
        Insert: {
          created_at?: string | null
          doctor_user_id: string
          expires_at?: string | null
          id?: string
          invite_code?: string
          patient_email: string
          status?: string | null
        }
        Update: {
          created_at?: string | null
          doctor_user_id?: string
          expires_at?: string | null
          id?: string
          invite_code?: string
          patient_email?: string
          status?: string | null
        }
        Relationships: []
      }
      cycle_administrations: {
        Row: {
          actual_dose_mg: number | null
          administered_by: string | null
          administration_date: string
          adverse_reactions: Json | null
          batch_number: string | null
          calculated_dose_mg: number
          created_at: string | null
          cycle_id: string
          day_code: string
          drug_id: string
          end_time: string | null
          expiry_date: string | null
          id: string
          notes: string | null
          start_time: string | null
          status: string | null
        }
        Insert: {
          actual_dose_mg?: number | null
          administered_by?: string | null
          administration_date: string
          adverse_reactions?: Json | null
          batch_number?: string | null
          calculated_dose_mg: number
          created_at?: string | null
          cycle_id: string
          day_code: string
          drug_id: string
          end_time?: string | null
          expiry_date?: string | null
          id?: string
          notes?: string | null
          start_time?: string | null
          status?: string | null
        }
        Update: {
          actual_dose_mg?: number | null
          administered_by?: string | null
          administration_date?: string
          adverse_reactions?: Json | null
          batch_number?: string | null
          calculated_dose_mg?: number
          created_at?: string | null
          cycle_id?: string
          day_code?: string
          drug_id?: string
          end_time?: string | null
          expiry_date?: string | null
          id?: string
          notes?: string | null
          start_time?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cycle_administrations_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "treatment_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cycle_administrations_drug_id_fkey"
            columns: ["drug_id"]
            isOneToOne: false
            referencedRelation: "treatment_drugs"
            referencedColumns: ["id"]
          },
        ]
      }
      cycle_support_prescriptions: {
        Row: {
          alert_signs: string | null
          category: string | null
          created_at: string | null
          cycle_id: string
          dose: string
          duration: string | null
          frequency: string
          id: string
          instructions: string | null
          medication_name: string
        }
        Insert: {
          alert_signs?: string | null
          category?: string | null
          created_at?: string | null
          cycle_id: string
          dose: string
          duration?: string | null
          frequency: string
          id?: string
          instructions?: string | null
          medication_name: string
        }
        Update: {
          alert_signs?: string | null
          category?: string | null
          created_at?: string | null
          cycle_id?: string
          dose?: string
          duration?: string | null
          frequency?: string
          id?: string
          instructions?: string | null
          medication_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "cycle_support_prescriptions_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "treatment_cycles"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_notes: {
        Row: {
          connection_id: string | null
          created_at: string | null
          doctor_user_id: string
          id: string
          is_private: boolean | null
          note: string
          note_type: string | null
          patient_user_id: string
          updated_at: string | null
        }
        Insert: {
          connection_id?: string | null
          created_at?: string | null
          doctor_user_id: string
          id?: string
          is_private?: boolean | null
          note: string
          note_type?: string | null
          patient_user_id: string
          updated_at?: string | null
        }
        Update: {
          connection_id?: string | null
          created_at?: string | null
          doctor_user_id?: string
          id?: string
          is_private?: boolean | null
          note?: string
          note_type?: string | null
          patient_user_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "doctor_notes_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "patient_doctor_connections"
            referencedColumns: ["id"]
          },
        ]
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
      external_connections: {
        Row: {
          connected_at: string
          connection_token: string
          created_at: string
          id: string
          last_sync_at: string | null
          metadata: Json | null
          provider: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          connected_at?: string
          connection_token: string
          created_at?: string
          id?: string
          last_sync_at?: string | null
          metadata?: Json | null
          provider: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          connected_at?: string
          connection_token?: string
          created_at?: string
          id?: string
          last_sync_at?: string | null
          metadata?: Json | null
          provider?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      healthcare_professionals: {
        Row: {
          clinic_id: string | null
          created_at: string | null
          crm: string | null
          crm_uf: string | null
          first_name: string
          id: string
          is_verified: boolean | null
          last_name: string
          specialty: string | null
          updated_at: string | null
          user_id: string
          verification_document_url: string | null
        }
        Insert: {
          clinic_id?: string | null
          created_at?: string | null
          crm?: string | null
          crm_uf?: string | null
          first_name: string
          id?: string
          is_verified?: boolean | null
          last_name: string
          specialty?: string | null
          updated_at?: string | null
          user_id: string
          verification_document_url?: string | null
        }
        Update: {
          clinic_id?: string | null
          created_at?: string | null
          crm?: string | null
          crm_uf?: string | null
          first_name?: string
          id?: string
          is_verified?: boolean | null
          last_name?: string
          specialty?: string | null
          updated_at?: string | null
          user_id?: string
          verification_document_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "healthcare_professionals_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_results: {
        Row: {
          alt_value: number | null
          anc_value: number | null
          ast_value: number | null
          bilirubin_value: number | null
          created_at: string
          created_by_id: string
          created_by_role: string
          exam_name: string
          exam_type: string
          hemoglobin_value: number | null
          id: string
          notes: string | null
          patient_id: string
          plt_value: number | null
          result_at: string | null
          results: Json | null
          scheduled_at: string | null
          scr_value: number | null
          status: string
          updated_at: string
          wbc_value: number | null
        }
        Insert: {
          alt_value?: number | null
          anc_value?: number | null
          ast_value?: number | null
          bilirubin_value?: number | null
          created_at?: string
          created_by_id: string
          created_by_role: string
          exam_name: string
          exam_type: string
          hemoglobin_value?: number | null
          id?: string
          notes?: string | null
          patient_id: string
          plt_value?: number | null
          result_at?: string | null
          results?: Json | null
          scheduled_at?: string | null
          scr_value?: number | null
          status?: string
          updated_at?: string
          wbc_value?: number | null
        }
        Update: {
          alt_value?: number | null
          anc_value?: number | null
          ast_value?: number | null
          bilirubin_value?: number | null
          created_at?: string
          created_by_id?: string
          created_by_role?: string
          exam_name?: string
          exam_type?: string
          hemoglobin_value?: number | null
          id?: string
          notes?: string | null
          patient_id?: string
          plt_value?: number | null
          result_at?: string | null
          results?: Json | null
          scheduled_at?: string | null
          scr_value?: number | null
          status?: string
          updated_at?: string
          wbc_value?: number | null
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
      patient_doctor_connections: {
        Row: {
          connected_at: string | null
          created_at: string | null
          doctor_user_id: string
          id: string
          patient_user_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          connected_at?: string | null
          created_at?: string | null
          doctor_user_id: string
          id?: string
          patient_user_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          connected_at?: string | null
          created_at?: string | null
          doctor_user_id?: string
          id?: string
          patient_user_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          allergies: string | null
          avatar_url: string | null
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
          avatar_url?: string | null
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
          avatar_url?: string | null
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
      regimen_templates: {
        Row: {
          cancer_types: string[] | null
          created_at: string | null
          description: string | null
          drugs_template: Json
          full_name: string | null
          id: string
          line_of_therapy: string[] | null
          name: string
          typical_cycles: number | null
          typical_periodicity_days: number | null
          typical_support: Json | null
          updated_at: string | null
        }
        Insert: {
          cancer_types?: string[] | null
          created_at?: string | null
          description?: string | null
          drugs_template: Json
          full_name?: string | null
          id?: string
          line_of_therapy?: string[] | null
          name: string
          typical_cycles?: number | null
          typical_periodicity_days?: number | null
          typical_support?: Json | null
          updated_at?: string | null
        }
        Update: {
          cancer_types?: string[] | null
          created_at?: string | null
          description?: string | null
          drugs_template?: Json
          full_name?: string | null
          id?: string
          line_of_therapy?: string[] | null
          name?: string
          typical_cycles?: number | null
          typical_periodicity_days?: number | null
          typical_support?: Json | null
          updated_at?: string | null
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
      treatment_cycles: {
        Row: {
          actual_date: string | null
          alt_value: number | null
          anc_value: number | null
          ast_value: number | null
          bilirubin_value: number | null
          created_at: string | null
          cycle_number: number
          delay_reason: string | null
          dose_adjustments: Json | null
          id: string
          plt_value: number | null
          release_decision_at: string | null
          release_decision_by: string | null
          release_status: string
          scheduled_date: string
          scr_value: number | null
          status: string | null
          treatment_plan_id: string
          updated_at: string | null
        }
        Insert: {
          actual_date?: string | null
          alt_value?: number | null
          anc_value?: number | null
          ast_value?: number | null
          bilirubin_value?: number | null
          created_at?: string | null
          cycle_number: number
          delay_reason?: string | null
          dose_adjustments?: Json | null
          id?: string
          plt_value?: number | null
          release_decision_at?: string | null
          release_decision_by?: string | null
          release_status?: string
          scheduled_date: string
          scr_value?: number | null
          status?: string | null
          treatment_plan_id: string
          updated_at?: string | null
        }
        Update: {
          actual_date?: string | null
          alt_value?: number | null
          anc_value?: number | null
          ast_value?: number | null
          bilirubin_value?: number | null
          created_at?: string | null
          cycle_number?: number
          delay_reason?: string | null
          dose_adjustments?: Json | null
          id?: string
          plt_value?: number | null
          release_decision_at?: string | null
          release_decision_by?: string | null
          release_status?: string
          scheduled_date?: string
          scr_value?: number | null
          status?: string | null
          treatment_plan_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "treatment_cycles_treatment_plan_id_fkey"
            columns: ["treatment_plan_id"]
            isOneToOne: false
            referencedRelation: "treatment_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      treatment_drugs: {
        Row: {
          created_at: string | null
          day_codes: string[]
          diluent: string | null
          dose_unit: string
          drug_name: string
          id: string
          infusion_time_min: number | null
          oncology_med_id: string | null
          reference_dose: number
          route: string
          sequence_order: number | null
          treatment_plan_id: string
          volume_ml: number | null
        }
        Insert: {
          created_at?: string | null
          day_codes: string[]
          diluent?: string | null
          dose_unit: string
          drug_name: string
          id?: string
          infusion_time_min?: number | null
          oncology_med_id?: string | null
          reference_dose: number
          route: string
          sequence_order?: number | null
          treatment_plan_id: string
          volume_ml?: number | null
        }
        Update: {
          created_at?: string | null
          day_codes?: string[]
          diluent?: string | null
          dose_unit?: string
          drug_name?: string
          id?: string
          infusion_time_min?: number | null
          oncology_med_id?: string | null
          reference_dose?: number
          route?: string
          sequence_order?: number | null
          treatment_plan_id?: string
          volume_ml?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "treatment_drugs_oncology_med_id_fkey"
            columns: ["oncology_med_id"]
            isOneToOne: false
            referencedRelation: "oncology_meds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_drugs_treatment_plan_id_fkey"
            columns: ["treatment_plan_id"]
            isOneToOne: false
            referencedRelation: "treatment_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      treatment_plans: {
        Row: {
          anc_min: number | null
          ast_alt_max_xuln: number | null
          bsa_m2: number | null
          clinic_id: string | null
          created_at: string | null
          diagnosis_cid: string | null
          end_date: string | null
          height_cm: number | null
          id: string
          line_of_therapy: string
          periodicity_days: number
          planned_cycles: number
          plt_min: number | null
          prescriber_id: string | null
          regimen_name: string
          scr_max: number | null
          start_date: string
          status: string | null
          treatment_intent: string
          updated_at: string | null
          user_id: string
          weight_kg: number | null
        }
        Insert: {
          anc_min?: number | null
          ast_alt_max_xuln?: number | null
          bsa_m2?: number | null
          clinic_id?: string | null
          created_at?: string | null
          diagnosis_cid?: string | null
          end_date?: string | null
          height_cm?: number | null
          id?: string
          line_of_therapy: string
          periodicity_days: number
          planned_cycles: number
          plt_min?: number | null
          prescriber_id?: string | null
          regimen_name: string
          scr_max?: number | null
          start_date: string
          status?: string | null
          treatment_intent: string
          updated_at?: string | null
          user_id: string
          weight_kg?: number | null
        }
        Update: {
          anc_min?: number | null
          ast_alt_max_xuln?: number | null
          bsa_m2?: number | null
          clinic_id?: string | null
          created_at?: string | null
          diagnosis_cid?: string | null
          end_date?: string | null
          height_cm?: number | null
          id?: string
          line_of_therapy?: string
          periodicity_days?: number
          planned_cycles?: number
          plt_min?: number | null
          prescriber_id?: string | null
          regimen_name?: string
          scr_max?: number | null
          start_date?: string
          status?: string | null
          treatment_intent?: string
          updated_at?: string | null
          user_id?: string
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "treatment_plans_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
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
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
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
      wearable_alerts: {
        Row: {
          acknowledged: boolean
          acknowledged_at: string | null
          actual_value: number
          alert_type: string
          created_at: string
          id: string
          message: string
          metric_id: string | null
          severity: string
          threshold_value: number | null
          user_id: string
        }
        Insert: {
          acknowledged?: boolean
          acknowledged_at?: string | null
          actual_value: number
          alert_type: string
          created_at?: string
          id?: string
          message: string
          metric_id?: string | null
          severity: string
          threshold_value?: number | null
          user_id: string
        }
        Update: {
          acknowledged?: boolean
          acknowledged_at?: string | null
          actual_value?: number
          alert_type?: string
          created_at?: string
          id?: string
          message?: string
          metric_id?: string | null
          severity?: string
          threshold_value?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wearable_alerts_metric_id_fkey"
            columns: ["metric_id"]
            isOneToOne: false
            referencedRelation: "wearable_metrics"
            referencedColumns: ["id"]
          },
        ]
      }
      wearable_connections: {
        Row: {
          access_token_encrypted: string | null
          connected_at: string
          created_at: string
          id: string
          is_active: boolean
          last_sync_at: string | null
          provider: string
          refresh_token_encrypted: string | null
          sync_frequency_hours: number
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token_encrypted?: string | null
          connected_at?: string
          created_at?: string
          id?: string
          is_active?: boolean
          last_sync_at?: string | null
          provider: string
          refresh_token_encrypted?: string | null
          sync_frequency_hours?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token_encrypted?: string | null
          connected_at?: string
          created_at?: string
          id?: string
          is_active?: boolean
          last_sync_at?: string | null
          provider?: string
          refresh_token_encrypted?: string | null
          sync_frequency_hours?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      wearable_metrics: {
        Row: {
          connection_id: string
          created_at: string
          id: string
          metric_date: string
          metric_time: string | null
          metric_type: string
          source_device: string | null
          unit: string
          user_id: string
          value: number
        }
        Insert: {
          connection_id: string
          created_at?: string
          id?: string
          metric_date: string
          metric_time?: string | null
          metric_type: string
          source_device?: string | null
          unit: string
          user_id: string
          value: number
        }
        Update: {
          connection_id?: string
          created_at?: string
          id?: string
          metric_date?: string
          metric_time?: string | null
          metric_type?: string
          source_device?: string | null
          unit?: string
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "wearable_metrics_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "wearable_connections"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      doctor_has_patient_access: {
        Args: { _doctor_id: string; _patient_id: string }
        Returns: boolean
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
      app_role: "admin" | "doctor" | "patient"
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
      app_role: ["admin", "doctor", "patient"],
    },
  },
} as const
