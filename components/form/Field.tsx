"use client";

import type { ReactNode } from "react";
import shared from "@/components/shared.module.css";
import type { testIds } from "@/lib/testids";

/** Lo mínimo de `useFormState` que necesita un campo (métodos: aceptan el `K` de cada form). */
export interface FieldHost {
  errorOf(name: string): string | undefined;
  domId(name: string): string;
  ids: ReturnType<typeof testIds>;
}

interface FieldProps {
  form: FieldHost;
  name: string;
  label: ReactNode;
  /** Regla o ayuda visible. Si se pasa, el control tiene que recibir `fieldProps(name, { hint: true })`. */
  hint?: ReactNode;
  children: ReactNode;
}

/**
 * Label + control + ayuda + error de un campo. El error va con `role="alert"`
 * y queda enlazado al control por `aria-describedby` (lo arma `fieldProps`).
 */
export function Field({ form, name, label, hint, children }: FieldProps) {
  const id = form.domId(name);
  const error = form.errorOf(name);

  return (
    <div className={`${shared.field} ${error ? shared.fieldInvalid : ""}`}>
      <label htmlFor={id}>{label}</label>
      {children}
      {hint && (
        <p id={`${id}-hint`} className={shared.hint} data-testid={form.ids.hint(name)}>
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className={shared.fieldError} data-testid={form.ids.fieldError(name)}>
          {error}
        </p>
      )}
    </div>
  );
}

/** Error del formulario que no corresponde a un campo (ej. un 409 de regla de negocio). */
export function FormError({ form }: { form: FieldHost & { formError: string | null } }) {
  if (!form.formError) return null;
  return (
    <p role="alert" className={shared.formError} data-testid={form.ids.formError}>
      {form.formError}
    </p>
  );
}
