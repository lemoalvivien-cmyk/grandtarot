import React from 'react';
import { Turnstile } from '@marsidev/react-turnstile';

/**
 * Cloudflare Turnstile Widget
 * NOTE: Requires TURNSTILE_SITE_KEY to be set in app secrets
 * Get your site key at: https://dash.cloudflare.com/?to=/:account/turnstile
 */
export default function TurnstileWidget({ onVerify, onError, lang = 'fr' }) {
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'; // Test key
  
  return (
    <div className="flex justify-center my-4">
      <Turnstile
        siteKey={siteKey}
        onSuccess={onVerify}
        onError={onError}
        onExpire={() => onError && onError('Token expired')}
        options={{
          theme: 'dark',
          language: lang,
          size: 'normal'
        }}
      />
    </div>
  );
}