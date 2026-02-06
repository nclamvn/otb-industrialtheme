'use client';

import React, { useState } from 'react';
import { Pencil, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InlineEditCell } from './InlineEditCell';
import { InlineEditNumber } from './InlineEditNumber';
import { InlineEditSelect } from './InlineEditSelect';

const statusOptions = [
  { value: 'draft', label: 'Draft', color: 'bg-gray-100 text-gray-700' },
  { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-700', icon: <Clock className="w-3 h-3" /> },
  { value: 'approved', label: 'Approved', color: 'bg-green-100 text-green-700', icon: <CheckCircle className="w-3 h-3" /> },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-700', icon: <XCircle className="w-3 h-3" /> },
];

interface DemoItem {
  id: string;
  name: string;
  amount: number;
  quantity: number;
  status: string;
}

export function InlineEditDemo() {
  const [items, setItems] = useState<DemoItem[]>([
    { id: '1', name: 'Classic Leather Tote', amount: 125000, quantity: 150, status: 'approved' },
    { id: '2', name: 'Mini Crossbody Bag', amount: 89500, quantity: 200, status: 'pending' },
    { id: '3', name: 'Business Briefcase', amount: 245000, quantity: 75, status: 'draft' },
  ]);

  const updateItem = (id: string, field: keyof DemoItem, value: string | number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  // Simulate async save
  const simulateSave = async () => {
    await new Promise((resolve) => setTimeout(resolve, 500));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Pencil className="w-5 h-5 text-[#D7B797]" />
          Inline Edit Components
        </CardTitle>
        <CardDescription>
          Click to edit, Enter to save, Esc to cancel
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left p-3 text-xs font-medium">Product Name</th>
                <th className="text-right p-3 text-xs font-medium">Amount</th>
                <th className="text-right p-3 text-xs font-medium">Quantity</th>
                <th className="text-center p-3 text-xs font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="p-3">
                    <InlineEditCell
                      value={item.name}
                      onSave={async (value) => {
                        await simulateSave();
                        updateItem(item.id, 'name', value);
                      }}
                      placeholder="Enter product name"
                      required
                      minLength={3}
                    />
                  </td>
                  <td className="p-3 text-right">
                    <InlineEditNumber
                      value={item.amount}
                      onSave={async (value) => {
                        await simulateSave();
                        updateItem(item.id, 'amount', value);
                      }}
                      prefix="$"
                      min={0}
                      max={1000000}
                      step={1000}
                      showChange
                      formatDisplay={(val) => `$${val.toLocaleString()}`}
                    />
                  </td>
                  <td className="p-3 text-right">
                    <InlineEditNumber
                      value={item.quantity}
                      onSave={async (value) => {
                        await simulateSave();
                        updateItem(item.id, 'quantity', value);
                      }}
                      min={0}
                      max={1000}
                      step={10}
                      showChange
                    />
                  </td>
                  <td className="p-3 text-center">
                    <InlineEditSelect
                      value={item.status}
                      options={statusOptions}
                      onSave={async (value) => {
                        await simulateSave();
                        updateItem(item.id, 'status', value);
                      }}
                      displayAsBadge
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 p-3 rounded-lg bg-muted/30 text-xs text-muted-foreground space-y-1">
          <p><strong>Text Cell:</strong> Click to edit, validates required/length</p>
          <p><strong>Number Cell:</strong> Supports min/max/step, shows change indicator</p>
          <p><strong>Select Cell:</strong> Badge display with status colors</p>
          <p><strong>Keyboard:</strong> Enter = Save, Esc = Cancel, Arrow keys = Adjust numbers</p>
        </div>
      </CardContent>
    </Card>
  );
}
