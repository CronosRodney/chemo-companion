import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, AlertCircle } from 'lucide-react';
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
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    
    const initCamera = async () => {
      if (hasPermission === null && isMounted) {
        await requestCameraPermission();
      }
    };
    
    initCamera();
    
    return () => {
      isMounted = false;
    };
  }, [hasPermission, requestCameraPermission]);

  useEffect(() => {
    let mounted = true;
    
    const initScanner = async () => {
      if (hasPermission && !scanned && !loading && elementRef.current && mounted) {
        try {
          const config = {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            rememberLastUsedCamera: true,
            supportedScanTypes: [0], // Only QR codes
          };

          // Wait a bit to ensure the element is ready
          await new Promise(resolve => setTimeout(resolve, 100));
          
          if (!mounted || !elementRef.current) return;

          scannerRef.current = new Html5QrcodeScanner(
            'qr-reader',
            config,
            false
          );

          const onScanSuccess = async (decodedText: string) => {
            if (!mounted) return;
            
            try {
              if (scannerRef.current) {
                await scannerRef.current.clear();
              }
              
              const result = await handleBarCodeScanned({ data: decodedText });
              if (mounted) {
                onScanComplete(result);
              }
            } catch (error: any) {
              if (mounted) {
                onError(error.message || 'Erro ao processar QR Code');
                resetScanner();
              }
            }
          };

          const onScanFailure = (error: string) => {
            // Silently handle scan failures to avoid console spam
            if (error && !error.includes('No QR code found')) {
              console.log(`QR scan info: ${error}`);
            }
          };

          scannerRef.current.render(onScanSuccess, onScanFailure);
        } catch (error) {
          console.error('Erro ao inicializar scanner:', error);
          if (mounted) {
            onError('Erro ao inicializar o scanner');
          }
        }
      }
    };

    initScanner();

    return () => {
      mounted = false;
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {
          // Ignore cleanup errors
        });
      }
    };
  }, [hasPermission, scanned, loading, handleBarCodeScanned, onScanComplete, onError, resetScanner]);

  if (hasPermission === null) {
    return (
      <Card className="luxury-card">
        <CardContent className="flex items-center justify-center h-48">
          <p className="text-muted-foreground">Solicitando permissão da câmera...</p>
        </CardContent>
      </Card>
    );
  }

  if (hasPermission === false) {
    return (
      <Card className="luxury-card border-destructive/20">
        <CardContent className="flex flex-col items-center justify-center h-48 space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
            <div className="text-center">
              <p className="font-semibold text-destructive">Acesso à câmera negado</p>
              <p className="text-sm text-muted-foreground mb-4">
                Para usar o scanner QR, permita acesso à câmera:
              </p>
               <div className="text-xs text-muted-foreground space-y-1 mb-4">
                <p>• Clique no ícone de câmera na barra de endereços</p>
                <p>• Selecione "Permitir" ou "Allow" para câmera</p>
                <p>• Ou vá em Configurações do navegador {'>'} Site {'>'} Câmera</p>
                <p>• Recarregue a página após permitir</p>
              </div>
            </div>
          <Button variant="outline" onClick={requestCameraPermission}>
            <Camera className="h-4 w-4 mr-2" />
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="luxury-card overflow-hidden">
      <CardContent className="p-0 h-full relative">
        {scanned || loading ? (
          <div className="flex items-center justify-center h-96 bg-gradient-to-br from-muted to-muted/50">
            <div className="text-center space-y-4">
              <Camera className="h-16 w-16 text-muted-foreground mx-auto" />
              <p className="font-medium">
                {loading ? 'Processando...' : 'QR Code escaneado!'}
              </p>
              {!loading && (
                <Button variant="outline" onClick={resetScanner}>
                  Escanear novamente
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="relative">
            <div id="qr-reader" ref={elementRef} className="w-full" />
          </div>
        )}
      </CardContent>
    </Card>
  );
};