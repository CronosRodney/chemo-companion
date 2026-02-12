import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ExternalLink, Syringe, ShieldCheck } from 'lucide-react';
import type { VaccineRecord } from '@/hooks/useExternalConnections';

const CADERNETA_APP_URL = 'https://chronicle-my-health.lovable.app';

const statusConfig = {
  up_to_date: { label: 'Em dia', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  pending: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  overdue: { label: 'Atrasada', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  unknown: { label: 'Desconhecido', className: 'bg-muted text-muted-foreground' },
} as const;

interface VaccineDetailDialogProps {
  vaccine: VaccineRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VaccineDetailDialog({ vaccine, open, onOpenChange }: VaccineDetailDialogProps) {
  if (!vaccine) return null;

  const status = statusConfig[vaccine.status] || statusConfig.unknown;

  const formattedDate = vaccine.date
    ? new Date(vaccine.date + 'T00:00:00').toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : '—';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
              <Syringe className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle className="text-lg">{vaccine.name}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            <Badge variant="outline" className={status.className}>
              {status.label}
            </Badge>
          </div>

          <Separator />

          {/* Dose */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Dose</span>
            <span className="text-sm font-medium">{vaccine.dose}</span>
          </div>

          {/* Data */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Data de aplicação</span>
            <span className="text-sm font-medium">{formattedDate}</span>
          </div>

          {/* Observações */}
          {vaccine.observations && (
            <>
              <Separator />
              <div>
                <span className="text-sm text-muted-foreground">Observações</span>
                <p className="text-sm mt-1">{vaccine.observations}</p>
              </div>
            </>
          )}

          {/* Confiança */}
          {vaccine.confidence != null && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Confiança</span>
              <span className="text-sm font-medium">{Math.round(vaccine.confidence * 100)}%</span>
            </div>
          )}

          <Separator />

          {/* Origem */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Origem</span>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-green-600" />
              <span className="text-sm font-medium">{vaccine.source || 'Minha Caderneta'}</span>
            </div>
          </div>

          {/* Abrir na Caderneta */}
          <Button
            variant="outline"
            className="w-full"
            onClick={() => window.open(CADERNETA_APP_URL, '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Abrir na Minha Caderneta
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
