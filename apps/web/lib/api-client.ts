/**
 * API Client for communicating with NestJS Backend
 * This client handles all HTTP requests to the backend API
 */

import { getSession } from 'next-auth/react';

// API Base URL - defaults to localhost:3001 for development
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Get authorization header with JWT token from NextAuth session
   */
  private async getAuthHeader(): Promise<Record<string, string>> {
    if (typeof window !== 'undefined') {
      const session = await getSession();
      if (session?.accessToken) {
        return { Authorization: `Bearer ${session.accessToken}` };
      }
    }
    return {};
  }

  /**
   * Build URL with query parameters
   */
  private buildUrl(endpoint: string, params?: Record<string, string | number | boolean | undefined>): string {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    return url.toString();
  }

  /**
   * Make HTTP request to the API
   */
  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const { params, ...fetchOptions } = options;
    const url = this.buildUrl(endpoint, params);
    const authHeader = await this.getAuthHeader();

    const response = await fetch(url, {
      ...fetchOptions,
      headers: {
        'Content-Type': 'application/json',
        ...authHeader,
        ...fetchOptions.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || data.error || 'Request failed',
      };
    }

    return data;
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, params?: Record<string, string | number | boolean | undefined>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET', params });
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export class for custom instances
export { ApiClient };

// ============================================
// API Endpoints
// ============================================

// Auth endpoints
export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post<{ accessToken: string; user: unknown }>('/api/v1/auth/login', { email, password }),

  getProfile: () =>
    apiClient.get<unknown>('/api/v1/auth/profile'),

  getMe: () =>
    apiClient.get<unknown>('/api/v1/auth/me'),
};

// Brands endpoints
export const brandsApi = {
  getAll: (params?: { page?: number; limit?: number; isActive?: boolean }) =>
    apiClient.get<unknown[]>('/api/v1/brands', params),

  getById: (id: string) =>
    apiClient.get<unknown>(`/api/v1/brands/${id}`),

  create: (data: { name: string; code: string; description?: string }) =>
    apiClient.post<unknown>('/api/v1/brands', data),

  update: (id: string, data: Partial<{ name: string; code: string; description?: string; isActive: boolean }>) =>
    apiClient.patch<unknown>(`/api/v1/brands/${id}`, data),

  delete: (id: string) =>
    apiClient.delete<{ deleted: boolean }>(`/api/v1/brands/${id}`),
};

// Categories endpoints
export const categoriesApi = {
  getAll: (params?: { page?: number; limit?: number; isActive?: boolean }) =>
    apiClient.get<unknown[]>('/api/v1/categories', params),

  getById: (id: string) =>
    apiClient.get<unknown>(`/api/v1/categories/${id}`),

  create: (data: { name: string; code: string; description?: string }) =>
    apiClient.post<unknown>('/api/v1/categories', data),

  update: (id: string, data: Partial<{ name: string; code: string; description?: string; isActive: boolean }>) =>
    apiClient.patch<unknown>(`/api/v1/categories/${id}`, data),

  delete: (id: string) =>
    apiClient.delete<{ deleted: boolean }>(`/api/v1/categories/${id}`),
};

// Locations endpoints
export const locationsApi = {
  getAll: (params?: { page?: number; limit?: number; isActive?: boolean }) =>
    apiClient.get<unknown[]>('/api/v1/locations', params),

  getById: (id: string) =>
    apiClient.get<unknown>(`/api/v1/locations/${id}`),

  create: (data: { name: string; code: string; type: string }) =>
    apiClient.post<unknown>('/api/v1/locations', data),

  update: (id: string, data: Partial<{ name: string; code: string; type: string; isActive: boolean }>) =>
    apiClient.patch<unknown>(`/api/v1/locations/${id}`, data),

  delete: (id: string) =>
    apiClient.delete<{ deleted: boolean }>(`/api/v1/locations/${id}`),
};

// Seasons endpoints
export const seasonsApi = {
  getAll: (params?: { page?: number; limit?: number; isActive?: boolean }) =>
    apiClient.get<unknown[]>('/api/v1/seasons', params),

  getById: (id: string) =>
    apiClient.get<unknown>(`/api/v1/seasons/${id}`),

  create: (data: { name: string; code: string; year: number }) =>
    apiClient.post<unknown>('/api/v1/seasons', data),

  update: (id: string, data: Partial<{ name: string; code: string; year: number; isActive: boolean }>) =>
    apiClient.patch<unknown>(`/api/v1/seasons/${id}`, data),

  delete: (id: string) =>
    apiClient.delete<{ deleted: boolean }>(`/api/v1/seasons/${id}`),
};

// Divisions endpoints
export const divisionsApi = {
  getAll: (params?: { page?: number; limit?: number; isActive?: boolean }) =>
    apiClient.get<unknown[]>('/api/v1/divisions', params),

  getById: (id: string) =>
    apiClient.get<unknown>(`/api/v1/divisions/${id}`),

  create: (data: { name: string; code: string; description?: string }) =>
    apiClient.post<unknown>('/api/v1/divisions', data),

  update: (id: string, data: Partial<{ name: string; code: string; description?: string; isActive: boolean }>) =>
    apiClient.patch<unknown>(`/api/v1/divisions/${id}`, data),

  delete: (id: string) =>
    apiClient.delete<{ deleted: boolean }>(`/api/v1/divisions/${id}`),
};

