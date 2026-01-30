'use client';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Building2, Mail, Globe, Phone, Check, FileText } from 'lucide-react';
import { Supplier, SupplierRequestMethod, SUPPLIER_METHOD_CONFIG } from './types';

interface SupplierSelectorProps {
  suppliers: Supplier[];
  selectedId?: string;
  onSelect: (supplier: Supplier) => void;
  className?: string;
}

const methodIcons: Record<SupplierRequestMethod, typeof Mail> = {
  email: Mail,
  api: Globe,
  manual: FileText,
};

export function SupplierSelector({
  suppliers,
  selectedId,
  onSelect,
  className,
}: SupplierSelectorProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {suppliers.map((supplier) => {
        const isSelected = selectedId === supplier.id;
        const methodConfig = SUPPLIER_METHOD_CONFIG[supplier.method];
        const MethodIcon = methodIcons[supplier.method];

        return (
          <div
            key={supplier.id}
            onClick={() => onSelect(supplier)}
            className={cn(
              'flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all',
              'hover:shadow-md',
              isSelected
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                : 'border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:border-slate-300 dark:hover:border-neutral-600'
            )}
          >
            {/* Selection indicator */}
            <div
              className={cn(
                'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5',
                isSelected
                  ? 'border-blue-500 bg-blue-500'
                  : 'border-slate-300 dark:border-neutral-600'
              )}
            >
              {isSelected && <Check className="w-3 h-3 text-white" />}
            </div>

            {/* Supplier Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="w-4 h-4 text-slate-500 dark:text-neutral-400" />
                <span className="font-semibold text-slate-900 dark:text-white">
                  {supplier.name}
                </span>
                <Badge variant="outline" className="text-xs">
                  {supplier.code}
                </Badge>
              </div>

              <div className="space-y-1 text-sm text-slate-600 dark:text-neutral-400">
                <div className="flex items-center gap-2">
                  <Mail className="w-3 h-3" />
                  {supplier.email}
                </div>
                {supplier.contactPerson && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3 h-3" />
                    {supplier.contactPerson}
                    {supplier.phone && ` - ${supplier.phone}`}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <MethodIcon className="w-3 h-3" />
                  <span>Method: {methodConfig.label}</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default SupplierSelector;
