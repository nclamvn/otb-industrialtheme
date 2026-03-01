'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Wifi } from 'lucide-react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useLanguage } from '@/contexts/LanguageContext';

export default function NetworkStatusBanner() {
  const { isOnline } = useNetworkStatus();
  const { t } = useLanguage();
  const [showBackOnline, setShowBackOnline] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
    } else if (wasOffline) {
      setShowBackOnline(true);
      const timer = setTimeout(() => {
        setShowBackOnline(false);
        setWasOffline(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          key="offline"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed top-0 left-0 right-0 z-[9999] bg-[#DC3545] text-white"
        >
          <div className="flex items-center justify-center gap-2 py-2 px-4 text-sm font-medium font-brand">
            <WifiOff size={16} />
            {t('common.offline')}
          </div>
        </motion.div>
      )}
      {showBackOnline && isOnline && (
        <motion.div
          key="online"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed top-0 left-0 right-0 z-[9999] bg-[#1B6B45] text-white"
        >
          <div className="flex items-center justify-center gap-2 py-2 px-4 text-sm font-medium font-brand">
            <Wifi size={16} />
            {t('common.backOnline')}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
