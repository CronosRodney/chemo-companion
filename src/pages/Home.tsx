import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, QrCode, Plus, Share2, Pill, Calendar, AlertTriangle, Clock, Building2, MapPin, Beaker, Activity, Stethoscope } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { ReminderManager } from "@/components/ReminderManager";
import { FeelingLogger } from "@/components/FeelingLogger";
import { TreatmentProgressWidget } from "@/components/TreatmentProgressWidget";
import { useAppContext } from "@/contexts/AppContext";
import { useToast } from "@/hooks/use-toast";

const Home = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { 
    profile, 
    loading, 
    reminders, 
    stats, 
    clinics,
    clinicsLoading,
    treatmentPlans,
    updateReminders,
    logFeeling: contextLogFeeling 
  } = useAppContext();
  
  const [showReminderManager, setShowReminderManager] = useState(false);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  const handleFeelingLogged = async (rating: number) => {
    try {
      await contextLogFeeling(rating);
      toast({
        title: "Humor registrado",
        description: "Registrado com sucesso na timeline"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível registrar o humor",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5 p-4 pb-20">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header Premium */}
        <div className="text-center pt-8 pb-4">
          <div className="luxury-card p-10 space-y-5 relative overflow-hidden border-2 border-primary/20">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary-glow/5 to-transparent"></div>
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/20 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-secondary/20 rounded-full blur-3xl"></div>
            
            <div className="relative">
              <div className="w-20 h-20 mx-auto rounded-full medical-gradient flex items-center justify-center mb-5 shadow-[0_0_40px_rgba(var(--primary-rgb),0.4)] animate-pulse">
                <Pill className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary-glow to-secondary bg-clip-text text-transparent mb-3">
                {getGreeting()}, {profile?.first_name || 'Maria'}
              </h1>
              <p className="text-muted-foreground text-lg font-medium">
                Como você está se sentindo hoje?
              </p>
              
              {/* FeelingLogger Integration */}
              <div className="mt-6">
                <FeelingLogger onFeelingLogged={handleFeelingLogged} />
              </div>
              
              {/* Legend */}
              <p className="text-sm text-muted-foreground text-center font-bold uppercase tracking-wide mt-4">
                1 = Muito mal | 5 = Excelente
              </p>
            </div>
          </div>
        </div>

        {/* Next Reminders Premium */}
        <div className="luxury-card p-6 space-y-4 border-2 border-primary/20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Bell className="h-5 w-5 text-primary" />
                </div>
                Próximos Lembretes
              </h2>
              <Button
                variant="outline"
                size="sm"
                className="border-primary/30 hover:bg-primary/10"
                onClick={() => setShowReminderManager(!showReminderManager)}
              >
                {showReminderManager ? 'Fechar' : 'Editar'}
              </Button>
            </div>
            <div className="space-y-4">
            {reminders.map((reminder) => (
              <div key={reminder.id} className={`glass-effect p-4 rounded-xl border-2 relative overflow-hidden ${reminder.urgent ? 'border-primary/40' : 'border-accent/40'}`}>
                {reminder.urgent && <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-primary-glow/5"></div>}
                <div className="relative flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-[var(--shadow-card)] ${reminder.urgent ? 'medical-gradient' : 'bg-accent/20'}`}>
                    <Pill className={`h-6 w-6 ${reminder.urgent ? 'text-white' : 'text-accent-foreground'}`} />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-base">{reminder.medication}</p>
                    <p className="text-sm text-muted-foreground">{reminder.cycle}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-lg ${reminder.urgent ? 'text-primary' : 'text-foreground'}`}>{reminder.time}</p>
                    <Badge variant={reminder.urgent ? "secondary" : "outline"} className="text-sm font-semibold">
                      {reminder.type}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
            
            {/* ReminderManager Integration */}
            {showReminderManager && (
              <div className="pt-4 border-t border-accent/30">
                <ReminderManager 
                  reminders={reminders}
                  onUpdate={updateReminders}
                />
              </div>
            )}
            </div>
          </div>
        </div>

        {/* Treatment Progress Widget */}
        <TreatmentProgressWidget treatmentPlans={treatmentPlans || []} />

        {/* Connected Clinics */}
        {!clinicsLoading && clinics.length > 0 && (
          <div className="luxury-card p-6 space-y-4 border-2 border-secondary/20">
            <h2 className="text-xl font-bold text-card-foreground text-shadow flex items-center gap-3">
              <Building2 className="h-6 w-6 text-secondary-accent" />
              Clínica Conectada
            </h2>
            <div className="space-y-3">
              {clinics.slice(0, 1).map((clinic) => (
                <div key={clinic.id} className="glass-effect p-4 rounded-xl border-2 border-secondary/30 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-secondary/5 to-secondary-accent/10"></div>
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-secondary-accent" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-base text-card-foreground">{clinic.clinic_name}</p>
                        {clinic.city && clinic.state && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {clinic.city}, {clinic.state}
                          </p>
                        )}
                      </div>
                    </div>
                    {clinic.clinic_responsible && clinic.clinic_responsible.length > 0 && (
                      <div className="bg-background/50 p-3 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Responsável</p>
                        <p className="text-sm font-medium">{clinic.clinic_responsible[0].name}</p>
                        {clinic.clinic_responsible[0].role && (
                          <p className="text-xs text-muted-foreground">{clinic.clinic_responsible[0].role}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {clinics.length > 1 && (
                <p className="text-center text-sm text-muted-foreground">
                  +{clinics.length - 1} clínica{clinics.length > 2 ? 's' : ''} conectada{clinics.length > 2 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Quick Stats Premium */}
        <div className="grid grid-cols-2 gap-3">
          <div 
            className="luxury-card p-5 text-center relative overflow-hidden border-2 border-success/30 group hover:scale-105 transition-transform cursor-pointer"
            onClick={() => navigate('/medications')}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-success/10 via-success/5 to-transparent"></div>
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-success/20 rounded-full blur-2xl group-hover:blur-3xl transition-all"></div>
            <div className="relative">
              <div className="text-4xl font-bold bg-gradient-to-br from-success to-success/70 bg-clip-text text-transparent mb-2 text-shadow">{stats.adherence}%</div>
              <div className="text-xs text-muted-foreground font-bold uppercase tracking-wide">Adesão</div>
            </div>
          </div>
          <div 
            className="luxury-card p-5 text-center relative overflow-hidden border-2 border-secondary/30 group hover:scale-105 transition-transform cursor-pointer"
            onClick={() => navigate('/events')}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 via-secondary-accent/5 to-transparent"></div>
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-secondary/20 rounded-full blur-2xl group-hover:blur-3xl transition-all"></div>
            <div className="relative">
              <div className="text-xl font-bold bg-gradient-to-br from-secondary-accent to-secondary bg-clip-text text-transparent mb-2 text-shadow">{stats.nextAppointment}</div>
              <div className="text-xs text-muted-foreground font-bold uppercase tracking-wide">Consulta</div>
            </div>
          </div>
        </div>

        {/* Lab Results Quick Access */}
        {treatmentPlans && treatmentPlans.length > 0 && (
          <div 
            className="luxury-card p-6 border-2 border-accent/30 relative overflow-hidden group hover:scale-[1.02] transition-transform cursor-pointer"
            onClick={() => navigate('/labs')}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent"></div>
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                  <Beaker className="h-6 w-6 text-accent-foreground" />
                </div>
                <div>
                  <p className="font-bold text-lg">Exames Laboratoriais</p>
                  <p className="text-sm text-muted-foreground">Ver histórico e tendências</p>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                Ver
              </Button>
            </div>
          </div>
        )}

        {/* Wearables / Health Monitoring */}
        <div 
          className="luxury-card p-6 border-2 border-chart-1/30 relative overflow-hidden group hover:scale-[1.02] transition-transform cursor-pointer"
          onClick={() => navigate('/health')}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-chart-1/10 to-transparent"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-chart-1/20 flex items-center justify-center">
                <Activity className="h-6 w-6 text-chart-1" />
              </div>
              <div>
                <p className="font-bold text-lg">Monitoramento de Saúde</p>
                <p className="text-sm text-muted-foreground">Conecte seus dispositivos wearables</p>
              </div>
            </div>
            <Button variant="ghost" size="sm">
              Ver
            </Button>
          </div>
        </div>

        {/* Doctor Portal Access */}
        <div 
          className="luxury-card p-6 border-2 border-primary/30 relative overflow-hidden group hover:scale-[1.02] transition-transform cursor-pointer"
          onClick={() => navigate('/doctor')}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Stethoscope className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-bold text-lg">Portal do Médico</p>
                <p className="text-sm text-muted-foreground">Acesse o painel de acompanhamento</p>
              </div>
            </div>
            <Button variant="ghost" size="sm">
              Acessar
            </Button>
          </div>
        </div>

        {/* Emergency Alert */}
        <div className="luxury-card bg-destructive/5 border-2 border-destructive/30 p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-destructive/5 to-destructive/10"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-destructive text-lg flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
                Emergência 24h
              </h3>
              <Button
                variant="outline"
                size="sm"
                className="border-destructive/30 hover:bg-destructive/10 text-destructive"
                onClick={() => navigate('/profile/edit')}
              >
                Editar
              </Button>
            </div>
            <div className="flex-1">
              <p className="text-sm text-destructive/80 mb-4">
                Febre &gt; 38°C ou sintomas graves? Entre em contato imediatamente
              </p>
              <p className="text-sm text-destructive/80 mb-4">
                {profile?.emergency_contact_name || 'Maria Silva'} - {profile?.emergency_contact_phone || '(11) 88888-8888'}
              </p>
              <Button variant="destructive" size="sm" className="font-bold">
                <Clock className="h-4 w-4 mr-2" />
                Ligar Emergência
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;