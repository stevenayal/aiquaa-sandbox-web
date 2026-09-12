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

/**
 * Cohorte/versión de la API a la que pertenece un request. Curso 1 pega a
 * `/api/v1/**`, curso 2 a `/api/v2/**`, y el backend las aísla por API key:
 * `public.api_keys.curso` marca a qué curso pertenece cada key y las rutas de
 * v2 rechazan con `403` cualquier key que no sea de curso 2 (ver
 * `lib/api-route.ts` en aiquaa-sandbox-api). Por eso una sola key en
 * localStorage no alcanza: se guarda una por versión.
 */
export type ApiVersion = 1 | 2;

export const API_KEY_STORAGE_KEY = "sandbox:apiKey";
export const API_KEY_V2_STORAGE_KEY = "sandbox:apiKeyV2";
export const UNAUTHORIZED_EVENT = "sandbox:unauthorized";

/** Detalle del evento `sandbox:unauthorized`: qué versión quedó sin key válida. */
export interface UnauthorizedEventDetail {
  version: ApiVersion;
}

/** `v2/cuentas` → 2; `cuentas`, `roles`, `auth/login` → 1. */
export function apiVersionOf(path: string): ApiVersion {
  return /^\/*v2(\/|$)/.test(path) ? 2 : 1;
}

function storageKeyFor(version: ApiVersion): string {
  return version === 2 ? API_KEY_V2_STORAGE_KEY : API_KEY_STORAGE_KEY;
}

export function getStoredApiKey(version: ApiVersion = 1): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(storageKeyFor(version));
}

export function setStoredApiKey(key: string, version: ApiVersion = 1): void {
  window.localStorage.setItem(storageKeyFor(version), key);
}

/** Sin `version`, limpia las dos (logout). */
export function clearStoredApiKey(version?: ApiVersion): void {
  if (version === undefined) {
    window.localStorage.removeItem(API_KEY_STORAGE_KEY);
    window.localStorage.removeItem(API_KEY_V2_STORAGE_KEY);
    return;
  }
  window.localStorage.removeItem(storageKeyFor(version));
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

function parseEnvelope<T>(text: string): Partial<SuccessEnvelope<T> & ErrorEnvelope> {
  try {
    return text ? (JSON.parse(text) as Partial<SuccessEnvelope<T> & ErrorEnvelope>) : {};
  } catch {
    // El proxy puede devolver HTML (404 de Next, error de gateway) — no hay
    // envelope que desempaquetar, el status manda.
    return {};
  }
}

function errorFrom(json: Partial<ErrorEnvelope>, status: number): ApiError {
  const error = json.error;
  return new ApiError(
    error?.code ?? "INTERNAL_ERROR",
    error?.message ?? "Error inesperado.",
    status,
    error?.details,
  );
}

/** Request crudo con una key explícita, sin tocar localStorage ni contexto. */
async function probe(path: string, key: string): Promise<{ status: number; json: Partial<ErrorEnvelope> }> {
  const res = await fetch(buildUrl(path), {
    headers: { "content-type": "application/json", "x-api-key": key },
  });
  return { status: res.status, json: parseEnvelope(await res.text()) };
}

/**
 * Confirma que una key es válida y descubre a qué curso pertenece, sin tocar
 * localStorage/contexto — se usa en /login antes de comprometerse a la key,
 * para que AuthGuard no reaccione (y redirija) sobre una key todavía no
 * validada.
 *
 * El sondeo arranca por v2 a propósito: las rutas de v1 aceptan cualquier key
 * válida (sin importar el curso), así que preguntarles primero no distingue
 * nada. Las de v2, en cambio, responden `403` a una key de curso 1 — ese es el
 * único chequeo que discrimina.
 */
export async function detectApiKeyVersion(key: string): Promise<ApiVersion> {
  const v2 = await probe("v2/usuarios", key);
  if (v2.status === 200) return 2;
  // 401 = key inválida/inactiva: no hay nada más que probar.
  if (v2.status === 401) throw errorFrom(v2.json, v2.status);
  // 403 = key válida de otro curso; 404 = backend sin /api/v2 desplegado.
  // Cualquier otro status (500, 502) también cae a v1: si la key sirve ahí,
  // el alumno puede trabajar igual.
  const v1 = await probe("roles", key);
  if (v1.status !== 200) throw errorFrom(v1.json, v1.status);
  return 1;
}

/**
 * Cliente HTTP central: pega a /api/proxy/{path} (nunca al backend directo),
 * adjunta la x-api-key de la versión que corresponde al path (v1 o v2) desde
 * localStorage, y desempaqueta {data}/{error}.
 */
export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { method = "GET", body, query } = options;

  const version = apiVersionOf(path);
  // Las rutas de v1 aceptan cualquier key válida (el backend solo filtra por
  // curso en v2), así que un alumno de curso 2 —que solo tiene key de curso
  // 2— puede igual usar los endpoints comunes: /roster, /auth/login. Al
  // revés no: una key de curso 1 en v2 devuelve 403.
  const keyVersion: ApiVersion = version === 1 && !getStoredApiKey(1) ? 2 : version;
  const headers: Record<string, string> = { "content-type": "application/json" };
  const apiKey = getStoredApiKey(keyVersion);
  if (apiKey) headers["x-api-key"] = apiKey;

  const hasBody = method !== "GET" && method !== "DELETE";

  const res = await fetch(buildUrl(path, query), {
    method,
    headers,
    body: hasBody ? JSON.stringify(body ?? {}) : undefined,
  });

  const text = await res.text();
  const json = parseEnvelope<T>(text);

  if (!res.ok) {
    if (res.status === 401) {
      // Solo se cae la capa 1 de ESA versión: un 401 en v2 no tiene por qué
      // desloguear a quien está trabajando en los módulos del curso 1.
      window.dispatchEvent(
        new CustomEvent<UnauthorizedEventDetail>(UNAUTHORIZED_EVENT, {
          detail: { version: keyVersion },
        }),
      );
    }
    throw errorFrom(json, res.status);
  }

  return json.data as T;
}
