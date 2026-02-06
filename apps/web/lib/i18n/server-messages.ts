// Server-side i18n messages for API routes and backend services
import type { Locale } from './config';

// Error messages for API responses
export const errorMessages: Record<string, Record<Locale, string>> = {
  // Authentication errors
  UNAUTHORIZED: {
    en: 'Unauthorized',
    vi: 'Không được phép',
  },
  SESSION_EXPIRED: {
    en: 'Session expired',
    vi: 'Phiên đăng nhập đã hết hạn',
  },
  FORBIDDEN: {
    en: 'Access denied',
    vi: 'Truy cập bị từ chối',
  },

  // Validation errors
  MISSING_REQUIRED_FIELDS: {
    en: 'Missing required fields',
    vi: 'Thiếu các trường bắt buộc',
  },
  INVALID_INPUT: {
    en: 'Invalid input',
    vi: 'Dữ liệu không hợp lệ',
  },
  INVALID_ACTION: {
    en: 'Invalid action',
    vi: 'Hành động không hợp lệ',
  },
  VALIDATION_FAILED: {
    en: 'Validation failed',
    vi: 'Xác thực thất bại',
  },

  // Resource errors
  NOT_FOUND: {
    en: 'Resource not found',
    vi: 'Không tìm thấy tài nguyên',
  },
  ALREADY_EXISTS: {
    en: 'Resource already exists',
    vi: 'Tài nguyên đã tồn tại',
  },
  CONFLICT: {
    en: 'Resource conflict',
    vi: 'Xung đột tài nguyên',
  },

  // AI/Chat errors
  NO_MESSAGES: {
    en: 'No messages provided',
    vi: 'Chưa cung cấp tin nhắn',
  },
  INVALID_MESSAGE_FORMAT: {
    en: 'Last message must be from user',
    vi: 'Tin nhắn cuối phải từ người dùng',
  },
  CHAT_PROCESSING_FAILED: {
    en: 'Failed to process chat request',
    vi: 'Không thể xử lý yêu cầu chat',
  },
  AI_GENERATION_FAILED: {
    en: 'AI generation failed',
    vi: 'Tạo AI thất bại',
  },

  // CRUD errors
  CREATE_FAILED: {
    en: 'Failed to create resource',
    vi: 'Không thể tạo tài nguyên',
  },
  UPDATE_FAILED: {
    en: 'Failed to update resource',
    vi: 'Không thể cập nhật tài nguyên',
  },
  DELETE_FAILED: {
    en: 'Failed to delete resource',
    vi: 'Không thể xóa tài nguyên',
  },
  FETCH_FAILED: {
    en: 'Failed to fetch data',
    vi: 'Không thể tải dữ liệu',
  },

  // Business logic errors
  BUDGET_NOT_FOUND: {
    en: 'Budget not found',
    vi: 'Không tìm thấy ngân sách',
  },
  BRAND_NOT_FOUND: {
    en: 'Brand not found',
    vi: 'Không tìm thấy thương hiệu',
  },
  SEASON_NOT_FOUND: {
    en: 'Season not found',
    vi: 'Không tìm thấy mùa',
  },
  OTB_PLAN_NOT_FOUND: {
    en: 'OTB Plan not found',
    vi: 'Không tìm thấy kế hoạch OTB',
  },
  SKU_PROPOSAL_NOT_FOUND: {
    en: 'SKU Proposal not found',
    vi: 'Không tìm thấy đề xuất SKU',
  },

  // Generic errors
  INTERNAL_ERROR: {
    en: 'Internal server error',
    vi: 'Lỗi máy chủ nội bộ',
  },
  UNKNOWN_ERROR: {
    en: 'An unexpected error occurred',
    vi: 'Đã xảy ra lỗi không mong muốn',
  },
};

