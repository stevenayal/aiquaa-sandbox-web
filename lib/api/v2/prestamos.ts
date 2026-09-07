import { apiRequest } from "@/lib/api/http";

export type EstadoPrestamoV2 = "solicitado" | "aprobado" | "rechazado" | "pagado";
export type EstadoCuotaV2 = "pendiente" | "pagada" | "vencida";

export interface PrestamoV2 {
  id: number;
  usuario_id: number;
  cuenta_id: number | null;
  monto_solicitado: string;
  tasa_interes: string;
  plazo_meses: number;
  saldo_pendiente: string;
  estado: EstadoPrestamoV2;
  activo: boolean;
  created_at: string;
}

export interface CuotaPrestamoV2 {
  id: number;
  prestamo_id: number;
  numero_cuota: number;
  monto: string;
  fecha_vencimiento: string;
  estado: EstadoCuotaV2;
  fecha_pago: string | null;
}

export interface SolicitarPrestamoV2Input {
  usuarioId: number;
  cuentaId?: number;
  montoSolicitado: number;
  tasaInteres: number;
  plazoMeses: number;
}

export function listPrestamosV2(filters: { usuarioId?: number; estado?: EstadoPrestamoV2 } = {}) {
  return apiRequest<PrestamoV2[]>("v2/prestamos", { query: filters });
}

export function getPrestamoV2(id: number) {
  return apiRequest<PrestamoV2>(`v2/prestamos/${id}`);
}

export function solicitarPrestamoV2(input: SolicitarPrestamoV2Input) {
  return apiRequest<PrestamoV2>("v2/prestamos", { method: "POST", body: input });
}

export function actualizarPrestamoV2(
  id: number,
  input: { montoSolicitado: number; tasaInteres: number; plazoMeses: number },
) {
  return apiRequest<PrestamoV2>(`v2/prestamos/${id}`, { method: "PUT", body: input });
}

export function eliminarPrestamoV2(id: number) {
  return apiRequest<void>(`v2/prestamos/${id}`, { method: "DELETE" });
}

export function aprobarPrestamoV2(id: number) {
  return apiRequest<PrestamoV2 & { cuotas: CuotaPrestamoV2[] }>(`v2/prestamos/${id}/aprobar`, { method: "POST" });
}

export function listCuotasPrestamoV2(id: number, estado?: EstadoCuotaV2) {
  return apiRequest<CuotaPrestamoV2[]>(`v2/prestamos/${id}/cuotas`, { query: { estado } });
}

export function pagarCuotaPrestamoV2(id: number, numero: number) {
  return apiRequest<{ cuota: CuotaPrestamoV2; prestamo: PrestamoV2 }>(`v2/prestamos/${id}/cuotas/${numero}/pagar`, {
    method: "POST",
  });
}
