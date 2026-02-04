import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, Syringe, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { VaccinationSummary } from '@/hooks/useExternalConnections';

interface VaccinationSummaryCardProps {
  data: VaccinationSummary | null;
  isLoading: boolean;
  onRefresh: () => void;
  lastSyncAt: string | null;
}

export function VaccinationSummaryCard({ 
  data, 
  isLoading, 
  onRefresh,
  lastSyncAt 
}: VaccinationSummaryCardProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Syringe className="h-5 w-5" />
            <Skeleton className="h-6 w-32" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Syringe className="h-5 w-5" />
            {t('vaccination.summary.title', 'Resumo Vacinal')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            {t('vaccination.errors.fetchFailed', 'Erro ao carregar dados vacinais')}
          </p>
          <Button variant="outline" size="sm" onClick={onRefresh} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('vaccination.connected.refresh', 'Atualizar dados')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('pt-BR');
    } catch {
      return '—';
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Syringe className="h-5 w-5 text-primary" />
            {t('vaccination.summary.title', 'Resumo Vacinal')}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        {lastSyncAt && (
          <p className="text-xs text-muted-foreground">
            {t('vaccination.connected.lastUpdate', 'Última atualização')}: {formatDate(lastSyncAt)}
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-foreground">{data.total_vaccines}</div>
            <div className="text-xs text-muted-foreground">
              {t('vaccination.summary.total', 'Total de vacinas')}
            </div>
          </div>
          
          <div className="bg-green-500/10 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-2xl font-bold text-green-600">{data.up_to_date}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {t('vaccination.summary.upToDate', 'Em dia')}
            </div>
          </div>
          
          <div className="bg-yellow-500/10 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1">
              <Clock className="h-4 w-4 text-yellow-600" />
              <span className="text-2xl font-bold text-yellow-600">{data.pending}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {t('vaccination.summary.pending', 'Pendentes')}
            </div>
          </div>
          
          <div className="bg-red-500/10 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-2xl font-bold text-red-600">{data.overdue}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {t('vaccination.summary.overdue', 'Atrasadas')}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
