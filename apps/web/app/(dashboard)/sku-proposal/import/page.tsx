'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Upload, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/shared/page-header';
import { ExcelImporter } from '@/components/excel';
import { ParsedSKU } from '@/lib/excel';

interface SKUProposal {
  id: string;
  name: string;
  status: string;
  otbPlan: {
    id: string;
    name: string;
    budget: {
      season: { code: string };
      brand: { name: string };
    };
  };
}

export default function SKUImportPage() {
  const router = useRouter();
  const [proposals, setProposals] = useState<SKUProposal[]>([]);
  const [selectedProposalId, setSelectedProposalId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchProposals = useCallback(async () => {
    try {
      // Fetch draft/rejected proposals that can receive imports
      const response = await fetch('/api/v1/sku-proposals?status=DRAFT');
      const data = await response.json();
      if (data.success) {
        setProposals(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch proposals:', error);
      toast.error('Failed to load proposals');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  const handleImport = async (data: ParsedSKU[]) => {
    if (!selectedProposalId) {
      toast.error('Please select a proposal first');
      throw new Error('No proposal selected');
    }

    const response = await fetch(`/api/v1/sku-proposals/${selectedProposalId}/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: data }),
    });

    const result = await response.json();

    if (result.success) {
      toast.success(`Successfully imported ${data.length} SKUs`);
      // Navigate after a short delay to let user see success state
      setTimeout(() => {
        router.push(`/sku-proposal/${selectedProposalId}?edit=true`);
      }, 1500);
    } else {
      throw new Error(result.error || 'Failed to import SKUs');
    }
  };

  const selectedProposal = proposals.find(p => p.id === selectedProposalId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Import SKUs from Excel"
        description="Upload an Excel file to bulk import SKU data into a proposal"
        showBackButton
        backHref="/sku-proposal"
      />

      {/* Proposal Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Select Target Proposal
          </CardTitle>
          <CardDescription>
            Choose which SKU proposal should receive the imported data
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-16">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : proposals.length === 0 ? (
            <div className="text-center py-8">
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No draft proposals available</p>
              <p className="text-sm text-muted-foreground mt-1">
                Create a new proposal first to import SKUs
              </p>
              <Button
                className="mt-4"
                onClick={() => router.push('/sku-proposal/new')}
              >
                Create New Proposal
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="proposal">Target Proposal</Label>
                <Select value={selectedProposalId} onValueChange={setSelectedProposalId}>
                  <SelectTrigger className="w-full max-w-md">
                    <SelectValue placeholder="Select a proposal..." />
                  </SelectTrigger>
                  <SelectContent>
                    {proposals.map((proposal) => (
                      <SelectItem key={proposal.id} value={proposal.id}>
                        {proposal.name} ({proposal.otbPlan.budget.season.code} - {proposal.otbPlan.budget.brand.name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedProposal && (
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Selected Proposal Details</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Name</p>
                      <p className="font-medium">{selectedProposal.name}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Season</p>
                      <p className="font-medium">{selectedProposal.otbPlan.budget.season.code}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Brand</p>
                      <p className="font-medium">{selectedProposal.otbPlan.budget.brand.name}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Excel Importer */}
      {selectedProposalId && (
        <ExcelImporter
          onImport={handleImport}
        />
      )}
    </div>
  );
}
