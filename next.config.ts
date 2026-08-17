import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    // Flag público (sin secreto) derivado en build time: si el servidor
    // tiene una key demo configurada, el cliente lo sabe sin que la key
    // misma le llegue nunca — ver app/api/proxy y lib/auth/AuthGuard.
    NEXT_PUBLIC_DEMO_MODE: process.env.SANDBOX_DEMO_API_KEY ? "true" : "false",
  },
};

export default nextConfig;
