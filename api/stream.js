const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);

export const config = {
  runtime: 'edge',
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
    // Remove strict origin check for direct URLs to allow redirects
    return u;
  }
  
  // Force .ts for live/series to match typical Xtream behavior, or keep standard logic
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
    
    // --- CRITICAL FIX START ---
    // 1. Mimic VLC Media Player exactly.
    // 2. REMOVE 'Referer' and 'Origin'. Sending these tells the server "I am a website".
    const headers = { 
      'User-Agent': 'VLC/3.0.20 LibVLC/3.0.20', 
      'Accept': '*/*',
      'Connection': 'keep-alive'
    };
    // --- CRITICAL FIX END ---

    if (req.headers.get('range')) {
      headers.Range = req.headers.get('range');
    }

    const upstream = await fetch(targetUrl.toString(), { 
      method: 'GET', 
      headers,
      redirect: 'follow' 
    });

    // If still blocked, return specific error
    if (upstream.status === 456 || upstream.status === 403) {
      console.error('Provider Blocked Request:', upstream.status);
      return new Response(JSON.stringify({ 
        error: 'Provider Blocked (456/403)', 
        details: 'The IPTV provider rejected the connection. They may be blocking Vercel IPs.' 
      }), { status: upstream.status });
    }

    const contentType = upstream.headers.get('content-type') || '';

    // M3U8 Rewriting (HLS)
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

    // Direct Stream Passthrough
    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        'Content-Type': contentType,
        'Content-Length': upstream.headers.get('content-length') || '',
        'Accept-Ranges': 'bytes',
        'Content-Range': upstream.headers.get('content-range') || '',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: 'Stream failed', message: error.message }), { status: 500 });
  }
}