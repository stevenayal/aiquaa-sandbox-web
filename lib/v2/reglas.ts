import type { MonedaV2 } from "@/lib/api/v2/cuentas";
import type { TransferenciaV2 } from "@/lib/api/v2/transferencias";

/**
 * Reglas de negocio del curso 2 que la UI muestra ANTES de mandar el request:
 * simulaciones con la misma fórmula que el backend (aiquaa-sandbox-api,
 * `app/api/v2/**`) y límites propios del front (marcados `UI:`).
 */

/** Redondeo a 2 decimales como `round(x, 2)` de Postgres para montos positivos. */
export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Fecha local → `YYYY-MM-DD` (sin pasar por UTC, que en Paraguay corre el día). */
export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** `date + interval 'n months'` de Postgres: si el día no existe en el mes destino, cae al último. */
export function addMonths(date: Date, months: number): Date {
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(date.getDate(), lastDay));
  return target;
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/** Último día del mes (1-12) en `YYYY-MM-DD`: así vence una tarjeta "MM/AA". */
export function ultimoDiaDelMes(anio: number, mes: number): string {
  return toISODate(new Date(anio, mes, 0));
}

// --- Préstamos -------------------------------------------------------------

export interface CuotaSimulada {
  numero: number;
  monto: number;
  fechaVencimiento: string;
}

export interface SimulacionPrestamo {
  total: number;
  interes: number;
  cuota: number;
  cuotas: CuotaSimulada[];
}

/**
 * Misma fórmula que `POST /v2/prestamos/{id}/aprobar`: interés simple sobre el
 * total, cuotas iguales y la última absorbe el redondeo para que la suma dé
 * exacto. La cuota n vence n meses después de hoy.
 */
export function simularPrestamo(monto: number, tasaPct: number, plazoMeses: number, hoy = new Date()): SimulacionPrestamo {
  const total = round2(monto * (1 + tasaPct / 100));
  const cuota = round2(total / plazoMeses);
  const cuotas = Array.from({ length: plazoMeses }, (_, i) => {
    const numero = i + 1;
    const esUltima = numero === plazoMeses;
    return {
      numero,
      monto: esUltima ? round2(total - cuota * (plazoMeses - 1)) : cuota,
      fechaVencimiento: toISODate(addMonths(hoy, numero)),
    };
  });
  return { total, interes: round2(total - monto), cuota, cuotas };
}

// --- Depósitos a plazo -------------------------------------------------------

/** Plazos estándar que ofrece el banco (la API acepta cualquier entero de 30 a 1095). */
export const PLAZOS_DEPOSITO = [30, 60, 90, 180, 365, 730, 1095] as const;

/** UI: tarifario sugerido por plazo, en % anual. El campo tasa sigue siendo editable. */
export const TASAS_DEPOSITO: Record<(typeof PLAZOS_DEPOSITO)[number], number> = {
  30: 3.5,
  60: 4,
  90: 4.5,
  180: 5.25,
  365: 6.5,
  730: 7.25,
  1095: 8,
};

/** `interes_proyectado` del backend: `round(monto * tasa/100 * plazo_dias/365, 2)`. */
export function interesDeposito(monto: number, tasaPct: number, dias: number): number {
  return round2((monto * tasaPct) / 100 * (dias / 365));
}

/** Días entre dos fechas `YYYY-MM-DD` (b - a), sin horario de por medio. */
export function diasEntre(a: string, b: string): number {
  const [ya, ma, da] = a.slice(0, 10).split("-").map(Number);
  const [yb, mb, db] = b.slice(0, 10).split("-").map(Number);
  return Math.round((Date.UTC(yb, mb - 1, db) - Date.UTC(ya, ma - 1, da)) / 86_400_000);
}

/** Interés prorrateado de `POST /v2/depositos/{id}/cancelar`: días transcurridos acotados a [0, plazo]. */
export function interesCancelacionDeposito(
  monto: number,
  tasaPct: number,
  plazoDias: number,
  fechaInicio: string,
  hoy = new Date(),
): { dias: number; interes: number } {
  const dias = Math.min(Math.max(diasEntre(fechaInicio, toISODate(hoy)), 0), plazoDias);
  return { dias, interes: interesDeposito(monto, tasaPct, dias) };
}

// --- Ahorro programado -------------------------------------------------------

/** Cuántos aportes mensuales faltan para llegar a la meta, y la fecha estimada. */
export function proyeccionAhorro(meta: number, acumulado: number, aporte: number, hoy = new Date()) {
  const falta = Math.max(round2(meta - acumulado), 0);
  const meses = aporte > 0 ? Math.ceil(falta / aporte) : 0;
  return { falta, meses, fechaEstimada: toISODate(addMonths(hoy, meses)) };
}

// --- Transferencias ----------------------------------------------------------

/** UI: tope diario por cuenta origen. La API no tiene límite. */
export const LIMITE_DIARIO_TRANSFERENCIA: Record<MonedaV2, number> = {
  PYG: 50_000_000,
  USD: 10_000,
};

/** Suma de lo transferido hoy (completadas) desde una cuenta, para el tope diario. */
export function transferidoHoy(transferencias: TransferenciaV2[], cuentaOrigenId: number, hoy = new Date()): number {
  const fecha = toISODate(hoy);
  return round2(
    transferencias
      .filter(
        (t) =>
          t.cuenta_origen_id === cuentaOrigenId &&
          t.estado === "completada" &&
          toISODate(new Date(t.created_at)) === fecha,
      )
      .reduce((sum, t) => sum + Number(t.monto), 0),
  );
}

// --- Beneficiarios -----------------------------------------------------------

export const BANCOS_PY = [
  "Banco Atlas",
  "Banco Basa",
  "Banco Continental",
  "Banco Familiar",
  "Banco GNB",
  "Banco Itaú",
  "Banco Nacional de Fomento",
  "Banco Río",
  "Banco Sudameris",
  "Interfisa Banco",
  "ueno bank",
  "Visión Banco",
] as const;

// --- Tarjetas ----------------------------------------------------------------

export const MOTIVOS_BLOQUEO = [
  { value: "robo", label: "Robo" },
  { value: "extravio", label: "Extravío" },
  { value: "fraude", label: "Sospecha de fraude" },
  { value: "temporal", label: "Bloqueo temporal" },
] as const;

/** Porcentaje usado de una tarjeta de crédito (0 si no tiene límite). */
export function porcentajeUso(saldoUtilizado: number, limite: number): number {
  return limite > 0 ? round2((saldoUtilizado / limite) * 100) : 0;
}
