'use client';

import Image, { ImageProps } from 'next/image';
import { useState, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';

// ============================================
// OPTIMIZED IMAGE COMPONENT
// ============================================

interface OptimizedImageProps extends Omit<ImageProps, 'onLoad' | 'onError'> {
  fallback?: string;
  aspectRatio?: 'square' | '16/9' | '4/3' | '3/2' | '21/9' | 'auto';
  showSkeleton?: boolean;
  onLoadComplete?: () => void;
  onError?: () => void;
}

export function OptimizedImage({
  src,
  alt,
  fallback = '/images/placeholder.png',
  aspectRatio = 'auto',
  showSkeleton = true,
  className,
  onLoadComplete,
  onError: onErrorProp,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    onLoadComplete?.();
  }, [onLoadComplete]);

  const handleError = useCallback(() => {
    setError(true);
    setIsLoading(false);
    onErrorProp?.();
  }, [onErrorProp]);

  const aspectRatioClass = useMemo(() => {
    switch (aspectRatio) {
      case 'square': return 'aspect-square';
      case '16/9': return 'aspect-video';
      case '4/3': return 'aspect-[4/3]';
      case '3/2': return 'aspect-[3/2]';
      case '21/9': return 'aspect-[21/9]';
      default: return '';
    }
  }, [aspectRatio]);

  return (
    <div className={cn('relative overflow-hidden', aspectRatioClass, className)}>
      {/* Loading skeleton */}
      {showSkeleton && isLoading && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}

      {/* Image */}
      <Image
        src={error ? fallback : src}
        alt={alt}
        className={cn(
          'object-cover transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100'
        )}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />
    </div>
  );
}

// ============================================
// LAZY IMAGE (with intersection observer)
// ============================================

interface LazyImageProps extends OptimizedImageProps {
  threshold?: number;
  rootMargin?: string;
}

export function LazyImage({
  threshold = 0.1,
  rootMargin = '100px',
  ...props
}: LazyImageProps) {
  const [isInView, setIsInView] = useState(false);
  const [ref, setRef] = useState<HTMLDivElement | null>(null);

  // Use intersection observer to detect when image enters viewport
  useMemo(() => {
    if (!ref) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(ref);

    return () => observer.disconnect();
  }, [ref, threshold, rootMargin]);

  return (
    <div ref={setRef} className={props.className}>
      {isInView ? (
        <OptimizedImage {...props} />
      ) : (
        <div className="w-full h-full bg-muted animate-pulse" />
      )}
    </div>
  );
}

// ============================================
// AVATAR IMAGE (with initials fallback)
// ============================================

interface AvatarImageProps {
  src?: string | null;
  alt: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function AvatarImage({
  src,
  alt,
  name,
  size = 'md',
  className,
}: AvatarImageProps) {
  const [error, setError] = useState(false);

  const sizeClasses = useMemo(() => {
    switch (size) {
      case 'sm': return 'w-8 h-8 text-xs';
      case 'lg': return 'w-12 h-12 text-base';
      case 'xl': return 'w-16 h-16 text-lg';
      default: return 'w-10 h-10 text-sm';
    }
  }, [size]);

  const initials = useMemo(() => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }, [name]);

  const bgColor = useMemo(() => {
    if (!name) return 'bg-muted';
    // Generate consistent color based on name
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colors = [
      'bg-red-100 text-red-700',
      'bg-orange-100 text-orange-700',
      'bg-amber-100 text-amber-700',
      'bg-yellow-100 text-yellow-700',
      'bg-lime-100 text-lime-700',
      'bg-green-100 text-green-700',
      'bg-emerald-100 text-emerald-700',
      'bg-teal-100 text-teal-700',
      'bg-cyan-100 text-cyan-700',
      'bg-sky-100 text-sky-700',
      'bg-blue-100 text-blue-700',
      'bg-indigo-100 text-indigo-700',
      'bg-violet-100 text-violet-700',
      'bg-purple-100 text-purple-700',
      'bg-fuchsia-100 text-fuchsia-700',
      'bg-pink-100 text-pink-700',
    ];
    return colors[hash % colors.length];
  }, [name]);

  if (!src || error) {
    return (
      <div
        className={cn(
          'rounded-full flex items-center justify-center font-medium',
          sizeClasses,
          bgColor,
          className
        )}
      >
        {initials}
      </div>
    );
  }

  return (
    <div className={cn('relative rounded-full overflow-hidden', sizeClasses, className)}>
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        onError={() => setError(true)}
      />
    </div>
  );
}

// ============================================
// PRODUCT IMAGE (with zoom on hover)
// ============================================

interface ProductImageProps extends OptimizedImageProps {
  enableZoom?: boolean;
  zoomScale?: number;
}

export function ProductImage({
  enableZoom = true,
  zoomScale = 1.5,
  className,
  ...props
}: ProductImageProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={cn('relative overflow-hidden cursor-zoom-in', className)}
      onMouseEnter={() => enableZoom && setIsHovered(true)}
      onMouseLeave={() => enableZoom && setIsHovered(false)}
    >
      <OptimizedImage
        {...props}
        className={cn(
          'transition-transform duration-300',
          isHovered && `scale-[${zoomScale}]`
        )}
        style={{
          transform: isHovered ? `scale(${zoomScale})` : 'scale(1)',
        }}
      />
    </div>
  );
}
