import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRound, Stethoscope, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const ChooseRole = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, setUserRole } = useAuth();

  const handleChoosePatient = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // INSERT com ON CONFLICT DO NOTHING (idempotência)
      const { error } = await supabase
        .from('user_roles')
        .upsert(
          { user_id: user.id, role: 'patient' as const },
          { onConflict: 'user_id,role', ignoreDuplicates: true }
        );

      if (error) throw error;
      
      // Atualizar estado local
      setUserRole('patient');
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Error setting patient role:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar sua escolha. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChooseDoctor = () => {
    toast({
      title: "Cadastro Profissional",
      description: "Você precisará concluir o cadastro com seus dados (CRM, especialidade) para acessar pacientes."
    });
    navigate('/doctor/register');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            Como você deseja usar o OncoTrack?
          </h1>
          <p className="text-muted-foreground">
            Escolha seu perfil para personalizar sua experiência
          </p>
        </div>

        {/* Role Options */}
        <div className="space-y-4">
          {/* Patient Option */}
          <Card 
            className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50 border-2"
            onClick={handleChoosePatient}
          >
            <CardContent className="p-6">
              <Button
                variant="ghost"
                className="w-full h-auto flex-col items-start gap-3 p-0 hover:bg-transparent"
                disabled={loading}
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="p-3 rounded-full bg-primary/10">
                    <UserRound className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-left flex-1">
                    <h3 className="font-semibold text-lg text-foreground">Sou Paciente</h3>
                    <p className="text-sm text-muted-foreground">
                      Acompanhar meu tratamento
                    </p>
                  </div>
                  {loading && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
                </div>
              </Button>
            </CardContent>
          </Card>

          {/* Doctor Option */}
          <Card 
            className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50 border-2"
            onClick={handleChooseDoctor}
          >
            <CardContent className="p-6">
              <Button
                variant="ghost"
                className="w-full h-auto flex-col items-start gap-3 p-0 hover:bg-transparent"
                disabled={loading}
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="p-3 rounded-full bg-primary/10">
                    <Stethoscope className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-left flex-1">
                    <h3 className="font-semibold text-lg text-foreground">Sou Profissional de Saúde</h3>
                    <p className="text-sm text-muted-foreground">
                      Acompanhar meus pacientes
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      (requer cadastro completo)
                    </p>
                  </div>
                </div>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Footer Note */}
        <p className="text-xs text-center text-muted-foreground">
          Você poderá alterar seu perfil posteriormente nas configurações
        </p>
      </div>
    </div>
  );
};

export default ChooseRole;
