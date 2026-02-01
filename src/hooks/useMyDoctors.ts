import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from './useAuth';

export interface ConnectedDoctor {
  id: string;
  connection_id: string;
  first_name: string;
  last_name: string;
  specialty: string | null;
  crm: string | null;
  crm_uf: string | null;
  status: string;
  connected_at: string | null;
}

export const useMyDoctors = () => {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState<ConnectedDoctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDoctors = async () => {
    if (!user) {
      setDoctors([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Fetch connections where this user is the patient
      const { data: connections, error: connError } = await supabase
        .from('patient_doctor_connections')
        .select('id, doctor_user_id, status, connected_at')
        .eq('patient_user_id', user.id);

      if (connError) throw connError;

      if (!connections || connections.length === 0) {
        setDoctors([]);
        setLoading(false);
        return;
      }

      // Fetch doctor profiles
      const doctorIds = connections.map(c => c.doctor_user_id);
      const { data: doctorProfiles, error: profileError } = await supabase
        .from('healthcare_professionals')
        .select('user_id, first_name, last_name, specialty, crm, crm_uf')
        .in('user_id', doctorIds);

      if (profileError) throw profileError;

      // Map connections with doctor profiles
      const mappedDoctors: ConnectedDoctor[] = connections.map(conn => {
        const profile = doctorProfiles?.find(p => p.user_id === conn.doctor_user_id);
        return {
          id: profile?.user_id || conn.doctor_user_id,
          connection_id: conn.id,
          first_name: profile?.first_name || 'Médico',
          last_name: profile?.last_name || '',
          specialty: profile?.specialty || null,
          crm: profile?.crm || null,
          crm_uf: profile?.crm_uf || null,
          status: conn.status || 'pending',
          connected_at: conn.connected_at
        };
      });

      setDoctors(mappedDoctors);
    } catch (err) {
      console.error('Error fetching doctors:', err);
      setError('Erro ao carregar médicos conectados');
    } finally {
      setLoading(false);
    }
  };

  const disconnectDoctor = async (connectionId: string) => {
    try {
      const { error } = await supabase
        .from('patient_doctor_connections')
        .update({ status: 'disconnected' })
        .eq('id', connectionId)
        .eq('patient_user_id', user?.id);

      if (error) throw error;
      
      await fetchDoctors();
      return true;
    } catch (err) {
      console.error('Error disconnecting doctor:', err);
      return false;
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, [user]);

  return {
    doctors,
    loading,
    error,
    refetch: fetchDoctors,
    disconnectDoctor
  };
};
