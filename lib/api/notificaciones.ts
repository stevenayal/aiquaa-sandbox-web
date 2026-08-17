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
