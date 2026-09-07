"use client";

import { useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import shared from "@/components/shared.module.css";
import { DataState } from "@/components/DataState";
import { ModuleHeader } from "@/components/ModuleHeader";
import { DeleteButton } from "@/components/DeleteButton";
import { getUsuarioV2, actualizarUsuarioV2, eliminarUsuarioV2 } from "@/lib/api/v2/usuarios";
import { normalizeEmail } from "@/lib/format";
import { ApiError } from "@/lib/api/http";
import { testIds } from "@/lib/testids";

const ids = testIds("v2-usuarios");

export default function UsuarioV2DetallePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = Number(params.id);

  const { data: usuario, error, isLoading, mutate } = useSWR(["v2-usuario", id], () => getUsuarioV2(id));

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [initialized, setInitialized] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (usuario && !initialized) {
    setNombre(usuario.nombre);
    setEmail(usuario.email);
    setTelefono(usuario.telefono ?? "");
    setInitialized(true);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      const updated = await actualizarUsuarioV2(id, {
        nombre,
        email: normalizeEmail(email),
        telefono: telefono.trim() || undefined,
      });
      await mutate(updated, { revalidate: false });
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "No se pudo actualizar el cliente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={shared.page}>
      <ModuleHeader moduleKey="v2-usuarios" title={`Cliente #${id}`} />

      <DataState loading={isLoading} error={error ?? null} loadingTestId={ids.loading} errorTestId={ids.error}>
        {usuario && (
          <>
            <dl className={`${shared.card} ${shared.detailGrid}`} data-testid={ids.detail}>
              <div className={shared.detailField}>
                <dt>Nombre</dt>
                <dd>{usuario.nombre}</dd>
              </div>
              <div className={shared.detailField}>
                <dt>Email</dt>
                <dd>{usuario.email}</dd>
              </div>
              <div className={shared.detailField}>
                <dt>Documento</dt>
                <dd>
                  {usuario.documento_tipo} {usuario.documento_numero}
                </dd>
              </div>
              <div className={shared.detailField}>
                <dt>Teléfono</dt>
                <dd>{usuario.telefono ?? "—"}</dd>
              </div>
              <div className={shared.detailField}>
                <dt>Activo</dt>
                <dd>{usuario.activo ? "Sí" : "No"}</dd>
              </div>
            </dl>

            <form className={shared.formGrid} onSubmit={handleSubmit} data-testid={ids.rowAction(id, "edit-form")}>
              <h2>Editar datos de contacto</h2>
              <div className={shared.field}>
                <label htmlFor="nombre">Nombre</label>
                <input
                  id="nombre"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  data-testid={ids.field("edit-nombre")}
                />
              </div>
              <div className={shared.field}>
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  data-testid={ids.field("edit-email")}
                />
              </div>
              <div className={shared.field}>
                <label htmlFor="telefono">Teléfono</label>
                <input
                  id="telefono"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  data-testid={ids.field("edit-telefono")}
                />
              </div>

              {formError && (
                <p role="alert" className={shared.fieldError} data-testid={ids.fieldError("edit-nombre")}>
                  {formError}
                </p>
              )}

              <button
                type="submit"
                className={shared.button}
                disabled={submitting}
                data-testid={ids.rowAction(id, "edit-submit")}
              >
                {submitting ? "Guardando..." : "Guardar cambios"}
              </button>
            </form>

            <DeleteButton
              testId={ids.rowAction(id, "eliminar")}
              title="¿Eliminar este cliente?"
              description="Se marcará como inactivo. Sus cuentas, tarjetas y demás productos asociados no se borran."
              label="Eliminar cliente"
              onDelete={() => eliminarUsuarioV2(id)}
              onDeleted={() => router.push("/v2/usuarios")}
            />
          </>
        )}
      </DataState>
    </div>
  );
}
