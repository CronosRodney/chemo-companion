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

  // Real-time listener for profile changes
  useEffect(() => {
    if (!user) return;

    const profileChannel = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Profile updated in real-time:', payload.new);
          setProfile(payload.new as UserProfile);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profileChannel);
    };
  }, [user]);

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
        // Obter dados do usuário autenticado (inclui metadata do provider OAuth)
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        // Extrair nome do provider (Google/Apple fornecem em user_metadata)
        const metadata = authUser?.user_metadata || {};
        const providerName = metadata.full_name || metadata.name || '';
        const [firstName, ...lastParts] = providerName.split(' ');
        const lastName = lastParts.join(' ');
        
        // Email pode ser privado (Apple relay @privaterelay.appleid.com)
        const email = authUser?.email || '';
        
        // Criar perfil com dados do provider ou valores padrão mínimos
        const newProfile = {
          user_id: userId,
          first_name: firstName || 'Usuário',
          last_name: lastName || '',
          email: email,
        };

        const { data: createdProfile, error: createError } = await supabase
          .from('profiles')
          .insert(newProfile)
          .select()
          .single();

        if (createError) throw createError;
        setProfile(createdProfile);
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