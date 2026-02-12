import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      <div className="bg-card rounded-2xl shadow-sm border border-border/50 p-6">
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Activity className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground mb-4">Nenhum tratamento ativo</p>
          <Button onClick={() => navigate('/treatment')} variant="outline">
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
    <div className="bg-card rounded-2xl shadow-sm border border-border/50 p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
            <Activity className="h-4 w-4 text-primary" />
          </div>
          Tratamento Atual
        </h2>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => navigate('/treatment')}
          className="text-muted-foreground"
        >
          Ver mais
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
      
      {/* Regimen Name */}
      <div>
        <p className="text-xs text-muted-foreground mb-1">Protocolo</p>
        <p className="font-bold text-base text-foreground">{activePlan.regimen_name}</p>
      </div>

      {/* Progress Bar + Adherence */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-foreground">Progresso</p>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4 text-[hsl(var(--success))]" />
              <span className="text-sm font-semibold text-foreground">{completedCycles}/{totalCycles} ciclos</span>
            </div>
            {adherence !== undefined && (
              <Badge variant="secondary" className="text-xs font-semibold">
                Adesão: {adherence}%
              </Badge>
            )}
          </div>
        </div>
        <Progress value={progressPercentage} className="h-2" />
        <p className="text-xs text-muted-foreground mt-1">{progressPercentage.toFixed(0)}% concluído</p>
      </div>

      {/* Next Cycle Info */}
      {nextCycle && (
        <div className="p-4 rounded-xl border border-border/50 bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent/30 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-accent-foreground" />
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
        <div className="p-3 rounded-xl border border-border/50 bg-muted/30">
          <p className="text-xs text-muted-foreground mb-1">Linha de Terapia</p>
          <p className="font-medium text-sm text-foreground">{activePlan.line_of_therapy}</p>
        </div>
        <div className="p-3 rounded-xl border border-border/50 bg-muted/30">
          <p className="text-xs text-muted-foreground mb-1">Periodicidade</p>
          <p className="font-medium text-sm text-foreground">{activePlan.periodicity_days} dias</p>
        </div>
      </div>
    </div>
  );
};
