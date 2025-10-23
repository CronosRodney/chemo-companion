import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Info, AlertCircle, Check } from "lucide-react";
import { HealthAlert } from "@/services/wearableService";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface HealthAlertsCardProps {
  alerts: HealthAlert[];
  onAcknowledge: (alertId: string) => void;
}

const alertConfig = {
  info: {
    icon: Info,
    variant: "secondary" as const,
    label: "Informação"
  },
  warning: {
    icon: AlertCircle,
    variant: "default" as const,
    label: "Atenção"
  },
  critical: {
    icon: AlertTriangle,
    variant: "destructive" as const,
    label: "Crítico"
  }
};

export function HealthAlertsCard({ alerts, onAcknowledge }: HealthAlertsCardProps) {
  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Alertas de Saúde</CardTitle>
          <CardDescription>
            Nenhum alerta ativo no momento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Check className="h-12 w-12 mx-auto mb-2 opacity-50 text-primary" />
            <p className="text-sm">Tudo está bem!</p>
            <p className="text-xs mt-1">
              Suas métricas de saúde estão dentro dos limites esperados
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Alertas de Saúde</CardTitle>
        <CardDescription>
          {alerts.length} alerta{alerts.length > 1 ? 's' : ''} requer{alerts.length === 1 ? '' : 'em'} sua atenção
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.map((alert) => {
          const config = alertConfig[alert.severity];
          const Icon = config.icon;

          return (
            <div
              key={alert.id}
              className="flex items-start gap-3 p-4 border rounded-lg"
            >
              <div className={`p-2 rounded-md ${
                alert.severity === 'critical' ? 'bg-destructive/10' :
                alert.severity === 'warning' ? 'bg-primary/10' :
                'bg-secondary/10'
              }`}>
                <Icon className={`h-5 w-5 ${
                  alert.severity === 'critical' ? 'text-destructive' :
                  alert.severity === 'warning' ? 'text-primary' :
                  'text-secondary'
                }`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={config.variant} className="text-xs">
                    {config.label}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(alert.created_at), {
                      addSuffix: true,
                      locale: ptBR
                    })}
                  </span>
                </div>
                <p className="text-sm font-medium mb-1">{alert.message}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>Valor: {alert.actual_value}</span>
                  {alert.threshold_value && (
                    <span>Limite: {alert.threshold_value}</span>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAcknowledge(alert.id)}
              >
                <Check className="h-4 w-4 mr-1" />
                OK
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
