import React, { useState } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Camera, Type, Upload, AlertCircle } from 'lucide-react';
import { useQRScanner } from '@/hooks/useQRScanner';

interface SimpleQRScannerProps {
  onScanComplete: (data: any) => void;
  onError: (error: string) => void;
}

export const SimpleQRScanner: React.FC<SimpleQRScannerProps> = ({
  onScanComplete,
  onError,
}) => {
  const { parseQRData } = useQRScanner();
  const [scannerMode, setScannerMode] = useState<'camera' | 'text' | 'file'>('camera');
  const [manualInput, setManualInput] = useState('');
  const [cameraError, setCameraError] = useState(false);

  const handleScan = async (result: any) => {
    try {
      console.log('QR Code detectado (raw):', result);
      console.log('Tipo:', typeof result);
      
      // Se result é um array, pegar o primeiro item
      let data = result;
      if (Array.isArray(result) && result.length > 0) {
        data = result[0].rawValue || result[0].data || result[0];
      }
      
      // Se result é um objeto, tentar pegar rawValue ou data
      if (typeof result === 'object' && result !== null && !Array.isArray(result)) {
        data = result.rawValue || result.data || JSON.stringify(result);
      }
      
      console.log('Dados extraídos:', data);
      
      if (data && typeof data === 'string') {
        const parsedData = await parseQRData(data);
        if (parsedData) {
          onScanComplete(parsedData);
        } else {
          onError('QR Code não reconhecido');
        }
      } else {
        onError('QR Code sem dados válidos: ' + typeof data);
      }
    } catch (error: any) {
      console.error('Erro ao processar QR Code:', error);
      onError(error.message || 'Erro ao processar QR Code');
    }
  };

  const handleScanError = (error: Error) => {
    console.error('Erro do scanner:', error);
    setCameraError(true);
  };

  const handleManualInput = async () => {
    if (!manualInput.trim()) {
      onError('Digite o conteúdo do QR Code');
      return;
    }

    try {
      const parsedData = await parseQRData(manualInput);
      if (parsedData) {
        onScanComplete(parsedData);
      } else {
        onError('Formato não reconhecido');
      }
    } catch (error: any) {
      onError(error.message || 'Erro ao processar dados');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Por enquanto, simular com dados demo
    try {
      const parsedData = await parseQRData('demo');
      if (parsedData) {
        onScanComplete(parsedData);
      }
    } catch (error: any) {
      onError('Não foi possível processar a imagem');
    }
  };

  // Modo de entrada manual de texto
  if (scannerMode === 'text') {
    return (
      <Card className="clean-card">
        <CardContent className="p-6 space-y-4">
          <div className="text-center space-y-2">
            <Type className="h-12 w-12 text-primary mx-auto" />
            <h3 className="font-semibold">Entrada Manual</h3>
            <p className="text-sm text-muted-foreground">
              Cole ou digite o conteúdo do QR Code
            </p>
          </div>
          
          <div className="space-y-3">
            <Input
              placeholder="Cole aqui o conteúdo do QR Code..."
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              className="min-h-[80px] resize-none"
            />
            
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => setScannerMode('camera')}>
                <Camera className="h-4 w-4 mr-2" />
                Câmera
              </Button>
              <Button onClick={handleManualInput} disabled={!manualInput.trim()}>
                Processar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Modo de upload de arquivo
  if (scannerMode === 'file') {
    return (
      <Card className="clean-card">
        <CardContent className="p-6 space-y-4">
          <div className="text-center space-y-2">
            <Upload className="h-12 w-12 text-primary mx-auto" />
            <h3 className="font-semibold">Upload de Imagem</h3>
            <p className="text-sm text-muted-foreground">
              Selecione uma imagem com QR Code
            </p>
          </div>
          
          <div className="space-y-3">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              Selecionar Imagem
            </Button>
            
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => setScannerMode('camera')}>
                <Camera className="h-4 w-4 mr-2" />
                Câmera
              </Button>
              <Button variant="outline" onClick={() => setScannerMode('text')}>
                <Type className="h-4 w-4 mr-2" />
                Digitar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Modo câmera
  return (
    <Card className="clean-card overflow-hidden">
      <CardContent className="p-0 h-full relative">
        {cameraError ? (
          <div className="flex items-center justify-center h-96 bg-gradient-to-br from-muted to-muted/50">
            <div className="text-center space-y-4">
              <AlertCircle className="h-16 w-16 text-destructive mx-auto" />
              <div>
                <p className="font-medium text-destructive">Câmera não disponível</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Use uma das opções alternativas:
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => setScannerMode('text')}>
                  <Type className="h-4 w-4 mr-2" />
                  Digitar
                </Button>
                <Button variant="outline" onClick={() => setScannerMode('file')}>
                  <Upload className="h-4 w-4 mr-2" />
                  Imagem
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative h-96">
            <Scanner
              onScan={handleScan}
              onError={handleScanError}
              constraints={{
                facingMode: 'environment'
              }}
              styles={{
                container: {
                  width: '100%',
                  height: '100%'
                },
                video: {
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }
              }}
            />
            
            {/* Overlay de scanning */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-64 h-64 border-2 border-white/70 rounded-lg relative">
                <div className="absolute -top-2 -left-2 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg"></div>
                <div className="absolute -top-2 -right-2 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg"></div>
                <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg"></div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg"></div>
              </div>
            </div>
            
            <div className="absolute top-2 right-2 space-x-1">
              <Button variant="ghost" size="sm" onClick={() => setScannerMode('text')}>
                <Type className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setScannerMode('file')}>
                <Upload className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
              <div className="bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                Posicione o QR Code na área marcada
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};