"use client";

import { useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import shared from "@/components/shared.module.css";
import { DataState } from "@/components/DataState";
import { ModuleHeader } from "@/components/ModuleHeader";
import { DeleteButton } from "@/components/DeleteButton";
import { getSesion, actualizarSesion, eliminarSesion } from "@/lib/api/sesiones";
import { ApiError } from "@/lib/api/http";
import { testIds } from "@/lib/testids";
import { Fecha } from "@/components/Valores";

const ids = testIds("sesiones");

export default function SesionDetallePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = Number(params.id);

  const { data: sesion, error, isLoading, mutate } = useSWR(["sesion", id], () => getSesion(id));

  const [ip, setIp] = useState("");
  const [userAgent, setUserAgent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      const updated = await actualizarSesion(id, {
        ip: ip.trim() || undefined,
        userAgent: userAgent.trim() || undefined,
      });
      await mutate(updated, { revalidate: false });
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "No se pudo actualizar la sesión.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={shared.page}>
      <ModuleHeader moduleKey="sesiones" title={`Sesión #${id}`} />

      <DataState loading={isLoading} error={error ?? null} loadingTestId={ids.loading} errorTestId={ids.error}>
        {sesion && (
          <>
            <dl className={`${shared.card} ${shared.detailGrid}`} data-testid={ids.detail}>
              <div className={shared.detailField}>
                <dt>Usuario</dt>
                <dd>
                  <Link href={`/usuarios/${sesion.usuario_id}`}>{sesion.usuario_id}</Link>
                </dd>
              </div>
              <div className={shared.detailField}>
                <dt>Tipo de evento</dt>
                <dd>{sesion.tipo_evento}</dd>
              </div>
              <div className={shared.detailField}>
                <dt>Exitoso</dt>
                <dd>
                  <span className={sesion.exitoso ? shared.badgeSuccess : shared.badgeDanger}>
                    {sesion.exitoso ? "Sí" : "No"}
                  </span>
                </dd>
              </div>
              <div className={shared.detailField}>
                <dt>IP</dt>
                <dd>{sesion.ip ?? "—"}</dd>
              </div>
              <div className={shared.detailField}>
                <dt>Fecha</dt>
                <dd>
                  <Fecha value={sesion.created_at} conHora />
                </dd>
              </div>
            </dl>

            <form className={shared.formGrid} onSubmit={handleSubmit} data-testid={ids.rowAction(id, "edit-form")}>
              <h2>Editar metadatos</h2>
              <div className={shared.field}>
                <label htmlFor="ip">IP</label>
                <input
                  id="ip"
                  value={ip}
                  onChange={(e) => setIp(e.target.value)}
                  placeholder={sesion.ip ?? ""}
                  data-testid={ids.field("ip")}
                />
              </div>
              <div className={shared.field}>
                <label htmlFor="userAgent">User agent</label>
                <input
                  id="userAgent"
                  value={userAgent}
                  onChange={(e) => setUserAgent(e.target.value)}
                  data-testid={ids.field("userAgent")}
                />
              </div>

              {formError && (
                <p role="alert" className={shared.fieldError} data-testid={ids.fieldError("ip")}>
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
              title="¿Eliminar este evento de sesión?"
              description="Es un registro de auditoría: se marcará como inactivo y dejará de listarse."
              label="Eliminar sesión"
              onDelete={() => eliminarSesion(id)}
              onDeleted={() => router.push("/sesiones")}
            />
          </>
        )}
      </DataState>
    </div>
  );
}
