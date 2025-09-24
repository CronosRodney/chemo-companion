import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface AppData {
  // User data
  user: any;
  profile: any;
  loading: boolean;
  
  // Medical data
  medications: any[];
  events: any[];
  reminders: any[];
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
}

const AppContext = createContext<AppData | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, loading, updateProfile: updateUserProfile } = useAuth();
  
  const [medications, setMedications] = useState([
    {
      id: '1',
      name: 'Oxaliplatina',
      dose: '85mg/m²',
      frequency: 'A cada 21 dias',
      instructions: 'Administração IV em 2-6 horas',
      nextDose: '2025-01-20'
    },
    {
      id: '2', 
      name: '5-Fluoruracil',
      dose: '400mg/m²',
      frequency: '2x ao dia',
      instructions: 'Via oral, com alimentos',
      nextDose: '2025-01-15'
    }
  ]);

  const [events, setEvents] = useState([
    {
      id: '1',
      title: 'Consulta com Oncologista',
      description: 'Avaliação mensal - Dr. Maria Santos',
      event_type: 'appointment',
      event_date: '2025-01-15',
      event_time: '14:00',
      severity: 1
    },
    {
      id: '2',
      title: 'Aplicação de Oxaliplatina',
      description: 'Ciclo 3 - FOLFOX',
      event_type: 'medication',
      event_date: '2025-01-20',
      event_time: '09:00',
      severity: 2
    }
  ]);

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

  const addEvent = (newEvent: any) => {
    const event = {
      ...newEvent,
      id: Date.now().toString(),
      event_date: new Date().toISOString().split('T')[0],
      event_time: new Date().toTimeString().slice(0, 5)
    };
    setEvents(prev => [event, ...prev]);
  };

  const addMedication = (newMedication: any) => {
    const medication = {
      ...newMedication,
      id: Date.now().toString()
    };
    setMedications(prev => [medication, ...prev]);
  };

  const updateReminders = (newReminders: any[]) => {
    setReminders(newReminders);
  };

  const logFeeling = async (rating: number) => {
    const feelingLabels = {
      1: "Muito mal",
      2: "Mal", 
      3: "Neutro",
      4: "Bem",
      5: "Muito bem"
    };

    const event = {
      id: Date.now().toString(),
      title: `Sentindo-se ${feelingLabels[rating as keyof typeof feelingLabels]}`,
      description: `Autoavaliação de humor - Nível ${rating}/5`,
      event_type: 'mood',
      severity: rating,
      event_date: new Date().toISOString().split('T')[0],
      event_time: new Date().toTimeString().slice(0, 5)
    };

    setEvents(prev => [event, ...prev]);
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
    stats,
    updateProfile,
    addEvent,
    addMedication,
    updateReminders,
    logFeeling
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