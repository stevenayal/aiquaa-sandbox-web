"use client";

import useSWR from "swr";
import { getRosterEntry } from "@/lib/api/roster";

/**
 * Busca el grupo real del alumno logueado por su email. Un 404 (email no
 * está en el roster) no es un error visible acá — se trata igual que
 * "todavía sin resultado": el llamador cae a mostrar todos los módulos
 * (ver Nav.tsx y app/page.tsx).
 */
export function useRosterEntry(email: string | undefined) {
  const { data, error, isLoading } = useSWR(
    email ? ["roster", email] : null,
    () => getRosterEntry(email as string),
    { shouldRetryOnError: false },
  );

  // `isLoading` vuelve a true en cada revalidación mientras no haya data (un
  // 404 nunca la tiene). `settled` queda en true desde la primera respuesta.
  const settled = !email || data !== undefined || error !== undefined;

  return { rosterEntry: data ?? null, isLoading, settled };
}
