import { apiRequest } from "./http";

export interface Transferencia {
  id: number;
  cuenta_origen_id: number;
  cuenta_destino_id: number;
  monto: number;
  descripcion: string | null;
  estado: "pendiente" | "completada" | "rechazada";
  created_at: string;
}

export interface CrearTransferenciaInput {
  cuentaOrigenId: number;
  cuentaDestinoId: number;
  monto: number;
  descripcion?: string;
}

export interface ActualizarTransferenciaInput {
  cuentaOrigenId: number;
  cuentaDestinoId: number;
  monto: number;
  descripcion?: string;
}

export interface ListTransferenciasFilters {
  cuentaOrigenId?: number;
  cuentaDestinoId?: number;
}

export function listTransferencias(filters: ListTransferenciasFilters = {}) {
  return apiRequest<Transferencia[]>("transferencias", {
    query: { cuentaOrigenId: filters.cuentaOrigenId, cuentaDestinoId: filters.cuentaDestinoId },
  });
}

export function crearTransferencia(input: CrearTransferenciaInput) {
  return apiRequest<Transferencia>("transferencias", { method: "POST", body: input });
}

export function getTransferencia(id: number) {
  return apiRequest<Transferencia>(`transferencias/${id}`);
}

export function actualizarTransferencia(id: number, input: ActualizarTransferenciaInput) {
  return apiRequest<Transferencia>(`transferencias/${id}`, { method: "PUT", body: input });
}

export function eliminarTransferencia(id: number) {
  return apiRequest<void>(`transferencias/${id}`, { method: "DELETE" });
}
