'use client';

import { useCallback, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

function parseSmartInput(input) {
  if (!input || typeof input !== 'string') return null;
  const cleaned = input.toLowerCase().trim().replace(/,/g, '.');

  const patterns = [
    { regex: /^(-?[\d.]+)\s*(t|ty|tỷ|b)$/i, multiplier: 1_000_000_000 },
    { regex: /^(-?[\d.]+)\s*(tr|trieu|triệu|m)$/i, multiplier: 1_000_000 },
    { regex: /^(-?[\d.]+)\s*(k|ng|nghin|nghìn)$/i, multiplier: 1_000 },
    { regex: /^(-?[\d.]+)\s*(đ|d|vnd)?$/i, multiplier: 1 },
  ];

  for (const { regex, multiplier } of patterns) {
    const match = cleaned.match(regex);
    if (match) {
      const num = parseFloat(match[1]);
      if (!isNaN(num)) return num * multiplier;
    }
  }

  if (/^\d{1,3}(\.\d{3})+$/.test(cleaned)) {
    const num = parseFloat(cleaned.replace(/\./g, ''));
    return isNaN(num) ? null : num;
  }

  return null;
}

export function useClipboardPaste(onPasteValues, enabled = true) {
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  const handlePaste = useCallback((e) => {
    if (!enabledRef.current) return;
    const active = document.activeElement;
    if (!active || !active.hasAttribute('data-alloc-cell')) return;

    const text = e.clipboardData?.getData('text');
    if (!text) return;

    const rawValues = [];
    text.split(/[\n\r]+/).forEach((line) => {
      line.split(/\t/).forEach((cell) => {
        const trimmed = cell.trim();
        if (trimmed) rawValues.push(trimmed);
      });
    });

    if (rawValues.length <= 1) return;
    e.preventDefault();

    const cells = Array.from(document.querySelectorAll('[data-alloc-cell]'));
    const startIdx = cells.indexOf(active);
    if (startIdx < 0) return;

    const parsed = rawValues.map((raw) => {
      const val = parseSmartInput(raw);
      return val !== null ? val : 0;
    });

    onPasteValues(startIdx, parsed);
    toast.success(`Pasted ${parsed.length} values`);
  }, [onPasteValues]);

  useEffect(() => {
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [handlePaste]);
}

export default useClipboardPaste;
