"use client";

import Link from "next/link";
import useSWR from "swr";
import shared from "@/components/shared.module.css";
import { DataState } from "@/components/DataState";
import { ModuleHeader } from "@/components/ModuleHeader";
import { ListToolbar, Pagination, SearchInput, SortableTh } from "@/components/list/ListControls";
import { Fecha } from "@/components/Valores";
import { listUsuariosV2, type UsuarioV2 } from "@/lib/api/v2/usuarios";
import { useListControls } from "@/lib/list/useListControls";
import { testIds } from "@/lib/testids";

const ids = testIds("v2-usuarios");

export default function UsuariosV2Page() {
  const { data: usuarios, error, isLoading } = useSWR(["v2-usuarios"], () => listUsuariosV2());

  const list = useListControls<UsuarioV2>(usuarios, {
    searchText: (u) => [u.nombre, u.email, u.documento_numero, u.telefono],
    sorters: {
      id: (u) => u.id,
      nombre: (u) => u.nombre,
      email: (u) => u.email,
      alta: (u) => u.created_at,
    },
    defaultSort: { key: "id", dir: "desc" },
  });

  return (
    <div className={shared.page}>
      <ModuleHeader moduleKey="v2-usuarios" title="Clientes">
        <Link href="/v2/usuarios/new" className={shared.button} data-testid="v2-usuarios-nuevo">
          Nuevo cliente
        </Link>
      </ModuleHeader>

      <ListToolbar>
        <SearchInput controls={list} ids={ids} label="Buscar cliente" placeholder="Nombre, email, documento o teléfono" />
      </ListToolbar>

      <DataState
        loading={isLoading}
        error={error ?? null}
        empty={list.filteredCount === 0}
        emptyMessage={list.searchInput ? "Ningún cliente coincide con la búsqueda." : "Todavía no hay clientes."}
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
                <SortableTh controls={list} ids={ids} column="nombre">
                  Nombre
                </SortableTh>
                <SortableTh controls={list} ids={ids} column="email">
                  Email
                </SortableTh>
                <th>Documento</th>
                <th>Celular</th>
                <SortableTh controls={list} ids={ids} column="alta">
                  Alta
                </SortableTh>
              </tr>
            </thead>
            <tbody>
              {list.pageRows.map((usuario) => (
                <tr key={usuario.id} data-testid={ids.row(usuario.id)}>
                  <td>
                    <Link href={`/v2/usuarios/${usuario.id}`}>{usuario.id}</Link>
                  </td>
                  <td>
                    <Link href={`/v2/usuarios/${usuario.id}`}>{usuario.nombre}</Link>
                  </td>
                  <td>{usuario.email}</td>
                  <td>
                    <span className={shared.badge}>{usuario.documento_tipo}</span> {usuario.documento_numero}
                  </td>
                  <td>{usuario.telefono ?? "—"}</td>
                  <td>
                    <Fecha value={usuario.created_at} />
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
