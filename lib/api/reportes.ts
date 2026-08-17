import { apiRequest } from "./http";

export interface MovimientoAgregado {
  tipo_movimiento: "transferencia" | "pago_factura" | "compra_ecommerce" | "cargo_tarjeta";
  cantidad: number;
  total: number;
}

export interface ResumenMovimientos {
  cantidad_movimientos: number;
  total: number;
  primero: string | null;
  ultimo: string | null;
}

export function getMovimientos(filters: { usuarioId?: number; desde?: string; hasta?: string } = {}) {
  return apiRequest<MovimientoAgregado[]>("reportes/movimientos", { query: filters });
}

export function getResumen(usuarioId?: number) {
  return apiRequest<ResumenMovimientos>("reportes/resumen", { query: { usuarioId } });
}
