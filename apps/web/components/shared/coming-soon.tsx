'use client';

import Link from 'next/link';
import { Construction, ArrowLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

interface ComingSoonProps {
  title: string;
  description?: string;
}

export function ComingSoon({
  title,
  description,
}: ComingSoonProps) {
  const t = useTranslations('ui');

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="rounded-full bg-secondary/20 p-6 mb-6">
        <Construction className="h-12 w-12 text-secondary" />
      </div>
      <h2 className="text-2xl font-bold mb-2">{title}</h2>
      <p className="text-muted-foreground max-w-md mb-6">
        {description || t('featureComingSoon')}
      </p>
      <Button asChild variant="outline">
        <Link href="/">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('backToDashboard')}
        </Link>
      </Button>
    </div>
  );
}
