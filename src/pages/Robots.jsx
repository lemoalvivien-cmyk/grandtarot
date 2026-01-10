import React, { useEffect } from 'react';

export default function Robots() {
  useEffect(() => {
    // Set content-type header via meta tag
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Type';
    meta.content = 'text/plain';
    document.head.appendChild(meta);
  }, []);

  const robots = `User-agent: *
Allow: /
Disallow: /app/*
Disallow: /admin/*
Disallow: /subscribe/*
Disallow: /chat/*

Sitemap: https://grandtarot.com/sitemap.xml`;

  return (
    <pre style={{ 
      margin: 0, 
      padding: 20, 
      fontFamily: 'monospace', 
      fontSize: 14,
      whiteSpace: 'pre',
      backgroundColor: '#f5f5f5',
      color: '#333'
    }}>
      {robots}
    </pre>
  );
}