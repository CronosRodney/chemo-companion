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
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20 pb-20">
      <div className="mx-auto max-w-md px-4 pt-8 space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">
            {getGreeting()}, {profile?.first_name || 'Usuário'}!
          </h1>
        </div>

        {/* Próximos Lembretes */}
        <Card className="luxury-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Próximos Lembretes
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowReminderManager(!showReminderManager)}
              >
                {showReminderManager ? <Plus className="h-4 w-4 mr-2" /> : null}
                {showReminderManager ? 'Adicionar' : 'Editar'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {nextReminders.map((reminder) => (
              <div key={reminder.id} className="flex items-center justify-between p-3 rounded-lg bg-accent/20 border border-accent/30">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${reminder.urgent ? 'bg-destructive/20 text-destructive' : 'bg-primary/20 text-primary'}`}>
                    <Pill className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{reminder.medication}</p>
                    <p className="text-xs text-muted-foreground">{reminder.cycle}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">{reminder.time}</p>
                  <Badge variant={reminder.urgent ? "destructive" : "secondary"} className="text-xs">
                    {reminder.type}
                  </Badge>
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
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/20 border-primary/30">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary mb-1">
                {quickStats.adherence}%
              </div>
              <p className="text-xs text-muted-foreground">Adesão</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-secondary/10 to-secondary/20 border-secondary/30">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-secondary mb-1">
                {quickStats.currentCycle}
              </div>
              <p className="text-xs text-muted-foreground">Ciclos</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-accent/10 to-accent/20 border-accent/30">
            <CardContent className="p-4 text-center">
              <div className="text-sm font-bold text-accent mb-1">
                15 Jan
              </div>
              <p className="text-xs text-muted-foreground">Próxima consulta</p>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <Button 
            variant="outline" 
            size="lg" 
            className="h-auto p-4 flex-col gap-2"
            onClick={() => navigate('/scanner')}
          >
            <QrCode className="h-6 w-6" />
            <span className="text-sm">Scanner QR</span>
          </Button>
          
          <Button 
            variant="outline" 
            size="lg" 
            className="h-auto p-4 flex-col gap-2"
            onClick={() => navigate('/events')}
          >
            <Plus className="h-6 w-6" />
            <span className="text-sm">Registrar Evento</span>
          </Button>
          
          <Button 
            variant="outline" 
            size="lg" 
            className="h-auto p-4 flex-col gap-2"
            onClick={() => navigate('/timeline')}
          >
            <Calendar className="h-6 w-6" />
            <span className="text-sm">Ver Timeline</span>
          </Button>
          
          <Button 
            variant="outline" 
            size="lg" 
            className="h-auto p-4 flex-col gap-2"
            onClick={() => navigate('/share')}
          >
            <Share2 className="h-6 w-6" />
            <span className="text-sm">Compartilhar</span>
          </Button>
        </div>

        {/* How are you feeling today */}
        <FeelingLogger />

        {/* Emergency Contact */}
        <Card className="border-destructive/30 bg-destructive/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-destructive/20">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">Contato de Emergência</p>
                <p className="text-xs text-muted-foreground">
                  {profile?.emergency_contact_name || 'Maria Silva'} - {profile?.emergency_contact_phone || '(11) 88888-8888'}
                </p>
              </div>
              <Button variant="destructive" size="icon">
                <Clock className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Home;