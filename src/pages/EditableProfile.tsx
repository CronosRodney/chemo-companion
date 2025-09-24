import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Edit,
  Save,
  X
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const EditableProfile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [patientData, setPatientData] = useState({
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
  });

  const [editableData, setEditableData] = useState(patientData);

  const handleSave = async () => {
    try {
      setPatientData(editableData);
      setIsEditing(false);
      
      // Simulate saving to database
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast({
        title: "Sucesso",
        description: "Perfil atualizado com sucesso"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar as alterações",
        variant: "destructive"
      });
    }
  };

  const handleCancel = () => {
    setEditableData(patientData);
    setIsEditing(false);
  };

  const EditableField = ({ 
    label, 
    value, 
    onChange, 
    type = "text" 
  }: { 
    label: string; 
    value: string; 
    onChange: (value: string) => void; 
    type?: string;
  }) => (
    <div className="p-3 bg-muted/50 rounded-lg">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {isEditing ? (
        <Input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1 h-8 text-sm"
        />
      ) : (
        <p className="font-medium text-sm">{value}</p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20 p-4 pb-20">
      <div className="mx-auto max-w-md space-y-6 pt-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Perfil</h1>
          <div className="ml-auto flex gap-2">
            {isEditing ? (
              <>
                <Button variant="outline" size="icon" onClick={handleCancel}>
                  <X className="h-4 w-4" />
                </Button>
                <Button variant="default" size="icon" onClick={handleSave}>
                  <Save className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Button variant="outline" size="icon" onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Profile Header */}
        <Card className="shadow-lg border-0 bg-gradient-to-r from-primary/10 to-secondary/20">
          <CardContent className="p-6 text-center">
            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="h-10 w-10 text-primary" />
            </div>
            {isEditing ? (
              <div className="space-y-2">
                <Input
                  value={editableData.name}
                  onChange={(e) => setEditableData({...editableData, name: e.target.value})}
                  className="text-xl font-semibold text-center"
                />
                <Input
                  type="email"
                  value={editableData.email}
                  onChange={(e) => setEditableData({...editableData, email: e.target.value})}
                  className="text-sm text-center"
                />
              </div>
            ) : (
              <>
                <h2 className="text-xl font-semibold">{patientData.name}</h2>
                <p className="text-sm text-muted-foreground">{patientData.email}</p>
              </>
            )}
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
              <EditableField
                label="Diagnóstico"
                value={editableData.diagnosis}
                onChange={(value) => setEditableData({...editableData, diagnosis: value})}
              />
              <EditableField
                label="Data Nascimento"
                value={editableData.birthDate}
                onChange={(value) => setEditableData({...editableData, birthDate: value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <EditableField
                label="Estágio"
                value={editableData.stage}
                onChange={(value) => setEditableData({...editableData, stage: value})}
              />
              <EditableField
                label="Próxima Consulta"
                value={editableData.nextAppointment}
                onChange={(value) => setEditableData({...editableData, nextAppointment: value})}
              />
            </div>
            <div className="p-3 bg-primary/10 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="h-4 w-4 text-primary" />
                <Label className="text-xs text-muted-foreground">Clínica Atual</Label>
              </div>
              {isEditing ? (
                <div className="space-y-2">
                  <Input
                    value={editableData.clinic}
                    onChange={(e) => setEditableData({...editableData, clinic: e.target.value})}
                    className="h-8 text-sm"
                  />
                  <Input
                    value={editableData.oncologist}
                    onChange={(e) => setEditableData({...editableData, oncologist: e.target.value})}
                    className="h-8 text-sm"
                  />
                </div>
              ) : (
                <>
                  <p className="font-medium text-sm">{patientData.clinic}</p>
                  <p className="text-xs text-muted-foreground">{patientData.oncologist}</p>
                </>
              )}
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
            <EditableField
              label="Telefone Principal"
              value={editableData.phone}
              onChange={(value) => setEditableData({...editableData, phone: value})}
              type="tel"
            />
            <div className="p-3 bg-warning/10 rounded-lg border border-warning/30">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="h-4 w-4 text-warning" />
                <Label className="text-xs text-warning font-medium">Contato de Emergência</Label>
              </div>
              {isEditing ? (
                <Input
                  value={editableData.emergencyContact}
                  onChange={(e) => setEditableData({...editableData, emergencyContact: e.target.value})}
                  className="mt-2 h-8 text-sm"
                />
              ) : (
                <p className="text-sm">{patientData.emergencyContact}</p>
              )}
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
          <Button 
            variant="outline" 
            className="w-full justify-start" 
            size="lg"
            onClick={() => toast({
              title: "Em desenvolvimento",
              description: "Configurações estão sendo implementadas"
            })}
          >
            <Settings className="h-4 w-4 mr-3" />
            Configurações
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

export default EditableProfile;