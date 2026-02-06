import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages, setRequestLocale } from 'next-intl/server';
import { PWAProvider } from '@/components/pwa';
import { routing } from '@/i18n/routing';
import './globals.css';

const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-display',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-data',
});

export const metadata: Metadata = {
  title: {
    default: 'DAFC OTB Planning',
    template: '%s | DAFC OTB',
  },
  description: 'DAFC Intelligent OTB Planning Platform - Nền tảng Lập kế hoạch OTB Thông minh',
  applicationName: 'DAFC OTB Platform',
  keywords: ['OTB', 'Planning', 'Retail', 'Fashion', 'Inventory', 'Budget'],
  authors: [{ name: 'DAFC' }],
  creator: 'DAFC',
  publisher: 'DAFC',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'DAFC OTB',
  },
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    alternateLocale: 'en_US',
    siteName: 'DAFC OTB Platform',
    title: 'DAFC OTB Planning',
    description: 'DAFC Intelligent OTB Planning Platform',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DAFC OTB Planning',
    description: 'DAFC Intelligent OTB Planning Platform',
  },
  icons: {
    icon: [
      { url: '/icons/icon-32x32.svg', sizes: '32x32', type: 'image/svg+xml' },
      { url: '/icons/icon-16x16.svg', sizes: '16x16', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.svg', sizes: '180x180', type: 'image/svg+xml' },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: '#1a1714',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Get locale - will be set by middleware
  let locale: string;
  try {
    locale = await getLocale();
  } catch {
    locale = routing.defaultLocale;
  }

  // Enable static rendering where possible
  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.svg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-display antialiased`}>
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange={false}
          >
            <PWAProvider>
              {children}
            </PWAProvider>
            <Toaster richColors position="top-right" />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
