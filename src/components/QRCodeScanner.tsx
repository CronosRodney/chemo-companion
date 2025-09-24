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
    if (hasPermission === null) {
      requestCameraPermission();
    }
  }, [hasPermission, requestCameraPermission]);

  useEffect(() => {
    if (hasPermission && !scanned && !loading && elementRef.current) {
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      scannerRef.current = new Html5QrcodeScanner(
        elementRef.current.id,
        config,
        false
      );

      const onScanSuccess = async (decodedText: string) => {
        if (scannerRef.current) {
          scannerRef.current.clear();
        }
        
        try {
          const result = await handleBarCodeScanned({ data: decodedText });
          onScanComplete(result);
        } catch (error: any) {
          onError(error.message || 'Erro ao processar QR Code');
          resetScanner();
        }
      };

      const onScanFailure = (error: string) => {
        // Handle scan failure, usually ignore
        console.log(`QR Code scan error: ${error}`);
      };

      scannerRef.current.render(onScanSuccess, onScanFailure);
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
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
            <p className="text-sm text-muted-foreground">
              Permita o acesso à câmera para escanear QR Codes
            </p>
          </div>
          <Button variant="outline" onClick={requestCameraPermission}>
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