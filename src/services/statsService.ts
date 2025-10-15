import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface UserStats {
  adherence: number;
  nextAppointment: string;
  currentCycle: string;
}

/**
 * Calcular adesão baseado em eventos de medicação registrados
 */
export const calculateAdherence = async (userId: string): Promise<number> => {
  try {
    // Pegar total de lembretes ativos
    const { data: remindersData, error: remindersError } = await supabase
      .from('reminders')
      .select('id')
      .eq('user_id', userId)
      .eq('active', true);

    if (remindersError) throw remindersError;

    const totalReminders = remindersData?.length || 0;
    if (totalReminders === 0) return 0;

    // Pegar eventos de medicação dos últimos 30 dias
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: medicationEvents, error: eventsError } = await supabase
      .from('user_events')
      .select('id')
      .eq('user_id', userId)
      .eq('event_type', 'medication')
      .gte('event_date', thirtyDaysAgo.toISOString().split('T')[0]);

    if (eventsError) throw eventsError;

    const completedMedications = medicationEvents?.length || 0;
    
    // Calcular baseado em quantas doses esperadas vs doses registradas
    const expectedDoses = totalReminders * 30; // Simplificação: 1 dose por dia por lembrete
    const adherence = expectedDoses > 0 
      ? Math.min(Math.round((completedMedications / expectedDoses) * 100), 100)
      : 95; // Default se não há dados suficientes

    return adherence;
  } catch (error) {
    console.error('Error calculating adherence:', error);
    return 95; // Default fallback
  }
};

/**
 * Buscar próxima consulta agendada
 */
export const getNextAppointment = async (userId: string): Promise<string> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Buscar próxima consulta da tabela user_events
    const { data: userEventData, error: userEventError } = await supabase
      .from('user_events')
      .select('event_date')
      .eq('user_id', userId)
      .eq('event_type', 'appointment')
      .gte('event_date', today)
      .order('event_date', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (userEventError && userEventError.code !== 'PGRST116') {
      throw userEventError;
    }

    if (userEventData?.event_date) {
      const date = parseISO(userEventData.event_date);
      return format(date, "d MMM", { locale: ptBR });
    }

    // Se não encontrou em user_events, buscar em events
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select('event_date')
      .eq('user_id', userId)
      .eq('event_type', 'appointment')
      .gte('event_date', today)
      .order('event_date', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (eventError && eventError.code !== 'PGRST116') {
      throw eventError;
    }

    if (eventData?.event_date) {
      const date = parseISO(eventData.event_date);
      return format(date, "d MMM", { locale: ptBR });
    }

    // Verificar user_stats
    const { data: statsData, error: statsError } = await supabase
      .from('user_stats')
      .select('next_appointment_date')
      .eq('user_id', userId)
      .maybeSingle();

    if (statsError && statsError.code !== 'PGRST116') {
      throw statsError;
    }

    if (statsData?.next_appointment_date) {
      const date = parseISO(statsData.next_appointment_date);
      return format(date, "d MMM", { locale: ptBR });
    }

    return "Não agendada";
  } catch (error) {
    console.error('Error getting next appointment:', error);
    return "Não agendada";
  }
};

/**
 * Buscar ciclo atual do tratamento
 */
export const getCurrentCycle = async (userId: string): Promise<string> => {
  try {
    // Buscar de user_stats primeiro
    const { data, error } = await supabase
      .from('user_stats')
      .select('current_cycle, total_cycles')
      .eq('user_id', userId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (data?.current_cycle) {
      return data.current_cycle;
    }

    if (data?.total_cycles) {
      return `1 de ${data.total_cycles}`;
    }

    return "N/A";
  } catch (error) {
    console.error('Error getting current cycle:', error);
    return "N/A";
  }
};

/**
 * Carregar todas as estatísticas do usuário
 */
export const loadUserStats = async (userId: string): Promise<UserStats> => {
  try {
    const [adherence, nextAppointment, currentCycle] = await Promise.all([
      calculateAdherence(userId),
      getNextAppointment(userId),
      getCurrentCycle(userId)
    ]);

    return {
      adherence,
      nextAppointment,
      currentCycle
    };
  } catch (error) {
    console.error('Error loading user stats:', error);
    return {
      adherence: 95,
      nextAppointment: "Não agendada",
      currentCycle: "N/A"
    };
  }
};
