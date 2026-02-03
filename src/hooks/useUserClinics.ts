import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ConnectedClinic {
  id: string;
  clinic_name: string;
  legal_name?: string;
  phone?: string;
  email?: string;
  website?: string;
  street?: string;
  city?: string;
  state?: string;
  connected_at: string;
  clinic_responsible?: {
    name: string;
    phone?: string;
    email?: string;
    role?: string;
  }[];
}

export const useUserClinics = () => {
  const [clinics, setClinics] = useState<ConnectedClinic[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const location = useLocation();

  const fetchUserClinics = async () => {
    // Não executar durante bootstrap de role
    if (location.pathname === '/choose-role') {
      setLoading(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: connections, error } = await supabase
        .from('user_clinic_connections')
        .select(`
          id,
          connected_at,
          clinic_id,
          clinics (
            id,
            clinic_name,
            legal_name,
            phone,
            email,
            website,
            street,
            city,
            state
          )
        `)
        .eq('user_id', user.id)
        .order('connected_at', { ascending: false });

      if (error) {
        console.error('Error fetching clinics:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar as clínicas conectadas",
          variant: "destructive"
        });
        return;
      }

      // Fetch clinic responsible for each clinic
      const clinicsWithResponsible = await Promise.all(
        (connections || []).map(async (connection: any) => {
          const { data: responsible } = await supabase
            .from('clinic_responsible')
            .select('name, phone, email, role')
            .eq('clinic_id', connection.clinic_id);

          return {
            id: connection.clinics.id,
            clinic_name: connection.clinics.clinic_name,
            legal_name: connection.clinics.legal_name,
            phone: connection.clinics.phone,
            email: connection.clinics.email,
            website: connection.clinics.website,
            street: connection.clinics.street,
            city: connection.clinics.city,
            state: connection.clinics.state,
            connected_at: connection.connected_at,
            clinic_responsible: responsible || []
          };
        })
      );

      setClinics(clinicsWithResponsible);
    } catch (error) {
      console.error('Error in fetchUserClinics:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao carregar clínicas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserClinics();
  }, []);

  return {
    clinics,
    loading,
    refetch: fetchUserClinics
  };
};