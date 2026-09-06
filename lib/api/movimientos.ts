import { apiRequest } from "./http";

export type TipoMovimiento = "transferencia" | "pago_factura" | "compra_ecommerce" | "cargo_tarjeta";

export interface MovimientoDetalle {
  id: number;
  usuario_id: number;
  tipo_movimiento: TipoMovimiento;
  monto: number;
  referencia_id: number | null;
  descripcion: string | null;
  created_at: string;
}

export interface CrearMovimientoInput {
  usuarioId: number;
  tipoMovimiento: TipoMovimiento;
  monto: number;
  referenciaId?: number;
  descripcion?: string;
}

export interface ActualizarMovimientoInput {
  tipoMovimiento: TipoMovimiento;
  monto: number;
  referenciaId?: number;
  descripcion?: string;
}

export function listMovimientosDetalle(usuarioId?: number) {
  return apiRequest<MovimientoDetalle[]>("movimientos", { query: { usuarioId } });
}

export function getMovimientoDetalle(id: number) {
  return apiRequest<MovimientoDetalle>(`movimientos/${id}`);
}

export function crearMovimiento(input: CrearMovimientoInput) {
  return apiRequest<MovimientoDetalle>("movimientos", { method: "POST", body: input });
}

export function actualizarMovimiento(id: number, input: ActualizarMovimientoInput) {
  return apiRequest<MovimientoDetalle>(`movimientos/${id}`, { method: "PUT", body: input });
}

export function eliminarMovimiento(id: number) {
  return apiRequest<void>(`movimientos/${id}`, { method: "DELETE" });
}
