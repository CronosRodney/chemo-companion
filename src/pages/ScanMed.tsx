import { useMemo, useState } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { useAutoScanner } from '../hooks/useAutoScanner';

export default function ScanMed() {
  const [manualInput, setManualInput] = useState('');
  const formats = useMemo(() => (['data_matrix', 'qr_code'] as const), []);
  const navigate = useNavigate();
  const { handleScan, processManualCode, isProcessing, lastScan } = useAutoScanner();

  const renderScanResult = () => {
    if (!lastScan) return null;
    
    if (lastScan.type === 'url') {
      return (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-blue-700 dark:text-blue-300">
              <ExternalLink className="h-5 w-5" />
              Link Processado Automaticamente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p><strong>URL:</strong> {lastScan.data.url}</p>
              {lastScan.data.extracted?.name && (
                <p><strong>Nome:</strong> {lastScan.data.extracted.name}</p>
              )}
              {lastScan.data.extracted?.activeIngredient && (
                <p><strong>Princípio Ativo:</strong> {lastScan.data.extracted.activeIngredient}</p>
              )}
              {lastScan.data.extracted?.manufacturer && (
                <p><strong>Fabricante:</strong> {lastScan.data.extracted.manufacturer}</p>
              )}
              {lastScan.data.extractionError && (
                <p className="text-amber-600 dark:text-amber-400">
                  <strong>Aviso:</strong> Link aberto, mas houve erro na extração automática de dados
                </p>
              )}
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

      <Card>
        <CardHeader>
          <CardTitle>Scanner Automático de Códigos</CardTitle>
          <p className="text-sm text-muted-foreground">
            Aponte a câmera para o código. O processamento será automático e silencioso.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Scanner
              onScan={handleScan}
              onError={(e) => console.error('Scanner error:', e)}
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

          {renderScanResult()}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Entrada Manual</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Cole aqui um código GS1 (ex.: (01)07898987654321(17)251231(10)L123(21)ABC)"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            className="min-h-[100px]"
          />
          <Button 
            onClick={handleManualScan} 
            disabled={!manualInput.trim()}
            className="w-full"
          >
            Processar Código Manual
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}