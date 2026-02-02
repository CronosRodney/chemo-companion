import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Calendar, CheckCircle2, Clock, PlayCircle } from "lucide-react";
import { format, isPast, isFuture, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import ReleaseCycleDialog from "./ReleaseCycleDialog";

interface TreatmentCyclesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: any | null;
  canEdit: boolean;
  onSuccess: () => void;
}

export default function TreatmentCyclesDialog({ 
  open, 
  onOpenChange, 
  plan, 
  canEdit,
  onSuccess 
}: TreatmentCyclesDialogProps) {
  const [selectedCycle, setSelectedCycle] = useState<any>(null);
  const [releaseCycleOpen, setReleaseCycleOpen] = useState(false);

  if (!plan) return null;

  const cycles = plan.cycles || [];
  const sortedCycles = [...cycles].sort((a: any, b: any) => 
    new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime()
  );

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  const handleReleaseCycle = (cycle: any) => {
    setSelectedCycle(cycle);
    setReleaseCycleOpen(true);
  };

  const handleReleaseSuccess = () => {
    setReleaseCycleOpen(false);
    setSelectedCycle(null);
    onSuccess();
  };

  const getCycleStatusInfo = (cycle: any) => {
    const cycleDate = new Date(cycle.scheduled_date);
    const isPastCycle = isPast(cycleDate) && !isToday(cycleDate);
    const isTodayCycle = isToday(cycleDate);

    if (cycle.status === 'completed') {
      return { label: 'Concluído', variant: 'default' as const, icon: CheckCircle2, color: 'text-green-600' };
    }
    if (cycle.status === 'in_progress') {
      return { label: 'Em Andamento', variant: 'secondary' as const, icon: PlayCircle, color: 'text-blue-600' };
    }
    if (isTodayCycle) {
      return { label: 'Hoje', variant: 'default' as const, icon: Calendar, color: 'text-primary' };
    }
    if (isPastCycle) {
      return { label: 'Atrasado', variant: 'destructive' as const, icon: AlertCircle, color: 'text-red-600' };
    }
    return { label: 'Agendado', variant: 'outline' as const, icon: Clock, color: 'text-muted-foreground' };
  };

  const getReleaseStatusBadge = (status: string) => {
    switch (status) {
      case 'released': return { label: 'Liberado', variant: 'default' as const };
      case 'delayed': return { label: 'Adiado', variant: 'secondary' as const };
      case 'dose_adjusted': return { label: 'Dose Ajustada', variant: 'outline' as const };
      case 'cancelled': return { label: 'Cancelado', variant: 'destructive' as const };
      default: return { label: 'Pendente', variant: 'outline' as const };
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Ciclos - {plan.regimen_name}
            </DialogTitle>
            <DialogDescription>
              {plan.planned_cycles} ciclos planejados • A cada {plan.periodicity_days} dias
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {sortedCycles.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum ciclo cadastrado</p>
              </div>
            ) : (
              sortedCycles.map((cycle: any) => {
                const statusInfo = getCycleStatusInfo(cycle);
                const releaseInfo = getReleaseStatusBadge(cycle.release_status);
                const StatusIcon = statusInfo.icon;
                const canRelease = canEdit && 
                  cycle.status !== 'completed' && 
                  cycle.release_status === 'pending';

                return (
                  <div
                    key={cycle.id}
                    className={`flex items-start gap-4 p-4 rounded-lg border-2 transition-colors ${
                      cycle.status === 'completed' ? 'border-green-500/50 bg-green-500/5' :
                      statusInfo.label === 'Atrasado' ? 'border-red-500/50 bg-red-500/5' :
                      statusInfo.label === 'Hoje' ? 'border-primary bg-primary/5' :
                      'border-border'
                    }`}
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-background border-2 flex items-center justify-center font-bold text-sm">
                      {cycle.cycle_number}
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold flex items-center gap-2">
                            <StatusIcon className={`h-4 w-4 ${statusInfo.color}`} />
                            Ciclo {cycle.cycle_number}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(cycle.scheduled_date)}
                            {cycle.actual_date && cycle.actual_date !== cycle.scheduled_date && 
                              ` → ${formatDate(cycle.actual_date)}`
                            }
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge variant={statusInfo.variant}>
                            {statusInfo.label}
                          </Badge>
                          <Badge variant={releaseInfo.variant} className="text-xs">
                            {releaseInfo.label}
                          </Badge>
                        </div>
                      </div>

                      {/* Labs summary */}
                      {(cycle.anc_value || cycle.plt_value) && (
                        <div className="flex gap-3 text-xs text-muted-foreground">
                          {cycle.anc_value && <span>ANC: {cycle.anc_value}</span>}
                          {cycle.plt_value && <span>PLT: {cycle.plt_value.toLocaleString()}</span>}
                          {cycle.scr_value && <span>Cr: {cycle.scr_value}</span>}
                        </div>
                      )}

                      {cycle.delay_reason && (
                        <p className="text-xs text-yellow-700 dark:text-yellow-400 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {cycle.delay_reason}
                        </p>
                      )}

                      {canRelease && (
                        <Button 
                          size="sm" 
                          className="mt-2"
                          onClick={() => handleReleaseCycle(cycle)}
                        >
                          <PlayCircle className="h-4 w-4 mr-1" />
                          Liberar Ciclo
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ReleaseCycleDialog
        open={releaseCycleOpen}
        onOpenChange={setReleaseCycleOpen}
        cycle={selectedCycle}
        onSuccess={handleReleaseSuccess}
      />
    </>
  );
}
