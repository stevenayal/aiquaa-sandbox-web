"use client";

import useSWR from "swr";
import { getMenu } from "@/lib/api/menu";
import { useCurso } from "@/lib/auth/CursoContext";
import { useUsuario } from "@/lib/auth/UsuarioContext";
import { useRosterEntry } from "@/lib/roster/useRosterEntry";

/**
 * Menú dinámico de la sesión: lo pide a `GET /api/menu` con el curso elegido
 * y, si el alumno está en el roster de ESE curso, con su grupo. Lo usan el
 * Nav y el home, que muestran exactamente lo mismo (SWR comparte la caché).
 *
 * Se espera a que termine el roster antes de pedir el menú, para no mostrar
 * primero todos los módulos y después recortarlos.
 */
export function useMenu() {
  const { curso } = useCurso();
  const { usuario } = useUsuario();
  const { rosterEntry, isLoading: rosterLoading } = useRosterEntry(usuario?.email);

  const grupo = rosterEntry && rosterEntry.curso === curso ? rosterEntry.grupo : null;
  const ready = curso !== null && !rosterLoading;

  const { data, error, isLoading, mutate } = useSWR(
    ready ? ["menu", curso, grupo] : null,
    () => getMenu(curso!, grupo),
    { shouldRetryOnError: false },
  );

  return {
    menu: data ?? null,
    rosterEntry,
    error: (error as Error | undefined) ?? null,
    isLoading: !ready || isLoading,
    retry: () => mutate(),
  };
}
