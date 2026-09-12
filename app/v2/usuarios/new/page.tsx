"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import shared from "@/components/shared.module.css";
import { ModuleHeader } from "@/components/ModuleHeader";
import { Stepper } from "@/components/Stepper";
import { Field, FormError } from "@/components/form/Field";
import { WizardActions } from "@/components/form/WizardActions";
import { CheckboxField } from "@/components/form/RadioCards";
import { useToast } from "@/components/Toast";
import { crearUsuarioV2, type DocumentoTipo } from "@/lib/api/v2/usuarios";
import { useFormState, mensajeContiene } from "@/lib/forms/useFormState";
import { normalizeEmail } from "@/lib/format";
import { testIds } from "@/lib/testids";
import {
  DOCUMENTO_HINTS,
  documento,
  email,
  longitud,
  opcional,
  requerido,
  telefonoPy,
  validarCampos,
} from "@/lib/validation/v2";

const ids = testIds("v2-usuarios");
const PASOS = ["Datos personales", "Documento y contacto", "Revisión"];
const DOCUMENTO_TIPOS: { value: DocumentoTipo; label: string }[] = [
  { value: "CI", label: "Cédula de identidad" },
  { value: "RUC", label: "RUC" },
  { value: "pasaporte", label: "Pasaporte" },
];

// Qué campos valida cada paso antes de dejar avanzar.
const CAMPOS_POR_PASO = [
  ["nombre", "email"],
  ["documentoTipo", "documentoNumero", "telefono"],
  ["terminos"],
] as const;

type Valores = {
  nombre: string;
  email: string;
  documentoTipo: string;
  documentoNumero: string;
  telefono: string;
  terminos: string;
};

export default function NuevoUsuarioV2Page() {
  const router = useRouter();
  const toast = useToast();
  const [paso, setPaso] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const form = useFormState<Valores>({
    initial: { nombre: "", email: "", documentoTipo: "CI", documentoNumero: "", telefono: "", terminos: "" },
    ids,
    validate: (v) =>
      validarCampos(v, {
        nombre: [requerido("Ingresá el nombre completo."), longitud({ min: 3, max: 120, label: "El nombre" })],
        email: [requerido("Ingresá el email."), email],
        documentoNumero: [documento(v.documentoTipo as DocumentoTipo)],
        telefono: [opcional(telefonoPy)],
        terminos: [requerido("Tenés que aceptar los términos y condiciones para continuar.")],
      }),
  });

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form.validateFields([...CAMPOS_POR_PASO[paso]])) return;

    if (paso < PASOS.length - 1) {
      setPaso(paso + 1);
      return;
    }

    setSubmitting(true);
    const { values } = form;
    try {
      const usuario = await crearUsuarioV2({
        nombre: values.nombre.trim(),
        email: normalizeEmail(values.email),
        documentoTipo: values.documentoTipo as DocumentoTipo,
        documentoNumero: values.documentoNumero.trim(),
        telefono: values.telefono.replace(/[\s-]/g, "") || undefined,
      });
      toast.success(`Cliente ${usuario.nombre} dado de alta.`);
      router.push(`/v2/usuarios/${usuario.id}`);
    } catch (err) {
      // Email y documento son UNIQUE en la base: el 409 vuelve al paso del campo duplicado.
      const campo = form.applyApiError(
        err,
        [
          { field: "email", when: mensajeContiene("email"), message: "Ya existe un cliente con este email." },
          {
            field: "documentoNumero",
            when: mensajeContiene("documento"),
            message: "Ya existe un cliente con este número de documento.",
          },
        ],
        "No se pudo dar de alta al cliente.",
      );
      if (campo === "email") setPaso(0);
      if (campo === "documentoNumero") setPaso(1);
      setSubmitting(false);
    }
  }

  const tipo = form.values.documentoTipo as DocumentoTipo;

  return (
    <div className={shared.page}>
      <ModuleHeader moduleKey="v2-usuarios" title="Alta de cliente" />
      <Stepper steps={PASOS} current={paso} testId="v2-usuarios" />

      <form className={shared.formGrid} onSubmit={handleSubmit} noValidate data-testid={ids.form}>
        {paso === 0 && (
          <>
            <Field form={form} name="nombre" label="Nombre y apellido">
              <input {...form.fieldProps("nombre")} autoComplete="name" />
            </Field>
            <Field form={form} name="email" label="Email" hint="Lo usa el cliente para iniciar sesión.">
              <input {...form.fieldProps("email", { hint: true })} type="email" autoComplete="email" />
            </Field>
          </>
        )}

        {paso === 1 && (
          <>
            <Field form={form} name="documentoTipo" label="Tipo de documento">
              <select {...form.fieldProps("documentoTipo")}>
                {DOCUMENTO_TIPOS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field form={form} name="documentoNumero" label="Número de documento" hint={DOCUMENTO_HINTS[tipo]}>
              <input {...form.fieldProps("documentoNumero", { hint: true })} />
            </Field>
            <Field form={form} name="telefono" label="Celular (opcional)" hint="Ej. 0981123456">
              <input {...form.fieldProps("telefono", { hint: true })} type="tel" autoComplete="tel" />
            </Field>
          </>
        )}

        {paso === 2 && (
          <>
            <dl className={shared.summary} data-testid="v2-usuarios-resumen">
              <dt>Nombre</dt>
              <dd data-testid="v2-usuarios-resumen-nombre">{form.values.nombre.trim()}</dd>
              <dt>Email</dt>
              <dd data-testid="v2-usuarios-resumen-email">{normalizeEmail(form.values.email)}</dd>
              <dt>Documento</dt>
              <dd data-testid="v2-usuarios-resumen-documento">
                {tipo} {form.values.documentoNumero.trim()}
              </dd>
              <dt>Celular</dt>
              <dd data-testid="v2-usuarios-resumen-telefono">{form.values.telefono.replace(/[\s-]/g, "") || "—"}</dd>
            </dl>
            <p className={shared.hint}>El documento no se puede modificar después del alta.</p>

            <CheckboxField form={form} name="terminos">
              Acepto los términos y condiciones y la política de privacidad del banco.
            </CheckboxField>
          </>
        )}

        <FormError form={form} />

        <WizardActions
          ids={ids}
          onBack={paso > 0 ? () => setPaso(paso - 1) : undefined}
          nextLabel={paso === PASOS.length - 1 ? "Dar de alta" : "Continuar"}
          submitting={submitting}
          submittingLabel="Dando de alta..."
          isLast={paso === PASOS.length - 1}
        />
      </form>
    </div>
  );
}
