"use client";

import { useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import shared from "@/components/shared.module.css";
import { DataState } from "@/components/DataState";
import { ModuleHeader } from "@/components/ModuleHeader";
import { DeleteButton } from "@/components/DeleteButton";
import { getCuenta, actualizarCuenta, eliminarCuenta } from "@/lib/api/cuentas";
import { ApiError } from "@/lib/api/http";
import { testIds } from "@/lib/testids";

const ids = testIds("cuentas");
const TIPOS_CUENTA = ["ahorro", "corriente"] as const;
const MONEDAS = ["PYG", "USD"] as const;

export default function CuentaDetallePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = Number(params.id);

  const { data: cuenta, error, isLoading, mutate } = useSWR(["cuenta", id], () => getCuenta(id));

  const [tipoCuenta, setTipoCuenta] = useState<(typeof TIPOS_CUENTA)[number]>("ahorro");
  const [moneda, setMoneda] = useState<(typeof MONEDAS)[number]>("PYG");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  if (cuenta && !initialized) {
    setTipoCuenta(cuenta.tipo_cuenta);
    setMoneda(cuenta.moneda);
    setInitialized(true);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      const updated = await actualizarCuenta(id, { tipoCuenta, moneda });
      await mutate(updated, { revalidate: false });
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "No se pudo actualizar la cuenta.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={shared.page}>
      <ModuleHeader moduleKey="cuentas" title={`Cuenta #${id}`}>
        <Link href="/transferencias" className={shared.button}>
          Nueva transferencia
        </Link>
      </ModuleHeader>

      <DataState loading={isLoading} error={error ?? null} loadingTestId={ids.loading} errorTestId={ids.error}>
        {cuenta && (
          <>
            <dl className={`${shared.card} ${shared.detailGrid}`} data-testid={ids.detail}>
              <div className={shared.detailField}>
                <dt>Usuario</dt>
                <dd>
                  <Link href={`/usuarios/${cuenta.usuario_id}`}>{cuenta.usuario_id}</Link>
                </dd>
              </div>
              <div className={shared.detailField}>
                <dt>Número de cuenta</dt>
                <dd>{cuenta.numero_cuenta}</dd>
              </div>
              <div className={shared.detailField}>
                <dt>Tipo</dt>
                <dd>{cuenta.tipo_cuenta}</dd>
              </div>
              <div className={shared.detailField}>
                <dt>Moneda</dt>
                <dd>{cuenta.moneda}</dd>
              </div>
              <div className={shared.detailField}>
                <dt>Saldo</dt>
                <dd>{cuenta.saldo}</dd>
              </div>
              <div className={shared.detailField}>
                <dt>Activa</dt>
                <dd>{cuenta.activa ? "Sí" : "No"}</dd>
              </div>
            </dl>

            <form className={shared.formGrid} onSubmit={handleSubmit} data-testid={ids.rowAction(id, "edit-form")}>
              <h2>Editar cuenta</h2>
              <div className={shared.field}>
                <label htmlFor="tipoCuenta">Tipo</label>
                <select
                  id="tipoCuenta"
                  value={tipoCuenta}
                  onChange={(e) => setTipoCuenta(e.target.value as (typeof TIPOS_CUENTA)[number])}
                  data-testid={ids.field("tipoCuenta")}
                >
                  {TIPOS_CUENTA.map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {tipo}
                    </option>
                  ))}
                </select>
              </div>
              <div className={shared.field}>
                <label htmlFor="moneda">Moneda</label>
                <select
                  id="moneda"
                  value={moneda}
                  onChange={(e) => setMoneda(e.target.value as (typeof MONEDAS)[number])}
                  data-testid={ids.field("moneda")}
                >
                  {MONEDAS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              {formError && (
                <p role="alert" className={shared.fieldError} data-testid={ids.fieldError("tipoCuenta")}>
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
              title="¿Eliminar esta cuenta?"
              description="Se marcará como inactiva y dejará de listarse."
              label="Eliminar cuenta"
              onDelete={() => eliminarCuenta(id)}
              onDeleted={() => router.push("/cuentas")}
            />
          </>
        )}
      </DataState>
    </div>
  );
}
