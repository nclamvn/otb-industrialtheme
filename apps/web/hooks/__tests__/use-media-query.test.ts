import { renderHook, act, waitFor } from '@testing-library/react';
import {
  useMediaQuery,
  useBreakpoint,
  useIsMobile,
  useIsDesktop,
  usePrefersReducedMotion,
  usePrefersDarkMode,
  breakpoints,
} from '../use-media-query';

// Mock matchMedia
const createMatchMedia = (matches: boolean) => ({
  matches,
  media: '',
  onchange: null,
  addListener: jest.fn(),
  removeListener: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
});

describe('useMediaQuery', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query: string) => createMatchMedia(false)),
    });
  });

  it('returns false initially when media query does not match', () => {
    window.matchMedia = jest.fn().mockImplementation(() => createMatchMedia(false));

    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    expect(result.current).toBe(false);
  });

  it('returns true when media query matches', async () => {
    window.matchMedia = jest.fn().mockImplementation(() => createMatchMedia(true));

    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));

    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });

  it('updates when media query changes', async () => {
    let handler: ((event: MediaQueryListEvent) => void) | null = null;

    window.matchMedia = jest.fn().mockImplementation(() => ({
      matches: false,
      addEventListener: (event: string, cb: any) => {
        handler = cb;
      },
      removeEventListener: jest.fn(),
    }));

    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));

    expect(result.current).toBe(false);

    // Simulate media query change
    act(() => {
      if (handler) {
        handler({ matches: true } as MediaQueryListEvent);
      }
    });

    expect(result.current).toBe(true);
  });

  it('removes event listener on unmount', () => {
    const removeEventListener = jest.fn();
    window.matchMedia = jest.fn().mockImplementation(() => ({
      matches: false,
      addEventListener: jest.fn(),
      removeEventListener,
    }));

    const { unmount } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    unmount();

    expect(removeEventListener).toHaveBeenCalled();
  });

  it('updates when query prop changes', () => {
    const matchMediaMock = jest.fn().mockImplementation(() => createMatchMedia(false));
    window.matchMedia = matchMediaMock;

    const { rerender } = renderHook(({ query }) => useMediaQuery(query), {
      initialProps: { query: '(min-width: 768px)' },
    });

    rerender({ query: '(min-width: 1024px)' });

    expect(matchMediaMock).toHaveBeenCalledWith('(min-width: 1024px)');
  });
});

describe('useBreakpoint', () => {
  it('returns correct values for mobile (xs)', async () => {
    window.matchMedia = jest.fn().mockImplementation((query: string) => {
      if (query.includes('max-width: 639px')) {
        return createMatchMedia(true);
      }
      return createMatchMedia(false);
    });

    const { result } = renderHook(() => useBreakpoint());

    await waitFor(() => {
      expect(result.current.isXs).toBe(true);
      expect(result.current.isMobile).toBe(true);
      expect(result.current.isDesktop).toBe(false);
      expect(result.current.breakpoint).toBe('xs');
    });
  });

  it('returns correct values for tablet (md)', async () => {
    window.matchMedia = jest.fn().mockImplementation((query: string) => {
      if (query.includes(`min-width: ${breakpoints.md}px`)) {
        return createMatchMedia(true);
      }
      return createMatchMedia(false);
    });

    const { result } = renderHook(() => useBreakpoint());

    await waitFor(() => {
      expect(result.current.isMd).toBe(true);
      expect(result.current.isTablet).toBe(true);
    });
  });

  it('returns correct values for desktop (lg)', async () => {
    window.matchMedia = jest.fn().mockImplementation((query: string) => {
      if (query.includes(`min-width: ${breakpoints.lg}px`)) {
        return createMatchMedia(true);
      }
      return createMatchMedia(false);
    });

    const { result } = renderHook(() => useBreakpoint());

    await waitFor(() => {
      expect(result.current.isLg).toBe(true);
      expect(result.current.isDesktop).toBe(true);
    });
  });
});

describe('useIsMobile', () => {
  it('returns true for mobile width', async () => {
    window.matchMedia = jest.fn().mockImplementation(() => createMatchMedia(true));

    const { result } = renderHook(() => useIsMobile());

    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });

  it('returns false for desktop width', async () => {
    window.matchMedia = jest.fn().mockImplementation(() => createMatchMedia(false));

    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(false);
  });
});

describe('useIsDesktop', () => {
  it('returns true for desktop width', async () => {
    window.matchMedia = jest.fn().mockImplementation(() => createMatchMedia(true));

    const { result } = renderHook(() => useIsDesktop());

    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });

  it('returns false for mobile width', async () => {
    window.matchMedia = jest.fn().mockImplementation(() => createMatchMedia(false));

    const { result } = renderHook(() => useIsDesktop());

    expect(result.current).toBe(false);
  });
});

describe('usePrefersReducedMotion', () => {
  it('returns true when user prefers reduced motion', async () => {
    window.matchMedia = jest.fn().mockImplementation((query: string) => {
      if (query === '(prefers-reduced-motion: reduce)') {
        return createMatchMedia(true);
      }
      return createMatchMedia(false);
    });

    const { result } = renderHook(() => usePrefersReducedMotion());

    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });

  it('returns false when user does not prefer reduced motion', () => {
    window.matchMedia = jest.fn().mockImplementation(() => createMatchMedia(false));

    const { result } = renderHook(() => usePrefersReducedMotion());

    expect(result.current).toBe(false);
  });
});

describe('usePrefersDarkMode', () => {
  it('returns true when user prefers dark mode', async () => {
    window.matchMedia = jest.fn().mockImplementation((query: string) => {
      if (query === '(prefers-color-scheme: dark)') {
        return createMatchMedia(true);
      }
      return createMatchMedia(false);
    });

    const { result } = renderHook(() => usePrefersDarkMode());

    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });

  it('returns false when user prefers light mode', () => {
    window.matchMedia = jest.fn().mockImplementation(() => createMatchMedia(false));

    const { result } = renderHook(() => usePrefersDarkMode());

    expect(result.current).toBe(false);
  });
});

describe('breakpoints constant', () => {
  it('has correct Tailwind CSS breakpoint values', () => {
    expect(breakpoints.xs).toBe(0);
    expect(breakpoints.sm).toBe(640);
    expect(breakpoints.md).toBe(768);
    expect(breakpoints.lg).toBe(1024);
    expect(breakpoints.xl).toBe(1280);
    expect(breakpoints['2xl']).toBe(1536);
  });
});
