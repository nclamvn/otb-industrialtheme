'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Building2, FolderTree, MapPin, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/page-header';

export default function MasterDataPage() {
  const t = useTranslations('pages.masterData');

  const masterDataModules = [
    {
      title: t('brandsTitle'),
      description: t('brandsDescription'),
      href: '/master-data/brands',
      icon: Building2,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    },
    {
      title: t('categoriesTitle'),
      description: t('categoriesDescription'),
      href: '/master-data/categories',
      icon: FolderTree,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
    },
    {
      title: t('locationsTitle'),
      description: t('locationsDescription'),
      href: '/master-data/locations',
      icon: MapPin,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    },
    {
      title: t('usersTitle'),
      description: t('usersDescription'),
      href: '/master-data/users',
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        description={t('description')}
      />

      <div className="grid gap-4 md:grid-cols-2">
        {masterDataModules.map((module) => (
          <Link key={module.href} href={module.href}>
            <Card className="hover:border-primary/50 hover:border-border/80 transition-all cursor-pointer h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-lg ${module.bgColor} flex items-center justify-center`}>
                    <module.icon className={`h-5 w-5 ${module.color}`} />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{module.title}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>{module.description}</CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
