"use client";

import { useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import shared from "@/components/shared.module.css";
import { DataState } from "@/components/DataState";
import { ModuleHeader } from "@/components/ModuleHeader";
import { DeleteButton } from "@/components/DeleteButton";
import {
  getNotificacion,
  actualizarNotificacion,
  eliminarNotificacion,
  type NotificacionCanal,
} from "@/lib/api/notificaciones";
import { ApiError } from "@/lib/api/http";
import { testIds } from "@/lib/testids";

const ids = testIds("notificaciones");
const CANALES: NotificacionCanal[] = ["push", "email", "sms"];

export default function NotificacionDetallePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = Number(params.id);

  const { data: notificacion, error, isLoading, mutate } = useSWR(["notificacion", id], () =>
    getNotificacion(id),
  );

  const [canal, setCanal] = useState<NotificacionCanal>("push");
  const [asunto, setAsunto] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  if (notificacion && !initialized) {
    setCanal(notificacion.canal);
    setAsunto(notificacion.asunto);
    setMensaje(notificacion.mensaje);
    setInitialized(true);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      const updated = await actualizarNotificacion(id, { canal, asunto, mensaje });
      await mutate(updated, { revalidate: false });
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "No se pudo actualizar la notificación.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={shared.page}>
      <ModuleHeader moduleKey="notificaciones" title={`Notificación #${id}`} />

      <DataState loading={isLoading} error={error ?? null} loadingTestId={ids.loading} errorTestId={ids.error}>
        {notificacion && (
          <>
            <dl className={`${shared.card} ${shared.detailGrid}`} data-testid={ids.detail}>
              <div className={shared.detailField}>
                <dt>Usuario</dt>
                <dd>
                  <Link href={`/usuarios/${notificacion.usuario_id}`}>{notificacion.usuario_id}</Link>
                </dd>
              </div>
              <div className={shared.detailField}>
                <dt>Canal</dt>
                <dd>{notificacion.canal}</dd>
              </div>
              <div className={shared.detailField}>
                <dt>Asunto</dt>
                <dd>{notificacion.asunto}</dd>
              </div>
              <div className={shared.detailField}>
                <dt>Mensaje</dt>
                <dd>{notificacion.mensaje}</dd>
              </div>
              <div className={shared.detailField}>
                <dt>Leído</dt>
                <dd>{notificacion.leido ? "Sí" : "No"}</dd>
              </div>
              <div className={shared.detailField}>
                <dt>Estado</dt>
                <dd>{notificacion.estado}</dd>
              </div>
              <div className={shared.detailField}>
                <dt>Fecha</dt>
                <dd>{new Date(notificacion.created_at).toLocaleString()}</dd>
              </div>
            </dl>

            <form className={shared.formGrid} onSubmit={handleSubmit} data-testid={ids.rowAction(id, "edit-form")}>
              <h2>Editar notificación</h2>
              <div className={shared.field}>
                <label htmlFor="canal">Canal</label>
                <select
                  id="canal"
                  value={canal}
                  onChange={(e) => setCanal(e.target.value as NotificacionCanal)}
                  data-testid={ids.field("canal")}
                >
                  {CANALES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className={shared.field}>
                <label htmlFor="asunto">Asunto</label>
                <input
                  id="asunto"
                  required
                  value={asunto}
                  onChange={(e) => setAsunto(e.target.value)}
                  data-testid={ids.field("asunto")}
                />
              </div>
              <div className={shared.field}>
                <label htmlFor="mensaje">Mensaje</label>
                <textarea
                  id="mensaje"
                  required
                  value={mensaje}
                  onChange={(e) => setMensaje(e.target.value)}
                  data-testid={ids.field("mensaje")}
                />
              </div>

              {formError && (
                <p role="alert" className={shared.fieldError} data-testid={ids.fieldError("asunto")}>
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
              title="¿Eliminar esta notificación?"
              description="Se marcará como inactiva y dejará de listarse."
              label="Eliminar notificación"
              onDelete={() => eliminarNotificacion(id)}
              onDeleted={() => router.push("/notificaciones")}
            />
          </>
        )}
      </DataState>
    </div>
  );
}
