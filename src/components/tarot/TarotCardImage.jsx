import React, { useState } from 'react';

/**
 * TarotCardImage - Hardened tarot card image with inline SVG fallback
 * PLAN A: /tarot/_fallback.webp
 * PLAN B: Inline SVG (zero dependency)
 */

const INLINE_FALLBACK_SVG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='500' viewBox='0 0 300 500'%3E%3Cdefs%3E%3ClinearGradient id='bg' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%231e293b'/%3E%3Cstop offset='100%25' style='stop-color:%230f172a'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='300' height='500' fill='url(%23bg)' stroke='%23f59e0b' stroke-width='3' rx='12'/%3E%3Cpath d='M150 180 L180 210 L150 240 L120 210 Z' fill='%23fbbf24' opacity='0.3'/%3E%3Ctext x='150' y='280' font-family='serif' font-size='20' fill='%23fef3c7' text-anchor='middle' font-weight='bold'%3EGRANDTAROT%3C/text%3E%3Ctext x='150' y='310' font-family='sans-serif' font-size='14' fill='%2394a3b8' text-anchor='middle'%3ETarot Card%3C/text%3E%3C/svg%3E";

export default function TarotCardImage({ src, alt, className = '' }) {
  const [imgSrc, setImgSrc] = useState(src || INLINE_FALLBACK_SVG);
  const [fallbackLevel, setFallbackLevel] = useState(0);

  const handleError = () => {
    if (fallbackLevel === 0) {
      // PLAN A: Try /tarot/_fallback.webp
      setFallbackLevel(1);
      setImgSrc('/tarot/_fallback.webp');
    } else if (fallbackLevel === 1) {
      // PLAN B: Use inline SVG (guaranteed to work)
      setFallbackLevel(2);
      setImgSrc(INLINE_FALLBACK_SVG);
    }
    // fallbackLevel 2 = final fallback, no more retries
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