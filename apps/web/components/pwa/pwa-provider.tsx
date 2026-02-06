'use client';

import { useEffect } from 'react';
import { InstallPrompt } from './install-prompt';
import { OfflineIndicator } from './offline-indicator';
import { UpdatePrompt } from './update-prompt';

interface PWAProviderProps {
  children: React.ReactNode;
}

export function PWAProvider({ children }: PWAProviderProps) {
  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          // Service Worker registered successfully
          // Check for updates every hour
          setInterval(() => {
            registration.update();
          }, 60 * 60 * 1000);
        })
        .catch((error) => {
          console.error('[PWA] Service Worker registration failed:', error);
        });
    }
  }, []);

  return (
    <>
      {children}
      <OfflineIndicator />
      <InstallPrompt />
      <UpdatePrompt />
    </>
  );
}
