import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface UserProfile {
  id?: string;
  user_id?: string;
  first_name: string;
  last_name?: string;
  email?: string;
  phone?: string;
  birth_date?: string;
  cpf?: string;
  rg?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  medical_history?: string;
  allergies?: string;
  current_medications?: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          loadProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setProfile(data);
      } else {
        // Create default profile if none exists
        const defaultProfile = {
          user_id: userId,
          first_name: 'João',
          last_name: 'Silva',
          email: 'joao.silva@email.com',
          phone: '(11) 99999-9999',
          birth_date: '1985-03-15',
          cpf: '123.456.789-00',
          rg: '12.345.678-9',
          address: 'Rua das Flores, 123, Apto 45',
          city: 'São Paulo',
          state: 'SP',
          zip: '01234-567',
          emergency_contact_name: 'Maria Silva',
          emergency_contact_phone: '(11) 88888-8888',
          medical_history: 'Hipertensão arterial, Diabetes tipo 2',
          allergies: 'Penicilina, Ácido acetilsalicílico',
          current_medications: 'Losartana 50mg, Metformina 850mg'
        };

        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert(defaultProfile)
          .select()
          .single();

        if (createError) throw createError;
        setProfile(newProfile);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o perfil do usuário",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user || !profile) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id);

      if (error) throw error;

      setProfile({ ...profile, ...updates });
      toast({
        title: "Sucesso",
        description: "Perfil atualizado com sucesso"
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o perfil",
        variant: "destructive"
      });
    }
  };

  return {
    user,
    profile,
    loading,
    updateProfile,
    loadProfile
  };
};