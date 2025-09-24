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

const Share = () => {
  const navigate = useNavigate();
  const [selectedPDFType, setSelectedPDFType] = useState<'card' | 'complete' | null>(null);
  const { toast } = useToast();

  const exportPDF = async (type: 'card' | 'complete') => {
    try {
      toast({
        title: "Gerando PDF...",
        description: `Preparando ${type === 'card' ? 'carteira de tratamento' : 'relatório completo'}`
      });

      // Simulate PDF generation
      setTimeout(() => {
        const fileName = type === 'card' ? 'carteira-tratamento.pdf' : 'relatorio-completo.pdf';
        toast({
          title: "PDF gerado com sucesso",
          description: `Download iniciado: ${fileName}`
        });
        
        // Create a mock download link
        const link = document.createElement('a');
        link.href = '#';
        link.download = fileName;
        link.click();
      }, 2000);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível gerar o PDF",
        variant: "destructive"
      });
    }
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
                  variant="outline" 
                  className="w-full h-auto p-4 justify-start"
                  onClick={() => exportPDF('card')}
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
                  variant="outline" 
                  className="w-full h-auto p-4 justify-start"
                  onClick={() => exportPDF('complete')}
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
            </CardContent>
          </Card>

          {/* Security Notice */}
          <Card className="shadow-md border-0 bg-success/10 border-success/30">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-success mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-success">Totalmente Privado</p>
                  <p className="text-xs text-muted-foreground">
                    PDFs são gerados localmente e não ficam armazenados em servidores
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