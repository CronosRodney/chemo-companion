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
import { useDoctorAuth } from "@/hooks/useDoctorAuth";
import { PendingInvitesNotification } from "@/components/PendingInvitesNotification";
import { useIsMobile } from "@/hooks/use-mobile";

const Home = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isDoctor } = useDoctorAuth();
  const isMobile = useIsMobile();
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

  // Mobile: limit reminders to 1 item
  const displayedReminders = isMobile ? reminders.slice(0, 1) : reminders;

  if (loading) {
    return (
      <div className="min-h-screen bg-[hsl(220,30%,97%)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Doctor Home - Simplified entry point
  if (isDoctor) {
    return (
      <div className="min-h-screen bg-[hsl(220,30%,97%)] p-4 pb-20">
        <div className="max-w-md mx-auto space-y-6">
          {/* Header for Doctor */}
          <div className="text-center pt-8 pb-4">
            <div className="bg-card rounded-2xl shadow-sm border border-border/50 p-10 space-y-5">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-5">
                <Stethoscope className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-3">
                {getGreeting()}, Dr. {profile?.first_name || 'Médico'}
              </h1>
              <p className="text-muted-foreground text-base">
                Acesse o painel para acompanhar seus pacientes
              </p>
            </div>
          </div>

          {/* Doctor Portal Access Card */}
          <div 
            className="bg-card rounded-2xl shadow-sm border border-border/50 p-8 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate('/doctor')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <Stethoscope className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <p className="font-bold text-xl text-foreground">Portal do Médico</p>
                  <p className="text-sm text-muted-foreground">Acessar painel de acompanhamento</p>
                </div>
              </div>
              <Button variant="default" size="lg" className="font-semibold">
                Acessar
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Patient Home - Full experience
  return (
    <div className="min-h-screen bg-[hsl(220,30%,97%)] p-4 pb-20">
      <div className="max-w-2xl mx-auto space-y-5">
        {/* Greeting + Emotional Check */}
        <div className="pt-6 pb-2">
          <div className="bg-card rounded-2xl shadow-sm border border-border/50 p-6 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Pill className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {getGreeting()}, {profile?.first_name || 'Maria'}
                </h1>
                <p className="text-muted-foreground text-sm">
                  Como você está se sentindo hoje?
                </p>
              </div>
            </div>
            
            {/* FeelingLogger Integration */}
            <FeelingLogger onFeelingLogged={handleFeelingLogged} />
            
            {/* Legend */}
            <p className="text-xs text-muted-foreground text-center">
              1 = Muito mal · 5 = Excelente
            </p>
          </div>
        </div>

        {/* Treatment Progress Widget — with adherence integrated */}
        <TreatmentProgressWidget treatmentPlans={treatmentPlans || []} adherence={stats.adherence} />

        {/* Next Reminders */}
        <div className="bg-card rounded-2xl shadow-sm border border-border/50 p-6 space-y-4">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                <Bell className="h-4 w-4 text-primary" />
              </div>
              Próximos Lembretes
            </h2>
            <Button
              variant="outline"
              size="sm"
              className="text-sm"
              onClick={() => setShowReminderManager(!showReminderManager)}
            >
              {showReminderManager ? 'Fechar' : 'Editar'}
            </Button>
          </div>
          <div className="space-y-3">
            {displayedReminders.map((reminder) => (
              <div key={reminder.id} className={`p-4 rounded-xl border ${reminder.urgent ? 'border-primary/30 bg-primary/5' : 'border-border/50 bg-muted/30'}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${reminder.urgent ? 'bg-primary/15' : 'bg-accent/30'}`}>
                    <Pill className={`h-5 w-5 ${reminder.urgent ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-foreground">{reminder.medication}</p>
                    <p className="text-xs text-muted-foreground">{reminder.cycle}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-base ${reminder.urgent ? 'text-primary' : 'text-foreground'}`}>{reminder.time}</p>
                    <Badge variant={reminder.urgent ? "secondary" : "outline"} className="text-xs">
                      {reminder.type}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Mobile: "See more" link when there are more reminders */}
            {isMobile && reminders.length > 1 && (
              <Button
                variant="link"
                className="w-full text-primary"
                onClick={() => setShowReminderManager(true)}
              >
                Ver mais ({reminders.length - 1} lembrete{reminders.length > 2 ? 's' : ''})
              </Button>
            )}
            
            {/* ReminderManager Integration */}
            {showReminderManager && (
              <div className="pt-4 border-t border-border/50">
                <ReminderManager 
                  reminders={reminders}
                  onUpdate={updateReminders}
                />
              </div>
            )}
          </div>
        </div>

        {/* Connected Clinics — visible on desktop */}
        {!isMobile && !clinicsLoading && clinics.length > 0 && (
          <div className="bg-card rounded-2xl shadow-sm border border-border/50 p-6 space-y-4">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-secondary/20 flex items-center justify-center">
                <Building2 className="h-4 w-4 text-secondary-foreground" />
              </div>
              Clínica Conectada
            </h2>
            <div className="space-y-3">
              {clinics.slice(0, 1).map((clinic) => (
                <div key={clinic.id} className="p-4 rounded-xl border border-border/50 bg-muted/30">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-secondary/15 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-secondary-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-foreground">{clinic.clinic_name}</p>
                      {clinic.city && clinic.state && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {clinic.city}, {clinic.state}
                        </p>
                      )}
                    </div>
                  </div>
                  {clinic.clinic_responsible && clinic.clinic_responsible.length > 0 && (
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Responsável</p>
                      <p className="text-sm font-medium text-foreground">{clinic.clinic_responsible[0].name}</p>
                      {clinic.clinic_responsible[0].role && (
                        <p className="text-xs text-muted-foreground">{clinic.clinic_responsible[0].role}</p>
                      )}
                    </div>
                  )}
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

        {/* Lab Results Quick Access — now visible on all viewports */}
        {treatmentPlans && treatmentPlans.length > 0 && (
          <div 
            className="bg-card rounded-2xl shadow-sm border border-border/50 p-5 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate('/labs')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-accent/30 flex items-center justify-center">
                  <Beaker className="h-5 w-5 text-accent-foreground" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Exames Laboratoriais</p>
                  <p className="text-xs text-muted-foreground">Ver histórico e tendências</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                Ver
              </Button>
            </div>
          </div>
        )}

        {/* Health Monitoring — now visible on all viewports */}
        <div 
          className="bg-card rounded-2xl shadow-sm border border-border/50 p-5 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate('/health')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Monitoramento de Saúde</p>
                <p className="text-xs text-muted-foreground">Conecte seus dispositivos wearables</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              Ver
            </Button>
          </div>
        </div>

        {/* Pending Doctor Invites — now visible on all viewports */}
        <PendingInvitesNotification />

        {/* Emergency Alert */}
        <div className="bg-destructive/5 rounded-2xl border border-destructive/20 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-destructive text-base flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              Emergência 24h
            </h3>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:bg-destructive/10"
              onClick={() => navigate('/profile/edit')}
            >
              Editar
            </Button>
          </div>
          <p className="text-sm text-destructive/80 mb-3">
            Febre &gt; 38°C ou sintomas graves? Entre em contato imediatamente
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            {profile?.emergency_contact_name || 'Maria Silva'} - {profile?.emergency_contact_phone || '(11) 88888-8888'}
          </p>
          <Button 
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-bold w-full sm:w-auto"
            size="lg"
            asChild
          >
            <a href={`tel:${profile?.emergency_contact_phone || '(11) 88888-8888'}`}>Ligar Agora</a>
          </Button>
        </div>

        {/* Health App Disclaimer */}
        <p className="text-xs text-muted-foreground text-center px-4 pb-4">
          Este aplicativo auxilia no acompanhamento do tratamento e não substitui orientação médica profissional.
        </p>
      </div>
    </div>
  );
};

export default Home;
