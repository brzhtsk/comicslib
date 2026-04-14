// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  if (process.env.NODE_ENV === 'development') {
    console.error(err);
  }

  if (err.name === 'MulterError') {
    return res.status(400).json({ message: `Upload error: ${err.message}` });
  }

  if (err.code === 'P2002') {
    const field = err.meta?.target?.[0] || 'field';
    return res.status(409).json({ message: `${field} already exists` });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({ message: 'Record not found' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Token expired' });
  }

  if (err.status) {
    return res.status(err.status).json({ message: err.message });
  }

  res.status(500).json({
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
  });
}

export function createError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}
