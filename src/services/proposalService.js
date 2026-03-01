// ═══════════════════════════════════════════════════════════════════════════
// Proposal Service - SKU Products + Store Allocation
// ═══════════════════════════════════════════════════════════════════════════
import api from './api';

export const proposalService = {
  // Get all proposals with filters
  async getAll(filters = {}) {
    const response = await api.get('/proposals', { params: filters });
    return response.data;
  },

  // Get single proposal by ID
  async getOne(id) {
    const response = await api.get(`/proposals/${id}`);
    return response.data.data || response.data;
  },

  // Get proposal statistics
  async getStatistics(budgetId = null) {
    const params = budgetId ? { budgetId } : {};
    const response = await api.get('/proposals/statistics', { params });
    return response.data.data || response.data;
  },

  // Create new proposal
  async create(data) {
    const response = await api.post('/proposals', data);
    return response.data.data || response.data;
  },

  // Update proposal
  async update(id, data) {
    const response = await api.put(`/proposals/${id}`, data);
    return response.data.data || response.data;
  },

  // Add product to proposal
  async addProduct(proposalId, productData) {
    const response = await api.post(`/proposals/${proposalId}/products`, productData);
    return response.data.data || response.data;
  },

  // Bulk add products
  async bulkAddProducts(proposalId, products) {
    const response = await api.post(`/proposals/${proposalId}/products/bulk`, { products });
    return response.data.data || response.data;
  },

  // Update product in proposal
  async updateProduct(proposalId, productId, data) {
    const response = await api.patch(`/proposals/${proposalId}/products/${productId}`, data);
    return response.data.data || response.data;
  },

  // Remove product from proposal
  async removeProduct(proposalId, productId) {
    const response = await api.delete(`/proposals/${proposalId}/products/${productId}`);
    return response.data;
  },

  // Submit for approval
  async submit(id) {
    const response = await api.post(`/proposals/${id}/submit`);
    return response.data.data || response.data;
  },

  // Approve Level 1
  async approveL1(id, comment = '') {
    const response = await api.post(`/proposals/${id}/approve/level1`, {
      action: 'APPROVED',
      comment
    });
    return response.data.data || response.data;
  },

  // Approve Level 2
  async approveL2(id, comment = '') {
    const response = await api.post(`/proposals/${id}/approve/level2`, {
      action: 'APPROVED',
      comment
    });
    return response.data.data || response.data;
  },

  // Reject Level 1
  async rejectL1(id, comment = '') {
    const response = await api.post(`/proposals/${id}/approve/level1`, {
      action: 'REJECTED',
      comment
    });
    return response.data.data || response.data;
  },

  // Reject Level 2
  async rejectL2(id, comment = '') {
    const response = await api.post(`/proposals/${id}/approve/level2`, {
      action: 'REJECTED',
      comment
    });
    return response.data.data || response.data;
  },

  // Delete proposal (DRAFT only)
  async delete(id) {
    const response = await api.delete(`/proposals/${id}`);
    return response.data;
  },

  // Atomic save: replace all products in proposal
  async saveFullProposal(id, data) {
    const response = await api.put(`/proposals/${id}/save-full`, data);
    return response.data?.data ?? response.data;
  },

  // Copy proposal to a new draft
  async copyProposal(id) {
    const response = await api.post(`/proposals/${id}/copy`);
    return response.data?.data ?? response.data;
  },

  // Get historical proposal for comparison/template
  async getHistorical({ fiscalYear, seasonGroupId, seasonType, brandId }) {
    const response = await api.get('/proposals/historical', {
      params: { fiscalYear, seasonGroupId, seasonType, brandId }
    });
    return response.data?.data ?? response.data;
  },

  // Get sizings by product
  async getSizingsByProduct(productId) {
    const response = await api.get(`/proposals/products/${productId}/sizings`);
    return response.data?.data ?? response.data;
  },

  // Save sizings for a product
  async saveSizings(productId, data) {
    const response = await api.put(`/proposals/products/${productId}/sizings`, data);
    return response.data?.data ?? response.data;
  }
};

export default proposalService;
