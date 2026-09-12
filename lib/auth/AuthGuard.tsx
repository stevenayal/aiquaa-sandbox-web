"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useApiKey } from "./ApiKeyContext";
import { DEMO_MODE } from "./demoMode";
import { useUsuario } from "./UsuarioContext";
import { Nav } from "@/components/Nav";

const API_KEY_ROUTE = "/login";
const USUARIO_ROUTE = "/auth/login";

// Si el servidor tiene una key demo configurada (de cualquiera de los dos
// cursos), capa 1 (apiKey) deja de pedirse: el proxy la inyecta solo,
// server-side. /login sigue existiendo por si alguien quiere pisarla con su
// propia key personal.

type Phase = "loading" | "need-api-key" | "need-usuario" | "authenticated";

// El módulo usuarios ES el bootstrap para conseguir un usuarioId (sección 8
// del plan: "usuarios primero, antes de todo lo demás") — tiene que poder
// usarse con solo la capa 1 (apiKey), antes de tener un usuario de negocio
// logueado en capa 2.
function isUsuarioBootstrapRoute(pathname: string): boolean {
  return pathname === "/usuarios" || pathname.startsWith("/usuarios/");
}

/**
 * Guard client-side (no puede vivir en middleware.ts: no hay acceso a
 * localStorage en el servidor). Capa 1 (apiKey) manda sobre capa 2 (usuario).
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  // Cualquiera de las dos keys alcanza para entrar: un alumno del curso 2
  // solo tiene key de curso 2, y sus módulos (/v2/**) son los únicos que va a
  // usar. El Nav decide qué se ve a partir de eso (ver getVisibleModules).
  const { apiKey, apiKeyV2, loading: apiKeyLoading } = useApiKey();
  const { usuario, loading: usuarioLoading } = useUsuario();
  const pathname = usePathname();
  const router = useRouter();

  const phase: Phase =
    apiKeyLoading || usuarioLoading
      ? "loading"
      : !apiKey && !apiKeyV2 && !DEMO_MODE
        ? "need-api-key"
        : !usuario
          ? "need-usuario"
          : "authenticated";

  const usuarioGateBypassed = phase === "need-usuario" && isUsuarioBootstrapRoute(pathname);

  useEffect(() => {
    if (phase === "need-api-key" && pathname !== API_KEY_ROUTE) {
      router.replace(API_KEY_ROUTE);
    } else if (phase === "need-usuario" && pathname !== USUARIO_ROUTE && !isUsuarioBootstrapRoute(pathname)) {
      router.replace(USUARIO_ROUTE);
    } else if (phase === "authenticated" && (pathname === API_KEY_ROUTE || pathname === USUARIO_ROUTE)) {
      router.replace("/");
    }
  }, [phase, pathname, router]);

  if (phase === "loading") return null;
  if (phase === "need-api-key") return pathname === API_KEY_ROUTE ? <>{children}</> : null;
  if (phase === "need-usuario" && !usuarioGateBypassed) {
    return pathname === USUARIO_ROUTE ? <>{children}</> : null;
  }
  if (pathname === API_KEY_ROUTE || pathname === USUARIO_ROUTE) return null;

  return (
    <>
      <Nav />
      <main>{children}</main>
    </>
  );
}
