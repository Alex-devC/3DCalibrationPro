import { useState, useMemo } from 'react';

export type SortDirection = 'asc' | 'desc' | null;

export interface SortState<T> {
  key: keyof T | string | null;
  direction: SortDirection;
}

export function useSortableData<T>(items: T[], initialKey: keyof T | string | null = null, initialDirection: SortDirection = null) {
  const [sortState, setSortState] = useState<SortState<T>>({
    key: initialKey,
    direction: initialDirection,
  });

  const requestSort = (key: keyof T | string) => {
    setSortState((prev) => {
      if (prev.key !== key) {
        // First click: ascending
        return { key, direction: 'asc' };
      }
      if (prev.direction === 'asc') {
        // Second click: descending
        return { key, direction: 'desc' };
      }
      if (prev.direction === 'desc') {
        // Third click: return to initial unsorted state
        return { key: null, direction: null };
      }
      // If was null
      return { key, direction: 'asc' };
    });
  };

  const sortedItems = useMemo(() => {
    if (!sortState.key || !sortState.direction) {
      return items;
    }

    const key = sortState.key;
    const directionMultiplier = sortState.direction === 'asc' ? 1 : -1;

    return [...items].sort((a: any, b: any) => {
      let valA = a[key];
      let valB = b[key];

      // Handle null or undefined values
      if (valA === undefined || valA === null) valA = '';
      if (valB === undefined || valB === null) valB = '';

      // Numeric comparison
      if (typeof valA === 'number' && typeof valB === 'number') {
        return (valA - valB) * directionMultiplier;
      }

      // String comparison
      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();

      if (strA < strB) return -1 * directionMultiplier;
      if (strA > strB) return 1 * directionMultiplier;
      return 0;
    });
  }, [items, sortState.key, sortState.direction]);

  return {
    items: sortedItems,
    requestSort,
    sortState,
  };
}
