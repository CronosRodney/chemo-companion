import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { WearableService, WearableConnection, HealthAlert, WearableProvider } from "@/services/wearableService";
import { WearableConnectionCard } from "@/components/WearableConnectionCard";
import { WearableHealthCard } from "@/components/WearableHealthCard";
import { HealthAlertsCard } from "@/components/HealthAlertsCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Health() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [connections, setConnections] = useState<WearableConnection[]>([]);
  const [alerts, setAlerts] = useState<HealthAlert[]>([]);
  const [summary, setSummary] = useState({
    avgSteps: 0,
    avgHeartRate: 0,
    avgSleep: 0,
    avgTemperature: 0,
    totalCalories: 0,
    dataPoints: 0
  });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const [connectionsData, alertsData, summaryData] = await Promise.all([
        WearableService.getConnections(user.id),
        WearableService.getActiveAlerts(user.id),
        WearableService.getMetricSummary(user.id, 7)
      ]);

      setConnections(connectionsData);
      setAlerts(alertsData);
      setSummary(summaryData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados de saúde');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (provider: WearableProvider) => {
    if (!user) return;

    try {
      await WearableService.connectDevice(user.id, provider);
      toast.success(`${provider} conectado com sucesso!`);
      loadData();
    } catch (error) {
      console.error('Erro ao conectar dispositivo:', error);
      toast.error('Erro ao conectar dispositivo');
    }
  };

  const handleDisconnect = async (connectionId: string) => {
    try {
      await WearableService.disconnectDevice(connectionId);
      toast.success('Dispositivo desconectado');
      loadData();
    } catch (error) {
      console.error('Erro ao desconectar dispositivo:', error);
      toast.error('Erro ao desconectar dispositivo');
    }
  };

  const handleSync = async (connectionId: string) => {
    if (!user) return;

    try {
      setSyncing(connectionId);
      await WearableService.syncData(connectionId, user.id);
      toast.success('Dados sincronizados com sucesso!');
      loadData();
    } catch (error) {
      console.error('Erro ao sincronizar:', error);
      toast.error('Erro ao sincronizar dados');
    } finally {
      setSyncing(null);
    }
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      await WearableService.acknowledgeAlert(alertId);
      toast.success('Alerta marcado como lido');
      loadData();
    } catch (error) {
      console.error('Erro ao confirmar alerta:', error);
      toast.error('Erro ao confirmar alerta');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-semibold text-foreground">Monitoramento de Saúde</h1>
          </div>
          <div className="text-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground mt-2">Carregando...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-semibold text-foreground">Monitoramento de Saúde</h1>
          </div>
          <Button onClick={loadData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="devices">Dispositivos</TabsTrigger>
            <TabsTrigger value="alerts">
              Alertas
              {alerts.length > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-destructive text-destructive-foreground">
                  {alerts.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {summary.dataPoints > 0 ? (
              <>
                <WearableHealthCard
                  avgSteps={summary.avgSteps}
                  avgHeartRate={summary.avgHeartRate}
                  avgSleep={summary.avgSleep}
                  avgTemperature={summary.avgTemperature}
                  totalCalories={summary.totalCalories}
                />
                {alerts.length > 0 && (
                  <HealthAlertsCard
                    alerts={alerts}
                    onAcknowledge={handleAcknowledgeAlert}
                  />
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  Conecte um dispositivo e sincronize dados para ver suas métricas de saúde
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="devices">
            <WearableConnectionCard
              connections={connections}
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
              onSync={handleSync}
              isSyncing={syncing}
            />
          </TabsContent>

          <TabsContent value="alerts">
            <HealthAlertsCard
              alerts={alerts}
              onAcknowledge={handleAcknowledgeAlert}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
