const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);

export const config = {
  runtime: 'edge', // Keep Edge runtime for performance
};

function sanitizeBase(serverUrl) {
  const parsed = new URL(serverUrl);
  if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
    throw new Error('Invalid protocol');
  }
  return parsed;
}

function buildTargetUrl({ serverUrl, username, password, type, id, ext, directUrl, origin }) {
  const base = sanitizeBase(serverUrl);
  if (directUrl) {
    const u = new URL(directUrl);
    if (origin && u.origin !== origin) throw new Error('Invalid direct URL origin');
    return u;
  }
  const safeType = type === 'live' || type === 'series' ? type : 'movie';
  const safeExt = ext || (safeType === 'live' ? 'ts' : 'mp4');
  const safeId = String(id || '');
  if (!safeId) throw new Error('Missing id');

  return new URL(`/${safeType}/${encodeURIComponent(username)}/${encodeURIComponent(password)}/${encodeURIComponent(safeId)}.${safeExt}`, base.origin);
}

function toProxyUrl(reqUrl, baseParams, line) {
  const resolved = new URL(line, baseParams.targetUrl).toString();
  const p = new URLSearchParams({
    serverUrl: baseParams.serverUrl,
    username: baseParams.username,
    password: baseParams.password,
    directUrl: resolved,
    origin: baseParams.origin,
  });
  return `${baseParams.basePath}?${p.toString()}`;
}

export default async function handler(req) {
  try {
    const { searchParams } = new URL(req.url);
    const serverUrl = searchParams.get('serverUrl');
    const username = searchParams.get('username');
    const password = searchParams.get('password');
    const type = searchParams.get('type');
    const id = searchParams.get('id');
    const ext = searchParams.get('ext');
    const directUrl = searchParams.get('directUrl');
    const origin = searchParams.get('origin');

    if (!serverUrl || !username || !password) {
      return new Response(JSON.stringify({ error: 'Missing required query params' }), { status: 400 });
    }

    const targetUrl = buildTargetUrl({ serverUrl, username, password, type, id, ext, directUrl, origin });
    
    // UPDATED HEADERS: Mimic a real VLC/Player request to avoid 456 errors
    const headers = { 
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': '*/*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': `${new URL(serverUrl).origin}/`,
      'Origin': new URL(serverUrl).origin
    };

    // Forward the Range header for seeking in mp4 files
    const range = req.headers.get('range');
    if (range) {
      headers['Range'] = range;
    }

    const upstream = await fetch(targetUrl.toString(), { 
      method: 'GET', 
      headers,
      redirect: 'follow' 
    });

    if (upstream.status === 456) {
      return new Response(JSON.stringify({ error: 'Provider blocked request (456)' }), { status: 456 });
    }

    const contentType = upstream.headers.get('content-type') || '';

    // Handle M3U8 Rewriting for Edge
    if (contentType.includes('mpegurl') || targetUrl.pathname.endsWith('.m3u8')) {
      const text = await upstream.text();
      const baseParams = {
        serverUrl, username, password,
        origin: targetUrl.origin,
        targetUrl: targetUrl.toString(),
        basePath: '/api/stream',
      };

      const rewritten = text.split('\n').map(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return line;
        return toProxyUrl(req.url, baseParams, trimmed);
      }).join('\n');

      return new Response(rewritten, {
        headers: { 
          'Content-Type': 'application/vnd.apple.mpegurl',
          'Access-Control-Allow-Origin': '*' 
        }
      });
    }

    // Direct Stream Passthrough (Edge handles ReadableStream automatically)
    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        'Content-Type': contentType,
        'Content-Length': upstream.headers.get('content-length') || '',
        'Accept-Ranges': 'bytes',
        'Content-Range': upstream.headers.get('content-range') || '',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: 'Stream failed', message: error.message }), { status: 500 });
  }
}