import { apiRequest } from "./http";

export type TipoEvento = "login" | "logout" | "password_reset_solicitado" | "password_reset_completado";

export interface Sesion {
  id: number;
  usuario_id: number;
  tipo_evento: TipoEvento;
  exitoso: boolean;
  ip: string | null;
  created_at: string;
}

export interface CrearSesionInput {
  usuarioId: number;
  tipoEvento: TipoEvento;
  exitoso?: boolean;
  ip?: string;
  userAgent?: string;
}

export interface ActualizarSesionInput {
  ip?: string;
  userAgent?: string;
}

export function listSesiones(usuarioId?: number) {
  return apiRequest<Sesion[]>("sesiones", { query: { usuarioId } });
}

export function getSesion(id: number) {
  return apiRequest<Sesion>(`sesiones/${id}`);
}

export function crearSesion(input: CrearSesionInput) {
  return apiRequest<Sesion>("sesiones", {
    method: "POST",
    body: {
      usuarioId: input.usuarioId,
      tipoEvento: input.tipoEvento,
      exitoso: input.exitoso === undefined ? undefined : String(input.exitoso),
      ip: input.ip || undefined,
      userAgent: input.userAgent || undefined,
    },
  });
}

export function actualizarSesion(id: number, input: ActualizarSesionInput) {
  return apiRequest<Sesion>(`sesiones/${id}`, { method: "PUT", body: input });
}

export function eliminarSesion(id: number) {
  return apiRequest<void>(`sesiones/${id}`, { method: "DELETE" });
}
