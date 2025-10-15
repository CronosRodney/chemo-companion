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
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAppContext } from "@/contexts/AppContext";

const EditableProfile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile, stats, updateProfile, clinics, loading } = useAppContext();
  const [isEditing, setIsEditing] = useState(false);

  const [editableData, setEditableData] = useState({
    first_name: profile?.first_name || "",
    last_name: profile?.last_name || "",
    email: profile?.email || "",
    phone: profile?.phone || "",
    birth_date: profile?.birth_date || "",
    medical_history: profile?.medical_history || "",
    emergency_contact_name: profile?.emergency_contact_name || "",
    emergency_contact_phone: profile?.emergency_contact_phone || ""
  });

  useEffect(() => {
    if (profile) {
      setEditableData({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        birth_date: profile.birth_date || "",
        medical_history: profile.medical_history || "",
        emergency_contact_name: profile.emergency_contact_name || "",
        emergency_contact_phone: profile.emergency_contact_phone || ""
      });
    }
  }, [profile]);

  const handleSave = async () => {
    try {
      await updateProfile(editableData);
      setIsEditing(false);
      
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
    if (profile) {
      setEditableData({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        birth_date: profile.birth_date || "",
        medical_history: profile.medical_history || "",
        emergency_contact_name: profile.emergency_contact_name || "",
        emergency_contact_phone: profile.emergency_contact_phone || ""
      });
    }
    setIsEditing(false);
  };

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
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    value={editableData.first_name}
                    onChange={(e) => setEditableData({...editableData, first_name: e.target.value})}
                    placeholder="Nome"
                    className="h-8 text-sm text-center"
                  />
                  <Input
                    value={editableData.last_name}
                    onChange={(e) => setEditableData({...editableData, last_name: e.target.value})}
                    placeholder="Sobrenome"
                    className="h-8 text-sm text-center"
                  />
                </div>
                <Input
                  type="email"
                  value={editableData.email}
                  onChange={(e) => setEditableData({...editableData, email: e.target.value})}
                  className="text-sm text-center"
                />
              </div>
            ) : (
              <>
                <h2 className="text-xl font-semibold">
                  {profile?.first_name || ''} {profile?.last_name || ''}
                </h2>
                <p className="text-sm text-muted-foreground">{profile?.email || ''}</p>
              </>
            )}
            <div className="flex justify-center gap-2 mt-3">
              <Badge className="bg-success/20 text-success border-success/30">
                Adesão {stats.adherence}%
              </Badge>
              <Badge variant="outline">
                {profile?.medical_history ? 'Cadastrado' : 'Incompleto'}
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
                label="Histórico Médico"
                value={editableData.medical_history}
                onChange={(value) => setEditableData({...editableData, medical_history: value})}
              />
              <EditableField
                label="Data Nascimento"
                value={editableData.birth_date || ""}
                onChange={(value) => setEditableData({...editableData, birth_date: value})}
                type="date"
              />
            </div>
            <div className="p-3 bg-primary/10 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="h-4 w-4 text-primary" />
                <Label className="text-xs text-muted-foreground">Clínica Conectada</Label>
              </div>
              {clinics.length > 0 ? (
                <>
                  <p className="font-medium text-sm">{clinics[0].clinic_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {clinics[0].city}, {clinics[0].state}
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma clínica conectada</p>
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
                <div className="space-y-2">
                  <Input
                    value={editableData.emergency_contact_name}
                    onChange={(e) => setEditableData({...editableData, emergency_contact_name: e.target.value})}
                    placeholder="Nome do contato"
                    className="mt-2 h-8 text-sm"
                  />
                  <Input
                    value={editableData.emergency_contact_phone}
                    onChange={(e) => setEditableData({...editableData, emergency_contact_phone: e.target.value})}
                    placeholder="Telefone"
                    className="h-8 text-sm"
                    type="tel"
                  />
                </div>
              ) : (
                <p className="text-sm">
                  {profile?.emergency_contact_name || 'Não informado'} - {profile?.emergency_contact_phone || ''}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="shadow-md border-0 text-center p-4">
            <Calendar className="h-6 w-6 mx-auto text-primary mb-2" />
            <p className="text-xs text-muted-foreground">Próxima Consulta</p>
            <p className="font-semibold text-sm">{stats.nextAppointment}</p>
          </Card>
          <Card className="shadow-md border-0 text-center p-4">
            <Shield className="h-6 w-6 mx-auto text-success mb-2" />
            <p className="text-xs text-muted-foreground">Ciclo Atual</p>
            <p className="font-semibold text-sm text-success">{stats.currentCycle}</p>
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