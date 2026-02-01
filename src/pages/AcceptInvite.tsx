import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  UserCheck, 
  Stethoscope,
  Check,
  X,
  Loader2
} from 'lucide-react';

const AcceptInvite = () => {
  const { inviteCode } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  
  const [invite, setInvite] = useState<any>(null);
  const [doctorProfile, setDoctorProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState<'loading' | 'valid' | 'invalid' | 'expired' | 'accepted'>('loading');

  useEffect(() => {
    if (inviteCode) {
      loadInvite();
    }
  }, [inviteCode]);

  const loadInvite = async () => {
    try {
      setLoading(true);

      // Get invite
      const { data: inviteData, error: inviteError } = await supabase
        .from('connection_invites')
        .select('*')
        .eq('invite_code', inviteCode)
        .single();

      if (inviteError || !inviteData) {
        setStatus('invalid');
        return;
      }

      // Check if expired
      if (new Date(inviteData.expires_at) < new Date()) {
        setStatus('expired');
        return;
      }

      // Check if already accepted
      if (inviteData.status === 'accepted') {
        setStatus('accepted');
        return;
      }

      setInvite(inviteData);

      // Get doctor profile
      const { data: doctorData, error: doctorError } = await supabase
        .from('healthcare_professionals')
        .select('first_name, last_name, specialty, crm, crm_uf')
        .eq('user_id', inviteData.doctor_user_id)
        .single();

      if (!doctorError && doctorData) {
        setDoctorProfile(doctorData);
      }

      setStatus('valid');
    } catch (error) {
      console.error('Error loading invite:', error);
      setStatus('invalid');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!user || !invite) {
      toast({
        title: "Login necessário",
        description: "Faça login para aceitar o convite",
        variant: "destructive"
      });
      navigate('/auth');
      return;
    }

    try {
      setProcessing(true);

      // Create connection
      const { error: connError } = await supabase
        .from('patient_doctor_connections')
        .insert({
          patient_user_id: user.id,
          doctor_user_id: invite.doctor_user_id,
          status: 'active',
          connected_at: new Date().toISOString()
        });

      if (connError) throw connError;

      // Update invite status
      await supabase
        .from('connection_invites')
        .update({ status: 'accepted' })
        .eq('id', invite.id);

      toast({
        title: "Conexão estabelecida!",
        description: `Você agora está conectado com Dr. ${doctorProfile?.first_name || 'seu médico'}`
      });

      navigate('/');
    } catch (error: any) {
      console.error('Error accepting invite:', error);
      toast({
        title: "Erro ao aceitar convite",
        description: error.message || "Tente novamente",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleDecline = async () => {
    if (!invite) {
      navigate('/');
      return;
    }

    try {
      setProcessing(true);

      // Update invite status to rejected
      await supabase
        .from('connection_invites')
        .update({ status: 'rejected' })
        .eq('id', invite.id);

      // If user is logged in, create a rejected connection record
      if (user) {
        await supabase
          .from('patient_doctor_connections')
          .insert({
            patient_user_id: user.id,
            doctor_user_id: invite.doctor_user_id,
            status: 'rejected',
            connected_at: null
          });
      }

      toast({
        title: "Solicitação recusada",
        description: "O médico não terá acesso aos seus dados"
      });

      navigate('/');
    } catch (error: any) {
      console.error('Error rejecting invite:', error);
      toast({
        title: "Erro ao recusar",
        description: "Tente novamente",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        {status === 'invalid' && (
          <>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                <X className="h-8 w-8 text-destructive" />
              </div>
              <CardTitle>Convite Inválido</CardTitle>
              <CardDescription>
                Este link de convite não é válido ou foi cancelado.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/')} className="w-full">
                Voltar ao Início
              </Button>
            </CardContent>
          </>
        )}

        {status === 'expired' && (
          <>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mb-4">
                <X className="h-8 w-8 text-amber-500" />
              </div>
              <CardTitle>Convite Expirado</CardTitle>
              <CardDescription>
                Este convite expirou. Peça ao seu médico para enviar um novo convite.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/')} className="w-full">
                Voltar ao Início
              </Button>
            </CardContent>
          </>
        )}

        {status === 'accepted' && (
          <>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
                <Check className="h-8 w-8 text-green-500" />
              </div>
              <CardTitle>Convite Já Aceito</CardTitle>
              <CardDescription>
                Este convite já foi aceito anteriormente.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/')} className="w-full">
                Voltar ao Início
              </Button>
            </CardContent>
          </>
        )}

        {status === 'valid' && (
          <>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Stethoscope className="h-8 w-8 text-primary" />
              </div>
              <CardTitle>Convite de Conexão</CardTitle>
              <CardDescription>
                Você recebeu um convite para conectar com seu médico
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {doctorProfile && (
                <div className="p-4 bg-muted rounded-lg text-center">
                  <p className="font-semibold text-lg">
                    Dr. {doctorProfile.first_name} {doctorProfile.last_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {doctorProfile.specialty}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    CRM {doctorProfile.crm}/{doctorProfile.crm_uf}
                  </p>
                </div>
              )}

              <div className="space-y-3 text-sm text-muted-foreground">
                <p>Ao aceitar, você permite que o médico:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Visualize seus dados de tratamento</li>
                  <li>Acompanhe seu progresso de saúde</li>
                  <li>Receba alertas sobre sua condição</li>
                  <li>Adicione notas e observações</li>
                </ul>
              </div>

              {!user && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    Você precisa fazer login para aceitar o convite
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  onClick={handleDecline}
                  disabled={processing}
                >
                  Recusar
                </Button>
                <Button 
                  onClick={user ? handleAccept : () => navigate('/auth')}
                  disabled={processing}
                >
                  {processing ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <UserCheck className="h-4 w-4 mr-2" />
                  )}
                  {user ? 'Aceitar' : 'Fazer Login'}
                </Button>
              </div>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
};

export default AcceptInvite;
