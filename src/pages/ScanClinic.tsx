import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, ArrowLeft, MapPin, Phone, Mail, Globe, Clock, User, Save, Edit, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useQRScanner } from '@/hooks/useQRScanner';
import { useAppContext } from '@/contexts/AppContext';
import { SimpleQRScanner } from '@/components/SimpleQRScanner';

interface ResponsibleData {
  name: string;
  role: string;
  council: string;
  council_uf: string;
  registration: string;
  email: string;
  phone: string;
}

interface EditableClinicData {
  clinic_name: string;
  legal_name: string;
  cnpj: string;
  cnes: string;
  street: string;
  number: string;
  district: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  whatsapp: string;
  email: string;
  website: string;
  maps_url: string;
  hours: string;
  responsible: ResponsibleData;
  deputy?: ResponsibleData;
}

const BRAZILIAN_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export default function ScanClinic() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { parseQRData, saveClinicData } = useQRScanner();
  const { refetchClinics } = useAppContext();

  const [showScanner, setShowScanner] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeputy, setShowDeputy] = useState(false);

  const [editableData, setEditableData] = useState<EditableClinicData>({
    clinic_name: '',
    legal_name: '',
    cnpj: '',
    cnes: '',
    street: '',
    number: '',
    district: '',
    city: '',
    state: '',
    zip: '',
    phone: '',
    whatsapp: '',
    email: '',
    website: '',
    maps_url: '',
    hours: '',
    responsible: {
      name: '',
      role: '',
      council: '',
      council_uf: '',
      registration: '',
      email: '',
      phone: ''
    }
  });

  const handleScanComplete = (result: any) => {
    try {
      if (!result || result.type !== 'clinic') {
        toast({
          title: 'Erro',
          description: 'QR Code não contém dados de clínica válidos',
          variant: 'destructive'
        });
        return;
      }

      const clinicData = result.data as any;
      
      setEditableData({
        clinic_name: clinicData.clinic_name || '',
        legal_name: clinicData.legal_name || '',
        cnpj: clinicData.cnpj || '',
        cnes: clinicData.cnes || '',
        street: clinicData.address?.street || '',
        number: clinicData.address?.number || '',
        district: clinicData.address?.district || '',
        city: clinicData.address?.city || '',
        state: clinicData.address?.state || '',
        zip: clinicData.address?.zip || '',
        phone: clinicData.contacts?.phone || '',
        whatsapp: clinicData.contacts?.whatsapp || '',
        email: clinicData.contacts?.email || '',
        website: clinicData.contacts?.website || '',
        maps_url: clinicData.contacts?.maps_url || '',
        hours: clinicData.hours || '',
        responsible: {
          name: clinicData.responsible?.name || '',
          role: clinicData.responsible?.role || '',
          council: clinicData.responsible?.council || '',
          council_uf: clinicData.responsible?.council_uf || '',
          registration: clinicData.responsible?.registration || '',
          email: clinicData.responsible?.email || '',
          phone: clinicData.responsible?.phone || ''
        },
        deputy: clinicData.deputy_responsible ? {
          name: clinicData.deputy_responsible.name || '',
          role: clinicData.deputy_responsible.role || '',
          council: clinicData.deputy_responsible.council || '',
          council_uf: clinicData.deputy_responsible.council_uf || '',
          registration: clinicData.deputy_responsible.registration || '',
          email: clinicData.deputy_responsible.email || '',
          phone: clinicData.deputy_responsible.phone || ''
        } : undefined
      });

      if (clinicData.deputy_responsible) {
        setShowDeputy(true);
      }

      setShowScanner(false);
      setIsEditing(true);

      toast({
        title: 'QR Code lido!',
        description: 'Revise os dados antes de salvar'
      });
    } catch (error) {
      console.error('Error parsing QR code:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível processar o QR Code',
        variant: 'destructive'
      });
    }
  };

  const handleScanError = (error: string) => {
    toast({
      title: 'Erro no scanner',
      description: error,
      variant: 'destructive'
    });
  };

  const handleSave = async () => {
    if (!editableData.clinic_name || !editableData.responsible.name) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Nome da clínica e responsável são obrigatórios',
        variant: 'destructive'
      });
      return;
    }

    setIsSaving(true);

    try {
      const clinicDataToSave: any = {
        clinic_name: editableData.clinic_name,
        legal_name: editableData.legal_name,
        cnpj: editableData.cnpj,
        cnes: editableData.cnes,
        address: {
          street: editableData.street,
          number: editableData.number,
          district: editableData.district,
          city: editableData.city,
          state: editableData.state,
          zip: editableData.zip
        },
        contacts: {
          phone: editableData.phone,
          whatsapp: editableData.whatsapp,
          email: editableData.email,
          website: editableData.website,
          maps_url: editableData.maps_url
        },
        hours: editableData.hours,
        responsible: editableData.responsible,
        deputy_responsible: showDeputy ? editableData.deputy : undefined
      };

      await saveClinicData(clinicDataToSave);
      await refetchClinics();

      toast({
        title: 'Sucesso!',
        description: 'Clínica salva com sucesso'
      });

      navigate('/');
    } catch (error) {
      console.error('Error saving clinic:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar a clínica',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateField = (field: keyof EditableClinicData, value: string) => {
    setEditableData(prev => ({ ...prev, [field]: value }));
  };

  const updateResponsible = (field: keyof ResponsibleData, value: string) => {
    setEditableData(prev => ({
      ...prev,
      responsible: { ...prev.responsible, [field]: value }
    }));
  };

  const updateDeputy = (field: keyof ResponsibleData, value: string) => {
    setEditableData(prev => ({
      ...prev,
      deputy: { ...(prev.deputy || {} as ResponsibleData), [field]: value }
    }));
  };

  if (showScanner) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setShowScanner(false)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">Escanear QR Code da Clínica</h1>
          </div>

          <Card className="clean-card">
            <CardContent className="pt-6">
              <SimpleQRScanner
                onScanComplete={handleScanComplete}
                onError={handleScanError}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!isEditing) {
    return (
      <div className="min-h-screen bg-background p-4 pb-20">
        <div className="max-w-2xl mx-auto space-y-6 pt-8">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">Adicionar Clínica</h1>
          </div>

          <div className="clean-card p-10 space-y-6 relative overflow-hidden">
            <div className="relative">
              <div className="w-20 h-20 mx-auto rounded-full bg-success/10 flex items-center justify-center mb-6">
                <Building2 className="h-10 w-10 text-success" />
                <Building2 className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-2xl font-semibold text-center mb-2">Como deseja adicionar a clínica?</h2>
              <p className="text-muted-foreground text-center mb-8">
                Escolha uma opção abaixo
              </p>

              <div className="space-y-4">
                <Button
                  size="lg"
                  className="w-full h-20 bg-success/10 border border-success/30 hover:bg-success/20 group rounded-2xl"
                  onClick={() => setShowScanner(true)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-success/30 flex items-center justify-center">
                      <QrCode className="h-6 w-6 text-success" />
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-base">Escanear QR Code</div>
                      <div className="text-sm opacity-80">Rápido e automático</div>
                    </div>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  className="w-full h-20 border border-border group rounded-2xl"
                  onClick={() => setIsEditing(true)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                      <Edit className="h-6 w-6 text-primary" />
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-base">Inserir Manualmente</div>
                      <div className="text-sm opacity-80">Preencher formulário</div>
                    </div>
                  </div>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 pb-20">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => {
              setIsEditing(false);
              setEditableData({
                clinic_name: '',
                legal_name: '',
                cnpj: '',
                cnes: '',
                street: '',
                number: '',
                district: '',
                city: '',
                state: '',
                zip: '',
                phone: '',
                whatsapp: '',
                email: '',
                website: '',
                maps_url: '',
                hours: '',
                responsible: {
                  name: '',
                  role: '',
                  council: '',
                  council_uf: '',
                  registration: '',
                  email: '',
                  phone: ''
                }
              });
            }}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Dados da Clínica</h1>
        </div>

        {/* Informações Básicas */}
        <Card className="luxury-card border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Informações Básicas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="clinic_name">Nome da Clínica *</Label>
              <Input
                id="clinic_name"
                value={editableData.clinic_name}
                onChange={(e) => updateField('clinic_name', e.target.value)}
                placeholder="Ex: Clínica de Oncologia São Paulo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="legal_name">Razão Social</Label>
              <Input
                id="legal_name"
                value={editableData.legal_name}
                onChange={(e) => updateField('legal_name', e.target.value)}
                placeholder="Ex: Clínica de Oncologia São Paulo Ltda"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  value={editableData.cnpj}
                  onChange={(e) => updateField('cnpj', e.target.value)}
                  placeholder="00.000.000/0000-00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cnes">CNES</Label>
                <Input
                  id="cnes"
                  value={editableData.cnes}
                  onChange={(e) => updateField('cnes', e.target.value)}
                  placeholder="0000000"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Endereço */}
        <Card className="luxury-card border-2 border-secondary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-secondary-accent" />
              Endereço
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="street">Rua</Label>
                <Input
                  id="street"
                  value={editableData.street}
                  onChange={(e) => updateField('street', e.target.value)}
                  placeholder="Ex: Rua das Flores"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="number">Número</Label>
                <Input
                  id="number"
                  value={editableData.number}
                  onChange={(e) => updateField('number', e.target.value)}
                  placeholder="123"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="district">Bairro</Label>
              <Input
                id="district"
                value={editableData.district}
                onChange={(e) => updateField('district', e.target.value)}
                placeholder="Ex: Centro"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  value={editableData.city}
                  onChange={(e) => updateField('city', e.target.value)}
                  placeholder="Ex: São Paulo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">Estado</Label>
                <Select value={editableData.state} onValueChange={(value) => updateField('state', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="UF" />
                  </SelectTrigger>
                  <SelectContent>
                    {BRAZILIAN_STATES.map(state => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="zip">CEP</Label>
              <Input
                id="zip"
                value={editableData.zip}
                onChange={(e) => updateField('zip', e.target.value)}
                placeholder="00000-000"
              />
            </div>
          </CardContent>
        </Card>

        {/* Contatos */}
        <Card className="luxury-card border-2 border-accent/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-accent-foreground" />
              Contatos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={editableData.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  placeholder="(11) 1234-5678"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  value={editableData.whatsapp}
                  onChange={(e) => updateField('whatsapp', e.target.value)}
                  placeholder="(11) 98765-4321"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={editableData.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="contato@clinica.com.br"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={editableData.website}
                onChange={(e) => updateField('website', e.target.value)}
                placeholder="https://www.clinica.com.br"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maps_url">URL Google Maps</Label>
              <Input
                id="maps_url"
                value={editableData.maps_url}
                onChange={(e) => updateField('maps_url', e.target.value)}
                placeholder="https://maps.google.com/..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Responsável Principal */}
        <Card className="luxury-card border-2 border-success/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-success" />
              Responsável Principal *
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="resp_name">Nome *</Label>
              <Input
                id="resp_name"
                value={editableData.responsible.name}
                onChange={(e) => updateResponsible('name', e.target.value)}
                placeholder="Dr. João Silva"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="resp_role">Cargo/Função</Label>
              <Input
                id="resp_role"
                value={editableData.responsible.role}
                onChange={(e) => updateResponsible('role', e.target.value)}
                placeholder="Médico Oncologista"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="resp_council">Conselho</Label>
                <Input
                  id="resp_council"
                  value={editableData.responsible.council}
                  onChange={(e) => updateResponsible('council', e.target.value)}
                  placeholder="CRM"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="resp_council_uf">UF</Label>
                <Select value={editableData.responsible.council_uf} onValueChange={(value) => updateResponsible('council_uf', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="UF" />
                  </SelectTrigger>
                  <SelectContent>
                    {BRAZILIAN_STATES.map(state => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="resp_registration">Registro</Label>
                <Input
                  id="resp_registration"
                  value={editableData.responsible.registration}
                  onChange={(e) => updateResponsible('registration', e.target.value)}
                  placeholder="123456"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="resp_email">Email</Label>
                <Input
                  id="resp_email"
                  type="email"
                  value={editableData.responsible.email}
                  onChange={(e) => updateResponsible('email', e.target.value)}
                  placeholder="joao@clinica.com.br"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="resp_phone">Telefone</Label>
                <Input
                  id="resp_phone"
                  value={editableData.responsible.phone}
                  onChange={(e) => updateResponsible('phone', e.target.value)}
                  placeholder="(11) 98765-4321"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Responsável Substituto */}
        {!showDeputy && (
          <Button
            variant="outline"
            className="w-full border-dashed border-2"
            onClick={() => setShowDeputy(true)}
          >
            Adicionar Responsável Substituto
          </Button>
        )}

        {showDeputy && (
          <Card className="luxury-card border-2 border-warning/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-warning" />
                  Responsável Substituto
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowDeputy(false);
                    setEditableData(prev => ({ ...prev, deputy: undefined }));
                  }}
                >
                  Remover
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="dep_name">Nome</Label>
                <Input
                  id="dep_name"
                  value={editableData.deputy?.name || ''}
                  onChange={(e) => updateDeputy('name', e.target.value)}
                  placeholder="Dra. Maria Santos"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dep_role">Cargo/Função</Label>
                <Input
                  id="dep_role"
                  value={editableData.deputy?.role || ''}
                  onChange={(e) => updateDeputy('role', e.target.value)}
                  placeholder="Médica Oncologista"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dep_council">Conselho</Label>
                  <Input
                    id="dep_council"
                    value={editableData.deputy?.council || ''}
                    onChange={(e) => updateDeputy('council', e.target.value)}
                    placeholder="CRM"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dep_council_uf">UF</Label>
                  <Select value={editableData.deputy?.council_uf || ''} onValueChange={(value) => updateDeputy('council_uf', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="UF" />
                    </SelectTrigger>
                    <SelectContent>
                      {BRAZILIAN_STATES.map(state => (
                        <SelectItem key={state} value={state}>{state}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dep_registration">Registro</Label>
                  <Input
                    id="dep_registration"
                    value={editableData.deputy?.registration || ''}
                    onChange={(e) => updateDeputy('registration', e.target.value)}
                    placeholder="654321"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dep_email">Email</Label>
                  <Input
                    id="dep_email"
                    type="email"
                    value={editableData.deputy?.email || ''}
                    onChange={(e) => updateDeputy('email', e.target.value)}
                    placeholder="maria@clinica.com.br"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dep_phone">Telefone</Label>
                  <Input
                    id="dep_phone"
                    value={editableData.deputy?.phone || ''}
                    onChange={(e) => updateDeputy('phone', e.target.value)}
                    placeholder="(11) 98765-4321"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Horários */}
        <Card className="luxury-card border-2 border-muted/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Horário de Funcionamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={editableData.hours}
              onChange={(e) => updateField('hours', e.target.value)}
              placeholder="Ex: Segunda a Sexta: 8h às 18h&#10;Sábado: 8h às 12h"
              rows={4}
            />
          </CardContent>
        </Card>

        {/* Botões de Ação */}
        <div className="grid grid-cols-2 gap-4 pb-4">
          <Button
            variant="outline"
            size="lg"
            onClick={() => {
              setIsEditing(false);
              setEditableData({
                clinic_name: '',
                legal_name: '',
                cnpj: '',
                cnes: '',
                street: '',
                number: '',
                district: '',
                city: '',
                state: '',
                zip: '',
                phone: '',
                whatsapp: '',
                email: '',
                website: '',
                maps_url: '',
                hours: '',
                responsible: {
                  name: '',
                  role: '',
                  council: '',
                  council_uf: '',
                  registration: '',
                  email: '',
                  phone: ''
                }
              });
            }}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button
            size="lg"
            onClick={handleSave}
            disabled={isSaving}
            className="bg-gradient-to-r from-success to-success/80 hover:from-success/90 hover:to-success/70"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar Clínica
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
