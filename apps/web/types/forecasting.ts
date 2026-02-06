export type ForecastMethod = 'MOVING_AVERAGE' | 'EXPONENTIAL_SMOOTHING' | 'TREND_ADJUSTED' | 'ENSEMBLE';

export interface ForecastResult {
  weeklyForecast: number[];
  confidence: { lower: number; upper: number }[];
  accuracy: number;
  method: string;
  insights: string[];
}

export interface ForecastConfig {
  id: string;
  brandId?: string;
  categoryId?: string;
  seasonId?: string;
  primaryMethod: ForecastMethod;
  lookbackWeeks: number;
  forecastWeeks: number;
  movingAvgWeight: number;
  expSmoothWeight: number;
  trendWeight: number;
  isActive: boolean;
}

export interface ForecastRun {
  id: string;
  configId?: string;
  seasonId?: string;
  brandId?: string;
  categoryId?: string;
  method: ForecastMethod;
  lookbackWeeks: number;
  forecastWeeks: number;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  accuracy?: number;
  mape?: number;
  rmse?: number;
  createdAt: string;
  completedAt?: string;
}
