import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Activity, Calendar as CalendarIcon, Clock, CheckCircle2, AlertCircle, Beaker, Syringe, Eye, Stethoscope, Trash2, Pencil } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAppContext } from "@/contexts/AppContext";
import TreatmentPlanDialog from "@/components/TreatmentPlanDialog";
import TreatmentDetailDialog from "@/components/TreatmentDetailDialog";
import TreatmentCyclesDialog from "@/components/TreatmentCyclesDialog";
import { format, isPast, isFuture, isToday, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Progress } from "@/components/ui/progress";
import { usePermissions } from "@/hooks/usePermissions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { usePatientTreatment } from "@/hooks/usePatientTreatment";
import { TreatmentService } from "@/services/treatmentService";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface TreatmentProps {
  // Optional: Patient ID for doctor context (loads patient's data instead of current user)
  patientId?: string;
  // Optional: Override edit permission (used in doctor context)
  canEditOverride?: boolean;
  // Optional: Custom refetch function for external data sources
  onRefetch?: () => Promise<void>;
}

export default function Treatment({ patientId, canEditOverride, onRefetch }: TreatmentProps = {}) {
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  
  // Dialog states for action buttons
  const [selectedPlanForDetails, setSelectedPlanForDetails] = useState<any>(null);
  const [selectedPlanForCycles, setSelectedPlanForCycles] = useState<any>(null);
  const [planToDelete, setPlanToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Use AppContext for patient's own view, or usePatientTreatment for doctor's view
  const appContext = useAppContext();
  const patientTreatment = usePatientTreatment(patientId);
  
  // Determine which data source to use
  const isViewingPatient = !!patientId;
  const treatmentPlans = isViewingPatient ? patientTreatment.treatmentPlans : appContext.treatmentPlans;
  const refetchTreatmentPlans = onRefetch || (isViewingPatient ? patientTreatment.refetch : appContext.refetchTreatmentPlans);
  
  // Doctor info only shown in patient's own view
  const doctors = isViewingPatient ? [] : appContext.doctors;
  const doctorsLoading = isViewingPatient ? false : appContext.doctorsLoading;
  
  const { canEdit, isDoctor } = usePermissions();
  
  // Filter only active doctors (for patient's own view)
  const activeDoctors = doctors.filter(d => d.status === 'active');
  const primaryDoctor = activeDoctors.length > 0 ? activeDoctors[0] : null;
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

  // Use override if provided (doctor context), otherwise use permission hook
  const canEditTreatment = canEditOverride !== undefined ? canEditOverride : canEdit('treatment');
  
  // Determine context for UI text
  const isDoctorContext = isViewingPatient || isDoctor;

  // Handlers for action buttons
  const handleViewDetails = (plan: any) => {
    setSelectedPlanForDetails(plan);
  };

  const handleViewCycles = (plan: any) => {
    setSelectedPlanForCycles(plan);
  };

  const handleEditPlan = (plan: any) => {
    setEditingPlan(plan);
    setPlanDialogOpen(true);
  };

  const handleCreateNewPlan = () => {
    setEditingPlan(null);
    setPlanDialogOpen(true);
  };

  const handleDeletePlan = async () => {
    if (!planToDelete) return;
    
    try {
      setIsDeleting(true);
      await TreatmentService.deleteTreatmentPlan(planToDelete.id);
      
      toast({
        title: "Plano excluído",
        description: `O plano "${planToDelete.regimen_name}" foi excluído com sucesso.`,
      });
      
      setPlanToDelete(null);
      refetchTreatmentPlans();
    } catch (error) {
      console.error('Error deleting plan:', error);
      toast({
        variant: "destructive",
        title: "Erro ao excluir plano",
        description: error instanceof Error ? error.message : "Erro desconhecido",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Tratamento</h1>
          <p className="text-muted-foreground">
            {isDoctorContext ? 'Gerencie os planos de tratamento do paciente' : 'Acompanhe seus planos de tratamento oncológico'}
          </p>
          
          {/* Responsible Doctor Badge - only show in patient's own view */}
          {!isViewingPatient && !isDoctor && (
            doctorsLoading ? (
              <div className="flex items-center gap-2 mt-2">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-4 w-40" />
              </div>
            ) : primaryDoctor ? (
              <div className="flex items-center gap-2 p-2 bg-primary/10 rounded-lg mt-2">
                <Stethoscope className="h-4 w-4 text-primary" />
                <div className="text-sm">
                  <span className="font-medium">Dr. {primaryDoctor.first_name} {primaryDoctor.last_name}</span>
                  {primaryDoctor.specialty && (
                    <span className="text-muted-foreground"> · {primaryDoctor.specialty}</span>
                  )}
                  <span className="text-muted-foreground"> · Médico responsável</span>
                </div>
              </div>
            ) : null
          )}
        </div>
        {!canEditTreatment && (
          <Badge variant="outline" className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            Somente visualização
          </Badge>
        )}
      </div>

      {!canEditTreatment && (
        <Alert>
          <Eye className="h-4 w-4" />
          <AlertDescription>
            Esta página é somente para visualização. Alterações devem ser feitas pelo seu médico.
          </AlertDescription>
        </Alert>
      )}

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
                {canEditTreatment && (
                  <Button onClick={handleCreateNewPlan}>
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Plano
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!treatmentPlans || treatmentPlans.length === 0 ? (
                <div className="text-center py-12">
                  <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Nenhum plano de tratamento cadastrado ainda.
                  </p>
                  {canEditTreatment && (
                    <Button onClick={handleCreateNewPlan}>
                      <Plus className="mr-2 h-4 w-4" />
                      Criar Primeiro Plano
                    </Button>
                  )}
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
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => handleViewDetails(plan)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Ver Detalhes
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => handleViewCycles(plan)}
                          >
                            <CalendarIcon className="h-4 w-4 mr-1" />
                            Ver Ciclos
                          </Button>
                          {canEditTreatment && plan.status === 'active' && (
                            <>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleEditPlan(plan)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => setPlanToDelete(plan)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
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
          {(() => {
            const activePlan = treatmentPlans?.find((p: any) => p.status === 'active');
            
            if (!activePlan) {
              return (
                <Card>
                  <CardContent className="py-12">
                    <div className="text-center">
                      <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        Nenhum tratamento ativo no momento
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            }

            const currentCycle = activePlan.cycles?.find((c: any) => 
              c.status === 'scheduled' || c.status === 'in_progress'
            );

            if (!currentCycle) {
              return (
                <Card>
                  <CardContent className="py-12">
                    <div className="text-center">
                      <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-4" />
                      <p className="text-muted-foreground">
                        Todos os ciclos foram concluídos
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            }

            const cycleDate = new Date(currentCycle.scheduled_date);
            const daysUntil = differenceInDays(cycleDate, new Date());

            return (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-2xl">Ciclo {currentCycle.cycle_number} de {activePlan.planned_cycles}</CardTitle>
                        <CardDescription>{activePlan.regimen_name}</CardDescription>
                      </div>
                      <Badge variant={daysUntil <= 0 ? "default" : "outline"} className="text-sm">
                        {isToday(cycleDate) ? "Hoje" : daysUntil < 0 ? "Atrasado" : `${daysUntil} dias`}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Data Agendada</p>
                        <p className="font-medium">{formatDate(currentCycle.scheduled_date)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Status Liberação</p>
                        <Badge variant={currentCycle.release_status === 'released' ? 'default' : 'secondary'}>
                          {currentCycle.release_status === 'released' ? 'Liberado' : 
                           currentCycle.release_status === 'delayed' ? 'Adiado' : 
                           currentCycle.release_status === 'dose_adjusted' ? 'Dose Ajustada' : 'Pendente'}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Peso / Altura</p>
                        <p className="font-medium">
                          {activePlan.weight_kg}kg / {activePlan.height_cm}cm
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">SC (BSA)</p>
                        <p className="font-medium">{activePlan.bsa_m2?.toFixed(2)} m²</p>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Progresso do Tratamento</span>
                        <span className="text-sm text-muted-foreground">
                          {Math.round((currentCycle.cycle_number / activePlan.planned_cycles) * 100)}%
                        </span>
                      </div>
                      <Progress value={(currentCycle.cycle_number / activePlan.planned_cycles) * 100} />
                    </div>

                    {currentCycle.anc_value && (
                      <div className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <Beaker className="h-5 w-5 text-primary" />
                          <h4 className="font-semibold">Exames Laboratoriais</h4>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {currentCycle.anc_value && (
                            <div>
                              <p className="text-xs text-muted-foreground">Neutrófilos (ANC)</p>
                              <p className="font-medium">{currentCycle.anc_value}/mm³</p>
                            </div>
                          )}
                          {currentCycle.plt_value && (
                            <div>
                              <p className="text-xs text-muted-foreground">Plaquetas</p>
                              <p className="font-medium">{currentCycle.plt_value.toLocaleString()}/mm³</p>
                            </div>
                          )}
                          {currentCycle.scr_value && (
                            <div>
                              <p className="text-xs text-muted-foreground">Creatinina</p>
                              <p className="font-medium">{currentCycle.scr_value} mg/dL</p>
                            </div>
                          )}
                          {currentCycle.ast_value && (
                            <div>
                              <p className="text-xs text-muted-foreground">AST (TGO)</p>
                              <p className="font-medium">{currentCycle.ast_value} U/L</p>
                            </div>
                          )}
                          {currentCycle.alt_value && (
                            <div>
                              <p className="text-xs text-muted-foreground">ALT (TGP)</p>
                              <p className="font-medium">{currentCycle.alt_value} U/L</p>
                            </div>
                          )}
                          {currentCycle.bilirubin_value && (
                            <div>
                              <p className="text-xs text-muted-foreground">Bilirrubina</p>
                              <p className="font-medium">{currentCycle.bilirubin_value} mg/dL</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {activePlan.drugs && activePlan.drugs.length > 0 && (
                      <div className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <Syringe className="h-5 w-5 text-primary" />
                          <h4 className="font-semibold">Medicamentos do Ciclo</h4>
                        </div>
                        <div className="space-y-2">
                          {activePlan.drugs.map((drug: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded">
                              <div>
                                <p className="font-medium">{drug.drug_name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {drug.reference_dose} {drug.dose_unit} • {drug.route} • {drug.day_codes.join(', ')}
                                </p>
                              </div>
                              {drug.infusion_time_min && (
                                <Badge variant="outline" className="text-xs">
                                  {drug.infusion_time_min}min
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {currentCycle.delay_reason && (
                      <div className="border border-yellow-500/50 bg-yellow-500/10 rounded-lg p-4">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                          <div>
                            <p className="font-semibold text-yellow-900 dark:text-yellow-100">Motivo do Adiamento</p>
                            <p className="text-sm text-yellow-800 dark:text-yellow-200">{currentCycle.delay_reason}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            );
          })()}
        </TabsContent>

        <TabsContent value="schedule">
          {(() => {
            const activePlan = treatmentPlans?.find((p: any) => p.status === 'active');
            
            if (!activePlan) {
              return (
                <Card>
                  <CardContent className="py-12">
                    <div className="text-center">
                      <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        Nenhum tratamento ativo para visualizar cronograma
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            }

            const cycles = activePlan.cycles || [];
            const sortedCycles = [...cycles].sort((a: any, b: any) => 
              new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime()
            );

            return (
              <Card>
                <CardHeader>
                  <CardTitle>Cronograma - {activePlan.regimen_name}</CardTitle>
                  <CardDescription>
                    {activePlan.planned_cycles} ciclos • A cada {activePlan.periodicity_days} dias
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {sortedCycles.map((cycle: any, idx: number) => {
                      const cycleDate = new Date(cycle.scheduled_date);
                      const isPastCycle = isPast(cycleDate) && !isToday(cycleDate);
                      const isFutureCycle = isFuture(cycleDate);
                      const isTodayCycle = isToday(cycleDate);

                      return (
                        <div
                          key={cycle.id}
                          className={`flex items-start gap-4 p-4 rounded-lg border-2 transition-colors ${
                            isTodayCycle ? 'border-primary bg-primary/5' :
                            cycle.status === 'completed' ? 'border-green-500/50 bg-green-500/5' :
                            isPastCycle ? 'border-red-500/50 bg-red-500/5' :
                            'border-border'
                          }`}
                        >
                          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-background border-2 flex items-center justify-center font-bold">
                            {cycle.cycle_number}
                          </div>
                          
                          <div className="flex-1 space-y-2">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-semibold">Ciclo {cycle.cycle_number}</p>
                                <p className="text-sm text-muted-foreground">
                                  {formatDate(cycle.scheduled_date)}
                                  {cycle.actual_date && cycle.actual_date !== cycle.scheduled_date && 
                                    ` (realizado em ${formatDate(cycle.actual_date)})`
                                  }
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Badge variant={
                                  cycle.status === 'completed' ? 'default' :
                                  cycle.status === 'in_progress' ? 'secondary' :
                                  isTodayCycle ? 'default' :
                                  'outline'
                                }>
                                  {cycle.status === 'completed' ? 'Concluído' :
                                   cycle.status === 'in_progress' ? 'Em Andamento' :
                                   isTodayCycle ? 'Hoje' :
                                   isPastCycle ? 'Atrasado' : 'Agendado'}
                                </Badge>
                                {cycle.release_status !== 'pending' && (
                                  <Badge variant="outline" className="text-xs">
                                    {cycle.release_status === 'released' ? 'Liberado' :
                                     cycle.release_status === 'delayed' ? 'Adiado' :
                                     cycle.release_status === 'dose_adjusted' ? 'Ajustado' :
                                     cycle.release_status === 'cancelled' ? 'Cancelado' : ''}
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {cycle.delay_reason && (
                              <p className="text-xs text-yellow-700 dark:text-yellow-400 flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                {cycle.delay_reason}
                              </p>
                            )}

                            {(cycle.anc_value || cycle.plt_value) && (
                              <div className="flex gap-4 text-xs">
                                {cycle.anc_value && (
                                  <span className="text-muted-foreground">
                                    ANC: {cycle.anc_value}
                                  </span>
                                )}
                                {cycle.plt_value && (
                                  <span className="text-muted-foreground">
                                    PLT: {cycle.plt_value.toLocaleString()}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })()}
        </TabsContent>

        <TabsContent value="history">
          {(() => {
            const allCompletedCycles = treatmentPlans?.flatMap((plan: any) => 
              (plan.cycles || [])
                .filter((c: any) => c.status === 'completed')
                .map((c: any) => ({ ...c, plan }))
            ) || [];

            const sortedCompleted = allCompletedCycles.sort((a: any, b: any) => 
              new Date(b.actual_date || b.scheduled_date).getTime() - 
              new Date(a.actual_date || a.scheduled_date).getTime()
            );

            if (sortedCompleted.length === 0) {
              return (
                <Card>
                  <CardContent className="py-12">
                    <div className="text-center">
                      <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        Nenhum ciclo concluído ainda
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            }

            return (
              <Card>
                <CardHeader>
                  <CardTitle>Histórico de Ciclos Realizados</CardTitle>
                  <CardDescription>
                    {sortedCompleted.length} {sortedCompleted.length === 1 ? 'ciclo concluído' : 'ciclos concluídos'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {sortedCompleted.map((cycle: any) => (
                      <div
                        key={cycle.id}
                        className="border rounded-lg p-4 space-y-3 bg-green-500/5 border-green-500/30"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                              <h4 className="font-semibold">
                                {cycle.plan.regimen_name} - Ciclo {cycle.cycle_number}
                              </h4>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Realizado em {formatDate(cycle.actual_date || cycle.scheduled_date)}
                            </p>
                            {cycle.actual_date && cycle.actual_date !== cycle.scheduled_date && (
                              <p className="text-xs text-muted-foreground">
                                (Agendado para {formatDate(cycle.scheduled_date)})
                              </p>
                            )}
                          </div>
                          <Badge variant="default" className="bg-green-600">
                            Concluído
                          </Badge>
                        </div>

                        {(cycle.anc_value || cycle.plt_value || cycle.scr_value) && (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-3 bg-background rounded border">
                            {cycle.anc_value && (
                              <div>
                                <p className="text-xs text-muted-foreground">Neutrófilos</p>
                                <p className="text-sm font-medium">{cycle.anc_value}/mm³</p>
                              </div>
                            )}
                            {cycle.plt_value && (
                              <div>
                                <p className="text-xs text-muted-foreground">Plaquetas</p>
                                <p className="text-sm font-medium">{cycle.plt_value.toLocaleString()}/mm³</p>
                              </div>
                            )}
                            {cycle.scr_value && (
                              <div>
                                <p className="text-xs text-muted-foreground">Creatinina</p>
                                <p className="text-sm font-medium">{cycle.scr_value} mg/dL</p>
                              </div>
                            )}
                            {cycle.ast_value && (
                              <div>
                                <p className="text-xs text-muted-foreground">AST</p>
                                <p className="text-sm font-medium">{cycle.ast_value} U/L</p>
                              </div>
                            )}
                            {cycle.alt_value && (
                              <div>
                                <p className="text-xs text-muted-foreground">ALT</p>
                                <p className="text-sm font-medium">{cycle.alt_value} U/L</p>
                              </div>
                            )}
                            {cycle.bilirubin_value && (
                              <div>
                                <p className="text-xs text-muted-foreground">Bilirrubina</p>
                                <p className="text-sm font-medium">{cycle.bilirubin_value} mg/dL</p>
                              </div>
                            )}
                          </div>
                        )}

                        {cycle.dose_adjustments && (
                          <div className="text-xs p-2 bg-yellow-500/10 border border-yellow-500/30 rounded">
                            <p className="font-medium text-yellow-900 dark:text-yellow-100">
                              Ajustes de dose aplicados
                            </p>
                          </div>
                        )}

                        {cycle.release_decision_at && (
                          <p className="text-xs text-muted-foreground">
                            Liberado em {format(new Date(cycle.release_decision_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })()}
        </TabsContent>
      </Tabs>

      <TreatmentPlanDialog
        open={planDialogOpen}
        onOpenChange={(open) => {
          setPlanDialogOpen(open);
          if (!open) setEditingPlan(null);
        }}
        onSuccess={refetchTreatmentPlans}
        patientId={patientId}
        editPlan={editingPlan}
      />

      <TreatmentDetailDialog
        open={!!selectedPlanForDetails}
        onOpenChange={(open) => !open && setSelectedPlanForDetails(null)}
        plan={selectedPlanForDetails}
      />

      <TreatmentCyclesDialog
        open={!!selectedPlanForCycles}
        onOpenChange={(open) => !open && setSelectedPlanForCycles(null)}
        plan={selectedPlanForCycles}
        canEdit={canEditTreatment}
        onSuccess={refetchTreatmentPlans}
      />

      <AlertDialog open={!!planToDelete} onOpenChange={(open) => !open && setPlanToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Plano de Tratamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o plano "{planToDelete?.regimen_name}"? 
              Esta ação irá remover todos os ciclos e medicamentos associados e não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeletePlan}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Excluindo..." : "Excluir Plano"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
