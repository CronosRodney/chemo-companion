import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Pill, AlertTriangle, Building2, MapPin, Beaker, Activity, Stethoscope, Bot, User, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
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
      toast({ title: "Humor registrado", description: "Registrado com sucesso na timeline" });
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível registrar o humor", variant: "destructive" });
    }
  };

  const displayedReminders = isMobile ? reminders.slice(0, 1) : reminders;

  // Derive treatment info for header
  const activePlan = treatmentPlans?.find((p: any) => p.status === 'active');
  const completedCycles = activePlan?.treatment_cycles?.filter((c: any) => c.status === 'completed').length || 0;
  const totalCycles = activePlan?.planned_cycles || 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-[hsl(214,32%,97%)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Doctor Home
  if (isDoctor) {
    return (
      <div className="min-h-screen bg-[hsl(214,32%,97%)] p-4 pb-20">
        <div className="max-w-md mx-auto space-y-6">
          <div className="text-center pt-8 pb-4">
            <div className="bg-card rounded-2xl shadow-sm border border-[hsl(214,30%,93%)] p-10 space-y-5">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-5">
                <Stethoscope className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-2xl font-semibold text-foreground mb-3">
                {getGreeting()}, Dr. {profile?.first_name || 'Médico'}
              </h1>
              <p className="text-muted-foreground text-base">
                Acesse o painel para acompanhar seus pacientes
              </p>
            </div>
          </div>
          <div 
            className="bg-card rounded-2xl shadow-sm border border-[hsl(214,30%,93%)] p-8 cursor-pointer hover:shadow-md transition-shadow"
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
              <Button variant="default" size="lg" className="font-semibold">Acessar</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Patient Home
  return (
    <div className="min-h-screen bg-gradient-to-b from-[hsl(214,25%,97%)] to-[hsl(214,20%,93%)] pb-20">
      <div className="max-w-3xl mx-auto space-y-6 px-4">

        {/* ─── 1. HEADER — Full-width organic shape ─── */}
        <div className="-mx-4 px-6 pt-6 pb-8 bg-gradient-to-br from-[hsl(214,55%,92%)] to-[hsl(214,40%,96%)] rounded-b-[2rem]">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h1 className="text-2xl font-semibold text-[hsl(214,40%,22%)]">
                  {getGreeting()}, {profile?.first_name || 'Maria'}
                </h1>
                {activePlan ? (
                  <p className="text-sm text-[hsl(214,20%,42%)] mt-1">
                    Tratamento {activePlan.regimen_name} · Ciclo {completedCycles + 1} de {totalCycles}
                  </p>
                ) : (
                  <p className="text-sm text-[hsl(214,20%,42%)] mt-1">
                    Como você está se sentindo hoje?
                  </p>
                )}
              </div>
              <div className="w-14 h-14 rounded-full border-2 border-white/80 shadow-md bg-[hsl(214,30%,86%)] flex items-center justify-center flex-shrink-0 ml-4">
                <User className="h-6 w-6 text-[hsl(214,30%,45%)]" />
              </div>
            </div>

            {/* Feeling Logger */}
            <div className="mt-5">
              <p className="text-xs text-[hsl(214,20%,48%)] mb-2.5 font-medium">Como você está hoje?</p>
              <FeelingLogger onFeelingLogged={handleFeelingLogged} />
            </div>
          </div>
        </div>

        {/* ─── 2. TREATMENT (elevated card) ─── */}
        <TreatmentProgressWidget treatmentPlans={treatmentPlans || []} adherence={stats.adherence} />

        {/* ─── 3. ONCOTRACK AI — refined ─── */}
        <div className="bg-[hsl(214,45%,97%)] rounded-2xl border border-[hsl(214,40%,90%)] p-5 flex overflow-hidden">
          {/* Left accent bar */}
          <div className="w-[3px] bg-primary/40 rounded-full mr-4 flex-shrink-0" />
          <div className="flex items-start gap-3 flex-1">
            <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Bot className="h-4 w-4 text-primary" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-primary/70 uppercase tracking-wider mb-1.5">OncoTrack AI</p>
              <p className="text-sm text-[hsl(214,15%,35%)] leading-relaxed">
                Análise diária concluída
              </p>
              <p className="text-sm text-[hsl(214,15%,50%)] leading-relaxed">
                Nenhum sinal fora do padrão hoje.
              </p>
            </div>
          </div>
        </div>

        {/* ─── 4. REMINDERS ─── */}
        <div className="bg-card rounded-2xl shadow-sm border border-[hsl(214,30%,93%)] p-6 space-y-4">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                <Bell className="h-4 w-4 text-primary" />
              </div>
              Próximos Lembretes
            </h2>
            <Button
              variant="outline"
              size="sm"
              className="text-xs border-primary/20 text-primary hover:bg-primary/5"
              onClick={() => setShowReminderManager(!showReminderManager)}
            >
              {showReminderManager ? 'Fechar' : 'Editar'}
            </Button>
          </div>
          <div className="space-y-3">
            {displayedReminders.map((reminder) => (
              <div key={reminder.id} className={`p-4 rounded-xl border ${reminder.urgent ? 'border-primary/20 bg-primary/5' : 'border-[hsl(214,30%,93%)] bg-[hsl(214,30%,98%)]'}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${reminder.urgent ? 'bg-primary/10' : 'bg-[hsl(214,30%,93%)]'}`}>
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
            
            {isMobile && reminders.length > 1 && (
              <Button variant="link" className="w-full text-primary" onClick={() => setShowReminderManager(true)}>
                Ver mais ({reminders.length - 1} lembrete{reminders.length > 2 ? 's' : ''})
              </Button>
            )}
            
            {showReminderManager && (
              <div className="pt-4 border-t border-[hsl(214,30%,93%)]">
                <ReminderManager reminders={reminders} onUpdate={updateReminders} />
              </div>
            )}
          </div>
        </div>

        {/* ─── Connected Clinics (desktop) ─── */}
        {!isMobile && !clinicsLoading && clinics.length > 0 && (
          <div className="bg-card rounded-2xl shadow-sm border border-[hsl(214,30%,93%)] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[hsl(214,30%,93%)] flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-primary" />
                </div>
                Clínica Conectada
              </h2>
              <Badge variant="outline" className="text-xs font-medium border-[hsl(142,60%,70%)] text-[hsl(142,60%,30%)] bg-[hsl(142,60%,95%)]">
                ● Ativa
              </Badge>
            </div>
            <div className="space-y-3">
              {clinics.slice(0, 1).map((clinic) => (
                <div key={clinic.id} className="p-4 rounded-xl border border-[hsl(214,30%,93%)] bg-[hsl(214,30%,98%)]">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-[hsl(214,30%,93%)] flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-primary" />
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
                    <div className="bg-[hsl(214,30%,96%)] p-3 rounded-lg">
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

        {/* ─── 5. LABS ─── */}
        {treatmentPlans && treatmentPlans.length > 0 && (
          <div 
            className="bg-card rounded-2xl shadow-sm border border-[hsl(214,30%,93%)] p-5 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate('/labs')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Beaker className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Exames Laboratoriais</p>
                  <p className="text-xs text-muted-foreground">Ver histórico e tendências</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>
        )}

        {/* ─── 5. HEALTH MONITORING ─── */}
        <div 
          className="bg-card rounded-2xl shadow-sm border border-[hsl(214,30%,93%)] p-5 cursor-pointer hover:shadow-md transition-shadow"
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
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>

        {/* Pending Invites */}
        <PendingInvitesNotification />

        {/* ─── 6. EMERGENCY ─── */}
        <div className="bg-[hsl(0,60%,97%)] rounded-2xl border border-[hsl(0,50%,85%)] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-destructive text-base flex items-center gap-3">
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
          <p className="text-sm text-[hsl(0,30%,40%)] mb-3">
            Febre &gt; 38°C ou sintomas graves? Entre em contato imediatamente
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            {profile?.emergency_contact_name || 'Maria Silva'} - {profile?.emergency_contact_phone || '(11) 88888-8888'}
          </p>
          <Button 
            variant="destructive"
            className="rounded-full px-6 shadow-sm font-semibold"
            size="lg"
            asChild
          >
            <a href={`tel:${profile?.emergency_contact_phone || '(11) 88888-8888'}`}>Ligar Agora</a>
          </Button>
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-muted-foreground text-center px-4 pb-4">
          Este aplicativo auxilia no acompanhamento do tratamento e não substitui orientação médica profissional.
        </p>
      </div>
    </div>
  );
};

export default Home;
