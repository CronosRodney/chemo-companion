import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppContext } from "@/contexts/AppContext";

export default function Treatment() {
  const [createPlanDialogOpen, setCreatePlanDialogOpen] = useState(false);
  const { treatmentPlans } = useAppContext();

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
                    <div key={plan.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-lg">{plan.regimen_name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {plan.line_of_therapy} linha • {plan.treatment_intent}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {plan.planned_cycles} ciclos planejados
                          </p>
                          <p className="text-xs text-muted-foreground">
                            a cada {plan.periodicity_days} dias
                          </p>
                        </div>
                      </div>
                    </div>
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
    </div>
  );
}
