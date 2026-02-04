import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Info, AlertCircle, Bell } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ClinicalAlert } from '@/hooks/useExternalConnections';

interface VaccinationAlertsCardProps {
  alerts: ClinicalAlert[];
}

const sourceLabels: Record<ClinicalAlert['source'], string> = {
  minha_caderneta: 'Minha Caderneta',
  oncotrack: 'OncoTrack'
};

const sourceColors: Record<ClinicalAlert['source'], string> = {
  minha_caderneta: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  oncotrack: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
};

const AlertIcon = ({ type }: { type: ClinicalAlert['type'] }) => {
  switch (type) {
    case 'critical':
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    case 'warning':
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    case 'info':
    default:
      return <Info className="h-5 w-5 text-blue-500" />;
  }
};

const alertTypeStyles: Record<ClinicalAlert['type'], string> = {
  critical: 'border-red-200 bg-red-50/50 dark:border-red-900/50 dark:bg-red-950/20',
  warning: 'border-yellow-200 bg-yellow-50/50 dark:border-yellow-900/50 dark:bg-yellow-950/20',
  info: 'border-blue-200 bg-blue-50/50 dark:border-blue-900/50 dark:bg-blue-950/20'
};

export function VaccinationAlertsCard({ alerts }: VaccinationAlertsCardProps) {
  const { t } = useTranslation();

  if (!alerts || alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="h-5 w-5 text-primary" />
            {t('vaccination.alerts.title', 'Alertas Clínicos')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {t('vaccination.alerts.empty', 'Nenhum alerta no momento')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bell className="h-5 w-5 text-primary" />
          {t('vaccination.alerts.title', 'Alertas Clínicos')}
          <Badge variant="secondary" className="ml-auto">
            {alerts.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div 
              key={alert.id} 
              className={`flex items-start gap-3 p-3 rounded-lg border ${alertTypeStyles[alert.type]}`}
            >
              <AlertIcon type={alert.type} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${sourceColors[alert.source]}`}
                  >
                    {t(`vaccination.alerts.source.${alert.source}`, sourceLabels[alert.source])}
                  </Badge>
                </div>
                <p className="text-sm text-foreground">{alert.message}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
