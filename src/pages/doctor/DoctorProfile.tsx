import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Mail, Stethoscope, Award, Building2, Edit2, Save, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDoctorAuth } from "@/hooks/useDoctorAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import DoctorNavigation from "@/components/doctor/DoctorNavigation";

const DoctorProfile = () => {
  const navigate = useNavigate();
  const { user, doctorProfile, loading, refreshDoctorStatus } = useDoctorAuth();
  const { toast } = useToast();
  
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    crm: '',
    crm_uf: '',
    specialty: ''
  });

  // Initialize form data when doctorProfile loads
  useEffect(() => {
    if (doctorProfile) {
      setFormData({
        first_name: doctorProfile.first_name || '',
        last_name: doctorProfile.last_name || '',
        crm: doctorProfile.crm || '',
        crm_uf: doctorProfile.crm_uf || '',
        specialty: doctorProfile.specialty || ''
      });
    }
  }, [doctorProfile]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    // Reset form data to original values
    if (doctorProfile) {
      setFormData({
        first_name: doctorProfile.first_name || '',
        last_name: doctorProfile.last_name || '',
        crm: doctorProfile.crm || '',
        crm_uf: doctorProfile.crm_uf || '',
        specialty: doctorProfile.specialty || ''
      });
    }
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('healthcare_professionals')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          crm: formData.crm,
          crm_uf: formData.crm_uf,
          specialty: formData.specialty,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram salvas com sucesso."
      });
      
      setIsEditing(false);
      // Refresh doctor profile data
      await refreshDoctorStatus();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível atualizar o perfil. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20 p-4 pb-24">
      <div className="mx-auto max-w-md space-y-6 pt-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/doctor')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold">Meu Perfil</h1>
          </div>
          
          {!isEditing && (
            <Button variant="outline" size="sm" onClick={handleEdit}>
              <Edit2 className="h-4 w-4 mr-2" />
              Editar
            </Button>
          )}
        </div>

        {/* Profile Header */}
        <Card className="shadow-lg border-0 bg-gradient-to-r from-primary/10 to-secondary/20">
          <CardContent className="p-6 text-center">
            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Stethoscope className="h-10 w-10 text-primary" />
            </div>
            {isEditing ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="first_name" className="text-xs">Nome</Label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange('first_name')}
                      placeholder="Nome"
                      className="text-center"
                    />
                  </div>
                  <div>
                    <Label htmlFor="last_name" className="text-xs">Sobrenome</Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange('last_name')}
                      placeholder="Sobrenome"
                      className="text-center"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-semibold">
                  Dr. {doctorProfile?.first_name} {doctorProfile?.last_name}
                </h2>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </>
            )}
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
            {isEditing ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="crm">CRM</Label>
                    <Input
                      id="crm"
                      value={formData.crm}
                      onChange={handleInputChange('crm')}
                      placeholder="000000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="crm_uf">UF</Label>
                    <Input
                      id="crm_uf"
                      value={formData.crm_uf}
                      onChange={handleInputChange('crm_uf')}
                      placeholder="SP"
                      maxLength={2}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="specialty">Especialidade</Label>
                  <Input
                    id="specialty"
                    value={formData.specialty}
                    onChange={handleInputChange('specialty')}
                    placeholder="Ex: Oncologia"
                  />
                </div>
              </>
            ) : (
              <>
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
              </>
            )}
          </CardContent>
        </Card>

        {/* Contact Information - Always read-only */}
        <Card className="shadow-md border-0">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Mail className="h-5 w-5 text-secondary-accent" />
              Contato
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">Email (somente leitura)</p>
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

        {/* Action Buttons when editing */}
        {isEditing && (
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="flex-1" 
              onClick={handleCancel}
              disabled={saving}
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button 
              className="flex-1" 
              onClick={handleSave}
              disabled={saving}
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        )}
      </div>
      
      <DoctorNavigation />
    </div>
  );
};

export default DoctorProfile;
