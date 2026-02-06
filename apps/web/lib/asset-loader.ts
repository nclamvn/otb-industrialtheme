/**
 * Asset Loading Utilities
 *
 * Preloading, lazy loading, and caching for static assets
 */

// ============================================
// PRELOAD CRITICAL ASSETS
// ============================================

const CRITICAL_IMAGES = [
  '/images/logo.svg',
  '/images/logo-dark.svg',
];

const CRITICAL_FONTS = [
  '/fonts/inter-var.woff2',
];

/**
 * Preload critical assets on app initialization
 */
export function preloadCriticalAssets(): void {
  if (typeof window === 'undefined') return;

  // Preload images
  CRITICAL_IMAGES.forEach((src) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    document.head.appendChild(link);
  });

  // Preload fonts
  CRITICAL_FONTS.forEach((src) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'font';
    link.type = 'font/woff2';
    link.href = src;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });
}

// ============================================
// LAZY LOAD ASSETS
// ============================================

/**
 * Lazy load an image
 */
export function lazyLoadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Lazy load multiple images
 */
export function lazyLoadImages(sources: string[]): Promise<HTMLImageElement[]> {
  return Promise.all(sources.map(lazyLoadImage));
}

/**
 * Preload image on hover (for instant display on click)
 */
export function preloadOnHover(element: HTMLElement, imageSrc: string): () => void {
  let preloaded = false;

  const handleHover = () => {
    if (!preloaded) {
      lazyLoadImage(imageSrc);
      preloaded = true;
    }
  };

  element.addEventListener('mouseenter', handleHover);
  element.addEventListener('touchstart', handleHover, { passive: true });

  return () => {
    element.removeEventListener('mouseenter', handleHover);
    element.removeEventListener('touchstart', handleHover);
  };
}

// ============================================
// SERVICE WORKER REGISTRATION
// ============================================

/**
 * Register service worker for asset caching
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined') return null;
  if (!('serviceWorker' in navigator)) {
    console.log('Service Worker not supported');
    return null;
  }
  if (process.env.NODE_ENV !== 'production') {
    console.log('Service Worker disabled in development');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    console.log('Service Worker registered:', registration.scope);

    // Check for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New content available
            console.log('New content available, refresh to update');
          }
        });
      }
    });

    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
}

/**
 * Unregister service worker
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    return registration.unregister();
  } catch (error) {
    console.error('Service Worker unregistration failed:', error);
    return false;
  }
}

// ============================================
// RESOURCE HINTS
// ============================================

/**
 * Add DNS prefetch hint
 */
export function dnsPrefetch(domain: string): void {
  if (typeof window === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'dns-prefetch';
  link.href = domain;
  document.head.appendChild(link);
}

/**
 * Add preconnect hint
 */
export function preconnect(domain: string, crossOrigin = true): void {
  if (typeof window === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'preconnect';
  link.href = domain;
  if (crossOrigin) link.crossOrigin = 'anonymous';
  document.head.appendChild(link);
}

/**
 * Prefetch a resource (for future navigation)
 */
export function prefetchResource(url: string, as?: string): void {
  if (typeof window === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = url;
  if (as) link.as = as;
  document.head.appendChild(link);
}

// ============================================
// IMAGE OPTIMIZATION HELPERS
// ============================================

/**
 * Get optimized image URL with size parameters
 */
export function getOptimizedImageUrl(
  src: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'avif' | 'auto';
  } = {}
): string {
  const { width, height, quality = 75, format = 'auto' } = options;

  // For Next.js Image Optimization API
  if (src.startsWith('/')) {
    const params = new URLSearchParams();
    if (width) params.set('w', width.toString());
    if (height) params.set('h', height.toString());
    params.set('q', quality.toString());

    return `/_next/image?url=${encodeURIComponent(src)}&${params.toString()}`;
  }

  // Return original for external URLs
  return src;
}

/**
 * Generate srcset for responsive images
 */
export function generateSrcSet(
  src: string,
  widths: number[] = [640, 750, 828, 1080, 1200, 1920]
): string {
  return widths
    .map((w) => `${getOptimizedImageUrl(src, { width: w })} ${w}w`)
    .join(', ');
}

// ============================================
// PERFORMANCE UTILITIES
// ============================================

/**
 * Defer loading of non-critical resources
 */
export function deferLoad(callback: () => void, delay = 0): void {
  if (typeof window === 'undefined') return;

  if ('requestIdleCallback' in window) {
    (window as Window & { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(
      () => setTimeout(callback, delay)
    );
  } else {
    setTimeout(callback, delay + 50);
  }
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Check if user has slow connection
 */
export function hasSlowConnection(): boolean {
  if (typeof window === 'undefined') return false;

  const connection = (navigator as Navigator & { connection?: { effectiveType: string } }).connection;
  if (!connection) return false;

  return ['slow-2g', '2g'].includes(connection.effectiveType);
}
