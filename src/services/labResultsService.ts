import { supabase } from '@/integrations/supabase/client';

export interface LabResult {
  id: string;
  patient_id: string;
  created_by_id: string;
  created_by_role: 'doctor' | 'patient';
  exam_type: string;
  exam_name: string;
  scheduled_at: string | null;
  result_at: string | null;
  status: 'pending' | 'scheduled' | 'completed' | 'canceled';
  anc_value: number | null;
  plt_value: number | null;
  scr_value: number | null;
  ast_value: number | null;
  alt_value: number | null;
  bilirubin_value: number | null;
  hemoglobin_value: number | null;
  wbc_value: number | null;
  results: Record<string, any> | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateLabResultData {
  patient_id: string;
  created_by_id: string;
  created_by_role: 'doctor' | 'patient';
  exam_type: string;
  exam_name: string;
  scheduled_at?: string;
  result_at?: string;
  status?: 'pending' | 'scheduled' | 'completed' | 'canceled';
  anc_value?: number;
  plt_value?: number;
  scr_value?: number;
  ast_value?: number;
  alt_value?: number;
  bilirubin_value?: number;
  hemoglobin_value?: number;
  wbc_value?: number;
  results?: Record<string, any>;
  notes?: string;
}

export class LabResultsService {
  /**
   * Busca todos os exames de um paciente
   */
  static async getLabResults(patientId: string): Promise<LabResult[]> {
    const { data, error } = await supabase
      .from('lab_results')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as LabResult[];
  }

  /**
   * Cria um novo exame
   */
  static async createLabResult(data: CreateLabResultData): Promise<LabResult> {
    const { data: result, error } = await supabase
      .from('lab_results')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    if (!result) throw new Error('Falha ao criar exame');
    return result as LabResult;
  }

  /**
   * Atualiza um exame existente
   */
  static async updateLabResult(id: string, data: Partial<CreateLabResultData>): Promise<LabResult> {
    const { data: result, error } = await supabase
      .from('lab_results')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!result) throw new Error('Falha ao atualizar exame');
    return result as LabResult;
  }

  /**
   * Exclui um exame
   */
  static async deleteLabResult(id: string): Promise<void> {
    const { error } = await supabase
      .from('lab_results')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}
