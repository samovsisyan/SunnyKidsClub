import { useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import { useCallback } from 'react';
import { api, ApiError, upload } from '@/lib/api';
import { useAuth } from './store/auth';
import { toast } from './store/ui';

const handle401 = (e: unknown) => {
  if (e instanceof ApiError && e.status === 401) useAuth.getState().expire();
  throw e;
};

export const adminApi = <T,>(path: string, opts?: Parameters<typeof api>[1]) => api<T>(`/admin${path}`, opts).catch(handle401);
export const adminUpload = <T,>(path: string, form: FormData, onProgress?: (p: number) => void, signal?: AbortSignal) =>
  upload<T>(`/admin${path}`, form, onProgress, signal).catch(handle401);

export function useAdmin<T>(path: string, opts: Partial<UseQueryOptions<T>> = {}) {
  return useQuery<T>({ queryKey: ['admin', path], queryFn: () => adminApi<T>(path), staleTime: 0, ...opts });
}

/** Refresh admin + public caches after a change so the website shows it immediately. */
export function useRefresh() {
  const qc = useQueryClient();
  return useCallback(() => {
    qc.invalidateQueries({ queryKey: ['admin'] });
    qc.invalidateQueries({ queryKey: ['public'] });
  }, [qc]);
}

/** Runs a mutation with success / error toasts. Returns the result or undefined on error. */
export function useAction() {
  const refresh = useRefresh();
  return useCallback(
    async <T,>(fn: () => Promise<T>, success?: string): Promise<T | undefined> => {
      try {
        const r = await fn();
        if (success) toast.success(success);
        refresh();
        return r;
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Սխալ տեղի ունեցավ');
        return undefined;
      }
    },
    [refresh],
  );
}
