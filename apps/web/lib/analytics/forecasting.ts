import { linearRegression, linearRegressionLine, standardDeviation, mean } from 'simple-statistics';
import type {
  ForecastPrediction,
  ForecastAccuracy,
  TrendAnalysis,
  AnomalyDetection,
  ForecastFactor,
} from '@/types/forecast';
import { calculateStandardDeviation } from './calculations';

// Internal forecast result for library functions
interface InternalForecastResult {
  predictions: ForecastPrediction[];
  accuracy: ForecastAccuracy;
  trend: TrendAnalysis;
  anomalies: AnomalyDetection[];
  factors: ForecastFactor[];
  method: string;
  generatedAt: Date;
}

/**
 * Generate demand forecast using multiple methods
 */
export function generateForecast(
  historicalData: number[],
  periods: number = 12,
  confidence: number = 0.95
): InternalForecastResult {
  if (historicalData.length < 3) {
    throw new Error('At least 3 data points required for forecasting');
  }

  // Use ensemble approach combining multiple methods
  const linearForecast = forecastLinear(historicalData, periods);
  const maForecast = forecastMovingAverage(historicalData, periods);
  const esForecast = forecastExponentialSmoothing(historicalData, periods);

  // Combine forecasts (weighted average)
  const weights = { linear: 0.3, ma: 0.3, es: 0.4 };
  const combinedForecast = linearForecast.map((val, i) =>
    val * weights.linear +
    maForecast[i] * weights.ma +
    esForecast[i] * weights.es
  );

  // Calculate confidence intervals
  const stdDev = calculateStandardDeviation(historicalData);
  const zScore = confidence === 0.95 ? 1.96 : confidence === 0.99 ? 2.576 : 1.645;

  const predictions: ForecastPrediction[] = combinedForecast.map((value, i) => {
    // Uncertainty increases with forecast horizon
    const horizonMultiplier = 1 + (i * 0.1);
    const interval = stdDev * zScore * horizonMultiplier;
    // Calculate date for this prediction period (assuming monthly periods)
    const predictionDate = new Date();
    predictionDate.setMonth(predictionDate.getMonth() + i + 1);

    return {
      date: predictionDate,
      value,
      lowerBound: Math.max(0, value - interval),
      upperBound: value + interval,
    };
  });

  // Calculate accuracy metrics using backtesting
  const accuracy = calculateForecastAccuracy(historicalData);

  // Analyze trends
  const trend = analyzeTrend(historicalData);

  // Detect anomalies
  const anomalies = detectAnomalies(historicalData);

  // Identify factors affecting the forecast
  const factors = identifyFactors(historicalData, trend);

  return {
    predictions,
    accuracy,
    trend,
    anomalies,
    factors,
    method: 'ensemble',
    generatedAt: new Date(),
  };
}

/**
 * Linear regression forecast
 */
export function forecastLinear(data: number[], periods: number): number[] {
  const points: [number, number][] = data.map((y, x) => [x, y]);
  const regression = linearRegression(points);
  const line = linearRegressionLine(regression);

  return Array.from({ length: periods }, (_, i) =>
    Math.max(0, line(data.length + i))
  );
}

/**
 * Moving average forecast
 */
export function forecastMovingAverage(data: number[], periods: number, window: number = 3): number[] {
  const lastValues = data.slice(-window);
  const lastMA = mean(lastValues);

  // For MA, we project the last moving average forward with slight decay
  return Array.from({ length: periods }, (_, i) => {
    const decay = 1 - (i * 0.02); // Slight regression to mean
    return lastMA * decay;
  });
}

/**
 * Exponential smoothing forecast (Simple)
 */
export function forecastExponentialSmoothing(
  data: number[],
  periods: number,
  alpha: number = 0.3
): number[] {
  // Calculate smoothed values
  let smoothed = data[0];
  for (let i = 1; i < data.length; i++) {
    smoothed = alpha * data[i] + (1 - alpha) * smoothed;
  }

  // Forecast is the last smoothed value
  return Array.from({ length: periods }, () => smoothed);
}

/**
 * Holt's linear exponential smoothing for trending data
 */
export function forecastHolt(
  data: number[],
  periods: number,
  alpha: number = 0.3,
  beta: number = 0.1
): number[] {
  let level = data[0];
  let trend = data[1] - data[0];

  for (let i = 1; i < data.length; i++) {
    const newLevel = alpha * data[i] + (1 - alpha) * (level + trend);
    trend = beta * (newLevel - level) + (1 - beta) * trend;
    level = newLevel;
  }

  return Array.from({ length: periods }, (_, i) =>
    Math.max(0, level + (i + 1) * trend)
  );
}

