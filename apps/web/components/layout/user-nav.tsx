'use client';

import { signOut, useSession } from 'next-auth/react';
import { LogOut, Keyboard, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export function UserNav() {
  const { data: session } = useSession();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleLabel = (role?: string) => {
    const roles: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
      ADMIN: { label: 'Admin', variant: 'default' },
      PLANNER: { label: 'Planner', variant: 'secondary' },
      BRAND_MANAGER: { label: 'Brand Manager', variant: 'secondary' },
      BUYER: { label: 'Buyer', variant: 'outline' },
      VIEWER: { label: 'Viewer', variant: 'outline' },
    };
    return roles[role || ''] || { label: role || 'User', variant: 'outline' as const };
  };

  const handleKeyboardShortcuts = () => {
    // Trigger command menu with Ctrl/Cmd + K
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      metaKey: true,
      bubbles: true,
    });
    document.dispatchEvent(event);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {session?.user?.name ? getInitials(session.user.name) : 'U'}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium leading-none">
                {session?.user?.name}
              </p>
              <Badge variant={getRoleLabel(session?.user?.role).variant} className="text-xs">
                {getRoleLabel(session?.user?.role).label}
              </Badge>
            </div>
            <p className="text-xs leading-none text-muted-foreground">
              {session?.user?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Shield className="mr-2 h-4 w-4" />
          <span className="flex-1">Role Permissions</span>
          <span className="text-xs text-muted-foreground">{getRoleLabel(session?.user?.role).label}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleKeyboardShortcuts}>
          <Keyboard className="mr-2 h-4 w-4" />
          <span className="flex-1">Keyboard Shortcuts</span>
          <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            <span className="text-xs">⌘</span>K
          </kbd>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/login' })}>
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
