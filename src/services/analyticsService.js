import api from './api';

const extract = (res) => res.data?.data ?? res.data;

/** Wrap an API call so 404s (endpoint not implemented yet) return a silent fallback */
const safe = (call, fallback = []) => call.then(extract).catch((err) => {
  if (err.response?.status === 404) return fallback;
  throw err;
});

export const analyticsService = {
  // Sales Performance
  getTopSkus: (params) => safe(api.get('/analytics/sales/top-skus', { params })),
  getBottomSkus: (params) => safe(api.get('/analytics/sales/bottom-skus', { params })),
  getSalesByDimension: (params) => safe(api.get('/analytics/sales/by-dimension', { params })),
  getSellThroughSummary: (params) => safe(api.get('/analytics/sales/sell-through-summary', { params })),

  // Budget Analytics
  getUtilizationTrend: (params) => safe(api.get('/analytics/budget/utilization-trend', { params })),
  getBudgetAlerts: (params) => safe(api.get('/analytics/budget/alerts', { params })),
  getAllocationEfficiency: (params) => safe(api.get('/analytics/budget/allocation-efficiency', { params })),
  getBudgetSummary: (params) => safe(api.get('/analytics/budget/summary', { params }), {}),

  // Category Trends
  getTrendAttributes: (params) => safe(api.get('/analytics/trends/attributes', { params })),
  getYoyComparison: (params) => safe(api.get('/analytics/trends/yoy-comparison', { params })),
  getGenderBreakdown: (params) => safe(api.get('/analytics/trends/gender-breakdown', { params })),
};
