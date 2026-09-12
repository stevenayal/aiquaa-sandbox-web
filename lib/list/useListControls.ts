"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export type SortDir = "asc" | "desc";

interface Options<T> {
  /** Textos de la fila en los que busca el cuadro de búsqueda. */
  searchText?: (row: T) => (string | number | null | undefined)[];
  /** Valor por el que se ordena cada columna ordenable. */
  sorters?: Record<string, (row: T) => string | number>;
  defaultSort?: { key: string; dir: SortDir };
  pageSize?: number;
  /** Prefijo de los parámetros de URL, para dos listas en la misma página (ej. `mov` → `movQ`, `movPage`). */
  prefix?: string;
}

export const SEARCH_DEBOUNCE_MS = 300;

/**
 * Un parámetro de la URL como estado (ej. un filtro que va a la API y por eso
 * se necesita antes de tener las filas). Cambiarlo vuelve a la página 1.
 */
export function useQueryParam(name: string, pageParam = "page"): [string, (value: string) => void] {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const value = searchParams.get(name) ?? "";

  function setValue(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (next) params.set(name, next);
    else params.delete(name);
    params.delete(pageParam);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  return [value, setValue];
}

function normalize(value: string): string {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

/**
 * Búsqueda, orden por columna, filtros y paginación de una lista, todo
 * client-side (la API del curso 2 devuelve hasta 100 filas sin paginar).
 *
 * El estado vive en la URL (`?q=&sort=&dir=&page=` y los filtros), así una
 * vista filtrada se puede compartir o abrir directo desde un test, y el botón
 * "atrás" del browser no la pierde. La búsqueda se escribe en la URL con un
 * debounce de 300 ms.
 */
export function useListControls<T>(rows: T[] | undefined, options: Options<T> = {}) {
  const { searchText, sorters = {}, defaultSort, pageSize = 10, prefix = "" } = options;
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const param = (name: string) => (prefix ? `${prefix}${name[0].toUpperCase()}${name.slice(1)}` : name);

  const q = searchParams.get(param("q")) ?? "";
  const sortKey = searchParams.get(param("sort")) ?? defaultSort?.key ?? null;
  const dirParam = searchParams.get(param("dir"));
  const dir: SortDir = dirParam === "asc" || dirParam === "desc" ? dirParam : (defaultSort?.dir ?? "asc");
  const pageParam = Number(searchParams.get(param("page")) ?? "1");

  function update(changes: Record<string, string | null>, { resetPage = true } = {}) {
    const next = new URLSearchParams(searchParams.toString());
    for (const [name, value] of Object.entries(changes)) {
      if (value === null || value === "") next.delete(param(name));
      else next.set(param(name), value);
    }
    if (resetPage) next.delete(param("page"));
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  const [searchInput, setSearchInput] = useState(q);
  useEffect(() => {
    if (searchInput === q) return;
    const timer = window.setTimeout(() => update({ q: searchInput.trim() || null }), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
    // `update` cambia en cada render; lo que dispara la escritura es el texto.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput, q]);

  const all = rows ?? [];
  const needle = normalize(q.trim());
  const filtered =
    needle && searchText
      ? all.filter((row) => searchText(row).some((v) => v !== null && v !== undefined && normalize(String(v)).includes(needle)))
      : all;

  const sorter = sortKey ? sorters[sortKey] : undefined;
  const sorted = sorter
    ? [...filtered].sort((a, b) => {
        const va = sorter(a);
        const vb = sorter(b);
        const cmp =
          typeof va === "number" && typeof vb === "number" ? va - vb : String(va).localeCompare(String(vb), "es");
        return dir === "asc" ? cmp : -cmp;
      })
    : filtered;

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const page = Number.isInteger(pageParam) ? Math.min(Math.max(pageParam, 1), totalPages) : 1;
  const start = (page - 1) * pageSize;

  return {
    searchInput,
    setSearchInput,
    sortKey,
    dir,
    toggleSort(key: string) {
      const nextDir: SortDir = sortKey === key && dir === "asc" ? "desc" : "asc";
      update({ sort: key, dir: nextDir }, { resetPage: false });
    },
    filter: (name: string) => searchParams.get(param(name)) ?? "",
    setFilter: (name: string, value: string) => update({ [name]: value || null }),
    page,
    totalPages,
    setPage: (next: number) => update({ page: next > 1 ? String(next) : null }, { resetPage: false }),
    /** Filas de la página actual. */
    pageRows: sorted.slice(start, start + pageSize),
    /** Cantidad después de buscar (antes de paginar). */
    filteredCount: sorted.length,
    range: { from: sorted.length ? start + 1 : 0, to: Math.min(start + pageSize, sorted.length) },
  };
}

export type ListControls = ReturnType<typeof useListControls>;
