import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserClinics, ConnectedClinic } from '@/hooks/useUserClinics';
import { supabase } from '@/integrations/supabase/client';

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
  stats: {
    adherence: number;
    nextAppointment: string;
    currentCycle: string;
  };
  
  // Actions
  updateProfile: (data: any) => Promise<void>;
  addEvent: (event: any) => void;
  addMedication: (medication: any) => void;
  updateReminders: (reminders: any[]) => void;
  logFeeling: (rating: number) => Promise<void>;
  refetchClinics: () => void;
  refetchMedications: () => void;
  refetchEvents: () => void;
}

const AppContext = createContext<AppData | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, loading, updateProfile: updateUserProfile } = useAuth();
  const { clinics, loading: clinicsLoading, refetch: refetchClinics } = useUserClinics();
  
  const [medications, setMedications] = useState<any[]>([]);

  const [events, setEvents] = useState<any[]>([]);

  const [reminders, setReminders] = useState([
    { 
      id: '1', 
      medication: "Oxaliplatina", 
      time: "14:00", 
      type: "IV", 
      cycle: "Ciclo 3 - FOLFOX", 
      urgent: true 
    },
    { 
      id: '2', 
      medication: "5-Fluoruracil", 
      time: "21:30", 
      type: "Oral", 
      cycle: "Ciclo 3 - FOLFOX", 
      urgent: false 
    },
  ]);

  const [stats, setStats] = useState({
    adherence: 95,
    nextAppointment: "15 Jan",
    currentCycle: "3 de 12"
  });

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

  // Load data when user changes
  useEffect(() => {
    if (user) {
      loadMedications();
      loadEventsFromEventsTable();
    }
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

  const updateProfile = async (data: any) => {
    await updateUserProfile(data);
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
    stats,
    updateProfile,
    addEvent,
    addMedication,
    updateReminders,
    logFeeling,
    refetchClinics,
    refetchMedications: loadMedications,
    refetchEvents: loadEventsFromEventsTable
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