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
  type: 'clinic' | 'medication' | 'url';
  data?: ClinicData | MedicationData;
  url?: string;
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
      // Validar se data é uma string válida
      if (!data || typeof data !== 'string') {
        console.log('Dados do QR Code inválidos:', data);
        return null;
      }

      console.log('Tentando fazer parse dos dados:', data);
      
      // Verificar se é um QR code de demonstração
      if (data.includes('demo') || data.includes('teste') || data.includes('example')) {
        return {
          type: 'clinic',
          data: {
            clinic_name: 'Clínica de Demonstração',
            legal_name: 'Clínica Demo LTDA',
            cnpj: '12.345.678/0001-90',
            cnes: '1234567',
            address: {
              street: 'Rua Demo',
              number: '123',
              district: 'Centro',
              city: 'São Paulo',
              state: 'SP',
              zip: '01234-567'
            },
            contacts: {
              phone: '(11) 1234-5678',
              whatsapp: '(11) 91234-5678',
              email: 'contato@clinicademo.com.br'
            },
            hours: 'Segunda a Sexta: 8h às 18h',
            responsible: {
              name: 'Dr. João Demo',
              role: 'Médico Responsável',
              council: 'CRM',
              council_uf: 'SP',
              registration: '123456'
            }
          } as ClinicData
        };
      }
      
      // Tentar fazer parse como JSON primeiro
      try {
        const parsed = JSON.parse(data);
        
        if (parsed.type === 'clinic') {
          return {
            type: 'clinic',
            data: parsed.data as ClinicData
          };
        } else if (parsed.type === 'medication') {
          return {
            type: 'medication',
            data: parsed.data as MedicationData
          };
        }
      } catch (jsonError) {
        console.log('Não é JSON válido, tentando parse de texto:', jsonError);
      }
      
      // Se não for JSON, tentar fazer parse como texto de clínica
      if (data.includes('Hospital') || data.includes('Clínica') || data.includes('Diretor')) {
        return parseClinicText(data);
      }
      
      // Se não for JSON, verificar se é uma URL de medicamento
      if (typeof data === 'string' && data.startsWith('http')) {
        console.log('Reconhecido como URL de medicamento:', data);
        return {
          type: 'url',
          url: data
        };
      }
    } catch (error) {
      console.log('Erro geral no parse:', error);
    }
    
    console.log('Formato não reconhecido. Dados recebidos:', data);
    return null;
  };

  const parseClinicText = (text: string): ParsedQRData | null => {
    try {
      // Extrair nome da clínica/hospital
      const nameMatch = text.match(/(Hospital|Clínica)\s+([^-]+)/);
      const clinicName = nameMatch ? nameMatch[0].trim() : 'Clínica não identificada';
      
      // Extrair diretor/responsável
      const directorMatch = text.match(/Diretor\s+Clínico\s+([^E]+)/);
      const directorName = directorMatch ? directorMatch[1].trim() : '';
      
      // Extrair endereço
      const addressMatch = text.match(/Endereço\s+([^C]+)/);
      const addressText = addressMatch ? addressMatch[1].trim() : '';
      
      // Extrair telefone
      const phoneMatch = text.match(/Telefone:\s*([^\s]+)/);
      const phone = phoneMatch ? phoneMatch[1].trim() : '';
      
      // Extrair email
      const emailMatch = text.match(/Email:\s*([^\s"]+)/);
      const email = emailMatch ? emailMatch[1].trim() : '';
      
      // Parse do endereço
      let address = {};
      if (addressText) {
        const parts = addressText.split(',').map(p => p.trim());
        if (parts.length >= 3) {
          address = {
            street: parts[0],
            district: parts[1],
            city: parts[2].split(' - ')[0],
            state: parts[2].split(' - ')[1] || ''
          };
        }
      }
      
      const clinicData: ClinicData = {
        clinic_name: clinicName,
        address,
        contacts: {
          phone: phone,
          email: email
        },
        responsible: directorName ? {
          name: directorName,
          role: 'Diretor Clínico'
        } : undefined
      };
      
      return {
        type: 'clinic',
        data: clinicData
      };
    } catch (error) {
      console.error('Erro ao fazer parse do texto da clínica:', error);
      return null;
    }
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
      // Validar se data é válido
      if (!data || typeof data !== 'string') {
        throw new Error('Dados do QR Code inválidos');
      }
      
      const parsedData = await parseQRData(data);
      
      if (!parsedData) {
        throw new Error(
          `Formato de QR Code não reconhecido.\n\nDados lidos: "${data}"\n\nFormatos aceitos:\n- JSON com {"type": "clinic", "data": {...}}\n- JSON com {"type": "medication", "data": {...}}\n- URLs de medicamentos (http/https)\n- QR codes com palavras "demo", "teste" ou "example" para demonstração`
        );
      }

      if (parsedData.type === 'clinic' && parsedData.data) {
        await saveClinicData(parsedData.data as ClinicData);
      } else if (parsedData.type === 'medication' && parsedData.data) {
        await saveMedicationData(parsedData.data as MedicationData);
      } else if (parsedData.type === 'url' && parsedData.url) {
        // Para URLs de medicamentos, apenas abrir o link e registrar na timeline
        window.open(parsedData.url, '_blank', 'noopener,noreferrer');
        
        // Registrar na timeline se o usuário estiver logado
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('timeline_events').insert({
            user_id: user.id,
            kind: 'med_qr',
            title: 'Link de bula acessado',
            details: `URL: ${parsedData.url}`,
            occurred_at: new Date().toISOString()
          });
        }
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