// Budgets endpoints
export const budgetsApi = {
  getAll: (params?: { page?: number; limit?: number; status?: string; seasonId?: string }) =>
    apiClient.get<unknown[]>('/api/v1/budgets', params),

  getById: (id: string) =>
    apiClient.get<unknown>(`/api/v1/budgets/${id}`),

  create: (data: unknown) =>
    apiClient.post<unknown>('/api/v1/budgets', data),

  update: (id: string, data: unknown) =>
    apiClient.patch<unknown>(`/api/v1/budgets/${id}`, data),

  delete: (id: string) =>
    apiClient.delete<{ deleted: boolean }>(`/api/v1/budgets/${id}`),

  submit: (id: string) =>
    apiClient.post<unknown>(`/api/v1/budgets/${id}/submit`),

  approve: (id: string, comments?: string) =>
    apiClient.post<unknown>(`/api/v1/budgets/${id}/approve`, { comments }),

  reject: (id: string, reason: string) =>
    apiClient.post<unknown>(`/api/v1/budgets/${id}/reject`, { reason }),

  // ============================================
  // Budget Tree APIs (Task #1 - Budget Flow)
  // ============================================

  /** Get hierarchical budget tree */
  getTree: (id: string) =>
    apiClient.get<{ budget: unknown; tree: unknown[]; nodeCount: number }>(`/api/v1/budgets/${id}/tree`),

  /** Get a specific tree node */
  getNode: (id: string, nodeId: string) =>
    apiClient.get<unknown>(`/api/v1/budgets/${id}/tree/nodes/${nodeId}`),

  /** Initialize tree from master data */
  initializeTree: (id: string, options?: { includeBrands?: boolean; includeGenders?: boolean; includeCategories?: boolean; includeSubcategories?: boolean; defaultPercentages?: Record<string, number> }) =>
    apiClient.post<{ message: string; nodeCount: number }>(`/api/v1/budgets/${id}/tree/initialize`, options),

  /** Create a new tree node */
  createNode: (id: string, data: { parentId?: string; level: number; name: string; nodeType: string; budgetValue: number; allocatedValue?: number; percentage?: number; status?: string; brandId?: string; categoryId?: string; subcategoryId?: string; gender?: string; sortOrder?: number; metadata?: Record<string, unknown> }) =>
    apiClient.post<unknown>(`/api/v1/budgets/${id}/tree/nodes`, data),

  /** Update a tree node budget */
  updateNode: (id: string, nodeId: string, data: { name?: string; budgetValue?: number; allocatedValue?: number; percentage?: number; status?: string; isLocked?: boolean; sortOrder?: number; metadata?: Record<string, unknown> }) =>
    apiClient.patch<unknown>(`/api/v1/budgets/${id}/nodes/${nodeId}`, data),

  /** Delete a tree node */
  deleteNode: (id: string, nodeId: string) =>
    apiClient.delete<{ deleted: boolean }>(`/api/v1/budgets/${id}/nodes/${nodeId}`),

  /** Batch update multiple nodes */
  batchUpdateNodes: (id: string, updates: { nodeId: string; budgetValue: number; reason?: string }[]) =>
    apiClient.post<unknown[]>(`/api/v1/budgets/${id}/tree/batch-update`, { updates }),

  // ============================================
  // Gap Analysis APIs (Task #3 - Gap Copilot)
  // ============================================

  /** Run gap analysis on budget tree */
  analyzeGaps: (id: string, options?: { minGapPercent?: number; levels?: number[]; includeChildren?: boolean }) =>
    apiClient.post<{ totalNodes: number; nodesWithGaps: number; totalBudget: number; totalAllocated: number; totalGap: number; avgGapPercent: number; bySeverity: Record<string, number>; byType: Record<string, number>; results: unknown[] }>(`/api/v1/budgets/${id}/analyze-gaps`, options),

  /** Get latest gap analysis results */
  getGapAnalysis: (id: string) =>
    apiClient.get<unknown>(`/api/v1/budgets/${id}/gaps`),

  /** Get nodes with significant gaps */
  getSignificantGaps: (id: string, minGapPercent?: number) =>
    apiClient.get<unknown[]>(`/api/v1/budgets/${id}/gaps/significant`, { minGapPercent }),

  // ============================================
  // AI Suggestions APIs (Task #3 - Gap Copilot)
  // ============================================

  /** Generate AI-powered budget suggestions */
  generateSuggestions: (id: string, options?: { maxSuggestions?: number; minConfidence?: number; focusNodeIds?: string[]; types?: string[] }) =>
    apiClient.post<unknown[]>(`/api/v1/budgets/${id}/ai-suggestions`, options),

  /** Get pending suggestions for budget */
  getPendingSuggestions: (id: string) =>
    apiClient.get<unknown[]>(`/api/v1/budgets/${id}/suggestions`),

  /** Get a specific suggestion */
  getSuggestion: (id: string, suggestionId: string) =>
    apiClient.get<unknown>(`/api/v1/budgets/${id}/suggestions/${suggestionId}`),

  /** Apply a suggestion */
  applySuggestion: (id: string, suggestionId: string, options?: { applyToNodeIds?: string[]; comment?: string }) =>
    apiClient.post<{ success: boolean; appliedActions: number }>(`/api/v1/budgets/${id}/suggestions/${suggestionId}/apply`, options),

  /** Dismiss a suggestion */
  dismissSuggestion: (id: string, suggestionId: string, reason: string) =>
    apiClient.post<{ success: boolean }>(`/api/v1/budgets/${id}/suggestions/${suggestionId}/dismiss`, { reason }),

  // ============================================
  // Version History APIs (Task #4 - Version History)
  // ============================================

  /** List all versions for a budget */
  getVersions: (id: string, params?: { page?: number; limit?: number; status?: string; tags?: string[] }) => {
    const { tags, ...rest } = params || {};
    const queryParams: Record<string, string | number | boolean | undefined> = { ...rest };
    if (tags && tags.length > 0) {
      queryParams.tags = tags.join(',');
    }
    return apiClient.get<{ data: unknown[]; meta: { total: number; page: number; limit: number; totalPages: number } }>(`/api/v1/budgets/${id}/versions`, queryParams);
  },

  /** Create a new version (snapshot) */
  createVersion: (id: string, data: { name: string; description?: string; tags?: string[] }) =>
    apiClient.post<unknown>(`/api/v1/budgets/${id}/versions`, data),

  /** Get current (active) version */
  getCurrentVersion: (id: string) =>
    apiClient.get<unknown>(`/api/v1/budgets/${id}/versions/current`),

  /** Get a specific version */
  getVersion: (id: string, versionId: string) =>
    apiClient.get<unknown>(`/api/v1/budgets/${id}/versions/${versionId}`),

  /** Submit a version for approval */
  submitVersion: (id: string, versionId: string, comments?: string) =>
    apiClient.post<unknown>(`/api/v1/budgets/${id}/versions/${versionId}/submit`, { comments }),

  /** Approve a version */
  approveVersion: (id: string, versionId: string, comments?: string) =>
    apiClient.post<unknown>(`/api/v1/budgets/${id}/versions/${versionId}/approve`, { comments }),

  /** Reject a version */
  rejectVersion: (id: string, versionId: string, reason: string) =>
    apiClient.post<unknown>(`/api/v1/budgets/${id}/versions/${versionId}/reject`, { reason }),

  /** Compare two versions */
  compareVersions: (id: string, version1: string, version2: string) =>
    apiClient.post<{ version1: unknown; version2: unknown; summary: { totalBudgetDiff: number; totalBudgetDiffPercent: number; totalAllocatedDiff: number; totalAllocatedDiffPercent: number; nodesAdded: number; nodesRemoved: number; nodesModified: number; nodesUnchanged: number }; changes: unknown[] }>(`/api/v1/budgets/${id}/versions/compare`, { version1, version2 }),

  /** Rollback to a specific version */
  rollback: (id: string, versionId: string, options?: { createBackup?: boolean; reason?: string }) =>
    apiClient.post<{ success: boolean; newVersionId?: string }>(`/api/v1/budgets/${id}/rollback/${versionId}`, options),
};

