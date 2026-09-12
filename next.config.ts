import type { NextConfig } from "next";

const demoV1 = Boolean(process.env.SANDBOX_DEMO_API_KEY);
// La key demo de curso 2 es propia: v2 rechaza con 403 cualquier key que no
// sea de ese curso. Si no está seteada, cae a la genérica (que solo sirve si
// esa key es, justamente, de curso 2).
const demoV2 = Boolean(process.env.SANDBOX_DEMO_API_KEY_V2 ?? process.env.SANDBOX_DEMO_API_KEY);

const nextConfig: NextConfig = {
  env: {
    // Flags públicos (sin secreto) derivados en build time: si el servidor
    // tiene key demo para un curso, el cliente lo sabe sin que la key misma
    // le llegue nunca — ver app/api/proxy y lib/auth/AuthGuard.
    NEXT_PUBLIC_DEMO_MODE: demoV1 || demoV2 ? "true" : "false",
    NEXT_PUBLIC_DEMO_MODE_V1: demoV1 ? "true" : "false",
    NEXT_PUBLIC_DEMO_MODE_V2: demoV2 ? "true" : "false",
  },
};

export default nextConfig;
