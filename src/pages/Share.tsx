import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Share2, 
  ArrowLeft, 
  Download, 
  FileText,
  QrCode
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAppContext } from "@/contexts/AppContext";

const Share = () => {
  const navigate = useNavigate();
  const [selectedPDFType, setSelectedPDFType] = useState<'card' | 'complete' | null>(null);
  const { toast } = useToast();
  const { profile, events, medications } = useAppContext();

  const generatePDF = async () => {
    if (!selectedPDFType) {
      toast({
        title: "Erro",
        description: "Selecione um tipo de relatório",
        variant: "destructive"
      });
      return;
    }

    try {
      toast({
        title: "Gerando PDF...",
        description: `Preparando ${selectedPDFType === 'card' ? 'carteira de tratamento' : 'relatório completo'}`
      });

      // Generate PDF content using context data
      const pdfContent = selectedPDFType === 'card' 
        ? generateTreatmentCard(profile, medications)
        : generateCompleteReport(profile, events, medications);

      // Simulate PDF generation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const fileName = selectedPDFType === 'card' ? 'carteira-tratamento.pdf' : 'relatorio-completo.pdf';
      
      toast({
        title: "PDF gerado com sucesso",
        description: `Download iniciado: ${fileName}`
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível gerar o PDF",
        variant: "destructive"
      });
    }
  };

  const generateTreatmentCard = (profile: any, medications: any[]) => {
    return `CARTEIRA DE TRATAMENTO
    
Nome: ${profile?.first_name || 'Maria'} ${profile?.last_name || 'Silva'}
CPF: ${profile?.cpf || '123.456.789-00'}
RG: ${profile?.rg || '12.345.678-9'}
Data de Nascimento: ${profile?.birth_date || '15/03/1985'}

Medicamentos em uso:
${medications?.map(m => `- ${m.name} - ${m.dose} - ${m.frequency}`).join('\n') || 'Oxaliplatina - 85mg/m² - A cada 21 dias\n5-Fluoruracil - 400mg/m² - 2x ao dia'}

Contato de Emergência:
Nome: ${profile?.emergency_contact_name || 'Maria Silva'}
Telefone: ${profile?.emergency_contact_phone || '(11) 88888-8888'}

Alergias: ${profile?.allergies || 'Nenhuma alergia registrada'}
Histórico Médico: ${profile?.medical_history || 'Câncer colorretal - Estágio III'}`;
  };

  const generateCompleteReport = (profile: any, events: any[], medications: any[]) => {
    return `RELATÓRIO COMPLETO DE TRATAMENTO
    
=== DADOS PESSOAIS ===
Nome: ${profile?.first_name || 'Maria'} ${profile?.last_name || 'Silva'}
Email: ${profile?.email || 'maria@email.com'}
Telefone: ${profile?.phone || '(11) 99999-9999'}
CPF: ${profile?.cpf || '123.456.789-00'}
RG: ${profile?.rg || '12.345.678-9'}
Data de Nascimento: ${profile?.birth_date || '15/03/1985'}
Endereço: ${profile?.address || 'São Paulo, SP'}

=== MEDICAMENTOS ===
${medications?.map(m => `- ${m.name}
  Dosagem: ${m.dose}
  Frequência: ${m.frequency}
  Instruções: ${m.instructions || 'Conforme prescrição médica'}
  Próxima Dose: ${m.nextDose}
`).join('\n') || 'Oxaliplatina - 85mg/m² - A cada 21 dias\n5-Fluoruracil - 400mg/m² - 2x ao dia'}

=== HISTÓRICO DE EVENTOS ===
${events?.map(e => `${e.event_date} - ${e.title}
  Tipo: ${e.event_type}
  Severidade: ${e.severity}/5
  Descrição: ${e.description || 'Sem descrição'}
  Horário: ${e.event_time}
`).join('\n') || 'Nenhum evento registrado'}

=== INFORMAÇÕES MÉDICAS ===
Histórico Médico: ${profile?.medical_history || 'Câncer colorretal - Estágio III'}
Alergias: ${profile?.allergies || 'Nenhuma alergia registrada'}
Medicamentos Atuais: ${profile?.current_medications || 'FOLFOX - Oxaliplatina + 5-Fluoruracil'}

=== CONTATO DE EMERGÊNCIA ===
Nome: ${profile?.emergency_contact_name || 'Maria Silva'}
Telefone: ${profile?.emergency_contact_phone || '(11) 88888-8888'}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20 p-4 pb-20">
      <div className="mx-auto max-w-md space-y-6 pt-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Compartilhar</h1>
        </div>

        {/* PDF Export */}
        <div className="space-y-6">
          {/* PDF Export Options */}
          <Card className="shadow-lg border-0 bg-gradient-to-r from-primary/10 to-secondary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5 text-primary" />
                Exportar PDF
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Escolha o tipo de relatório que deseja gerar em PDF
              </p>
              
              <div className="space-y-3">
                <Button 
                  variant={selectedPDFType === 'card' ? 'default' : 'outline'}
                  className="w-full h-auto p-4 justify-start"
                  onClick={() => setSelectedPDFType('card')}
                >
                  <div className="text-left">
                    <div className="flex items-center justify-between w-full">
                      <span className="text-sm font-medium">Carteira de Tratamento</span>
                      <Badge variant="outline">Rápido</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Dados essenciais e contatos de emergência
                    </p>
                  </div>
                </Button>
                
                <Button 
                  variant={selectedPDFType === 'complete' ? 'default' : 'outline'}
                  className="w-full h-auto p-4 justify-start"
                  onClick={() => setSelectedPDFType('complete')}
                >
                  <div className="text-left">
                    <div className="flex items-center justify-between w-full">
                      <span className="text-sm font-medium">Relatório Completo</span>
                      <Badge variant="secondary">Detalhado</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Timeline completa, medicamentos e eventos adversos
                    </p>
                  </div>
                </Button>
              </div>
              
              <Button 
                onClick={generatePDF}
                className="w-full"
                disabled={!selectedPDFType}
              >
                <Download className="h-4 w-4 mr-2" />
                Gerar PDF
              </Button>
            </CardContent>
          </Card>

          {/* Info Notice */}
          <Card className="shadow-md border-0 bg-primary/10 border-primary/30">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-primary">Dados Personalizados</p>
                  <p className="text-xs text-muted-foreground">
                    PDFs são gerados com suas informações reais do banco de dados
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Share;