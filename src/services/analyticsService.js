import api from './api';

const extract = (res) => res.data?.data ?? res.data;

export const analyticsService = {
  // Sales Performance
  getTopSkus: (params) => api.get('/analytics/sales/top-skus', { params }).then(extract),
  getBottomSkus: (params) => api.get('/analytics/sales/bottom-skus', { params }).then(extract),
  getSalesByDimension: (params) => api.get('/analytics/sales/by-dimension', { params }).then(extract),
  getSellThroughSummary: (params) => api.get('/analytics/sales/sell-through-summary', { params }).then(extract),

  // Budget Analytics
  getUtilizationTrend: (params) => api.get('/analytics/budget/utilization-trend', { params }).then(extract),
  getBudgetAlerts: (params) => api.get('/analytics/budget/alerts', { params }).then(extract),
  getAllocationEfficiency: (params) => api.get('/analytics/budget/allocation-efficiency', { params }).then(extract),
  getBudgetSummary: (params) => api.get('/analytics/budget/summary', { params }).then(extract),

  // Category Trends
  getTrendAttributes: (params) => api.get('/analytics/trends/attributes', { params }).then(extract),
  getYoyComparison: (params) => api.get('/analytics/trends/yoy-comparison', { params }).then(extract),
  getGenderBreakdown: (params) => api.get('/analytics/trends/gender-breakdown', { params }).then(extract),
};
