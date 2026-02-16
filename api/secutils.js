const FORBIDDEN_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '169.254.169.254']);

export function validateUrl(urlStr) {
  const url = new URL(urlStr);
  if (FORBIDDEN_HOSTS.has(url.hostname)) {
    throw new Error('Forbidden host');
  }
  // Ek kontroller falan girebilir.
  return url;
}