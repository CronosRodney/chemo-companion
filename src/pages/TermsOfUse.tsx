import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, AlertTriangle, Users, Shield, Scale, Ban } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TermsOfUse = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-4 pb-20">
      <div className="mx-auto max-w-2xl space-y-6 pt-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/auth')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Termos de Uso</h1>
        </div>

        {/* Last Update */}
        <p className="text-sm text-muted-foreground">
          Última atualização: {new Date().toLocaleDateString('pt-BR')}
        </p>

        {/* Medical Disclaimer - CRITICAL */}
        <Card className="shadow-md border-2 border-warning/50 bg-warning/5">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-warning" />
              <h2 className="text-lg font-semibold text-warning-foreground">Aviso Médico Importante</h2>
            </div>
            <div className="space-y-3 text-sm">
              <p className="font-medium">
                O OncoTrack é uma ferramenta de APOIO ao acompanhamento de tratamento oncológico e 
                NÃO substitui, em nenhuma hipótese:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-warning">⚠️</span>
                  Consultas médicas presenciais ou à distância com profissionais habilitados
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-warning">⚠️</span>
                  Diagnósticos médicos realizados por profissionais de saúde
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-warning">⚠️</span>
                  Prescrições de medicamentos ou alterações de tratamento
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-warning">⚠️</span>
                  Atendimento médico de emergência
                </li>
              </ul>
              <p className="font-medium text-warning-foreground">
                Toda e qualquer decisão sobre seu tratamento deve ser tomada exclusivamente 
                pelo seu médico oncologista ou equipe de saúde responsável.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Service Description */}
        <Card className="shadow-md border-0">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-primary" />
              <h2 className="text-lg font-semibold">Descrição do Serviço</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              O OncoTrack oferece as seguintes funcionalidades:
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Registro de medicamentos e lembretes de administração
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Acompanhamento de ciclos de tratamento quimioterápico
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Registro de sintomas, efeitos colaterais e bem-estar diário
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Armazenamento de resultados de exames laboratoriais
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Compartilhamento seguro de informações com profissionais de saúde autorizados
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Análise de sintomas baseada em IA (caráter informativo apenas)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Exportação de relatórios em PDF para consultas médicas
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Eligibility */}
        <Card className="shadow-md border-0">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-secondary-accent" />
              <h2 className="text-lg font-semibold">Elegibilidade</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Para utilizar o OncoTrack, você deve:
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-success">✓</span>
                Ter 18 anos ou mais, ou estar acompanhado de responsável legal
              </li>
              <li className="flex items-start gap-2">
                <span className="text-success">✓</span>
                Fornecer informações verdadeiras e atualizadas
              </li>
              <li className="flex items-start gap-2">
                <span className="text-success">✓</span>
                Concordar com esta Política de Uso e com a Política de Privacidade
              </li>
            </ul>
            <p className="text-sm text-muted-foreground leading-relaxed">
              No caso de menores de 18 anos, o uso deve ser supervisionado por um responsável legal, 
              que será responsável pelo cadastro e pela veracidade das informações.
            </p>
          </CardContent>
        </Card>

        {/* User Responsibilities */}
        <Card className="shadow-md border-0">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-primary" />
              <h2 className="text-lg font-semibold">Responsabilidades do Usuário</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Ao utilizar o OncoTrack, você se compromete a:
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Manter suas credenciais de acesso (e-mail e senha) em sigilo
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Informar dados verdadeiros sobre seu tratamento e saúde
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Não utilizar o aplicativo para fins ilegais ou não autorizados
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Manter seus dados de contato atualizados
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Continuar seguindo todas as orientações de seu médico e equipe de saúde
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Limitations */}
        <Card className="shadow-md border-0">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Scale className="h-6 w-6 text-secondary-accent" />
              <h2 className="text-lg font-semibold">Limitações de Responsabilidade</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              O OncoTrack e seus desenvolvedores:
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-warning">•</span>
                Não se responsabilizam por decisões de tratamento tomadas pelo usuário
              </li>
              <li className="flex items-start gap-2">
                <span className="text-warning">•</span>
                Não garantem a precisão de análises de IA, que são apenas informativas
              </li>
              <li className="flex items-start gap-2">
                <span className="text-warning">•</span>
                Não substituem atendimento médico em situações de emergência
              </li>
              <li className="flex items-start gap-2">
                <span className="text-warning">•</span>
                Podem ter interrupções temporárias para manutenção ou atualizações
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Prohibited Uses */}
        <Card className="shadow-md border-0">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Ban className="h-6 w-6 text-destructive" />
              <h2 className="text-lg font-semibold">Usos Proibidos</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              É expressamente proibido:
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-destructive">✗</span>
                Compartilhar credenciais de acesso com terceiros
              </li>
              <li className="flex items-start gap-2">
                <span className="text-destructive">✗</span>
                Utilizar o aplicativo para fins comerciais não autorizados
              </li>
              <li className="flex items-start gap-2">
                <span className="text-destructive">✗</span>
                Tentar acessar dados de outros usuários
              </li>
              <li className="flex items-start gap-2">
                <span className="text-destructive">✗</span>
                Realizar engenharia reversa ou modificar o aplicativo
              </li>
              <li className="flex items-start gap-2">
                <span className="text-destructive">✗</span>
                Inserir informações falsas que possam comprometer a integridade do sistema
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Intellectual Property */}
        <Card className="shadow-md border-0">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-primary" />
              <h2 className="text-lg font-semibold">Propriedade Intelectual</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Todo o conteúdo do OncoTrack, incluindo marca, logo, design, código-fonte e 
              funcionalidades, são de propriedade exclusiva dos desenvolvedores e protegidos 
              por leis de propriedade intelectual.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Os dados inseridos pelo usuário (informações pessoais e de saúde) permanecem 
              de propriedade do usuário, conforme descrito na Política de Privacidade.
            </p>
          </CardContent>
        </Card>

        {/* Changes to Terms */}
        <Card className="shadow-md border-0">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-secondary-accent" />
              <h2 className="text-lg font-semibold">Alterações nos Termos</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Reservamo-nos o direito de modificar estes Termos de Uso a qualquer momento. 
              Alterações significativas serão comunicadas através do aplicativo ou por e-mail. 
              O uso continuado do aplicativo após as alterações constitui aceitação dos novos termos.
            </p>
          </CardContent>
        </Card>

        {/* Acceptance */}
        <Card className="shadow-md border-0 bg-primary/5">
          <CardContent className="p-6">
            <p className="text-sm text-center text-muted-foreground leading-relaxed">
              Ao criar uma conta no OncoTrack, você declara ter lido, compreendido e concordado 
              integralmente com estes Termos de Uso e com a 
              <Button 
                variant="link" 
                className="px-1 h-auto text-sm"
                onClick={() => navigate('/privacy-policy')}
              >
                Política de Privacidade
              </Button>.
            </p>
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

export default TermsOfUse;
