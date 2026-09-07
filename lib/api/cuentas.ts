import { apiRequest } from "./http";

export interface Cuenta {
  id: number;
  usuario_id: number;
  numero_cuenta: string;
  tipo_cuenta: "ahorro" | "corriente";
  moneda: "PYG" | "USD";
  saldo: number;
  activa: boolean;
  created_at: string;
}

export interface ActualizarCuentaInput {
  tipoCuenta: "ahorro" | "corriente";
  moneda: "PYG" | "USD";
}

export function listCuentas(usuarioId?: number) {
  return apiRequest<Cuenta[]>("cuentas", { query: { usuarioId } });
}

export function getCuenta(id: number) {
  return apiRequest<Cuenta>(`cuentas/${id}`);
}

export function actualizarCuenta(id: number, input: ActualizarCuentaInput) {
  return apiRequest<Cuenta>(`cuentas/${id}`, { method: "PUT", body: input });
}

export function eliminarCuenta(id: number) {
  return apiRequest<void>(`cuentas/${id}`, { method: "DELETE" });
}
