import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { ArrowLeft, Edit, Save, X } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { MedicationService } from '../services/medicationService';
import { useAppContext } from '../contexts/AppContext';

interface MedicationData {
  name: string;
  activeIngredient: string;
  manufacturer: string;
  concentration: string;
  form: string;
  route: string;
}

export default function MedicationDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { refetchClinics } = useAppContext();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [medicationData, setMedicationData] = useState<MedicationData>({
    name: '',
    activeIngredient: '',
    manufacturer: '',
    concentration: '',
    form: '',
    route: ''
  });

  useEffect(() => {
    // Get data from navigation state
    const extractedData = location.state?.extractedData;
    if (extractedData) {
      setMedicationData({
        name: extractedData.name || '',
        activeIngredient: extractedData.activeIngredient || '',
        manufacturer: extractedData.manufacturer || '',
        concentration: extractedData.concentration || '',
        form: extractedData.form || '',
        route: extractedData.route || ''
      });
    }
  }, [location.state]);

  const handleInputChange = (field: keyof MedicationData, value: string) => {
    setMedicationData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!medicationData.name.trim()) {
      toast({
        title: "Erro",
        description: "Nome do medicamento é obrigatório",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      // Save medication
      const savedMed = await MedicationService.saveMedication(medicationData);
      await MedicationService.linkToUser(savedMed.id);
      
      // Add timeline event
      const details = [
        `Nome: ${medicationData.name}`,
        medicationData.activeIngredient && `Princípio Ativo: ${medicationData.activeIngredient}`,
        medicationData.manufacturer && `Fabricante: ${medicationData.manufacturer}`,
        medicationData.concentration && `Concentração: ${medicationData.concentration}`,
        medicationData.form && `Forma: ${medicationData.form}`
      ].filter(Boolean).join('\n');
      
      await MedicationService.addTimelineEvent(
        'med_manual',
        'Medicamento adicionado manualmente',
        details
      );

      refetchClinics(); // Refresh any data that might be needed

      toast({
        title: "Sucesso",
        description: "Medicamento salvo com sucesso!",
      });

      navigate('/timeline');
    } catch (error) {
      console.error('Error saving medication:', error);
      toast({
        title: "Erro",
        description: "Falha ao salvar medicamento",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold">Dados do Medicamento</h1>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Informações Extraídas</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
            disabled={isSaving}
          >
            {isEditing ? (
              <>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </>
            ) : (
              <>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </>
            )}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div>
              <Label htmlFor="name">Nome do Medicamento *</Label>
              {isEditing ? (
                <Input
                  id="name"
                  value={medicationData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Ex: Dipirona 500mg"
                />
              ) : (
                <div className="p-2 bg-muted rounded-md">
                  {medicationData.name || 'Não informado'}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="activeIngredient">Princípio Ativo</Label>
              {isEditing ? (
                <Input
                  id="activeIngredient"
                  value={medicationData.activeIngredient}
                  onChange={(e) => handleInputChange('activeIngredient', e.target.value)}
                  placeholder="Ex: Dipirona Sódica"
                />
              ) : (
                <div className="p-2 bg-muted rounded-md">
                  {medicationData.activeIngredient || 'Não informado'}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="manufacturer">Fabricante</Label>
              {isEditing ? (
                <Input
                  id="manufacturer"
                  value={medicationData.manufacturer}
                  onChange={(e) => handleInputChange('manufacturer', e.target.value)}
                  placeholder="Ex: EMS"
                />
              ) : (
                <div className="p-2 bg-muted rounded-md">
                  {medicationData.manufacturer || 'Não informado'}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="concentration">Concentração/Dosagem</Label>
              {isEditing ? (
                <Input
                  id="concentration"
                  value={medicationData.concentration}
                  onChange={(e) => handleInputChange('concentration', e.target.value)}
                  placeholder="Ex: 500mg"
                />
              ) : (
                <div className="p-2 bg-muted rounded-md">
                  {medicationData.concentration || 'Não informado'}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="form">Forma Farmacêutica</Label>
              {isEditing ? (
                <Input
                  id="form"
                  value={medicationData.form}
                  onChange={(e) => handleInputChange('form', e.target.value)}
                  placeholder="Ex: Comprimidos, Cápsulas"
                />
              ) : (
                <div className="p-2 bg-muted rounded-md">
                  {medicationData.form || 'Não informado'}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="route">Via de Administração</Label>
              {isEditing ? (
                <Input
                  id="route"
                  value={medicationData.route}
                  onChange={(e) => handleInputChange('route', e.target.value)}
                  placeholder="Ex: Oral, Sublingual"
                />
              ) : (
                <div className="p-2 bg-muted rounded-md">
                  {medicationData.route || 'Não informado'}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              onClick={handleSave} 
              disabled={isSaving || !medicationData.name.trim()}
              className="flex-1"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Salvando...' : 'Salvar Medicamento'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}