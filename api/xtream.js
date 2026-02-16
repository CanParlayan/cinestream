const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  try {
    const { serverUrl, username, password, action, ...rest } = req.query || {};

    if (!serverUrl || !username || !password) {
      res.status(400).json({ error: 'Missing required query params: serverUrl, username, password' });
      return;
    }

    let parsed;
    try {
      parsed = new URL(serverUrl);
    } catch {
      res.status(400).json({ error: 'Invalid serverUrl' });
      return;
    }

    if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
      res.status(400).json({ error: 'Only http/https serverUrl is allowed' });
      return;
    }

    const target = new URL('/player_api.php', parsed.origin);
    target.searchParams.set('username', String(username));
    target.searchParams.set('password', String(password));
    if (action) {
      target.searchParams.set('action', String(action));
    }

    Object.entries(rest).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      target.searchParams.set(key, String(value));
    });

    const response = await fetch(target.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    const text = await response.text();
    res.setHeader('Cache-Control', 'no-store');
    res.status(response.status);

    try {
      const json = JSON.parse(text);
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.json(json);
    } catch {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.send(text);
    }
  } catch (error) {
    res.status(500).json({ error: 'Proxy request failed', message: error?.message || 'Unknown error' });
  }
}
