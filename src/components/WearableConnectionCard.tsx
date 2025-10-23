import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Smartphone, Watch, Activity, RefreshCw, Power, PowerOff } from "lucide-react";
import { WearableConnection, WearableProvider } from "@/services/wearableService";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface WearableConnectionCardProps {
  connections: WearableConnection[];
  onConnect: (provider: WearableProvider) => void;
  onDisconnect: (connectionId: string) => void;
  onSync: (connectionId: string) => void;
  isSyncing?: string | null;
}

const providerInfo: Record<WearableProvider, { name: string; icon: typeof Activity }> = {
  google_fit: { name: "Google Fit", icon: Activity },
  apple_health: { name: "Apple Health", icon: Activity },
  fitbit: { name: "Fitbit", icon: Watch },
  garmin: { name: "Garmin", icon: Smartphone }
};

export function WearableConnectionCard({
  connections,
  onConnect,
  onDisconnect,
  onSync,
  isSyncing
}: WearableConnectionCardProps) {
  const availableProviders: WearableProvider[] = ['google_fit', 'apple_health', 'fitbit', 'garmin'];
  const connectedProviders = new Set(connections.filter(c => c.is_active).map(c => c.provider));
  const unconnectedProviders = availableProviders.filter(p => !connectedProviders.has(p));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dispositivos Conectados</CardTitle>
        <CardDescription>
          Conecte seus wearables para monitoramento automático de saúde
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connected Devices */}
        {connections.filter(c => c.is_active).map((connection) => {
          const provider = providerInfo[connection.provider];
          const Icon = provider.icon;
          
          return (
            <div
              key={connection.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{provider.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {connection.last_sync_at 
                      ? `Sincronizado ${formatDistanceToNow(new Date(connection.last_sync_at), { 
                          addSuffix: true, 
                          locale: ptBR 
                        })}`
                      : 'Nunca sincronizado'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-primary">
                  <Power className="h-3 w-3 mr-1" />
                  Ativo
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSync(connection.id)}
                  disabled={isSyncing === connection.id}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing === connection.id ? 'animate-spin' : ''}`} />
                  Sincronizar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDisconnect(connection.id)}
                >
                  <PowerOff className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}

        {/* Available Devices to Connect */}
        {unconnectedProviders.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              Conectar Dispositivo:
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {unconnectedProviders.map((provider) => {
                const info = providerInfo[provider];
                const Icon = info.icon;
                
                return (
                  <Button
                    key={provider}
                    variant="outline"
                    className="justify-start"
                    onClick={() => onConnect(provider)}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {info.name}
                  </Button>
                );
              })}
            </div>
          </div>
        )}

        {connections.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhum dispositivo conectado ainda</p>
            <p className="text-xs mt-1">
              Conecte um wearable para começar o monitoramento automático
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
