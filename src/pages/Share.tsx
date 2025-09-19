import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Share2, 
  ArrowLeft, 
  Download, 
  Link, 
  Clock, 
  Shield,
  FileText,
  QrCode,
  Copy,
  Eye
} from "lucide-react";
import { useState } from "react";

const Share = () => {
  const [activeTab, setActiveTab] = useState<'pdf' | 'link'>('pdf');
  const [shareLinks] = useState([
    {
      id: '1',
      name: 'Dr. Roberto Lima',
      url: 'https://oncotrack.app/share/a1b2c3d4',
      expiresAt: '2025-01-22 18:00',
      views: 2,
      createdAt: '2025-01-19 14:30'
    },
    {
      id: '2',
      name: 'Emergência - Hospital',
      url: 'https://oncotrack.app/share/x9y8z7w6',
      expiresAt: '2025-01-20 08:00',
      views: 0,
      createdAt: '2025-01-19 20:15'
    }
  ]);

  const generateNewLink = () => {
    console.log('Generating new share link...');
  };

  const exportPDF = () => {
    console.log('Exporting PDF...');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20 p-4 pb-20">
      <div className="mx-auto max-w-md space-y-6 pt-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Compartilhar</h1>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-muted/50 rounded-lg p-1">
          <Button
            variant={activeTab === 'pdf' ? 'default' : 'ghost'}
            className="flex-1"
            onClick={() => setActiveTab('pdf')}
          >
            <FileText className="h-4 w-4 mr-2" />
            PDF
          </Button>
          <Button
            variant={activeTab === 'link' ? 'default' : 'ghost'}
            className="flex-1"
            onClick={() => setActiveTab('link')}
          >
            <Link className="h-4 w-4 mr-2" />
            Link Seguro
          </Button>
        </div>

        {activeTab === 'pdf' && (
          <div className="space-y-6">
            {/* PDF Export */}
            <Card className="shadow-lg border-0 bg-gradient-to-r from-primary/10 to-secondary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5 text-primary" />
                  Exportar PDF
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Gere um resumo completo do seu tratamento em PDF para levar a consultas 
                  ou manter como backup.
                </p>
                
                <div className="space-y-3">
                  <div className="p-3 bg-background/60 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Carteira de Tratamento</span>
                      <Badge variant="outline">Rápido</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Dados essenciais e contatos de emergência
                    </p>
                  </div>
                  
                  <div className="p-3 bg-background/60 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Relatório Completo</span>
                      <Badge variant="secondary">Detalhado</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Timeline completa, medicamentos e eventos adversos
                    </p>
                  </div>
                </div>

                <Button variant="medical" className="w-full" size="lg" onClick={exportPDF}>
                  <Download className="h-4 w-4 mr-2" />
                  Gerar PDF
                </Button>
              </CardContent>
            </Card>

            {/* Security Notice */}
            <Card className="shadow-md border-0 bg-success/10 border-success/30">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-success mt-0.5" />
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
        )}

        {activeTab === 'link' && (
          <div className="space-y-6">
            {/* Create New Link */}
            <Card className="shadow-lg border-0 bg-gradient-to-r from-secondary/20 to-accent/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link className="h-5 w-5 text-secondary-accent" />
                  Novo Link Seguro
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Crie um link temporário para compartilhar seu histórico com médicos
                </p>
                
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" size="sm">
                      <Clock className="h-4 w-4 mr-2" />
                      24h
                    </Button>
                    <Button variant="outline" size="sm">
                      <Clock className="h-4 w-4 mr-2" />
                      72h
                    </Button>
                  </div>
                  
                  <div className="p-3 bg-background/60 rounded-lg">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm">Exigir PIN de acesso</span>
                    </label>
                  </div>
                </div>

                <Button variant="medical" className="w-full" size="lg" onClick={generateNewLink}>
                  <QrCode className="h-4 w-4 mr-2" />
                  Gerar Link
                </Button>
              </CardContent>
            </Card>

            {/* Active Links */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Links Ativos</h3>
              
              {shareLinks.map((link) => (
                <Card key={link.id} className="shadow-md border-0">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{link.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Criado em {new Date(link.createdAt).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            <Eye className="h-3 w-3 mr-1" />
                            {link.views}
                          </Badge>
                        </div>
                      </div>

                      <div className="p-2 bg-muted/50 rounded text-xs font-mono truncate">
                        {link.url}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          Expira: {new Date(link.expiresAt).toLocaleString('pt-BR')}
                        </div>
                        <Button variant="outline" size="sm">
                          <Copy className="h-3 w-3 mr-1" />
                          Copiar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {shareLinks.length === 0 && (
                <Card className="shadow-md border-0">
                  <CardContent className="p-8 text-center">
                    <Link className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">Nenhum link ativo</p>
                    <p className="text-sm text-muted-foreground">
                      Crie links seguros para compartilhar seu histórico
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Security Info */}
            <Card className="shadow-md border-0 bg-warning/10 border-warning/30">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-warning mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Links Temporários</p>
                    <p className="text-xs text-muted-foreground">
                      Links expiram automaticamente e podem ser revogados a qualquer momento
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Share;