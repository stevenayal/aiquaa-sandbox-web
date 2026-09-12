"use client";

import type { ReactNode } from "react";
import shared from "@/components/shared.module.css";
import type { FieldHost } from "./Field";

interface Option {
  value: string;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
}

interface RadioCardsProps {
  form: FieldHost & { values: Record<string, string>; setValue(name: string, value: string): void };
  name: string;
  legend: ReactNode;
  options: Option[];
}

/**
 * Grupo de radios presentado como tarjetas (`<fieldset>` + `<input type="radio">`
 * reales). Cada opción: `{modulo}-field-{name}-{value}`.
 */
export function RadioCards({ form, name, legend, options }: RadioCardsProps) {
  const error = form.errorOf(name);
  const errorId = `${form.domId(name)}-error`;
  return (
    <fieldset
      className={shared.radioCards}
      id={form.domId(name)}
      tabIndex={-1}
      aria-describedby={error ? errorId : undefined}
      data-testid={form.ids.field(name)}
    >
      <legend>{legend}</legend>
      {options.map((option) => (
        <label key={option.value} className={shared.radioCard}>
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={form.values[name] === option.value}
            disabled={option.disabled}
            onChange={() => form.setValue(name, option.value)}
            data-testid={`${form.ids.field(name)}-${option.value}`}
          />
          <span className={shared.radioCardText}>
            <strong>{option.label}</strong>
            {option.description && <span className={shared.hint}>{option.description}</span>}
          </span>
        </label>
      ))}
      {error && (
        <p id={errorId} role="alert" className={shared.fieldError} data-testid={form.ids.fieldError(name)}>
          {error}
        </p>
      )}
    </fieldset>
  );
}

/** Checkbox obligatorio (términos, declaraciones). Guarda `"true"` o `""` para validar con `requerido`. */
export function CheckboxField({
  form,
  name,
  children,
}: {
  form: FieldHost & { values: Record<string, string>; setValue(name: string, value: string): void };
  name: string;
  children: ReactNode;
}) {
  const id = form.domId(name);
  const error = form.errorOf(name);
  return (
    <div className={error ? shared.fieldInvalid : undefined}>
      <label className={shared.checkboxField} htmlFor={id}>
        <input
          id={id}
          type="checkbox"
          checked={form.values[name] === "true"}
          onChange={(e) => form.setValue(name, e.target.checked ? "true" : "")}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          data-testid={form.ids.field(name)}
        />
        <span>{children}</span>
      </label>
      {error && (
        <p id={`${id}-error`} role="alert" className={shared.fieldError} data-testid={form.ids.fieldError(name)}>
          {error}
        </p>
      )}
    </div>
  );
}
