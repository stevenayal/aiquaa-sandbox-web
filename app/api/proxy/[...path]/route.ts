export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FORWARDED_RESPONSE_HEADERS = [
  "retry-after",
  "x-ratelimit-limit",
  "x-ratelimit-remaining",
  "x-ratelimit-reset",
] as const;

type RouteContext = { params: Promise<{ path: string[] }> };

async function handler(request: Request, context: RouteContext): Promise<Response> {
  const baseUrl = process.env.SANDBOX_API_BASE_URL;
  if (!baseUrl) {
    return Response.json(
      { error: { code: "INTERNAL_ERROR", message: "SANDBOX_API_BASE_URL no está configurada." } },
      { status: 500 },
    );
  }

  const { path } = await context.params;
  const { search } = new URL(request.url);
  const targetUrl = `${baseUrl}/api/v1/${path.join("/")}${search}`;

  const outgoingHeaders = new Headers({ "content-type": "application/json" });
  // La key del alumno (localStorage) manda si está; si no, cae a la key demo
  // del servidor (SANDBOX_DEMO_API_KEY) — nunca vive en el bundle del
  // cliente, solo la ve este proxy server-side.
  const apiKey = request.headers.get("x-api-key") || process.env.SANDBOX_DEMO_API_KEY;
  if (apiKey) outgoingHeaders.set("x-api-key", apiKey);

  const hasBody = request.method !== "GET" && request.method !== "DELETE";
  const body = hasBody ? await request.text() : undefined;

  let upstream: Response;
  try {
    upstream = await fetch(targetUrl, {
      method: request.method,
      headers: outgoingHeaders,
      body,
      cache: "no-store",
    });
  } catch (e) {
    console.error("[proxy] fetch failed", targetUrl, e);
    return Response.json(
      { error: { code: "INTERNAL_ERROR", message: "No se pudo contactar al backend." } },
      { status: 502 },
    );
  }

  const text = await upstream.text();

  const responseHeaders = new Headers({
    "content-type": upstream.headers.get("content-type") ?? "application/json",
  });
  for (const header of FORWARDED_RESPONSE_HEADERS) {
    const value = upstream.headers.get(header);
    if (value) responseHeaders.set(header, value);
  }

  return new Response(text, { status: upstream.status, headers: responseHeaders });
}

export { handler as GET, handler as POST, handler as PATCH, handler as DELETE };
