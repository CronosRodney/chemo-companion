import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Plus, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MedicationService } from '@/services/medicationService';

interface OncologyMed {
  id: string;
  drug_name_inn_dcb: string;
  drug_class: string;
  strengths: string[];
  dosage_forms: string[];
  route: string[];
}

export default function ManualMedicationEntry() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [medications, setMedications] = useState<OncologyMed[]>([]);
  const [filteredMeds, setFilteredMeds] = useState<OncologyMed[]>([]);
  const [selectedMed, setSelectedMed] = useState<OncologyMed | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form fields
  const [selectedStrength, setSelectedStrength] = useState('');
  const [dose, setDose] = useState('');
  const [frequency, setFrequency] = useState('');
  const [instructions, setInstructions] = useState('');

  useEffect(() => {
    loadMedications();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = medications.filter(med =>
        med.drug_name_inn_dcb.toLowerCase().includes(searchTerm.toLowerCase()) ||
        med.drug_class?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredMeds(filtered);
    } else {
      setFilteredMeds([]);
    }
  }, [searchTerm, medications]);

  const loadMedications = async () => {
    try {
      const { data, error } = await supabase
        .from('oncology_meds' as any)
        .select('id, drug_name_inn_dcb, drug_class, strengths, dosage_forms, route')
        .order('drug_name_inn_dcb');

      if (error) throw error;
      setMedications((data as any) || []);
    } catch (error) {
      console.error('Error loading medications:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar a lista de medicamentos.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectMedication = (med: OncologyMed) => {
    setSelectedMed(med);
    setSearchTerm('');
    setFilteredMeds([]);
  };

  const handleSave = async () => {
    if (!selectedMed) {
      toast({
        title: 'Atenção',
        description: 'Selecione um medicamento primeiro.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);

    try {
      // Save medication to medications table
      const medicationData = {
        name: selectedMed.drug_name_inn_dcb,
        active_ingredient: selectedMed.drug_name_inn_dcb,
        concentration: selectedStrength || null,
        form: selectedMed.dosage_forms?.[0] || null,
        route: selectedMed.route?.[0] || null,
      };

      const { id: medicationId } = await MedicationService.saveMedication(medicationData);

      // Link to user with dosage info
      await MedicationService.linkToUser(medicationId, dose, frequency, instructions);

      // Add timeline event
      await MedicationService.addTimelineEvent(
        'medication_added',
        `Medicamento adicionado: ${selectedMed.drug_name_inn_dcb}`,
        `Concentração: ${selectedStrength || 'Não especificada'}\nDose: ${dose || 'Não especificada'}\nFrequência: ${frequency || 'Não especificada'}`
      );

      toast({
        title: 'Sucesso!',
        description: 'Medicamento salvo com sucesso.',
      });

      // Navigate to timeline
      navigate('/timeline');
    } catch (error) {
      console.error('Error saving medication:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o medicamento.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate('/medications')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold">Adicionar Medicamento</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Buscar Medicamento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="search">Nome do Medicamento</Label>
            <Input
              id="search"
              placeholder="Digite o nome do medicamento ou classe terapêutica..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {filteredMeds.length > 0 && (
            <div className="border rounded-md max-h-60 overflow-y-auto">
              {filteredMeds.map((med) => (
                <button
                  key={med.id}
                  onClick={() => handleSelectMedication(med)}
                  className="w-full p-3 text-left hover:bg-accent transition-colors border-b last:border-b-0"
                >
                  <div className="font-medium">{med.drug_name_inn_dcb}</div>
                  {med.drug_class && (
                    <div className="text-sm text-muted-foreground">{med.drug_class}</div>
                  )}
                </button>
              ))}
            </div>
          )}

          {selectedMed && (
            <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
              <CardContent className="pt-4">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-green-900 dark:text-green-100">
                      {selectedMed.drug_name_inn_dcb}
                    </div>
                    {selectedMed.drug_class && (
                      <div className="text-sm text-green-700 dark:text-green-300">
                        {selectedMed.drug_class}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {selectedMed && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Informações de Dosagem
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedMed.strengths && selectedMed.strengths.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="strength">Concentração</Label>
                <Select value={selectedStrength} onValueChange={setSelectedStrength}>
                  <SelectTrigger id="strength">
                    <SelectValue placeholder="Selecione a concentração" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedMed.strengths.map((strength, idx) => (
                      <SelectItem key={idx} value={strength}>
                        {strength}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="dose">Dose Prescrita</Label>
              <Input
                id="dose"
                placeholder="Ex: 100mg"
                value={dose}
                onChange={(e) => setDose(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="frequency">Frequência</Label>
              <Input
                id="frequency"
                placeholder="Ex: 1x ao dia, a cada 21 dias"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructions">Instruções Adicionais</Label>
              <Textarea
                id="instructions"
                placeholder="Observações, cuidados especiais, etc."
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={3}
              />
            </div>

            <Button onClick={handleSave} disabled={isSaving} className="w-full">
              {isSaving ? 'Salvando...' : 'Salvar Medicamento'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
