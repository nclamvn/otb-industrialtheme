'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/page-header';
import {
  BookOpen,
  MessageCircle,
  Mail,
  ExternalLink,
  Keyboard,
  HelpCircle,
} from 'lucide-react';

export default function HelpPage() {
  const t = useTranslations('help');

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        description={t('description')}
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Getting Started */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">{t('gettingStarted.title')}</CardTitle>
            </div>
            <CardDescription>{t('gettingStarted.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                {t('gettingStarted.item1')}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                {t('gettingStarted.item2')}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                {t('gettingStarted.item3')}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                {t('gettingStarted.item4')}
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Keyboard Shortcuts */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Keyboard className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">{t('shortcuts.title')}</CardTitle>
            </div>
            <CardDescription>{t('shortcuts.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                {t('shortcuts.item1')}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                {t('shortcuts.item2')}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                {t('shortcuts.item3')}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                {t('shortcuts.item4')}
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Support */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">{t('support.title')}</CardTitle>
            </div>
            <CardDescription>{t('support.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                {t('support.item1')}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                {t('support.item2')}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                {t('support.item3')}
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            <CardTitle>{t('needMoreHelp.title')}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <a
            href="mailto:support@dafc.com"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
          >
            <Mail className="h-4 w-4" />
            support@dafc.com
          </a>
          <a
            href="https://github.com/nclamvn/dafc"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
          >
            <ExternalLink className="h-4 w-4" />
            {t('needMoreHelp.documentation')}
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
