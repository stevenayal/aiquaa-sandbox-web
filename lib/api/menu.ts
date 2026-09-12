import { errorFrom, parseEnvelope } from "./http";
import type { CursoMenu, Menu } from "@/lib/menu/modules";

/**
 * Menú de la sesión. Pega a `/api/menu` (route handler de este mismo front),
 * no al proxy: no hay backend ni API key de por medio.
 */
export async function getMenu(curso: CursoMenu, grupo?: number | null): Promise<Menu> {
  const url = new URL("/api/menu", window.location.origin);
  url.searchParams.set("curso", String(curso));
  if (grupo) url.searchParams.set("grupo", String(grupo));

  const res = await fetch(url);
  const json = parseEnvelope<Menu>(await res.text());
  if (!res.ok) throw errorFrom(json, res.status);
  return json.data as Menu;
}
