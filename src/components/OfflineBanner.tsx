import { WifiOff, RefreshCw, X } from 'lucide-react';
import { useOnlineStatus, useServiceWorker } from '@/hooks/useOffline';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';

export function OfflineBanner() {
  const { isOnline, wasOffline } = useOnlineStatus();
  const { needRefresh, updateServiceWorker } = useServiceWorker();
  const [showReconnected, setShowReconnected] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (isOnline && wasOffline) {
      setShowReconnected(true);
      const timer = setTimeout(() => {
        setShowReconnected(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  if (dismissed) return null;

  // Show update available banner
  if (needRefresh) {
    return (
      <div className="fixed bottom-20 left-4 right-4 z-50 md:left-auto md:right-4 md:w-80">
        <div className="bg-primary text-primary-foreground rounded-lg shadow-lg p-4 flex items-center gap-3">
          <RefreshCw className="h-5 w-5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium">Nova versão disponível</p>
            <p className="text-xs opacity-90">Atualize para obter as últimas melhorias</p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={updateServiceWorker}
          >
            Atualizar
          </Button>
        </div>
      </div>
    );
  }

  // Show offline banner
  if (!isOnline) {
    return (
      <div className="fixed bottom-20 left-4 right-4 z-50 md:left-auto md:right-4 md:w-80">
        <div className="bg-destructive text-destructive-foreground rounded-lg shadow-lg p-4 flex items-center gap-3">
          <WifiOff className="h-5 w-5 flex-shrink-0 animate-pulse" />
          <div className="flex-1">
            <p className="text-sm font-medium">Você está offline</p>
            <p className="text-xs opacity-90">Algumas funcionalidades podem estar limitadas</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 hover:bg-destructive-foreground/20"
            onClick={() => setDismissed(true)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  // Show reconnected banner
  if (showReconnected) {
    return (
      <div className="fixed bottom-20 left-4 right-4 z-50 md:left-auto md:right-4 md:w-80">
        <div className="bg-green-600 text-white rounded-lg shadow-lg p-4 flex items-center gap-3">
          <RefreshCw className="h-5 w-5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium">Conexão restaurada!</p>
            <p className="text-xs opacity-90">Seus dados serão sincronizados automaticamente</p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
