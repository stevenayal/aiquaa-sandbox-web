import {
  formatFecha,
  formatFechaHora,
  formatMonto,
  formatPorcentaje,
  type ValorNumerico,
} from "@/lib/format";

/**
 * Montos, porcentajes y fechas formateados para leer, con el valor crudo del
 * backend intacto en `data-value`.
 *
 * Ese atributo es la parte importante para automatizar: el texto visible
 * depende del locale (`5.000.000,00`, y la moneda adelante), pero una
 * aserción sobre `data-value` compara contra lo que devolvió la API
 * (`"5000000.00"`) sin parsear separadores de miles ni depender del formato.
 */
interface ValorProps {
  value: ValorNumerico;
  testId?: string;
}

export function Monto({ value, moneda, testId }: ValorProps & { moneda?: string | null }) {
  return (
    <span data-value={value ?? ""} data-testid={testId}>
      {formatMonto(value, moneda)}
    </span>
  );
}

export function Porcentaje({ value, testId }: ValorProps) {
  return (
    <span data-value={value ?? ""} data-testid={testId}>
      {formatPorcentaje(value)}
    </span>
  );
}

/** `conHora` para timestamps (created_at); sin ella, fechas de calendario. */
export function Fecha({
  value,
  conHora = false,
  testId,
}: {
  value: string | null | undefined;
  conHora?: boolean;
  testId?: string;
}) {
  return (
    <span data-value={value ?? ""} data-testid={testId}>
      {conHora ? formatFechaHora(value) : formatFecha(value)}
    </span>
  );
}
