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

export function listCuentas(usuarioId?: number) {
  return apiRequest<Cuenta[]>("cuentas", { query: { usuarioId } });
}

export function getCuenta(id: number) {
  return apiRequest<Cuenta>(`cuentas/${id}`);
}
