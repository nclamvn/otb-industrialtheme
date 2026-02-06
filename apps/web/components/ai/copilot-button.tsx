'use client';

import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CopilotButtonProps {
  onClick: () => void;
  isOpen: boolean;
}

export function CopilotButton({ onClick, isOpen }: CopilotButtonProps) {
  return (
    <Button
      onClick={onClick}
      variant={isOpen ? 'secondary' : 'default'}
      size="sm"
      className={cn(
        'gap-2 transition-all',
        isOpen && 'bg-primary/10 text-primary'
      )}
    >
      <Sparkles className="h-4 w-4" />
      <span className="hidden md:inline">Copilot</span>
    </Button>
  );
}
