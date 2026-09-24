import React from 'react';
import { useI18n } from '../../i18n/I18nContext.tsx';
import { SortState } from '../../hooks/useSortableData.ts';

interface SortableHeaderProps<T> {
  sortKey: keyof T | string;
  label: string;
  sortState: SortState<T>;
  onSort: (key: keyof T | string) => void;
  className?: string;
  align?: 'left' | 'center' | 'right';
}

export function SortableHeader<T>({
  sortKey,
  label,
  sortState,
  onSort,
  className = '',
  align = 'left',
}: SortableHeaderProps<T>) {
  const { t } = useI18n();
  const isSorted = sortState.key === sortKey && sortState.direction !== null;
  const direction = isSorted ? sortState.direction : null;

  const alignClass =
    align === 'right'
      ? 'justify-end text-right'
      : align === 'center'
      ? 'justify-center text-center'
      : 'justify-start text-left';

  return (
    <th
      scope="col"
      onClick={() => onSort(sortKey)}
      className={`px-3 py-3 font-mono text-[11px] uppercase tracking-wider text-outline select-none cursor-pointer hover:text-primary transition-colors ${className}`}
      title={t('common.clickToSort', { field: label })}
    >
      <div className={`flex items-center gap-1.5 ${alignClass}`}>
        <span className={isSorted ? 'text-primary font-bold' : ''}>{label}</span>
        <span
          className={`material-symbols-outlined text-[16px] transition-transform ${
            isSorted ? 'text-primary' : 'text-outline/40'
          }`}
        >
          {direction === 'asc'
            ? 'arrow_upward'
            : direction === 'desc'
            ? 'arrow_downward'
            : 'unfold_more'}
        </span>
      </div>
    </th>
  );
}
