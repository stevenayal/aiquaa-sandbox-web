import { apiRequest } from "@/lib/api/http";

export type TipoTarjetaV2 = "credito" | "debito";
export type MarcaTarjetaV2 = "visa" | "mastercard" | "amex";
export type EstadoTarjetaV2 = "activa" | "bloqueada" | "vencida";

export interface TarjetaV2 {
  id: number;
  usuario_id: number;
  cuenta_id: number | null;
  tipo: TipoTarjetaV2;
  marca: MarcaTarjetaV2;
  numero_enmascarado: string;
  limite_credito: string;
  saldo_utilizado: string;
  disponible: string;
  estado: EstadoTarjetaV2;
  fecha_vencimiento: string;
  activo: boolean;
  created_at: string;
}

export interface EmitirTarjetaV2Input {
  usuarioId: number;
  cuentaId?: number;
  tipo: TipoTarjetaV2;
  marca: MarcaTarjetaV2;
  limiteCredito?: number;
  fechaVencimiento: string;
}

export function listTarjetasV2(filters: { usuarioId?: number; estado?: EstadoTarjetaV2 } = {}) {
  return apiRequest<TarjetaV2[]>("v2/tarjetas", { query: filters });
}

export function getTarjetaV2(id: number) {
  return apiRequest<TarjetaV2>(`v2/tarjetas/${id}`);
}

export function emitirTarjetaV2(input: EmitirTarjetaV2Input) {
  return apiRequest<TarjetaV2>("v2/tarjetas", { method: "POST", body: input });
}

export function actualizarTarjetaV2(id: number, input: { marca: MarcaTarjetaV2; fechaVencimiento: string }) {
  return apiRequest<TarjetaV2>(`v2/tarjetas/${id}`, { method: "PUT", body: input });
}

export function eliminarTarjetaV2(id: number) {
  return apiRequest<void>(`v2/tarjetas/${id}`, { method: "DELETE" });
}

export function bloquearTarjetaV2(id: number, motivo?: string) {
  return apiRequest<TarjetaV2>(`v2/tarjetas/${id}/bloquear`, { method: "POST", body: motivo ? { motivo } : undefined });
}

export function activarTarjetaV2(id: number) {
  return apiRequest<TarjetaV2>(`v2/tarjetas/${id}/activar`, { method: "POST" });
}

export function cambiarLimiteTarjetaV2(id: number, limiteCredito: number) {
  return apiRequest<TarjetaV2>(`v2/tarjetas/${id}/limite`, { method: "PATCH", body: { limiteCredito } });
}
