import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateForecastRunDto, CreateForecastConfigDto, ForecastMethodEnum } from './dto/create-forecast.dto';

export interface HistoricalDataPoint {
  weekNumber: number;
  weekStartDate: Date;
  salesValue: number;
  salesUnits: number;
}

interface ForecastResult {
  weekNumber: number;
  weekStartDate: Date;
  weekEndDate: Date;
  forecastValue: number;
  forecastUnits: number;
  confidenceLower: number;
  confidenceUpper: number;
  movingAvgForecast?: number;
  expSmoothForecast?: number;
  trendForecast?: number;
}

interface ForecastConfig {
  lookbackWeeks: number;
  forecastWeeks: number;
  movingAvgWeight: number;
  expSmoothWeight: number;
  trendWeight: number;
  expSmoothAlpha: number;
  expSmoothBeta: number;
  expSmoothGamma: number;
}

@Injectable()
export class ForecastingService {
  private readonly logger = new Logger(ForecastingService.name);

  constructor(private prisma: PrismaService) {}

  // ==================== Forecast Config ====================

  async createConfig(dto: CreateForecastConfigDto) {
    return this.prisma.forecastConfig.create({
      data: {
        brandId: dto.brandId,
        categoryId: dto.categoryId,
        seasonId: dto.seasonId,
        primaryMethod: dto.primaryMethod,
        lookbackWeeks: dto.lookbackWeeks || 12,
        forecastWeeks: dto.forecastWeeks || 8,
        movingAvgWeight: dto.movingAvgWeight || 0.25,
        expSmoothWeight: dto.expSmoothWeight || 0.35,
        trendWeight: dto.trendWeight || 0.40,
        expSmoothAlpha: dto.expSmoothAlpha || 0.30,
        expSmoothBeta: dto.expSmoothBeta || 0.10,
        expSmoothGamma: dto.expSmoothGamma || 0.20,
      },
    });
  }

  async getConfigs(filters: { brandId?: string; categoryId?: string; isActive?: boolean }) {
    const where: any = {};
    if (filters.brandId) where.brandId = filters.brandId;
    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.isActive !== undefined) where.isActive = filters.isActive;

    return this.prisma.forecastConfig.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateConfig(id: string, dto: Partial<CreateForecastConfigDto>) {
    return this.prisma.forecastConfig.update({
      where: { id },
      data: dto,
    });
  }

  // ==================== Forecasting Methods ====================

  /**
   * Simple Moving Average
   */
  calculateMovingAverage(data: number[], periods: number): number {
    if (data.length < periods) {
      return data.reduce((sum, val) => sum + val, 0) / data.length;
    }
    const recentData = data.slice(-periods);
    return recentData.reduce((sum, val) => sum + val, 0) / periods;
  }

  /**
   * Exponential Smoothing (Holt-Winters)
   */
  calculateExponentialSmoothing(
    data: number[],
    alpha: number = 0.3,
    beta: number = 0.1,
    periods: number = 1,
  ): number {
    if (data.length === 0) return 0;
    if (data.length === 1) return data[0];

    // Initialize level and trend
    let level = data[0];
    let trend = data.length > 1 ? data[1] - data[0] : 0;

    // Apply exponential smoothing
    for (let i = 1; i < data.length; i++) {
      const prevLevel = level;
      level = alpha * data[i] + (1 - alpha) * (level + trend);
      trend = beta * (level - prevLevel) + (1 - beta) * trend;
    }

    // Forecast
    return level + periods * trend;
  }

  /**
   * Trend-Adjusted Forecast using Linear Regression
   */
  calculateTrendAdjusted(data: number[]): { forecast: number; slope: number; intercept: number } {
    const n = data.length;
    if (n === 0) return { forecast: 0, slope: 0, intercept: 0 };
    if (n === 1) return { forecast: data[0], slope: 0, intercept: data[0] };

    // Calculate means
    const xMean = (n - 1) / 2;
    const yMean = data.reduce((sum, val) => sum + val, 0) / n;

    // Calculate slope and intercept
    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n; i++) {
      numerator += (i - xMean) * (data[i] - yMean);
      denominator += (i - xMean) ** 2;
    }

