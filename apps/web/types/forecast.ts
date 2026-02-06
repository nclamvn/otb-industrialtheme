// Forecast Types

export type ForecastType = 'DEMAND' | 'SALES' | 'INVENTORY' | 'MARGIN';
export type ForecastModel = 'ARIMA' | 'EXPONENTIAL_SMOOTHING' | 'PROPHET' | 'ENSEMBLE';

export interface ForecastPrediction {
  date: Date;
  value: number;
  lowerBound: number;
  upperBound: number;
}

export interface ForecastAccuracy {
  mape: number; // Mean Absolute Percentage Error
  rmse: number; // Root Mean Square Error
  mae: number;  // Mean Absolute Error
}

export interface ForecastFactor {
  name: string;
  impact: number; // -1 to 1
  description: string;
}

export interface ForecastResult {
  id: string;
  forecastType: ForecastType;
  modelUsed: ForecastModel;
  seasonId: string;
  brandId?: string;
  categoryId?: string;
  predictions: ForecastPrediction[];
  confidence: number;
  accuracy?: ForecastAccuracy;
  factors: ForecastFactor[];
  generatedAt: Date;
  validUntil: Date;
  inputDataRange: {
    startDate: Date;
    endDate: Date;
  };
}

export interface ForecastRequest {
  forecastType: ForecastType;
  seasonId: string;
  brandId?: string;
  categoryId?: string;
  horizon: number; // days
  model?: ForecastModel;
}

export interface TrendAnalysis {
  direction: 'up' | 'down' | 'stable';
  strength: number; // 0 to 1
  changeRate: number; // percentage per period
  seasonality: {
    detected: boolean;
    period?: number; // days
    amplitude?: number;
  };
  breakpoints: {
    date: Date;
    type: 'increase' | 'decrease' | 'level_shift';
    magnitude: number;
  }[];
}

export interface AnomalyDetection {
  date: Date;
  actualValue: number;
  expectedValue: number;
  deviation: number;
  severity: 'low' | 'medium' | 'high';
  explanation?: string;
}

export interface SeasonalityPattern {
  type: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  pattern: {
    period: string; // e.g., "Monday", "January"
    index: number;
    strength: number;
  }[];
}
