import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from './useAuth';

export interface PendingInvite {
  id: string;
  invite_code: string;
  doctor_user_id: string;
  patient_email: string;
  status: string;
  created_at: string;
  expires_at: string;
  doctor: {
    first_name: string;
    last_name: string;
    specialty: string | null;
    crm: string | null;
    crm_uf: string | null;
  } | null;
}

export const usePendingInvites = () => {
  const { user } = useAuth();
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPendingInvites = async () => {
    if (!user?.email) {
      setInvites([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch pending invites for this user's email
      const { data: inviteData, error: inviteError } = await supabase
        .from('connection_invites')
        .select('*')
        .eq('patient_email', user.email)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString());

      if (inviteError) throw inviteError;

      if (!inviteData || inviteData.length === 0) {
        setInvites([]);
        setLoading(false);
        return;
      }

      // Fetch doctor profiles for each invite
      const doctorIds = inviteData.map(inv => inv.doctor_user_id);
      const { data: doctorProfiles, error: doctorError } = await supabase
        .from('healthcare_professionals')
        .select('user_id, first_name, last_name, specialty, crm, crm_uf')
        .in('user_id', doctorIds);

      if (doctorError) throw doctorError;

      // Map invites with doctor profiles
      const mappedInvites: PendingInvite[] = inviteData.map(invite => {
        const doctor = doctorProfiles?.find(d => d.user_id === invite.doctor_user_id);
        return {
          id: invite.id,
          invite_code: invite.invite_code,
          doctor_user_id: invite.doctor_user_id,
          patient_email: invite.patient_email,
          status: invite.status || 'pending',
          created_at: invite.created_at || '',
          expires_at: invite.expires_at || '',
          doctor: doctor ? {
            first_name: doctor.first_name,
            last_name: doctor.last_name,
            specialty: doctor.specialty,
            crm: doctor.crm,
            crm_uf: doctor.crm_uf
          } : null
        };
      });

      setInvites(mappedInvites);
    } catch (err) {
      console.error('Error fetching pending invites:', err);
      setError('Erro ao carregar convites pendentes');
    } finally {
      setLoading(false);
    }
  };

  const acceptInvite = async (invite: PendingInvite): Promise<boolean> => {
    if (!user) return false;

    try {
      console.log('[usePendingInvites] Calling accept-doctor-invite for invite:', invite.id);
      
      const { data, error } = await supabase.functions.invoke('accept-doctor-invite', {
        body: { invite_id: invite.id }
      });

      if (error) {
        console.error('[usePendingInvites] Edge function error:', error);
        return false;
      }

      if (!data?.success) {
        console.error('[usePendingInvites] Accept failed:', data?.error);
        return false;
      }

      console.log('[usePendingInvites] Accept successful:', data);
      
      // Refresh invites list
      await fetchPendingInvites();
      return true;
    } catch (err) {
      console.error('[usePendingInvites] Error accepting invite:', err);
      return false;
    }
  };

  const rejectInvite = async (invite: PendingInvite): Promise<boolean> => {
    if (!user) return false;

    try {
      console.log('[usePendingInvites] Calling reject-doctor-invite for invite:', invite.id);
      
      const { data, error } = await supabase.functions.invoke('reject-doctor-invite', {
        body: { invite_id: invite.id }
      });

      if (error) {
        console.error('[usePendingInvites] Edge function error:', error);
        return false;
      }

      if (!data?.success) {
        console.error('[usePendingInvites] Reject failed:', data?.error);
        return false;
      }

      console.log('[usePendingInvites] Reject successful:', data);
      
      // Refresh invites list
      await fetchPendingInvites();
      return true;
    } catch (err) {
      console.error('[usePendingInvites] Error rejecting invite:', err);
      return false;
    }
  };

  useEffect(() => {
    fetchPendingInvites();
  }, [user?.email]);

  return {
    invites,
    loading,
    error,
    refetch: fetchPendingInvites,
    acceptInvite,
    rejectInvite
  };
};
