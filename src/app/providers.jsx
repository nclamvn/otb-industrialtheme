'use client';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { AppProvider } from '@/contexts/AppContext';

function ToasterWithTheme() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: '#FFFFFF',
          color: '#2C2417',
          border: '1px solid #E8E2DB',
          boxShadow: '0 4px 12px rgba(44,36,23,0.10)',
        },
        success: {
          iconTheme: { primary: '#1B6B45', secondary: '#FFFFFF' },
        },
        error: {
          iconTheme: { primary: '#DC3545', secondary: '#FFFFFF' },
        },
      }}
    />
  );
}

export function Providers({ children }) {
  return (
    <AuthProvider>
      <LanguageProvider>
        <AppProvider>
          {children}
          <ToasterWithTheme />
        </AppProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}
