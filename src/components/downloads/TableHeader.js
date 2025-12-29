'use client';

import { COLUMNS } from '@/components/constants';
import useIsMobile from '@/hooks/useIsMobile';
import ResizableColumn from './ResizableColumn';
import { useTranslations } from 'next-intl';

export default function TableHeader({
  activeColumns,
  columnWidths,
  updateColumnWidth,
  selectedItems,
  onSelectAll,
  items,
  sortField,
  sortDirection,
  onSort,
}) {
  const columnT = useTranslations('Columns');
  const isMobile = useIsMobile();

  // For mobile, we'll only show the name column and actions
  const visibleColumns = isMobile ? ['name'] : activeColumns;

  return (
    <thead className="bg-surface-alt dark:bg-surface-alt-dark border-b-2 border-border/40 dark:border-border-dark/40 sticky top-0 z-20">
      <tr className="table-row">
        <th className="px-4 md:px-5 py-4 text-center text-xs font-bold text-primary-text dark:text-primary-text-dark uppercase tracking-widest w-[60px] min-w-[60px] max-w-[60px]">
          <input
            type="checkbox"
            onChange={(e) => onSelectAll(items, e.target.checked)}
            checked={
              selectedItems.items?.size === items.length && items.length > 0
            }
            className="accent-accent dark:accent-accent-dark"
          />
        </th>
        {visibleColumns.map((columnId) => {
          const column = COLUMNS[columnId];
          return (
            <ResizableColumn
              key={columnId}
              columnId={columnId}
              width={columnWidths[columnId]}
              onWidthChange={(width) => updateColumnWidth(columnId, width)}
              sortable={column.sortable}
              onClick={() => column.sortable && onSort(columnId)}
              className={`px-4 md:px-5 py-4 text-left text-xs font-bold text-primary-text dark:text-primary-text-dark uppercase tracking-widest ${
                column.sortable
                  ? 'cursor-pointer hover:bg-surface/50 dark:hover:bg-surface-dark/50 hover:text-accent dark:hover:text-accent-dark transition-all duration-200 group'
                  : ''
              }`}
            >
              <span className="flex items-center gap-2">
                <span>{column.displayName ? column.displayName : columnT(column.key)}</span>
                {sortField === columnId && (
                  <span className="text-accent dark:text-accent-dark font-bold">
                    {sortDirection === 'asc' ? '↑' : '↓'}
                  </span>
                )}
                {column.sortable && !sortField && (
                  <span className="text-primary-text/20 dark:text-primary-text-dark/20 group-hover:text-primary-text/40 dark:group-hover:text-primary-text-dark/40 transition-colors">
                    ↕
                  </span>
                )}
              </span>
            </ResizableColumn>
          );
        })}
        <th className="px-4 md:px-5 py-4 text-right text-xs font-bold text-primary-text dark:text-primary-text-dark uppercase tracking-widest sticky right-0 bg-surface-alt dark:bg-surface-alt-dark w-[100px] min-w-[100px] max-w-[100px]">
          {columnT('actions')}
        </th>
      </tr>
    </thead>
  );
}
