"use client";

import { useState, type ChangeEvent } from "react";
import { ApiError } from "@/lib/api/http";
import type { FieldErrors } from "@/lib/validation/v2";
import type { testIds } from "@/lib/testids";

type Ids = ReturnType<typeof testIds>;

interface Options<T extends Record<string, string>> {
  initial: T;
  /** Errores de validación para los valores actuales (se recalcula en cada render). */
  validate: (values: T) => FieldErrors<Extract<keyof T, string>>;
  ids: Ids;
  /** Prefijo del `id` HTML, para cuando hay dos forms con campos de igual nombre en la misma página. */
  idPrefix?: string;
}

/** Cómo llevar un error de la API a un campo: por código, status o texto del mensaje. */
export interface ApiErrorRule<K extends string> {
  field: K;
  when: (error: ApiError) => boolean;
}

export const mensajeContiene =
  (...fragmentos: string[]) =>
  (error: ApiError) =>
    fragmentos.some((f) => error.message.toLowerCase().includes(f.toLowerCase()));

/**
 * Estado de un formulario con validación por campo:
 * - el error de un campo aparece recién cuando se sale de él (blur) o al
 *   intentar enviar — no mientras se escribe por primera vez;
 * - una vez visible, se actualiza con cada tecla (desaparece al corregirlo);
 * - al enviar con errores, el foco va al primer campo inválido.
 *
 * Los errores que devuelve la API se pueden asignar a un campo
 * (`applyApiError`) o quedan como error general del form.
 */
export function useFormState<T extends Record<string, string>>({ initial, validate, ids, idPrefix = "" }: Options<T>) {
  type K = Extract<keyof T, string>;

  const [values, setValues] = useState<T>(initial);
  const [touched, setTouched] = useState<Set<K>>(new Set());
  const [serverErrors, setServerErrors] = useState<FieldErrors<K>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const validationErrors = validate(values);

  function errorOf(name: K): string | undefined {
    return serverErrors[name] ?? (touched.has(name) ? validationErrors[name] : undefined);
  }

  function domId(name: K): string {
    return `${idPrefix}${name}`;
  }

  function setValue(name: K, value: string) {
    setValues((prev) => ({ ...prev, [name]: value }));
    setServerErrors((prev) => {
      if (!(name in prev)) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
    setFormError(null);
  }

  function touch(name: K) {
    setTouched((prev) => (prev.has(name) ? prev : new Set(prev).add(name)));
  }

  /** Marca los campos como tocados y dice si pasan; si no, enfoca el primero que falla. */
  function validateFields(fields: K[] = Object.keys(values) as K[]): boolean {
    setTouched((prev) => new Set([...prev, ...fields]));
    const invalid = fields.find((f) => validationErrors[f]);
    if (invalid) {
      // El error recién se pinta en el próximo render; el foco puede ir ya.
      document.getElementById(domId(invalid))?.focus();
      return false;
    }
    return true;
  }

  /**
   * Asigna un error de la API al primer campo cuya regla coincida. Devuelve el
   * campo, o `null` si quedó como error general del formulario.
   */
  function applyApiError(error: unknown, rules: ApiErrorRule<K>[] = [], fallback = "No se pudo completar la operación."): K | null {
    if (!(error instanceof ApiError)) {
      setFormError(fallback);
      return null;
    }
    const rule = rules.find((r) => r.when(error));
    if (!rule) {
      setFormError(error.message);
      return null;
    }
    setServerErrors((prev) => ({ ...prev, [rule.field]: error.message }));
    document.getElementById(domId(rule.field))?.focus();
    return rule.field;
  }

  function reset(next: T = initial) {
    setValues(next);
    setTouched(new Set());
    setServerErrors({});
    setFormError(null);
  }

  function describedBy(name: K, hint: boolean): string | undefined {
    const parts = [hint ? `${domId(name)}-hint` : null, errorOf(name) ? `${domId(name)}-error` : null].filter(Boolean);
    return parts.length ? parts.join(" ") : undefined;
  }

  /** Props para `<input>`, `<select>` o `<textarea>` nativos. */
  function fieldProps(name: K, { hint = false }: { hint?: boolean } = {}) {
    return {
      id: domId(name),
      name,
      value: values[name],
      onChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
        setValue(name, event.target.value),
      onBlur: () => touch(name),
      "aria-invalid": errorOf(name) ? true : undefined,
      "aria-describedby": describedBy(name, hint),
      "data-testid": ids.field(name),
    };
  }

  /** Props para controles propios (`MontoInput`) que reportan el valor ya normalizado. */
  function controlProps(name: K, { hint = false }: { hint?: boolean } = {}) {
    const { onChange, ...rest } = fieldProps(name, { hint });
    void onChange;
    return { ...rest, onValueChange: (value: string) => setValue(name, value) };
  }

  return {
    values,
    setValue,
    touch,
    errorOf,
    domId,
    ids,
    validationErrors,
    isValid: Object.keys(validationErrors).length === 0,
    validateFields,
    applyApiError,
    formError,
    setFormError,
    reset,
    fieldProps,
    controlProps,
  };
}

export type FormState<T extends Record<string, string>> = ReturnType<typeof useFormState<T>>;
