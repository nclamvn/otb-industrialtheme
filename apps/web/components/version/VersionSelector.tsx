'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { GitCompare, Check, Clock, FileCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface Version {
  id: string;
  number: number;
  date: string;
  status: 'draft' | 'final' | 'archived';
  author?: string;
  changeCount?: number;
}

interface VersionSelectorProps {
  versions: Version[];
  selectedLeft: Version | null;
  selectedRight: Version | null;
  onSelectLeft: (version: Version) => void;
  onSelectRight: (version: Version) => void;
  onCompare: () => void;
  className?: string;
}

export function VersionSelector({
  versions,
  selectedLeft,
  selectedRight,
  onSelectLeft,
  onSelectRight,
  onCompare,
  className,
}: VersionSelectorProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'final': return <FileCheck className="w-3 h-3 text-green-500" />;
      case 'draft': return <Clock className="w-3 h-3 text-yellow-500" />;
      default: return <Clock className="w-3 h-3 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      final: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      draft: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      archived: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
    };
    return colors[status] || colors.draft;
  };

  const canCompare = selectedLeft && selectedRight && selectedLeft.id !== selectedRight.id;

  return (
    <div className={cn('flex items-center gap-3 p-3 bg-muted/30 rounded-lg border', className)}>
      <GitCompare className="w-5 h-5 text-muted-foreground" />

      {/* Left Version Selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="min-w-[140px] justify-between">
            {selectedLeft ? (
              <span className="flex items-center gap-2">
                {getStatusIcon(selectedLeft.status)}
                <span>v{selectedLeft.number}</span>
              </span>
            ) : (
              <span className="text-muted-foreground">Select base</span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>Base Version</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {versions.map((version) => (
            <DropdownMenuItem
              key={version.id}
              onClick={() => onSelectLeft(version)}
              className={cn(
                'flex items-center justify-between',
                selectedLeft?.id === version.id && 'bg-[#D7B797]/10'
              )}
            >
              <div className="flex items-center gap-2">
                {getStatusIcon(version.status)}
                <div>
                  <span className="font-medium">v{version.number}</span>
                  <span className="text-xs text-muted-foreground ml-2">{version.date}</span>
                </div>
              </div>
              <Badge className={cn('text-[9px] h-4', getStatusBadge(version.status))}>
                {version.status}
              </Badge>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <span className="text-muted-foreground text-sm">vs</span>

      {/* Right Version Selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="min-w-[140px] justify-between">
            {selectedRight ? (
              <span className="flex items-center gap-2">
                {getStatusIcon(selectedRight.status)}
                <span>v{selectedRight.number}</span>
              </span>
            ) : (
              <span className="text-muted-foreground">Select compare</span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>Compare Version</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {versions.map((version) => (
            <DropdownMenuItem
              key={version.id}
              onClick={() => onSelectRight(version)}
              disabled={selectedLeft?.id === version.id}
              className={cn(
                'flex items-center justify-between',
                selectedRight?.id === version.id && 'bg-[#127749]/10',
                selectedLeft?.id === version.id && 'opacity-50'
              )}
            >
              <div className="flex items-center gap-2">
                {getStatusIcon(version.status)}
                <div>
                  <span className="font-medium">v{version.number}</span>
                  <span className="text-xs text-muted-foreground ml-2">{version.date}</span>
                </div>
              </div>
              <Badge className={cn('text-[9px] h-4', getStatusBadge(version.status))}>
                {version.status}
              </Badge>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Compare Button */}
      <Button
        size="sm"
        onClick={onCompare}
        disabled={!canCompare}
        className="bg-[#127749] hover:bg-[#0d5a36]"
      >
        <GitCompare className="w-4 h-4 mr-1" />
        Compare
      </Button>
    </div>
  );
}

// Demo versions
export function generateMockVersions(): Version[] {
  return [
    { id: '1', number: 1, date: '2025-01-15', status: 'archived', author: 'John Doe' },
    { id: '2', number: 2, date: '2025-01-20', status: 'draft', author: 'Alice Wong', changeCount: 12 },
    { id: '3', number: 3, date: '2025-01-25', status: 'final', author: 'Bob Lee', changeCount: 8 },
    { id: '4', number: 4, date: '2025-01-28', status: 'draft', author: 'Charlie Kim', changeCount: 5 },
  ];
}
