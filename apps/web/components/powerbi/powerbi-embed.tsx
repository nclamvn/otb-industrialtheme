'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  RefreshCw,
  Maximize2,
  Minimize2,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import { powerbiApi } from '@/lib/api-client';

interface PowerBIEmbedProps {
  reportId: string;
  groupId?: string;
  title?: string;
  height?: number | string;
  showToolbar?: boolean;
  filter?: Record<string, unknown>;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

interface EmbedToken {
  token: string;
  expiration: string;
  embedUrl: string;
  reportId: string;
}

export function PowerBIEmbed({
  reportId,
  groupId,
  title,
  height = 600,
  showToolbar = true,
  filter,
  onLoad,
  onError,
}: PowerBIEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [embedToken, setEmbedToken] = useState<EmbedToken | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const loadEmbedToken = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await powerbiApi.generateEmbedToken({
        reportId,
        groupId,
        filter,
      });

      if (response.data) {
        setEmbedToken(response.data as EmbedToken);
        onLoad?.();
      } else {
        throw new Error(response.error || 'Failed to get embed token');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load Power BI report';
      setError(errorMessage);
      onError?.(err instanceof Error ? err : new Error(errorMessage));
    } finally {
      setIsLoading(false);
    }
  }, [reportId, groupId, filter, onLoad, onError]);

  useEffect(() => {
    loadEmbedToken();
  }, [loadEmbedToken]);

  // Check if token is about to expire and refresh
  useEffect(() => {
    if (!embedToken) return;

    const expirationTime = new Date(embedToken.expiration).getTime();
    const now = Date.now();
    const timeUntilExpiry = expirationTime - now;

    // Refresh 5 minutes before expiration
    const refreshTime = timeUntilExpiry - 5 * 60 * 1000;

    if (refreshTime > 0) {
      const timeout = setTimeout(() => {
        loadEmbedToken();
      }, refreshTime);

      return () => clearTimeout(timeout);
    }
  }, [embedToken, loadEmbedToken]);

  const handleRefresh = () => {
    loadEmbedToken();
    toast.success('Report refreshed');
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Handle fullscreen change from escape key
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card ref={containerRef} className={isFullscreen ? 'h-screen' : ''}>
      {(title || showToolbar) && (
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            {title && <CardTitle className="text-base">{title}</CardTitle>}
            {showToolbar && (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={isLoading}>
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
                <Button variant="ghost" size="icon" onClick={toggleFullscreen}>
                  {isFullscreen ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </Button>
                {embedToken && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => window.open(embedToken.embedUrl, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardHeader>
      )}
      <CardContent className={showToolbar || title ? '' : 'p-0'}>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="w-full" style={{ height }} />
          </div>
        ) : embedToken ? (
          <iframe
            title={title || 'Power BI Report'}
            src={`${embedToken.embedUrl}&autoAuth=true&ctid=${embedToken.token}`}
            style={{
              width: '100%',
              height: isFullscreen ? 'calc(100vh - 80px)' : height,
              border: 'none',
            }}
            allowFullScreen
          />
        ) : null}
      </CardContent>
    </Card>
  );
}
