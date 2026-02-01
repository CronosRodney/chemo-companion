/**
 * Centralized Zod validation schemas for all forms
 * @module validations
 */

import { z } from 'zod';

// =====================================================
// Common field validators
// =====================================================

export const emailValidator = z
  .string()
  .trim()
  .email('Email inválido')
  .max(255, 'Email deve ter no máximo 255 caracteres');

export const phoneValidator = z
  .string()
  .trim()
  .regex(/^[\d\s\-\(\)\+]*$/, 'Telefone inválido')
  .max(20, 'Telefone muito longo')
  .optional()
  .or(z.literal(''));

export const requiredStringValidator = (fieldName: string, maxLength = 100) =>
  z
    .string()
    .trim()
    .min(1, `${fieldName} é obrigatório`)
    .max(maxLength, `${fieldName} deve ter no máximo ${maxLength} caracteres`);

export const optionalStringValidator = (maxLength = 255) =>
  z
    .string()
    .trim()
    .max(maxLength, `Máximo de ${maxLength} caracteres`)
    .optional()
    .or(z.literal(''));

export const dateValidator = z
  .string()
  .min(1, 'Data é obrigatória')
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de data inválido');

export const timeValidator = z
  .string()
  .min(1, 'Hora é obrigatória')
  .regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Formato de hora inválido');

export const positiveNumberValidator = (fieldName: string) =>
  z.coerce
    .number({ message: `${fieldName} deve ser um número` })
    .positive(`${fieldName} deve ser maior que zero`);

// =====================================================
// Profile Schema
// =====================================================

export const profileSchema = z.object({
  first_name: requiredStringValidator('Nome', 50),
  last_name: optionalStringValidator(50),
  email: emailValidator.optional().or(z.literal('')),
  phone: phoneValidator,
  birth_date: z.string().optional().or(z.literal('')),
  medical_history: optionalStringValidator(1000),
  emergency_contact_name: optionalStringValidator(100),
  emergency_contact_phone: phoneValidator,
});

export type ProfileFormData = z.infer<typeof profileSchema>;

// =====================================================
// Auth Schema
// =====================================================

