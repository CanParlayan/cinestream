const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);

export const config = {
  runtime: 'edge',
};

function sanitizeBase(serverUrl) {
  // 1. URL'i parse et
  let parsed;
  try {
    parsed = new URL(serverUrl);
  } catch (e) {
    throw new Error('Invalid serverUrl');
  }

  // 2. DOMAIN DÜZELTME (Fix):
  // Eğer istek 'proazure.org' ise, bunu 'playerim123.xyz' ile değiştir.
  // Kullanıcının manuel örneğindeki Host başlığını yakalamak için.
  if (parsed.hostname.includes('proazure.org')) {
    parsed.hostname = 'playerim123.xyz';
    parsed.port = '8080'; // Port genellikle aynıdır ama garanti olsun
  }

  if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
    throw new Error('Invalid protocol');
  }
  return parsed;
}

function buildTargetUrl({ serverUrl, username, password, type, id, ext, directUrl, origin }) {
  const base = sanitizeBase(serverUrl);
  
  if (directUrl) {
    const u = new URL(directUrl);
    // Direct URL içinde de domain düzeltmesi yapalım
    if (u.hostname.includes('proazure.org')) {
      u.hostname = 'playerim123.xyz';
      u.port = '8080';
    }
    return u;
  }
  
  const safeType = type === 'live' || type === 'series' ? type : 'movie';
  const safeExt = ext || (safeType === 'live' ? 'ts' : 'mp4'); 
  const safeId = String(id || '');
  
  if (!safeId) throw new Error('Missing id');

  return new URL(`/${safeType}/${encodeURIComponent(username)}/${encodeURIComponent(password)}/${encodeURIComponent(safeId)}.${safeExt}`, base.origin);
}

// M3U8 dosyalarındaki linkleri proxy'ye çeviren fonksiyon
function toProxyUrl(reqUrl, baseParams, line) {
  const resolved = new URL(line, baseParams.targetUrl).toString();
  const p = new URLSearchParams({
    serverUrl: baseParams.serverUrl, // Orijinal URL'i parametre olarak sakla
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

    // Hedef URL'i oluştur (Domain swap burada yapılır)
    const targetUrl = buildTargetUrl({ serverUrl, username, password, type, id, ext, directUrl, origin });
    
    // --- USER REQUESTED HEADERS ---
    // Senin gönderdiğin örneğe birebir uyan başlıklar + Domain Swap
    const headers = { 
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
      'Accept': '*/*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': 'http://my.splayer.in/', 
      'Connection': 'keep-alive',
      // 'Host' başlığı fetch tarafından targetUrl'e (playerim123.xyz) göre otomatik ayarlanır.
    };

    if (req.headers.get('range')) {
      headers.Range = req.headers.get('range');
    }

    console.log(`Proxying to: ${targetUrl.toString()}`); // Loglarda yeni domaini görmek için

    const upstream = await fetch(targetUrl.toString(), { 
      method: 'GET', 
      headers,
      redirect: 'follow' 
    });

    if (upstream.status === 456 || upstream.status === 403) {
      console.error('Provider Blocked Request:', upstream.status);
      return new Response(JSON.stringify({ 
        error: `Provider Blocked (${upstream.status})`, 
        details: 'IP Blocking active or Referer trick failed.' 
      }), { status: upstream.status });
    }

    const contentType = upstream.headers.get('content-type') || '';

    // M3U8 Rewriting
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