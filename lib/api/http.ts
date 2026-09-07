export type ApiErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "RATE_LIMITED"
  | "VALIDATION_ERROR"
  | "EXECUTION_ERROR"
  | "NOT_FOUND"
  | "CONFLICT"
  | "INTERNAL_ERROR";

export class ApiError extends Error {
  code: ApiErrorCode;
  status: number;
  details?: unknown;

  constructor(code: ApiErrorCode, message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export const API_KEY_STORAGE_KEY = "sandbox:apiKey";
export const UNAUTHORIZED_EVENT = "sandbox:unauthorized";

export function getStoredApiKey(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(API_KEY_STORAGE_KEY);
}

export function setStoredApiKey(key: string): void {
  window.localStorage.setItem(API_KEY_STORAGE_KEY, key);
}

export function clearStoredApiKey(): void {
  window.localStorage.removeItem(API_KEY_STORAGE_KEY);
}

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface ApiRequestOptions {
  method?: Method;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
}

function buildUrl(path: string, query?: ApiRequestOptions["query"]): string {
  const url = new URL(`/api/proxy/${path.replace(/^\/+/, "")}`, window.location.origin);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

interface SuccessEnvelope<T> {
  data: T;
}

interface ErrorEnvelope {
  error: { code: ApiErrorCode; message: string; details?: unknown };
}

/**
 * Confirma que una key es válida sin tocar localStorage/contexto — se usa en
 * /login antes de comprometerse a la key, para que AuthGuard no reaccione
 * (y redirija) sobre una key todavía no validada.
 */
export async function validateApiKey(key: string): Promise<void> {
  const res = await fetch(buildUrl("roles"), {
    headers: { "content-type": "application/json", "x-api-key": key },
  });
  const text = await res.text();
  const json = (text ? JSON.parse(text) : {}) as Partial<ErrorEnvelope>;
  if (!res.ok) {
    const error = json.error;
    throw new ApiError(
      error?.code ?? "INTERNAL_ERROR",
      error?.message ?? "Error inesperado.",
      res.status,
      error?.details,
    );
  }
}

/**
 * Cliente HTTP central: pega a /api/proxy/{path} (nunca al backend directo),
 * adjunta x-api-key desde localStorage, y desempaqueta {data}/{error}.
 */
export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { method = "GET", body, query } = options;

  const headers: Record<string, string> = { "content-type": "application/json" };
  const apiKey = getStoredApiKey();
  if (apiKey) headers["x-api-key"] = apiKey;

  const hasBody = method !== "GET" && method !== "DELETE";

  const res = await fetch(buildUrl(path, query), {
    method,
    headers,
    body: hasBody ? JSON.stringify(body ?? {}) : undefined,
  });

  const text = await res.text();
  const json = (text ? JSON.parse(text) : {}) as Partial<SuccessEnvelope<T> & ErrorEnvelope>;

  if (!res.ok) {
    if (res.status === 401) {
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    const error = json.error;
    throw new ApiError(
      error?.code ?? "INTERNAL_ERROR",
      error?.message ?? "Error inesperado.",
      res.status,
      error?.details,
    );
  }

  return json.data as T;
}
