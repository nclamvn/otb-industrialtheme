'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  ChevronRight,
  Home,
  Calendar,
  Building2,
  Layers,
  Package,
  FolderOpen,
  MoreHorizontal,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
  type?: 'home' | 'season' | 'brand' | 'category' | 'subcategory' | 'sku' | 'page';
  id?: string;
  siblings?: { label: string; href: string; id: string }[];
}

interface CollapsedItem {
  label: string;
  type: 'collapsed';
  collapsedItems: BreadcrumbItem[];
}

type VisibleItem = BreadcrumbItem | CollapsedItem;

function isCollapsedItem(item: VisibleItem): item is CollapsedItem {
  return item.type === 'collapsed';
}

interface DrillDownBreadcrumbProps {
  items: BreadcrumbItem[];
  maxVisible?: number;
  showIcons?: boolean;
  className?: string;
}

const typeIcons: Record<string, React.ReactNode> = {
  home: <Home className="w-3.5 h-3.5" />,
  season: <Calendar className="w-3.5 h-3.5" />,
  brand: <Building2 className="w-3.5 h-3.5" />,
  category: <Layers className="w-3.5 h-3.5" />,
  subcategory: <FolderOpen className="w-3.5 h-3.5" />,
  sku: <Package className="w-3.5 h-3.5" />,
  page: null,
};

export function DrillDownBreadcrumb({
  items,
  maxVisible = 4,
  showIcons = true,
  className,
}: DrillDownBreadcrumbProps) {
  const pathname = usePathname();

  // Collapse middle items if too many
  const shouldCollapse = items.length > maxVisible;
  const visibleItems: VisibleItem[] = shouldCollapse
    ? [
        items[0],
        { label: '...', type: 'collapsed' as const, collapsedItems: items.slice(1, -2) },
        ...items.slice(-2),
      ]
    : items;

  const getIcon = (item: BreadcrumbItem) => {
    if (item.icon) return item.icon;
    if (item.type && typeIcons[item.type]) return typeIcons[item.type];
    return null;
  };

  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center', className)}>
      <ol className="flex items-center gap-1 text-sm">
        {visibleItems.map((item, index) => {
          const isLast = index === visibleItems.length - 1;
          const collapsed = isCollapsedItem(item);
          const icon = !collapsed ? getIcon(item as BreadcrumbItem) : null;

          return (
            <li key={index} className="flex items-center gap-1">
              {/* Separator */}
              {index > 0 && (
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 mx-1" />
              )}

              {/* Collapsed items dropdown */}
              {collapsed ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-muted-foreground hover:text-foreground"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {(item as CollapsedItem).collapsedItems.map((collapsedItem: BreadcrumbItem, idx: number) => (
                      <DropdownMenuItem key={idx} asChild>
                        <Link href={collapsedItem.href || '#'} className="flex items-center gap-2">
                          {showIcons && getIcon(collapsedItem)}
                          {collapsedItem.label}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                /* Regular breadcrumb item */
                (() => {
                  const breadcrumbItem = item as BreadcrumbItem;
                  return (
                    <div className="flex items-center">
                      {/* Item with siblings dropdown */}
                      {breadcrumbItem.siblings && breadcrumbItem.siblings.length > 0 ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={cn(
                                'h-7 px-2 gap-1.5',
                                isLast
                                  ? 'font-medium text-foreground'
                                  : 'text-muted-foreground hover:text-foreground'
                              )}
                            >
                              {showIcons && icon && (
                                <span className={cn(
                                  isLast ? 'text-[#127749]' : 'text-muted-foreground'
                                )}>
                                  {icon}
                                </span>
                              )}
                              {breadcrumbItem.label}
                              <ChevronRight className="w-3 h-3 rotate-90 ml-0.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="max-h-64 overflow-y-auto">
                            {breadcrumbItem.siblings.map((sibling, idx) => (
                              <DropdownMenuItem
                                key={idx}
                                asChild
                                className={cn(
                                  sibling.id === breadcrumbItem.id && 'bg-[#127749]/10 text-[#127749]'
                                )}
                              >
                                <Link href={sibling.href}>
                                  {sibling.label}
                                </Link>
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        /* Simple item */
                        breadcrumbItem.href && !isLast ? (
                          <Link
                            href={breadcrumbItem.href}
                            className={cn(
                              'flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors',
                              'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                            )}
                          >
                            {showIcons && icon && <span>{icon}</span>}
                            <span>{breadcrumbItem.label}</span>
                          </Link>
                        ) : (
                          <span
                            className={cn(
                              'flex items-center gap-1.5 px-2 py-1',
                              isLast
                                ? 'font-medium text-foreground'
                                : 'text-muted-foreground'
                            )}
                          >
                            {showIcons && icon && (
                              <span className={isLast ? 'text-[#127749]' : ''}>
                                {icon}
                              </span>
                            )}
                            <span>{breadcrumbItem.label}</span>
                          </span>
                        )
                      )}
                    </div>
                  );
                })()
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// Helper to generate breadcrumbs from path
export function generateBreadcrumbsFromPath(
  pathname: string,
  contextData?: {
    season?: { id: string; code: string; name: string };
    brand?: { id: string; name: string };
    category?: { id: string; name: string };
    sku?: { id: string; code: string; name: string };
  }
): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean);
  const items: BreadcrumbItem[] = [
    { label: 'Dashboard', href: '/', type: 'home' },
  ];

  // Map common paths
  const pathMap: Record<string, { label: string; type: BreadcrumbItem['type'] }> = {
    'budgets': { label: 'Budgets', type: 'page' },
    'otb-analysis': { label: 'OTB Analysis', type: 'page' },
    'otb-plans': { label: 'OTB Plans', type: 'page' },
    'sku-proposals': { label: 'SKU Proposals', type: 'page' },
    'approvals': { label: 'Approvals', type: 'page' },
    'forecasting': { label: 'Forecasting', type: 'page' },
    'inventory': { label: 'Inventory', type: 'page' },
    'reports': { label: 'Reports', type: 'page' },
    'settings': { label: 'Settings', type: 'page' },
  };

  let currentPath = '';
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;

    if (pathMap[segment]) {
      items.push({
        label: pathMap[segment].label,
        href: currentPath,
        type: pathMap[segment].type,
      });
    } else if (segment === 'new') {
      items.push({
        label: 'New',
        type: 'page',
      });
    } else if (contextData) {
      // Add context-aware items
      if (contextData.season && segment === contextData.season.id) {
        items.push({
          label: contextData.season.code,
          href: currentPath,
          type: 'season',
          id: contextData.season.id,
        });
      } else if (contextData.brand && segment === contextData.brand.id) {
        items.push({
          label: contextData.brand.name,
          href: currentPath,
          type: 'brand',
          id: contextData.brand.id,
        });
      } else if (contextData.category && segment === contextData.category.id) {
        items.push({
          label: contextData.category.name,
          href: currentPath,
          type: 'category',
          id: contextData.category.id,
        });
      } else if (contextData.sku && segment === contextData.sku.id) {
        items.push({
          label: contextData.sku.code,
          href: currentPath,
          type: 'sku',
          id: contextData.sku.id,
        });
      }
    }
  });

  return items;
}
