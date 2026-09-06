import { apiRequest } from "@/lib/api/http";

export interface BeneficiarioV2 {
  id: number;
  usuario_id: number;
  nombre: string;
  banco: string;
  numero_cuenta: string;
  alias: string | null;
  activo: boolean;
  created_at: string;
}

export interface BeneficiarioV2Input {
  nombre: string;
  banco: string;
  numeroCuenta: string;
  alias?: string;
}

export function listBeneficiariosV2(usuarioId?: number) {
  return apiRequest<BeneficiarioV2[]>("v2/beneficiarios", { query: { usuarioId } });
}

export function getBeneficiarioV2(id: number) {
  return apiRequest<BeneficiarioV2>(`v2/beneficiarios/${id}`);
}

export function crearBeneficiarioV2(input: BeneficiarioV2Input & { usuarioId: number }) {
  return apiRequest<BeneficiarioV2>("v2/beneficiarios", { method: "POST", body: input });
}

export function actualizarBeneficiarioV2(id: number, input: BeneficiarioV2Input) {
  return apiRequest<BeneficiarioV2>(`v2/beneficiarios/${id}`, { method: "PUT", body: input });
}

export function eliminarBeneficiarioV2(id: number) {
  return apiRequest<void>(`v2/beneficiarios/${id}`, { method: "DELETE" });
}
