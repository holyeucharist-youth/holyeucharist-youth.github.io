export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message?: string) {
    super(message ?? code);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

const BASE = import.meta.env.VITE_API_BASE_URL as string;

let refreshing: Promise<void> | null = null;

async function refresh(): Promise<void> {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    const rt = localStorage.getItem('att_refresh');
    if (!rt) throw new ApiError(401, 'no_refresh');
    const r = await fetch(`${BASE}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: rt }),
    });
    if (!r.ok) throw new ApiError(r.status, 'refresh_failed');
    const j = await r.json();
    localStorage.setItem('att_access', j.access);
    localStorage.setItem('att_refresh', j.refresh);
    localStorage.setItem('att_user', JSON.stringify(j.user));
  })().finally(() => {
    refreshing = null;
  });
  return refreshing;
}

export async function api<T = unknown>(
  path: string,
  init: RequestInit = {},
  _retry = false,
): Promise<T> {
  const token = localStorage.getItem('att_access');
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });

  if (res.status === 401 && !_retry) {
    // No refresh token means this is a genuine auth failure (e.g. login itself),
    // not an expired access token — surface the real backend error.
    const hasRefresh = !!localStorage.getItem('att_refresh');
    if (!hasRefresh) {
      const body = await res.json().catch(() => ({})) as { error?: string; message?: string };
      throw new ApiError(res.status, body.error ?? 'unauthorized', body.message);
    }
    try {
      await refresh();
      return api<T>(path, init, true);
    } catch {
      localStorage.clear();
      window.location.href = '/login';
      throw new ApiError(401, 'unauthorized');
    }
  }

  const ct = res.headers.get('content-type') ?? '';
  if (!ct.includes('application/json')) return res as unknown as T;

  const body = await res.json();
  if (!res.ok) throw new ApiError(res.status, body.error ?? 'error', body.message);
  return body as T;
}
