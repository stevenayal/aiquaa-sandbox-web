import { apiRequest } from "./http";

export type NotificacionCanal = "push" | "email" | "sms";

export interface Notificacion {
  id: number;
  usuario_id: number;
  canal: NotificacionCanal;
  asunto: string;
  mensaje: string;
  leido: boolean;
  estado: "enviada" | "fallida" | "pendiente";
  created_at: string;
}

export function listNotificaciones(filters: { usuarioId?: number; leido?: boolean } = {}) {
  return apiRequest<Notificacion[]>("notificaciones", {
    query: {
      usuarioId: filters.usuarioId,
      leido: filters.leido === undefined ? undefined : String(filters.leido),
    },
  });
}

export function crearNotificacion(input: {
  usuarioId: number;
  canal: NotificacionCanal;
  asunto: string;
  mensaje: string;
}) {
  return apiRequest<Notificacion>("notificaciones", { method: "POST", body: input });
}

export function marcarLeida(id: number) {
  return apiRequest<Notificacion>(`notificaciones/${id}/leer`, { method: "PATCH" });
}

export function getNotificacion(id: number) {
  return apiRequest<Notificacion>(`notificaciones/${id}`);
}

// leido/estado no son reemplazables por PUT — leido sigue gobernado por marcarLeida.
export function actualizarNotificacion(
  id: number,
  input: { canal: NotificacionCanal; asunto: string; mensaje: string },
) {
  return apiRequest<Notificacion>(`notificaciones/${id}`, { method: "PUT", body: input });
}

export function eliminarNotificacion(id: number) {
  return apiRequest<void>(`notificaciones/${id}`, { method: "DELETE" });
}
