import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TreatmentPlan {
  id: string;
  regimen_name: string;
  status: string;
  line_of_therapy: string;
  treatment_intent: string;
  diagnosis_cid: string | null;
  planned_cycles: number;
  periodicity_days: number;
  weight_kg: number | null;
  height_cm: number | null;
  bsa_m2: number | null;
  start_date: string;
  end_date: string | null;
  drugs: any[];
  cycles: any[];
  clinic: any | null;
}

interface UsePatientTreatmentResult {
  treatmentPlans: TreatmentPlan[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to load treatment plans for a specific patient.
 * Used in doctor context to view patient's treatment data.
 */
export const usePatientTreatment = (patientId: string | undefined): UsePatientTreatmentResult => {
  const [treatmentPlans, setTreatmentPlans] = useState<TreatmentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTreatmentPlans = async () => {
    if (!patientId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('treatment_plans')
        .select(`
          *,
          clinic:clinics(*),
          drugs:treatment_drugs(*),
          cycles:treatment_cycles(*)
        `)
        .eq('user_id', patientId)
        .order('created_at', { ascending: false });

      if (queryError) throw queryError;
      
      setTreatmentPlans(data || []);
    } catch (err: any) {
      console.error('Error loading patient treatment plans:', err);
      setError(err.message || 'Erro ao carregar tratamentos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTreatmentPlans();
  }, [patientId]);

  return {
    treatmentPlans,
    loading,
    error,
    refetch: loadTreatmentPlans
  };
};
