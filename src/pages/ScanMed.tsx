import { useState } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  CheckCircle, 
  AlertCircle, 
  ExternalLink, 
  Camera, 
  Settings,
  Smartphone,
  Edit
} from 'lucide-react';
import { useAutoScanner } from '../hooks/useAutoScanner';
import { MedicationDataDisplay } from '../components/MedicationDataDisplay';

export default function ScanMed() {
  const [manualInput, setManualInput] = useState('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showDataDisplay, setShowDataDisplay] = useState(false);
  const navigate = useNavigate();
  const { handleScan, processManualCode, isProcessing, lastScan } = useAutoScanner();

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
          onClick={() => navigate(-1)}
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
          <CardTitle>Entrada Manual</CardTitle>
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
    </div>
  );
}