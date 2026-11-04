export class ApiError extends Error {
  status: number;
  code: string;

  constructor(message: string, status: number, code = 'REQUEST_ERROR') {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(`/api${path}`, {
    method: options.method || 'GET',
    credentials: 'same-origin',
    headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
    body: options.body ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
  });

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json() : null;

  if (!response.ok) {
    if (response.status === 401 && !path.startsWith('/auth/')) {
      window.dispatchEvent(new CustomEvent('campuscode:unauthorized'));
    }
    throw new ApiError(
      payload?.error || 'No fue posible completar la solicitud.',
      response.status,
      payload?.code || 'REQUEST_ERROR',
    );
  }
  return payload as T;
}

export const api = {
  get<T>(path: string, params?: Record<string, string | number | boolean | null | undefined>, signal?: AbortSignal) {
    let query = '';
    if (params) {
      const search = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== '') search.set(key, String(value));
      }
      const serialized = search.toString();
      if (serialized) query = `?${serialized}`;
    }
    return request<T>(`${path}${query}`, { signal });
  },
  post<T>(path: string, body?: unknown) {
    return request<T>(path, { method: 'POST', body });
  },
  patch<T>(path: string, body?: unknown) {
    return request<T>(path, { method: 'PATCH', body });
  },
  delete<T>(path: string, body?: unknown) {
    return request<T>(path, { method: 'DELETE', body });
  },
};
