import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Plus, CheckCircle, Pill } from 'lucide-react';
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
  indications_oncology: string[];
  common_adverse_events: string[];
}

export default function Medications() {
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
      setFilteredMeds(filtered.slice(0, 10)); // Limitar a 10 resultados
    } else {
      setFilteredMeds([]);
    }
  }, [searchTerm, medications]);

  const loadMedications = async () => {
    try {
      const { data, error } = await supabase
        .from('oncology_meds' as any)
        .select('id, drug_name_inn_dcb, drug_class, strengths, dosage_forms, route, indications_oncology, common_adverse_events')
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
    setSelectedStrength('');
    setDose('');
    setFrequency('');
    setInstructions('');
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
      const medicationData = {
        name: selectedMed.drug_name_inn_dcb,
        active_ingredient: selectedMed.drug_name_inn_dcb,
        concentration: selectedStrength || null,
        form: selectedMed.dosage_forms?.[0] || null,
        route: selectedMed.route?.[0] || null,
      };

      const { id: medicationId } = await MedicationService.saveMedication(medicationData);
      await MedicationService.linkToUser(medicationId, dose, frequency, instructions);
      await MedicationService.addTimelineEvent(
        'medication_added',
        `Medicamento adicionado: ${selectedMed.drug_name_inn_dcb}`,
        `Concentração: ${selectedStrength || 'Não especificada'}\nDose: ${dose || 'Não especificada'}\nFrequência: ${frequency || 'Não especificada'}`
      );

      toast({
        title: 'Sucesso!',
        description: 'Medicamento salvo com sucesso.',
      });

      setSelectedMed(null);
      setSelectedStrength('');
      setDose('');
      setFrequency('');
      setInstructions('');
      setSearchTerm('');
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
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5 p-4 pb-20">
      <div className="container mx-auto max-w-2xl space-y-6">
        <div className="flex items-center gap-4 pt-4">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Medicamentos
            </h1>
            <p className="text-sm text-muted-foreground">Busque e adicione medicamentos oncológicos</p>
          </div>
        </div>

        <Card className="luxury-card border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              Buscar Medicamento
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Digite o nome do medicamento ou classe terapêutica
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="search">Nome do Medicamento</Label>
              <Input
                id="search"
                placeholder="Ex: Paclitaxel, Cisplatina, Trastuzumabe..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={isLoading}
                className="text-base"
              />
            </div>

            {isLoading && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-sm text-muted-foreground mt-2">Carregando medicamentos...</p>
              </div>
            )}

            {filteredMeds.length > 0 && (
              <div className="border rounded-lg max-h-96 overflow-y-auto">
                {filteredMeds.map((med) => (
                  <button
                    key={med.id}
                    onClick={() => handleSelectMedication(med)}
                    className="w-full p-4 text-left hover:bg-accent transition-colors border-b last:border-b-0 group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                        <Pill className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-base">{med.drug_name_inn_dcb}</div>
                        {med.drug_class && (
                          <div className="text-sm text-muted-foreground mt-1">{med.drug_class}</div>
                        )}
                        {med.indications_oncology && med.indications_oncology.length > 0 && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {med.indications_oncology.slice(0, 2).join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {selectedMed && (
              <Card className="border-2 border-green-200 bg-green-50 dark:bg-green-950/20">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="font-semibold text-green-900 dark:text-green-100 text-lg">
                        {selectedMed.drug_name_inn_dcb}
                      </div>
                      {selectedMed.drug_class && (
                        <div className="text-sm text-green-700 dark:text-green-300 mt-1">
                          {selectedMed.drug_class}
                        </div>
                      )}
                      {selectedMed.indications_oncology && selectedMed.indications_oncology.length > 0 && (
                        <div className="text-sm text-green-700 dark:text-green-300 mt-2">
                          <strong>Indicações:</strong> {selectedMed.indications_oncology.join(', ')}
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
          <Card className="luxury-card border-2 border-secondary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-secondary-accent" />
                Informações de Dosagem
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Preencha as informações sobre como você utiliza este medicamento
              </p>
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
                  placeholder="Ex: 100mg, 200mg/m²"
                  value={dose}
                  onChange={(e) => setDose(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="frequency">Frequência</Label>
                <Input
                  id="frequency"
                  placeholder="Ex: 1x ao dia, a cada 21 dias, semanal"
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instructions">Instruções Adicionais</Label>
                <Textarea
                  id="instructions"
                  placeholder="Observações, cuidados especiais, horários específicos, etc."
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  rows={4}
                />
              </div>

              <Button 
                onClick={handleSave} 
                disabled={isSaving} 
                className="w-full h-12 text-base font-semibold"
              >
                {isSaving ? 'Salvando...' : 'Salvar Medicamento'}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
