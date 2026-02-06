'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { MoreVertical, Edit, Trash2, Copy, Check, Info, Ruler } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SizeProfile } from '@/types/size-profile';
import { SizeProfileType, SIZE_PROFILE_TYPE_LABELS, SIZE_PROFILE_TYPE_COLORS } from '@/types/size-profile';

const profileTypeBorderColors: Record<SizeProfileType, string> = {
  [SizeProfileType.HISTORICAL]: 'border-l-blue-500',
  [SizeProfileType.CURRENT_TREND]: 'border-l-green-500',
  [SizeProfileType.SYSTEM_OPTIMAL]: 'border-l-purple-500',
  [SizeProfileType.USER_ADJUSTED]: 'border-l-amber-500',
  [SizeProfileType.FINAL]: 'border-l-emerald-500',
};

interface SizeProfileCardProps {
  profile: SizeProfile;
  onEdit?: (profile: SizeProfile) => void;
  onDelete?: (profile: SizeProfile) => void;
  onDuplicate?: (profile: SizeProfile) => void;
  onSelect?: (profile: SizeProfile) => void;
  isSelected?: boolean;
  compact?: boolean;
}

export function SizeProfileCard({
  profile,
  onEdit,
  onDelete,
  onDuplicate,
  onSelect,
  isSelected = false,
  compact = false,
}: SizeProfileCardProps) {
  const totalPercentage = profile.sizeDistribution.reduce((sum, s) => sum + s.percentage, 0);
  const isValidTotal = Math.abs(totalPercentage - 100) < 0.1;

  if (compact) {
    return (
      <Card
        className={cn(
          'relative cursor-pointer hover:border-border/80 transition-shadow border-l-4 overflow-hidden',
          profileTypeBorderColors[profile.profileType],
          isSelected && 'ring-2 ring-primary'
        )}
        onClick={() => onSelect?.(profile)}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground truncate">{profile.name}</span>
            {isSelected && <Check className="h-4 w-4 text-primary" />}
          </div>
          <Badge
            variant="outline"
            className={cn('text-xs', SIZE_PROFILE_TYPE_COLORS[profile.profileType])}
          >
            {SIZE_PROFILE_TYPE_LABELS[profile.profileType]}
          </Badge>
          <div className="mt-2 flex flex-wrap gap-1">
            {profile.sizeDistribution.slice(0, 5).map((s) => (
              <span key={s.sizeId} className="text-xs text-muted-foreground">
                {s.sizeCode}: {s.percentage.toFixed(0)}%
              </span>
            ))}
            {profile.sizeDistribution.length > 5 && (
              <span className="text-xs text-muted-foreground">...</span>
            )}
          </div>
          {/* Watermark icon */}
          <Ruler className="absolute bottom-2 right-2 w-16 h-16 text-muted-foreground opacity-[0.08]" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('relative overflow-hidden border-l-4 hover:border-border/80 transition-all', profileTypeBorderColors[profile.profileType], isSelected && 'ring-2 ring-primary')}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              {profile.name}
              {!isValidTotal && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge variant="destructive" className="text-xs">
                        Invalid
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      Total: {totalPercentage.toFixed(1)}% (should be 100%)
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </p>
            <div className="flex flex-wrap gap-1 mt-1">
              <Badge
                variant="outline"
                className={cn('text-xs text-white', SIZE_PROFILE_TYPE_COLORS[profile.profileType])}
              >
                {SIZE_PROFILE_TYPE_LABELS[profile.profileType]}
              </Badge>
              {profile.categoryName && (
                <Badge variant="secondary" className="text-xs">
                  {profile.categoryName}
                </Badge>
              )}
              {profile.seasonName && (
                <Badge variant="secondary" className="text-xs">
                  {profile.seasonName}
                </Badge>
              )}
              {!profile.isActive && (
                <Badge variant="outline" className="text-xs text-muted-foreground">
                  Inactive
                </Badge>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(profile)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
              )}
              {onDuplicate && (
                <DropdownMenuItem onClick={() => onDuplicate(profile)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  onClick={() => onDelete(profile)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Size Distribution Bars */}
          <div className="space-y-1">
            {profile.sizeDistribution.map((s) => (
              <div key={s.sizeId} className="flex items-center gap-2">
                <span className="w-10 text-xs font-medium">{s.sizeCode}</span>
                <div className="flex-1 h-4 bg-muted rounded overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${Math.min(s.percentage, 100)}%` }}
                  />
                </div>
                <span className="w-12 text-xs text-right text-muted-foreground">
                  {s.percentage.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>

          {/* Notes */}
          {profile.notes && (
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground flex items-start gap-1">
                <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                {profile.notes}
              </p>
            </div>
          )}

          {/* Meta info */}
          <div className="pt-2 border-t flex justify-between text-xs text-muted-foreground">
            <span>Created: {new Date(profile.createdAt).toLocaleDateString()}</span>
            {profile.createdByName && <span>By: {profile.createdByName}</span>}
          </div>
        </div>

        {/* Watermark icon */}
        <Ruler className="absolute bottom-4 right-4 w-24 h-24 text-muted-foreground opacity-[0.08]" />
      </CardContent>
    </Card>
  );
}
