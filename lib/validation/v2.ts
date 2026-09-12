import type { DocumentoTipo } from "@/lib/api/v2/usuarios";

/**
 * Validadores de formularios del curso 2. Cada uno devuelve el mensaje de
 * error o `null`.
 *
 * Hay dos tipos de regla, y la diferencia importa para escribir escenarios:
 * - **Espejo de la API**: la misma regla que aplica el backend (zod/CHECK de
 *   `qa_training_v2`). Se puede probar por UI o por API y da el mismo resultado.
 * - **Regla de UI** (marcadas `UI:`): el front es más estricto que la API. Un
 *   request directo a la API con ese dato pasa; por la UI no.
 */
export type Validator = (value: string) => string | null;

/** Valores del form → error por campo (solo los que fallan). */
export type FieldErrors<K extends string> = Partial<Record<K, string>>;

export function validarCampos<K extends string>(
  values: Record<K, string>,
  rules: Partial<Record<K, Validator[]>>,
): FieldErrors<K> {
  const errors: FieldErrors<K> = {};
  for (const field of Object.keys(rules) as K[]) {
    for (const rule of rules[field] ?? []) {
      const message = rule(values[field] ?? "");
      if (message) {
        errors[field] = message;
        break;
      }
    }
  }
  return errors;
}

/** Aplica el resto de las reglas solo si el campo tiene algo (campos opcionales). */
export function opcional(...rules: Validator[]): Validator {
  return (value) => {
    if (!value.trim()) return null;
    for (const rule of rules) {
      const message = rule(value);
      if (message) return message;
    }
    return null;
  };
}

export const requerido =
  (message = "Este campo es obligatorio."): Validator =>
  (value) =>
    value.trim() ? null : message;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const email: Validator = (value) => (EMAIL.test(value.trim()) ? null : "Ingresá un email válido.");

export const longitud =
  ({ min, max, label = "Este campo" }: { min?: number; max?: number; label?: string }): Validator =>
  (value) => {
    const n = value.trim().length;
    if (min !== undefined && n < min) return `${label} debe tener al menos ${min} caracteres.`;
    if (max !== undefined && n > max) return `${label} puede tener hasta ${max} caracteres.`;
    return null;
  };

/**
 * Monto como lo guarda el form: `1500000` o `1500000.50` (el `MontoInput`
 * convierte la coma decimal en punto). Acepta también la coma por si llega
 * pegado. Devuelve `null` si no es un número con hasta 2 decimales.
 */
export function parseMonto(raw: string): number | null {
  const normalized = raw.trim().replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  return Number(normalized);
}

/** Espejo de la API: monto > 0 con hasta 2 decimales (numeric(14,2)). `max` es regla de negocio visible. */
export const monto =
  ({
    max,
    maxMessage,
    min,
    minMessage,
  }: { max?: number | null; maxMessage?: string; min?: number; minMessage?: string } = {}): Validator =>
  (value) => {
    if (!value.trim()) return "Ingresá un monto.";
    const n = parseMonto(value);
    if (n === null) return "Monto inválido: usá solo números, con hasta 2 decimales.";
    if (n <= 0) return "El monto debe ser mayor a 0.";
    if (min !== undefined && n < min) return minMessage ?? `El monto mínimo es ${min}.`;
    if (max !== undefined && max !== null && n > max) return maxMessage ?? `El monto no puede superar ${max}.`;
    return null;
  };

/** Espejo de la API: tasa numeric(5,2) entre 0 y 999,99. */
export const tasa: Validator = (value) => {
  if (!value.trim()) return "Ingresá la tasa.";
  const n = parseMonto(value);
  if (n === null) return "Tasa inválida: usá solo números, con hasta 2 decimales.";
  if (n > 999.99) return "La tasa no puede superar 999,99 %.";
  return null;
};

export const entero =
  ({ min, max, label }: { min: number; max: number; label: string }): Validator =>
  (value) => {
    if (!/^\d+$/.test(value.trim())) return `${label} debe ser un número entero.`;
    const n = Number(value);
    if (n < min || n > max) return `${label} debe estar entre ${min} y ${max}.`;
    return null;
  };

/** UI: formato del documento según su tipo (la API solo pide que no esté vacío). */
export function documento(tipo: DocumentoTipo): Validator {
  return (value) => {
    const v = value.trim();
    if (!v) return "Ingresá el número de documento.";
    if (tipo === "CI" && !/^\d{5,8}$/.test(v)) return "La CI tiene entre 5 y 8 dígitos, sin puntos.";
    if (tipo === "RUC" && !/^\d{6,8}-\d$/.test(v)) return "El RUC va con dígito verificador: 1234567-8.";
    if (tipo === "pasaporte" && !/^[A-Za-z0-9]{6,9}$/.test(v)) {
      return "El pasaporte tiene entre 6 y 9 letras o números.";
    }
    return null;
  };
}

export const DOCUMENTO_HINTS: Record<DocumentoTipo, string> = {
  CI: "Entre 5 y 8 dígitos, sin puntos. Ej. 4567890",
  RUC: "Con dígito verificador. Ej. 80012345-6",
  pasaporte: "Entre 6 y 9 letras o números. Ej. AB123456",
};

/** UI: celular de Paraguay, 09XXXXXXXX o +5959XXXXXXXX (la API acepta cualquier texto). */
export const telefonoPy: Validator = (value) =>
  /^(\+595|0)9\d{8}$/.test(value.replace(/[\s-]/g, "")) ? null : "Celular inválido. Ej. 0981123456 o +595981123456.";

/** UI: número de cuenta de otro banco, entre 6 y 20 dígitos. */
export const numeroCuenta: Validator = (value) =>
  /^\d{6,20}$/.test(value.trim()) ? null : "El número de cuenta tiene entre 6 y 20 dígitos, sin guiones.";

/** UI: vencimiento de tarjeta (mes 1-12, año de 4 dígitos) posterior al mes actual y a 5 años como máximo. */
export function vencimientoTarjeta(mes: string, anio: string, hoy = new Date()): string | null {
  if (!mes || !anio) return "Elegí mes y año de vencimiento.";
  const elegido = Number(anio) * 12 + Number(mes);
  const actual = hoy.getFullYear() * 12 + hoy.getMonth() + 1;
  if (elegido <= actual) return "El vencimiento tiene que ser posterior al mes actual.";
  if (elegido > actual + 60) return "El vencimiento puede ser a 5 años como máximo.";
  return null;
}

/** UI: límite de una tarjeta de crédito nueva, en guaraníes. */
export const LIMITE_TARJETA = { min: 1_000_000, max: 100_000_000 } as const;
