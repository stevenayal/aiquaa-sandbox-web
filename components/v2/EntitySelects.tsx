"use client";

import type { SelectHTMLAttributes } from "react";
import { formatMonto } from "@/lib/format";
import type { UsuarioV2 } from "@/lib/api/v2/usuarios";
import type { CuentaV2 } from "@/lib/api/v2/cuentas";
import type { BeneficiarioV2 } from "@/lib/api/v2/beneficiarios";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

interface BaseProps<T> extends SelectProps {
  items: T[];
  isLoading?: boolean;
  placeholder?: string;
  emptyLabel?: string;
}

function Placeholder({ isLoading, empty, placeholder, emptyLabel }: { isLoading?: boolean; empty: boolean; placeholder: string; emptyLabel: string }) {
  return <option value="">{isLoading ? "Cargando..." : empty ? emptyLabel : placeholder}</option>;
}

/** Clientes del banco: `Nombre · CI 1234567`. */
export function ClienteSelect({ items, isLoading, placeholder = "Elegí un cliente", emptyLabel = "No hay clientes", ...rest }: BaseProps<UsuarioV2>) {
  return (
    <select {...rest} disabled={rest.disabled || isLoading}>
      <Placeholder isLoading={isLoading} empty={items.length === 0} placeholder={placeholder} emptyLabel={emptyLabel} />
      {items.map((u) => (
        <option key={u.id} value={u.id}>
          {u.nombre} · {u.documento_tipo} {u.documento_numero}
        </option>
      ))}
    </select>
  );
}

export function describeCuenta(cuenta: CuentaV2): string {
  return `${cuenta.tipo_cuenta === "ahorro" ? "Caja de ahorro" : "Cuenta corriente"} N° ${cuenta.numero_cuenta} · ${formatMonto(cuenta.saldo, cuenta.moneda)}`;
}

/**
 * Cuentas de un cliente con su saldo a la vista. Cada `<option>` lleva
 * `data-saldo`, `data-moneda` y `data-estado` para asertar sin parsear el texto.
 */
export function CuentaSelect({
  items,
  isLoading,
  placeholder = "Elegí una cuenta",
  emptyLabel = "No hay cuentas disponibles",
  ...rest
}: BaseProps<CuentaV2>) {
  return (
    <select {...rest} disabled={rest.disabled || isLoading}>
      <Placeholder isLoading={isLoading} empty={items.length === 0} placeholder={placeholder} emptyLabel={emptyLabel} />
      {items.map((c) => (
        <option key={c.id} value={c.id} data-saldo={c.saldo} data-moneda={c.moneda} data-estado={c.estado}>
          {describeCuenta(c)}
        </option>
      ))}
    </select>
  );
}

export function BeneficiarioSelect({
  items,
  isLoading,
  placeholder = "Elegí un beneficiario",
  emptyLabel = "No tenés beneficiarios cargados",
  ...rest
}: BaseProps<BeneficiarioV2>) {
  return (
    <select {...rest} disabled={rest.disabled || isLoading}>
      <Placeholder isLoading={isLoading} empty={items.length === 0} placeholder={placeholder} emptyLabel={emptyLabel} />
      {items.map((b) => (
        <option key={b.id} value={b.id}>
          {b.alias ? `${b.alias} — ` : ""}
          {b.nombre} · {b.banco} N° {b.numero_cuenta}
        </option>
      ))}
    </select>
  );
}
