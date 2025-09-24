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
  Calendar
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const navigate = useNavigate();
  const patientData = {
    name: "João Silva",
    email: "joao.silva@email.com",
    phone: "(11) 99999-9999",
    birthDate: "15/03/1965",
    diagnosis: "Câncer Colorretal",
    stage: "III",
    clinic: "Hospital São José",
    oncologist: "Dra. Maria Santos",
    emergencyContact: "Maria Silva - (11) 88888-8888",
    adherence: 95,
    nextAppointment: "15/01/2025"
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20 p-4 pb-20">
      <div className="mx-auto max-w-md space-y-6 pt-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Perfil</h1>
        </div>

        {/* Profile Header */}
        <Card className="shadow-lg border-0 bg-gradient-to-r from-primary/10 to-secondary/20">
          <CardContent className="p-6 text-center">
            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-xl font-semibold">{patientData.name}</h2>
            <p className="text-sm text-muted-foreground">{patientData.email}</p>
            <div className="flex justify-center gap-2 mt-3">
              <Badge className="bg-success/20 text-success border-success/30">
                Adesão {patientData.adherence}%
              </Badge>
              <Badge variant="outline">
                Estágio {patientData.stage}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Medical Information */}
        <Card className="shadow-md border-0">
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
                <p className="font-medium text-sm">{patientData.diagnosis}</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">Data Nascimento</p>
                <p className="font-medium text-sm">{patientData.birthDate}</p>
              </div>
            </div>
            <div className="p-3 bg-primary/10 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="h-4 w-4 text-primary" />
                <p className="text-xs text-muted-foreground">Clínica Atual</p>
              </div>
              <p className="font-medium text-sm">{patientData.clinic}</p>
              <p className="text-xs text-muted-foreground">{patientData.oncologist}</p>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="shadow-md border-0">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Phone className="h-5 w-5 text-secondary-accent" />
              Contatos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">Telefone Principal</p>
              <p className="font-medium text-sm">{patientData.phone}</p>
            </div>
            <div className="p-3 bg-warning/10 rounded-lg border border-warning/30">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="h-4 w-4 text-warning" />
                <p className="text-xs text-warning font-medium">Contato de Emergência</p>
              </div>
              <p className="text-sm">{patientData.emergencyContact}</p>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="shadow-md border-0 text-center p-4">
            <Calendar className="h-6 w-6 mx-auto text-primary mb-2" />
            <p className="text-xs text-muted-foreground">Próxima Consulta</p>
            <p className="font-semibold text-sm">{patientData.nextAppointment}</p>
          </Card>
          <Card className="shadow-md border-0 text-center p-4">
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
        <Card className="shadow-md border-0 bg-muted/30">
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