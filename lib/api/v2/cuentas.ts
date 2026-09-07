import { apiRequest } from "@/lib/api/http";

export type TipoCuentaV2 = "ahorro" | "corriente";
export type MonedaV2 = "PYG" | "USD";
export type EstadoCuentaV2 = "activa" | "bloqueada" | "cerrada";
export type TipoMovimientoV2 = "debito" | "credito";

// El backend serializa columnas numeric(14,2) como string (ver README de
// aiquaa-sandbox-api) — a diferencia del v1, acá saldo/monto llegan como
// string, no number.
export interface CuentaV2 {
  id: number;
  usuario_id: number;
  numero_cuenta: string;
  tipo_cuenta: TipoCuentaV2;
  moneda: MonedaV2;
  saldo: string;
  estado: EstadoCuentaV2;
  activa: boolean;
  created_at: string;
}

export interface SaldoCuentaV2 {
  cuenta_id: number;
  numero_cuenta: string;
  moneda: string;
  saldo: string;
  estado: string;
  ultimo_movimiento: string | null;
}

export interface MovimientoCuentaV2 {
  id: number;
  cuenta_id: number;
  tipo: TipoMovimientoV2;
  monto: string;
  saldo_posterior: string;
  referencia_tipo: "manual" | "transferencia" | "prestamo" | "ahorro" | "deposito" | "tarjeta";
  referencia_id: number | null;
  descripcion: string | null;
  activo: boolean;
  created_at: string;
}

export function listCuentasV2(filters: { usuarioId?: number; estado?: EstadoCuentaV2 } = {}) {
  return apiRequest<CuentaV2[]>("v2/cuentas", { query: filters });
}

export function getCuentaV2(id: number) {
  return apiRequest<CuentaV2>(`v2/cuentas/${id}`);
}

export function abrirCuentaV2(input: { usuarioId: number; tipoCuenta: TipoCuentaV2; moneda: MonedaV2 }) {
  return apiRequest<CuentaV2>("v2/cuentas", { method: "POST", body: input });
}

export function actualizarCuentaV2(id: number, input: { tipoCuenta: TipoCuentaV2; moneda: MonedaV2 }) {
  return apiRequest<CuentaV2>(`v2/cuentas/${id}`, { method: "PUT", body: input });
}

export function eliminarCuentaV2(id: number) {
  return apiRequest<void>(`v2/cuentas/${id}`, { method: "DELETE" });
}

export function getSaldoCuentaV2(id: number) {
  return apiRequest<SaldoCuentaV2>(`v2/cuentas/${id}/saldo`);
}

export function listMovimientosCuentaV2(id: number, tipo?: TipoMovimientoV2) {
  return apiRequest<MovimientoCuentaV2[]>(`v2/cuentas/${id}/movimientos`, { query: { tipo } });
}

export function registrarMovimientoCuentaV2(
  id: number,
  input: { tipo: TipoMovimientoV2; monto: number; descripcion?: string },
) {
  return apiRequest<MovimientoCuentaV2>(`v2/cuentas/${id}/movimientos`, { method: "POST", body: input });
}

export function cambiarEstadoCuentaV2(id: number, estado: EstadoCuentaV2) {
  return apiRequest<CuentaV2>(`v2/cuentas/${id}/estado`, { method: "PATCH", body: { estado } });
}
