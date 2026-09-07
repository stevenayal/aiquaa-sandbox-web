import { apiRequest } from "@/lib/api/http";

export type EstadoAhorroV2 = "activo" | "completado" | "cancelado";

export interface AhorroV2 {
  id: number;
  usuario_id: number;
  cuenta_id: number;
  nombre_meta: string;
  meta_monto: string;
  aporte_mensual: string;
  saldo_acumulado: string;
  falta_para_meta: string;
  tasa_anual: string;
  estado: EstadoAhorroV2;
  activo: boolean;
  created_at: string;
}

export interface AhorroV2Input {
  nombreMeta: string;
  metaMonto: number;
  aporteMensual: number;
  tasaAnual?: number;
}

export function listAhorrosV2(filters: { usuarioId?: number; estado?: EstadoAhorroV2 } = {}) {
  return apiRequest<AhorroV2[]>("v2/ahorros", { query: filters });
}

export function getAhorroV2(id: number) {
  return apiRequest<AhorroV2>(`v2/ahorros/${id}`);
}

export function crearAhorroV2(input: AhorroV2Input & { usuarioId: number; cuentaId: number }) {
  return apiRequest<AhorroV2>("v2/ahorros", { method: "POST", body: input });
}

export function actualizarAhorroV2(id: number, input: AhorroV2Input) {
  return apiRequest<AhorroV2>(`v2/ahorros/${id}`, { method: "PUT", body: input });
}

export function eliminarAhorroV2(id: number) {
  return apiRequest<void>(`v2/ahorros/${id}`, { method: "DELETE" });
}

export function aportarAhorroV2(id: number, monto?: number) {
  return apiRequest<AhorroV2>(`v2/ahorros/${id}/aportar`, {
    method: "POST",
    body: monto === undefined ? undefined : { monto },
  });
}
