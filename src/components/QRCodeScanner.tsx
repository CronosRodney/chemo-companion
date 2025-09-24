import React from 'react';
import { BarCodeScanner } from 'expo-barcode-scanner';
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
  const { hasPermission, scanned, loading, handleBarCodeScanned, resetScanner } = useQRScanner();

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
        </CardContent>
      </Card>
    );
  }

  const handleScan = async ({ data }: { data: string }) => {
    if (scanned || loading) return;

    try {
      const result = await handleBarCodeScanned({ data });
      onScanComplete(result);
    } catch (error: any) {
      onError(error.message || 'Erro ao processar QR Code');
      resetScanner();
    }
  };

  return (
    <Card className="luxury-card overflow-hidden aspect-square">
      <CardContent className="p-0 h-full relative">
        {scanned || loading ? (
          <div className="flex items-center justify-center h-full bg-gradient-to-br from-muted to-muted/50">
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
          <>
            <BarCodeScanner
              onBarCodeScanned={handleScan}
              style={{ flex: 1 }}
            />
            
            {/* Overlay de focagem */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-48 border-4 border-primary rounded-lg border-dashed opacity-80 animate-pulse">
                <div className="absolute -top-2 -left-2 w-6 h-6 border-l-4 border-t-4 border-primary rounded-tl-lg"></div>
                <div className="absolute -top-2 -right-2 w-6 h-6 border-r-4 border-t-4 border-primary rounded-tr-lg"></div>
                <div className="absolute -bottom-2 -left-2 w-6 h-6 border-l-4 border-b-4 border-primary rounded-bl-lg"></div>
                <div className="absolute -bottom-2 -right-2 w-6 h-6 border-r-4 border-b-4 border-primary rounded-br-lg"></div>
              </div>
            </div>

            {/* Gradiente de fundo para melhor legibilidade */}
            <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
          </>
        )}
      </CardContent>
    </Card>
  );
};