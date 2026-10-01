import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { SiteData } from '@/lib/types';

export function usePublic<T>(path: string, opts: Partial<UseQueryOptions<T>> = {}) {
  return useQuery<T>({ queryKey: ['public', path], queryFn: ({ signal }) => api<T>(`/public${path}`, { signal }), ...opts });
}

export const useSite = () => usePublic<SiteData>('/site', { staleTime: 60_000 });