// OTB Plans endpoints
export const otbPlansApi = {
  getAll: (params?: { page?: number; limit?: number; status?: string; budgetId?: string }) =>
    apiClient.get<unknown[]>('/api/v1/otb-plans', params),

  getById: (id: string) =>
    apiClient.get<unknown>(`/api/v1/otb-plans/${id}`),

  create: (data: unknown) =>
    apiClient.post<unknown>('/api/v1/otb-plans', data),

  update: (id: string, data: unknown) =>
    apiClient.patch<unknown>(`/api/v1/otb-plans/${id}`, data),

  delete: (id: string) =>
    apiClient.delete<{ deleted: boolean }>(`/api/v1/otb-plans/${id}`),

  submit: (id: string) =>
    apiClient.post<unknown>(`/api/v1/otb-plans/${id}/submit`),

  approve: (id: string, comments?: string) =>
    apiClient.post<unknown>(`/api/v1/otb-plans/${id}/approve`, { comments }),

  reject: (id: string, reason: string) =>
    apiClient.post<unknown>(`/api/v1/otb-plans/${id}/reject`, { reason }),

  getSizing: (id: string) =>
    apiClient.get<unknown>(`/api/v1/otb-plans/${id}/sizing`),

  saveSizing: (id: string, data: { categoryId: string; gender: string; sizeData: Record<string, number> }) =>
    apiClient.post<unknown>(`/api/v1/otb-plans/${id}/sizing`, data),

  generateAIProposal: (id: string) =>
    apiClient.post<unknown>(`/api/v1/otb-plans/${id}/ai-proposal`),
};

// SKU Proposals endpoints
export const skuProposalsApi = {
  getAll: (params?: { page?: number; limit?: number; status?: string; otbPlanId?: string }) =>
    apiClient.get<unknown[]>('/api/v1/sku-proposals', params),

  getById: (id: string) =>
    apiClient.get<unknown>(`/api/v1/sku-proposals/${id}`),

  create: (data: unknown) =>
    apiClient.post<unknown>('/api/v1/sku-proposals', data),

  update: (id: string, data: unknown) =>
    apiClient.patch<unknown>(`/api/v1/sku-proposals/${id}`, data),

  delete: (id: string) =>
    apiClient.delete<{ deleted: boolean }>(`/api/v1/sku-proposals/${id}`),

  submit: (id: string) =>
    apiClient.post<unknown>(`/api/v1/sku-proposals/${id}/submit`),

  approve: (id: string, comments?: string) =>
    apiClient.post<unknown>(`/api/v1/sku-proposals/${id}/approve`, { comments }),

  reject: (id: string, reason: string) =>
    apiClient.post<unknown>(`/api/v1/sku-proposals/${id}/reject`, { reason }),

  importItems: (id: string, items: unknown[]) =>
    apiClient.post<unknown>(`/api/v1/sku-proposals/${id}/import`, { items }),

  validateItems: (id: string) =>
    apiClient.post<unknown>(`/api/v1/sku-proposals/${id}/validate`),

  enrichItems: (id: string, itemIds?: string[]) =>
    apiClient.post<unknown>(`/api/v1/sku-proposals/${id}/enrich`, { itemIds }),
};

