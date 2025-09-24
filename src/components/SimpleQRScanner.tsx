import React, { useRef, useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Camera, Type, Upload } from 'lucide-react';
import { useQRScanner } from '@/hooks/useQRScanner';

interface SimpleQRScannerProps {
  onScanComplete: (data: any) => void;
  onError: (error: string) => void;
}

export const SimpleQRScanner: React.FC<SimpleQRScannerProps> = ({
  onScanComplete,
  onError,
}) => {
  const { handleBarCodeScanned } = useQRScanner();
  const [scannerMode, setScannerMode] = useState<'camera' | 'text' | 'file'>('camera');
  const [manualInput, setManualInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout>();

  // Função para detectar QR codes no canvas
  const detectQRCode = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    try {
      // Usar a API nativa do navegador se disponível
      if ('BarcodeDetector' in window) {
        const barcodeDetector = new (window as any).BarcodeDetector({
          formats: ['qr_code']
        });
        
        const barcodes = await barcodeDetector.detect(canvas);
        
        if (barcodes.length > 0) {
          const qrCode = barcodes[0];
          console.log('QR Code detectado:', qrCode.rawValue);
          
          // Parar o scanner
          stopCamera();
          
          try {
            const result = await handleBarCodeScanned({ data: qrCode.rawValue });
            onScanComplete(result);
          } catch (error: any) {
            onError(error.message || 'Erro ao processar QR Code');
            startCamera(); // Reiniciar câmera em caso de erro
          }
        }
      }
    } catch (error) {
      // Ignorar erros de detecção - são normais quando não há QR code
    }
  };

  const startCamera = async () => {
    try {
      console.log('Iniciando câmera...');
      setIsScanning(true);
      setCameraError(false);

      // Parar stream anterior se existir
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      // Tentar obter stream da câmera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' }, // Preferir câmera traseira
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        
        // Iniciar detecção a cada 500ms
        scanIntervalRef.current = setInterval(detectQRCode, 500);
        
        console.log('Câmera iniciada com sucesso!');
      }
    } catch (error: any) {
      console.error('Erro ao iniciar câmera:', error);
      setCameraError(true);
      setIsScanning(false);
      
      // Tentar com câmera frontal como fallback
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 480 }
          }
        });

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          
          scanIntervalRef.current = setInterval(detectQRCode, 500);
          
          console.log('Câmera frontal iniciada!');
          setCameraError(false);
          setIsScanning(true);
        }
      } catch (frontError) {
        console.error('Erro com câmera frontal:', frontError);
        setCameraError(true);
        setIsScanning(false);
      }
    }
  };

  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsScanning(false);
  };

  useEffect(() => {
    if (scannerMode === 'camera' && !cameraError) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [scannerMode]);

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
      // Criar uma imagem para carregar o arquivo
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Não foi possível criar contexto do canvas');
      }

      img.onload = async () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        try {
          if ('BarcodeDetector' in window) {
            const barcodeDetector = new (window as any).BarcodeDetector({
              formats: ['qr_code']
            });
            
            const barcodes = await barcodeDetector.detect(canvas);
            
            if (barcodes.length > 0) {
              const result = await handleBarCodeScanned({ data: barcodes[0].rawValue });
              onScanComplete(result);
            } else {
              onError('Nenhum QR Code encontrado na imagem');
            }
          } else {
            onError('Detecção de QR Code não suportada neste navegador');
          }
        } catch (error) {
          onError('Erro ao processar imagem');
        }
      };

      img.src = URL.createObjectURL(file);
    } catch (error: any) {
      onError('Não foi possível ler a imagem');
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
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
            />
            <canvas
              ref={canvasRef}
              className="hidden"
            />
            
            {/* Overlay de scanning */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-64 h-64 border-2 border-white/50 rounded-lg">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg"></div>
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