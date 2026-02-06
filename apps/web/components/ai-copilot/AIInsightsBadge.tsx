'use client';

import { cn } from '@/lib/utils';
import { Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface AIInsightsBadgeProps {
  count: number;
  hasHighPriority?: boolean;
  onClick?: () => void;
  className?: string;
}

export function AIInsightsBadge({
  count,
  hasHighPriority,
  onClick,
  className,
}: AIInsightsBadgeProps) {
  if (count === 0) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClick}
            className={cn('relative', className)}
          >
            <Lightbulb
              className={cn(
                'h-5 w-5',
                hasHighPriority ? 'text-yellow-500' : 'text-muted-foreground'
              )}
            />
            <span
              className={cn(
                'absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold',
                hasHighPriority
                  ? 'bg-red-500 text-white'
                  : 'bg-primary text-primary-foreground'
              )}
            >
              {count > 9 ? '9+' : count}
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {count} AI insight{count > 1 ? 's' : ''} available
            {hasHighPriority && ' (action required)'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default AIInsightsBadge;
