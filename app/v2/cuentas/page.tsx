"use client";

import Link from "next/link";
import useSWR from "swr";
import shared from "@/components/shared.module.css";
import { DataState } from "@/components/DataState";
import { ModuleHeader } from "@/components/ModuleHeader";
import { ListToolbar, Pagination, SearchInput, SortableTh } from "@/components/list/ListControls";
import { FiltroCliente } from "@/components/v2/FiltroCliente";
import { Monto } from "@/components/Valores";
import { listCuentasV2, type CuentaV2, type EstadoCuentaV2 } from "@/lib/api/v2/cuentas";
import { useListControls, useQueryParam } from "@/lib/list/useListControls";
import { testIds } from "@/lib/testids";
import { round2 } from "@/lib/v2/reglas";
import { ESTADO_CUENTA_LABEL, TIPO_CUENTA_LABEL, badgeFor } from "@/lib/v2/labels";
import { useFiltroCliente } from "@/lib/v2/useFiltroCliente";

const ids = testIds("v2-cuentas");
const ESTADOS: EstadoCuentaV2[] = ["activa", "bloqueada", "cerrada"];

export default function CuentasV2Page() {
  const titular = useFiltroCliente();
  const [estado, setEstado] = useQueryParam("estado");

  const { data: cuentas, error, isLoading } = useSWR(["v2-cuentas", titular.usuarioId, estado], () =>
    listCuentasV2({ usuarioId: titular.usuarioId, estado: (estado || undefined) as EstadoCuentaV2 | undefined }),
  );

  const list = useListControls<CuentaV2>(cuentas, {
    searchText: (c) => [c.numero_cuenta],
    sorters: { id: (c) => c.id, numero: (c) => c.numero_cuenta, saldo: (c) => Number(c.saldo) },
    defaultSort: { key: "id", dir: "asc" },
  });

  // Totales por moneda de lo que se ve (sin paginar): no se suman guaraníes con dólares.
  const totales = (["PYG", "USD"] as const)
    .map((moneda) => ({
      moneda,
      total: round2((cuentas ?? []).filter((c) => c.moneda === moneda).reduce((s, c) => s + Number(c.saldo), 0)),
      cantidad: (cuentas ?? []).filter((c) => c.moneda === moneda).length,
    }))
    .filter((t) => t.cantidad > 0);

  return (
    <div className={shared.page}>
      <ModuleHeader moduleKey="v2-cuentas" title="Cuentas">
        <Link
          href={titular.usuarioId ? `/v2/cuentas/new?usuarioId=${titular.usuarioId}` : "/v2/cuentas/new"}
          className={shared.button}
          data-testid="v2-cuentas-nueva"
        >
          Abrir cuenta
        </Link>
      </ModuleHeader>

      <ListToolbar>
        <FiltroCliente value={titular.value} onChange={titular.setValue} testId={ids.field("usuarioId")} />
        <div className={shared.field}>
          <label htmlFor="estado">Estado</label>
          <select id="estado" value={estado} onChange={(e) => setEstado(e.target.value)} data-testid={ids.field("estado")}>
            <option value="">Todos</option>
            {ESTADOS.map((e) => (
              <option key={e} value={e}>
                {ESTADO_CUENTA_LABEL[e]}
              </option>
            ))}
          </select>
        </div>
        <SearchInput controls={list} ids={ids} label="Número de cuenta" placeholder="Ej. 1000000001" />
      </ListToolbar>

      {!isLoading && totales.length > 0 && (
        <div className={shared.stats} data-testid="v2-cuentas-totales">
          {totales.map((t) => (
            <div key={t.moneda} className={shared.stat}>
              <span className={shared.statLabel}>
                Saldo total {t.moneda} · {t.cantidad} {t.cantidad === 1 ? "cuenta" : "cuentas"}
              </span>
              <span className={shared.statValue}>
                <Monto value={t.total.toFixed(2)} moneda={t.moneda} testId={`v2-cuentas-total-${t.moneda}`} />
              </span>
            </div>
          ))}
        </div>
      )}

      <DataState
        loading={isLoading}
        error={error ?? null}
        empty={list.filteredCount === 0}
        emptyMessage="No hay cuentas con estos filtros."
        count={list.filteredCount}
        countTestId={ids.count}
        loadingTestId={ids.loading}
        errorTestId={ids.error}
        emptyTestId={ids.empty}
      >
        <div className={shared.tableWrap}>
          <table className={shared.table} data-testid={ids.list}>
            <thead>
              <tr>
                <SortableTh controls={list} ids={ids} column="id">
                  #
                </SortableTh>
                <SortableTh controls={list} ids={ids} column="numero">
                  Número
                </SortableTh>
                <th>Titular</th>
                <th>Tipo</th>
                <SortableTh controls={list} ids={ids} column="saldo" numeric>
                  Saldo
                </SortableTh>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {list.pageRows.map((cuenta) => (
                <tr key={cuenta.id} data-testid={ids.row(cuenta.id)} data-estado={cuenta.estado}>
                  <td>
                    <Link href={`/v2/cuentas/${cuenta.id}`}>{cuenta.id}</Link>
                  </td>
                  <td>
                    <Link href={`/v2/cuentas/${cuenta.id}`}>{cuenta.numero_cuenta}</Link>
                  </td>
                  <td>
                    <Link href={`/v2/usuarios/${cuenta.usuario_id}`}>Cliente #{cuenta.usuario_id}</Link>
                  </td>
                  <td>
                    {TIPO_CUENTA_LABEL[cuenta.tipo_cuenta]} · {cuenta.moneda}
                  </td>
                  <td className={shared.numeric}>
                    <Monto value={cuenta.saldo} moneda={cuenta.moneda} />
                  </td>
                  <td>
                    <span className={badgeFor(cuenta.estado)}>{ESTADO_CUENTA_LABEL[cuenta.estado]}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination controls={list} ids={ids} total={list.filteredCount} />
      </DataState>
    </div>
  );
}
