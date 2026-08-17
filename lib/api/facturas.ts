import { apiRequest } from "./http";

export type FacturaEstado = "pendiente" | "pagada" | "vencida";
export type MetodoPago = "tarjeta" | "cuenta" | "efectivo";

export interface Factura {
  id: number;
  usuario_id: number;
  proveedor: "ANDE" | "ESSAP" | "COPACO" | "Tigo" | "Personal";
  numero_factura: string;
  monto: number;
  fecha_vencimiento: string;
  estado: FacturaEstado;
  created_at: string;
}

export interface Pago {
  id: number;
  factura_id: number;
  usuario_id: number;
  monto: number;
  metodo_pago: MetodoPago;
  estado: "procesado" | "fallido" | "pendiente";
  created_at: string;
}

export interface PagarFacturaResult {
  factura: Factura;
  pago: Pago;
}

export function listFacturas(filters: { usuarioId?: number; estado?: FacturaEstado } = {}) {
  return apiRequest<Factura[]>("facturas", { query: filters });
}

export function getFactura(id: number) {
  return apiRequest<Factura>(`facturas/${id}`);
}

export function pagarFactura(id: number, metodoPago: MetodoPago) {
  return apiRequest<PagarFacturaResult>(`facturas/${id}/pagar`, { method: "POST", body: { metodoPago } });
}