    const slope = denominator !== 0 ? numerator / denominator : 0;
    const intercept = yMean - slope * xMean;

    // Forecast for next period
    const forecast = intercept + slope * n;

    return { forecast, slope, intercept };
  }

  /**
   * Ensemble Forecast combining all methods
   */
  calculateEnsembleForecast(
    data: number[],
    config: ForecastConfig,
    periodsAhead: number = 1,
  ): { forecast: number; components: { ma: number; exp: number; trend: number } } {
    // Moving Average component
    const maForecast = this.calculateMovingAverage(data, Math.min(4, data.length));

    // Exponential Smoothing component
    const expForecast = this.calculateExponentialSmoothing(
      data,
      config.expSmoothAlpha,
      config.expSmoothBeta,
      periodsAhead,
    );

    // Trend-Adjusted component
    const trendResult = this.calculateTrendAdjusted(data);
    const trendForecast = trendResult.intercept + trendResult.slope * (data.length + periodsAhead - 1);

    // Weighted ensemble
    const forecast =
      config.movingAvgWeight * maForecast +
      config.expSmoothWeight * expForecast +
      config.trendWeight * trendForecast;

    return {
      forecast: Math.max(0, Math.round(forecast * 100) / 100),
      components: {
        ma: Math.max(0, Math.round(maForecast * 100) / 100),
        exp: Math.max(0, Math.round(expForecast * 100) / 100),
        trend: Math.max(0, Math.round(trendForecast * 100) / 100),
      },
    };
  }

  /**
   * Calculate confidence interval
   */
  calculateConfidenceInterval(
    forecast: number,
    historicalData: number[],
    confidence: number = 0.95,
  ): { lower: number; upper: number } {
    if (historicalData.length < 2) {
      return { lower: forecast * 0.8, upper: forecast * 1.2 };
    }

    // Calculate standard deviation
    const mean = historicalData.reduce((sum, val) => sum + val, 0) / historicalData.length;
    const variance =
      historicalData.reduce((sum, val) => sum + (val - mean) ** 2, 0) / (historicalData.length - 1);
    const stdDev = Math.sqrt(variance);

    // Z-score for 95% confidence
    const z = 1.96;

    return {
      lower: Math.max(0, Math.round((forecast - z * stdDev) * 100) / 100),
      upper: Math.round((forecast + z * stdDev) * 100) / 100,
    };
  }

  /**
   * Calculate forecast accuracy (MAPE)
   */
  calculateMAPE(actuals: number[], forecasts: number[]): number {
    if (actuals.length === 0 || actuals.length !== forecasts.length) return 0;

    const errors = actuals.map((actual, i) => {
      if (actual === 0) return 0;
      return Math.abs((actual - forecasts[i]) / actual);
    });

    return Math.round((errors.reduce((sum, e) => sum + e, 0) / errors.length) * 10000) / 100;
  }

  // ==================== Forecast Runs ====================

  /**
   * Generate mock historical data for demonstration
   */
  private generateMockHistoricalData(weeks: number): HistoricalDataPoint[] {
    const data: HistoricalDataPoint[] = [];
    const baseValue = 50000;
    const baseUnits = 500;
    const now = new Date();

    for (let i = weeks; i > 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - i * 7);

      // Add some seasonality and randomness
      const seasonalFactor = 1 + 0.2 * Math.sin((i * Math.PI) / 13); // ~13 week cycle
      const randomFactor = 0.9 + Math.random() * 0.2;
      const trendFactor = 1 + (weeks - i) * 0.005; // Slight upward trend

      data.push({
        weekNumber: weeks - i + 1,
        weekStartDate: weekStart,
        salesValue: Math.round(baseValue * seasonalFactor * randomFactor * trendFactor),
        salesUnits: Math.round(baseUnits * seasonalFactor * randomFactor * trendFactor),
      });
    }

    return data;
  }

  /**
   * Run a forecast
   */
  async runForecast(dto: CreateForecastRunDto, userId: string) {
    // Get config for this context
    const config = await this.prisma.forecastConfig.findFirst({
      where: {
        brandId: dto.brandId,
        categoryId: dto.categoryId,
        seasonId: dto.seasonId,
        isActive: true,
      },
    });

    const forecastConfig: ForecastConfig = {
      lookbackWeeks: dto.lookbackWeeks || config?.lookbackWeeks || 12,
      forecastWeeks: dto.forecastWeeks || config?.forecastWeeks || 8,
      movingAvgWeight: Number(config?.movingAvgWeight) || 0.25,
      expSmoothWeight: Number(config?.expSmoothWeight) || 0.35,
      trendWeight: Number(config?.trendWeight) || 0.40,
      expSmoothAlpha: Number(config?.expSmoothAlpha) || 0.30,
      expSmoothBeta: Number(config?.expSmoothBeta) || 0.10,
      expSmoothGamma: Number(config?.expSmoothGamma) || 0.20,
    };

    // Get historical data (mock for demonstration)
    const historicalData = this.generateMockHistoricalData(forecastConfig.lookbackWeeks);
    const salesValues = historicalData.map((d) => d.salesValue);
    const salesUnits = historicalData.map((d) => d.salesUnits);

    // Generate forecasts
    const forecastResults: ForecastResult[] = [];
    const lastDate = historicalData[historicalData.length - 1].weekStartDate;

    for (let i = 1; i <= forecastConfig.forecastWeeks; i++) {
      const weekStart = new Date(lastDate);
      weekStart.setDate(weekStart.getDate() + i * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      let forecastValue: number;
      let forecastUnitsValue: number;
      let components = { ma: 0, exp: 0, trend: 0 };

      switch (dto.method) {
        case ForecastMethodEnum.MOVING_AVERAGE:
          forecastValue = this.calculateMovingAverage(salesValues, 4);
          forecastUnitsValue = this.calculateMovingAverage(salesUnits, 4);
          break;

        case ForecastMethodEnum.EXPONENTIAL_SMOOTHING:
          forecastValue = this.calculateExponentialSmoothing(
            salesValues,
            forecastConfig.expSmoothAlpha,
            forecastConfig.expSmoothBeta,
            i,
          );
          forecastUnitsValue = this.calculateExponentialSmoothing(
            salesUnits,
            forecastConfig.expSmoothAlpha,
            forecastConfig.expSmoothBeta,
            i,
          );
          break;

        case ForecastMethodEnum.TREND_ADJUSTED:
          const trendResult = this.calculateTrendAdjusted(salesValues);
          forecastValue = trendResult.intercept + trendResult.slope * (salesValues.length + i - 1);
          const trendUnits = this.calculateTrendAdjusted(salesUnits);
          forecastUnitsValue = trendUnits.intercept + trendUnits.slope * (salesUnits.length + i - 1);
          break;

        case ForecastMethodEnum.ENSEMBLE:
        default:
          const ensembleValue = this.calculateEnsembleForecast(salesValues, forecastConfig, i);
          forecastValue = ensembleValue.forecast;
          components = ensembleValue.components;
          const ensembleUnits = this.calculateEnsembleForecast(salesUnits, forecastConfig, i);
          forecastUnitsValue = ensembleUnits.forecast;
          break;
      }

      const confidenceValue = this.calculateConfidenceInterval(forecastValue, salesValues);

      forecastResults.push({
        weekNumber: historicalData.length + i,
        weekStartDate: weekStart,
        weekEndDate: weekEnd,
        forecastValue: Math.round(forecastValue * 100) / 100,
        forecastUnits: Math.round(forecastUnitsValue),
        confidenceLower: confidenceValue.lower,
        confidenceUpper: confidenceValue.upper,
        movingAvgForecast: components.ma || undefined,
        expSmoothForecast: components.exp || undefined,
        trendForecast: components.trend || undefined,
      });

      // Update historical data for next iteration (for multi-step forecast)
      salesValues.push(forecastValue);
      salesUnits.push(forecastUnitsValue);
    }

    // Calculate accuracy metrics (using last 4 weeks as validation)
    const validationActuals = historicalData.slice(-4).map((d) => d.salesValue);
    const validationForecasts = validationActuals.map((_, i) =>
      this.calculateEnsembleForecast(salesValues.slice(0, -4 + i), forecastConfig, 1).forecast,
    );
    const mape = this.calculateMAPE(validationActuals, validationForecasts);

    // Create forecast run record
    const run = await this.prisma.forecastRun.create({
      data: {
        seasonId: dto.seasonId,
        brandId: dto.brandId,
        categoryId: dto.categoryId,
        method: dto.method,
        status: 'COMPLETED',
        inputStartDate: historicalData[0].weekStartDate,
        inputEndDate: historicalData[historicalData.length - 1].weekStartDate,
        dataPoints: historicalData.length,
        mape,
        confidenceInterval: 0.95,
        parameters: {
          lookbackWeeks: forecastConfig.lookbackWeeks,
          forecastWeeks: forecastConfig.forecastWeeks,
          weights: {
            ma: forecastConfig.movingAvgWeight,
            exp: forecastConfig.expSmoothWeight,
            trend: forecastConfig.trendWeight,
          },
        },
        createdById: userId,
        results: {
          create: forecastResults.map((r) => ({
            weekNumber: r.weekNumber,
            weekStartDate: r.weekStartDate,
            weekEndDate: r.weekEndDate,
            forecastValue: r.forecastValue,
            forecastUnits: r.forecastUnits,
            confidenceLower: r.confidenceLower,
            confidenceUpper: r.confidenceUpper,
            movingAvgForecast: r.movingAvgForecast,
            expSmoothForecast: r.expSmoothForecast,
            trendForecast: r.trendForecast,
          })),
        },
      },
      include: {
        results: {
          orderBy: { weekNumber: 'asc' },
        },
      },
    });

    return {
      run,
      historicalData: historicalData.slice(-8), // Return last 8 weeks for context
      accuracy: {
        mape,
        interpretation:
          mape < 10
            ? 'Excellent'
            : mape < 20
            ? 'Good'
            : mape < 30
            ? 'Reasonable'
            : 'Poor',
      },
    };
  }

  // ==================== Forecast History ====================

  async getForecastRuns(filters: {
    seasonId?: string;
    brandId?: string;
    categoryId?: string;
    limit?: number;
  }) {
    const where: any = {};
    if (filters.seasonId) where.seasonId = filters.seasonId;
    if (filters.brandId) where.brandId = filters.brandId;
    if (filters.categoryId) where.categoryId = filters.categoryId;

    return this.prisma.forecastRun.findMany({
      where,
      include: {
        _count: { select: { results: true } },
      },
      orderBy: { runDate: 'desc' },
      take: filters.limit || 20,
    });
  }

  async getForecastRunById(id: string) {
    const run = await this.prisma.forecastRun.findUnique({
      where: { id },
      include: {
        results: {
          orderBy: { weekNumber: 'asc' },
        },
      },
    });

    if (!run) {
      throw new NotFoundException(`Forecast run with ID ${id} not found`);
    }

    return run;
  }

  /**
   * Compare multiple forecast methods
   */
  async compareMethods(params: {
    seasonId?: string;
    brandId?: string;
    categoryId?: string;
    lookbackWeeks?: number;
    forecastWeeks?: number;
  }) {
    const methods = [
      ForecastMethodEnum.MOVING_AVERAGE,
      ForecastMethodEnum.EXPONENTIAL_SMOOTHING,
      ForecastMethodEnum.TREND_ADJUSTED,
      ForecastMethodEnum.ENSEMBLE,
    ];

    const results = [];

    for (const method of methods) {
      const dto: CreateForecastRunDto = {
        method,
        seasonId: params.seasonId,
        brandId: params.brandId,
        categoryId: params.categoryId,
        lookbackWeeks: params.lookbackWeeks || 12,
        forecastWeeks: params.forecastWeeks || 4,
      };

      const forecast = await this.runForecast(dto, 'system');
      results.push({
        method,
        mape: forecast.accuracy.mape,
        interpretation: forecast.accuracy.interpretation,
        forecasts: forecast.run.results.map((r) => ({
          weekNumber: r.weekNumber,
          forecastValue: r.forecastValue,
        })),
      });
    }

    // Rank by MAPE
    results.sort((a, b) => a.mape - b.mape);

    return {
      comparison: results,
      recommendation: results[0].method,
      recommendationReason: `${results[0].method} has the lowest MAPE (${results[0].mape}%)`,
    };
  }
}
