import { useState, useEffect } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  CheckCircle, 
  AlertCircle, 
  ExternalLink, 
  Camera, 
  Settings,
  Smartphone,
  Search,
  Plus,
  FileText
} from 'lucide-react';
import { useAutoScanner } from '../hooks/useAutoScanner';
import { MedicationDataDisplay } from '../components/MedicationDataDisplay';
import { supabase } from '../integrations/supabase/client';
import { useToast } from '../hooks/use-toast';
import { MedicationService } from '../services/medicationService';

interface OncologyMed {
  id: string;
  drug_name_inn_dcb: string;
  drug_class: string;
  strengths: string[];
  dosage_forms: string[];
  route: string[];
}

export default function ScanMed() {
  const [manualInput, setManualInput] = useState('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showDataDisplay, setShowDataDisplay] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { handleScan, processManualCode, isProcessing, lastScan } = useAutoScanner();
  
  // Manual medication entry states
  const [searchTerm, setSearchTerm] = useState('');
  const [medications, setMedications] = useState<OncologyMed[]>([]);
  const [filteredMeds, setFilteredMeds] = useState<OncologyMed[]>([]);
  const [selectedMed, setSelectedMed] = useState<OncologyMed | null>(null);
  const [isLoadingMeds, setIsLoadingMeds] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form fields for medication entry
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
      setIsLoadingMeds(false);
    }
  };

  const handleSelectMedication = (med: OncologyMed) => {
    setSelectedMed(med);
    setSearchTerm('');
    setFilteredMeds([]);
    // Reset form fields
    setSelectedStrength('');
    setDose('');
    setFrequency('');
    setInstructions('');
  };

  const handleSaveMedication = async () => {
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

      // Reset selection and form
      setSelectedMed(null);
      setSelectedStrength('');
      setDose('');
      setFrequency('');
      setInstructions('');
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

  const handleCameraError = (error: any) => {
    console.error('Scanner error:', error);
    
    if (error?.name === 'NotAllowedError' || error?.message?.includes('Permission denied')) {
      setCameraError('permission');
    } else if (error?.name === 'NotFoundError' || error?.message?.includes('No camera found')) {
      setCameraError('notfound');
    } else {
      setCameraError('generic');
    }
  };

  const renderCameraError = () => {
    if (!cameraError) return null;

    const errorMessages = {
      permission: {
        title: "Permissão da câmera negada",
        description: "Para usar o scanner, você precisa permitir o acesso à câmera.",
        instructions: [
          "Clique no ícone de câmera na barra de endereço do navegador",
          "Selecione 'Sempre permitir' para este site",
          "Recarregue a página e tente novamente"
        ]
      },
      notfound: {
        title: "Câmera não encontrada",
        description: "Não foi possível detectar uma câmera no seu dispositivo.",
        instructions: [
          "Verifique se sua câmera está conectada",
          "Tente usar outro dispositivo com câmera",
          "Use a entrada manual como alternativa"
        ]
      },
      generic: {
        title: "Erro na câmera",
        description: "Ocorreu um problema ao acessar a câmera.",
        instructions: [
          "Feche outros aplicativos que podem estar usando a câmera",
          "Recarregue a página",
          "Use a entrada manual como alternativa"
        ]
      }
    };

    const error = errorMessages[cameraError as keyof typeof errorMessages];

    return (
      <Alert className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-3">
            <div>
              <p className="font-medium">{error.title}</p>
              <p className="text-sm text-muted-foreground">{error.description}</p>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Como resolver:</p>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                {error.instructions.map((instruction, index) => (
                  <li key={index}>{instruction}</li>
                ))}
              </ol>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setCameraError(null);
                  window.location.reload();
                }}
              >
                <Camera className="h-4 w-4 mr-2" />
                Tentar Novamente
              </Button>
              {cameraError === 'permission' && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    // Open browser settings (works in some browsers)
                    if (navigator.permissions) {
                      navigator.permissions.query({name: 'camera' as PermissionName})
                        .then(() => {
                          alert('Vá para as configurações do navegador e permita o acesso à câmera');
                        });
                    }
                  }}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Configurações
                </Button>
              )}
            </div>
          </div>
        </AlertDescription>
      </Alert>
    );
  };

  const renderScanResult = () => {
    if (!lastScan) return null;
    
    if (lastScan.type === 'url') {
      // Automatically show MedicationDataDisplay when data is extracted
      if (lastScan.data.extracted && lastScan.data.extracted.name) {
        return (
          <MedicationDataDisplay 
            extractedData={lastScan.data.extracted}
            sourceUrl={lastScan.data.url}
            onClose={() => {
              setShowDataDisplay(false);
              // Optionally navigate back or clear scan
            }}
          />
        );
      }
      
      // Fallback for URLs without extracted data
      return (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-amber-700 dark:text-amber-300">
              <ExternalLink className="h-5 w-5" />
              Link Processado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p><strong>URL:</strong> <span className="text-xs break-all">{lastScan.data.url}</span></p>
              <p className="text-amber-600 dark:text-amber-400">
                Não foi possível extrair dados automaticamente desta página.
              </p>
              <p className="text-muted-foreground">
                A página foi aberta em uma nova aba. Você pode copiar as informações manualmente.
              </p>
            </div>
          </CardContent>
        </Card>
      );
    }
    
    if (lastScan.type === 'gs1') {
      return (
        <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-green-700 dark:text-green-300">
              <CheckCircle className="h-5 w-5" />
              Medicamento Registrado Automaticamente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {lastScan.data.parsed.gtin && (
                <p><strong>GTIN:</strong> {lastScan.data.parsed.gtin}</p>
              )}
              {lastScan.data.parsed.expiry && (
                <p><strong>Validade:</strong> {lastScan.data.parsed.expiry}</p>
              )}
              {lastScan.data.parsed.lot && (
                <p><strong>Lote:</strong> {lastScan.data.parsed.lot}</p>
              )}
              {lastScan.data.parsed.serial && (
                <p><strong>Série:</strong> {lastScan.data.parsed.serial}</p>
              )}
              {lastScan.data.parsed.anvisa && (
                <p><strong>Registro ANVISA:</strong> {lastScan.data.parsed.anvisa}</p>
              )}
            </div>
          </CardContent>
        </Card>
      );
    }
    
    if (lastScan.type === 'error') {
      return (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-red-700 dark:text-red-300">
              <AlertCircle className="h-5 w-5" />
              Erro no Processamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-600 dark:text-red-400">{lastScan.error}</p>
          </CardContent>
        </Card>
      );
    }
    
    return null;
  };

  const handleManualScan = async () => {
    if (!manualInput.trim()) return;
    
    const result = await processManualCode(manualInput.trim());
    if (result && result.type !== 'error') {
      setManualInput('');
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => navigate('/scanner')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold">Escanear Medicamento</h1>
      </div>

      {renderCameraError()}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Scanner Automático de Códigos
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Aponte a câmera para o código. O processamento será automático e silencioso.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {!cameraError && (
            <div className="relative">
              <Scanner
                onScan={handleScan}
                onError={handleCameraError}
                formats={['data_matrix', 'qr_code']}
                paused={isProcessing}
                constraints={{ facingMode: 'environment' }}
                components={{ torch: true, zoom: true, finder: true }}
                scanDelay={100}
                allowMultiple={false}
              />
              {isProcessing && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                  <div className="text-white text-lg">Processando automaticamente...</div>
                </div>
              )}
            </div>
          )}

          {renderScanResult()}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Entrada Manual de Código</CardTitle>
          <p className="text-sm text-muted-foreground">
            Use esta opção se a câmera não funcionar ou para códigos copiados
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Cole aqui um código GS1 (ex.: (01)07898987654321(17)251231(10)L123(21)ABC) ou uma URL"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            className="min-h-[100px]"
          />
          <Button 
            onClick={handleManualScan} 
            disabled={!manualInput.trim() || isProcessing}
            className="w-full"
          >
            Processar Código Manual
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Adicionar Medicamento Manualmente
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Pesquise e selecione um medicamento da lista para adicionar
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="search">Nome do Medicamento</Label>
            <Input
              id="search"
              placeholder="Digite o nome do medicamento ou classe terapêutica..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={isLoadingMeds}
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
            <>
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

              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Plus className="h-4 w-4" />
                  Informações de Dosagem
                </div>

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

                <Button onClick={handleSaveMedication} disabled={isSaving} className="w-full">
                  {isSaving ? 'Salvando...' : 'Salvar Medicamento'}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}