// Health endpoints (no auth required)
export const healthApi = {
  check: () =>
    apiClient.get<{ status: string; timestamp: string; services: Record<string, string> }>('/api/v1/health'),

  ping: () =>
    apiClient.get<{ pong: boolean; timestamp: string }>('/api/v1/health/ping'),
};

// Users endpoints
export const usersApi = {
  getAll: (params?: { page?: number; limit?: number; role?: string; status?: string; search?: string }) =>
    apiClient.get<unknown[]>('/api/v1/users', params),

  getById: (id: string) =>
    apiClient.get<unknown>(`/api/v1/users/${id}`),

  getMe: () =>
    apiClient.get<unknown>('/api/v1/users/me'),

  getMyPreferences: () =>
    apiClient.get<unknown>('/api/v1/users/me/preferences'),

  updateMyPreferences: (data: Record<string, unknown>) =>
    apiClient.patch<unknown>('/api/v1/users/me/preferences', data),

  changePassword: (currentPassword: string, newPassword: string) =>
    apiClient.patch<unknown>('/api/v1/users/me/password', { currentPassword, newPassword }),

  create: (data: { email: string; name: string; password: string; role?: string; brandIds?: string[] }) =>
    apiClient.post<unknown>('/api/v1/users', data),

  update: (id: string, data: Partial<{ name: string; role: string; status: string; avatar: string; brandIds: string[] }>) =>
    apiClient.patch<unknown>(`/api/v1/users/${id}`, data),

  delete: (id: string) =>
    apiClient.delete<{ deleted: boolean }>(`/api/v1/users/${id}`),
};

// Reports endpoints
export const reportsApi = {
  getAll: (params?: { page?: number; limit?: number; type?: string; isShared?: boolean }) =>
    apiClient.get<unknown[]>('/api/v1/reports', params),

  getById: (id: string) =>
    apiClient.get<unknown>(`/api/v1/reports/${id}`),

  create: (data: { name: string; description?: string; type: string; config: unknown; schedule?: string }) =>
    apiClient.post<unknown>('/api/v1/reports', data),

  update: (id: string, data: Partial<{ name: string; description: string; config: unknown; schedule: string; isShared: boolean }>) =>
    apiClient.patch<unknown>(`/api/v1/reports/${id}`, data),

  delete: (id: string) =>
    apiClient.delete<{ deleted: boolean }>(`/api/v1/reports/${id}`),

  execute: (id: string, params?: { format?: string }) =>
    apiClient.post<unknown>(`/api/v1/reports/${id}/execute`, params),

  getBudgetSummary: (params?: { seasonId?: string; brandId?: string; status?: string }) =>
    apiClient.get<unknown>('/api/v1/reports/budget-summary', params),

  getOtbAnalysis: (params?: { seasonId?: string; brandId?: string }) =>
    apiClient.get<unknown>('/api/v1/reports/otb-analysis', params),

  getSkuPerformance: (params?: { seasonId?: string; brandId?: string; categoryId?: string }) =>
    apiClient.get<unknown>('/api/v1/reports/sku-performance', params),
};

// Notifications endpoints
export const notificationsApi = {
  getAll: (params?: { page?: number; limit?: number; isRead?: boolean; type?: string }) =>
    apiClient.get<unknown[]>('/api/v1/notifications', params),

  getUnreadCount: () =>
    apiClient.get<{ count: number }>('/api/v1/notifications/unread-count'),

  markAsRead: (id: string) =>
    apiClient.patch<unknown>(`/api/v1/notifications/${id}/read`),

  markAllAsRead: () =>
    apiClient.post<unknown>('/api/v1/notifications/mark-all-read'),

  delete: (id: string) =>
    apiClient.delete<unknown>(`/api/v1/notifications/${id}`),

  getRealtime: (params?: { page?: number; limit?: number; isRead?: boolean }) =>
    apiClient.get<unknown[]>('/api/v1/notifications/realtime', params),

  markRealtimeAsRead: (id: string) =>
    apiClient.patch<unknown>(`/api/v1/notifications/realtime/${id}/read`),
};

// AI endpoints
export const aiApi = {
  // Conversations
  getConversations: () =>
    apiClient.get<unknown[]>('/api/v1/ai/conversations'),

  getConversation: (id: string) =>
    apiClient.get<unknown>(`/api/v1/ai/conversations/${id}`),

  createConversation: (title?: string) =>
    apiClient.post<unknown>('/api/v1/ai/conversations', { title }),

  addMessage: (conversationId: string, role: 'USER' | 'ASSISTANT', content: string) =>
    apiClient.post<unknown>(`/api/v1/ai/conversations/${conversationId}/messages`, { role, content }),

  deleteConversation: (id: string) =>
    apiClient.delete<unknown>(`/api/v1/ai/conversations/${id}`),

  // Suggestions
  getSuggestions: (params?: { type?: string; status?: string; seasonId?: string; brandId?: string; page?: number; limit?: number }) =>
    apiClient.get<unknown[]>('/api/v1/ai/suggestions', params),

  updateSuggestionStatus: (id: string, status: string, reviewNotes?: string) =>
    apiClient.patch<unknown>(`/api/v1/ai/suggestions/${id}/status`, { status, reviewNotes }),

  // Generated Plans
  getGeneratedPlans: (params?: { type?: string; status?: string; page?: number; limit?: number }) =>
    apiClient.get<unknown[]>('/api/v1/ai/generated-plans', params),

  // Predictive Alerts
  getPredictiveAlerts: (params?: { type?: string; severity?: string; status?: string; page?: number; limit?: number }) =>
    apiClient.get<unknown[]>('/api/v1/ai/predictive-alerts', params),

  acknowledgePredictiveAlert: (id: string) =>
    apiClient.patch<unknown>(`/api/v1/ai/predictive-alerts/${id}/acknowledge`),

  // Dashboard
  getDashboard: () =>
    apiClient.get<unknown>('/api/v1/ai/dashboard'),
};