/**
 * Calculate forecast accuracy metrics
 */
export function calculateForecastAccuracy(data: number[]): ForecastAccuracy {
  if (data.length < 6) {
    return {
      mape: 0,
      rmse: 0,
      mae: 0,
    };
  }

  // Split data for backtesting
  const trainSize = Math.floor(data.length * 0.8);
  const train = data.slice(0, trainSize);
  const test = data.slice(trainSize);

  // Generate forecast for test period
  const forecast = forecastLinear(train, test.length);

  // Calculate errors
  const errors = test.map((actual, i) => actual - forecast[i]);
  const absErrors = errors.map(Math.abs);
  const squaredErrors = errors.map((e) => e * e);
  const percentErrors = test.map((actual, i) =>
    actual !== 0 ? Math.abs((actual - forecast[i]) / actual) * 100 : 0
  );

  const mape = mean(percentErrors);
  const rmse = Math.sqrt(mean(squaredErrors));
  const mae = mean(absErrors);

  return {
    mape: Math.min(mape, 100), // Cap at 100%
    rmse,
    mae,
  };
}

/**
 * Analyze trend in the data
 */
export function analyzeTrend(data: number[]): TrendAnalysis {
  if (data.length < 2) {
    return {
      direction: 'stable',
      strength: 0,
      changeRate: 0,
      seasonality: {
        detected: false,
      },
      breakpoints: [],
    };
  }

  // Calculate linear regression for trend
  const points: [number, number][] = data.map((y, x) => [x, y]);
  const regression = linearRegression(points);
  const slope = regression.m;

  // Determine trend direction and strength
  const dataMean = mean(data);
  const normalizedSlope = dataMean !== 0 ? slope / dataMean : 0;

  let direction: 'up' | 'down' | 'stable';
  if (normalizedSlope > 0.01) direction = 'up';
  else if (normalizedSlope < -0.01) direction = 'down';
  else direction = 'stable';

  // Calculate trend strength (correlation coefficient)
  const line = linearRegressionLine(regression);
  const predicted = data.map((_, i) => line(i));
  const strength = calculateCorrelation(data, predicted);

  // Calculate change rate as percentage per period
  const changeRate = dataMean !== 0 ? (slope / dataMean) * 100 : 0;

  // Basic seasonality detection
  const seasonalityResult = detectSeasonality(data);

  // Detect breakpoints
  const changePoint = detectChangePoint(data);
  const breakpoints: TrendAnalysis['breakpoints'] = changePoint
    ? [
        {
          date: new Date(),
          type: changePoint.type === 'level_shift_up' ? 'increase' : 'decrease',
          magnitude: Math.abs(slope),
        },
      ]
    : [];

  return {
    direction,
    strength: Math.abs(strength),
    changeRate,
    seasonality: {
      detected: seasonalityResult !== null,
      period: seasonalityResult?.period,
      amplitude: seasonalityResult?.strength,
    },
    breakpoints,
  };
}

/**
 * Detect anomalies in the data
 */
export function detectAnomalies(data: number[], threshold: number = 2.5): AnomalyDetection[] {
  const anomalies: AnomalyDetection[] = [];
  const dataMean = mean(data);
  const dataStd = standardDeviation(data);

  if (dataStd === 0) return anomalies;

  // Create base date for indexing (using current date as reference)
  const baseDate = new Date();

  data.forEach((value, index) => {
    const zScore = (value - dataMean) / dataStd;
    const absZScore = Math.abs(zScore);

    if (absZScore > threshold) {
      let severity: 'low' | 'medium' | 'high';
      if (absZScore > 4) severity = 'high';
      else if (absZScore > 3) severity = 'medium';
      else severity = 'low';

      // Calculate date based on index (assuming monthly data)
      const anomalyDate = new Date(baseDate);
      anomalyDate.setMonth(anomalyDate.getMonth() - (data.length - 1 - index));

      anomalies.push({
        date: anomalyDate,
        actualValue: value,
        expectedValue: dataMean,
        deviation: value - dataMean,
        severity,
        explanation: `${zScore > 0 ? 'Spike' : 'Dip'} detected with z-score of ${absZScore.toFixed(2)}`,
      });
    }
  });

  return anomalies;
}

/**
 * Identify factors affecting the forecast
 */
