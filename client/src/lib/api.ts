export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: { path: string; message: string }[],
  ) {
    super(message);
  }
}

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export async function api<T = unknown>(path: string, opts: { method?: Method; body?: unknown; signal?: AbortSignal } = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method: opts.method ?? 'GET',
      credentials: 'same-origin',
      headers: opts.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: opts.signal,
    });
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e;
    throw new ApiError(0, 'Կապի խնդիր։ Ստուգեք ինտերնետ կապը և փորձեք կրկին։');
  }
  const data = res.headers.get('content-type')?.includes('json') ? await res.json() : null;
  if (!res.ok) throw new ApiError(res.status, data?.error ?? 'Սխալ տեղի ունեցավ', data?.details);
  return data as T;
}

/** Multipart upload with progress (fetch has no upload progress). */
export function upload<T = unknown>(path: string, form: FormData, onProgress?: (pct: number) => void, signal?: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `/api${path}`);
    xhr.withCredentials = true;
    xhr.responseType = 'json';
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve(xhr.response as T);
      else reject(new ApiError(xhr.status, xhr.response?.error ?? (xhr.status === 413 ? 'Ֆայլը չափազանց մեծ է' : 'Վերբեռնումը ձախողվեց')));
    };
    xhr.onerror = () => reject(new ApiError(0, 'Կապի խնդիր վերբեռնման ժամանակ'));
    xhr.onabort = () => reject(new ApiError(0, 'Վերբեռնումը չեղարկվեց'));
    signal?.addEventListener('abort', () => xhr.abort());
    xhr.send(form);
  });
}

export const errorMessage = (e: unknown) => (e instanceof Error ? e.message : 'Սխալ տեղի ունեցավ');
