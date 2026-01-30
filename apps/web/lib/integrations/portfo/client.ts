/**
 * Portfo API Client
 *
 * Mock implementation for Portfo integration.
 * Replace with real API calls when Portfo API docs are available.
 */

import {
  SRDDocument,
  PortfoUploadRequest,
  PortfoUploadResponse,
  PortfoUploadStatus,
  PortfoUploadHistory,
} from '@/components/integrations/portfo/types';

export interface PortfoClientConfig {
  baseUrl?: string;
  apiKey?: string;
  timeout?: number;
}

export class PortfoClient {
  private baseUrl: string;
  private apiKey?: string;
  private timeout: number;

  constructor(config: PortfoClientConfig = {}) {
    this.baseUrl = config.baseUrl || process.env.NEXT_PUBLIC_PORTFO_API_URL || '/api/integrations/portfo';
    this.apiKey = config.apiKey || process.env.PORTFO_API_KEY;
    this.timeout = config.timeout || 30000;
  }

  /**
   * Upload SRD document to Portfo
   */
  async uploadSRD(request: PortfoUploadRequest): Promise<PortfoUploadResponse> {
    // Mock implementation - simulate network delay
    await this.simulateDelay(2000);

    // In production, this would be:
    // const response = await fetch(`${this.baseUrl}/srd/upload`, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${this.apiKey}`,
    //   },
    //   body: JSON.stringify(request),
    // });
    // return response.json();

    // Mock success response
    const portfoId = this.generatePortfoId(request.document);

    return {
      success: true,
      portfoId,
      portfoUrl: `https://portfo.example.com/documents/${portfoId}`,
      timestamp: new Date(),
    };
  }

  /**
   * Get upload status
   */
  async getUploadStatus(uploadId: string): Promise<PortfoUploadStatus | null> {
    await this.simulateDelay(200);

    // Mock implementation
    // In production, fetch from API
    return null;
  }

  /**
   * Get upload history for a budget/season
   */
  async getUploadHistory(params: {
    season?: string;
    brand?: string;
    limit?: number;
  }): Promise<PortfoUploadHistory[]> {
    await this.simulateDelay(300);

    // Mock data
    const now = new Date();

    return [
      {
        id: 'upload-1',
        documentId: 'doc-1',
        documentType: 'otb_plan',
        season: 'SS26',
        brand: 'REX',
        portfoId: 'PORTFO-2026-SS26-REX-001',
        portfoUrl: 'https://portfo.example.com/documents/PORTFO-2026-SS26-REX-001',
        status: 'success',
        uploadedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        uploadedBy: { id: 'user-1', name: 'John Doe' },
        budget: 1037575,
      },
      {
        id: 'upload-2',
        documentId: 'doc-2',
        documentType: 'otb_plan',
        season: 'FW25',
        brand: 'TTP',
        portfoId: 'PORTFO-2025-FW25-TTP-001',
        portfoUrl: 'https://portfo.example.com/documents/PORTFO-2025-FW25-TTP-001',
        status: 'success',
        uploadedAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        uploadedBy: { id: 'user-2', name: 'Jane Smith' },
        budget: 850000,
      },
    ];
  }

  /**
   * Verify connection to Portfo
   */
  async verifyConnection(): Promise<{ connected: boolean; message: string }> {
    await this.simulateDelay(500);

    // Mock - always connected
    return {
      connected: true,
      message: 'Connected to Portfo API (mock)',
    };
  }

  /**
   * Transform OTB plan data to Portfo SRD format
   */
  transformToSRD(otbPlan: {
    id: string;
    season: string;
    brand: string;
    version: string;
    totalBudget: number;
    allocations: Array<{
      collection: string;
      gender: string;
      category: string;
      amount: number;
    }>;
    approvedAt: Date;
    approvedBy: string;
    createdAt: Date;
    createdBy: string;
  }): SRDDocument {
    return {
      id: otbPlan.id,
      type: 'otb_plan',
      version: otbPlan.version,
      season: otbPlan.season,
      brand: otbPlan.brand,
      data: {
        totalBudget: otbPlan.totalBudget,
        allocations: otbPlan.allocations.map((alloc) => ({
          collection: alloc.collection,
          gender: alloc.gender,
          category: alloc.category,
          amount: alloc.amount,
          percentage: (alloc.amount / otbPlan.totalBudget) * 100,
        })),
      },
      metadata: {
        createdAt: otbPlan.createdAt,
        createdBy: otbPlan.createdBy,
        approvedAt: otbPlan.approvedAt,
        approvedBy: otbPlan.approvedBy,
      },
    };
  }

  // Private helpers

  private simulateDelay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private generatePortfoId(document: SRDDocument): string {
    const year = new Date().getFullYear();
    const random = Math.random().toString(36).substr(2, 3).toUpperCase();
    return `PORTFO-${year}-${document.season}-${document.brand}-${random}`;
  }
}

// Export singleton instance
export const portfoClient = new PortfoClient();

export default portfoClient;