// Workflows & Approvals endpoints
export const workflowsApi = {
  getApprovals: (params?: { type?: string; status?: string; page?: number; limit?: number }) =>
    apiClient.get<unknown>('/api/v1/approvals', params),

  getMyPendingApprovals: () =>
    apiClient.get<unknown[]>('/api/v1/approvals/mine'),

  getWorkflow: (id: string) =>
    apiClient.get<unknown>(`/api/v1/workflows/${id}`),

  approveWorkflow: (id: string, comment?: string) =>
    apiClient.post<unknown>(`/api/v1/workflows/${id}/approve`, { comment }),

  rejectWorkflow: (id: string, comment: string) =>
    apiClient.post<unknown>(`/api/v1/workflows/${id}/reject`, { comment }),
};

// Analytics & KPI endpoints
export const analyticsApi = {
  // KPI
  getKPIDashboard: (params?: { seasonId?: string; brandId?: string }) =>
    apiClient.get<unknown>('/api/v1/kpi', params),

  getKPIAlerts: (params?: { isAcknowledged?: boolean; severity?: string; limit?: number }) =>
    apiClient.get<unknown[]>('/api/v1/kpi/alerts', params),

  acknowledgeKPIAlert: (id: string) =>
    apiClient.post<unknown>(`/api/v1/kpi/alerts/${id}/acknowledge`),

  // Forecasts
  getForecasts: (params?: { seasonId?: string; brandId?: string; forecastType?: string }) =>
    apiClient.get<unknown[]>('/api/v1/forecast', params),

  generateForecast: (data: { forecastType: string; seasonId: string; brandId?: string; categoryId?: string }) =>
    apiClient.post<unknown>('/api/v1/forecast/analyze', data),

  // Scenarios
  getScenarios: (params?: { seasonId?: string; status?: string }) =>
    apiClient.get<unknown[]>('/api/v1/simulator', params),

  createScenario: (data: { name: string; description?: string; baseSeasonId: string; parameters: unknown }) =>
    apiClient.post<unknown>('/api/v1/simulator', data),

  // Insights
  getInsights: (params?: { type?: string; status?: string; limit?: number }) =>
    apiClient.get<unknown[]>('/api/v1/insights', params),

  // Executive Summary
  getExecutiveSummary: (params?: { seasonId?: string }) =>
    apiClient.get<unknown>('/api/v1/analytics/executive-summary', params),

  // Stock Optimization
  getStockOptimization: (params?: { seasonId?: string; brandId?: string }) =>
    apiClient.get<unknown>('/api/v1/analytics/stock-optimization', params),

  // Risk Assessment
  getRiskAssessment: (params?: { seasonId?: string }) =>
    apiClient.get<unknown>('/api/v1/analytics/risk-assessment', params),
};

// Integrations endpoints
export const integrationsApi = {
  // API Keys
  getApiKeys: () =>
    apiClient.get<unknown[]>('/api/v1/api-keys'),

  createApiKey: (data: { name: string; scopes: string[]; rateLimit?: number; expiresAt?: Date }) =>
    apiClient.post<unknown>('/api/v1/api-keys', data),

  deleteApiKey: (id: string) =>
    apiClient.delete<{ deleted: boolean }>(`/api/v1/api-keys/${id}`),

  toggleApiKey: (id: string, isEnabled: boolean) =>
    apiClient.patch<unknown>(`/api/v1/api-keys/${id}/toggle`, { isEnabled }),

  // Webhooks
  getWebhooks: () =>
    apiClient.get<unknown[]>('/api/v1/webhooks'),

  createWebhook: (data: { name: string; url: string; events: string[]; headers?: Record<string, string> }) =>
    apiClient.post<unknown>('/api/v1/webhooks', data),

  updateWebhook: (id: string, data: { name?: string; url?: string; events?: string[]; isEnabled?: boolean }) =>
    apiClient.patch<unknown>(`/api/v1/webhooks/${id}`, data),

  deleteWebhook: (id: string) =>
    apiClient.delete<{ deleted: boolean }>(`/api/v1/webhooks/${id}`),

  testWebhook: (id: string) =>
    apiClient.post<unknown>(`/api/v1/webhooks/${id}/test`),

  // ERP Connections
  getERPConnections: () =>
    apiClient.get<unknown[]>('/api/v1/integrations/erp'),

  getERPConnection: (id: string) =>
    apiClient.get<unknown>(`/api/v1/integrations/erp/${id}`),

  createERPConnection: (data: { name: string; type: string; host: string; port?: number; database?: string; username?: string; password?: string; apiKey?: string }) =>
    apiClient.post<unknown>('/api/v1/integrations/erp', data),

  updateERPConnection: (id: string, data: unknown) =>
    apiClient.patch<unknown>(`/api/v1/integrations/erp/${id}`, data),

  deleteERPConnection: (id: string) =>
    apiClient.delete<{ deleted: boolean }>(`/api/v1/integrations/erp/${id}`),

  getERPMappings: (connectionId: string) =>
    apiClient.get<unknown[]>(`/api/v1/integrations/erp/${connectionId}/mappings`),

  saveERPMappings: (connectionId: string, mappings: unknown[]) =>
    apiClient.post<unknown>(`/api/v1/integrations/erp/${connectionId}/mappings`, { mappings }),

  syncERP: (connectionId: string, entityType: string) =>
    apiClient.post<unknown>(`/api/v1/integrations/erp/${connectionId}/sync`, { entityType }),

  // S3/File Storage
  getPresignedUrl: (data: { filename: string; contentType: string; category: string }) =>
    apiClient.post<unknown>('/api/v1/integrations/s3/presign', data),

  getFiles: (params?: { category?: string; entityType?: string; entityId?: string }) =>
    apiClient.get<unknown[]>('/api/v1/integrations/s3/files', params),

  registerFile: (data: { filename: string; originalName: string; mimeType: string; size: number; key: string; bucket: string; category: string; entityType?: string; entityId?: string }) =>
    apiClient.post<unknown>('/api/v1/integrations/s3/files', data),
};

