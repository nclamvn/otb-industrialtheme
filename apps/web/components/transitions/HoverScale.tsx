'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// ════════════════════════════════════════
// HoverScale - Scale on hover effect
// ════════════════════════════════════════

interface HoverScaleProps {
  children: React.ReactNode;
  scale?: number;
  className?: string;
}

export function HoverScale({ children, scale = 1.02, className }: HoverScaleProps) {
  return (
    <motion.div
      whileHover={{ scale }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ════════════════════════════════════════
// PressScale - Press/tap effect
// ════════════════════════════════════════

interface PressScaleProps {
  children: React.ReactNode;
  scale?: number;
  className?: string;
  onClick?: () => void;
}

export function PressScale({ children, scale = 0.97, className, onClick }: PressScaleProps) {
  return (
    <motion.button
      whileTap={{ scale }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      className={className}
      onClick={onClick}
    >
      {children}
    </motion.button>
  );
}

// ════════════════════════════════════════
// CountUp - Animated number counter
// ════════════════════════════════════════

interface CountUpProps {
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export function CountUp({
  value,
  duration = 1,
  decimals = 0,
  prefix = '',
  suffix = '',
  className,
}: CountUpProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const startValue = displayValue;
    const diff = value - startValue;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / (duration * 1000), 1);

      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = startValue + diff * easeOut;

      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return (
    <span className={cn('tabular-nums', className)}>
      {prefix}
      {displayValue.toLocaleString('vi-VN', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
}

// ════════════════════════════════════════
// GoldGlow - DAFC gold glow effect
// ════════════════════════════════════════

interface GoldGlowProps {
  children: React.ReactNode;
  intensity?: 'low' | 'medium' | 'high';
  className?: string;
}

export function GoldGlow({ children, intensity = 'medium', className }: GoldGlowProps) {
  const glowStyles = {
    low: 'hover:shadow-[0_0_10px_rgba(184,134,11,0.2)]',
    medium: 'hover:shadow-[0_0_20px_rgba(184,134,11,0.3)]',
    high: 'hover:shadow-[0_0_30px_rgba(184,134,11,0.4)]',
  };

  return (
    <div className={cn('transition-shadow duration-300', glowStyles[intensity], className)}>
      {children}
    </div>
  );
}

// ════════════════════════════════════════
// Pulse - Attention-grabbing pulse
// ════════════════════════════════════════

interface PulseProps {
  children: React.ReactNode;
  color?: string;
  className?: string;
}

export function Pulse({ children, color = '#B8860B', className }: PulseProps) {
  return (
    <span className={cn('relative inline-flex', className)}>
      <span
        className="absolute inset-0 rounded-full opacity-75 animate-ping"
        style={{ backgroundColor: color }}
      />
      <span className="relative">{children}</span>
    </span>
  );
}

// ════════════════════════════════════════
// Shimmer - Loading shimmer effect
// ════════════════════════════════════════

interface ShimmerProps {
  className?: string;
}

export function Shimmer({ className }: ShimmerProps) {
  return (
    <div
      className={cn(
        'animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent bg-[length:200%_100%]',
        className
      )}
    />
  );
}

export default HoverScale;
