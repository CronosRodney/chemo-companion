import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Activity, ChevronRight, Calendar, CheckCircle2, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TreatmentProgressWidgetProps {
  treatmentPlans: any[];
  adherence?: number;
}

export const TreatmentProgressWidget = ({ treatmentPlans, adherence }: TreatmentProgressWidgetProps) => {
  const navigate = useNavigate();
  
  const activePlan = treatmentPlans?.find(plan => plan.status === 'active');
  
  if (!activePlan) {
    return (
      <div className="bg-card rounded-2xl shadow-sm border border-border p-8">
        <div className="text-center py-6">
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Activity className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground mb-1 text-base font-medium">Nenhum tratamento ativo</p>
          <p className="text-sm text-muted-foreground mb-4">Crie seu primeiro plano para acompanhar o progresso</p>
          <Button onClick={() => navigate('/treatment')} variant="outline" className="border-primary/20 text-primary hover:bg-primary/5 rounded-xl">
            Criar Plano de Tratamento
          </Button>
        </div>
      </div>
    );
  }

  const completedCycles = activePlan.treatment_cycles?.filter((c: any) => c.status === 'completed').length || 0;
  const totalCycles = activePlan.planned_cycles;
  const progressPercentage = (completedCycles / totalCycles) * 100;
  
  const nextCycle = activePlan.treatment_cycles
    ?.filter((c: any) => c.status === 'scheduled' || c.status === 'pending')
    ?.sort((a: any, b: any) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime())[0];
  
  const daysUntilNext = nextCycle ? differenceInDays(new Date(nextCycle.scheduled_date), new Date()) : null;

  return (
    <div className="bg-card rounded-2xl shadow-sm border border-border p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
            <Activity className="h-4 w-4 text-primary" />
          </div>
          Tratamento Atual
        </h2>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => navigate('/treatment')}
          className="text-primary/70 hover:text-primary hover:bg-primary/5"
        >
          Ver mais
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
      
      {/* Regimen Name */}
      <div>
        <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Protocolo</p>
        <p className="font-bold text-base text-foreground">{activePlan.regimen_name}</p>
      </div>

      {/* Progress Bar + Adherence */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <p className="text-sm font-medium text-foreground">Progresso</p>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-semibold border-primary/20 text-primary bg-primary/5 px-2.5">
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
              {completedCycles}/{totalCycles} ciclos
            </Badge>
            {adherence !== undefined && (
              <Badge variant="outline" className="text-xs font-semibold bg-emerald-50 text-emerald-700 border-emerald-200 px-2.5 rounded-full">
                Adesão: {adherence}%
              </Badge>
            )}
          </div>
        </div>
        <Progress value={progressPercentage} className="h-2 bg-muted" />
        <p className="text-xs text-muted-foreground mt-1.5">{progressPercentage.toFixed(0)}% concluído</p>
      </div>

      {/* Next Cycle Info */}
      {nextCycle && (
        <div className={`p-4 rounded-xl border ${daysUntilNext !== null && daysUntilNext <= 3 ? 'border-amber-200 bg-amber-50/50' : 'border-border bg-muted/30'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${daysUntilNext !== null && daysUntilNext <= 3 ? 'bg-amber-100' : 'bg-primary/10'}`}>
              <Calendar className={`h-5 w-5 ${daysUntilNext !== null && daysUntilNext <= 3 ? 'text-amber-700' : 'text-primary'}`} />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Próximo Ciclo</p>
              <p className="font-semibold text-sm text-foreground">
                Ciclo {nextCycle.cycle_number} - {format(new Date(nextCycle.scheduled_date), "dd 'de' MMMM", { locale: ptBR })}
              </p>
              {daysUntilNext !== null && (
                <div className="flex items-center gap-1 mt-1">
                  <Clock className="h-3 w-3 text-primary" />
                  <p className="text-xs text-primary font-medium">
                    {daysUntilNext === 0 ? 'Hoje!' : daysUntilNext === 1 ? 'Amanhã' : `Em ${daysUntilNext} dias`}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Treatment Details */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-xl border border-border bg-muted/30">
          <p className="text-xs text-muted-foreground mb-1">Linha de Terapia</p>
          <p className="font-medium text-sm text-foreground">{activePlan.line_of_therapy}</p>
        </div>
        <div className="p-3 rounded-xl border border-border bg-muted/30">
          <p className="text-xs text-muted-foreground mb-1">Periodicidade</p>
          <p className="font-medium text-sm text-foreground">{activePlan.periodicity_days} dias</p>
        </div>
      </div>
    </div>
  );
};
