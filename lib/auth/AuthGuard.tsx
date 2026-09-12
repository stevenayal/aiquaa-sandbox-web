"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useApiKey } from "./ApiKeyContext";
import { useCurso, type Curso } from "./CursoContext";
import { DEMO_CURSO_1, DEMO_CURSO_2 } from "./demoMode";
import { useUsuario } from "./UsuarioContext";
import { Nav } from "@/components/Nav";

const CURSO_ROUTE = "/curso";
const API_KEY_ROUTE = "/login";
const USUARIO_ROUTE = "/auth/login";
const GATE_ROUTES = [CURSO_ROUTE, API_KEY_ROUTE, USUARIO_ROUTE];

// Si el servidor tiene una key demo para el curso elegido, capa 1 (apiKey)
// deja de pedirse: el proxy la inyecta solo, server-side. /login sigue
// existiendo por si alguien quiere pisarla con su propia key personal.

type Phase = "loading" | "need-curso" | "need-api-key" | "need-usuario" | "authenticated";

// El alta de usuarios/clientes ES el bootstrap para conseguir un usuarioId
// (sección 8 del plan: "usuarios primero, antes de todo lo demás") — tiene
// que poder usarse con solo la capa 1 (apiKey), antes de tener un usuario de
// negocio logueado en capa 2. Cada curso tiene el suyo.
function isUsuarioBootstrapRoute(pathname: string, curso: Curso | null): boolean {
  const base = curso === 2 ? "/v2/usuarios" : "/usuarios";
  return pathname === base || pathname.startsWith(`${base}/`);
}

/**
 * Guard client-side (no puede vivir en middleware.ts: no hay acceso a
 * localStorage en el servidor). Las capas se piden en orden: curso → API key
 * de ese curso → usuario de negocio.
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const { curso, loading: cursoLoading } = useCurso();
  const { apiKey, apiKeyV2, loading: apiKeyLoading } = useApiKey();
  const { usuario, loading: usuarioLoading } = useUsuario();
  const pathname = usePathname();
  const router = useRouter();

  // Solo cuenta la key del curso elegido: una key de curso 1 en v2 da 403, y
  // al revés el curso 1 no tiene sentido con la cohorte del curso 2.
  const tieneKey = curso === 2 ? Boolean(apiKeyV2) || DEMO_CURSO_2 : Boolean(apiKey) || DEMO_CURSO_1;

  const phase: Phase =
    cursoLoading || apiKeyLoading || usuarioLoading
      ? "loading"
      : curso === null
        ? "need-curso"
        : !tieneKey
          ? "need-api-key"
          : !usuario
            ? "need-usuario"
            : "authenticated";

  const usuarioGateBypassed = phase === "need-usuario" && isUsuarioBootstrapRoute(pathname, curso);

  useEffect(() => {
    if (phase === "need-curso" && pathname !== CURSO_ROUTE) {
      router.replace(CURSO_ROUTE);
    } else if (phase === "need-api-key" && pathname !== API_KEY_ROUTE) {
      router.replace(API_KEY_ROUTE);
    } else if (
      phase === "need-usuario" &&
      pathname !== USUARIO_ROUTE &&
      !isUsuarioBootstrapRoute(pathname, curso)
    ) {
      router.replace(USUARIO_ROUTE);
    } else if (phase === "authenticated" && GATE_ROUTES.includes(pathname)) {
      router.replace("/");
    }
  }, [phase, pathname, router, curso]);

  if (phase === "loading") return null;
  if (phase === "need-curso") return pathname === CURSO_ROUTE ? <>{children}</> : null;
  if (phase === "need-api-key") return pathname === API_KEY_ROUTE ? <>{children}</> : null;
  if (phase === "need-usuario" && !usuarioGateBypassed) {
    return pathname === USUARIO_ROUTE ? <>{children}</> : null;
  }
  if (GATE_ROUTES.includes(pathname)) return null;

  return (
    <>
      <Nav />
      <main>{children}</main>
    </>
  );
}
