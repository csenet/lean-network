import { getAssetFromKV } from '@cloudflare/kv-asset-handler';
import manifestJSON from '__STATIC_CONTENT_MANIFEST';

const assetManifest = JSON.parse(manifestJSON);

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    try {
      // Serve static assets from the build directory
      const response = await getAssetFromKV(
        {
          request,
          waitUntil: ctx.waitUntil.bind(ctx),
        },
        {
          ASSET_NAMESPACE: env.__STATIC_CONTENT,
          ASSET_MANIFEST: assetManifest,
          // Custom cache settings
          cacheControl: {
            browserTTL: 60 * 60 * 24 * 365, // 1 year for hashed assets
            edgeTTL: 60 * 60 * 24 * 30, // 30 days edge cache
            bypassCache: false,
          },
        }
      );

      // Add security headers
      const headers = new Headers(response.headers);
      headers.set('X-Content-Type-Options', 'nosniff');
      headers.set('X-Frame-Options', 'DENY');
      headers.set('X-XSS-Protection', '1; mode=block');
      headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

      // Add CSP header for security
      headers.set(
        'Content-Security-Policy',
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
        "style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' data: https:; " +
        "font-src 'self' data:; " +
        "connect-src 'self' https:; " +
        "frame-ancestors 'none';"
      );

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    } catch (error) {
      // For 404s or missing assets, try to serve index.html for client-side routing
      if (error.status === 404) {
        try {
          const indexResponse = await getAssetFromKV(
            {
              request: new Request(new URL('/index.html', request.url).toString()),
              waitUntil: ctx.waitUntil.bind(ctx),
            },
            {
              ASSET_NAMESPACE: env.__STATIC_CONTENT,
              ASSET_MANIFEST: assetManifest,
            }
          );

          const headers = new Headers(indexResponse.headers);
          headers.set('Content-Type', 'text/html; charset=utf-8');

          return new Response(indexResponse.body, {
            status: 200,
            headers,
          });
        } catch (e) {
          // If index.html is also not found, return a proper 404
          return new Response('Not Found', { status: 404 });
        }
      }

      // For other errors, return appropriate response
      return new Response('Internal Server Error', { status: 500 });
    }
  },
};