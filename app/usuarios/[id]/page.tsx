"use client";

import { useState, type FormEvent } from "react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import shared from "@/components/shared.module.css";
import { DataState } from "@/components/DataState";
import { getUsuario, actualizarKyc, type KycEstado } from "@/lib/api/usuarios";
import { ApiError } from "@/lib/api/http";
import { testIds } from "@/lib/testids";

const ids = testIds("usuarios");
const KYC_ESTADOS: KycEstado[] = ["pendiente", "verificado", "rechazado"];

function badgeClass(estado: KycEstado): string {
  if (estado === "verificado") return shared.badgeSuccess;
  if (estado === "rechazado") return shared.badgeDanger;
  return shared.badgeWarning;
}

export default function UsuarioDetallePage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  const { data: usuario, error, isLoading, mutate } = useSWR(["usuario", id], () => getUsuario(id));

  const [kycEstado, setKycEstado] = useState<KycEstado>("pendiente");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleKycSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      const updated = await actualizarKyc(id, kycEstado);
      await mutate(updated, { revalidate: false });
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "No se pudo actualizar el KYC.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={shared.page}>
      <div className={shared.header}>
        <h1>Usuario #{id}</h1>
      </div>

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
                <dt>Activo</dt>
                <dd>{usuario.activo ? "Sí" : "No"}</dd>
              </div>
              <div className={shared.detailField}>
                <dt>Documento</dt>
                <dd>
                  {usuario.documento_tipo} {usuario.documento_numero}
                </dd>
              </div>
              <div className={shared.detailField}>
                <dt>Fecha de nacimiento</dt>
                <dd>{usuario.fecha_nacimiento ?? "—"}</dd>
              </div>
              <div className={shared.detailField}>
                <dt>Dirección</dt>
                <dd>{usuario.direccion ?? "—"}</dd>
              </div>
              <div className={shared.detailField}>
                <dt>Estado KYC</dt>
                <dd>
                  <span className={badgeClass(usuario.kyc_estado)}>{usuario.kyc_estado}</span>
                </dd>
              </div>
            </dl>

            <form className={shared.formGrid} onSubmit={handleKycSubmit} data-testid={ids.rowAction(id, "kyc-form")}>
              <h2>Actualizar KYC</h2>
              <div className={shared.field}>
                <label htmlFor="kycEstado">Nuevo estado</label>
                <select
                  id="kycEstado"
                  value={kycEstado}
                  onChange={(e) => setKycEstado(e.target.value as KycEstado)}
                  data-testid={ids.field("kycEstado")}
                >
                  {KYC_ESTADOS.map((estado) => (
                    <option key={estado} value={estado}>
                      {estado}
                    </option>
                  ))}
                </select>
              </div>

              {formError && (
                <p role="alert" className={shared.fieldError} data-testid={ids.fieldError("kycEstado")}>
                  {formError}
                </p>
              )}

              <button
                type="submit"
                className={shared.button}
                disabled={submitting}
                data-testid={ids.rowAction(id, "kyc-submit")}
              >
                {submitting ? "Actualizando..." : "Actualizar KYC"}
              </button>
            </form>
          </>
        )}
      </DataState>
    </div>
  );
}
