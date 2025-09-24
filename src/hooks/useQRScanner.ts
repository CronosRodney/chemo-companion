import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ClinicData {
  clinic_name: string;
  legal_name?: string;
  cnpj?: string;
  cnes?: string;
  address?: {
    street?: string;
    number?: string;
    district?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  contacts?: {
    phone?: string;
    whatsapp?: string;
    email?: string;
    website?: string;
    maps_url?: string;
  };
  hours?: string;
  updated_at?: string;
  responsible?: {
    name: string;
    role?: string;
    council?: string;
    council_uf?: string;
    registration?: string;
    email?: string;
    phone?: string;
  };
  deputy_responsible?: {
    name: string;
    role?: string;
    council?: string;
    council_uf?: string;
    registration?: string;
    email?: string;
    phone?: string;
  };
}

export interface MedicationData {
  name: string;
  batch_number?: string;
  expiry_date?: string;
  manufacturer?: string;
  active_ingredient?: string;
  concentration?: string;
  form?: string;
  route?: string;
  gtin?: string;
}

export interface ParsedQRData {
  type: 'clinic' | 'medication';
  data: ClinicData | MedicationData;
}

export const useQRScanner = () => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);

  const requestCameraPermission = useCallback(async () => {
    try {
      // Check if camera API is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('Camera API not available. HTTPS required.');
        setHasPermission(false);
        return false;
      }

      // Check if permission was already granted by querying permissions API
      if (navigator.permissions) {
        try {
          const permissionStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });
          if (permissionStatus.state === 'granted') {
            setHasPermission(true);
            return true;
          }
          if (permissionStatus.state === 'denied') {
            setHasPermission(false);
            return false;
          }
        } catch (permError) {
          console.log('Permissions API not available, proceeding with getUserMedia');
        }
      }

      // Request camera access
      const constraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Stop all tracks immediately after getting permission
      stream.getTracks().forEach(track => track.stop());
      
      setHasPermission(true);
      return true;
    } catch (error: any) {
      console.error('Camera permission error:', error);
      
      // If back camera fails, try any available camera
      if (error.name === 'OverconstrainedError' || error.name === 'NotFoundError') {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          stream.getTracks().forEach(track => track.stop());
          setHasPermission(true);
          return true;
        } catch (fallbackError) {
          console.error('Fallback camera access failed:', fallbackError);
        }
      }
      
      setHasPermission(false);
      return false;
    }
  }, []);

  const parseQRData = async (data: string): Promise<ParsedQRData | null> => {
    try {
      // Tentar fazer parse como JSON
      const parsed = JSON.parse(data);
      
      if (parsed.type === 'clinic') {
        return {
          type: 'clinic',
          data: parsed as ClinicData
        };
      } else if (parsed.type === 'medication') {
        return {
          type: 'medication',
          data: parsed as MedicationData
        };
      }
    } catch (error) {
      // Se não for JSON, tentar como URL
      if (data.startsWith('http')) {
        try {
          const response = await fetch(data);
          const jsonData = await response.json();
          
          if (jsonData.type === 'clinic') {
            return {
              type: 'clinic',
              data: jsonData as ClinicData
            };
          } else if (jsonData.type === 'medication') {
            return {
              type: 'medication',
              data: jsonData as MedicationData
            };
          }
        } catch (fetchError) {
          console.error('Erro ao buscar dados do QR Code:', fetchError);
        }
      }
    }
    
    return null;
  };

  const saveClinicData = async (clinicData: ClinicData) => {
    setLoading(true);
    try {
      // Inserir dados da clínica
      const { data: clinic, error: clinicError } = await supabase
        .from('clinics')
        .insert({
          clinic_name: clinicData.clinic_name,
          legal_name: clinicData.legal_name,
          cnpj: clinicData.cnpj,
          cnes: clinicData.cnes,
          street: clinicData.address?.street,
          number: clinicData.address?.number,
          district: clinicData.address?.district,
          city: clinicData.address?.city,
          state: clinicData.address?.state,
          zip: clinicData.address?.zip,
          phone: clinicData.contacts?.phone,
          whatsapp: clinicData.contacts?.whatsapp,
          email: clinicData.contacts?.email,
          website: clinicData.contacts?.website,
          maps_url: clinicData.contacts?.maps_url,
          hours: clinicData.hours
        })
        .select()
        .single();

      if (clinicError) throw clinicError;

      // Inserir responsável principal
      if (clinicData.responsible && clinic) {
        const { error: responsibleError } = await supabase
          .from('clinic_responsible')
          .insert({
            clinic_id: clinic.id,
            name: clinicData.responsible.name,
            role: clinicData.responsible.role,
            council: clinicData.responsible.council,
            council_uf: clinicData.responsible.council_uf,
            registration: clinicData.responsible.registration,
            email: clinicData.responsible.email,
            phone: clinicData.responsible.phone,
            is_deputy: false
          });

        if (responsibleError) throw responsibleError;
      }

      // Inserir responsável substituto
      if (clinicData.deputy_responsible && clinic) {
        const { error: deputyError } = await supabase
          .from('clinic_responsible')
          .insert({
            clinic_id: clinic.id,
            name: clinicData.deputy_responsible.name,
            role: clinicData.deputy_responsible.role,
            council: clinicData.deputy_responsible.council,
            council_uf: clinicData.deputy_responsible.council_uf,
            registration: clinicData.deputy_responsible.registration,
            email: clinicData.deputy_responsible.email,
            phone: clinicData.deputy_responsible.phone,
            is_deputy: true
          });

        if (deputyError) throw deputyError;
      }

      // Conectar usuário à clínica (precisa de autenticação)
      const { data: { user } } = await supabase.auth.getUser();
      if (user && clinic) {
        await supabase
          .from('user_clinic_connections')
          .insert({
            user_id: user.id,
            clinic_id: clinic.id
          });
      }

      return clinic;
    } catch (error) {
      console.error('Erro ao salvar dados da clínica:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const saveMedicationData = async (medicationData: MedicationData) => {
    setLoading(true);
    try {
      // Inserir dados do medicamento
      const { data: medication, error: medicationError } = await supabase
        .from('medications')
        .insert({
          name: medicationData.name,
          batch_number: medicationData.batch_number,
          expiry_date: medicationData.expiry_date,
          manufacturer: medicationData.manufacturer,
          active_ingredient: medicationData.active_ingredient,
          concentration: medicationData.concentration,
          form: medicationData.form,
          route: medicationData.route,
          gtin: medicationData.gtin
        })
        .select()
        .single();

      if (medicationError) throw medicationError;

      // Conectar usuário ao medicamento (precisa de autenticação)
      const { data: { user } } = await supabase.auth.getUser();
      if (user && medication) {
        await supabase
          .from('user_medications')
          .insert({
            user_id: user.id,
            medication_id: medication.id
          });
      }

      return medication;
    } catch (error) {
      console.error('Erro ao salvar dados do medicamento:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    setScanned(true);
    setLoading(true);

    try {
      const parsedData = await parseQRData(data);
      
      if (!parsedData) {
        throw new Error('Formato de QR Code não reconhecido');
      }

      if (parsedData.type === 'clinic') {
        await saveClinicData(parsedData.data as ClinicData);
      } else if (parsedData.type === 'medication') {
        await saveMedicationData(parsedData.data as MedicationData);
      }

      return parsedData;
    } catch (error) {
      console.error('Erro ao processar QR Code:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resetScanner = () => {
    setScanned(false);
  };

  return {
    hasPermission,
    scanned,
    loading,
    handleBarCodeScanned,
    resetScanner,
    parseQRData,
    saveClinicData,
    saveMedicationData,
    requestCameraPermission
  };
};