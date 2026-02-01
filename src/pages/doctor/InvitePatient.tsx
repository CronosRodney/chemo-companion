import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useDoctorAuth } from '@/hooks/useDoctorAuth';
import { 
  UserPlus, 
  Mail, 
  Check,
  MessageCircle,
  ArrowLeft,
  Send,
  Bell,
  CheckCircle2
} from 'lucide-react';
import DoctorNavigation from '@/components/doctor/DoctorNavigation';

const InvitePatient = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, doctorProfile } = useDoctorAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');
  const [inviteCode, setInviteCode] = useState<string | null>(null);

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !user) {
      toast({
        title: "Email obrigatório",
        description: "Por favor, informe o email do paciente",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('connection_invites')
        .insert({
          doctor_user_id: user.id,
          patient_email: email
        })
        .select()
        .single();

      if (error) throw error;

      // Store for optional sharing
      setInviteCode(data.invite_code);
      setSentEmail(email);
      setRequestSent(true);
      
      toast({
        title: "Solicitação enviada!",
        description: "O paciente receberá a notificação no app"
      });
    } catch (error: any) {
      console.error('Error creating invite:', error);
      toast({
        title: "Erro ao enviar solicitação",
        description: error.message || "Tente novamente",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const shareViaWhatsApp = () => {
    if (!inviteCode || !doctorProfile) return;
    
    const link = `${window.location.origin}/accept-invite/${inviteCode}`;
    const message = `Olá! Sou Dr. ${doctorProfile.first_name} ${doctorProfile.last_name}. Enviei uma solicitação para acompanhar seu tratamento no OncoTrack. Abra o app para aceitar: ${link}`;
    
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const resetForm = () => {
    setEmail('');
    setRequestSent(false);
    setSentEmail('');
    setInviteCode(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pb-24">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="max-w-lg mx-auto p-4">
          <Button variant="ghost" onClick={() => navigate('/doctor')} className="mb-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-xl font-bold">Solicitar Acesso</h1>
          <p className="text-sm text-muted-foreground">
            Envie uma solicitação para conectar com seu paciente
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto p-4">
        {!requestSent ? (
          <Card>
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                <UserPlus className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-center">Nova Solicitação</CardTitle>
              <CardDescription className="text-center">
                Informe o email do paciente para solicitar acesso ao tratamento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateInvite} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email do Paciente</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="paciente@email.com"
                      className="pl-9"
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    'Enviando...'
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Solicitar Acesso
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-2">
                <Check className="h-8 w-8 text-green-500" />
              </div>
              <CardTitle className="text-center">Solicitação Enviada!</CardTitle>
              <CardDescription className="text-center">
                O paciente receberá uma notificação no app OncoTrack
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Email confirmation */}
              <div className="p-4 bg-muted rounded-lg text-center">
                <p className="text-sm text-muted-foreground mb-1">Solicitação enviada para:</p>
                <p className="font-medium">{sentEmail}</p>
              </div>

              {/* Next steps */}
              <div className="space-y-3 p-4 bg-secondary/30 rounded-lg">
                <p className="font-medium text-sm">Próximos passos:</p>
                <div className="flex gap-3 text-sm">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-primary">1</span>
                  </div>
                  <p className="text-muted-foreground">Paciente abre o app OncoTrack</p>
                </div>
                <div className="flex gap-3 text-sm">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-primary">2</span>
                  </div>
                  <p className="text-muted-foreground">Vê a notificação na tela inicial</p>
                </div>
                <div className="flex gap-3 text-sm">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-primary">3</span>
                  </div>
                  <p className="text-muted-foreground">Aceita ou recusa a conexão</p>
                </div>
              </div>

              {/* Optional: WhatsApp sharing */}
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground text-center mb-3">
                  Opcional: avise o paciente por WhatsApp
                </p>
                <Button 
                  variant="outline" 
                  onClick={shareViaWhatsApp}
                  className="w-full flex items-center gap-2"
                >
                  <MessageCircle className="h-4 w-4" />
                  Enviar lembrete por WhatsApp
                </Button>
              </div>

              {/* New request button */}
              <Button variant="link" onClick={resetForm} className="w-full">
                Enviar outra solicitação
              </Button>
            </CardContent>
          </Card>
        )}

        {/* How it works - Updated */}
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base">Como funciona?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Send className="h-3 w-3 text-primary" />
              </div>
              <p>Você solicita acesso informando o email do paciente</p>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Bell className="h-3 w-3 text-primary" />
              </div>
              <p>Paciente vê a notificação ao abrir o app</p>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="h-3 w-3 text-primary" />
              </div>
              <p>Paciente aceita ou recusa <strong>conscientemente</strong></p>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <UserPlus className="h-3 w-3 text-primary" />
              </div>
              <p>Após aceite, você visualiza os dados de tratamento</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <DoctorNavigation />
    </div>
  );
};

export default InvitePatient;
