"use client";

import Link from "next/link";
import useSWR from "swr";
import shared from "@/components/shared.module.css";
import { DataState } from "@/components/DataState";
import { ModuleHeader } from "@/components/ModuleHeader";
import { ProgressBar } from "@/components/ProgressBar";
import { ListToolbar, Pagination, SearchInput, SortableTh } from "@/components/list/ListControls";
import { useToast } from "@/components/Toast";
import { FiltroCliente } from "@/components/v2/FiltroCliente";
import { TarjetaAcciones, estaVencida, mmaa, toneUso } from "@/components/v2/Tarjeta";
import { Monto } from "@/components/Valores";
import { listTarjetasV2, type EstadoTarjetaV2, type TarjetaV2 } from "@/lib/api/v2/tarjetas";
import { useListControls, useQueryParam } from "@/lib/list/useListControls";
import { testIds } from "@/lib/testids";
import { MARCA_LABEL, TIPO_TARJETA_LABEL, badgeFor, capitalizar } from "@/lib/v2/labels";
import { porcentajeUso } from "@/lib/v2/reglas";
import { useFiltroCliente } from "@/lib/v2/useFiltroCliente";

const ids = testIds("v2-tarjetas");
const ESTADOS: EstadoTarjetaV2[] = ["activa", "bloqueada", "vencida"];

export default function TarjetasV2Page() {
  const toast = useToast();
  const titular = useFiltroCliente();
  const [estado, setEstado] = useQueryParam("estado");
  const [tipo, setTipo] = useQueryParam("tipo");

  const { data, error, isLoading, mutate } = useSWR(["v2-tarjetas", titular.usuarioId, estado], () =>
    listTarjetasV2({ usuarioId: titular.usuarioId, estado: (estado || undefined) as EstadoTarjetaV2 | undefined }),
  );
  const tarjetas = tipo ? data?.filter((t) => t.tipo === tipo) : data;

  const list = useListControls<TarjetaV2>(tarjetas, {
    searchText: (t) => [t.numero_enmascarado.slice(-4), MARCA_LABEL[t.marca]],
    sorters: {
      id: (t) => t.id,
      disponible: (t) => Number(t.disponible),
      uso: (t) => porcentajeUso(Number(t.saldo_utilizado), Number(t.limite_credito)),
      vencimiento: (t) => t.fecha_vencimiento,
    },
    defaultSort: { key: "id", dir: "asc" },
  });

  return (
    <div className={shared.page}>
      <ModuleHeader moduleKey="v2-tarjetas" title="Tarjetas">
        <Link
          href={titular.usuarioId ? `/v2/tarjetas/new?usuarioId=${titular.usuarioId}` : "/v2/tarjetas/new"}
          className={shared.button}
          data-testid="v2-tarjetas-nueva"
        >
          Solicitar tarjeta
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
                {capitalizar(e)}
              </option>
            ))}
          </select>
        </div>
        <div className={shared.field}>
          <label htmlFor="tipo">Tipo</label>
          <select id="tipo" value={tipo} onChange={(e) => setTipo(e.target.value)} data-testid={ids.field("tipo")}>
            <option value="">Todas</option>
            <option value="credito">Crédito</option>
            <option value="debito">Débito</option>
          </select>
        </div>
        <SearchInput controls={list} ids={ids} label="Buscar" placeholder="Últimos 4 dígitos o marca" />
      </ListToolbar>

      <DataState
        loading={isLoading}
        error={error ?? null}
        empty={list.filteredCount === 0}
        emptyMessage="No hay tarjetas con estos filtros."
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
                  Tarjeta
                </SortableTh>
                <th>Titular</th>
                <SortableTh controls={list} ids={ids} column="disponible" numeric>
                  Disponible
                </SortableTh>
                <SortableTh controls={list} ids={ids} column="uso">
                  Uso del límite
                </SortableTh>
                <SortableTh controls={list} ids={ids} column="vencimiento">
                  Vence
                </SortableTh>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {list.pageRows.map((tarjeta) => {
                const vencida = estaVencida(tarjeta);
                const uso = porcentajeUso(Number(tarjeta.saldo_utilizado), Number(tarjeta.limite_credito));
                return (
                  <tr key={tarjeta.id} data-testid={ids.row(tarjeta.id)} data-estado={tarjeta.estado}>
                    <td>
                      <Link href={`/v2/tarjetas/${tarjeta.id}`}>
                        {MARCA_LABEL[tarjeta.marca]} {TIPO_TARJETA_LABEL[tarjeta.tipo].toLowerCase()} ····{" "}
                        {tarjeta.numero_enmascarado.slice(-4)}
                      </Link>
                    </td>
                    <td>
                      <Link href={`/v2/usuarios/${tarjeta.usuario_id}`}>Cliente #{tarjeta.usuario_id}</Link>
                    </td>
                    <td className={shared.numeric}>
                      {tarjeta.tipo === "credito" ? <Monto value={tarjeta.disponible} moneda="PYG" /> : "Saldo de la cuenta"}
                    </td>
                    <td>
                      {tarjeta.tipo === "credito" ? (
                        <ProgressBar value={uso} label="Usado" tone={toneUso(uso)} testId={ids.rowAction(tarjeta.id, "uso")} />
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>{mmaa(tarjeta.fecha_vencimiento)}</td>
                    <td>
                      <span className={badgeFor(vencida ? "vencida" : tarjeta.estado)} data-testid={ids.rowAction(tarjeta.id, "estado")}>
                        {vencida ? "Vencida" : capitalizar(tarjeta.estado)}
                      </span>
                    </td>
                    <td>
                      <TarjetaAcciones
                        tarjeta={tarjeta}
                        onChanged={async (_, mensaje) => {
                          await mutate();
                          toast.success(mensaje);
                        }}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Pagination controls={list} ids={ids} total={list.filteredCount} />
      </DataState>
    </div>
  );
}