// Size Profiles endpoints
export const sizeProfilesApi = {
  // Size Definitions
  getDefinitions: (params?: { sizeType?: string; isActive?: boolean }) =>
    apiClient.get<unknown[]>('/api/v1/size-profiles/definitions', params),

  getDefinition: (id: string) =>
    apiClient.get<unknown>(`/api/v1/size-profiles/definitions/${id}`),

  createDefinition: (data: { name: string; code: string; sizeType: string; sortOrder?: number; isActive?: boolean }) =>
    apiClient.post<unknown>('/api/v1/size-profiles/definitions', data),

  updateDefinition: (id: string, data: { name?: string; code?: string; sizeType?: string; sortOrder?: number; isActive?: boolean }) =>
    apiClient.put<unknown>(`/api/v1/size-profiles/definitions/${id}`, data),

  deleteDefinition: (id: string) =>
    apiClient.delete<{ deleted: boolean }>(`/api/v1/size-profiles/definitions/${id}`),

  // Size Profiles
  getAll: (params?: { categoryId?: string; seasonId?: string; locationId?: string; brandId?: string; profileType?: string; isActive?: boolean; page?: number; limit?: number }) =>
    apiClient.get<unknown[]>('/api/v1/size-profiles', params),

  getById: (id: string) =>
    apiClient.get<unknown>(`/api/v1/size-profiles/${id}`),

  create: (data: { name: string; profileType: string; categoryId?: string; seasonId?: string; locationId?: string; brandId?: string; sizeDistribution: { sizeId: string; percentage: number }[]; notes?: string }) =>
    apiClient.post<unknown>('/api/v1/size-profiles', data),

  update: (id: string, data: { name?: string; profileType?: string; sizeDistribution?: { sizeId: string; percentage: number }[]; isActive?: boolean; notes?: string }) =>
    apiClient.put<unknown>(`/api/v1/size-profiles/${id}`, data),

  delete: (id: string) =>
    apiClient.delete<{ deleted: boolean }>(`/api/v1/size-profiles/${id}`),

  // Size Breakdown
  getBreakdown: (categoryId: string, params?: { seasonId?: string; locationId?: string }) =>
    apiClient.get<unknown>(`/api/v1/size-profiles/breakdown/${categoryId}`, params),

  // Optimization
  optimize: (data: { categoryId: string; seasonId?: string; locationId?: string; historicalProfileId?: string; trendProfileId?: string; historicalWeight?: number; trendWeight?: number }) =>
    apiClient.post<unknown>('/api/v1/size-profiles/optimize', data),

  // Comparison
  compare: (profileIds: string[]) =>
    apiClient.post<unknown>('/api/v1/size-profiles/compare', { profileIds }),
};

// KPI endpoints (Fashion-specific)
export const kpiApi = {
  getBenchmarks: () =>
    apiClient.get<unknown>('/api/v1/kpi/benchmarks'),

  getDashboard: (params?: { divisionId?: string; seasonId?: string; year?: number }) =>
    apiClient.get<unknown>('/api/v1/kpi/dashboard', params),

  getBrandKPIs: (brandId: string, params?: { seasonId?: string }) =>
    apiClient.get<unknown>(`/api/v1/kpi/brand/${brandId}`, params),

  getCategoryKPIs: (categoryId: string, params?: { brandId?: string; seasonId?: string }) =>
    apiClient.get<unknown>(`/api/v1/kpi/category/${categoryId}`, params),

  getKPITrend: (brandId: string, kpiName: string, params?: { weeks?: number; seasonId?: string }) =>
    apiClient.get<unknown>(`/api/v1/kpi/trend/${brandId}/${kpiName}`, params),

  calculateGMROI: (grossMargin: number, averageInventoryCost: number) =>
    apiClient.get<unknown>('/api/v1/kpi/calculate/gmroi', { grossMargin, averageInventoryCost }),

  calculateSellThrough: (unitsSold: number, unitsAvailable: number) =>
    apiClient.get<unknown>('/api/v1/kpi/calculate/sell-through', { unitsSold, unitsAvailable }),

  calculateWeeksOfCover: (currentStock: number, avgWeeklySales: number) =>
    apiClient.get<unknown>('/api/v1/kpi/calculate/woc', { currentStock, avgWeeklySales }),

  calculateGrossMargin: (revenue: number, cogs: number) =>
    apiClient.get<unknown>('/api/v1/kpi/calculate/gross-margin', { revenue, cogs }),

  calculatePlanAccuracy: (actual: number, plan: number) =>
    apiClient.get<unknown>('/api/v1/kpi/calculate/plan-accuracy', { actual, plan }),
};

