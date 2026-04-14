export function buildFileUrl(filePath) {
  if (!filePath) return null;
  const normalized = filePath.replace(/\\/g, '/');
  const base = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 3001}`;
  return `${base}/${normalized}`;
}

export function urlToPath(url) {
  if (!url) return null;
  const base = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 3001}`;
  return url.replace(`${base}/`, '');
}
