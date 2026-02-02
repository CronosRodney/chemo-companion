import { supabase } from "@/integrations/supabase/client";
import { calculateBSA, calculateDose, generateCycleSchedule } from "./bsaCalculator";

interface TreatmentPlanData {
  diagnosis_cid?: string;
  line_of_therapy: string;
  treatment_intent: string;
  regimen_name: string;
  planned_cycles: number;
  periodicity_days: number;
  weight_kg?: number;
  height_cm?: number;
  start_date: string;
  clinic_id?: string;
}

interface TreatmentDrug {
  drug_name: string;
  reference_dose: number;
  dose_unit: string;
  route: string;
  diluent?: string;
  volume_ml?: number;
  infusion_time_min?: number;
  day_codes: string[];
  sequence_order?: number;
  oncology_med_id?: string;
}

export class TreatmentService {
  /**
   * Cria um novo plano de tratamento
   * @param planData - Dados do plano
   * @param drugs - Lista de drogas do protocolo
   * @param targetPatientId - ID do paciente (para contexto médico). Se não informado, usa o user autenticado.
   */
  static async createTreatmentPlan(
    planData: TreatmentPlanData,
    drugs: TreatmentDrug[],
    targetPatientId?: string
  ): Promise<{ id: string }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    // Determina o user_id correto: patientId para médico, ou o próprio user para paciente
    const userId = targetPatientId || user.id;

    // Calcula BSA se tiver peso e altura
    let bsa_m2 = undefined;
    if (planData.weight_kg && planData.height_cm) {
      bsa_m2 = calculateBSA(planData.weight_kg, planData.height_cm);
    }

    // 1. Criar o plano de tratamento
    const { data: plan, error: planError } = await supabase
      .from('treatment_plans')
      .insert({
        ...planData,
        user_id: userId,
        bsa_m2
      })
      .select()
      .single();

    if (planError) throw planError;
    if (!plan) throw new Error("Falha ao criar plano de tratamento");

    // 2. Criar as drogas do protocolo
    const drugsToInsert = drugs.map((drug, index) => ({
      ...drug,
      treatment_plan_id: plan.id,
      sequence_order: drug.sequence_order ?? index + 1
    }));

    const { error: drugsError } = await supabase
      .from('treatment_drugs')
      .insert(drugsToInsert);

    if (drugsError) throw drugsError;

    // 3. Gerar cronograma de ciclos
    const cycleDates = generateCycleSchedule(
      new Date(planData.start_date),
      planData.planned_cycles,
      planData.periodicity_days
    );

    const cyclesToInsert = cycleDates.map((date, index) => ({
      treatment_plan_id: plan.id,
      cycle_number: index + 1,
      scheduled_date: date.toISOString().split('T')[0],
      status: index === 0 ? 'scheduled' : 'scheduled',
      release_status: 'pending'
    }));

    const { error: cyclesError } = await supabase
      .from('treatment_cycles')
      .insert(cyclesToInsert);

    if (cyclesError) throw cyclesError;

    return { id: plan.id };
  }

  /**
   * Carrega template de protocolo
   */
  static async loadRegimenTemplate(templateId: string) {
    const { data, error } = await supabase
      .from('regimen_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Lista todos os templates de protocolos
   */
  static async listRegimenTemplates() {
    const { data, error } = await supabase
      .from('regimen_templates')
      .select('*')
      .order('name');

    if (error) throw error;
    return data || [];
  }

  /**
   * Carrega planos de tratamento do usuário
   */
  static async loadUserTreatmentPlans(userId: string) {
    const { data, error } = await supabase
      .from('treatment_plans')
      .select(`
        *,
        clinic:clinics(*),
        drugs:treatment_drugs(*),
        cycles:treatment_cycles(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Atualiza dados laboratoriais do ciclo
   */
  static async updateCycleLabs(
    cycleId: string,
    labData: {
      anc_value?: number;
      plt_value?: number;
      scr_value?: number;
      ast_value?: number;
      alt_value?: number;
      bilirubin_value?: number;
    }
  ) {
    const { error } = await supabase
      .from('treatment_cycles')
      .update(labData)
      .eq('id', cycleId);

    if (error) throw error;
  }

  /**
   * Libera um ciclo para administração
   */
  static async releaseCycle(
    cycleId: string,
    status: 'released' | 'delayed' | 'dose_adjusted' | 'cancelled',
    delayReason?: string,
    doseAdjustments?: any
  ) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    const { error } = await supabase
      .from('treatment_cycles')
      .update({
        release_status: status,
        release_decision_by: user.id,
        release_decision_at: new Date().toISOString(),
        delay_reason: delayReason,
        dose_adjustments: doseAdjustments
      })
      .eq('id', cycleId);

    if (error) throw error;
  }

  /**
   * Adiciona prescrições de suporte domiciliar
   */
  static async addSupportPrescriptions(
    cycleId: string,
    prescriptions: Array<{
      medication_name: string;
      category?: string;
      dose: string;
      frequency: string;
      duration?: string;
      instructions?: string;
      alert_signs?: string;
    }>
  ) {
    const prescriptionsToInsert = prescriptions.map(p => ({
      ...p,
      cycle_id: cycleId
    }));

    const { error } = await supabase
      .from('cycle_support_prescriptions')
      .insert(prescriptionsToInsert);

    if (error) throw error;
  }

  /**
   * Atualiza um plano de tratamento existente
   */
  static async updateTreatmentPlan(
    planId: string,
    data: Partial<TreatmentPlanData>
  ) {
    const { data: result, error } = await supabase
      .from('treatment_plans')
      .update(data)
      .eq('id', planId)
      .select()
      .single();

    if (error) throw error;
    if (!result) throw new Error("Falha ao atualizar plano de tratamento");
    return result;
  }

  /**
   * Exclui um plano de tratamento e todas as dependências
   */
  static async deleteTreatmentPlan(planId: string) {
    // Primeiro exclui as prescrições de suporte dos ciclos
    const { data: cycles } = await supabase
      .from('treatment_cycles')
      .select('id')
      .eq('treatment_plan_id', planId);

    if (cycles && cycles.length > 0) {
      const cycleIds = cycles.map(c => c.id);
      await supabase
        .from('cycle_support_prescriptions')
        .delete()
        .in('cycle_id', cycleIds);
      
      await supabase
        .from('cycle_administrations')
        .delete()
        .in('cycle_id', cycleIds);
    }

    // Exclui ciclos
    const { error: cyclesError } = await supabase
      .from('treatment_cycles')
      .delete()
      .eq('treatment_plan_id', planId);

    if (cyclesError) throw cyclesError;

    // Exclui drogas
    const { error: drugsError } = await supabase
      .from('treatment_drugs')
      .delete()
      .eq('treatment_plan_id', planId);

    if (drugsError) throw drugsError;

    // Exclui o plano
    const { error: planError } = await supabase
      .from('treatment_plans')
      .delete()
      .eq('id', planId);

    if (planError) throw planError;
  }
}
