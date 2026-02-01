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
  Copy, 
  Check,
  Share2,
  ArrowLeft
} from 'lucide-react';
import DoctorNavigation from '@/components/doctor/DoctorNavigation';

const InvitePatient = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, doctorProfile } = useDoctorAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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

      setInviteCode(data.invite_code);
      
      toast({
        title: "Convite criado!",
        description: "Compartilhe o código com seu paciente"
      });
    } catch (error: any) {
      console.error('Error creating invite:', error);
      toast({
        title: "Erro ao criar convite",
        description: error.message || "Tente novamente",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const copyInviteLink = async () => {
    if (!inviteCode) return;
    
    const link = `${window.location.origin}/accept-invite/${inviteCode}`;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    
    toast({
      title: "Link copiado!",
      description: "Cole o link e envie para seu paciente"
    });
    
    setTimeout(() => setCopied(false), 2000);
  };

  const shareInvite = async () => {
    if (!inviteCode || !doctorProfile) return;
    
    const link = `${window.location.origin}/accept-invite/${inviteCode}`;
    const message = `Dr. ${doctorProfile.first_name} ${doctorProfile.last_name} está convidando você para acompanhar seu tratamento no OncoTrack. Acesse: ${link}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Convite OncoTrack',
          text: message,
          url: link
        });
      } catch (err) {
        // User cancelled share
      }
    } else {
      copyInviteLink();
    }
  };

  const resetForm = () => {
    setEmail('');
    setInviteCode(null);
    setCopied(false);
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
          <h1 className="text-xl font-bold">Convidar Paciente</h1>
          <p className="text-sm text-muted-foreground">
            Crie um convite para conectar com seu paciente
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto p-4">
        {!inviteCode ? (
          <Card>
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                <UserPlus className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-center">Novo Convite</CardTitle>
              <CardDescription className="text-center">
                Informe o email do paciente para criar um convite de conexão
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
                  {loading ? 'Criando...' : 'Criar Convite'}
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
              <CardTitle className="text-center">Convite Criado!</CardTitle>
              <CardDescription className="text-center">
                Compartilhe o link abaixo com seu paciente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Código do convite:</p>
                <p className="font-mono font-bold text-lg break-all">{inviteCode}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  onClick={copyInviteLink}
                  className="flex items-center gap-2"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copiado!' : 'Copiar Link'}
                </Button>
                <Button 
                  onClick={shareInvite}
                  className="flex items-center gap-2"
                >
                  <Share2 className="h-4 w-4" />
                  Compartilhar
                </Button>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-3">
                  O convite expira em 7 dias. Após o paciente aceitar, você poderá visualizar os dados de tratamento dele.
                </p>
                <Button variant="link" onClick={resetForm} className="w-full">
                  Criar outro convite
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base">Como funciona?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-primary">1</span>
              </div>
              <p>Você cria um convite com o email do paciente</p>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-primary">2</span>
              </div>
              <p>Compartilhe o link do convite com o paciente</p>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-primary">3</span>
              </div>
              <p>O paciente aceita o convite no app dele</p>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-primary">4</span>
              </div>
              <p>Você passa a visualizar os dados de tratamento</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <DoctorNavigation />
    </div>
  );
};

export default InvitePatient;
