'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useHotkeys } from 'react-hotkeys-hook';
import Fuse from 'fuse.js';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import {
  Home,
  DollarSign,
  FileText,
  Package,
  Building2,
  FolderTree,
  MapPin,
  Users,
  Settings,
  HelpCircle,
  Clock,
  Calendar,
  BarChart3,
  Shield,
  History,
  Bell,
} from 'lucide-react';

interface SearchItem {
  id: string;
  title: string;
  description?: string;
  category: string;
  icon: React.ElementType;
  href: string;
  keywords?: string[];
  badge?: string;
}

// Define searchable items
const navigationItems: SearchItem[] = [
  {
    id: 'nav-home',
    title: 'Dashboard',
    description: 'Go to dashboard',
    category: 'Navigation',
    icon: Home,
    href: '/',
    keywords: ['home', 'overview', 'main'],
  },
  {
    id: 'nav-budgets',
    title: 'Budgets',
    description: 'View budget allocations',
    category: 'Navigation',
    icon: DollarSign,
    href: '/budgets',
    keywords: ['budget', 'allocation', 'finance'],
  },
  {
    id: 'nav-otb',
    title: 'OTB Plans',
    description: 'Open-to-buy planning',
    category: 'Navigation',
    icon: FileText,
    href: '/otb-plans',
    keywords: ['otb', 'open to buy', 'plan', 'planning'],
  },
  {
    id: 'nav-sku',
    title: 'SKU Proposals',
    description: 'Manage SKU proposals',
    category: 'Navigation',
    icon: Package,
    href: '/sku-proposals',
    keywords: ['sku', 'proposal', 'product'],
  },
  {
    id: 'nav-approvals',
    title: 'Approvals',
    description: 'Pending approvals',
    category: 'Navigation',
    icon: Shield,
    href: '/approvals',
    keywords: ['approval', 'pending', 'review', 'workflow'],
  },
];

const masterDataItems: SearchItem[] = [
  {
    id: 'md-brands',
    title: 'Brands',
    description: 'Manage brands',
    category: 'Master Data',
    icon: Building2,
    href: '/master-data/brands',
    keywords: ['brand', 'nike', 'adidas', 'puma'],
  },
  {
    id: 'md-categories',
    title: 'Categories',
    description: 'Product categories',
    category: 'Master Data',
    icon: FolderTree,
    href: '/master-data/categories',
    keywords: ['category', 'footwear', 'apparel', 'accessories'],
  },
  {
    id: 'md-locations',
    title: 'Locations',
    description: 'Sales locations',
    category: 'Master Data',
    icon: MapPin,
    href: '/master-data/locations',
    keywords: ['location', 'store', 'outlet'],
  },
  {
    id: 'md-seasons',
    title: 'Seasons',
    description: 'Season configuration',
    category: 'Master Data',
    icon: Calendar,
    href: '/master-data/seasons',
    keywords: ['season', 'ss25', 'fw25', 'spring', 'fall'],
  },
  {
    id: 'md-users',
    title: 'Users',
    description: 'User management',
    category: 'Master Data',
    icon: Users,
    href: '/master-data/users',
    keywords: ['user', 'account', 'admin', 'planner'],
  },
];

const actionItems: SearchItem[] = [
  {
    id: 'action-new-budget',
    title: 'Create Budget',
    description: 'Start a new budget allocation',
    category: 'Actions',
    icon: DollarSign,
    href: '/budgets/new',
    keywords: ['new', 'create', 'add', 'budget'],
    badge: 'New',
  },
  {
    id: 'action-new-otb',
    title: 'Create OTB Plan',
    description: 'Create new open-to-buy plan',
    category: 'Actions',
    icon: FileText,
    href: '/otb-plans/new',
    keywords: ['new', 'create', 'add', 'otb', 'plan'],
    badge: 'New',
  },
  {
    id: 'action-upload-sku',
    title: 'Upload SKUs',
    description: 'Import SKU proposal file',
    category: 'Actions',
    icon: Package,
    href: '/sku-proposals/upload',
    keywords: ['upload', 'import', 'sku', 'excel'],
    badge: 'Import',
  },
  {
    id: 'action-reports',
    title: 'Reports',
    description: 'View and export reports',
    category: 'Actions',
    icon: BarChart3,
    href: '/reports',
    keywords: ['report', 'export', 'pdf', 'excel'],
  },
];

