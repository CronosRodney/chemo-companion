import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, QrCode, Plus, Share2, Pill, Calendar, AlertCircle } from "lucide-react";

const Home = () => {
  const nextReminders = [
    { id: 1, medication: "Oxaliplatina", time: "20:00", type: "IV", cycle: "Ciclo 3 - FOLFOX" },
    { id: 2, medication: "5-Fluoruracil", time: "21:30", type: "Oral", cycle: "Ciclo 3 - FOLFOX" },
  ];

  const quickStats = {
    adherence: 95,
    nextAppointment: "2025-01-15",
    currentCycle: "3 de 12",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20 p-4">
      <div className="mx-auto max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2 pt-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
              <Pill className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">OncoTrack</h1>
          </div>
          <p className="text-muted-foreground">Acompanhe seu tratamento com segurança</p>
        </div>

        {/* Next Reminders */}
        <Card className="shadow-lg border-0 bg-gradient-to-r from-card to-accent/10">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bell className="h-5 w-5 text-primary" />
              Próximos Lembretes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {nextReminders.map((reminder) => (
              <div key={reminder.id} className="flex items-center justify-between p-3 bg-background/60 rounded-lg border">
                <div className="space-y-1">
                  <p className="font-medium text-sm">{reminder.medication}</p>
                  <p className="text-xs text-muted-foreground">{reminder.cycle}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-primary">{reminder.time}</p>
                  <p className="text-xs text-muted-foreground">{reminder.type}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="text-center p-4 shadow-md border-0 bg-success/10">
            <p className="text-2xl font-bold text-success">{quickStats.adherence}%</p>
            <p className="text-xs text-muted-foreground">Adesão</p>
          </Card>
          <Card className="text-center p-4 shadow-md border-0 bg-primary/10">
            <p className="text-sm font-semibold text-primary">{quickStats.currentCycle}</p>
            <p className="text-xs text-muted-foreground">Ciclos</p>
          </Card>
          <Card className="text-center p-4 shadow-md border-0 bg-secondary/20">
            <p className="text-sm font-semibold text-secondary-accent">15 Jan</p>
            <p className="text-xs text-muted-foreground">Consulta</p>
          </Card>
        </div>

        {/* Main Actions */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Button variant="medical" size="lg" className="flex-col h-20 gap-2">
              <QrCode className="h-6 w-6" />
              <span className="text-sm">Escanear QR</span>
            </Button>
            <Button variant="hero" size="lg" className="flex-col h-20 gap-2">
              <Plus className="h-6 w-6" />
              <span className="text-sm">Registrar</span>
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" size="lg" className="flex-col h-20 gap-2">
              <Calendar className="h-6 w-6" />
              <span className="text-sm">Timeline</span>
            </Button>
            <Button variant="secondary" size="lg" className="flex-col h-20 gap-2">
              <Share2 className="h-6 w-6" />
              <span className="text-sm">Compartilhar</span>
            </Button>
          </div>
        </div>

        {/* Emergency Banner */}
        <Card className="bg-warning/10 border-warning/30 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-warning" />
              <div className="flex-1">
                <p className="text-sm font-medium">Emergência Oncológica</p>
                <p className="text-xs text-muted-foreground">
                  Febre {'>'} 38°C ou sintomas graves? Contate sua equipe 24h
                </p>
              </div>
              <Button variant="warning" size="sm">
                Ligar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Health Check */}
        <Card className="shadow-md border-0">
          <CardContent className="p-4">
            <div className="text-center space-y-3">
              <p className="font-medium">Como você está hoje?</p>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((level) => (
                  <button
                    key={level}
                    className="w-10 h-10 rounded-full border-2 border-muted hover:border-primary transition-colors flex items-center justify-center text-sm font-medium"
                  >
                    {level}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">1 = Muito mal | 5 = Muito bem</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Home;