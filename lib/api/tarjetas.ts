import { apiRequest } from "./http";

export type TarjetaTipo = "credito" | "debito";
export type TarjetaMarca = "visa" | "mastercard";
export type TarjetaEstado = "activa" | "bloqueada" | "vencida";

export interface Tarjeta {
  id: number;
  usuario_id: number;
  tipo: TarjetaTipo;
  marca: TarjetaMarca;
  numero_enmascarado: string;
  limite_credito: number | null;
  saldo_actual: number;
  estado: TarjetaEstado;
  created_at: string;
}

export function listTarjetas(usuarioId?: number) {
  return apiRequest<Tarjeta[]>("tarjetas", { query: { usuarioId } });
}

export function emitirTarjeta(usuarioId: number, tipo: TarjetaTipo, marca: TarjetaMarca) {
  return apiRequest<Tarjeta>("tarjetas", { method: "POST", body: { usuarioId, tipo, marca } });
}

export function bloquearTarjeta(id: number) {
  return apiRequest<Tarjeta>(`tarjetas/${id}/bloquear`, { method: "PATCH" });
}

export function activarTarjeta(id: number) {
  return apiRequest<Tarjeta>(`tarjetas/${id}/activar`, { method: "PATCH" });
}
