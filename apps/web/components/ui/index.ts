import * as React from 'react';

/**
 * Optimized barrel exports for UI components
 *
 * IMPORTANT: Only export what's commonly used together.
 * For rarely used components, import directly from their files.
 *
 * This approach enables better tree-shaking and smaller bundles.
 */

// Core layout components
export { Button, type ButtonProps, buttonVariants } from './button';
export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card';
export { Badge, type BadgeProps, badgeVariants } from './badge';

// Form components
export { Input } from './input';
export type InputProps = React.ComponentProps<'input'>;
export { Label } from './label';
export { Checkbox } from './checkbox';
export {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
} from './select';

// Overlay components
export {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from './dialog';
export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './alert-dialog';
export {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from './dropdown-menu';
export { Popover, PopoverContent, PopoverTrigger } from './popover';
export {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './tooltip';

// Navigation components
export { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
export { ScrollArea, ScrollBar } from './scroll-area';
export { Separator } from './separator';

// Feedback components
export { Progress } from './progress';
export { Skeleton } from './skeleton';
export { Alert, AlertDescription, AlertTitle } from './alert';

// Data display
export { Avatar, AvatarFallback, AvatarImage } from './avatar';
export { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table';
