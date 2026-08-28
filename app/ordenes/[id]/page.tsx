"use client";

import { useParams } from "next/navigation";
import useSWR from "swr";
import Link from "next/link";
import shared from "@/components/shared.module.css";
import { DataState } from "@/components/DataState";
import { ModuleHeader } from "@/components/ModuleHeader";
import { getOrden } from "@/lib/api/ordenes";
import { testIds } from "@/lib/testids";

const ids = testIds("ordenes");

export default function OrdenDetallePage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  const { data: orden, error, isLoading } = useSWR(["orden", id], () => getOrden(id));

  return (
    <div className={shared.page}>
      <ModuleHeader moduleKey="ordenes" title={`Orden #${id}`} />

      <DataState loading={isLoading} error={error ?? null} loadingTestId={ids.loading} errorTestId={ids.error}>
        {orden && (
          <>
            <dl className={`${shared.card} ${shared.detailGrid}`} data-testid={ids.detail}>
              <div className={shared.detailField}>
                <dt>Usuario</dt>
                <dd>
                  <Link href={`/usuarios/${orden.usuario_id}`}>{orden.usuario_id}</Link>
                </dd>
              </div>
              <div className={shared.detailField}>
                <dt>Producto principal</dt>
                <dd>{orden.producto}</dd>
              </div>
              <div className={shared.detailField}>
                <dt>Monto</dt>
                <dd>{orden.monto}</dd>
              </div>
              <div className={shared.detailField}>
                <dt>Estado</dt>
                <dd>{orden.estado}</dd>
              </div>
            </dl>

            <table className={shared.table} data-testid={ids.rowAction(id, "items")}>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Cantidad</th>
                  <th>Precio unitario</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {orden.items?.map((item) => (
                  <tr key={item.id}>
                    <td>{item.producto}</td>
                    <td>{item.cantidad}</td>
                    <td>{item.precio_unitario}</td>
                    <td>{item.subtotal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </DataState>
    </div>
  );
}