// Power BI endpoints
export const powerbiApi = {
  getConfig: () =>
    apiClient.get<unknown>('/api/v1/powerbi/config'),

  getReports: (params?: { type?: string; isActive?: boolean }) =>
    apiClient.get<unknown[]>('/api/v1/powerbi/reports', params),

  getReport: (id: string) =>
    apiClient.get<unknown>(`/api/v1/powerbi/reports/${id}`),

  createReport: (data: { name: string; type: string; powerbiReportId: string; powerbiGroupId?: string; description?: string; thumbnail?: string; defaultFilters?: Record<string, unknown>; isActive?: boolean }) =>
    apiClient.post<unknown>('/api/v1/powerbi/reports', data),

  updateReport: (id: string, data: { name?: string; type?: string; powerbiReportId?: string; powerbiGroupId?: string; description?: string; thumbnail?: string; defaultFilters?: Record<string, unknown>; isActive?: boolean }) =>
    apiClient.put<unknown>(`/api/v1/powerbi/reports/${id}`, data),

  deleteReport: (id: string) =>
    apiClient.delete<{ deleted: boolean }>(`/api/v1/powerbi/reports/${id}`),

  generateEmbedToken: (data: { reportId: string; groupId?: string; datasetId?: string; roles?: string[]; filter?: Record<string, unknown> }) =>
    apiClient.post<{ token: string; expiration: string; embedUrl: string; reportId: string }>('/api/v1/powerbi/embed-token', data),

  listWorkspaceReports: (groupId?: string) =>
    apiClient.get<unknown[]>('/api/v1/powerbi/workspace/reports', { groupId }),

  refreshDataset: (datasetId: string, groupId?: string) =>
    apiClient.post<unknown>(`/api/v1/powerbi/datasets/${datasetId}/refresh`, { groupId }),
};

// SKU Analysis endpoints
export const skuAnalysisApi = {
  getBestPerformers: (params?: { brandId?: string; categoryId?: string; seasonId?: string; metric?: string; limit?: number; periodDays?: number }) =>
    apiClient.get<unknown[]>('/api/v1/sku-analysis/best-performers', params),

  getWorstPerformers: (params?: { brandId?: string; categoryId?: string; seasonId?: string; metric?: string; limit?: number; periodDays?: number }) =>
    apiClient.get<unknown[]>('/api/v1/sku-analysis/worst-performers', params),

  getRisingStars: (params?: { brandId?: string; categoryId?: string; seasonId?: string; limit?: number; periodDays?: number }) =>
    apiClient.get<unknown[]>('/api/v1/sku-analysis/rising-stars', params),

  getDeclining: (params?: { brandId?: string; categoryId?: string; seasonId?: string; limit?: number; periodDays?: number }) =>
    apiClient.get<unknown[]>('/api/v1/sku-analysis/declining', params),

  getSummary: (params?: { brandId?: string; categoryId?: string; seasonId?: string; periodDays?: number }) =>
    apiClient.get<unknown>('/api/v1/sku-analysis/summary', params),

  getRecommendations: (params?: { brandId?: string; categoryId?: string; seasonId?: string; limit?: number; periodDays?: number }) =>
    apiClient.get<unknown[]>('/api/v1/sku-analysis/recommendations', params),

  getMetrics: () =>
    apiClient.get<{ metrics: { code: string; name: string; description: string }[] }>('/api/v1/sku-analysis/metrics'),
};

// ============================================
// PHASE 3: Advanced Features
// ============================================

// Clearance Optimization Engine (COE) endpoints
export const clearanceApi = {
  // Plans
  createPlan: (data: { name: string; description?: string; seasonId: string; brandId?: string; startDate: string; endDate: string; targetRecoveryValue: number; targetSellThroughPct: number; maxMarkdownPct?: number; phases?: unknown[] }) =>
    apiClient.post<unknown>('/api/v1/clearance/plans', data),

  getPlans: (params?: { seasonId?: string; brandId?: string; status?: string }) =>
    apiClient.get<unknown[]>('/api/v1/clearance/plans', params),

  getPlan: (id: string) =>
    apiClient.get<unknown>(`/api/v1/clearance/plans/${id}`),

  deletePlan: (id: string) =>
    apiClient.delete<{ deleted: boolean }>(`/api/v1/clearance/plans/${id}`),

  // Optimization
  optimizePlan: (data: { planId: string; strategy?: 'MAXIMIZE_RECOVERY' | 'MAXIMIZE_SELL_THROUGH' | 'BALANCED'; analyzeElasticity?: boolean; minMarginPct?: number; skuIds?: string[] }) =>
    apiClient.post<unknown>('/api/v1/clearance/optimize', data),

  getEligibleSKUs: (params: { seasonId: string; brandId?: string; minWeeksOnHand?: number; maxSellThrough?: number }) =>
    apiClient.get<unknown[]>('/api/v1/clearance/eligible-skus', params),

  // Simulation
  simulateScenario: (data: { planId: string; scenarioName?: string; globalMarkdownPct?: number; skuOverrides?: { skuId: string; markdownPct: number }[]; elasticityFactor?: number; weeksToSimulate?: number }) =>
    apiClient.post<unknown>('/api/v1/clearance/simulate', data),

  // Lifecycle
  approvePlan: (id: string) =>
    apiClient.put<unknown>(`/api/v1/clearance/plans/${id}/approve`),

  activatePlan: (id: string) =>
    apiClient.put<unknown>(`/api/v1/clearance/plans/${id}/activate`),

  // Results
  getPlanResults: (id: string) =>
    apiClient.get<unknown>(`/api/v1/clearance/plans/${id}/results`),
};

