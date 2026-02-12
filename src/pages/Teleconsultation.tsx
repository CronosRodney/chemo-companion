import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft, 
  Video, 
  Calendar, 
  Clock, 
  User, 
  Plus, 
  ExternalLink,
  Phone,
  MessageSquare,
  Loader2
} from 'lucide-react';
import { format, addDays, isFuture } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface Consultation {
  id: string;
  doctor_name: string;
  specialty: string;
  scheduled_date: string;
  scheduled_time: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  meeting_link?: string;
  reason?: string;
  notes?: string;
}

export default function Teleconsultation() {
  const navigate = useNavigate();
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Mock consultations - in production, these would come from the database
  const [consultations, setConsultations] = useState<Consultation[]>([
    {
      id: '1',
      doctor_name: 'Dr. Carlos Silva',
      specialty: 'Oncologista',
      scheduled_date: format(addDays(new Date(), 3), 'yyyy-MM-dd'),
      scheduled_time: '14:00',
      status: 'scheduled',
      meeting_link: 'https://meet.google.com/abc-defg-hij',
      reason: 'Acompanhamento do tratamento'
    },
    {
      id: '2',
      doctor_name: 'Dra. Ana Oliveira',
      specialty: 'Nutricionista',
      scheduled_date: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
      scheduled_time: '10:30',
      status: 'scheduled',
      reason: 'Orientação nutricional durante quimioterapia'
    }
  ]);

  const [newConsultation, setNewConsultation] = useState({
    doctor_name: '',
    specialty: '',
    scheduled_date: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
    scheduled_time: '09:00',
    reason: '',
    meeting_link: ''
  });

  const handleCreateConsultation = async () => {
    if (!newConsultation.doctor_name || !newConsultation.scheduled_date) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const consultation: Consultation = {
        id: Date.now().toString(),
        ...newConsultation,
        status: 'scheduled'
      };

      setConsultations([consultation, ...consultations]);
      setShowNewDialog(false);
      setNewConsultation({
        doctor_name: '',
        specialty: '',
        scheduled_date: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
        scheduled_time: '09:00',
        reason: '',
        meeting_link: ''
      });

      toast.success('Consulta agendada com sucesso!');
    } catch (error) {
      toast.error('Erro ao agendar consulta');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinMeeting = (link: string) => {
    window.open(link, '_blank');
  };

  const upcomingConsultations = consultations.filter(c => 
    c.status === 'scheduled' && isFuture(new Date(`${c.scheduled_date}T${c.scheduled_time}`))
  );

  const pastConsultations = consultations.filter(c => 
    c.status === 'completed' || !isFuture(new Date(`${c.scheduled_date}T${c.scheduled_time}`))
  );

  return (
    <div className="min-h-screen bg-background p-4 pb-24">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Teleconsulta</h1>
              <p className="text-sm text-muted-foreground">
                Consultas virtuais com sua equipe médica
              </p>
            </div>
          </div>
          <Button onClick={() => setShowNewDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Consulta
          </Button>
        </div>

        {/* Upcoming Consultations */}
        <div className="space-y-4 mb-8">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Próximas Consultas
          </h2>

          {upcomingConsultations.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <Video className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Nenhuma consulta agendada</p>
                <Button 
                  variant="link" 
                  className="mt-2"
                  onClick={() => setShowNewDialog(true)}
                >
                  Agendar primeira consulta
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {upcomingConsultations.map((consultation) => (
                <Card key={consultation.id} className="border-primary/30">
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="h-4 w-4 text-primary" />
                          <span className="font-medium">{consultation.doctor_name}</span>
                          <Badge variant="outline">{consultation.specialty}</Badge>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(consultation.scheduled_date), "dd 'de' MMMM", { locale: ptBR })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {consultation.scheduled_time}
                          </span>
                        </div>

                        {consultation.reason && (
                          <p className="text-sm text-muted-foreground">
                            <MessageSquare className="h-3 w-3 inline mr-1" />
                            {consultation.reason}
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2">
                        {consultation.meeting_link ? (
                          <Button 
                            onClick={() => handleJoinMeeting(consultation.meeting_link!)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Video className="h-4 w-4 mr-2" />
                            Entrar
                          </Button>
                        ) : (
                          <Button variant="outline" disabled>
                            <Phone className="h-4 w-4 mr-2" />
                            Link pendente
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <Card className="cursor-pointer hover:border-primary/50 transition-colors">
            <CardContent className="pt-4 text-center">
              <Video className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="font-medium">Teste sua Câmera</p>
              <p className="text-xs text-muted-foreground">Verifique antes da consulta</p>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer hover:border-primary/50 transition-colors">
            <CardContent className="pt-4 text-center">
              <MessageSquare className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="font-medium">Dúvidas Frequentes</p>
              <p className="text-xs text-muted-foreground">Como funciona</p>
            </CardContent>
          </Card>
        </div>

        {/* Past Consultations */}
        {pastConsultations.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-muted-foreground">
              Histórico de Consultas
            </h2>
            <div className="space-y-2">
              {pastConsultations.map((consultation) => (
                <Card key={consultation.id} className="bg-muted/50">
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{consultation.doctor_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(consultation.scheduled_date), "dd/MM/yyyy")} às {consultation.scheduled_time}
                        </p>
                      </div>
                      <Badge variant="secondary">Concluída</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Info Card */}
        <Card className="mt-8 bg-primary/5 border-primary/20">
          <CardContent className="pt-4">
            <h3 className="font-medium mb-2">📋 Dicas para sua teleconsulta:</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Teste sua conexão de internet antes da consulta</li>
              <li>• Escolha um local silencioso e bem iluminado</li>
              <li>• Tenha seus exames e medicamentos à mão</li>
              <li>• Anote suas dúvidas antes da consulta</li>
              <li>• Entre 5 minutos antes do horário marcado</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* New Consultation Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agendar Nova Consulta</DialogTitle>
            <DialogDescription>
              Preencha os dados para agendar uma teleconsulta
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="doctor">Nome do Médico *</Label>
              <Input
                id="doctor"
                value={newConsultation.doctor_name}
                onChange={(e) => setNewConsultation({...newConsultation, doctor_name: e.target.value})}
                placeholder="Ex: Dr. João Silva"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialty">Especialidade</Label>
              <Input
                id="specialty"
                value={newConsultation.specialty}
                onChange={(e) => setNewConsultation({...newConsultation, specialty: e.target.value})}
                placeholder="Ex: Oncologista"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Data *</Label>
                <Input
                  id="date"
                  type="date"
                  value={newConsultation.scheduled_date}
                  onChange={(e) => setNewConsultation({...newConsultation, scheduled_date: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Hora *</Label>
                <Input
                  id="time"
                  type="time"
                  value={newConsultation.scheduled_time}
                  onChange={(e) => setNewConsultation({...newConsultation, scheduled_time: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="link">Link da Reunião</Label>
              <Input
                id="link"
                value={newConsultation.meeting_link}
                onChange={(e) => setNewConsultation({...newConsultation, meeting_link: e.target.value})}
                placeholder="https://meet.google.com/..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Motivo da Consulta</Label>
              <Textarea
                id="reason"
                value={newConsultation.reason}
                onChange={(e) => setNewConsultation({...newConsultation, reason: e.target.value})}
                placeholder="Descreva o motivo da consulta"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateConsultation} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Agendando...
                </>
              ) : (
                'Agendar Consulta'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
