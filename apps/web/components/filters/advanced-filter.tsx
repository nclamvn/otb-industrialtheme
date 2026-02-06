'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NumberInput } from '@/components/ui/number-input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Filter,
  Plus,
  X,
  Save,
  Trash2,
  ChevronDown,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Filter field types
export type FilterFieldType = 'text' | 'number' | 'select' | 'multiselect' | 'date' | 'daterange' | 'boolean';

export interface FilterField {
  id: string;
  label: string;
  type: FilterFieldType;
  options?: { value: string; label: string }[];
  placeholder?: string;
}

export interface FilterCondition {
  fieldId: string;
  operator: string;
  value: string | string[] | boolean | number | { from: string; to: string };
}

export interface SavedFilter {
  id: string;
  name: string;
  conditions: FilterCondition[];
  isDefault?: boolean;
}

// Operators for different field types
const operatorsByType: Record<FilterFieldType, { value: string; label: string }[]> = {
  text: [
    { value: 'contains', label: 'Contains' },
    { value: 'equals', label: 'Equals' },
    { value: 'starts_with', label: 'Starts with' },
    { value: 'ends_with', label: 'Ends with' },
    { value: 'not_contains', label: 'Does not contain' },
    { value: 'is_empty', label: 'Is empty' },
    { value: 'is_not_empty', label: 'Is not empty' },
  ],
  number: [
    { value: 'equals', label: 'Equals' },
    { value: 'not_equals', label: 'Not equals' },
    { value: 'greater_than', label: 'Greater than' },
    { value: 'less_than', label: 'Less than' },
    { value: 'between', label: 'Between' },
  ],
  select: [
    { value: 'equals', label: 'Is' },
    { value: 'not_equals', label: 'Is not' },
    { value: 'is_empty', label: 'Is empty' },
  ],
  multiselect: [
    { value: 'contains_any', label: 'Contains any of' },
    { value: 'contains_all', label: 'Contains all of' },
    { value: 'not_contains', label: 'Does not contain' },
  ],
  date: [
    { value: 'equals', label: 'Is' },
    { value: 'before', label: 'Before' },
    { value: 'after', label: 'After' },
    { value: 'between', label: 'Between' },
    { value: 'is_empty', label: 'Is empty' },
  ],
  daterange: [
    { value: 'within', label: 'Within' },
    { value: 'outside', label: 'Outside' },
  ],
  boolean: [
    { value: 'is_true', label: 'Is true' },
    { value: 'is_false', label: 'Is false' },
  ],
};

interface AdvancedFilterProps {
  fields: FilterField[];
  conditions: FilterCondition[];
  onConditionsChange: (conditions: FilterCondition[]) => void;
  savedFilters?: SavedFilter[];
  onSaveFilter?: (name: string, conditions: FilterCondition[]) => void;
  onLoadFilter?: (filter: SavedFilter) => void;
  onDeleteFilter?: (filterId: string) => void;
}

