export const PAGE_SIZE = 10;

export function parsePage(value: string | undefined): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 1;
}

export function paginate(page: number, pageSize: number = PAGE_SIZE) {
  return { skip: (page - 1) * pageSize, take: pageSize };
}

export function totalPages(count: number, pageSize: number = PAGE_SIZE) {
  return Math.max(1, Math.ceil(count / pageSize));
}
