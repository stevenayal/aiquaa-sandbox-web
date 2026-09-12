"use client";

import type { ReactNode } from "react";
import shared from "@/components/shared.module.css";
import styles from "./ListControls.module.css";
import type { ListControls } from "@/lib/list/useListControls";
import type { testIds } from "@/lib/testids";

type Ids = ReturnType<typeof testIds>;

export function SearchInput({
  controls,
  ids,
  label = "Buscar",
  placeholder,
  id = "buscar",
}: {
  controls: ListControls;
  ids: Ids;
  label?: string;
  placeholder?: string;
  id?: string;
}) {
  return (
    <div className={shared.field}>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="search"
        value={controls.searchInput}
        onChange={(e) => controls.setSearchInput(e.target.value)}
        placeholder={placeholder}
        data-testid={ids.search}
      />
    </div>
  );
}

/** Encabezado ordenable: `aria-sort` en el `<th>`, el click en un `<button>` real. */
export function SortableTh({
  controls,
  ids,
  column,
  children,
  numeric = false,
}: {
  controls: ListControls;
  ids: Ids;
  column: string;
  children: ReactNode;
  numeric?: boolean;
}) {
  const active = controls.sortKey === column;
  const ariaSort = active ? (controls.dir === "asc" ? "ascending" : "descending") : "none";
  return (
    <th aria-sort={ariaSort} className={numeric ? shared.numeric : undefined}>
      <button
        type="button"
        className={styles.sortButton}
        onClick={() => controls.toggleSort(column)}
        data-testid={ids.sort(column)}
      >
        {children}
        <span className={styles.sortIcon} aria-hidden="true">
          {active ? (controls.dir === "asc" ? "▲" : "▼") : "↕"}
        </span>
      </button>
    </th>
  );
}

export function Pagination({ controls, ids, total }: { controls: ListControls; ids: Ids; total: number }) {
  if (total === 0) return null;
  return (
    <nav className={styles.pagination} aria-label="Paginación">
      <span className={styles.range}>
        {controls.range.from}–{controls.range.to} de {total}
      </span>
      <button
        type="button"
        className={shared.buttonSecondary}
        onClick={() => controls.setPage(controls.page - 1)}
        disabled={controls.page <= 1}
        data-testid={ids.pagePrev}
      >
        Anterior
      </button>
      <span data-testid={ids.pageInfo} aria-live="polite">
        Página {controls.page} de {controls.totalPages}
      </span>
      <button
        type="button"
        className={shared.buttonSecondary}
        onClick={() => controls.setPage(controls.page + 1)}
        disabled={controls.page >= controls.totalPages}
        data-testid={ids.pageNext}
      >
        Siguiente
      </button>
    </nav>
  );
}

/** Barra de búsqueda + filtros arriba de una lista. */
export function ListToolbar({ children }: { children: ReactNode }) {
  return <div className={styles.toolbar}>{children}</div>;
}
