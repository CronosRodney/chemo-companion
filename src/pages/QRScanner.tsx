import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QrCode, ArrowLeft, CheckCircle, Building2, Pill, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { QRCodeScanner } from "@/components/QRCodeScanner";
import { useToast } from "@/hooks/use-toast";
import { ParsedQRData, ClinicData, MedicationData } from "@/hooks/useQRScanner";

const QRScanner = () => {
  const [scanResult, setScanResult] = useState<ParsedQRData | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const { toast } = useToast();

  const handleScanComplete = (result: ParsedQRData) => {
    setScanResult(result);
    setShowScanner(false);
    toast({
      title: "QR Code escaneado com sucesso!",
      description: `${result.type === 'clinic' ? 'Clínica' : 'Medicamento'} registrado(a) com sucesso.`,
    });
  };

  const handleScanError = (error: string) => {
    toast({
      title: "Erro ao escanear QR Code",
      description: error,
      variant: "destructive",
    });
    setShowScanner(false);
  };

  const handleDemo = () => {
    // Simular dados de uma clínica para demonstração
    const demoClinicData: ParsedQRData = {
      type: 'clinic',
      data: {
        clinic_name: 'Hospital São José',
        legal_name: 'Hospital São José Ltda',
        cnpj: '12.345.678/0001-90',
        cnes: '123456',
        address: {
          street: 'Rua das Flores',
          number: '123',
          district: 'Centro',
          city: 'São Paulo',
          state: 'SP',
          zip: '01234-567'
        },
        contacts: {
          phone: '(11) 1234-5678',
          whatsapp: '(11) 99999-9999',
          email: 'contato@hospitalsaojose.com.br',
          website: 'https://hospitalsaojose.com.br'
        },
        hours: 'Seg–Sex 07:00–19:00',
        responsible: {
          name: 'Dr. Maria Santos',
          role: 'Diretor Clínico',
          council: 'CRM',
          council_uf: 'SP',
          registration: '123456',
          email: 'dra.maria@hospitalsaojose.com.br',
          phone: '(11) 1234-5678'
        }
      } as ClinicData
    };
    
    setScanResult(demoClinicData);
    toast({
      title: "Demo ativado",
      description: "Dados de demonstração carregados com sucesso.",
    });
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
                        <p className="font-semibold">{(scanResult.data as ClinicData).clinic_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(scanResult.data as ClinicData).responsible?.name} - {(scanResult.data as ClinicData).responsible?.role}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {(scanResult.data as ClinicData).address && (
                    <div className="p-4 bg-accent/10 rounded-lg">
                      <p className="font-medium text-accent">Endereço</p>
                      <p className="text-sm">
                        {(scanResult.data as ClinicData).address?.street}, {(scanResult.data as ClinicData).address?.number}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(scanResult.data as ClinicData).address?.district}, {(scanResult.data as ClinicData).address?.city} - {(scanResult.data as ClinicData).address?.state}
                      </p>
                    </div>
                  )}
                  
                  {(scanResult.data as ClinicData).contacts && (
                    <div className="p-4 bg-primary/10 rounded-lg">
                      <p className="font-medium text-primary">Contatos</p>
                      {(scanResult.data as ClinicData).contacts?.phone && (
                        <p className="text-sm">Telefone: {(scanResult.data as ClinicData).contacts?.phone}</p>
                      )}
                      {(scanResult.data as ClinicData).contacts?.email && (
                        <p className="text-sm">Email: {(scanResult.data as ClinicData).contacts?.email}</p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-4 bg-background/60 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Pill className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-semibold">{(scanResult.data as MedicationData).name}</p>
                        {(scanResult.data as MedicationData).route && (
                          <p className="text-sm text-muted-foreground">Via: {(scanResult.data as MedicationData).route}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-primary/10 rounded-lg">
                    <p className="font-medium text-primary">Informações do Medicamento</p>
                    {(scanResult.data as MedicationData).concentration && (
                      <p className="text-sm">Concentração: {(scanResult.data as MedicationData).concentration}</p>
                    )}
                    {(scanResult.data as MedicationData).manufacturer && (
                      <p className="text-sm">Fabricante: {(scanResult.data as MedicationData).manufacturer}</p>
                    )}
                    <div className="flex gap-4 text-xs text-muted-foreground mt-2">
                      {(scanResult.data as MedicationData).batch_number && (
                        <span>Lote: {(scanResult.data as MedicationData).batch_number}</span>
                      )}
                      {(scanResult.data as MedicationData).expiry_date && (
                        <span>Val: {new Date((scanResult.data as MedicationData).expiry_date!).toLocaleDateString('pt-BR')}</span>
                      )}
                    </div>
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

        {/* Camera View */}
        {showScanner ? (
          <QRCodeScanner
            onScanComplete={handleScanComplete}
            onError={handleScanError}
          />
        ) : (
          <Card className="luxury-card aspect-square cursor-pointer" onClick={() => setShowScanner(true)}>
            <CardContent className="p-0 h-full">
              <div className="relative h-full bg-gradient-to-br from-muted to-muted/50 rounded-lg flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="w-48 h-48 border-4 border-primary rounded-lg border-dashed opacity-60 animate-pulse mx-auto flex items-center justify-center">
                    <QrCode className="h-16 w-16 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">Toque para ativar a câmera</p>
                    <p className="text-sm text-muted-foreground">Escaneie QR Codes de clínicas e medicamentos</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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

        {/* Demo & Actions */}
        <div className="space-y-3">
          <div className="luxury-card bg-warning/10 border-warning/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-warning" />
                <div>
                  <p className="font-medium text-sm text-warning">Modo de Demonstração</p>
                  <p className="text-xs text-muted-foreground">Teste o aplicativo com dados simulados</p>
                </div>
              </div>
            </CardContent>
          </div>
          
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={handleDemo}
          >
            <QrCode className="h-4 w-4 mr-2" />
            Simular Scan de Clínica (Demo)
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;