function identifyFactors(
  data: number[],
  trend: TrendAnalysis
): Array<{ name: string; impact: number; description: string }> {
  const factors: Array<{ name: string; impact: number; description: string }> = [];

  // Trend factor
  if (trend.direction !== 'stable') {
    factors.push({
      name: 'Historical Trend',
      impact: trend.strength,
      description: `${trend.direction === 'up' ? 'Upward' : 'Downward'} trend with ${(trend.strength * 100).toFixed(0)}% strength`,
    });
  }

  // Volatility factor
  const volatility = standardDeviation(data) / mean(data);
  if (volatility > 0.2) {
    factors.push({
      name: 'Data Volatility',
      impact: Math.min(volatility, 1),
      description: `High volatility (${(volatility * 100).toFixed(0)}% CV) increases forecast uncertainty`,
    });
  }

  // Seasonality factor
  if (trend.seasonality) {
    factors.push({
      name: 'Seasonality',
      impact: 0.7,
      description: `Seasonal pattern detected with period of ${trend.seasonality.period}`,
    });
  }

  // Recent momentum
  if (data.length >= 3) {
    const recent = data.slice(-3);
    const recentTrend = (recent[2] - recent[0]) / recent[0];
    if (Math.abs(recentTrend) > 0.1) {
      factors.push({
        name: 'Recent Momentum',
        impact: Math.min(Math.abs(recentTrend), 1),
        description: `${recentTrend > 0 ? 'Positive' : 'Negative'} momentum in recent periods`,
      });
    }
  }

  return factors.sort((a, b) => b.impact - a.impact);
}

/**
 * Helper: Calculate correlation coefficient
 */
function calculateCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length === 0) return 0;

  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
  const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  return denominator !== 0 ? numerator / denominator : 0;
}

/**
 * Helper: Detect change points in the data
 */
function detectChangePoint(data: number[]): { index: number; type: string } | null {
  if (data.length < 6) return null;

  let maxDiff = 0;
  let changeIndex = -1;

  // Simple change point detection using difference in means
  for (let i = 3; i < data.length - 3; i++) {
    const before = data.slice(0, i);
    const after = data.slice(i);
    const diff = Math.abs(mean(after) - mean(before));

    if (diff > maxDiff) {
      maxDiff = diff;
      changeIndex = i;
    }
  }

  // Only report if change is significant
  const threshold = standardDeviation(data);
  if (maxDiff > threshold && changeIndex > 0) {
    const beforeMean = mean(data.slice(0, changeIndex));
    const afterMean = mean(data.slice(changeIndex));
    return {
      index: changeIndex,
      type: afterMean > beforeMean ? 'level_shift_up' : 'level_shift_down',
    };
  }

  return null;
}

/**
 * Helper: Detect seasonality
 */
function detectSeasonality(data: number[]): { period: number; strength: number } | null {
  if (data.length < 12) return null;

  // Test common seasonal periods
  const periods = [4, 6, 12];
  let bestPeriod = 0;
  let bestCorrelation = 0;

  for (const period of periods) {
    if (data.length < period * 2) continue;

    // Calculate autocorrelation at this lag
    const autocorr = calculateAutocorrelation(data, period);
    if (autocorr > bestCorrelation && autocorr > 0.5) {
      bestCorrelation = autocorr;
      bestPeriod = period;
    }
  }

  return bestPeriod > 0
    ? { period: bestPeriod, strength: bestCorrelation }
    : null;
}

/**
 * Helper: Calculate autocorrelation at a given lag
 */
function calculateAutocorrelation(data: number[], lag: number): number {
  if (data.length <= lag) return 0;

  const original = data.slice(0, data.length - lag);
  const lagged = data.slice(lag);

  return calculateCorrelation(original, lagged);
}

/**
 * Generate seasonal forecast
 */
export function forecastSeasonal(
  data: number[],
  periods: number,
  seasonalPeriod: number = 12
): number[] {
  if (data.length < seasonalPeriod) {
    return forecastLinear(data, periods);
  }

  // Decompose: calculate seasonal indices
  const seasonalIndices: number[] = [];
  for (let i = 0; i < seasonalPeriod; i++) {
    const seasonalValues = data.filter((_, idx) => idx % seasonalPeriod === i);
    seasonalIndices.push(mean(seasonalValues));
  }

  // Normalize indices
  const indexMean = mean(seasonalIndices);
  const normalizedIndices = seasonalIndices.map((idx) => idx / indexMean);

  // Deseasonalize and forecast trend
  const deseasonalized = data.map((val, i) => val / normalizedIndices[i % seasonalPeriod]);
  const trendForecast = forecastLinear(deseasonalized, periods);

  // Reapply seasonality
  const lastSeasonIndex = data.length % seasonalPeriod;
  return trendForecast.map((val, i) => {
    const seasonIndex = (lastSeasonIndex + i) % seasonalPeriod;
    return val * normalizedIndices[seasonIndex];
  });
}
