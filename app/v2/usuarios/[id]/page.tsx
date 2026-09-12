"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import shared from "@/components/shared.module.css";
import { DataState } from "@/components/DataState";
import { ModuleHeader } from "@/components/ModuleHeader";
import { DeleteButton } from "@/components/DeleteButton";
import { Field, FormError } from "@/components/form/Field";
import { useToast } from "@/components/Toast";
import { Fecha, Monto } from "@/components/Valores";
import { getUsuarioV2, actualizarUsuarioV2, eliminarUsuarioV2, type UsuarioV2 } from "@/lib/api/v2/usuarios";
import { useFormState, mensajeContiene } from "@/lib/forms/useFormState";
import { normalizeEmail } from "@/lib/format";
import { testIds } from "@/lib/testids";
import { useCuentasCliente } from "@/lib/v2/useEntidadesCliente";
import { email, longitud, opcional, requerido, telefonoPy, validarCampos } from "@/lib/validation/v2";

const ids = testIds("v2-usuarios");

export default function UsuarioV2DetallePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const id = Number(params.id);

  const { data: usuario, error, isLoading, mutate } = useSWR(["v2-usuario", id], () => getUsuarioV2(id));
  const { cuentas, isLoading: cuentasLoading } = useCuentasCliente(usuario ? id : undefined);

  return (
    <div className={shared.page}>
      <Link href="/v2/usuarios" className={shared.backLink}>
        ← Clientes
      </Link>
      <ModuleHeader moduleKey="v2-usuarios" title={usuario ? usuario.nombre : `Cliente #${id}`}>
        <Link href={`/v2/cuentas/new?usuarioId=${id}`} className={shared.buttonSecondary} data-testid={ids.rowAction(id, "abrir-cuenta")}>
          Abrir cuenta
        </Link>
      </ModuleHeader>

      <DataState loading={isLoading} error={error ?? null} loadingTestId={ids.loading} errorTestId={ids.error}>
        {usuario && (
          <>
            <dl className={`${shared.card} ${shared.detailGrid}`} data-testid={ids.detail}>
              <div className={shared.detailField}>
                <dt>N° de cliente</dt>
                <dd>{usuario.id}</dd>
              </div>
              <div className={shared.detailField}>
                <dt>Documento</dt>
                <dd data-testid="v2-usuarios-detail-documento">
                  {usuario.documento_tipo} {usuario.documento_numero}
                </dd>
              </div>
              <div className={shared.detailField}>
                <dt>Email</dt>
                <dd data-testid="v2-usuarios-detail-email">{usuario.email}</dd>
              </div>
              <div className={shared.detailField}>
                <dt>Celular</dt>
                <dd data-testid="v2-usuarios-detail-telefono">{usuario.telefono ?? "—"}</dd>
              </div>
              <div className={shared.detailField}>
                <dt>Cliente desde</dt>
                <dd>
                  <Fecha value={usuario.created_at} />
                </dd>
              </div>
            </dl>

            <div className={shared.twoColumns}>
              <EditarClienteForm
                key={usuario.id}
                usuario={usuario}
                onSaved={async (updated) => {
                  await mutate(updated, { revalidate: false });
                  toast.success("Datos de contacto actualizados.");
                }}
              />

              <section className={shared.section} aria-labelledby="productos-title">
                <h2 id="productos-title">Cuentas</h2>
                {cuentasLoading ? (
                  <p data-testid="v2-usuarios-cuentas-loading">Cargando cuentas...</p>
                ) : cuentas.length === 0 ? (
                  <p data-testid="v2-usuarios-cuentas-empty">Este cliente todavía no tiene cuentas.</p>
                ) : (
                  <ul className={shared.card} data-testid="v2-usuarios-cuentas">
                    {cuentas.map((c) => (
                      <li key={c.id} data-testid={`v2-usuarios-cuenta-${c.id}`}>
                        <Link href={`/v2/cuentas/${c.id}`}>N° {c.numero_cuenta}</Link> · {c.estado} ·{" "}
                        <Monto value={c.saldo} moneda={c.moneda} />
                      </li>
                    ))}
                  </ul>
                )}
                <div className={shared.formActions}>
                  <Link href={`/v2/tarjetas?usuarioId=${id}`} className={shared.buttonSecondary}>
                    Tarjetas
                  </Link>
                  <Link href={`/v2/prestamos?usuarioId=${id}`} className={shared.buttonSecondary}>
                    Préstamos
                  </Link>
                  <Link href={`/v2/beneficiarios?usuarioId=${id}`} className={shared.buttonSecondary}>
                    Beneficiarios
                  </Link>
                </div>
              </section>
            </div>

            <DeleteButton
              testId={ids.rowAction(id, "eliminar")}
              title="¿Dar de baja a este cliente?"
              description="Se marcará como inactivo y no va a poder iniciar sesión. Sus productos asociados no se borran."
              label="Dar de baja"
              onDelete={() => eliminarUsuarioV2(id)}
              onDeleted={() => {
                toast.success("Cliente dado de baja.");
                router.push("/v2/usuarios");
              }}
            />
          </>
        )}
      </DataState>
    </div>
  );
}

