'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ChevronRight, Home } from 'lucide-react';

export function Breadcrumb() {
  const pathname = usePathname();
  const t = useTranslations('breadcrumb');
  const pathSegments = pathname.split('/').filter(Boolean);

  // Map path segments to translation keys
  const getLabel = (segment: string): string => {
    const keyMap: Record<string, string> = {
      '': 'dashboard',
      'budget': 'budget',
      'otb-analysis': 'otbAnalysis',
      'sku-proposal': 'skuProposal',
      'master-data': 'masterData',
      'brands': 'brands',
      'categories': 'categories',
      'locations': 'locations',
      'users': 'users',
      'settings': 'settings',
      'analytics': 'analytics',
      'approvals': 'approvals',
      'ai-assistant': 'aiAssistant',
      'ai-suggestions': 'suggestions',
      'ai-auto-plan': 'autoPlan',
      'predictive-alerts': 'predictiveAlerts',
    };
    const key = keyMap[segment];
    if (key) {
      try {
        return t(key);
      } catch {
        return segment;
      }
    }
    return segment;
  };

  if (pathSegments.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <Home className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{t('dashboard')}</span>
      </div>
    );
  }

  return (
    <nav className="flex items-center gap-2 text-sm">
      <Link
        href="/"
        className="text-muted-foreground hover:text-foreground transition-colors"
      >
        <Home className="h-4 w-4" />
      </Link>

      {pathSegments.map((segment, index) => {
        const href = '/' + pathSegments.slice(0, index + 1).join('/');
        const isLast = index === pathSegments.length - 1;
        const label = getLabel(segment);

        return (
          <div key={segment} className="flex items-center gap-2">
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            {isLast ? (
              <span className="font-medium">{label}</span>
            ) : (
              <Link
                href={href}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
