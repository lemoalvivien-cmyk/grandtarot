import React, { useState } from 'react';

/**
 * TarotCardImage - Robust image component for tarot cards
 * Features:
 * - Lazy loading + async decoding
 * - Automatic fallback on error
 * - Empty src handling
 */
export default function TarotCardImage({ src, alt, className = '' }) {
  const [imgSrc, setImgSrc] = useState(src || '/tarot/_fallback.webp');
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImgSrc('/tarot/_fallback.webp');
    }
  };

  return (
    <img
      src={imgSrc}
      alt={alt || 'Tarot card'}
      className={className}
      onError={handleError}
      loading="lazy"
      decoding="async"
      style={{ objectFit: 'contain' }}
    />
  );
}