import { ApiError, apiRequest } from "./http";
import { listUsuariosV2 } from "./v2/usuarios";

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  activo: boolean;
}

export interface Sesion {
  id: number;
  usuario_id: number;
  tipo_evento: string;
  exitoso: boolean;
  ip: string | null;
}

export function login(email: string) {
  return apiRequest<Usuario>("auth/login", { method: "POST", body: { email } });
}

export function logout(usuarioId: number) {
  return apiRequest<Sesion>("auth/logout", { method: "POST", body: { usuarioId } });
}

export function forgotPassword(email: string) {
  return apiRequest<Sesion>("auth/forgot-password", { method: "POST", body: { email } });
}

export function resetPassword(usuarioId: number) {
  return apiRequest<Sesion>("auth/reset-password", { method: "POST", body: { usuarioId } });
}

/**
 * Capa 2 para el curso 2. La API v2 no tiene `/auth/login` (no es parte de
 * ningún grupo del curso 2): el equivalente es resolver el cliente del banco
 * por email contra `GET /v2/usuarios?email=`. Devuelve el mismo `Usuario` que
 * el login de v1 para que `UsuarioContext` y los módulos no tengan que
 * distinguir de qué curso salió la sesión.
 */
export async function loginV2(email: string): Promise<Usuario> {
  const usuarios = await listUsuariosV2(email);
  const match = usuarios.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? usuarios[0];
  if (!match) {
    throw new ApiError("NOT_FOUND", "No hay un cliente con ese email.", 404);
  }
  if (!match.activo) {
    throw new ApiError("FORBIDDEN", "El cliente existe pero está inactivo.", 403);
  }
  return { id: Number(match.id), nombre: match.nombre, email: match.email, activo: match.activo };
}
