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
  const { data, isLoading } = useSWR(
    email ? ["roster", email] : null,
    () => getRosterEntry(email as string),
    { shouldRetryOnError: false },
  );

  return { rosterEntry: data ?? null, isLoading };
}
