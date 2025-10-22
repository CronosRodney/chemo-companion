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
}

export const TreatmentProgressWidget = ({ treatmentPlans }: TreatmentProgressWidgetProps) => {
  const navigate = useNavigate();
  
  const activePlan = treatmentPlans?.find(plan => plan.status === 'active');
  
  if (!activePlan) {
    return (
      <Card className="luxury-card border-2 border-primary/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent"></div>
        <CardContent className="pt-6 relative">
          <div className="text-center py-8">
            <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground mb-4">Nenhum tratamento ativo</p>
            <Button onClick={() => navigate('/treatment')} variant="outline">
              Criar Plano de Tratamento
            </Button>
          </div>
        </CardContent>
      </Card>
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
    <Card className="luxury-card border-2 border-primary/20 relative overflow-hidden group hover:scale-[1.02] transition-transform">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary-glow/5 to-transparent"></div>
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/20 rounded-full blur-3xl group-hover:blur-2xl transition-all"></div>
      
      <CardHeader className="relative">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-full medical-gradient flex items-center justify-center shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]">
              <Activity className="h-5 w-5 text-white" />
            </div>
            Tratamento Atual
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/treatment')}
            className="hover:bg-primary/10"
          >
            Ver mais
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4 relative">
        {/* Regimen Name */}
        <div>
          <p className="text-sm text-muted-foreground mb-1">Protocolo</p>
          <p className="font-bold text-lg">{activePlan.regimen_name}</p>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">Progresso do Tratamento</p>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span className="text-sm font-bold">{completedCycles}/{totalCycles} ciclos</span>
            </div>
          </div>
          <Progress value={progressPercentage} className="h-3" />
          <p className="text-xs text-muted-foreground mt-1">{progressPercentage.toFixed(0)}% concluído</p>
        </div>

        {/* Next Cycle Info */}
        {nextCycle && (
          <div className="glass-effect p-4 rounded-lg border-2 border-accent/20">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-accent-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Próximo Ciclo</p>
                <p className="font-bold">
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
          <div className="glass-effect p-3 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Linha de Terapia</p>
            <p className="font-medium text-sm">{activePlan.line_of_therapy}</p>
          </div>
          <div className="glass-effect p-3 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Periodicidade</p>
            <p className="font-medium text-sm">{activePlan.periodicity_days} dias</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};