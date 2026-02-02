import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserClinics, ConnectedClinic } from '@/hooks/useUserClinics';
import { useMyDoctors, ConnectedDoctor } from '@/hooks/useMyDoctors';
import { supabase } from '@/integrations/supabase/client';
import { loadUserStats, UserStats } from '@/services/statsService';
import { toast } from '@/hooks/use-toast';

interface AppData {
  // User data
  user: any;
  profile: any;
  loading: boolean;
  
  // Medical data
  medications: any[];
  events: any[];
  reminders: any[];
  clinics: ConnectedClinic[];
  clinicsLoading: boolean;
  doctors: ConnectedDoctor[];
  doctorsLoading: boolean;
  stats: {
    adherence: number;
    nextAppointment: string;
    currentCycle: string;
  };
  
  // Treatment data
  treatmentPlans: any[];
  currentTreatmentPlan: any | null;
  treatmentCycles: any[];
  
  // Actions
  updateProfile: (data: any) => Promise<void>;
  addEvent: (event: any) => void;
  addMedication: (medication: any) => void;
  updateReminders: (reminders: any[]) => void;
  logFeeling: (rating: number) => Promise<void>;
  deleteEvent: (eventId: string, tableName: 'events' | 'user_events') => Promise<void>;
  updateEvent: (eventId: string, tableName: 'events' | 'user_events', data: any) => Promise<void>;
  refetchClinics: () => void;
  refetchDoctors: () => void;
  refetchMedications: () => void;
  refetchEvents: () => void;
  refetchStats: () => Promise<void>;
  refetchAllData: () => Promise<void>;
  addReminder: (reminder: any) => Promise<void>;
  updateReminder: (id: string, reminder: any) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
  
  // Treatment actions
  addTreatmentPlan: (plan: any) => Promise<void>;
  updateTreatmentPlan: (id: string, data: any) => Promise<void>;
  refetchTreatmentPlans: () => Promise<void>;
}

