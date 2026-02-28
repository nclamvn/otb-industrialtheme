'use client';
import { useState } from 'react';
import ProductPlaceholder from './ProductPlaceholder';

export default function ProductImage({
  src,
  alt = '',
  category,
  width = 80,
  height = 80,
  className = '',
}) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div
        className={`flex items-center justify-center rounded-lg bg-[#FAF8F5] overflow-hidden ${className}`}
        style={{ width, height }}
      >
        <ProductPlaceholder type={category} size={Math.min(width, height) * 0.7} />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      onError={() => setHasError(true)}
      className={`rounded-lg object-cover ${className}`}
      style={{ width, height }}
    />
  );
}