export const loginSchema = z.object({
  email: emailValidator,
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

export const signupSchema = loginSchema.extend({
  firstName: requiredStringValidator('Nome', 50),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;

// =====================================================
// Event Schema
// =====================================================

const eventTypes = ['general', 'appointment', 'exam', 'medication', 'mood', 'adverse_event'] as const;

export const eventSchema = z.object({
  title: requiredStringValidator('Título', 100),
  description: optionalStringValidator(500),
  event_type: z.enum(eventTypes, {
    message: 'Tipo de evento é obrigatório',
  }),
  severity: z.coerce.number().int().min(1).max(5).default(1),
  event_date: dateValidator,
  event_time: timeValidator,
});

export type EventFormData = z.infer<typeof eventSchema>;

// =====================================================
// Feeling Schema (already implemented, kept for reference)
// =====================================================

export const feelingSchema = z.object({
  title: requiredStringValidator('Título', 100),
  feeling_text: z
    .string()
    .trim()
    .min(10, 'Descreva com pelo menos 10 caracteres')
    .max(500, 'Máximo de 500 caracteres'),
  event_date: dateValidator,
  event_time: timeValidator,
});

export type FeelingFormData = z.infer<typeof feelingSchema>;

// =====================================================
// Medication Schema
// =====================================================

export const medicationSchema = z.object({
  medication_id: z.string().uuid('Selecione um medicamento válido').optional(),
  drug_name: requiredStringValidator('Nome do medicamento', 200),
  strength: optionalStringValidator(50),
  dose: optionalStringValidator(50),
  frequency: optionalStringValidator(100),
  instructions: optionalStringValidator(500),
});

export type MedicationFormData = z.infer<typeof medicationSchema>;

// =====================================================
// Reminder Schema
// =====================================================

const reminderTypes = ['Oral', 'IV', 'SC', 'IM'] as const;

export const reminderSchema = z.object({
  medication: requiredStringValidator('Medicamento', 200),
  time: timeValidator,
  type: z.enum(reminderTypes, {
    message: 'Tipo é obrigatório',
  }),
  cycle: optionalStringValidator(100),
  urgent: z.boolean().default(false),
});

export type ReminderFormData = z.infer<typeof reminderSchema>;

// =====================================================
// Treatment Plan Schema
// =====================================================

const doseUnits = ['mg/m2', 'mg', 'mg/kg'] as const;
const routes = ['IV', 'VO', 'SC', 'IM'] as const;
const diluents = ['SF', 'SG5', 'SG10'] as const;
const lineOfTherapyOptions = ['1st', '2nd', '3rd', 'palliative'] as const;
const treatmentIntentOptions = ['curative', 'neoadjuvant', 'adjuvant', 'palliative'] as const;

export const drugSchema = z.object({
  drug_name: requiredStringValidator('Nome da droga', 200),
  reference_dose: positiveNumberValidator('Dose de referência'),
  dose_unit: z.enum(doseUnits, {
    message: 'Unidade é obrigatória',
  }),
  route: z.enum(routes, {
    message: 'Via é obrigatória',
  }),
  diluent: z.enum(diluents).optional(),
  volume_ml: z.coerce.number().int().positive().optional(),
  infusion_time_min: z.coerce.number().int().positive().optional(),
  day_codes: z
    .array(z.string())
    .min(1, 'Pelo menos um dia deve ser especificado'),
});

export const treatmentPlanSchema = z.object({
  regimen_name: requiredStringValidator('Nome do protocolo', 200),
  line_of_therapy: z.enum(lineOfTherapyOptions, {
    message: 'Linha de tratamento é obrigatória',
  }),
  treatment_intent: z.enum(treatmentIntentOptions, {
    message: 'Intenção do tratamento é obrigatória',
  }),
  planned_cycles: z.coerce.number().int().min(1, 'Mínimo 1 ciclo').max(50, 'Máximo 50 ciclos'),
  periodicity_days: z.coerce.number().int().min(1, 'Periodicidade inválida'),
  diagnosis_cid: optionalStringValidator(20),
  weight_kg: positiveNumberValidator('Peso').max(500, 'Peso inválido'),
  height_cm: positiveNumberValidator('Altura').max(300, 'Altura inválida'),
  start_date: dateValidator,
  drugs: z.array(drugSchema).min(1, 'Adicione pelo menos uma droga'),
});

export type DrugFormData = z.infer<typeof drugSchema>;
export type TreatmentPlanFormData = z.infer<typeof treatmentPlanSchema>;

// =====================================================
// Teleconsultation Schema
// =====================================================

export const teleconsultationSchema = z.object({
  doctor_name: requiredStringValidator('Nome do médico', 100),
  specialty: optionalStringValidator(100),
  scheduled_date: dateValidator,
  scheduled_time: timeValidator,
  reason: optionalStringValidator(500),
  notes: optionalStringValidator(1000),
  meeting_link: z.string().url('Link inválido').optional().or(z.literal('')),
});

export type TeleconsultationFormData = z.infer<typeof teleconsultationSchema>;

// =====================================================
// Symptom Analysis Schema
// =====================================================

export const symptomSchema = z.object({
  symptom_description: z
    .string()
    .trim()
    .min(10, 'Descreva o sintoma com pelo menos 10 caracteres')
    .max(1000, 'Máximo de 1000 caracteres'),
  severity: z.coerce.number().int().min(1).max(10),
  onset_date: dateValidator,
  duration: optionalStringValidator(100),
  frequency: optionalStringValidator(100),
  triggers: optionalStringValidator(500),
  relieving_factors: optionalStringValidator(500),
});

export type SymptomFormData = z.infer<typeof symptomSchema>;

// =====================================================
// Pharmacy Search Schema
// =====================================================

export const pharmacySearchSchema = z.object({
  medication_name: requiredStringValidator('Nome do medicamento', 200),
  location: optionalStringValidator(200),
  radius_km: z.coerce.number().min(1).max(100).default(10),
});

export type PharmacySearchFormData = z.infer<typeof pharmacySearchSchema>;

// =====================================================
// Helper function to validate with Zod
// =====================================================

export function validateForm<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: Record<string, string> = {};
  result.error.issues.forEach((issue) => {
    const path = issue.path.join('.');
    if (!errors[path]) {
      errors[path] = issue.message;
    }
  });

  return { success: false, errors };
}
