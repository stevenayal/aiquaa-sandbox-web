"use client";

import { useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import shared from "@/components/shared.module.css";
import { DataState } from "@/components/DataState";
import { ModuleHeader } from "@/components/ModuleHeader";
import { DeleteButton } from "@/components/DeleteButton";
import { getRol, actualizarRol, eliminarRol, type Rol } from "@/lib/api/roles";
import { ApiError } from "@/lib/api/http";
import { testIds } from "@/lib/testids";
import { Fecha } from "@/components/Valores";

const ids = testIds("roles");
const NOMBRES: Rol["nombre"][] = ["admin", "soporte", "auditor", "operador"];

export default function RolDetallePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = Number(params.id);

  const { data: rol, error, isLoading, mutate } = useSWR(["rol", id], () => getRol(id));

  const [nombre, setNombre] = useState<Rol["nombre"]>("admin");
  const [descripcion, setDescripcion] = useState("");
  const [initialized, setInitialized] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (rol && !initialized) {
    setNombre(rol.nombre);
    setDescripcion(rol.descripcion ?? "");
    setInitialized(true);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      const updated = await actualizarRol(id, { nombre, descripcion: descripcion.trim() || undefined });
      await mutate(updated, { revalidate: false });
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "No se pudo actualizar el rol.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={shared.page}>
      <ModuleHeader moduleKey="roles" title={`Rol #${id}`} />

      <DataState loading={isLoading} error={error ?? null} loadingTestId={ids.loading} errorTestId={ids.error}>
        {rol && (
          <>
            <dl className={`${shared.card} ${shared.detailGrid}`} data-testid={ids.detail}>
              <div className={shared.detailField}>
                <dt>Nombre</dt>
                <dd>{rol.nombre}</dd>
              </div>
              <div className={shared.detailField}>
                <dt>Descripción</dt>
                <dd>{rol.descripcion ?? "—"}</dd>
              </div>
              <div className={shared.detailField}>
                <dt>Creado</dt>
                <dd>
                  <Fecha value={rol.created_at} conHora />
                </dd>
              </div>
            </dl>

            <form className={shared.formGrid} onSubmit={handleSubmit} data-testid={ids.rowAction(id, "edit-form")}>
              <h2>Editar rol</h2>
              <div className={shared.field}>
                <label htmlFor="nombre">Nombre</label>
                <select
                  id="nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value as Rol["nombre"])}
                  data-testid={ids.field("nombre")}
                >
                  {NOMBRES.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
              <div className={shared.field}>
                <label htmlFor="descripcion">Descripción</label>
                <input
                  id="descripcion"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  data-testid={ids.field("descripcion")}
                />
              </div>

              {formError && (
                <p role="alert" className={shared.fieldError} data-testid={ids.fieldError("nombre")}>
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
              title="¿Eliminar este rol?"
              description="Se marcará como inactivo y dejará de listarse. Las asignaciones existentes no se tocan."
              label="Eliminar rol"
              onDelete={() => eliminarRol(id)}
              onDeleted={() => router.push("/roles")}
            />
          </>
        )}
      </DataState>
    </div>
  );
}