// Replenishment (MOC/MOQ) endpoints
export const replenishmentApi = {
  // MOC Targets
  createMOCTarget: (data: { brandId?: string; categoryId?: string; seasonId?: string; locationId?: string; minMOC: number; targetMOC: number; maxMOC: number; leadTimeDays?: number; safetyStockDays?: number }) =>
    apiClient.post<unknown>('/api/v1/replenishment/moc-targets', data),

  getMOCTargets: (params?: { brandId?: string; categoryId?: string; seasonId?: string; isActive?: boolean }) =>
    apiClient.get<unknown[]>('/api/v1/replenishment/moc-targets', params),

  updateMOCTarget: (id: string, data: unknown) =>
    apiClient.put<unknown>(`/api/v1/replenishment/moc-targets/${id}`, data),

  deleteMOCTarget: (id: string) =>
    apiClient.delete<{ deleted: boolean }>(`/api/v1/replenishment/moc-targets/${id}`),

  // MOQ Rules
  createMOQRule: (data: { supplierId?: string; supplierName?: string; brandId?: string; categoryId?: string; moqUnits: number; moqValue: number; packSize?: number; cartonSize?: number; leadTimeDays?: number }) =>
    apiClient.post<unknown>('/api/v1/replenishment/moq-rules', data),

  getMOQRules: (params?: { supplierId?: string; brandId?: string; categoryId?: string }) =>
    apiClient.get<unknown[]>('/api/v1/replenishment/moq-rules', params),

  updateMOQRule: (id: string, data: unknown) =>
    apiClient.put<unknown>(`/api/v1/replenishment/moq-rules/${id}`, data),

  deleteMOQRule: (id: string) =>
    apiClient.delete<{ deleted: boolean }>(`/api/v1/replenishment/moq-rules/${id}`),

  // Inventory Status
  getInventoryStatus: (params?: { brandId?: string; categoryId?: string; locationId?: string; statusFilter?: 'ALL' | 'LOW' | 'CRITICAL' | 'STOCKOUT' | 'OVERSTOCK' }) =>
    apiClient.get<unknown[]>('/api/v1/replenishment/inventory-status', params),

  generateAlerts: (params?: { brandId?: string; locationId?: string }) =>
    apiClient.post<{ alertsCreated: number }>('/api/v1/replenishment/generate-alerts', undefined),

  // Alerts
  getAlerts: (params?: { status?: string; alertType?: string; brandId?: string; limit?: number }) =>
    apiClient.get<unknown[]>('/api/v1/replenishment/alerts', params),

  acknowledgeAlert: (id: string) =>
    apiClient.put<unknown>(`/api/v1/replenishment/alerts/${id}/acknowledge`),

  resolveAlert: (id: string, notes: string) =>
    apiClient.put<unknown>(`/api/v1/replenishment/alerts/${id}/resolve`, { notes }),

  // Orders
  createOrder: (data: { supplierId?: string; supplierName?: string; expectedDelivery: string; items: { skuId: string; skuCode: string; skuName: string; orderedQty: number; unitCost: number; discountPct?: number }[]; alertIds?: string[] }) =>
    apiClient.post<unknown>('/api/v1/replenishment/orders', data),

  getOrders: (params?: { status?: string; supplierId?: string; limit?: number }) =>
    apiClient.get<unknown[]>('/api/v1/replenishment/orders', params),

  getOrder: (id: string) =>
    apiClient.get<unknown>(`/api/v1/replenishment/orders/${id}`),

  submitOrder: (id: string) =>
    apiClient.put<unknown>(`/api/v1/replenishment/orders/${id}/submit`),

  confirmOrder: (id: string) =>
    apiClient.put<unknown>(`/api/v1/replenishment/orders/${id}/confirm`),

  receiveOrder: (id: string, items: { skuId: string; receivedQty: number }[]) =>
    apiClient.put<unknown>(`/api/v1/replenishment/orders/${id}/receive`, items),

  // Dashboard
  getDashboard: (params?: { brandId?: string; locationId?: string }) =>
    apiClient.get<unknown>('/api/v1/replenishment/dashboard', params),
};

// AI Forecasting endpoints
export const forecastingApi = {
  // Configs
  createConfig: (data: { brandId?: string; categoryId?: string; seasonId?: string; primaryMethod: string; lookbackWeeks?: number; forecastWeeks?: number; movingAvgWeight?: number; expSmoothWeight?: number; trendWeight?: number }) =>
    apiClient.post<unknown>('/api/v1/forecasting/configs', data),

  getConfigs: (params?: { brandId?: string; categoryId?: string; isActive?: boolean }) =>
    apiClient.get<unknown[]>('/api/v1/forecasting/configs', params),

  updateConfig: (id: string, data: unknown) =>
    apiClient.put<unknown>(`/api/v1/forecasting/configs/${id}`, data),

  // Forecast Runs
  runForecast: (data: { seasonId?: string; brandId?: string; categoryId?: string; method: 'MOVING_AVERAGE' | 'EXPONENTIAL_SMOOTHING' | 'TREND_ADJUSTED' | 'ENSEMBLE'; lookbackWeeks?: number; forecastWeeks?: number }) =>
    apiClient.post<unknown>('/api/v1/forecasting/run', data),

  getForecastRuns: (params?: { seasonId?: string; brandId?: string; categoryId?: string; limit?: number }) =>
    apiClient.get<unknown[]>('/api/v1/forecasting/runs', params),

  getForecastRun: (id: string) =>
    apiClient.get<unknown>(`/api/v1/forecasting/runs/${id}`),

  // Method Comparison
  compareMethods: (data: { seasonId?: string; brandId?: string; categoryId?: string; lookbackWeeks?: number; forecastWeeks?: number }) =>
    apiClient.post<unknown>('/api/v1/forecasting/compare-methods', data),
};
