import { apiRequest } from "./http";

export type KycEstado = "pendiente" | "verificado" | "rechazado";

export interface UsuarioDetalle {
  id: number;
  nombre: string;
  email: string;
  activo: boolean;
  documento_tipo: "CI" | "pasaporte" | "RUC";
  documento_numero: string;
  fecha_nacimiento: string | null;
  direccion: string | null;
  kyc_estado: KycEstado;
  created_at: string;
}

export interface CrearUsuarioInput {
  nombre: string;
  email: string;
  documentoTipo: "CI" | "pasaporte" | "RUC";
  documentoNumero: string;
  fechaNacimiento?: string;
  direccion?: string;
}

export function crearUsuario(input: CrearUsuarioInput) {
  return apiRequest<UsuarioDetalle>("usuarios", { method: "POST", body: input });
}

export function getUsuario(id: number) {
  return apiRequest<UsuarioDetalle>(`usuarios/${id}`);
}

export function actualizarKyc(id: number, kycEstado: KycEstado) {
  return apiRequest<UsuarioDetalle>(`usuarios/${id}/kyc`, { method: "PATCH", body: { kycEstado } });
}