// AI content messages - alerts, suggestions, etc.
export const aiMessages = {
  // Alert types and titles
  alerts: {
    stockout: {
      title: {
        en: 'Predicted Stockout Risk',
        vi: 'Rủi ro hết hàng dự báo',
      },
      description: {
        en: (weeks: number) => `Stock depletion expected within ${weeks} weeks`,
        vi: (weeks: number) => `Dự kiến hết hàng trong ${weeks} tuần`,
      },
    },
    overstock: {
      title: {
        en: 'Overstock Risk Detected',
        vi: 'Phát hiện rủi ro tồn kho dư thừa',
      },
      description: {
        en: (value: string) => `Excess inventory valued at ${value}`,
        vi: (value: string) => `Hàng tồn dư thừa trị giá ${value}`,
      },
    },
    trendReversal: {
      title: {
        en: 'Trend Reversal Detected',
        vi: 'Phát hiện đảo chiều xu hướng',
      },
      description: {
        en: 'Sales pattern indicates potential demand shift',
        vi: 'Mô hình bán hàng cho thấy sự thay đổi nhu cầu tiềm năng',
      },
    },
    marginDecline: {
      title: {
        en: 'Margin Erosion Warning',
        vi: 'Cảnh báo suy giảm biên lợi nhuận',
      },
      description: {
        en: (pct: number) => `Margin has declined by ${pct}% this period`,
        vi: (pct: number) => `Biên lợi nhuận đã giảm ${pct}% trong kỳ này`,
      },
    },
    lowStock: {
      title: {
        en: 'Low Stock Alert',
        vi: 'Cảnh báo hàng tồn thấp',
      },
      description: {
        en: (name: string, weeks: number) => `${name}: Only ${weeks} weeks of cover remaining`,
        vi: (name: string, weeks: number) => `${name}: Chỉ còn ${weeks} tuần hàng`,
      },
    },
    excessInventory: {
      title: {
        en: 'Excess Inventory Alert',
        vi: 'Cảnh báo tồn kho dư thừa',
      },
      description: {
        en: (name: string, weeks: number) => `${name}: ${weeks} weeks of cover exceeds target`,
        vi: (name: string, weeks: number) => `${name}: ${weeks} tuần hàng vượt mục tiêu`,
      },
    },
    otbOverrun: {
      title: {
        en: 'OTB Budget Alert',
        vi: 'Cảnh báo ngân sách OTB',
      },
      description: {
        en: (name: string, pct: number) => `${name}: OTB utilization at ${pct}%`,
        vi: (name: string, pct: number) => `${name}: Sử dụng OTB ở mức ${pct}%`,
      },
    },
  },

  // Recommended actions
  actions: {
    placeEmergencyOrder: {
      en: 'Place emergency order to prevent stockout',
      vi: 'Đặt đơn hàng khẩn cấp để tránh hết hàng',
    },
    reviewPendingPOs: {
      en: 'Review and expedite pending purchase orders',
      vi: 'Xem xét và đẩy nhanh các đơn mua hàng đang chờ',
    },
    considerMarkdown: {
      en: 'Consider markdown strategy to clear excess inventory',
      vi: 'Xem xét chiến lược giảm giá để giải phóng hàng tồn dư',
    },
    reviewPricing: {
      en: 'Review pricing strategy across categories',
      vi: 'Xem xét chiến lược giá trên các danh mục',
    },
    adjustForecast: {
      en: 'Adjust demand forecast based on new trends',
      vi: 'Điều chỉnh dự báo nhu cầu dựa trên xu hướng mới',
    },
    holdNewOrders: {
      en: 'Hold new orders until inventory normalizes',
      vi: 'Tạm dừng đơn mới cho đến khi tồn kho bình thường',
    },
    reallocateStock: {
      en: 'Consider stock reallocation between locations',
      vi: 'Xem xét phân bổ lại hàng giữa các địa điểm',
    },
  },

  // Suggestion types
  suggestions: {
    restock: {
      title: {
        en: 'Restock Recommendation',
        vi: 'Đề xuất bổ sung hàng',
      },
      description: {
        en: (category: string, qty: number) => `Restock ${category} with ${qty} units`,
        vi: (category: string, qty: number) => `Bổ sung ${category} với ${qty} đơn vị`,
      },
    },
    markdown: {
      title: {
        en: 'Markdown Recommendation',
        vi: 'Đề xuất giảm giá',
      },
      description: {
        en: (pct: number) => `Consider ${pct}% markdown to improve sell-through`,
        vi: (pct: number) => `Xem xét giảm giá ${pct}% để cải thiện tỷ lệ bán`,
      },
    },
    transfer: {
      title: {
        en: 'Transfer Recommendation',
        vi: 'Đề xuất chuyển hàng',
      },
      description: {
        en: (from: string, to: string) => `Transfer inventory from ${from} to ${to}`,
        vi: (from: string, to: string) => `Chuyển hàng từ ${from} đến ${to}`,
      },
    },
  },

  // Severity labels
  severity: {
    critical: { en: 'Critical', vi: 'Nghiêm trọng' },
    high: { en: 'High', vi: 'Cao' },
    medium: { en: 'Medium', vi: 'Trung bình' },
    low: { en: 'Low', vi: 'Thấp' },
    info: { en: 'Info', vi: 'Thông tin' },
  },

  // Plan generation
  plans: {
    generated: {
      en: (type: string) => `AI-generated ${type} plan`,
      vi: (type: string) => `Kế hoạch ${type} được tạo bởi AI`,
    },
    category: {
      tops: { en: 'Tops', vi: 'Áo' },
      bottoms: { en: 'Bottoms', vi: 'Quần' },
      dresses: { en: 'Dresses', vi: 'Đầm' },
      accessories: { en: 'Accessories', vi: 'Phụ kiện' },
      outerwear: { en: 'Outerwear', vi: 'Áo khoác' },
      footwear: { en: 'Footwear', vi: 'Giày dép' },
    },
  },
};

// Helper function to get error message
export function getErrorMessage(
  code: keyof typeof errorMessages,
  locale: Locale
): string {
  const messages = errorMessages[code];
  if (!messages) {
    return errorMessages.UNKNOWN_ERROR[locale];
  }
  return messages[locale];
}

// Helper function for parameterized error messages
export function getErrorMessageWithParams(
  code: keyof typeof errorMessages,
  locale: Locale,
  params: Record<string, string | number>
): string {
  let message = getErrorMessage(code, locale);
  Object.entries(params).forEach(([key, value]) => {
    message = message.replace(`{${key}}`, String(value));
  });
  return message;
}

// Helper to get alert title
export function getAlertTitle(
  type: keyof typeof aiMessages.alerts,
  locale: Locale
): string {
  return aiMessages.alerts[type]?.title[locale] || type;
}

// Helper to get severity label
export function getSeverityLabel(
  severity: keyof typeof aiMessages.severity,
  locale: Locale
): string {
  return aiMessages.severity[severity]?.[locale] || severity;
}

// Helper to get action text
export function getActionText(
  action: keyof typeof aiMessages.actions,
  locale: Locale
): string {
  return aiMessages.actions[action]?.[locale] || action;
}

// Export type for error codes
export type ErrorCode = keyof typeof errorMessages;