const AppContext = createContext<AppData | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, loading, updateProfile: updateUserProfile } = useAuth();
  const { clinics, loading: clinicsLoading, refetch: refetchClinics } = useUserClinics();
  const { doctors, loading: doctorsLoading, refetch: refetchDoctors } = useMyDoctors();
  
  const [medications, setMedications] = useState<any[]>([]);

  const [events, setEvents] = useState<any[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);
  const [stats, setStats] = useState<UserStats>({
    adherence: 95,
    nextAppointment: "Não agendada",
    currentCycle: "N/A"
  });
  
  // Treatment state
  const [treatmentPlans, setTreatmentPlans] = useState<any[]>([]);
  const [currentTreatmentPlan, setCurrentTreatmentPlan] = useState<any | null>(null);
  const [treatmentCycles, setTreatmentCycles] = useState<any[]>([]);

  // Load user medications from database
  const loadMedications = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_medications')
        .select(`
          id,
          dose,
          frequency,
          instructions,
          scanned_at,
          clinic_id,
          medication:medications (
            id,
            name,
            concentration,
            form,
            route,
            manufacturer,
            batch_number,
            expiry_date
          ),
          clinic:clinics (
            id,
            clinic_name,
            legal_name,
            cnpj,
            cnes,
            street,
            number,
            district,
            city,
            state,
            zip,
            phone,
            whatsapp,
            email,
            website,
            maps_url,
            hours
          )
        `)
        .eq('user_id', user.id)
        .order('scanned_at', { ascending: false});

      if (error) throw error;

      const formattedMeds = (data || []).map((um: any) => ({
        id: um.id,
        name: um.medication?.name || 'Medicamento',
        dose: um.dose,
        frequency: um.frequency,
        instructions: um.instructions,
        concentration: um.medication?.concentration,
        form: um.medication?.form,
        route: um.medication?.route,
        manufacturer: um.medication?.manufacturer,
        batch_number: um.medication?.batch_number,
        expiry_date: um.medication?.expiry_date,
        scanned_at: um.scanned_at,
        clinic: um.clinic
      }));

      setMedications(formattedMeds);
    } catch (error) {
      console.error('Error loading medications:', error);
    }
  };

  // Load manual events from events table (mood, symptoms, etc.)
  const loadEventsFromEventsTable = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', user.id)
        .order('event_date', { ascending: false })
        .order('event_time', { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  // Load automatic events from user_events table (medications, appointments)
  const loadEvents = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_events')
        .select('*')
        .eq('user_id', user.id)
        .order('event_date', { ascending: false })
        .order('event_time', { ascending: false });

      if (error) throw error;
      // This is used by Timeline for automatic events
      return data || [];
    } catch (error) {
      console.error('Error loading events:', error);
      return [];
    }
  };

  // Load reminders from database
  const loadReminders = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('user_id', user.id)
        .eq('active', true)
        .order('time', { ascending: true });

      if (error) throw error;
      setReminders(data || []);
    } catch (error) {
      console.error('Error loading reminders:', error);
    }
  };

  // Load stats from database
  const loadStats = async () => {
    if (!user) return;
    
    try {
      const statsData = await loadUserStats(user.id);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  // Load treatment plans
  const loadTreatmentPlans = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('treatment_plans')
        .select(`
          *,
          clinic:clinics(*),
          drugs:treatment_drugs(*),
          cycles:treatment_cycles(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setTreatmentPlans(data || []);
      
      // Set active plan as current
      const activePlan = data?.find(p => p.status === 'active');
      setCurrentTreatmentPlan(activePlan || null);
    } catch (error) {
      console.error('Error loading treatment plans:', error);
    }
  };

  // Load data when user changes
  useEffect(() => {
    if (user) {
      loadMedications();
      loadEventsFromEventsTable();
      loadReminders();
      loadStats();
      loadTreatmentPlans();
    }
  }, [user]);

  // Setup realtime listeners for data updates
  useEffect(() => {
    if (!user) return;

    // Listen to reminders changes
    const remindersChannel = supabase
      .channel('reminders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reminders',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          console.log('Reminders changed, reloading...');
          loadReminders();
        }
      )
      .subscribe();

    // Listen to user_events changes (for stats)
    const userEventsChannel = supabase
      .channel('user-events-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_events',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          console.log('User events changed, reloading stats...');
          loadStats();
          loadEventsFromEventsTable();
        }
      )
      .subscribe();

    // Listen to events changes
    const eventsChannel = supabase
      .channel('events-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          console.log('Events changed, reloading...');
          loadEventsFromEventsTable();
          loadStats();
        }
      )
      .subscribe();

    // Listen to user_stats changes
    const statsChannel = supabase
      .channel('user-stats-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_stats',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          console.log('Stats changed, reloading...');
          loadStats();
        }
      )
      .subscribe();

    // Listen to treatment_plans changes for real-time consistency
    const treatmentPlansChannel = supabase
      .channel('treatment-plans-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'treatment_plans',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          console.log('Treatment plans changed, reloading...');
          loadTreatmentPlans();
        }
      )
      .subscribe();

    // Listen to treatment_cycles changes
    const treatmentCyclesChannel = supabase
      .channel('treatment-cycles-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'treatment_cycles'
        },
        () => {
          console.log('Treatment cycles changed, reloading plans...');
          loadTreatmentPlans();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(remindersChannel);
      supabase.removeChannel(userEventsChannel);
      supabase.removeChannel(eventsChannel);
      supabase.removeChannel(statsChannel);
      supabase.removeChannel(treatmentPlansChannel);
      supabase.removeChannel(treatmentCyclesChannel);
    };
  }, [user]);

  const addEvent = async (newEvent: any) => {
    if (!user) return;

    try {
      const now = new Date();
      const { data, error } = await supabase
        .from('events')
        .insert({
          user_id: user.id,
          event_type: newEvent.event_type,
          title: newEvent.title,
          description: newEvent.description,
          event_date: newEvent.event_date || now.toISOString().split('T')[0],
          event_time: newEvent.event_time || now.toTimeString().split(' ')[0],
          severity: newEvent.severity || 3
        })
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setEvents(prev => [data, ...prev]);
      }
    } catch (error) {
      console.error('Error adding event:', error);
    }
  };

  const addMedication = (newMedication: any) => {
    setMedications(prev => [newMedication, ...prev]);
  };

  const updateReminders = (newReminders: any[]) => {
    setReminders(newReminders);
  };

  const addReminder = async (reminder: any) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('reminders')
        .insert({
          user_id: user.id,
          medication: reminder.medication,
          time: reminder.time,
          type: reminder.type,
          cycle: reminder.cycle || null,
          urgent: reminder.urgent || false,
          active: true
        })
        .select()
        .single();

      if (error) throw error;
      
      toast({
        title: "Lembrete adicionado",
        description: "Novo lembrete foi criado com sucesso"
      });
    } catch (error) {
      console.error('Error adding reminder:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o lembrete",
        variant: "destructive"
      });
      throw error;
    }
  };

  const updateReminder = async (id: string, reminder: any) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('reminders')
        .update({
          medication: reminder.medication,
          time: reminder.time,
          type: reminder.type,
          cycle: reminder.cycle || null,
          urgent: reminder.urgent || false
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      
      toast({
        title: "Lembrete atualizado",
        description: "Lembrete foi atualizado com sucesso"
      });
    } catch (error) {
      console.error('Error updating reminder:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o lembrete",
        variant: "destructive"
      });
      throw error;
    }
  };

  const deleteReminder = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('reminders')
        .update({ active: false })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      
      toast({
        title: "Lembrete removido",
        description: "Lembrete foi removido com sucesso"
      });
    } catch (error) {
      console.error('Error deleting reminder:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o lembrete",
        variant: "destructive"
      });
      throw error;
    }
  };

  const refetchStats = async () => {
    await loadStats();
  };

  const refetchAllData = async () => {
    if (!user) return;
    
    await Promise.all([
      loadMedications(),
      loadEventsFromEventsTable(),
      loadReminders(),
      loadStats(),
      refetchClinics(),
      refetchDoctors()
    ]);
  };

  const logFeeling = async (rating: number) => {
    if (!user) return;

    const feelingLabels = {
      1: "Muito mal",
      2: "Mal", 
      3: "Neutro",
      4: "Bem",
      5: "Muito bem"
    };

    try {
      const now = new Date();
      const { data, error } = await supabase
        .from('user_events')
        .insert({
          user_id: user.id,
          title: `Sentindo-se ${feelingLabels[rating as keyof typeof feelingLabels]}`,
          description: `Autoavaliação de humor - Nível ${rating}/5`,
          event_type: 'mood',
          severity: rating,
          event_date: now.toISOString().split('T')[0],
          event_time: now.toTimeString().split(' ')[0]
        })
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setEvents(prev => [data, ...prev]);
      }
    } catch (error) {
      console.error('Error logging feeling:', error);
      throw error;
    }
  };

  const deleteEvent = async (eventId: string, tableName: 'events' | 'user_events') => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', eventId)
        .eq('user_id', user.id);

      if (error) throw error;

      setEvents(prev => prev.filter(e => e.id !== eventId));
      await loadEventsFromEventsTable();
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  };

  const updateEvent = async (eventId: string, tableName: 'events' | 'user_events', data: any) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from(tableName)
        .update(data)
        .eq('id', eventId)
        .eq('user_id', user.id);

      if (error) throw error;

      await loadEventsFromEventsTable();
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  };

  const updateProfile = async (data: any) => {
    await updateUserProfile(data);
  };

  // Treatment functions
  const addTreatmentPlan = async (planData: any) => {
    console.log('Adding treatment plan:', planData);
    await loadTreatmentPlans();
  };

  const updateTreatmentPlan = async (id: string, data: any) => {
    try {
      const { error } = await supabase
        .from('treatment_plans')
        .update(data)
        .eq('id', id);

      if (error) throw error;
      await loadTreatmentPlans();
    } catch (error) {
      console.error('Error updating treatment plan:', error);
      throw error;
    }
  };

  const refetchTreatmentPlans = async () => {
    if (!user) return;
    await loadTreatmentPlans();
  };

  const value: AppData = {
    user,
    profile,
    loading,
    medications,
    events,
    reminders,
    clinics,
    clinicsLoading,
    doctors,
    doctorsLoading,
    stats,
    treatmentPlans,
    currentTreatmentPlan,
    treatmentCycles,
    updateProfile,
    addEvent,
    addMedication,
    updateReminders,
    logFeeling,
    deleteEvent,
    updateEvent,
    refetchClinics,
    refetchDoctors,
    refetchMedications: loadMedications,
    refetchEvents: loadEventsFromEventsTable,
    refetchStats,
    refetchAllData,
    addReminder,
    updateReminder,
    deleteReminder,
    addTreatmentPlan,
    updateTreatmentPlan,
    refetchTreatmentPlans
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};