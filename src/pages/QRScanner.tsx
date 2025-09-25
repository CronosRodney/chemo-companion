import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QrCode, ArrowLeft, CheckCircle, Building2, Pill, Edit2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { SimpleQRScanner } from "@/components/SimpleQRScanner";
import { useToast } from "@/hooks/use-toast";
import { ParsedQRData, ClinicData, MedicationData, useQRScanner } from "@/hooks/useQRScanner";

const QRScanner = () => {
  const navigate = useNavigate();
  const [scanResult, setScanResult] = useState<ParsedQRData | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editableData, setEditableData] = useState<ClinicData | MedicationData | null>(null);
  const { toast } = useToast();
  const { saveClinicData, saveMedicationData, loading } = useQRScanner();

  const handleScanComplete = (result: ParsedQRData) => {
    setScanResult(result);
    setEditableData(result.data || null);
    setShowScanner(false);
    toast({
      title: "QR Code escaneado com sucesso!",
      description: `${result.type === 'clinic' ? 'Clínica' : 'Medicamento'} reconhecido(a). Confirme os dados.`,
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

  const handleSave = async () => {
    if (!scanResult || !editableData) return;
    
    try {
      if (scanResult.type === 'clinic') {
        await saveClinicData(editableData as ClinicData);
        toast({
          title: "Clínica salva com sucesso!",
          description: "Os dados da clínica foram registrados.",
        });
      } else if (scanResult.type === 'medication') {
        await saveMedicationData(editableData as MedicationData);
        toast({
          title: "Medicamento salvo com sucesso!",
          description: "Os dados do medicamento foram registrados.",
        });
      }
      navigate('/');
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar os dados. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditableData(scanResult?.data || null);
  };

  const handleSaveEdit = () => {
    setIsEditing(false);
    // Update scanResult with edited data
    if (scanResult && editableData) {
      setScanResult({
        ...scanResult,
        data: editableData
      });
    }
    toast({
      title: "Dados atualizados",
      description: "As alterações foram aplicadas.",
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
              {isEditing ? (
                // Edit Form
                <div className="space-y-4">
                  {scanResult.type === 'clinic' ? (
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="clinic_name">Nome da Clínica</Label>
                        <Input
                          id="clinic_name"
                          value={(editableData as ClinicData)?.clinic_name || ''}
                          onChange={(e) => setEditableData({
                            ...(editableData as ClinicData),
                            clinic_name: e.target.value
                          })}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="responsible_name">Responsável</Label>
                        <Input
                          id="responsible_name"
                          value={(editableData as ClinicData)?.responsible?.name || ''}
                          onChange={(e) => setEditableData({
                            ...(editableData as ClinicData),
                            responsible: {
                              ...((editableData as ClinicData)?.responsible || {}),
                              name: e.target.value
                            }
                          })}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="phone">Telefone</Label>
                        <Input
                          id="phone"
                          value={(editableData as ClinicData)?.contacts?.phone || ''}
                          onChange={(e) => setEditableData({
                            ...(editableData as ClinicData),
                            contacts: {
                              ...((editableData as ClinicData)?.contacts || {}),
                              phone: e.target.value
                            }
                          })}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          value={(editableData as ClinicData)?.contacts?.email || ''}
                          onChange={(e) => setEditableData({
                            ...(editableData as ClinicData),
                            contacts: {
                              ...((editableData as ClinicData)?.contacts || {}),
                              email: e.target.value
                            }
                          })}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="med_name">Nome do Medicamento</Label>
                        <Input
                          id="med_name"
                          value={(editableData as MedicationData)?.name || ''}
                          onChange={(e) => setEditableData({
                            ...(editableData as MedicationData),
                            name: e.target.value
                          })}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="manufacturer">Fabricante</Label>
                        <Input
                          id="manufacturer"
                          value={(editableData as MedicationData)?.manufacturer || ''}
                          onChange={(e) => setEditableData({
                            ...(editableData as MedicationData),
                            manufacturer: e.target.value
                          })}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="concentration">Concentração</Label>
                        <Input
                          id="concentration"
                          value={(editableData as MedicationData)?.concentration || ''}
                          onChange={(e) => setEditableData({
                            ...(editableData as MedicationData),
                            concentration: e.target.value
                          })}
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Edit form buttons */}
                  <div className="pt-4 space-y-3">
                    <div className="flex gap-3">
                      <Button 
                        variant="outline" 
                        size="lg" 
                        className="flex-1"
                        onClick={handleCancelEdit}
                      >
                        Cancelar
                      </Button>
                      <Button 
                        className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90" 
                        size="lg"
                        onClick={handleSaveEdit}
                      >
                        Salvar Alterações
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                // View Mode
                <div className="space-y-4">
                  {scanResult.type === 'clinic' ? (
                    <div className="space-y-3">
                      <div className="p-4 bg-background/60 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Building2 className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-semibold">{(editableData as ClinicData)?.clinic_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {(editableData as ClinicData)?.responsible?.name} - {(editableData as ClinicData)?.responsible?.role}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {(editableData as ClinicData)?.address && (
                        <div className="p-4 bg-accent/10 rounded-lg">
                          <p className="font-medium text-accent">Endereço</p>
                          <p className="text-sm">
                            {(editableData as ClinicData)?.address?.street}, {(editableData as ClinicData)?.address?.number}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(editableData as ClinicData)?.address?.district}, {(editableData as ClinicData)?.address?.city} - {(editableData as ClinicData)?.address?.state}
                          </p>
                        </div>
                      )}
                      
                      {(editableData as ClinicData)?.contacts && (
                        <div className="p-4 bg-primary/10 rounded-lg">
                          <p className="font-medium text-primary">Contatos</p>
                          {(editableData as ClinicData)?.contacts?.phone && (
                            <p className="text-sm">Telefone: {(editableData as ClinicData)?.contacts?.phone}</p>
                          )}
                          {(editableData as ClinicData)?.contacts?.email && (
                            <p className="text-sm">Email: {(editableData as ClinicData)?.contacts?.email}</p>
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
                            <p className="font-semibold">{(editableData as MedicationData)?.name}</p>
                            {(editableData as MedicationData)?.route && (
                              <p className="text-sm text-muted-foreground">Via: {(editableData as MedicationData)?.route}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-primary/10 rounded-lg">
                        <p className="font-medium text-primary">Informações do Medicamento</p>
                        {(editableData as MedicationData)?.concentration && (
                          <p className="text-sm">Concentração: {(editableData as MedicationData)?.concentration}</p>
                        )}
                        {(editableData as MedicationData)?.manufacturer && (
                          <p className="text-sm">Fabricante: {(editableData as MedicationData)?.manufacturer}</p>
                        )}
                        <div className="flex gap-4 text-xs text-muted-foreground mt-2">
                          {(editableData as MedicationData)?.batch_number && (
                            <span>Lote: {(editableData as MedicationData)?.batch_number}</span>
                          )}
                          {(editableData as MedicationData)?.expiry_date && (
                            <span>Val: {new Date((editableData as MedicationData)?.expiry_date!).toLocaleDateString('pt-BR')}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* View mode buttons */}
                  <div className="pt-4 space-y-3">
                    <div className="flex gap-3">
                      <Button 
                        variant="outline" 
                        size="lg" 
                        className="flex-1"
                        onClick={handleEdit}
                      >
                        <Edit2 className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                      <Button 
                        className="flex-1 bg-success text-success-foreground hover:bg-success/90" 
                        size="lg"
                        onClick={handleSave}
                        disabled={loading}
                      >
                        {loading ? "Salvando..." : "Confirmar e Salvar"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
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
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Escanear QR Code</h1>
        </div>

        {/* QR Scanner Options */}
        <div className="grid grid-cols-2 gap-4">
          <Button
            variant="default"
            size="lg"
            className="h-32 flex-col gap-3 group bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => setShowScanner(true)}
          >
            <QrCode className="h-10 w-10 transition-transform group-hover:scale-110" />
            <div className="text-center">
              <span className="text-base font-bold block">QR da Clínica</span>
              <span className="text-xs opacity-80">Vincular oncologista</span>
            </div>
          </Button>
          
          <Button
            variant="outline"
            size="lg"
            className="h-32 flex-col gap-3 group border-secondary-accent text-secondary-accent hover:bg-secondary-accent/10"
            onClick={() => setShowScanner(true)}
          >
            <Pill className="h-10 w-10 transition-transform group-hover:scale-110" />
            <div className="text-center">
              <span className="text-base font-bold block">QR do Medicamento</span>
              <span className="text-xs opacity-80">Registrar medicamento</span>
            </div>
          </Button>
        </div>

        {/* Camera View */}
        {showScanner && (
          <Card className="luxury-card aspect-square">
            <CardContent className="p-0 h-full">
              <SimpleQRScanner
                onScanComplete={handleScanComplete}
                onError={handleScanError}
              />
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

      </div>
    </div>
  );
};

export default QRScanner;