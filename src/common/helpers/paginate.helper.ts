export function paginate<T>(
  data: T[],
  page: number = 1,
  limit: number = 10,
): { data: T[]; total: number; page: number; limit: number } {
  const total = data.length;
  const start = (page - 1) * limit;
  const end = start + limit;
  return { data: data.slice(start, end), total, page, limit };
}

export function sortData<T>(
  data: T[],
  sortBy?: string,
  order: 'asc' | 'desc' = 'asc',
): T[] {
  if (!sortBy) return data;
  return [...data].sort((a, b) => {
    const aVal = (a as any)[sortBy];
    const bVal = (b as any)[sortBy];
    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });
}
