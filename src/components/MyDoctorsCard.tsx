import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Stethoscope, UserX, RefreshCw } from "lucide-react";
import { useMyDoctors } from "@/hooks/useMyDoctors";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export const MyDoctorsCard = () => {
  const { doctors, loading, refetch, disconnectDoctor } = useMyDoctors();
  const { toast } = useToast();
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  // Filter to show only active doctors (not pending, rejected, or disconnected)
  const activeDoctors = doctors.filter(d => d.status === 'active');

  if (loading) {
    return (
      <div className="clean-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Stethoscope className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-xl font-bold">Meus Médicos</h2>
        </div>
        <div className="animate-pulse space-y-3">
          <div className="h-16 bg-muted/50 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (activeDoctors.length === 0) {
    return null; // Don't show the card if there are no doctors
  }

  const handleDisconnect = async (connectionId: string, doctorName: string) => {
    setDisconnecting(connectionId);
    const success = await disconnectDoctor(connectionId);
    
    if (success) {
      toast({
        title: "Desconectado",
        description: `Você foi desconectado do Dr(a). ${doctorName}`
      });
    } else {
      toast({
        title: "Erro",
        description: "Não foi possível desconectar",
        variant: "destructive"
      });
    }
    setDisconnecting(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="secondary" className="bg-success/20 text-success">Ativo</Badge>;
      case 'pending':
        return <Badge variant="outline" className="border-warning text-warning">Pendente</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="clean-card p-6 relative overflow-hidden">
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Stethoscope className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">
              Meus Médicos
            </h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => refetch()}
            className="h-8 w-8"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-3">
          {activeDoctors.map((doctor) => (
            <div
              key={doctor.connection_id}
              className="bg-card p-4 rounded-2xl border border-border"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold">
                      Dr(a). {doctor.first_name} {doctor.last_name}
                    </p>
                    {getStatusBadge(doctor.status)}
                  </div>
                  {doctor.specialty && (
                    <p className="text-sm text-muted-foreground">
                      {doctor.specialty}
                    </p>
                  )}
                  {doctor.crm && doctor.crm_uf && (
                    <p className="text-xs text-muted-foreground">
                      CRM: {doctor.crm}/{doctor.crm_uf}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => handleDisconnect(doctor.connection_id, doctor.first_name)}
                  disabled={disconnecting === doctor.connection_id}
                >
                  {disconnecting === doctor.connection_id ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <UserX className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
