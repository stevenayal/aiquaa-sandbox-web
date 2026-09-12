/** Ley de Postel: sé liberal en lo que aceptás (espacios, mayúsculas) y conservador en lo que enviás. */
export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

// Los montos del backend llegan como number (v1) o como string (v2: columnas
// numeric(14,2) que node-postgres serializa como texto para no perder
// precisión). Las dos formas se formatean igual acá.
export type ValorNumerico = string | number | null | undefined;

const MONTO = new Intl.NumberFormat("es-PY", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const PORCENTAJE = new Intl.NumberFormat("es-PY", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const FECHA = new Intl.DateTimeFormat("es-PY", { day: "2-digit", month: "2-digit", year: "numeric" });
const FECHA_HORA = new Intl.DateTimeFormat("es-PY", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  // Reloj de 24h: es-PY por default escribe "11:28 p. m.", que además de ser
  // más largo obliga a cualquier aserción a lidiar con el sufijo.
  hour12: false,
});

function aNumero(value: ValorNumerico): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * `5000000.00` → `5.000.000,00` (con `PYG 5.000.000,00` si se pasa la moneda).
 * Un valor que no es número se devuelve tal cual: mejor mostrar el dato crudo
 * del backend que un "NaN".
 */
export function formatMonto(value: ValorNumerico, moneda?: string | null): string {
  const n = aNumero(value);
  if (n === null) return value === null || value === undefined ? "—" : String(value);
  const formatted = MONTO.format(n);
  return moneda ? `${moneda} ${formatted}` : formatted;
}

/** `12.5` → `12,50 %`. */
export function formatPorcentaje(value: ValorNumerico): string {
  const n = aNumero(value);
  if (n === null) return value === null || value === undefined ? "—" : String(value);
  return `${PORCENTAJE.format(n)} %`;
}

/** ISO del backend → `04/09/2026`. Sin hora, para fechas de calendario. */
export function formatFecha(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : FECHA.format(date);
}

/** ISO del backend → `04/09/2026, 02:28`. Para timestamps (created_at). */
export function formatFechaHora(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : FECHA_HORA.format(date);
}
