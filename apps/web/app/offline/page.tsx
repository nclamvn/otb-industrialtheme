'use client';

import { useTranslations } from 'next-intl';
import { WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OfflinePage() {
  const t = useTranslations('pwa');

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 mx-auto mb-6 bg-muted rounded-full flex items-center justify-center">
          <WifiOff className="h-10 w-10 text-muted-foreground" />
        </div>

        <h1 className="text-2xl font-bold mb-2">
          {t('offline')}
        </h1>

        <p className="text-muted-foreground mb-6">
          {t('offlineDescription')}
        </p>

        <Button onClick={handleRefresh} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>

        <p className="text-xs text-muted-foreground mt-8">
          Please check your internet connection and try again.
        </p>
      </div>
    </div>
  );
}
