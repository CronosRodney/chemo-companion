import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowLeft, 
  Syringe, 
  Link2, 
  ExternalLink, 
  Unlink,
  CheckCircle,
  Loader2,
  ShieldCheck
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useExternalConnections } from '@/hooks/useExternalConnections';
import { VaccinationSummaryCard } from '@/components/VaccinationSummaryCard';
import { VaccinationAlertsCard } from '@/components/VaccinationAlertsCard';
import { VaccineListCard } from '@/components/VaccineListCard';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const CADERNETA_APP_URL = 'https://chronicle-my-health.lovable.app';

export default function Vaccination() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isCompletingConnection, setIsCompletingConnection] = useState(false);
  
  const {
    connection,
    isLoading,
    isConnected,
    vaccinationData,
    vaccines,
    isLoadingVaccination,
    connect,
    disconnect,
    refreshVaccinationData,
    completeConnection
  } = useExternalConnections('minha_caderneta');

  // Handle callback from Minha Caderneta
  useEffect(() => {
    const connected = searchParams.get('connected');

    // Fluxo resiliente: se voltamos para esta tela após iniciar conexão,
    // completamos o handshake mesmo que o parceiro não retorne querystring.
    let pending = false;
    try {
      pending = sessionStorage.getItem('caderneta_connect_pending') === '1';
    } catch {
      pending = false;
    }

    if ((connected === 'true' || pending) && !isConnected && !isCompletingConnection) {
      setIsCompletingConnection(true);

      // Consome o flag de pending imediatamente para evitar loops
      try {
        sessionStorage.removeItem('caderneta_connect_pending');
      } catch {
        // ignore
      }
      
      // Clean URL immediately
      setSearchParams({}, { replace: true });
      
      // Complete the B2B handshake
      completeConnection().finally(() => {
        setIsCompletingConnection(false);
      });
    }
  }, [searchParams, isConnected, isCompletingConnection, completeConnection, setSearchParams]);

  const handleOpenCaderneta = () => {
    window.open(CADERNETA_APP_URL, '_blank');
  };

  // Loading state
  if (isLoading || isCompletingConnection) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <Skeleton className="h-6 w-32" />
            </div>
          </div>
        </div>
        
        <div className="p-4 space-y-4">
          <Skeleton className="h-40" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 lg:px-8 lg:py-8">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold">
              {t('vaccination.title', 'Vacinação')}
            </h1>
            <p className="text-xs text-muted-foreground">
              {t('vaccination.subtitle', 'Integração com Minha Caderneta')}
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4 lg:space-y-6">
        {/* Not Connected State */}
        {!isConnected && (
          <Card className="border-dashed">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Syringe className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-xl">
                {t('vaccination.notConnected.title', 'Conecte sua carteira de vacinação')}
              </CardTitle>
              <CardDescription className="text-base mt-2">
                {t('vaccination.notConnected.description', 'Durante o tratamento oncológico, manter a vacinação em dia é essencial para sua segurança. Ao conectar sua Minha Caderneta, o OncoTrack poderá analisar seu histórico vacinal e gerar recomendações mais seguras.')}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <ShieldCheck className="h-5 w-5 text-green-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium">Seus dados estão seguros</p>
                    <p className="text-muted-foreground">
                      O OncoTrack apenas lê um resumo do seu histórico vacinal. Nenhum dado é armazenado localmente.
                    </p>
                  </div>
                </div>
                
                <Button 
                  onClick={connect} 
                  className="w-full" 
                  size="lg"
                >
                  <Link2 className="h-5 w-5 mr-2" />
                  {t('vaccination.notConnected.button', 'Conectar Minha Caderneta')}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Connected State */}
        {isConnected && (
          <>
            {/* Connection Status */}
            <Alert className="border-green-200 bg-green-50/50 dark:border-green-900/50 dark:bg-green-950/20">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="flex items-center justify-between">
                <span className="text-green-700 dark:text-green-400">
                  {t('vaccination.connected.status', 'Minha Caderneta conectada')}
                </span>
              </AlertDescription>
            </Alert>

            {/* Vaccination Summary */}
            <VaccinationSummaryCard 
              data={vaccinationData}
              isLoading={isLoadingVaccination}
              onRefresh={refreshVaccinationData}
              lastSyncAt={connection?.last_sync_at || null}
            />

            {/* Vaccine List */}
            <VaccineListCard
              vaccines={vaccines}
              isLoading={isLoadingVaccination}
            />

            {/* Clinical Alerts */}
            <VaccinationAlertsCard
              alerts={vaccinationData?.clinical_alerts || []}
            />

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <Button 
                variant="outline" 
                onClick={handleOpenCaderneta}
                className="w-full"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                {t('vaccination.connected.openButton', 'Abrir Minha Caderneta')}
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Unlink className="h-4 w-4 mr-2" />
                    {t('vaccination.connected.disconnectButton', 'Desconectar')}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {t('vaccination.connected.disconnectConfirm', 'Tem certeza que deseja desconectar?')}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Ao desconectar, o OncoTrack não terá mais acesso aos seus dados vacinais da Minha Caderneta.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={disconnect} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Desconectar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
