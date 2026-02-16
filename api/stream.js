const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);

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
  const safeExt = ext || (safeType === 'live' ? 'm3u8' : 'mp4');
  const safeId = String(id || '');
  if (!safeId) {
    throw new Error('Missing id');
  }

  return new URL(`/${safeType}/${encodeURIComponent(username)}/${encodeURIComponent(password)}/${encodeURIComponent(safeId)}.${encodeURIComponent(safeExt)}`, base.origin);
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

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  try {
    const {
      serverUrl,
      username,
      password,
      type,
      id,
      ext,
      directUrl,
      origin,
    } = req.query || {};

    if (!serverUrl || !username || !password) {
      res.status(400).json({ error: 'Missing required query params: serverUrl, username, password' });
      return;
    }

    const targetUrl = buildTargetUrl({ serverUrl, username, password, type, id, ext, directUrl, origin });
    const headers = { Accept: '*/*' };
    if (req.headers.range) {
      headers.Range = req.headers.range;
    }

    const upstream = await fetch(targetUrl.toString(), { method: 'GET', headers });
    const contentType = upstream.headers.get('content-type') || '';

    if (contentType.includes('application/vnd.apple.mpegurl') || contentType.includes('application/x-mpegurl') || targetUrl.pathname.endsWith('.m3u8')) {
      const text = await upstream.text();
      const basePath = '/api/stream';
      const baseParams = {
        serverUrl,
        username,
        password,
        origin: targetUrl.origin,
        targetUrl,
        basePath,
      };

      const rewritten = text
        .split('\n')
        .map((line) => {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) return line;
          return toProxyUrl(req, baseParams, trimmed);
        })
        .join('\n');

      res.status(upstream.status);
      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store');
      res.send(rewritten);
      return;
    }

    res.status(upstream.status);
    const passthroughHeaders = [
      'content-type',
      'content-length',
      'accept-ranges',
      'content-range',
      'cache-control',
    ];

    passthroughHeaders.forEach((h) => {
      const v = upstream.headers.get(h);
      if (v) {
        res.setHeader(h, v);
      }
    });

    if (!upstream.body) {
      res.end();
      return;
    }

    const reader = upstream.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(Buffer.from(value));
    }
    res.end();
  } catch (error) {
    res.status(500).json({ error: 'Stream proxy failed', message: error?.message || 'Unknown error' });
  }
}
