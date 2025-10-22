import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Beaker, TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle2, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "@/contexts/AppContext";
import { LabTrendsChart } from "@/components/LabTrendsChart";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Labs = () => {
  const navigate = useNavigate();
  const { treatmentPlans } = useAppContext();

  // Get active plan
  const activePlan = treatmentPlans?.find(plan => plan.status === 'active');
  
  // Get all cycles with lab data
  const allCycles = activePlan?.treatment_cycles || [];
  const cyclesWithLabs = allCycles.filter(cycle => 
    cycle.anc_value || cycle.plt_value || cycle.scr_value || 
    cycle.ast_value || cycle.alt_value || cycle.bilirubin_value
  ).sort((a, b) => new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime());

  // Get latest cycle with labs
  const latestCycle = cyclesWithLabs[0];

  const getLabStatus = (value: number | null | undefined, min?: number, max?: number) => {
    if (value === null || value === undefined) return 'unknown';
    if (min && value < min) return 'low';
    if (max && value > max) return 'high';
    return 'normal';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'normal':
        return <Badge variant="outline" className="bg-success/10 text-success border-success/30"><CheckCircle2 className="h-3 w-3 mr-1" />Normal</Badge>;
      case 'low':
        return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30"><TrendingDown className="h-3 w-3 mr-1" />Baixo</Badge>;
      case 'high':
        return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30"><TrendingUp className="h-3 w-3 mr-1" />Alto</Badge>;
      default:
        return <Badge variant="outline" className="bg-muted/50"><Minus className="h-3 w-3 mr-1" />N/D</Badge>;
    }
  };

  const labParams = [
    { key: 'anc', label: 'Neutrófilos (ANC)', unit: 'células/mm³', min: activePlan?.anc_min || 1500, color: 'hsl(var(--primary))' },
    { key: 'plt', label: 'Plaquetas', unit: 'células/mm³', min: activePlan?.plt_min || 100000, color: 'hsl(var(--secondary))' },
    { key: 'scr', label: 'Creatinina', unit: 'mg/dL', max: activePlan?.scr_max || 1.5, color: 'hsl(var(--accent))' },
    { key: 'ast', label: 'AST/TGO', unit: 'U/L', max: 40 * (activePlan?.ast_alt_max_xuln || 2.5), color: 'hsl(var(--success))' },
    { key: 'alt', label: 'ALT/TGP', unit: 'U/L', max: 40 * (activePlan?.ast_alt_max_xuln || 2.5), color: 'hsl(var(--warning))' },
    { key: 'bilirubin', label: 'Bilirrubina', unit: 'mg/dL', max: 1.2, color: 'hsl(var(--destructive))' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5 p-4 pb-20">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 pt-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Exames Laboratoriais
            </h1>
            <p className="text-muted-foreground">Histórico e tendências dos seus exames</p>
          </div>
        </div>

        {!activePlan && (
          <Card className="border-2 border-warning/30 bg-warning/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 text-warning">
                <AlertTriangle className="h-5 w-5" />
                <p>Nenhum plano de tratamento ativo encontrado.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {activePlan && (
          <>
            {/* Latest Results */}
            {latestCycle && (
              <Card className="luxury-card border-2 border-primary/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <Beaker className="h-5 w-5 text-primary" />
                      </div>
                      Resultados Mais Recentes
                    </CardTitle>
                    <Badge variant="outline">
                      Ciclo {latestCycle.cycle_number} - {format(new Date(latestCycle.scheduled_date), "dd 'de' MMMM", { locale: ptBR })}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {labParams.map(param => {
                      const value = latestCycle[`${param.key}_value`];
                      const status = getLabStatus(value, param.min, param.max);
                      
                      return (
                        <div key={param.key} className="glass-effect p-4 rounded-lg border-2 border-accent/20">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-muted-foreground">{param.label}</p>
                            {getStatusBadge(status)}
                          </div>
                          <div className="flex items-baseline gap-2">
                            <p className="text-2xl font-bold">
                              {value !== null && value !== undefined ? value.toLocaleString('pt-BR') : 'N/D'}
                            </p>
                            <p className="text-sm text-muted-foreground">{param.unit}</p>
                          </div>
                          {param.min && (
                            <p className="text-xs text-muted-foreground mt-1">Mín: {param.min.toLocaleString('pt-BR')}</p>
                          )}
                          {param.max && (
                            <p className="text-xs text-muted-foreground mt-1">Máx: {param.max.toLocaleString('pt-BR')}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Trend Charts */}
            {cyclesWithLabs.length > 1 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">Tendências ao Longo do Tratamento</h2>
                
                <div className="grid grid-cols-1 gap-4">
                  {labParams.map(param => (
                    <LabTrendsChart
                      key={param.key}
                      cycles={allCycles}
                      labParam={param.key as any}
                      title={param.label}
                      unit={param.unit}
                      referenceMin={param.min}
                      referenceMax={param.max}
                      color={param.color}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Historical Data Table */}
            {cyclesWithLabs.length > 0 && (
              <Card className="border-2 border-secondary/20">
                <CardHeader>
                  <CardTitle>Histórico Completo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {cyclesWithLabs.map(cycle => (
                      <div key={cycle.id} className="glass-effect p-4 rounded-lg border border-accent/20">
                        <div className="flex items-center justify-between mb-3">
                          <p className="font-bold">Ciclo {cycle.cycle_number}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(cycle.scheduled_date), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          {labParams.map(param => {
                            const value = cycle[`${param.key}_value`];
                            if (value === null || value === undefined) return null;
                            return (
                              <div key={param.key}>
                                <p className="text-muted-foreground text-xs">{param.label}</p>
                                <p className="font-medium">{value.toLocaleString('pt-BR')}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Labs;