import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  Stethoscope, 
  Check, 
  X, 
  Loader2,
  Shield
} from 'lucide-react';
import { usePendingInvites, PendingInvite } from '@/hooks/usePendingInvites';
import { useToast } from '@/hooks/use-toast';

export const PendingInvitesNotification = () => {
  const { invites, loading, acceptInvite, rejectInvite } = usePendingInvites();
  const { toast } = useToast();
  const [processingId, setProcessingId] = useState<string | null>(null);

  if (loading) {
    return null; // Don't show loading state to avoid UI jumping
  }

  if (invites.length === 0) {
    return null;
  }

  const handleAccept = async (invite: PendingInvite) => {
    setProcessingId(invite.id);
    const success = await acceptInvite(invite);
    setProcessingId(null);

    if (success) {
      toast({
        title: "Conexão estabelecida!",
        description: `Você está conectado com Dr. ${invite.doctor?.first_name || 'seu médico'}`
      });
    } else {
      toast({
        title: "Erro ao aceitar",
        description: "Tente novamente em alguns instantes",
        variant: "destructive"
      });
    }
  };

  const handleReject = async (invite: PendingInvite) => {
    setProcessingId(invite.id);
    const success = await rejectInvite(invite);
    setProcessingId(null);

    if (success) {
      toast({
        title: "Solicitação recusada",
        description: "O médico não terá acesso aos seus dados"
      });
    } else {
      toast({
        title: "Erro ao recusar",
        description: "Tente novamente em alguns instantes",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-3">
      {invites.map((invite) => (
        <Card 
          key={invite.id} 
          className="border-2 border-primary/30 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent" />
          
          <CardHeader className="relative pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <span>Solicitação de Acesso</span>
              <Badge variant="secondary" className="ml-auto">
                Pendente
              </Badge>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="relative space-y-4">
            {/* Doctor Info */}
            <div className="flex items-center gap-4 p-3 bg-background/50 rounded-lg">
              <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center">
                <Stethoscope className="h-6 w-6 text-secondary-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-base">
                  Dr. {invite.doctor?.first_name} {invite.doctor?.last_name}
                </p>
                {invite.doctor?.specialty && (
                  <p className="text-sm text-muted-foreground">
                    {invite.doctor.specialty}
                  </p>
                )}
                {invite.doctor?.crm && invite.doctor?.crm_uf && (
                  <p className="text-xs text-muted-foreground">
                    CRM {invite.doctor.crm}/{invite.doctor.crm_uf}
                  </p>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p>
                Deseja acompanhar seu tratamento. Ao aceitar, o médico poderá 
                visualizar seus dados de saúde e tratamento.
              </p>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => handleReject(invite)}
                disabled={processingId === invite.id}
                className="border-destructive/30 text-destructive hover:bg-destructive/10"
              >
                {processingId === invite.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <X className="h-4 w-4 mr-2" />
                    Recusar
                  </>
                )}
              </Button>
              <Button
                onClick={() => handleAccept(invite)}
                disabled={processingId === invite.id}
              >
                {processingId === invite.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Aceitar
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
