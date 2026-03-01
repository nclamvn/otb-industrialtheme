'use client';
import { useEffect } from 'react';

/**
 * Hook that calls handler when a click occurs outside the referenced element.
 * @param {React.RefObject} ref - Ref to the element
 * @param {Function} handler - Callback when click outside
 * @param {boolean} active - Whether the listener is active (default: true)
 */
export function useClickOutside(ref, handler, active = true) {
  useEffect(() => {
    if (!active) return;

    const listener = (event) => {
      if (!ref.current || ref.current.contains(event.target)) return;
      handler(event);
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler, active]);
}

export default useClickOutside;
