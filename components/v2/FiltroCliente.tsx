"use client";

import shared from "@/components/shared.module.css";
import { TODOS_LOS_CLIENTES } from "@/lib/v2/useFiltroCliente";
import { useClientesV2 } from "@/lib/v2/useEntidadesCliente";

/** Select "Titular" de las listas: todos los clientes o uno puntual. */
export function FiltroCliente({
  value,
  onChange,
  testId,
}: {
  value: string;
  onChange: (value: string) => void;
  testId: string;
}) {
  const { clientes, isLoading } = useClientesV2();
  return (
    <div className={shared.field}>
      <label htmlFor="filtroCliente">Titular</label>
      <select id="filtroCliente" value={value} onChange={(e) => onChange(e.target.value)} disabled={isLoading} data-testid={testId}>
        <option value={TODOS_LOS_CLIENTES}>Todos los clientes</option>
        {/* El id de la URL puede no estar en la lista (cliente dado de baja o todavía cargando). */}
        {value !== TODOS_LOS_CLIENTES && !clientes.some((c) => String(c.id) === value) && (
          <option value={value}>Cliente #{value}</option>
        )}
        {clientes.map((c) => (
          <option key={c.id} value={c.id}>
            {c.nombre}
          </option>
        ))}
      </select>
    </div>
  );
}
