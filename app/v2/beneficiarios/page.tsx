"use client";

import Link from "next/link";
import useSWR from "swr";
import shared from "@/components/shared.module.css";
import { DataState } from "@/components/DataState";
import { ModuleHeader } from "@/components/ModuleHeader";
import { listBeneficiariosV2 } from "@/lib/api/v2/beneficiarios";
import { useDefaultUsuarioId } from "@/lib/auth/useDefaultUsuarioId";
import { testIds } from "@/lib/testids";

const ids = testIds("v2-beneficiarios");

export default function BeneficiariosV2Page() {
  const [usuarioId, setUsuarioId] = useDefaultUsuarioId();

  const parsedUsuarioId = usuarioId.trim() ? Number(usuarioId) : undefined;
  const { data: beneficiarios, error, isLoading } = useSWR(["v2-beneficiarios", parsedUsuarioId], () =>
    listBeneficiariosV2(parsedUsuarioId),
  );

  return (
    <div className={shared.page}>
      <ModuleHeader moduleKey="v2-beneficiarios" title="Beneficiarios">
        <div className={shared.field}>
          <label htmlFor="usuarioId">Filtrar por usuarioId</label>
          <input
            id="usuarioId"
            value={usuarioId}
            onChange={(e) => setUsuarioId(e.target.value)}
            placeholder="Todos"
            data-testid={ids.field("usuarioId")}
          />
        </div>
        <Link href="/v2/beneficiarios/new" className={shared.button}>
          Nuevo beneficiario
        </Link>
      </ModuleHeader>

      <DataState
        loading={isLoading}
        error={error ?? null}
        empty={(beneficiarios?.length ?? 0) === 0}
        count={beneficiarios?.length ?? 0}
        countTestId={ids.count}
        loadingTestId={ids.loading}
        errorTestId={ids.error}
        emptyTestId={ids.empty}
      >
        <table className={shared.table} data-testid={ids.list}>
          <thead>
            <tr>
              <th>#</th>
              <th>Usuario</th>
              <th>Nombre</th>
              <th>Banco</th>
              <th>Número de cuenta</th>
              <th>Alias</th>
              <th>Activo</th>
            </tr>
          </thead>
          <tbody>
            {beneficiarios?.map((beneficiario) => (
              <tr key={beneficiario.id} data-testid={ids.row(beneficiario.id)}>
                <td>
                  <Link href={`/v2/beneficiarios/${beneficiario.id}`}>{beneficiario.id}</Link>
                </td>
                <td>
                  <Link href={`/v2/usuarios/${beneficiario.usuario_id}`}>{beneficiario.usuario_id}</Link>
                </td>
                <td>{beneficiario.nombre}</td>
                <td>{beneficiario.banco}</td>
                <td>{beneficiario.numero_cuenta}</td>
                <td>{beneficiario.alias ?? "—"}</td>
                <td>{beneficiario.activo ? "Sí" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </DataState>
    </div>
  );
}
