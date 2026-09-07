import { apiRequest } from "@/lib/api/http";

export type DocumentoTipo = "CI" | "pasaporte" | "RUC";

export interface UsuarioV2 {
  id: number;
  nombre: string;
  email: string;
  documento_tipo: DocumentoTipo;
  documento_numero: string;
  telefono: string | null;
  activo: boolean;
  created_at: string;
}

export interface CrearUsuarioV2Input {
  nombre: string;
  email: string;
  documentoTipo?: DocumentoTipo;
  documentoNumero: string;
  telefono?: string;
}

export interface ActualizarUsuarioV2Input {
  nombre: string;
  email: string;
  telefono?: string;
}

export function listUsuariosV2(email?: string) {
  return apiRequest<UsuarioV2[]>("v2/usuarios", { query: { email } });
}

export function getUsuarioV2(id: number) {
  return apiRequest<UsuarioV2>(`v2/usuarios/${id}`);
}

export function crearUsuarioV2(input: CrearUsuarioV2Input) {
  return apiRequest<UsuarioV2>("v2/usuarios", { method: "POST", body: input });
}

export function actualizarUsuarioV2(id: number, input: ActualizarUsuarioV2Input) {
  return apiRequest<UsuarioV2>(`v2/usuarios/${id}`, { method: "PUT", body: input });
}

export function eliminarUsuarioV2(id: number) {
  return apiRequest<void>(`v2/usuarios/${id}`, { method: "DELETE" });
}
