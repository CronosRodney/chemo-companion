import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Camera, Type, Upload } from 'lucide-react';
import { useQRScanner } from '@/hooks/useQRScanner';

interface QRCodeScannerProps {
  onScanComplete: (data: any) => void;
  onError: (error: string) => void;
}

export const QRCodeScanner: React.FC<QRCodeScannerProps> = ({
  onScanComplete,
  onError,
}) => {
  const { handleBarCodeScanned } = useQRScanner();
  const [scannerMode, setScannerMode] = useState<'camera' | 'text' | 'file'>('camera');
  const [manualInput, setManualInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let mounted = true;
    
    const initCamera = async () => {
      if (scannerMode !== 'camera' || isScanning) return;

      try {
        console.log('Iniciando câmera...');
        setIsScanning(true);
        setCameraError(false);
        
        // Aguardar elemento estar pronto
        await new Promise(resolve => setTimeout(resolve, 300));
        
        if (!mounted) return;
        
        const elementId = 'qr-reader';
        const element = document.getElementById(elementId);
        
        if (!element) {
          throw new Error('Elemento scanner não encontrado');
        }
        
        if (scannerRef.current) {
          try {
            await scannerRef.current.stop();
          } catch (e) {
            // Ignorar erro ao parar scanner anterior
          }
        }
        
        scannerRef.current = new Html5Qrcode(elementId);
        
        const onScanSuccess = async (decodedText: string) => {
          if (!mounted) return;
          
          console.log('QR Code lido:', decodedText);
          
          try {
            if (scannerRef.current?.isScanning) {
              await scannerRef.current.stop();
            }
            
            const result = await handleBarCodeScanned({ data: decodedText });
            if (mounted) {
              onScanComplete(result);
            }
          } catch (error: any) {
            console.error('Erro ao processar QR:', error);
            if (mounted) {
              onError(error.message || 'Erro ao processar QR Code');
            }
          }
        };

        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        };

        // Tentar iniciar câmera
        try {
          await scannerRef.current.start(
            { facingMode: "environment" },
            config,
            onScanSuccess,
            () => {} // Ignorar erros de leitura
          );
          console.log('Câmera iniciada com sucesso!');
        } catch (error1) {
          console.log('Tentando câmera frontal...');
          try {
            await scannerRef.current.start(
              { facingMode: "user" },
              config,
              onScanSuccess,
              () => {}
            );
            console.log('Câmera frontal iniciada!');
          } catch (error2) {
            console.log('Tentando qualquer câmera...');
            const cameras = await Html5Qrcode.getCameras();
            if (cameras && cameras.length > 0) {
              await scannerRef.current.start(
                cameras[0].id,
                config,
                onScanSuccess,
                () => {}
              );
              console.log('Primeira câmera iniciada!');
            } else {
              throw new Error('Nenhuma câmera disponível');
            }
          }
        }
        
      } catch (error: any) {
        console.error('Erro na câmera:', error);
        if (mounted) {
          setCameraError(true);
          setIsScanning(false);
        }
      }
    };

    initCamera();

    return () => {
      mounted = false;
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
      setIsScanning(false);
    };
  }, [scannerMode, handleBarCodeScanned, onScanComplete, onError]);

  const handleManualInput = async () => {
    if (!manualInput.trim()) {
      onError('Digite o conteúdo do QR Code');
      return;
    }

    try {
      const result = await handleBarCodeScanned({ data: manualInput });
      onScanComplete(result);
    } catch (error: any) {
      onError(error.message || 'Erro ao processar dados');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const html5QrCode = new Html5Qrcode('file-scanner');
      const result = await html5QrCode.scanFile(file, true);
      await html5QrCode.clear();
      
      const processedResult = await handleBarCodeScanned({ data: result });
      onScanComplete(processedResult);
    } catch (error: any) {
      onError('Não foi possível ler o QR Code da imagem');
    }
  };

  // Modo de entrada manual de texto
  if (scannerMode === 'text') {
    return (
      <Card className="luxury-card">
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
      <Card className="luxury-card">
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
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => fileInputRef.current?.click()}
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
    <Card className="luxury-card overflow-hidden">
      <CardContent className="p-0 h-full relative">
        {cameraError ? (
          <div className="flex items-center justify-center h-96 bg-gradient-to-br from-muted to-muted/50">
            <div className="text-center space-y-4">
              <Camera className="h-16 w-16 text-muted-foreground mx-auto" />
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
            <div id="qr-reader" className="w-full h-full" />
            <div className="absolute top-2 right-2 space-x-1">
              <Button variant="ghost" size="sm" onClick={() => setScannerMode('text')}>
                <Type className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setScannerMode('file')}>
                <Upload className="h-4 w-4" />
              </Button>
            </div>
            {isScanning && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                  Posicione o QR Code na área marcada
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};