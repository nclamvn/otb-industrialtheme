// ═══════════════════════════════════════════════════════════════════════════
// Order & Receipt Service - Confirmation + Discrepancy API
// ═══════════════════════════════════════════════════════════════════════════
import api from './api';

const extract = (response) => response.data?.data ?? response.data;

export const orderService = {
  // Confirm an order
  async confirmOrder(orderId) {
    try {
      const response = await api.patch(`/orders/${orderId}/confirm`);
      return extract(response);
    } catch (err) {
      console.error('[orderService.confirmOrder]', orderId, err?.response?.status, err?.message);
      throw err;
    }
  },

  // Cancel an order
  async cancelOrder(orderId) {
    try {
      const response = await api.patch(`/orders/${orderId}/cancel`);
      return extract(response);
    } catch (err) {
      console.error('[orderService.cancelOrder]', orderId, err?.response?.status, err?.message);
      throw err;
    }
  },

  // Confirm a receipt (all items received)
  async confirmReceipt(receiptId, data) {
    try {
      const response = await api.patch(`/receipts/${receiptId}/confirm`, data);
      return extract(response);
    } catch (err) {
      console.error('[orderService.confirmReceipt]', receiptId, err?.response?.status, err?.message);
      throw err;
    }
  },

  // Flag a receipt discrepancy
  async flagDiscrepancy(receiptId, note) {
    try {
      const response = await api.patch(`/receipts/${receiptId}/discrepancy`, { note });
      return extract(response);
    } catch (err) {
      console.error('[orderService.flagDiscrepancy]', receiptId, err?.response?.status, err?.message);
      throw err;
    }
  },
};

export default orderService;
