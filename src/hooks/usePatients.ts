import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from './useAuth';

export interface PatientConnection {
  id: string;
  patient_user_id: string;
  doctor_user_id: string;
  status: string;
  connected_at: string | null;
  created_at: string;
  patient_profile?: {
    first_name: string;
    last_name: string | null;
    email: string | null;
    phone: string | null;
    birth_date: string | null;
  };
}

export interface PatientWithTreatment extends PatientConnection {
  active_treatments: number;
  last_event: string | null;
  has_alerts: boolean;
}

export const usePatients = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState<PatientWithTreatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setPatients([]);
      setLoading(false);
      return;
    }

    loadPatients();
  }, [user]);

  const loadPatients = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Get all active connections
      const { data: connections, error: connError } = await supabase
        .from('patient_doctor_connections')
        .select('*')
        .eq('doctor_user_id', user.id)
        .eq('status', 'active');

      if (connError) throw connError;

      if (!connections || connections.length === 0) {
        setPatients([]);
        return;
      }

      // Get patient profiles for each connection
      const patientIds = connections.map(c => c.patient_user_id);
      
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, email, phone, birth_date')
        .in('user_id', patientIds);

      if (profilesError) throw profilesError;

      // Get treatment counts
      const { data: treatments, error: treatmentsError } = await supabase
        .from('treatment_plans')
        .select('user_id, status')
        .in('user_id', patientIds)
        .eq('status', 'active');

      if (treatmentsError) throw treatmentsError;

      // Get recent events
      const { data: events, error: eventsError } = await supabase
        .from('user_events')
        .select('user_id, created_at, severity')
        .in('user_id', patientIds)
        .order('created_at', { ascending: false })
        .limit(100);

      if (eventsError) throw eventsError;

      // Combine data
      const enrichedPatients: PatientWithTreatment[] = connections.map(conn => {
        const profile = profiles?.find(p => p.user_id === conn.patient_user_id);
        const patientTreatments = treatments?.filter(t => t.user_id === conn.patient_user_id) || [];
        const patientEvents = events?.filter(e => e.user_id === conn.patient_user_id) || [];
        const hasHighSeverityEvent = patientEvents.some(e => e.severity && e.severity >= 3);

        return {
          ...conn,
          patient_profile: profile ? {
            first_name: profile.first_name,
            last_name: profile.last_name,
            email: profile.email,
            phone: profile.phone,
            birth_date: profile.birth_date
          } : undefined,
          active_treatments: patientTreatments.length,
          last_event: patientEvents[0]?.created_at || null,
          has_alerts: hasHighSeverityEvent
        };
      });

      setPatients(enrichedPatients);
    } catch (err) {
      console.error('Error loading patients:', err);
      setError('Erro ao carregar pacientes');
    } finally {
      setLoading(false);
    }
  };

  const getPendingConnections = async () => {
    if (!user) return [];

    const { data, error } = await supabase
      .from('patient_doctor_connections')
      .select('*')
      .eq('doctor_user_id', user.id)
      .eq('status', 'pending');

    if (error) {
      console.error('Error loading pending connections:', error);
      return [];
    }

    return data || [];
  };

  return {
    patients,
    loading,
    error,
    refreshPatients: loadPatients,
    getPendingConnections
  };
};