function EditarClienteForm({ usuario, onSaved }: { usuario: UsuarioV2; onSaved: (u: UsuarioV2) => Promise<void> }) {
  const [submitting, setSubmitting] = useState(false);
  const form = useFormState({
    initial: { nombre: usuario.nombre, email: usuario.email, telefono: usuario.telefono ?? "" },
    ids,
    idPrefix: "edit-",
    validate: (v) =>
      validarCampos(v, {
        nombre: [requerido("Ingresá el nombre completo."), longitud({ min: 3, max: 120, label: "El nombre" })],
        email: [requerido("Ingresá el email."), email],
        telefono: [opcional(telefonoPy)],
      }),
  });

  const sinCambios =
    form.values.nombre.trim() === usuario.nombre &&
    normalizeEmail(form.values.email) === usuario.email &&
    form.values.telefono.replace(/[\s-]/g, "") === (usuario.telefono ?? "");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form.validateFields()) return;
    setSubmitting(true);
    try {
      const updated = await actualizarUsuarioV2(usuario.id, {
        nombre: form.values.nombre.trim(),
        email: normalizeEmail(form.values.email),
        telefono: form.values.telefono.replace(/[\s-]/g, "") || undefined,
      });
      await onSaved(updated);
    } catch (err) {
      form.applyApiError(
        err,
        [{ field: "email", when: mensajeContiene("email"), message: "Ya existe otro cliente con este email." }],
        "No se pudo actualizar el cliente.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className={shared.formGrid} onSubmit={handleSubmit} noValidate data-testid={ids.rowAction(usuario.id, "edit-form")}>
      <h2>Datos de contacto</h2>
      <Field form={form} name="nombre" label="Nombre y apellido">
        <input {...form.fieldProps("nombre")} />
      </Field>
      <Field form={form} name="email" label="Email">
        <input {...form.fieldProps("email")} type="email" />
      </Field>
      <Field form={form} name="telefono" label="Celular" hint="Dejalo vacío para quitarlo.">
        <input {...form.fieldProps("telefono", { hint: true })} type="tel" />
      </Field>
      <div className={shared.field}>
        <label htmlFor="edit-documento">Documento</label>
        <input
          id="edit-documento"
          value={`${usuario.documento_tipo} ${usuario.documento_numero}`}
          readOnly
          aria-describedby="edit-documento-hint"
          data-testid={ids.field("documento")}
        />
        <p id="edit-documento-hint" className={shared.hint} data-testid={ids.hint("documento")}>
          No se puede modificar: identifica al cliente ante el banco.
        </p>
      </div>

      <FormError form={form} />

      <button
        type="submit"
        className={shared.button}
        disabled={submitting || sinCambios}
        data-testid={ids.rowAction(usuario.id, "edit-submit")}
      >
        {submitting ? "Guardando..." : "Guardar cambios"}
      </button>
    </form>
  );
}
