import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  ArrowLeft, 
  Settings, 
  Shield, 
  FileText, 
  Phone, 
  AlertCircle,
  Building2,
  Calendar,
  Stethoscope,
  CheckCircle2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "@/contexts/AppContext";
import { Skeleton } from "@/components/ui/skeleton";

const Profile = () => {
  const navigate = useNavigate();
  const { profile, stats, loading, clinics, clinicsLoading, doctors, doctorsLoading } = useAppContext();
  
  // Filter only active doctors
  const activeDoctors = doctors.filter(d => d.status === 'active');

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 pb-20">
      <div className="mx-auto max-w-md space-y-6 pt-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-semibold text-foreground">Perfil</h1>
        </div>

        {/* Profile Header */}
        <Card className="clean-card">
          <CardContent className="p-6 text-center">
            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-xl font-semibold">{profile?.first_name || 'Maria'} {profile?.last_name || 'Silva'}</h2>
            <p className="text-sm text-muted-foreground">{profile?.email || 'maria@email.com'}</p>
            <div className="flex justify-center gap-2 mt-3">
              <Badge className="bg-success/20 text-success border-success/30">
                Adesão {stats.adherence}%
              </Badge>
              <Badge variant="outline">
                Estágio III
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Medical Information */}
        <Card className="clean-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Informações Médicas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">Diagnóstico</p>
                <p className="font-medium text-sm">{profile?.medical_history || 'Câncer Colorretal'}</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">Data Nascimento</p>
                <p className="font-medium text-sm">{profile?.birth_date || '15/03/1965'}</p>
              </div>
            </div>
            <div className="p-3 bg-primary/10 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="h-4 w-4 text-primary" />
                <p className="text-xs text-muted-foreground">Clínica Atual</p>
              </div>
              {!clinicsLoading && clinics.length > 0 ? (
                <>
                  <p className="font-medium text-sm">{clinics[0].clinic_name}</p>
                  {clinics[0].clinic_responsible && clinics[0].clinic_responsible.length > 0 && (
                    <p className="text-xs text-muted-foreground">{clinics[0].clinic_responsible[0].name}</p>
                  )}
                </>
              ) : (
                <>
                  <p className="font-medium text-sm">Nenhuma clínica conectada</p>
                  <p className="text-xs text-muted-foreground">Escaneie um QR code para conectar</p>
                </>
              )}
            </div>

            {/* Responsible Doctor Section */}
            <div className="p-3 bg-secondary/10 rounded-lg border border-secondary/30">
              <div className="flex items-center gap-2 mb-2">
                <Stethoscope className="h-4 w-4 text-secondary-foreground" />
                <p className="text-xs text-muted-foreground">Médico Responsável</p>
              </div>
              {doctorsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              ) : activeDoctors.length > 0 ? (
                <div className="space-y-2">
                  {activeDoctors.map((doctor) => (
                    <div key={doctor.id} className="space-y-1">
                      <p className="font-medium text-sm">
                        Dr. {doctor.first_name} {doctor.last_name}
                      </p>
                      {(doctor.crm && doctor.crm_uf) && (
                        <p className="text-xs text-muted-foreground">
                          CRM {doctor.crm}/{doctor.crm_uf}
                        </p>
                      )}
                      {doctor.specialty && (
                        <p className="text-xs text-muted-foreground">{doctor.specialty}</p>
                      )}
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-success" />
                        <span className="text-xs text-success font-medium">Ativo</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <p className="font-medium text-sm">Nenhum médico vinculado</p>
                  <p className="text-xs text-muted-foreground">
                    Quando um médico solicitar acesso, você poderá aceitar na tela inicial
                  </p>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="clean-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Phone className="h-5 w-5 text-secondary-accent" />
              Contatos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">Telefone Principal</p>
              <p className="font-medium text-sm">{profile?.phone || '(11) 99999-9999'}</p>
            </div>
            <div className="p-3 bg-warning/10 rounded-lg border border-warning/30">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="h-4 w-4 text-warning" />
                <p className="text-xs text-warning font-medium">Contato de Emergência</p>
              </div>
              <p className="text-sm">{profile?.emergency_contact_name || 'Maria Silva'} - {profile?.emergency_contact_phone || '(11) 88888-8888'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="clean-card text-center p-4">
            <Calendar className="h-6 w-6 mx-auto text-primary mb-2" />
            <p className="text-xs text-muted-foreground">Próxima Consulta</p>
            <p className="font-semibold text-sm">{stats.nextAppointment}</p>
          </Card>
          <Card className="clean-card text-center p-4">
            <Shield className="h-6 w-6 mx-auto text-success mb-2" />
            <p className="text-xs text-muted-foreground">Status</p>
            <p className="font-semibold text-sm text-success">Ativo</p>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button variant="outline" className="w-full justify-start" size="lg">
            <Shield className="h-4 w-4 mr-3" />
            Segurança e Privacidade
          </Button>
          <Button variant="outline" className="w-full justify-start" size="lg">
            <FileText className="h-4 w-4 mr-3" />
            Exportar Dados (PDF)
          </Button>
          <Button variant="outline" className="w-full justify-start" size="lg" onClick={() => navigate('/profile/edit')}>
            <Settings className="h-4 w-4 mr-3" />
            Editar Perfil
          </Button>
        </div>

        {/* LGPD Notice */}
        <Card className="clean-card">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Proteção de Dados</p>
                <p className="text-xs text-muted-foreground">
                  Seus dados são criptografados e protegidos conforme LGPD. 
                  Você tem controle total sobre compartilhamento e remoção.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;