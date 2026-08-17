import { apiRequest } from "./http";

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  activo: boolean;
}

export interface Sesion {
  id: number;
  usuario_id: number;
  tipo_evento: string;
  exitoso: boolean;
  ip: string | null;
}

export function login(email: string) {
  return apiRequest<Usuario>("auth/login", { method: "POST", body: { email } });
}

export function logout(usuarioId: number) {
  return apiRequest<Sesion>("auth/logout", { method: "POST", body: { usuarioId } });
}

export function forgotPassword(email: string) {
  return apiRequest<Sesion>("auth/forgot-password", { method: "POST", body: { email } });
}

export function resetPassword(usuarioId: number) {
  return apiRequest<Sesion>("auth/reset-password", { method: "POST", body: { usuarioId } });
}