const settingsItems: SearchItem[] = [
  {
    id: 'settings-preferences',
    title: 'Preferences',
    description: 'User preferences',
    category: 'Settings',
    icon: Settings,
    href: '/settings/preferences',
    keywords: ['settings', 'preferences', 'theme', 'language'],
  },
  {
    id: 'settings-notifications',
    title: 'Notifications',
    description: 'Notification settings',
    category: 'Settings',
    icon: Bell,
    href: '/settings/notifications',
    keywords: ['notification', 'alert', 'email'],
  },
  {
    id: 'settings-audit',
    title: 'Audit Trail',
    description: 'View system activity logs',
    category: 'Settings',
    icon: History,
    href: '/settings/audit',
    keywords: ['audit', 'log', 'history', 'activity'],
  },
  {
    id: 'settings-help',
    title: 'Help',
    description: 'Help and documentation',
    category: 'Settings',
    icon: HelpCircle,
    href: '/help',
    keywords: ['help', 'support', 'documentation', 'guide'],
  },
];

const allItems = [...navigationItems, ...masterDataItems, ...actionItems, ...settingsItems];

// Fuse.js configuration
const fuseOptions = {
  keys: [
    { name: 'title', weight: 0.4 },
    { name: 'description', weight: 0.2 },
    { name: 'keywords', weight: 0.3 },
    { name: 'category', weight: 0.1 },
  ],
  threshold: 0.4,
  includeScore: true,
};

interface RecentSearch {
  query: string;
  timestamp: Date;
  resultId?: string;
}

export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const router = useRouter();

  const fuse = useMemo(() => new Fuse(allItems, fuseOptions), []);

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('recentSearches');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setRecentSearches(
          parsed.map((s: RecentSearch) => ({
            ...s,
            timestamp: new Date(s.timestamp),
          }))
        );
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  // Save recent searches to localStorage
  const saveRecentSearch = useCallback((query: string, resultId?: string) => {
    const newSearch: RecentSearch = {
      query,
      timestamp: new Date(),
      resultId,
    };
    setRecentSearches((prev) => {
      const filtered = prev.filter((s) => s.query !== query);
      const updated = [newSearch, ...filtered].slice(0, 5);
      localStorage.setItem('recentSearches', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Keyboard shortcut
  useHotkeys('meta+k, ctrl+k', (e) => {
    e.preventDefault();
    setOpen(true);
  }, { enableOnFormTags: true });

  // Search results
  const searchResults = useMemo(() => {
    if (!search) return [];
    const results = fuse.search(search);
    return results.map((r) => r.item);
  }, [search, fuse]);

  const handleSelect = useCallback(
    (item: SearchItem) => {
      if (search) {
        saveRecentSearch(search, item.id);
      }
      router.push(item.href);
      setOpen(false);
      setSearch('');
    },
    [router, search, saveRecentSearch]
  );

  const groupedResults = useMemo(() => {
    const groups: Record<string, SearchItem[]> = {};
    for (const item of searchResults) {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    }
    return groups;
  }, [searchResults]);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Search pages, actions, and settings..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {!search && recentSearches.length > 0 && (
          <>
            <CommandGroup heading="Recent Searches">
              {recentSearches.map((recent, idx) => (
                <CommandItem
                  key={`recent-${idx}`}
                  onSelect={() => setSearch(recent.query)}
                >
                  <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{recent.query}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {search ? (
          // Show search results
          Object.entries(groupedResults).map(([category, items]) => (
            <CommandGroup key={category} heading={category}>
              {items.map((item) => (
                <CommandItem
                  key={item.id}
                  value={item.title}
                  onSelect={() => handleSelect(item)}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  <div className="flex-1">
                    <span>{item.title}</span>
                    {item.description && (
                      <span className="text-muted-foreground ml-2 text-sm">
                        {item.description}
                      </span>
                    )}
                  </div>
                  {item.badge && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {item.badge}
                    </Badge>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          ))
        ) : (
          // Show default categories
          <>
            <CommandGroup heading="Navigation">
              {navigationItems.slice(0, 4).map((item) => (
                <CommandItem
                  key={item.id}
                  value={item.title}
                  onSelect={() => handleSelect(item)}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  <span>{item.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Quick Actions">
              {actionItems.map((item) => (
                <CommandItem
                  key={item.id}
                  value={item.title}
                  onSelect={() => handleSelect(item)}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  <span>{item.title}</span>
                  {item.badge && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {item.badge}
                    </Badge>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Settings">
              {settingsItems.slice(0, 3).map((item) => (
                <CommandItem
                  key={item.id}
                  value={item.title}
                  onSelect={() => handleSelect(item)}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  <span>{item.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
