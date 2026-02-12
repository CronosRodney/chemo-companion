import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Pill, AlertTriangle, Building2, MapPin, Beaker, Activity, Stethoscope, User, ChevronRight } from "lucide-react";
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
import { OncoInsights } from "@/components/OncoInsights";

const getMonthlyTheme = () => {
  const month = new Date().getMonth();
  const themes: Record<number, { accentColor: string; gradient: string }> = {
    0: { accentColor: '#CBD5E1', gradient: 'rgba(203,213,225,0.08)' },
    1: { accentColor: '#7C3AED', gradient: 'rgba(124,58,237,0.08)' },
    2: { accentColor: '#0072CE', gradient: 'rgba(0,114,206,0.08)' },
    3: { accentColor: '#F97316', gradient: 'rgba(249,115,22,0.08)' },
    4: { accentColor: '#FACC15', gradient: 'rgba(250,204,21,0.08)' },
    5: { accentColor: '#DC2626', gradient: 'rgba(220,38,38,0.07)' },
    6: { accentColor: '#F59E0B', gradient: 'rgba(245,158,11,0.07)' },
    7: { accentColor: '#3B82F6', gradient: 'rgba(59,130,246,0.06)' },
    8: { accentColor: '#16A34A', gradient: 'rgba(22,163,74,0.07)' },
    9: { accentColor: '#EC4899', gradient: 'rgba(236,72,153,0.08)' },
    10: { accentColor: '#1D4ED8', gradient: 'rgba(29,78,216,0.08)' },
    11: { accentColor: '#EA580C', gradient: 'rgba(234,88,12,0.08)' },
  };
  return themes[month] || themes[7];
};

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
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024);
    check();
    const mql = window.matchMedia('(min-width: 1024px)');
    mql.addEventListener('change', check);
    return () => mql.removeEventListener('change', check);
  }, []);

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
      <div className="min-h-screen bg-background flex items-center justify-center">
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
      <div className="min-h-screen bg-background p-4 pb-20">
        <div className="max-w-md mx-auto space-y-6">
          <div className="text-center pt-8 pb-4 animate-fade-in-up">
            <div className="bg-card rounded-2xl shadow-sm border border-border p-10 space-y-5">
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
            className="bg-card rounded-2xl shadow-sm border border-border p-8 cursor-pointer hover:shadow-md transition-shadow card-press animate-fade-in-up delay-100"
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
  const monthlyTheme = getMonthlyTheme();
  

  // Shared sections as variables for reuse
  const headerSection = (
    <div className={`${isDesktop ? 'rounded-2xl shadow-sm border border-primary/10 relative' : '-mx-4 rounded-b-[2rem] bg-gradient-to-br from-primary/8 to-primary/3'} px-6 pt-6 pb-8`} style={isDesktop ? { background: `linear-gradient(135deg, ${monthlyTheme.gradient}, rgba(59,130,246,0.04))` } : undefined} >
      <div className={`${isDesktop ? 'max-w-3xl mx-auto' : 'max-w-3xl mx-auto'}`}>
        {/* Desktop: avatar top-right corner, centered text */}
        {isDesktop ? (
          <>
            <div className="absolute top-4 right-4">
              <div className="w-18 h-18 rounded-full border-2 border-border shadow-sm bg-muted flex items-center justify-center overflow-hidden cursor-pointer" style={{ width: 72, height: 72 }} onClick={() => navigate('/profile')}>
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-semibold text-foreground">
                {getGreeting()}, {profile?.first_name || 'Maria'}
              </h1>
              {activePlan ? (
                <p className="text-base text-muted-foreground mt-2">
                  Tratamento {activePlan.regimen_name} · Ciclo {completedCycles + 1} de {totalCycles}
                </p>
              ) : (
                <p className="text-base text-muted-foreground mt-2">
                  Como você está se sentindo hoje?
                </p>
              )}
            </div>
            <div className="mt-8">
              <p className="text-sm text-muted-foreground mb-4 font-medium text-center">Como você está hoje?</p>
              <FeelingLogger onFeelingLogged={handleFeelingLogged} isDesktop />
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h1 className="text-2xl font-semibold text-foreground">
                  {getGreeting()}, {profile?.first_name || 'Maria'}
                </h1>
                {activePlan ? (
                  <p className="text-sm text-muted-foreground mt-1">
                    Tratamento {activePlan.regimen_name} · Ciclo {completedCycles + 1} de {totalCycles}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">
                    Como você está se sentindo hoje?
                  </p>
                )}
              </div>
              <div className="w-14 h-14 rounded-full border-2 border-border shadow-sm bg-muted flex items-center justify-center flex-shrink-0 ml-4 overflow-hidden cursor-pointer" onClick={() => navigate('/profile')}>
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
            </div>
            <div className="mt-5">
              <p className="text-xs text-muted-foreground mb-2.5 font-medium">Como você está hoje?</p>
              <FeelingLogger onFeelingLogged={handleFeelingLogged} />
            </div>
          </>
        )}
      </div>
    </div>
  );

  const treatmentSection = (
    <div className="animate-fade-in-up">
      <TreatmentProgressWidget treatmentPlans={treatmentPlans || []} adherence={stats.adherence} />
    </div>
  );

  const aiSection = activePlan ? (
    <OncoInsights
      protocol={activePlan.regimen_name}
      cycleCurrent={completedCycles + 1}
      totalCycles={totalCycles}
      adherence={stats.adherence}
    />
  ) : null;

  const remindersSection = (
    <div className={`bg-card rounded-2xl shadow-sm border border-border ${isDesktop ? 'p-8' : 'p-6'} space-y-4 animate-fade-in-up delay-200`}>
      <div className="flex items-center justify-between mb-1">
        <h2 className={`${isDesktop ? 'text-lg' : 'text-base'} font-semibold text-foreground flex items-center gap-3`}>
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
            <Bell className="h-4 w-4 text-primary" />
          </div>
          Próximos Lembretes
        </h2>
        <Button variant="outline" size="sm" className="text-xs border-primary/20 text-primary hover:bg-primary/5" onClick={() => setShowReminderManager(!showReminderManager)}>
          {showReminderManager ? 'Fechar' : 'Editar'}
        </Button>
      </div>
      <div className="space-y-3">
        {displayedReminders.map((reminder) => (
          <div key={reminder.id} className={`p-4 rounded-xl border ${reminder.urgent ? 'border-amber-200 bg-amber-50' : 'border-border bg-muted/30'}`}>
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${reminder.urgent ? 'bg-amber-100' : 'bg-muted'}`}>
                <Pill className={`h-5 w-5 ${reminder.urgent ? 'text-amber-700' : 'text-muted-foreground'}`} />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-foreground">{reminder.medication}</p>
                <p className="text-xs text-muted-foreground">{reminder.cycle}</p>
              </div>
              <div className="text-right">
                <p className={`font-bold text-base ${reminder.urgent ? 'text-amber-700' : 'text-foreground'}`}>{reminder.time}</p>
                <Badge variant="outline" className={`text-xs ${reminder.urgent ? 'border-amber-200 text-amber-700 bg-amber-50' : ''}`}>
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
          <div className="pt-4 border-t border-border">
            <ReminderManager reminders={reminders} onUpdate={updateReminders} />
          </div>
        )}
      </div>
    </div>
  );

  const clinicSection = !clinicsLoading && clinics.length > 0 ? (
    <div className={`bg-card rounded-2xl shadow-sm border border-border ${isDesktop ? 'p-8' : 'p-6'} space-y-4 animate-fade-in-up delay-300`}>
      <div className="flex items-center justify-between">
        <h2 className={`${isDesktop ? 'text-lg' : 'text-base'} font-semibold text-foreground flex items-center gap-3`}>
          <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
            <Building2 className="h-4 w-4 text-primary" />
          </div>
          Clínica Conectada
        </h2>
        <Badge variant="outline" className="text-xs font-medium border-emerald-200 text-emerald-700 bg-emerald-50">● Ativa</Badge>
      </div>
      <div className="space-y-3">
        {clinics.slice(0, 1).map((clinic) => (
          <div key={clinic.id} className="p-4 rounded-xl border border-border bg-muted/30">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-foreground">{clinic.clinic_name}</p>
                {clinic.city && clinic.state && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />{clinic.city}, {clinic.state}
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
  ) : null;

  const labsSection = treatmentPlans && treatmentPlans.length > 0 ? (
    <div 
      className={`bg-card rounded-2xl shadow-sm border border-border ${isDesktop ? 'p-6' : 'p-5'} cursor-pointer hover:shadow-md transition-shadow card-press animate-fade-in-up delay-300`}
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
  ) : null;

  const healthSection = (
    <div 
      className={`bg-card rounded-2xl shadow-sm border border-border ${isDesktop ? 'p-6' : 'p-5'} cursor-pointer hover:shadow-md transition-shadow card-press animate-fade-in-up delay-400`}
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
  );

  const emergencySection = (
    <div className={`bg-destructive/5 rounded-2xl border border-destructive/20 ${isDesktop ? 'p-6' : 'p-6'} animate-fade-in-up delay-500`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-destructive text-base flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          Emergência 24h
        </h3>
        <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => navigate('/profile/edit')}>Editar</Button>
      </div>
      <p className="text-sm text-muted-foreground mb-3">Febre &gt; 38°C ou sintomas graves? Entre em contato imediatamente</p>
      <p className="text-sm text-muted-foreground mb-4">
        {profile?.emergency_contact_name || 'Maria Silva'} - {profile?.emergency_contact_phone || '(11) 88888-8888'}
      </p>
      <Button variant="destructive" className="rounded-full px-6 shadow-sm font-semibold" size="lg" asChild>
        <a href={`tel:${profile?.emergency_contact_phone || '(11) 88888-8888'}`}>Ligar Agora</a>
      </Button>
    </div>
  );

  // ─── DESKTOP LAYOUT (lg+) ───
  if (isDesktop) {
    return (
      <div className="min-h-screen" style={{ background: `linear-gradient(180deg, ${monthlyTheme.gradient} 0%, hsl(var(--background)) 40%)` }}>
        <div className="px-10 py-8 max-w-[1400px] mx-auto">
          {/* Header spanning full width */}
          {headerSection}

          {/* Two-column grid */}
          <div className="grid grid-cols-12 gap-8 mt-8">
            {/* Main column */}
            <div className="col-span-8 space-y-8">
              {treatmentSection}
              {aiSection}
              {remindersSection}
              {labsSection}
              {healthSection}
            </div>

            {/* Sidebar column */}
            <div className="col-span-4 space-y-6 lg:pl-2">
              {clinicSection}
              {emergencySection}
            </div>
          </div>

          <PendingInvitesNotification />

          <p className="text-xs text-muted-foreground text-center px-4 py-6">
            Este aplicativo auxilia no acompanhamento do tratamento e não substitui orientação médica profissional.
          </p>
        </div>
      </div>
    );
  }

  // ─── MOBILE / TABLET LAYOUT ───
  return (
    <div className="min-h-screen pb-20" style={{ background: `linear-gradient(180deg, ${monthlyTheme.gradient} 0%, hsl(var(--background)) 40%)` }}>
      <div className="max-w-3xl mx-auto space-y-6 px-4">
        {headerSection}
        {treatmentSection}
        {aiSection}
        {remindersSection}

        {/* Connected Clinics (tablet only, mobile hidden via isMobile check) */}
        {!isMobile && clinicSection}

        {labsSection}
        {healthSection}

        <PendingInvitesNotification />

        {emergencySection}

        <p className="text-xs text-muted-foreground text-center px-4 pb-4">
          Este aplicativo auxilia no acompanhamento do tratamento e não substitui orientação médica profissional.
        </p>
      </div>
    </div>
  );
};

export default Home;
