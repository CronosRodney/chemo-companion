import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Heart, Clock, QrCode, Pill, ArrowRight, Info } from "lucide-react";
import { useState } from "react";

const Onboarding = () => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      icon: Heart,
      title: "Bem-vindo ao OncoTrack",
      description: "Acompanhe seu tratamento oncológico com segurança e praticidade",
      color: "text-primary"
    },
    {
      icon: QrCode,
      title: "QR Codes Inteligentes",
      description: "Escaneie QR codes da clínica e medicamentos para registro automático",
      color: "text-secondary-accent"
    },
    {
      icon: Clock,
      title: "Lembretes Personalizados",
      description: "Receba notificações para medicamentos e consultas baseadas no seu ciclo",
      color: "text-success"
    },
    {
      icon: Info,
      title: "Importante",
      description: "O OncoTrack é uma ferramenta de apoio ao tratamento. Decisões médicas devem ser tomadas exclusivamente com seu profissional de saúde.",
      color: "text-warning"
    },
    {
      icon: Shield,
      title: "Privacidade Total",
      description: "Seus dados são criptografados e protegidos conforme LGPD. Você controla todo o compartilhamento.",
      color: "text-primary"
    }
  ];

  const currentStepData = steps[currentStep];
  const Icon = currentStepData.icon;

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Navigate to home or complete onboarding
      console.log('Complete onboarding');
    }
  };

  const skipOnboarding = () => {
    console.log('Skip to home');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light to-secondary p-4 flex items-center">
      <div className="mx-auto max-w-sm w-full space-y-8">
        {/* Progress */}
        <div className="flex justify-center gap-2">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index <= currentStep ? 'bg-white' : 'bg-white/30'
              }`}
            />
          ))}
        </div>

        {/* Main Card */}
        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur">
          <CardContent className="p-8 text-center space-y-6">
            {/* Icon */}
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center">
              <Icon className={`h-10 w-10 ${currentStepData.color}`} />
            </div>

            {/* Content */}
            <div className="space-y-3">
              <h1 className="text-2xl font-bold text-foreground">
                {currentStepData.title}
              </h1>
              <p className="text-muted-foreground leading-relaxed">
                {currentStepData.description}
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-4">
              <Button 
                variant="medical" 
                size="lg" 
                className="w-full"
                onClick={nextStep}
              >
                {currentStep < steps.length - 1 ? (
                  <>
                    Próximo
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                ) : (
                  <>
                    Começar
                    <Pill className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
              
              <Button 
                variant="ghost" 
                className="w-full text-muted-foreground"
                onClick={skipOnboarding}
              >
                Pular introdução
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Medical Note */}
        <Card className="shadow-lg border-0 bg-white/10 backdrop-blur border-white/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-white mt-0.5" />
              <div>
              <p className="text-sm font-medium text-white">Certificado LGPD</p>
              <p className="text-xs text-white/80">
                Este app não realiza diagnósticos e não substitui consultas médicas.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
};

export default Onboarding;