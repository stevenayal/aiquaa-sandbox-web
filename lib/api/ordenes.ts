import { apiRequest } from "./http";

export interface ItemOrden {
  id: number;
  orden_id: number;
  producto: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  created_at: string;
}

export interface Orden {
  id: number;
  usuario_id: number;
  producto: string;
  monto: number;
  estado: "pendiente" | "pagada" | "enviada" | "cancelada";
  created_at: string;
  items?: ItemOrden[];
}

export interface ItemOrdenInput {
  producto: string;
  cantidad: number;
  precioUnitario: number;
}

export function listOrdenes(usuarioId?: number) {
  return apiRequest<Orden[]>("ordenes", { query: { usuarioId } });
}

export function getOrden(id: number) {
  return apiRequest<Orden>(`ordenes/${id}`);
}

export function crearOrden(usuarioId: number, items: ItemOrdenInput[]) {
  return apiRequest<Orden>("ordenes", { method: "POST", body: { usuarioId, items } });
}
