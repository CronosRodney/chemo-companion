import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QrCode, Camera, ArrowLeft, CheckCircle, Building2, Pill } from "lucide-react";
import { useState } from "react";

const QRScanner = () => {
  const [scanResult, setScanResult] = useState<null | {
    type: 'clinic' | 'medication';
    data: any;
  }>(null);

  const handleScanSuccess = (result: string) => {
    // Simulate QR parsing
    try {
      const data = JSON.parse(result);
      setScanResult({
        type: data.type,
        data: data
      });
    } catch {
      // Handle URL-based QR
      setScanResult({
        type: 'clinic',
        data: { clinic_name: 'Clínica Exemplo', regimen: 'FOLFOX' }
      });
    }
  };

  if (scanResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-accent/20 p-4">
        <div className="mx-auto max-w-md space-y-6 pt-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setScanResult(null)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold">QR Code Reconhecido</h1>
          </div>

          <Card className="shadow-lg border-0 bg-gradient-to-r from-success/10 to-success/5">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
              <CardTitle className="text-success">
                {scanResult.type === 'clinic' ? 'Clínica Vinculada' : 'Medicamento Registrado'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {scanResult.type === 'clinic' ? (
                <div className="space-y-3">
                  <div className="p-4 bg-background/60 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Building2 className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-semibold">Hospital São José</p>
                        <p className="text-sm text-muted-foreground">Dr. Maria Santos - Oncologia</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-primary/10 rounded-lg">
                    <p className="font-medium text-primary">Plano de Cuidado</p>
                    <p className="text-sm">FOLFOX - 12 ciclos</p>
                    <p className="text-xs text-muted-foreground">Intervalo: 14 dias</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-4 bg-background/60 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Pill className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-semibold">Oxaliplatina 50mg</p>
                        <p className="text-sm text-muted-foreground">Via: Intravenosa</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-primary/10 rounded-lg">
                    <p className="font-medium text-primary">Dose Prescrita</p>
                    <p className="text-sm">85 mg/m²</p>
                    <p className="text-xs text-muted-foreground">Lote: L2025-09-A | Val: 31/03/2026</p>
                  </div>
                </div>
              )}
              
              <div className="pt-4">
                <Button variant="medical" className="w-full" size="lg">
                  Confirmar e Salvar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20 p-4">
      <div className="mx-auto max-w-md space-y-6 pt-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Escanear QR Code</h1>
        </div>

        {/* Camera View Simulation */}
        <Card className="shadow-lg border-0 aspect-square">
          <CardContent className="p-0 h-full">
            <div className="relative h-full bg-gradient-to-br from-muted to-muted/50 rounded-lg flex items-center justify-center">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-48 border-4 border-primary rounded-lg border-dashed opacity-60 animate-pulse">
                  <div className="absolute -top-2 -left-2 w-6 h-6 border-l-4 border-t-4 border-primary rounded-tl-lg"></div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 border-r-4 border-t-4 border-primary rounded-tr-lg"></div>
                  <div className="absolute -bottom-2 -left-2 w-6 h-6 border-l-4 border-b-4 border-primary rounded-bl-lg"></div>
                  <div className="absolute -bottom-2 -right-2 w-6 h-6 border-r-4 border-b-4 border-primary rounded-br-lg"></div>
                </div>
              </div>
              <Camera className="h-16 w-16 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>

        <div className="text-center space-y-2">
          <p className="font-medium">Posicione o QR Code na área marcada</p>
          <p className="text-sm text-muted-foreground">
            Escaneie QR Codes da clínica ou medicamentos para registrar automaticamente
          </p>
        </div>

        {/* Sample QR Types */}
        <div className="space-y-3">
          <Card className="shadow-md border-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium text-sm">QR da Clínica</p>
                  <p className="text-xs text-muted-foreground">Vincula oncologista e plano de cuidado</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md border-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Pill className="h-5 w-5 text-secondary-accent" />
                <div>
                  <p className="font-medium text-sm">QR do Medicamento</p>
                  <p className="text-xs text-muted-foreground">Registra dose, lote e cria lembretes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Demo Button */}
        <Button 
          variant="outline" 
          className="w-full" 
          onClick={() => handleScanSuccess('{"type":"clinic","clinic_name":"Hospital São José"}')}
        >
          <QrCode className="h-4 w-4 mr-2" />
          Simular Scan (Demo)
        </Button>
      </div>
    </div>
  );
};

export default QRScanner;