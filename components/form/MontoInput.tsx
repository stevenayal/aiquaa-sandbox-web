"use client";

import { useState, type InputHTMLAttributes } from "react";
import shared from "@/components/shared.module.css";
import { formatMonto } from "@/lib/format";
import { parseMonto } from "@/lib/validation/v2";

interface MontoInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> {
  value: string;
  onValueChange: (value: string) => void;
  moneda?: string | null;
}

/**
 * Input de montos como en un home banking: mientras se edita muestra el número
 * crudo (`1500000.5`); al salir, formateado (`1.500.000,50`). La coma decimal
 * se guarda como punto.
 *
 * Para automatizar: el valor normalizado está siempre en `data-value`, sin
 * importar si el campo tiene el foco o no.
 */
export function MontoInput({ value, onValueChange, moneda, onFocus, onBlur, ...rest }: MontoInputProps) {
  const [focused, setFocused] = useState(false);
  const parsed = parseMonto(value);
  const display = focused || parsed === null ? value : formatMonto(parsed);

  return (
    <div className={shared.montoInput}>
      {moneda && (
        <span className={shared.montoInputMoneda} aria-hidden="true">
          {moneda}
        </span>
      )}
      <input
        {...rest}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={display}
        data-value={value}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        onChange={(event) => onValueChange(event.target.value.replace(/\s/g, "").replace(",", "."))}
      />
    </div>
  );
}
