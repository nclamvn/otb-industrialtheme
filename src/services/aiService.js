// ═══════════════════════════════════════════════════════════════════════════
// AI Service - Size Curve Optimizer + Budget Variance Alerts
// Gracefully returns empty/default data when AI endpoints are unavailable
// ═══════════════════════════════════════════════════════════════════════════
import api from './api';

const safeGet = async (url, config) => {
  try {
    const response = await api.get(url, config);
    return response.data.data || response.data;
  } catch {
    return null;
  }
};

const safePost = async (url, data) => {
  try {
    const response = await api.post(url, data);
    return response.data.data || response.data;
  } catch {
    return null;
  }
};

const safePatch = async (url, data) => {
  try {
    const response = await api.patch(url, data);
    return response.data.data || response.data;
  } catch {
    return null;
  }
};

// AI alerts endpoint is optional — disabled until backend is deployed.
// Set to true when /ai/alerts endpoint becomes available.
let _alertsAvailable = false;

export const aiService = {
  // ── Size Curve Optimizer ─────────────────────────────────────────────

  async getSizeCurve(category, storeId, totalOrderQty = 100) {
    return safeGet(`/ai/size-curve/${encodeURIComponent(category)}/${storeId}`, {
      params: { totalOrderQty },
    });
  },

  async compareSizeCurve(skuId, storeId, userSizing) {
    return safePost('/ai/size-curve/compare', { skuId, storeId, userSizing });
  },

  // ── Budget Variance Alerts ───────────────────────────────────────────

  async getBudgetAlerts(options = {}) {
    if (!_alertsAvailable) return [];
    const params = {};
    if (options.budgetId) params.budgetId = options.budgetId;
    if (options.unreadOnly) params.unreadOnly = 'true';
    const result = await safeGet('/ai/alerts', { params });
    if (result === null) { _alertsAvailable = false; return []; }
    return result || [];
  },

  async dismissAlert(alertId) {
    if (!_alertsAvailable) return null;
    return safePatch(`/ai/alerts/${alertId}/dismiss`);
  },

  // ── Risk Scoring ─────────────────────────────────────────────────────

  async assessRisk(entityType, entityId) {
    return safePost(`/ai/risk/assess/${entityType}/${entityId}`);
  },

  async getRiskAssessment(entityType, entityId) {
    return safeGet(`/ai/risk/${entityType}/${entityId}`);
  },

  async refreshRiskAssessment(entityType, entityId) {
    return safePost(`/ai/risk/${entityType}/${entityId}/refresh`);
  },

  // ── SKU Recommender ──────────────────────────────────────────────────

  async generateSkuRecommendations(input) {
    return safePost('/ai/sku-recommend/generate', input);
  },

  async updateSkuRecommendationStatus(recommendationId, status) {
    return safePatch(`/ai/sku-recommend/${recommendationId}/status`, { status });
  },

  async addSelectedSkusToProposal(budgetDetailId, proposalId) {
    return safePost(`/ai/sku-recommend/${budgetDetailId}/add-to-proposal/${proposalId}`);
  },
};
