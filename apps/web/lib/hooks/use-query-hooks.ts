// lib/hooks/use-query-hooks.ts
// Optimized data fetching hooks with React Query

/* eslint-disable @typescript-eslint/no-explicit-any */

import { 
  useQuery, 
  useMutation, 
  useQueryClient,
  UseQueryOptions,
} from '@tanstack/react-query';

// =====================================================
// QUERY KEYS
// =====================================================

export const queryKeys = {
  // Brands
  brands: ['brands'] as const,
  brand: (id: string) => ['brands', id] as const,
  
  // Categories
  categories: ['categories'] as const,
  category: (id: string) => ['categories', id] as const,
  
  // Seasons
  seasons: ['seasons'] as const,
  season: (id: string) => ['seasons', id] as const,
  
  // Budgets
  budgets: (filters?: BudgetFilters) => ['budgets', filters] as const,
  budget: (id: string) => ['budgets', 'detail', id] as const,
  
  // OTB Plans
  otbPlans: (filters?: OTBFilters) => ['otb-plans', filters] as const,
  otbPlan: (id: string) => ['otb-plans', 'detail', id] as const,
  
  // SKU Proposals
  skuProposals: (otbPlanId: string) => ['sku-proposals', otbPlanId] as const,
  skuProposal: (id: string) => ['sku-proposals', 'detail', id] as const,
  
  // AI Insights
  insights: ['ai-insights'] as const,
};

// =====================================================
// TYPES
// =====================================================

interface BudgetFilters {
  brandId?: string;
  seasonId?: string;
  status?: string;
}

interface OTBFilters {
  brandId?: string;
  seasonId?: string;
  status?: string;
}

interface Brand {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
}

interface Budget {
  id: string;
  totalBudget: number;
  allocatedBudget: number;
  brand: Brand;
  season: { id: string; name: string };
}

// =====================================================
// FETCH FUNCTIONS
// =====================================================

async function fetchAPI<T>(url: string): Promise<T> {
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }
  
  return response.json();
}

async function mutateAPI<T>(
  url: string, 
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  data?: any
): Promise<T> {
  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: data ? JSON.stringify(data) : undefined,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `API Error: ${response.status}`);
  }
  
  return response.json();
}

// =====================================================
// BRANDS HOOKS
// =====================================================

export function useBrands(options?: Partial<UseQueryOptions<Brand[]>>) {
  return useQuery({
    queryKey: queryKeys.brands,
    queryFn: () => fetchAPI<Brand[]>('/api/v1/brands'),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
    ...options,
  });
}

export function useBrand(id: string) {
  return useQuery({
    queryKey: queryKeys.brand(id),
    queryFn: () => fetchAPI<Brand>(`/api/v1/brands/${id}`),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateBrand() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<Brand>) => 
      mutateAPI<Brand>('/api/v1/brands', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.brands });
    },
  });
}

export function useUpdateBrand() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Brand> }) =>
      mutateAPI<Brand>(`/api/v1/brands/${id}`, 'PATCH', data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.brands });
      queryClient.invalidateQueries({ queryKey: queryKeys.brand(id) });
    },
  });
}

// =====================================================
// BUDGETS HOOKS
// =====================================================

export function useBudgets(filters?: BudgetFilters) {
  const params = new URLSearchParams();
  if (filters?.brandId) params.set('brandId', filters.brandId);
  if (filters?.seasonId) params.set('seasonId', filters.seasonId);
  if (filters?.status) params.set('status', filters.status);
  
  const queryString = params.toString();
  const url = `/api/v1/budgets${queryString ? `?${queryString}` : ''}`;
  
  return useQuery({
    queryKey: queryKeys.budgets(filters),
    queryFn: () => fetchAPI<Budget[]>(url),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000,
  });
}

export function useBudget(id: string) {
  return useQuery({
    queryKey: queryKeys.budget(id),
    queryFn: () => fetchAPI<Budget>(`/api/v1/budgets/${id}`),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateBudget() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) =>
      mutateAPI<Budget>('/api/v1/budgets', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
  });
}

export function useUpdateBudget() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      mutateAPI<Budget>(`/api/v1/budgets/${id}`, 'PATCH', data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.budget(id) });
    },
  });
}

// =====================================================
// OTB PLANS HOOKS
// =====================================================

export function useOTBPlans(filters?: OTBFilters) {
  const params = new URLSearchParams();
  if (filters?.brandId) params.set('brandId', filters.brandId);
  if (filters?.seasonId) params.set('seasonId', filters.seasonId);
  if (filters?.status) params.set('status', filters.status);
  
  const queryString = params.toString();
  const url = `/api/v1/otb-plans${queryString ? `?${queryString}` : ''}`;
  
  return useQuery({
    queryKey: queryKeys.otbPlans(filters),
    queryFn: () => fetchAPI(url),
    staleTime: 2 * 60 * 1000,
  });
}

export function useOTBPlan(id: string) {
  return useQuery({
    queryKey: queryKeys.otbPlan(id),
    queryFn: () => fetchAPI(`/api/v1/otb-plans/${id}`),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
}

// =====================================================
// SKU PROPOSALS HOOKS
// =====================================================

export function useSKUProposals(otbPlanId: string) {
  return useQuery({
    queryKey: queryKeys.skuProposals(otbPlanId),
    queryFn: () => fetchAPI(`/api/v1/sku-proposals?otbPlanId=${otbPlanId}`),
    enabled: !!otbPlanId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

export function useSKUProposal(id: string) {
  return useQuery({
    queryKey: queryKeys.skuProposal(id),
    queryFn: () => fetchAPI(`/api/v1/sku-proposals/${id}`),
    enabled: !!id,
    staleTime: 1 * 60 * 1000,
  });
}

// =====================================================
// AI INSIGHTS HOOKS
// =====================================================

export function useAIInsights() {
  return useQuery({
    queryKey: queryKeys.insights,
    queryFn: () => fetchAPI('/api/ai/insights'),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
  });
}

// =====================================================
// PREFETCH UTILITIES
// =====================================================

export function usePrefetchBrand(queryClient: ReturnType<typeof useQueryClient>) {
  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.brand(id),
      queryFn: () => fetchAPI(`/api/v1/brands/${id}`),
      staleTime: 5 * 60 * 1000,
    });
  };
}

export function usePrefetchBudget(queryClient: ReturnType<typeof useQueryClient>) {
  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.budget(id),
      queryFn: () => fetchAPI(`/api/v1/budgets/${id}`),
      staleTime: 2 * 60 * 1000,
    });
  };
}
