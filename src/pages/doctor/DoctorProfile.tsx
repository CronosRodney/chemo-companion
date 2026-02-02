import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, User, Mail, Stethoscope, Award, Building2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDoctorAuth } from "@/hooks/useDoctorAuth";
import DoctorNavigation from "@/components/doctor/DoctorNavigation";

const DoctorProfile = () => {
  const navigate = useNavigate();
  const { user, doctorProfile, loading } = useDoctorAuth();

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
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20 p-4 pb-24">
      <div className="mx-auto max-w-md space-y-6 pt-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/doctor')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Meu Perfil</h1>
        </div>

        {/* Profile Header */}
        <Card className="shadow-lg border-0 bg-gradient-to-r from-primary/10 to-secondary/20">
          <CardContent className="p-6 text-center">
            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Stethoscope className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-xl font-semibold">
              Dr. {doctorProfile?.first_name} {doctorProfile?.last_name}
            </h2>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <div className="flex justify-center gap-2 mt-3">
              {doctorProfile?.is_verified ? (
                <Badge className="bg-success/20 text-success border-success/30">
                  Verificado
                </Badge>
              ) : (
                <Badge variant="outline" className="text-warning border-warning/30">
                  Pendente Verificação
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Professional Information */}
        <Card className="shadow-md border-0">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Informações Profissionais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">CRM</p>
                <p className="font-medium text-sm">
                  {doctorProfile?.crm || 'Não informado'}
                </p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">UF</p>
                <p className="font-medium text-sm">
                  {doctorProfile?.crm_uf || 'N/A'}
                </p>
              </div>
            </div>
            
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Stethoscope className="h-4 w-4 text-primary" />
                <p className="text-xs text-muted-foreground">Especialidade</p>
              </div>
              <p className="font-medium text-sm">
                {doctorProfile?.specialty || 'Não informada'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="shadow-md border-0">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Mail className="h-5 w-5 text-secondary-accent" />
              Contato
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="font-medium text-sm">{user?.email || 'Não informado'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Clinic Information (if available) */}
        {doctorProfile?.clinic_id && (
          <Card className="shadow-md border-0">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Clínica Vinculada
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-3 bg-primary/10 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Clínica vinculada ao seu perfil
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      
      <DoctorNavigation />
    </div>
  );
};

export default DoctorProfile;
