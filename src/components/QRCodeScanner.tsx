import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Camera, AlertCircle, Type, Upload } from 'lucide-react';
import { useQRScanner } from '@/hooks/useQRScanner';

interface QRCodeScannerProps {
  onScanComplete: (data: any) => void;
  onError: (error: string) => void;
}

export const QRCodeScanner: React.FC<QRCodeScannerProps> = ({
  onScanComplete,
  onError,
}) => {
  const { hasPermission, scanned, loading, handleBarCodeScanned, resetScanner, requestCameraPermission } = useQRScanner();
  const [scannerMode, setScannerMode] = useState<'camera' | 'text' | 'file'>('camera');
  const [manualInput, setManualInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let isMounted = true;
    
    const initCamera = async () => {
      if (hasPermission === null && isMounted && scannerMode === 'camera') {
        await requestCameraPermission();
      }
    };
    
    initCamera();
    
    return () => {
      isMounted = false;
    };
  }, [hasPermission, requestCameraPermission, scannerMode]);

  useEffect(() => {
    let mounted = true;
    let scanner: Html5Qrcode | null = null;
    
    const initializeScanner = async () => {
      if (!hasPermission || scanned || loading || isScanning || !elementRef.current || !mounted || scannerMode !== 'camera') {
        return;
      }

      try {
        console.log('Inicializando scanner...');
        setIsScanning(true);
        
        // Garantir que o elemento DOM existe e está visível
        if (!elementRef.current || !document.getElementById('qr-reader')) {
          console.error('Elemento qr-reader não encontrado');
          throw new Error('Elemento scanner não encontrado');
        }
        
        // Aguardar um momento para garantir que o DOM está pronto
        await new Promise(resolve => setTimeout(resolve, 200));
        
        if (!mounted) return;
        
        scanner = new Html5Qrcode('qr-reader');
        
        const qrCodeSuccessCallback = async (decodedText: string) => {
          if (!mounted) return;
          
          console.log('QR Code detectado:', decodedText);
          
          try {
            if (scanner?.isScanning) {
              await scanner.stop();
            }
            
            const result = await handleBarCodeScanned({ data: decodedText });
            if (mounted) {
              onScanComplete(result);
              setIsScanning(false);
            }
          } catch (error: any) {
            console.error('Erro ao processar QR Code:', error);
            if (mounted) {
              onError(error.message || 'Erro ao processar QR Code');
              resetScanner();
              setIsScanning(false);
            }
          }
        };

        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        };

        // Tentar com facingMode primeiro (mais compatível)
        try {
          console.log('Tentando iniciar com facingMode...');
          await scanner.start(
            { facingMode: "environment" },
            config,
            qrCodeSuccessCallback,
            () => {} // Ignorar erros de scan
          );
          console.log('Scanner iniciado com sucesso!');
        } catch (envError) {
          console.log('Erro com environment, tentando user...', envError);
          try {
            await scanner.start(
              { facingMode: "user" },
              config,
              qrCodeSuccessCallback,
              () => {} // Ignorar erros de scan
            );
            console.log('Scanner iniciado com câmera frontal!');
          } catch (userError) {
            console.error('Erro com ambas facingModes, tentando getCameras...', userError);
            
            // Último recurso: tentar lista de câmeras
            try {
              const cameras = await Html5Qrcode.getCameras();
              if (cameras && cameras.length > 0) {
                await scanner.start(
                  cameras[0].id,
                  config,
                  qrCodeSuccessCallback,
                  () => {} // Ignorar erros de scan
                );
                console.log('Scanner iniciado com primeira câmera disponível!');
              } else {
                throw new Error('Nenhuma câmera encontrada');
              }
            } catch (finalError) {
              console.error('Erro final:', finalError);
              throw finalError;
            }
          }
        }
        
      } catch (error: any) {
        console.error('Erro ao inicializar scanner:', error);
        if (mounted) {
          onError(`Erro: ${error.message || 'Falha ao inicializar câmera'}`);
          setIsScanning(false);
        }
      }
    };

    // Aguardar um pouco antes de inicializar para garantir que o DOM está pronto
    const timer = setTimeout(initializeScanner, 100);

    return () => {
      mounted = false;
      clearTimeout(timer);
      if (scanner?.isScanning) {
        scanner.stop().catch(console.error);
      }
      setIsScanning(false);
    };
  }, [hasPermission, scanned, loading, isScanning, handleBarCodeScanned, onScanComplete, onError, resetScanner, scannerMode]);

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

  if (hasPermission === null && scannerMode === 'camera') {
    return (
      <Card className="luxury-card">
        <CardContent className="flex items-center justify-center h-48">
          <p className="text-muted-foreground">Solicitando permissão da câmera...</p>
        </CardContent>
      </Card>
    );
  }

  if (hasPermission === false && scannerMode === 'camera') {
    return (
      <Card className="luxury-card border-destructive/20">
        <CardContent className="flex flex-col items-center justify-center h-48 space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <div className="text-center">
            <p className="font-semibold text-destructive">Câmera não disponível</p>
            <p className="text-sm text-muted-foreground mb-4">
              Tente uma das opções alternativas abaixo:
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 w-full">
            <Button variant="outline" size="sm" onClick={() => setScannerMode('text')}>
              <Type className="h-4 w-4 mr-2" />
              Digitar
            </Button>
            <Button variant="outline" size="sm" onClick={() => setScannerMode('file')}>
              <Upload className="h-4 w-4 mr-2" />
              Imagem
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

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
  // Modo câmera - scanner padrão
  return (
    <Card className="luxury-card overflow-hidden">
      <CardContent className="p-0 h-full relative">
        {scanned || loading ? (
          <div className="flex items-center justify-center h-96 bg-gradient-to-br from-muted to-muted/50">
            <div className="text-center space-y-4">
              <Camera className="h-16 w-16 text-muted-foreground mx-auto" />
              <p className="font-medium">
                {loading ? 'Processando...' : isScanning ? 'Aponte para o QR Code...' : 'QR Code escaneado!'}
              </p>
              {!loading && !isScanning && (
                <div className="space-y-2">
                  <Button variant="outline" onClick={resetScanner}>
                    Escanear novamente
                  </Button>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setScannerMode('text')}>
                      <Type className="h-4 w-4 mr-1" />
                      Digitar
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setScannerMode('file')}>
                      <Upload className="h-4 w-4 mr-1" />
                      Imagem
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="relative h-96">
            <div id="qr-reader" ref={elementRef} className="w-full h-full" />
            <div className="absolute top-2 right-2 space-x-1">
              <Button variant="ghost" size="sm" onClick={() => setScannerMode('text')}>
                <Type className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setScannerMode('file')}>
                <Upload className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};