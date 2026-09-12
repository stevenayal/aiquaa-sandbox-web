import type { Usuario } from "@/lib/api/auth";

/**
 * "Admin" — concepto puramente del front, común a los dos cursos. No existe
 * en el backend del sandbox (la API no tiene roles: cualquier key válida
 * puede leer o escribir cualquier usuario/cliente). Sirve para dar una
 * experiencia distinta a una cuenta pensada para supervisar en vez de operar
 * como un usuario puntual: arranca viendo todos los usuarios/clientes en las
 * listas y puede iniciar sesión aunque no exista como tal en el backend.
 */
export const ADMIN_EMAILS = ["admin@aiquaa.com"];

/** ID sentinela para la sesión admin — nunca corresponde a un usuario/cliente real (los ids son positivos). */
export const ADMIN_ID = -1;

export function esAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalizado = email.trim().toLowerCase();
  return ADMIN_EMAILS.includes(normalizado);
}

/**
 * Id para prellenar el titular de un alta o el filtro de una lista a partir
 * de la sesión: vacío para el admin (no tiene productos propios, tiene que
 * elegir/escribir un usuario siempre) o sin sesión; el id de la sesión en
 * cualquier otro caso.
 */
export function defaultUsuarioId(usuario: Pick<Usuario, "id" | "email"> | null): string {
  return usuario && !esAdmin(usuario.email) ? String(usuario.id) : "";
}
