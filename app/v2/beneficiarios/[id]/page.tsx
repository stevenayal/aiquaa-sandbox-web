"use client";

import { useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import shared from "@/components/shared.module.css";
import { DataState } from "@/components/DataState";
import { ModuleHeader } from "@/components/ModuleHeader";
import { DeleteButton } from "@/components/DeleteButton";
import { getBeneficiarioV2, actualizarBeneficiarioV2, eliminarBeneficiarioV2 } from "@/lib/api/v2/beneficiarios";
import { ApiError } from "@/lib/api/http";
import { testIds } from "@/lib/testids";

const ids = testIds("v2-beneficiarios");

export default function BeneficiarioV2DetallePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = Number(params.id);

  const { data: beneficiario, error, isLoading, mutate } = useSWR(["v2-beneficiario", id], () =>
    getBeneficiarioV2(id),
  );

  const [nombre, setNombre] = useState("");
  const [banco, setBanco] = useState("");
  const [numeroCuenta, setNumeroCuenta] = useState("");
  const [alias, setAlias] = useState("");
  const [initialized, setInitialized] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (beneficiario && !initialized) {
    setNombre(beneficiario.nombre);
    setBanco(beneficiario.banco);
    setNumeroCuenta(beneficiario.numero_cuenta);
    setAlias(beneficiario.alias ?? "");
    setInitialized(true);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      const updated = await actualizarBeneficiarioV2(id, {
        nombre,
        banco,
        numeroCuenta,
        alias: alias.trim() || undefined,
      });
      await mutate(updated, { revalidate: false });
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "No se pudo actualizar el beneficiario.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={shared.page}>
      <ModuleHeader moduleKey="v2-beneficiarios" title={`Beneficiario #${id}`} />

      <DataState loading={isLoading} error={error ?? null} loadingTestId={ids.loading} errorTestId={ids.error}>
        {beneficiario && (
          <>
            <dl className={`${shared.card} ${shared.detailGrid}`} data-testid={ids.detail}>
              <div className={shared.detailField}>
                <dt>Nombre</dt>
                <dd>{beneficiario.nombre}</dd>
              </div>
              <div className={shared.detailField}>
                <dt>Banco</dt>
                <dd>{beneficiario.banco}</dd>
              </div>
              <div className={shared.detailField}>
                <dt>Número de cuenta</dt>
                <dd>{beneficiario.numero_cuenta}</dd>
              </div>
              <div className={shared.detailField}>
                <dt>Alias</dt>
                <dd>{beneficiario.alias ?? "—"}</dd>
              </div>
              <div className={shared.detailField}>
                <dt>Activo</dt>
                <dd>{beneficiario.activo ? "Sí" : "No"}</dd>
              </div>
            </dl>

            <form className={shared.formGrid} onSubmit={handleSubmit} data-testid={ids.rowAction(id, "edit-form")}>
              <h2>Editar beneficiario</h2>
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
                <label htmlFor="banco">Banco</label>
                <input
                  id="banco"
                  required
                  value={banco}
                  onChange={(e) => setBanco(e.target.value)}
                  data-testid={ids.field("edit-banco")}
                />
              </div>
              <div className={shared.field}>
                <label htmlFor="numeroCuenta">Número de cuenta</label>
                <input
                  id="numeroCuenta"
                  required
                  value={numeroCuenta}
                  onChange={(e) => setNumeroCuenta(e.target.value)}
                  data-testid={ids.field("edit-numeroCuenta")}
                />
              </div>
              <div className={shared.field}>
                <label htmlFor="alias">Alias</label>
                <input
                  id="alias"
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                  data-testid={ids.field("edit-alias")}
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
              title="¿Eliminar este beneficiario?"
              description="Se marcará como inactivo y dejará de listarse."
              label="Eliminar beneficiario"
              onDelete={() => eliminarBeneficiarioV2(id)}
              onDeleted={() => router.push("/v2/beneficiarios")}
            />
          </>
        )}
      </DataState>
    </div>
  );
}
