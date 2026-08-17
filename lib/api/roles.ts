import { apiRequest } from "./http";

export interface Rol {
  id: number;
  nombre: "admin" | "soporte" | "auditor" | "operador";
  descripcion: string | null;
  created_at: string;
}

export interface UsuarioRol {
  id: number;
  usuario_id: number;
  role_id: number;
  activo: boolean;
  asignado_en: string;
  nombre?: string;
  descripcion?: string | null;
}

export function listRoles() {
  return apiRequest<Rol[]>("roles");
}

export function listUsuarioRoles(usuarioId: number) {
  return apiRequest<UsuarioRol[]>(`usuarios/${usuarioId}/roles`);
}

export function asignarRol(usuarioId: number, roleId: number) {
  return apiRequest<UsuarioRol>(`usuarios/${usuarioId}/roles`, { method: "POST", body: { roleId } });
}

export function revocarRol(usuarioId: number, roleId: number) {
  return apiRequest<UsuarioRol>(`usuarios/${usuarioId}/roles/${roleId}`, { method: "DELETE" });
}
