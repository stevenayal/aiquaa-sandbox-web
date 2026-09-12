import shared from "@/components/shared.module.css";

/** Textos y estilos de estados/enums del curso 2, para que todas las pantallas digan lo mismo. */

export const TIPO_CUENTA_LABEL = { ahorro: "Caja de ahorro", corriente: "Cuenta corriente" } as const;

export const ESTADO_CUENTA_LABEL = { activa: "Activa", bloqueada: "Bloqueada", cerrada: "Cerrada" } as const;

export const MARCA_LABEL = { visa: "Visa", mastercard: "Mastercard", amex: "American Express" } as const;

export const TIPO_TARJETA_LABEL = { credito: "Crédito", debito: "Débito" } as const;

/** Clase de badge según el "tono" de un estado: ok, en curso, problema o terminado. */
export function badgeFor(estado: string): string {
  switch (estado) {
    case "activa":
    case "activo":
    case "completada":
    case "completado":
    case "aprobado":
    case "pagada":
    case "pagado":
      return shared.badgeSuccess;
    case "bloqueada":
    case "solicitado":
    case "pendiente":
      return shared.badgeWarning;
    case "cerrada":
    case "vencida":
    case "vencido":
    case "rechazada":
    case "rechazado":
      return shared.badgeDanger;
    default:
      return shared.badge;
  }
}

/** `solicitado` → `Solicitado`. */
export function capitalizar(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
