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

export function crearTransferencia(input: CrearTransferenciaInput) {
  return apiRequest<Transferencia>("transferencias", { method: "POST", body: input });
}

export function getTransferencia(id: number) {
  return apiRequest<Transferencia>(`transferencias/${id}`);
}
