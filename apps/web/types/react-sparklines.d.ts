declare module 'react-sparklines' {
  import { ComponentType, ReactNode } from 'react';

  interface SparklinesProps {
    data: number[];
    limit?: number;
    width?: number;
    height?: number;
    margin?: number;
    min?: number;
    max?: number;
    style?: React.CSSProperties;
    children?: ReactNode;
  }

  interface SparklinesLineProps {
    color?: string;
    style?: React.CSSProperties;
  }

  interface SparklinesBarsProps {
    color?: string;
    style?: React.CSSProperties;
  }

  interface SparklinesReferenceLinesProps {
    type?: 'max' | 'min' | 'mean' | 'avg' | 'median' | 'custom';
    value?: number;
    style?: React.CSSProperties;
  }

  interface SparklinesCurveProps {
    color?: string;
    style?: React.CSSProperties;
  }

  interface SparklinesNormalBandProps {
    style?: React.CSSProperties;
  }

  export const Sparklines: ComponentType<SparklinesProps>;
  export const SparklinesLine: ComponentType<SparklinesLineProps>;
  export const SparklinesBars: ComponentType<SparklinesBarsProps>;
  export const SparklinesReferenceLines: ComponentType<SparklinesReferenceLinesProps>;
  export const SparklinesCurve: ComponentType<SparklinesCurveProps>;
  export const SparklinesNormalBand: ComponentType<SparklinesNormalBandProps>;
}
