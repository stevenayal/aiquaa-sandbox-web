"use client";

import Link from "next/link";
import useSWR from "swr";
import shared from "@/components/shared.module.css";
import { DataState } from "@/components/DataState";
import { ModuleHeader } from "@/components/ModuleHeader";
import { ListToolbar, Pagination, SearchInput, SortableTh } from "@/components/list/ListControls";
import { FiltroCliente } from "@/components/v2/FiltroCliente";
import { Fecha } from "@/components/Valores";
import { listBeneficiariosV2, type BeneficiarioV2 } from "@/lib/api/v2/beneficiarios";
import { useListControls } from "@/lib/list/useListControls";
import { testIds } from "@/lib/testids";
import { useFiltroCliente } from "@/lib/v2/useFiltroCliente";

const ids = testIds("v2-beneficiarios");

export default function BeneficiariosV2Page() {
  const titular = useFiltroCliente();
  const { data: beneficiarios, error, isLoading } = useSWR(["v2-beneficiarios", titular.usuarioId], () =>
    listBeneficiariosV2(titular.usuarioId),
  );

  const list = useListControls<BeneficiarioV2>(beneficiarios, {
    searchText: (b) => [b.nombre, b.alias, b.banco, b.numero_cuenta],
    sorters: { nombre: (b) => b.alias ?? b.nombre, banco: (b) => b.banco, alta: (b) => b.created_at },
    defaultSort: { key: "nombre", dir: "asc" },
  });

  return (
    <div className={shared.page}>
      <ModuleHeader moduleKey="v2-beneficiarios" title="Beneficiarios">
        <Link
          href={titular.usuarioId ? `/v2/beneficiarios/new?usuarioId=${titular.usuarioId}` : "/v2/beneficiarios/new"}
          className={shared.button}
          data-testid="v2-beneficiarios-nuevo"
        >
          Agregar beneficiario
        </Link>
      </ModuleHeader>

      <ListToolbar>
        <FiltroCliente value={titular.value} onChange={titular.setValue} testId={ids.field("usuarioId")} />
        <SearchInput controls={list} ids={ids} label="Buscar" placeholder="Nombre, alias, banco o número" />
      </ListToolbar>

      <DataState
        loading={isLoading}
        error={error ?? null}
        empty={list.filteredCount === 0}
        emptyMessage={list.searchInput ? "Ningún beneficiario coincide con la búsqueda." : "Todavía no hay beneficiarios agendados."}
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
                <SortableTh controls={list} ids={ids} column="nombre">
                  Beneficiario
                </SortableTh>
                <SortableTh controls={list} ids={ids} column="banco">
                  Banco
                </SortableTh>
                <th>Cuenta</th>
                <th>Titular</th>
                <SortableTh controls={list} ids={ids} column="alta">
                  Agendado
                </SortableTh>
                <th />
              </tr>
            </thead>
            <tbody>
              {list.pageRows.map((b) => (
                <tr key={b.id} data-testid={ids.row(b.id)}>
                  <td>
                    <Link href={`/v2/beneficiarios/${b.id}`}>{b.alias ?? b.nombre}</Link>
                    {b.alias && <div className={shared.hint}>{b.nombre}</div>}
                  </td>
                  <td>{b.banco}</td>
                  <td>{b.numero_cuenta}</td>
                  <td>
                    <Link href={`/v2/usuarios/${b.usuario_id}`}>Cliente #{b.usuario_id}</Link>
                  </td>
                  <td>
                    <Fecha value={b.created_at} />
                  </td>
                  <td>
                    <Link
                      href={`/v2/transferencias/new?tipo=beneficiario&beneficiarioId=${b.id}&usuarioId=${b.usuario_id}`}
                      className={shared.buttonSecondary}
                      data-testid={ids.rowAction(b.id, "transferir")}
                    >
                      Transferir
                    </Link>
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
