import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from './useAuth';

export interface HealthcareProfessional {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  crm: string | null;
  crm_uf: string | null;
  specialty: string | null;
  clinic_id: string | null;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export const useDoctorAuth = () => {
  const { user, loading: authLoading } = useAuth();
  const [isDoctor, setIsDoctor] = useState(false);
  const [doctorProfile, setDoctorProfile] = useState<HealthcareProfessional | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      setIsDoctor(false);
      setDoctorProfile(null);
      setLoading(false);
      return;
    }

    checkDoctorStatus();
  }, [user, authLoading]);

  const checkDoctorStatus = async () => {
    if (!user) return;

    try {
      // Check if user has doctor role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'doctor')
        .maybeSingle();

      if (roleError) throw roleError;

      if (roleData) {
        setIsDoctor(true);
        
        // Load doctor profile
        const { data: profileData, error: profileError } = await supabase
          .from('healthcare_professionals')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (profileError) throw profileError;
        setDoctorProfile(profileData);
      } else {
        setIsDoctor(false);
        setDoctorProfile(null);
      }
    } catch (error) {
      console.error('Error checking doctor status:', error);
      setIsDoctor(false);
      setDoctorProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const registerAsDoctor = async (data: {
    first_name: string;
    last_name: string;
    crm: string;
    crm_uf: string;
    specialty: string;
  }) => {
    if (!user) throw new Error('User not authenticated');

    const { data: newProfile, error } = await supabase
      .from('healthcare_professionals')
      .insert({
        user_id: user.id,
        first_name: data.first_name,
        last_name: data.last_name,
        crm: data.crm,
        crm_uf: data.crm_uf,
        specialty: data.specialty,
        is_verified: false
      })
      .select()
      .single();

    if (error) throw error;

    setDoctorProfile(newProfile);
    setIsDoctor(true);
    
    return newProfile;
  };

  return {
    user,
    isDoctor,
    doctorProfile,
    loading: loading || authLoading,
    registerAsDoctor,
    refreshDoctorStatus: checkDoctorStatus
  };
};
