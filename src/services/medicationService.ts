import { supabase } from '../integrations/supabase/client';
import { GS1Parsed } from '../lib/gs1';
import { ExtractedData } from './urlExtractorService';

export interface MedicationData {
  gtin?: string;
  name: string;
  activeIngredient?: string;
  manufacturer?: string;
  concentration?: string;
  form?: string;
  route?: string;
  expiryDate?: string;
  batchNumber?: string;
}

export class MedicationService {
  // Create or update medication record
  static async saveMedication(data: MedicationData): Promise<{ id: string }> {
    try {
      // Check if medication exists by GTIN
      let medication;
      
      if (data.gtin) {
        const { data: existing } = await supabase
          .from('medications')
          .select('id')
          .eq('gtin', data.gtin)
          .maybeSingle();
          
        if (existing) {
          // Update existing medication
          const { data: updated, error } = await supabase
            .from('medications')
            .update({
              name: data.name,
              active_ingredient: data.activeIngredient,
              manufacturer: data.manufacturer,
              concentration: data.concentration,
              form: data.form,
              route: data.route,
              expiry_date: data.expiryDate,
              batch_number: data.batchNumber,
              updated_at: new Date().toISOString()
            })
            .eq('id', existing.id)
            .select('id')
            .single();
            
          if (error) throw error;
          medication = updated;
        }
      }
      
      if (!medication) {
        // Create new medication
        const { data: created, error } = await supabase
          .from('medications')
          .insert({
            gtin: data.gtin,
            name: data.name,
            active_ingredient: data.activeIngredient,
            manufacturer: data.manufacturer,
            concentration: data.concentration,
            form: data.form,
            route: data.route,
            expiry_date: data.expiryDate,
            batch_number: data.batchNumber
          })
          .select('id')
          .single();
          
        if (error) throw error;
        medication = created;
      }
      
      return medication;
    } catch (error) {
      console.error('Failed to save medication:', error);
      throw error;
    }
  }
  
  // Link medication to user
  static async linkToUser(medicationId: string, dose?: string, frequency?: string, instructions?: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      // Check if user already has this medication
      const { data: existing } = await supabase
        .from('user_medications')
        .select('id')
        .eq('user_id', user.id)
        .eq('medication_id', medicationId)
        .maybeSingle();
        
      if (existing) {
        // Update existing record
        const { error } = await supabase
          .from('user_medications')
          .update({
            dose,
            frequency,
            instructions,
            scanned_at: new Date().toISOString()
          })
          .eq('id', existing.id);
          
        if (error) throw error;
      } else {
        // Create new record
        const { error } = await supabase
          .from('user_medications')
          .insert({
            user_id: user.id,
            medication_id: medicationId,
            dose,
            frequency,
            instructions
          });
          
        if (error) throw error;
      }
    } catch (error) {
      console.error('Failed to link medication to user:', error);
      throw error;
    }
  }
  
  // Convert GS1 data to medication data
  static fromGS1(parsed: GS1Parsed): MedicationData {
    return {
      gtin: parsed.gtin,
      name: 'Medicamento Escaneado', // Default name, will be updated if found in database
      expiryDate: parsed.expiry,
      batchNumber: parsed.lot
    };
  }
  
  // Convert URL extracted data to medication data
  static fromExtractedData(extracted: ExtractedData): MedicationData {
    return {
      name: extracted.name || 'Medicamento via URL',
      activeIngredient: extracted.activeIngredient,
      manufacturer: extracted.manufacturer,
      concentration: extracted.concentration,
      form: extracted.form,
      route: extracted.route
    };
  }
  
  // Add timeline event
  static async addTimelineEvent(eventType: string, title: string, description: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      const now = new Date();
      const { error } = await supabase.from('user_events').insert({
        user_id: user.id,
        event_type: eventType,
        title,
        description,
        event_date: now.toISOString().split('T')[0],
        event_time: now.toTimeString().split(' ')[0],
        severity: 3 // Default severity for medication events
      });
      
      if (error) throw error;
    } catch (error) {
      console.error('Failed to add timeline event:', error);
      throw error;
    }
  }
}