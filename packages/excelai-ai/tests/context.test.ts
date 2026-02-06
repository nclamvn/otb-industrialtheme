import { describe, it, expect } from 'vitest';
import { OTBContextBuilder, OTBContext } from '../src/context';

describe('OTBContextBuilder', () => {
  const builder = new OTBContextBuilder();

  const sampleContext: OTBContext = {
    planId: 'plan-001',
    planName: 'FW24 OTB Plan',
    division: 'Menswear',
    brand: 'DAFC',
    season: 'Fall/Winter',
    year: 2024,
    metrics: {
      totalBudget: 1500000,
      totalUnits: 25000,
      aur: 150,
      auc: 60,
      margin: 60,
      sellThrough: 75,
      buyPercentage: 85,
      salesPercentage: 78,
    },
    categories: [
      { name: 'Outerwear', budget: 500000, units: 5000, margin: 65, performance: 'above' },
      { name: 'Tops', budget: 400000, units: 8000, margin: 55, performance: 'on-target' },
      { name: 'Bottoms', budget: 350000, units: 7000, margin: 52, performance: 'below' },
    ],
    alerts: [
      { type: 'warning', message: 'Bottoms margin below target' },
      { type: 'info', message: 'Outerwear performing above expectations' },
    ],
    asOfDate: '2024-01-28',
  };

  it('should build complete context', () => {
    const result = builder.build(sampleContext);

    expect(result).toContain('FW24 OTB Plan');
    expect(result).toContain('Menswear');
    expect(result).toContain('$1,500,000');
    expect(result).toContain('25,000');
    expect(result).toContain('Outerwear');
    expect(result).toContain('Bottoms margin below target');
  });

  it('should build without categories', () => {
    const result = builder.build(sampleContext, { includeCategories: false });

    expect(result).toContain('$1,500,000');
    expect(result).not.toContain('Categories Breakdown');
  });

  it('should build without alerts', () => {
    const result = builder.build(sampleContext, { includeAlerts: false });

    expect(result).toContain('$1,500,000');
    expect(result).not.toContain('Alerts');
  });

  it('should limit categories', () => {
    const result = builder.build(sampleContext, { maxCategories: 2 });

    expect(result).toContain('Outerwear');
    expect(result).toContain('Tops');
    expect(result).toContain('Showing top 2 of 3');
  });

  it('should build minimal context', () => {
    const result = builder.buildMinimal(sampleContext);

    expect(result).toContain('FW24 OTB Plan');
    expect(result).toContain('$1,500,000');
    expect(result.length).toBeLessThan(200);
  });
});
