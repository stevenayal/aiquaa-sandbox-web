import type { Usuario } from "@/lib/api/auth";

/**
 * "Admin" del curso 2 — concepto puramente del front, no existe en el
 * backend del sandbox (la API no tiene roles: cualquier key válida puede
 * leer o escribir cualquier cliente). Sirve para dar una experiencia
 * distinta a una cuenta pensada para supervisar en vez de operar como un
 * cliente puntual: arranca viendo "todos los clientes" en las listas y
 * puede iniciar sesión aunque no exista como cliente en `v2.usuarios`.
 */
export const ADMIN_EMAILS_V2 = ["admin@aiquaa.com"];

/** ID sentinela para la sesión admin — nunca corresponde a un cliente real (los ids son positivos). */
export const ADMIN_ID_V2 = -1;

export function esAdminV2(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalizado = email.trim().toLowerCase();
  return ADMIN_EMAILS_V2.includes(normalizado);
}

/**
 * Id para prellenar el titular de un alta a partir de la sesión: vacío para
 * el admin (no tiene productos propios, tiene que elegir un cliente siempre)
 * o sin sesión; el id de la sesión en cualquier otro caso.
 */
export function defaultUsuarioIdV2(usuario: Pick<Usuario, "id" | "email"> | null): string {
  return usuario && !esAdminV2(usuario.email) ? String(usuario.id) : "";
}
