import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, Database, Users, Lock, FileText, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20 p-4 pb-20">
      <div className="mx-auto max-w-2xl space-y-6 pt-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/auth')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Política de Privacidade</h1>
        </div>

        {/* Last Update */}
        <p className="text-sm text-muted-foreground">
          Última atualização: {new Date().toLocaleDateString('pt-BR')}
        </p>

        {/* Introduction */}
        <Card className="shadow-md border-0">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-primary" />
              <h2 className="text-lg font-semibold">Sobre o OncoTrack</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              O OncoTrack é um aplicativo de acompanhamento de tratamento oncológico desenvolvido 
              para auxiliar pacientes no gerenciamento de suas informações de saúde. Este documento 
              descreve como coletamos, usamos, armazenamos e protegemos seus dados pessoais em 
              conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
            </p>
            <div className="p-4 bg-warning/10 rounded-lg border border-warning/30">
              <p className="text-sm font-medium text-warning-foreground">
                ⚠️ Aviso Importante: Este aplicativo é uma ferramenta de apoio ao tratamento e 
                NÃO substitui o acompanhamento médico profissional. Decisões sobre seu tratamento 
                devem ser tomadas exclusivamente com seu profissional de saúde.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Data Collection */}
        <Card className="shadow-md border-0">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Database className="h-6 w-6 text-secondary-accent" />
              <h2 className="text-lg font-semibold">Dados que Coletamos</h2>
            </div>
            <div className="space-y-3">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="font-medium text-sm">Dados de Identificação</p>
                <p className="text-xs text-muted-foreground">Nome, e-mail, telefone, CPF (opcional), data de nascimento</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="font-medium text-sm">Dados de Saúde</p>
                <p className="text-xs text-muted-foreground">
                  Histórico médico, diagnóstico, medicamentos em uso, tratamentos, 
                  ciclos de quimioterapia, resultados de exames, sintomas e efeitos colaterais
                </p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="font-medium text-sm">Dados de Uso</p>
                <p className="text-xs text-muted-foreground">
                  Registros de humor, lembretes, eventos de saúde, dados de dispositivos wearables (quando conectados)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Usage */}
        <Card className="shadow-md border-0">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-primary" />
              <h2 className="text-lg font-semibold">Como Usamos seus Dados</h2>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Gerenciar seu tratamento oncológico e lembretes de medicamentos
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Permitir o acompanhamento por profissionais de saúde autorizados por você
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Gerar relatórios e exportar dados para consultas médicas
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Fornecer análises de sintomas baseadas em inteligência artificial (caráter informativo apenas)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Melhorar continuamente a experiência e funcionalidades do aplicativo
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Data Storage */}
        <Card className="shadow-md border-0">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Lock className="h-6 w-6 text-success" />
              <h2 className="text-lg font-semibold">Armazenamento e Segurança</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Seus dados são armazenados de forma segura em servidores Supabase, com infraestrutura 
              baseada em Amazon Web Services (AWS). Utilizamos as seguintes medidas de proteção:
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-success">✓</span>
                Criptografia de dados em trânsito (HTTPS/TLS) e em repouso
              </li>
              <li className="flex items-start gap-2">
                <span className="text-success">✓</span>
                Autenticação segura com tokens JWT
              </li>
              <li className="flex items-start gap-2">
                <span className="text-success">✓</span>
                Controle de acesso por Row Level Security (RLS)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-success">✓</span>
                Backups automáticos e recuperação de dados
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Data Sharing */}
        <Card className="shadow-md border-0">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-secondary-accent" />
              <h2 className="text-lg font-semibold">Compartilhamento de Dados</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Seus dados de saúde são privados e somente compartilhados com:
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <strong>Profissionais de saúde</strong> que você autorizar expressamente através do sistema de convites
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <strong>Serviços de IA</strong> (OpenAI) para análise de sintomas, de forma anonimizada e apenas quando você solicitar
              </li>
            </ul>
            <div className="p-3 bg-success/10 rounded-lg border border-success/30">
              <p className="text-sm text-success-foreground">
                Nunca vendemos, alugamos ou compartilhamos seus dados com terceiros para fins comerciais ou publicitários.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* User Rights (LGPD) */}
        <Card className="shadow-md border-0">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-primary" />
              <h2 className="text-lg font-semibold">Seus Direitos (LGPD)</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              De acordo com a Lei Geral de Proteção de Dados, você tem os seguintes direitos:
            </p>
            <div className="grid gap-2">
              <div className="p-3 bg-primary/5 rounded-lg">
                <p className="font-medium text-sm">Acesso</p>
                <p className="text-xs text-muted-foreground">Solicitar cópia de todos os seus dados armazenados</p>
              </div>
              <div className="p-3 bg-primary/5 rounded-lg">
                <p className="font-medium text-sm">Correção</p>
                <p className="text-xs text-muted-foreground">Atualizar ou corrigir dados incompletos ou incorretos</p>
              </div>
              <div className="p-3 bg-primary/5 rounded-lg">
                <p className="font-medium text-sm">Exclusão</p>
                <p className="text-xs text-muted-foreground">Solicitar a exclusão permanente dos seus dados</p>
              </div>
              <div className="p-3 bg-primary/5 rounded-lg">
                <p className="font-medium text-sm">Portabilidade</p>
                <p className="text-xs text-muted-foreground">Exportar seus dados em formato estruturado (PDF/JSON)</p>
              </div>
              <div className="p-3 bg-primary/5 rounded-lg">
                <p className="font-medium text-sm">Revogação</p>
                <p className="text-xs text-muted-foreground">Retirar o consentimento a qualquer momento</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card className="shadow-md border-0">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="h-6 w-6 text-secondary-accent" />
              <h2 className="text-lg font-semibold">Contato</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Para exercer seus direitos ou esclarecer dúvidas sobre privacidade, entre em contato:
            </p>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="font-medium text-sm">Encarregado de Proteção de Dados (DPO)</p>
              <p className="text-xs text-muted-foreground">E-mail: privacidade@oncotrack.app</p>
            </div>
          </CardContent>
        </Card>

        {/* Back Button */}
        <div className="pt-4">
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => navigate('/auth')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Login
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
