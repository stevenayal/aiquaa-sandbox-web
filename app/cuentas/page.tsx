"use client";

import Link from "next/link";
import useSWR from "swr";
import shared from "@/components/shared.module.css";
import { DataState } from "@/components/DataState";
import { ModuleHeader } from "@/components/ModuleHeader";
import { listCuentas } from "@/lib/api/cuentas";
import { useDefaultUsuarioId } from "@/lib/auth/useDefaultUsuarioId";
import { testIds } from "@/lib/testids";

const ids = testIds("cuentas");

export default function CuentasPage() {
  const [usuarioId, setUsuarioId] = useDefaultUsuarioId();

  const parsedUsuarioId = usuarioId.trim() ? Number(usuarioId) : undefined;
  const { data: cuentas, error, isLoading } = useSWR(["cuentas", parsedUsuarioId], () =>
    listCuentas(parsedUsuarioId),
  );

  return (
    <div className={shared.page}>
      <ModuleHeader moduleKey="cuentas" title="Cuentas">
        <div className={shared.field}>
          <label htmlFor="usuarioId">Filtrar por usuarioId</label>
          <input
            id="usuarioId"
            value={usuarioId}
            onChange={(e) => setUsuarioId(e.target.value)}
            placeholder="Todas"
            data-testid={ids.field("usuarioId")}
          />
        </div>
      </ModuleHeader>

      <DataState
        loading={isLoading}
        error={error ?? null}
        empty={(cuentas?.length ?? 0) === 0}
        loadingTestId={ids.loading}
        errorTestId={ids.error}
        emptyTestId={ids.empty}
      >
        <table className={shared.table} data-testid={ids.list}>
          <thead>
            <tr>
              <th>#</th>
              <th>Usuario</th>
              <th>Número</th>
              <th>Tipo</th>
              <th>Moneda</th>
              <th>Saldo</th>
              <th>Activa</th>
            </tr>
          </thead>
          <tbody>
            {cuentas?.map((cuenta) => (
              <tr key={cuenta.id} data-testid={ids.row(cuenta.id)}>
                <td>
                  <Link href={`/cuentas/${cuenta.id}`}>{cuenta.id}</Link>
                </td>
                <td>
                  <Link href={`/usuarios/${cuenta.usuario_id}`}>{cuenta.usuario_id}</Link>
                </td>
                <td>{cuenta.numero_cuenta}</td>
                <td>{cuenta.tipo_cuenta}</td>
                <td>{cuenta.moneda}</td>
                <td>{cuenta.saldo}</td>
                <td>{cuenta.activa ? "Sí" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </DataState>
    </div>
  );
}
