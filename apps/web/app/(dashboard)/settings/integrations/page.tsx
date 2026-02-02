'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/page-header';
import { Badge } from '@/components/ui/badge';
import {
  KeyRound,
  Cloud,
  Database,
  Webhook,
  Shield,
  ArrowRight,
} from 'lucide-react';

export default function IntegrationsPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'ADMIN';
  const t = useTranslations('settings');
  const tNav = useTranslations('navigation');

  const integrationCategories = [
    {
      title: 'Single Sign-On (SSO)',
      description: 'Configure Google and Microsoft authentication',
      href: '/settings/integrations/sso',
      icon: Shield,
      status: 'Available',
      statusVariant: 'default' as const,
    },
    {
      title: 'Cloud Storage (S3)',
      description: 'AWS S3 storage for file uploads and documents',
      href: '/settings/integrations/storage',
      icon: Cloud,
      status: 'Available',
      statusVariant: 'default' as const,
    },
    {
      title: 'ERP Integration',
      description: 'Connect to SAP, Oracle, or other ERP systems',
      href: '/settings/integrations/erp',
      icon: Database,
      status: 'Admin Only',
      statusVariant: 'secondary' as const,
    },
    {
      title: 'Webhooks',
      description: 'Configure webhooks for real-time event notifications',
      href: '/settings/integrations/webhooks',
      icon: Webhook,
      status: 'Available',
      statusVariant: 'default' as const,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('integrations')}
        description="Connect DAFC OTB Platform with external services and systems"
      />

      <div className="grid gap-6 md:grid-cols-2">
        {integrationCategories.map((category) => {
          const Icon = category.icon;
          const isRestricted = category.status === 'Admin Only' && !isAdmin;

          return (
            <Card
              key={category.href}
              className={isRestricted ? 'opacity-60' : 'hover:border-border/80 transition-shadow'}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{category.title}</CardTitle>
                    <Badge variant={category.statusVariant} className="mt-1">
                      {category.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">
                  {category.description}
                </CardDescription>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  disabled={isRestricted}
                >
                  <Link href={category.href}>
                    Configure
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* API Keys Quick Link */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <KeyRound className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{t('apiKeys')}</CardTitle>
              <CardDescription>
                Manage API keys for programmatic access to the platform
              </CardDescription>
            </div>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/settings/api-keys">
              {tNav('apiKeys')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
      </Card>
    </div>
  );
}
