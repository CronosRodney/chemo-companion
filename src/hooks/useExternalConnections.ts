import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type ExternalProvider = 'minha_caderneta';
export type ConnectionStatus = 'active' | 'revoked';

export interface ExternalConnection {
  id: string;
  user_id: string;
  provider: ExternalProvider;
  connection_token: string;
  status: ConnectionStatus;
  connected_at: string;
  last_sync_at: string | null;
  metadata: Record<string, unknown>;
}

export interface VaccinationSummary {
  total_vaccines: number;
  up_to_date: number;
  pending: number;
  overdue: number;
  last_updated: string;
  clinical_alerts: ClinicalAlert[];
}

export interface ClinicalAlert {
  id: string;
  source: 'minha_caderneta' | 'oncotrack';
  type: 'warning' | 'info' | 'critical';
  message: string;
  created_at: string;
}

interface UseExternalConnectionsReturn {
  connection: ExternalConnection | null;
  isLoading: boolean;
  isConnected: boolean;
  vaccinationData: VaccinationSummary | null;
  isLoadingVaccination: boolean;
  connect: () => void;
  disconnect: () => Promise<void>;
  refreshVaccinationData: () => Promise<void>;
  completeConnection: () => Promise<boolean>;
}

const CADERNETA_APP_URL = 'https://chronicle-my-health.lovable.app';
const CADERNETA_API_URL = 'https://yzegsqdpltiiawbhoafo.supabase.co/functions/v1';

export function useExternalConnections(provider: ExternalProvider = 'minha_caderneta'): UseExternalConnectionsReturn {
  const { user } = useAuth();
  const [connection, setConnection] = useState<ExternalConnection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [vaccinationData, setVaccinationData] = useState<VaccinationSummary | null>(null);
  const [isLoadingVaccination, setIsLoadingVaccination] = useState(false);

  // Fetch existing connection
  const fetchConnection = useCallback(async () => {
    if (!user) {
      setConnection(null);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('external_connections')
        .select('*')
        .eq('user_id', user.id)
        .eq('provider', provider)
        .eq('status', 'active')
        .maybeSingle();

      if (error) throw error;
      
      // Type assertion for the data since external_connections is a new table
      setConnection(data as ExternalConnection | null);
    } catch (error) {
      console.error('Error fetching external connection:', error);
      setConnection(null);
    } finally {
      setIsLoading(false);
    }
  }, [user, provider]);

  useEffect(() => {
    fetchConnection();
  }, [fetchConnection]);

  // Redirect to Minha Caderneta for authorization
  const connect = useCallback(() => {
    if (!user) {
      toast.error('Você precisa estar logado para conectar');
      return;
    }

    const callbackUrl = `${window.location.origin}/vaccination?connected=true`;
    const connectUrl = `${CADERNETA_APP_URL}/connect?source=oncotrack&oncotrack_user_id=${user.id}&callback_url=${encodeURIComponent(callbackUrl)}`;
    
    window.location.href = connectUrl;
  }, [user]);

  // Complete connection via B2B handshake (called after redirect back)
  const completeConnection = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase.functions.invoke('complete-caderneta-connection', {
        body: { oncotrack_user_id: user.id }
      });

      if (error) throw error;

      if (data?.success) {
        await fetchConnection();
        toast.success('Minha Caderneta conectada com sucesso!');
        return true;
      } else {
        throw new Error(data?.error || 'Falha ao completar conexão');
      }
    } catch (error) {
      console.error('Error completing connection:', error);
      toast.error('Erro ao conectar com Minha Caderneta');
      return false;
    }
  }, [user, fetchConnection]);

  // Disconnect from Minha Caderneta
  const disconnect = useCallback(async () => {
    if (!connection) return;

    try {
      const { error } = await supabase.functions.invoke('disconnect-caderneta', {
        body: { connection_token: connection.connection_token }
      });

      if (error) throw error;

      // Update local state
      await supabase
        .from('external_connections')
        .update({ status: 'revoked' as ConnectionStatus })
        .eq('id', connection.id);

      setConnection(null);
      setVaccinationData(null);
      toast.success('Desconectado da Minha Caderneta');
    } catch (error) {
      console.error('Error disconnecting:', error);
      toast.error('Erro ao desconectar');
    }
  }, [connection]);

  // Fetch vaccination data from Minha Caderneta API
  const refreshVaccinationData = useCallback(async () => {
    if (!connection?.connection_token) return;

    setIsLoadingVaccination(true);
    try {
      const response = await fetch(`${CADERNETA_API_URL}/oncotrack-vaccination-summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-oncotrack-token': connection.connection_token
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch vaccination data');
      }

      const data = await response.json();
      setVaccinationData(data);

      // Update last_sync_at
      await supabase
        .from('external_connections')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('id', connection.id);
    } catch (error) {
      console.error('Error fetching vaccination data:', error);
      toast.error('Erro ao carregar dados vacinais');
    } finally {
      setIsLoadingVaccination(false);
    }
  }, [connection]);

  // Auto-fetch vaccination data when connected
  useEffect(() => {
    if (connection && connection.status === 'active') {
      refreshVaccinationData();
    }
  }, [connection, refreshVaccinationData]);

  return {
    connection,
    isLoading,
    isConnected: !!connection && connection.status === 'active',
    vaccinationData,
    isLoadingVaccination,
    connect,
    disconnect,
    refreshVaccinationData,
    completeConnection
  };
}
