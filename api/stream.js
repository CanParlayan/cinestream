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
    if (origin && u.origin !== origin) {
      throw new Error('Invalid direct URL origin');
    }
    return u;
  }

  const safeType = type === 'live' || type === 'series' ? type : 'movie';
  const safeExt = ext || (safeType === 'live' ? 'mp4' : 'm3u8');
  const safeId = String(id || '');
  if (!safeId) {
    throw new Error('Missing id');
  }

  return new URL(`/${safeType}/${encodeURIComponent(username)}/${encodeURIComponent(password)}/${encodeURIComponent(safeId)}.mp4`, base.origin);
}

function toProxyUrl(req, baseParams, line) {
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
      return new Response(JSON.stringify({ error: 'Missing params' }), { status: 400 });
    }

    const targetUrl = buildTargetUrl({ serverUrl, username, password, type, id, ext, directUrl, origin });
    
    const headers = { 
      'Accept': '*/*',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36...',
      'Referer': serverUrl,
      'Origin': new URL(serverUrl).origin
    };

    if (req.headers.get('range')) {
      headers.Range = req.headers.get('range');
    }

    const upstream = await fetch(targetUrl.toString(), { 
      method: 'GET', 
      headers,
      redirect: 'follow' 
    });

    // For M3U8 rewriting
    const contentType = upstream.headers.get('content-type') || '';
    if (contentType.includes('mpegurl') || targetUrl.pathname.endsWith('.m3u8')) {
      const text = await upstream.text();
      const rewritten = text.split('\n').map(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return line;
        // Re-use your toProxyUrl logic here, adjusted for URL objects
        return toProxyUrl(req, { serverUrl, username, password, origin: targetUrl.origin, targetUrl, basePath: '/api/stream' }, trimmed);
      }).join('\n');

      return new Response(rewritten, {
        status: upstream.status,
        headers: { 'Content-Type': 'application/vnd.apple.mpegurl' }
      });
    }

    // Direct stream passthrough
    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        'Content-Type': upstream.headers.get('content-type'),
        'Content-Length': upstream.headers.get('content-length'),
        'Accept-Ranges': 'bytes',
      }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
