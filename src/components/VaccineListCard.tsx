import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Syringe, ShieldCheck, ChevronRight } from 'lucide-react';
import type { VaccineRecord } from '@/hooks/useExternalConnections';
import { VaccineDetailDialog } from './VaccineDetailDialog';

const statusConfig = {
  up_to_date: { label: 'Em dia', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  pending: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  overdue: { label: 'Atrasada', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  unknown: { label: '—', className: 'bg-muted text-muted-foreground' },
} as const;

interface VaccineListCardProps {
  vaccines: VaccineRecord[];
  isLoading: boolean;
}

export function VaccineListCard({ vaccines, isLoading }: VaccineListCardProps) {
  const [selectedVaccine, setSelectedVaccine] = useState<VaccineRecord | null>(null);

  // Fecha dialog ao desconectar (vaccines fica vazio)
  useEffect(() => {
    if (vaccines.length === 0) {
      setSelectedVaccine(null);
    }
  }, [vaccines]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48 mt-1" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR');
    } catch {
      return dateStr;
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Syringe className="h-4 w-4" />
            Suas Vacinas
          </CardTitle>
          {vaccines.length > 0 && (
            <CardDescription>
              {vaccines.length} {vaccines.length === 1 ? 'vacina registrada' : 'vacinas registradas'}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {vaccines.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Syringe className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Nenhuma vacina encontrada</p>
            </div>
          ) : (
            <div className="space-y-2">
              {vaccines.map((vaccine) => {
                const status = statusConfig[vaccine.status] || statusConfig.unknown;
                return (
                  <button
                    key={vaccine.id}
                    onClick={() => setSelectedVaccine(vaccine)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors text-left"
                  >
                    <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                      <Syringe className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{vaccine.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">
                          {formatDate(vaccine.date)} · {vaccine.dose}
                        </span>
                        <ShieldCheck className="h-3 w-3 text-green-600 shrink-0" />
                      </div>
                    </div>
                    <Badge variant="outline" className={`shrink-0 text-[10px] px-1.5 py-0 ${status.className}`}>
                      {status.label}
                    </Badge>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <VaccineDetailDialog
        vaccine={selectedVaccine}
        open={!!selectedVaccine}
        onOpenChange={(open) => { if (!open) setSelectedVaccine(null); }}
      />
    </>
  );
}
