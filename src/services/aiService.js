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

export const aiService = {
  // ── Size Curve Optimizer ─────────────────────────────────────────────

  async getSizeCurve(category, storeId, totalOrderQty = 100) {
    return safeGet(`/ai/size-curve/${encodeURIComponent(category)}/${storeId}`, {
      params: { totalOrderQty },
    });
  },

  async calculateSizeCurve(data) {
    return safePost('/ai/size-curve/calculate', data);
  },

  async compareSizeCurve(skuId, storeId, userSizing) {
    return safePost('/ai/size-curve/compare', { skuId, storeId, userSizing });
  },

  // ── Budget Variance Alerts ───────────────────────────────────────────

  async getBudgetAlerts(options = {}) {
    const params = {};
    if (options.budgetId) params.budgetId = options.budgetId;
    if (options.unreadOnly) params.unreadOnly = 'true';
    return safeGet('/ai/alerts', { params }) || [];
  },

  async markAlertRead(alertId) {
    return safePatch(`/ai/alerts/${alertId}/read`);
  },

  async dismissAlert(alertId) {
    return safePatch(`/ai/alerts/${alertId}/dismiss`);
  },

  async triggerAlertCheck() {
    return safePost('/ai/alerts/check');
  },

  // ── OTB Auto-Allocation ────────────────────────────────────────────

  async generateAllocation(input) {
    return safePost('/ai/allocation/generate', input);
  },

  async getAllocationRecommendations(budgetDetailId) {
    return safeGet(`/ai/allocation/${budgetDetailId}`);
  },

  async applyAllocationRecommendations(budgetDetailId, dimensionType = null) {
    const url = dimensionType
      ? `/ai/allocation/${budgetDetailId}/apply?dimensionType=${dimensionType}`
      : `/ai/allocation/${budgetDetailId}/apply`;
    return safePost(url);
  },

  async compareAllocation(budgetDetailId, userAllocation) {
    return safePost('/ai/allocation/compare', { budgetDetailId, userAllocation });
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

  async getSkuRecommendations(budgetDetailId, category = null) {
    const url = category
      ? `/ai/sku-recommend/${budgetDetailId}?category=${encodeURIComponent(category)}`
      : `/ai/sku-recommend/${budgetDetailId}`;
    return safeGet(url);
  },

  async updateSkuRecommendationStatus(recommendationId, status) {
    return safePatch(`/ai/sku-recommend/${recommendationId}/status`, { status });
  },

  async addSelectedSkusToProposal(budgetDetailId, proposalId) {
    return safePost(`/ai/sku-recommend/${budgetDetailId}/add-to-proposal/${proposalId}`);
  },
};
