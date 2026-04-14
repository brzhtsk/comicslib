export function getPagination(page = 1, size = 12) {
  const p = Math.max(1, parseInt(page));
  const s = Math.min(100, Math.max(1, parseInt(size)));

  return { skip: (p - 1) * s, take: s, page: p, size: s };
}

export function buildPaginationMeta(total, page, size) {
  return {
    total,
    page,
    size,
    totalPages: Math.ceil(total / size),
    hasNext: page * size < total,
    hasPrev: page > 1,
  };
}
