import { apiRequest } from "@/lib/api/http";

export type EstadoTransferenciaV2 = "pendiente" | "completada" | "rechazada" | "anulada";

export interface TransferenciaV2 {
  id: number;
  cuenta_origen_id: number;
  cuenta_destino_id: number | null;
  beneficiario_id: number | null;
  monto: string;
  moneda: "PYG" | "USD";
  concepto: string | null;
  referencia: string;
  estado: EstadoTransferenciaV2;
  activo: boolean;
  created_at: string;
}

export interface CrearTransferenciaV2Input {
  cuentaOrigenId: number;
  // Exactamente uno de los dos: interna (cuentaDestinoId) o externa (beneficiarioId).
  cuentaDestinoId?: number;
  beneficiarioId?: number;
  monto: number;
  concepto?: string;
}

export function listTransferenciasV2(filters: { cuentaOrigenId?: number; estado?: EstadoTransferenciaV2 } = {}) {
  return apiRequest<TransferenciaV2[]>("v2/transferencias", { query: filters });
}

export function getTransferenciaV2(id: number) {
  return apiRequest<TransferenciaV2>(`v2/transferencias/${id}`);
}

export function crearTransferenciaV2(input: CrearTransferenciaV2Input) {
  return apiRequest<TransferenciaV2>("v2/transferencias", { method: "POST", body: input });
}

export function anularTransferenciaV2(id: number, motivo?: string) {
  return apiRequest<TransferenciaV2>(`v2/transferencias/${id}/anular`, {
    method: "POST",
    body: motivo ? { motivo } : undefined,
  });
}
