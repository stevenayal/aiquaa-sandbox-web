/** Ley de Postel: sé liberal en lo que aceptás (espacios, mayúsculas) y conservador en lo que enviás. */
export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}
