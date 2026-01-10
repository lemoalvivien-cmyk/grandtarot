import React, { useEffect } from 'react';

export default function Sitemap() {
  useEffect(() => {
    // Set content-type header via meta tag
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Type';
    meta.content = 'application/xml';
    document.head.appendChild(meta);
  }, []);

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://grandtarot.com/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://grandtarot.com/carte-du-jour</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://grandtarot.com/encyclopedie</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://grandtarot.com/blog</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://grandtarot.com/tarifs</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://grandtarot.com/cgu</loc>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>https://grandtarot.com/confidentialite</loc>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>https://grandtarot.com/cookies</loc>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
</urlset>`;

  return (
    <pre style={{ 
      margin: 0, 
      padding: 20, 
      fontFamily: 'monospace', 
      fontSize: 12,
      whiteSpace: 'pre-wrap',
      backgroundColor: '#f5f5f5',
      color: '#333'
    }}>
      {sitemap}
    </pre>
  );
}