import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, QrCode, Plus, Share2, Pill, Calendar, AlertTriangle, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ReminderManager } from "@/components/ReminderManager";
import { FeelingLogger } from "@/components/FeelingLogger";
import { useAuth } from "@/hooks/useAuth";

const Home = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const [showReminderManager, setShowReminderManager] = useState(false);
  const [nextReminders, setNextReminders] = useState([
    { id: '1', medication: "Oxaliplatina", time: "14:00", type: "IV", cycle: "Ciclo 3 - FOLFOX", urgent: true },
    { id: '2', medication: "5-Fluoruracil", time: "21:30", type: "Oral", cycle: "Ciclo 3 - FOLFOX", urgent: false },
  ]);

  const [quickStats, setQuickStats] = useState({
    adherence: 95,
    nextAppointment: "2025-01-15",
    currentCycle: "3 de 12",
  });

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      if (!user) return;
      
      // Calculate real adherence based on user events
      const { data: events } = await supabase
        .from('user_events')
        .select('*')
        .eq('user_id', user.id)
        .eq('event_type', 'medication')
        .gte('event_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      const adherenceRate = events && events.length > 0 ? Math.round((events.length / 30) * 100) : 95;
      
      setQuickStats(prev => ({
        ...prev,
        adherence: adherenceRate
      }));
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-accent/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 pb-20">
      <div className="max-w-md mx-auto space-y-8">
        {/* Header */}
        <div className="text-center pt-12 pb-6">
          <div className="luxury-card p-8 space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full hero-gradient flex items-center justify-center mb-4 shadow-[var(--shadow-luxury)]">
              <Pill className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2 text-shadow">
              {getGreeting()}, {profile?.first_name || 'Maria'}
            </h1>
            <p className="text-muted-foreground text-lg">
              Como você está se sentindo hoje?
            </p>
          </div>
        </div>

        {/* Next Reminders */}
        <div className="luxury-card p-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-card-foreground text-shadow flex items-center gap-3">
              <Bell className="h-6 w-6 text-primary" />
              Próximos Lembretes
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowReminderManager(!showReminderManager)}
            >
              {showReminderManager ? 'Fechar' : 'Editar'}
            </Button>
          </div>
          <div className="space-y-4">
            {nextReminders.map((reminder) => (
              <div key={reminder.id} className={`glass-effect p-4 rounded-xl border relative overflow-hidden ${reminder.urgent ? 'border-primary/30' : 'border-accent/30'}`}>
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
                  reminders={nextReminders}
                  onUpdate={(updatedReminders) => {
                    setNextReminders(updatedReminders);
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="luxury-card p-6 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-success/5 to-success/10"></div>
            <div className="relative">
              <div className="text-3xl font-bold text-success mb-1 text-shadow">{quickStats.adherence}%</div>
              <div className="text-xs text-muted-foreground font-medium">Adesão</div>
            </div>
          </div>
          <div className="luxury-card p-6 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary-glow/10"></div>
            <div className="relative">
              <div className="text-lg font-bold text-primary mb-1 text-shadow">{quickStats.currentCycle}</div>
              <div className="text-xs text-muted-foreground font-medium">Ciclos</div>
            </div>
          </div>
          <div className="luxury-card p-6 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-secondary-accent/10"></div>
            <div className="relative">
              <div className="text-lg font-bold text-secondary-accent mb-1 text-shadow">15 Jan</div>
              <div className="text-xs text-muted-foreground font-medium">Consulta</div>
            </div>
          </div>
        </div>

        {/* Main Actions */}
        <div className="grid grid-cols-2 gap-6">
          <Button 
            variant="outline" 
            size="lg" 
            className="h-24 flex-col gap-3 group glass-effect border-primary/30 hover:bg-primary/10"
            onClick={() => navigate('/scanner')}
          >
            <QrCode className="h-8 w-8 transition-transform group-hover:scale-110 text-primary" />
            <span className="text-base font-bold">Escanear QR</span>
          </Button>
          <Button 
            variant="outline" 
            size="lg" 
            className="h-24 flex-col gap-3 group glass-effect border-secondary/30 hover:bg-secondary/10"
            onClick={() => navigate('/events')}
          >
            <Plus className="h-8 w-8 transition-transform group-hover:scale-110 text-secondary-accent" />
            <span className="text-base font-bold">Registrar</span>
          </Button>
          <Button 
            variant="outline" 
            size="lg" 
            className="h-24 flex-col gap-3 group glass-effect border-accent/30 hover:bg-accent/10"
            onClick={() => navigate('/timeline')}
          >
            <Clock className="h-8 w-8 transition-transform group-hover:scale-110 text-accent-foreground" />
            <span className="text-base font-bold">Timeline</span>
          </Button>
          <Button 
            variant="outline" 
            size="lg" 
            className="h-24 flex-col gap-3 group glass-effect"
            onClick={() => navigate('/share')}
          >
            <Share2 className="h-8 w-8 transition-transform group-hover:scale-110" />
            <span className="text-base font-bold">Compartilhar</span>
          </Button>
        </div>

        {/* Quick Health Check */}
        <div className="luxury-card p-6">
          <h3 className="font-bold text-card-foreground mb-6 text-xl text-shadow">Como você está hoje?</h3>
          <FeelingLogger />
          <p className="text-sm text-muted-foreground text-center font-medium">
            1 = Muito mal | 5 = Excelente
          </p>
        </div>

        {/* Emergency Alert */}
        <div className="luxury-card bg-destructive/5 border-2 border-destructive/20 p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-destructive/5 to-destructive/10"></div>
          <div className="relative flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-destructive text-lg mb-2">Emergência 24h</h3>
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