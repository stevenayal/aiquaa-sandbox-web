import { apiRequest } from "./http";

export type ReservaEstado = "pendiente" | "confirmada" | "cancelada" | "completada";

export interface Reserva {
  id: number;
  usuario_id: number;
  servicio: string;
  fecha_hora: string;
  estado: ReservaEstado;
  notas: string | null;
  created_at: string;
}

export function listReservas(usuarioId?: number) {
  return apiRequest<Reserva[]>("reservas", { query: { usuarioId } });
}

export function crearReserva(input: { usuarioId: number; servicio: string; fechaHora: string; notas?: string }) {
  return apiRequest<Reserva>("reservas", { method: "POST", body: input });
}

export function confirmarReserva(id: number) {
  return apiRequest<Reserva>(`reservas/${id}/confirmar`, { method: "PATCH" });
}

export function cancelarReserva(id: number) {
  return apiRequest<Reserva>(`reservas/${id}/cancelar`, { method: "PATCH" });
}