export function AdvancedFilter({
  fields,
  conditions,
  onConditionsChange,
  savedFilters = [],
  onSaveFilter,
  onLoadFilter,
  onDeleteFilter,
}: AdvancedFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filterName, setFilterName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const addCondition = useCallback(() => {
    const defaultField = fields[0];
    const defaultOperator = operatorsByType[defaultField.type][0].value;

    onConditionsChange([
      ...conditions,
      {
        fieldId: defaultField.id,
        operator: defaultOperator,
        value: '',
      },
    ]);
  }, [fields, conditions, onConditionsChange]);

  const updateCondition = useCallback(
    (index: number, updates: Partial<FilterCondition>) => {
      const newConditions = [...conditions];
      newConditions[index] = { ...newConditions[index], ...updates };

      // Reset value when field changes
      if (updates.fieldId) {
        const field = fields.find((f) => f.id === updates.fieldId);
        if (field) {
          const defaultOperator = operatorsByType[field.type][0].value;
          newConditions[index].operator = defaultOperator;
          newConditions[index].value = '';
        }
      }

      onConditionsChange(newConditions);
    },
    [conditions, fields, onConditionsChange]
  );

  const removeCondition = useCallback(
    (index: number) => {
      onConditionsChange(conditions.filter((_, i) => i !== index));
    },
    [conditions, onConditionsChange]
  );

  const clearAll = useCallback(() => {
    onConditionsChange([]);
  }, [onConditionsChange]);

  const handleSaveFilter = useCallback(() => {
    if (!filterName.trim()) {
      toast.error('Please enter a filter name');
      return;
    }
    onSaveFilter?.(filterName, conditions);
    setFilterName('');
    setShowSaveDialog(false);
    toast.success('Filter saved');
  }, [filterName, conditions, onSaveFilter]);

  const getFieldById = (fieldId: string) => fields.find((f) => f.id === fieldId);

  const activeFilterCount = conditions.filter(
    (c) => c.value !== '' && c.value !== undefined
  ).length;

  return (
    <div className="flex items-center gap-2">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[600px] p-0" align="start">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Advanced Filters</h4>
              <div className="flex items-center gap-2">
                {conditions.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearAll}>
                    Clear all
                  </Button>
                )}
                <Button size="sm" onClick={addCondition}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add filter
                </Button>
              </div>
            </div>
          </div>

          <ScrollArea className="max-h-[400px]">
            <div className="p-4 space-y-3">
              {conditions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Filter className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No filters applied</p>
                  <p className="text-xs">Click &quot;Add filter&quot; to get started</p>
                </div>
              ) : (
                conditions.map((condition, index) => {
                  const field = getFieldById(condition.fieldId);
                  if (!field) return null;

                  const operators = operatorsByType[field.type];

                  return (
                    <div
                      key={index}
                      className="flex items-start gap-2 p-3 rounded-lg border bg-muted/30"
                    >
                      <div className="flex-1 grid gap-2 md:grid-cols-3">
                        {/* Field Select */}
                        <Select
                          value={condition.fieldId}
                          onValueChange={(value) =>
                            updateCondition(index, { fieldId: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select field" />
                          </SelectTrigger>
                          <SelectContent>
                            {fields.map((f) => (
                              <SelectItem key={f.id} value={f.id}>
                                {f.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {/* Operator Select */}
                        <Select
                          value={condition.operator}
                          onValueChange={(value) =>
                            updateCondition(index, { operator: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select operator" />
                          </SelectTrigger>
                          <SelectContent>
                            {operators.map((op) => (
                              <SelectItem key={op.value} value={op.value}>
                                {op.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {/* Value Input */}
                        {!['is_empty', 'is_not_empty', 'is_true', 'is_false'].includes(
                          condition.operator
                        ) && (
                          <FilterValueInput
                            field={field}
                            value={condition.value}
                            onChange={(value) => updateCondition(index, { value })}
                          />
                        )}
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0"
                        onClick={() => removeCondition(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>

          {/* Saved Filters */}
          {(savedFilters.length > 0 || conditions.length > 0) && (
            <>
              <Separator />
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium">Saved Filters</Label>
                  {conditions.length > 0 && onSaveFilter && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowSaveDialog(true)}
                    >
                      <Save className="h-4 w-4 mr-1" />
                      Save current
                    </Button>
                  )}
                </div>

                {showSaveDialog && (
                  <div className="flex items-center gap-2 mb-3 p-2 rounded-lg border bg-muted/30">
                    <Input
                      placeholder="Filter name"
                      value={filterName}
                      onChange={(e) => setFilterName(e.target.value)}
                      className="flex-1"
                    />
                    <Button size="sm" onClick={handleSaveFilter}>
                      Save
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowSaveDialog(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                )}

                <div className="space-y-1">
                  {savedFilters.map((filter) => (
                    <div
                      key={filter.id}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 cursor-pointer group"
                      onClick={() => onLoadFilter?.(filter)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{filter.name}</span>
                        {filter.isDefault && (
                          <Badge variant="secondary" className="text-xs">
                            Default
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {filter.conditions.length} conditions
                        </Badge>
                      </div>
                      {onDeleteFilter && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteFilter(filter.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {savedFilters.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      No saved filters
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </PopoverContent>
      </Popover>

      {/* Active Filter Badges */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          {conditions.map((condition, index) => {
            const field = getFieldById(condition.fieldId);
            if (!field || !condition.value) return null;

            return (
              <Badge key={index} variant="secondary" className="gap-1">
                {field.label}: {String(condition.value).substring(0, 20)}
                <button
                  onClick={() => removeCondition(index)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Value Input Component
interface FilterValueInputProps {
  field: FilterField;
  value: FilterCondition['value'];
  onChange: (value: FilterCondition['value']) => void;
}

function FilterValueInput({ field, value, onChange }: FilterValueInputProps) {
  if (field.type === 'select' && field.options) {
    return (
      <Select
        value={value as string}
        onValueChange={onChange}
      >
        <SelectTrigger>
          <SelectValue placeholder={field.placeholder || 'Select...'} />
        </SelectTrigger>
        <SelectContent>
          {field.options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  if (field.type === 'multiselect' && field.options) {
    const selectedValues = (value as string[]) || [];

    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            {selectedValues.length > 0
              ? `${selectedValues.length} selected`
              : field.placeholder || 'Select...'}
            <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandInput placeholder="Search..." />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup>
                {field.options.map((option) => {
                  const isSelected = selectedValues.includes(option.value);
                  return (
                    <CommandItem
                      key={option.value}
                      onSelect={() => {
                        if (isSelected) {
                          onChange(selectedValues.filter((v) => v !== option.value));
                        } else {
                          onChange([...selectedValues, option.value]);
                        }
                      }}
                    >
                      <div
                        className={cn(
                          'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                          isSelected
                            ? 'bg-primary text-primary-foreground'
                            : 'opacity-50 [&_svg]:invisible'
                        )}
                      >
                        <Check className="h-4 w-4" />
                      </div>
                      {option.label}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  }

  if (field.type === 'number') {
    return (
      <NumberInput
        value={value !== undefined && value !== '' ? parseFloat(value as string) : undefined}
        onChange={(val) => onChange(val !== undefined ? String(val) : '')}
        placeholder={field.placeholder || 'Enter value...'}
      />
    );
  }

  if (field.type === 'date') {
    return (
      <Input
        type="date"
        value={value as string}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  return (
    <Input
      type="text"
      value={value as string}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.placeholder || 'Enter value...'}
    />
  );
}
