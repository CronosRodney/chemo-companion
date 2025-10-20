import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Activity, Calendar as CalendarIcon, Clock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAppContext } from "@/contexts/AppContext";
import TreatmentPlanDialog from "@/components/TreatmentPlanDialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Treatment() {
  const [createPlanDialogOpen, setCreatePlanDialogOpen] = useState(false);
  const { treatmentPlans, refetchTreatmentPlans } = useAppContext();

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'completed':
        return 'secondary';
      case 'suspended':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Ativo';
      case 'completed':
        return 'Concluído';
      case 'suspended':
        return 'Suspenso';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  const getNextCycleDate = (plan: any) => {
    if (!plan.cycles || plan.cycles.length === 0) return "Não agendado";
    
    const upcomingCycles = plan.cycles
      .filter((c: any) => c.status === 'scheduled' || c.status === 'pending')
      .sort((a: any, b: any) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime());
    
    return upcomingCycles.length > 0 ? formatDate(upcomingCycles[0].scheduled_date) : "Concluído";
  };

  const getCurrentCycleNumber = (plan: any) => {
    if (!plan.cycles || plan.cycles.length === 0) return 0;
    
    const completedCycles = plan.cycles.filter((c: any) => c.status === 'completed').length;
    return Math.min(completedCycles + 1, plan.planned_cycles);
  };

  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tratamento</h1>
        <p className="text-muted-foreground">
          Gerencie seus planos de tratamento oncológico
        </p>
      </div>

      <Tabs defaultValue="plans" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="plans">Planos</TabsTrigger>
          <TabsTrigger value="current">Ciclo Atual</TabsTrigger>
          <TabsTrigger value="schedule">Cronograma</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Meus Planos de Tratamento</CardTitle>
                  <CardDescription>Protocolos ativos e concluídos</CardDescription>
                </div>
                <Button onClick={() => setCreatePlanDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Plano
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {!treatmentPlans || treatmentPlans.length === 0 ? (
                <div className="text-center py-12">
                  <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Nenhum plano de tratamento cadastrado ainda.
                  </p>
                  <Button onClick={() => setCreatePlanDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Criar Primeiro Plano
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {treatmentPlans.map((plan: any) => (
                    <Card key={plan.id} className="border-2">
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-bold text-xl">{plan.regimen_name}</h3>
                              <Badge variant={getStatusVariant(plan.status)}>
                                {getStatusLabel(plan.status)}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {plan.line_of_therapy} • {plan.treatment_intent}
                            </p>
                            {plan.diagnosis_cid && (
                              <p className="text-xs text-muted-foreground mt-1">
                                CID: {plan.diagnosis_cid}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold">
                              {getCurrentCycleNumber(plan)}/{plan.planned_cycles}
                            </p>
                            <p className="text-xs text-muted-foreground">ciclos</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div className="flex items-start gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="text-xs text-muted-foreground">Periodicidade</p>
                              <p className="text-sm font-medium">a cada {plan.periodicity_days} dias</p>
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-2">
                            <CalendarIcon className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="text-xs text-muted-foreground">Próximo Ciclo</p>
                              <p className="text-sm font-medium">{getNextCycleDate(plan)}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-2">
                            <Activity className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="text-xs text-muted-foreground">SC (BSA)</p>
                              <p className="text-sm font-medium">{plan.bsa_m2?.toFixed(2) || '-'} m²</p>
                            </div>
                          </div>
                        </div>

                        {plan.drugs && plan.drugs.length > 0 && (
                          <div className="mb-4">
                            <p className="text-xs text-muted-foreground mb-2">Drogas do protocolo:</p>
                            <div className="flex flex-wrap gap-1">
                              {plan.drugs.slice(0, 4).map((drug: any, idx: number) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {drug.drug_name}
                                </Badge>
                              ))}
                              {plan.drugs.length > 4 && (
                                <Badge variant="outline" className="text-xs">
                                  +{plan.drugs.length - 4} mais
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="flex gap-2 border-t pt-4">
                          <Button size="sm" variant="outline" className="flex-1">
                            Ver Detalhes
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1">
                            Ver Ciclos
                          </Button>
                          {plan.status === 'active' && (
                            <Button size="sm" className="flex-1">
                              Gerenciar
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="current">
          <Card>
            <CardHeader>
              <CardTitle>Ciclo Atual</CardTitle>
              <CardDescription>
                Informações sobre o ciclo em andamento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Em desenvolvimento...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule">
          <Card>
            <CardHeader>
              <CardTitle>Cronograma de Ciclos</CardTitle>
              <CardDescription>
                Calendário completo do tratamento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Em desenvolvimento...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Ciclos</CardTitle>
              <CardDescription>
                Ciclos já realizados e suas informações
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Em desenvolvimento...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <TreatmentPlanDialog
        open={createPlanDialogOpen}
        onOpenChange={setCreatePlanDialogOpen}
        onSuccess={refetchTreatmentPlans}
      />
    </div>
  );
}
