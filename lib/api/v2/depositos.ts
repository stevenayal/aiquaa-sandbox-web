import { apiRequest } from "@/lib/api/http";

export type EstadoDepositoV2 = "activo" | "vencido" | "cancelado";

export interface DepositoV2 {
  id: number;
  usuario_id: number;
  cuenta_id: number;
  monto: string;
  tasa_anual: string;
  plazo_dias: number;
  fecha_inicio: string;
  fecha_vencimiento: string;
  interes_generado: string;
  interes_proyectado: string;
  dias_restantes: number;
  estado: EstadoDepositoV2;
  activo: boolean;
  created_at: string;
}

export interface ConstituirDepositoV2Input {
  usuarioId: number;
  cuentaId: number;
  monto: number;
  tasaAnual: number;
  plazoDias: number;
}

export function listDepositosV2(filters: { usuarioId?: number; estado?: EstadoDepositoV2 } = {}) {
  return apiRequest<DepositoV2[]>("v2/depositos", { query: filters });
}

export function getDepositoV2(id: number) {
  return apiRequest<DepositoV2>(`v2/depositos/${id}`);
}

export function constituirDepositoV2(input: ConstituirDepositoV2Input) {
  return apiRequest<DepositoV2>("v2/depositos", { method: "POST", body: input });
}

export function cancelarDepositoV2(id: number) {
  return apiRequest<DepositoV2>(`v2/depositos/${id}/cancelar`, { method: "POST" });
}
