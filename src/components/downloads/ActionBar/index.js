'use client';

import { useState, useRef, useEffect } from 'react';
import ColumnManager from '../ColumnManager';
import { COLUMNS } from '@/components/constants';
import { getItemTypeName } from './utils/statusHelpers';
import StatusSection from './components/StatusSection';
import SearchBar from './components/SearchBar';
import ActionButtons from './components/ActionButtons';
import ViewControls from './components/ViewControls';
import { useStatusCounts } from './hooks/useStatusCounts';
import Dropdown from '@/components/shared/Dropdown';
import { useTranslations } from 'next-intl';

export default function ActionBar({
  unfilteredItems,
  selectedItems,
  setSelectedItems,
  hasSelectedFiles,
  activeColumns,
  onColumnChange,
  search,
  setSearch,
  statusFilter,
  onStatusChange,
  isDownloading,
  isDeleting,
  isExporting,
  onBulkDownload,
  onBulkDelete,
  onBulkExport,
  activeType = 'torrents',
  isBlurred = false,
  onBlurToggle,
  isFullscreen = false,
  onFullscreenToggle,
  viewMode = 'table',
  onViewModeChange,
  sortField,
  sortDir,
  handleSort,
  getTotalDownloadSize,
  isDownloadPanelOpen,
  setIsDownloadPanelOpen,
  apiKey,
  setToast,
  expandAllFiles,
  collapseAllFiles,
  expandedItems,
}) {
  const [isSticky, setIsSticky] = useState(false);
  const stickyRef = useRef(null);

  const { statusCounts, statusOptions, isStatusSelected } =
    useStatusCounts(unfilteredItems);

  const t = useTranslations('Columns');

  useEffect(() => {
    const element = stickyRef.current;
    const observer = new IntersectionObserver(
      ([e]) => setIsSticky(!e.isIntersecting),
      { threshold: [1], rootMargin: '-1px 0px 0px 0px' },
    );

    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
      observer.disconnect();
    };
  }, []);

  const itemTypeName = getItemTypeName(activeType);
  const itemTypePlural = `${itemTypeName}s`;

  const sortOptions = activeColumns.map((column) => ({
    label: COLUMNS[column].displayName ? COLUMNS[column].displayName : t(`${COLUMNS[column].key}`),
    value: column,
  }));

  return (
    <div
      ref={stickyRef}
      className={`flex flex-col gap-4 py-4 bg-surface dark:bg-surface-dark mb-4
        ${isSticky ? 'border-b border-border dark:border-border-dark shadow-sm' : ''} ${isFullscreen ? 'px-4' : ''}`}
    >
      {/* Row 1: Status summary + Selection info + Action buttons */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between flex-wrap">
        <StatusSection
          statusCounts={statusCounts}
          statusOptions={statusOptions}
          isStatusSelected={isStatusSelected}
          unfilteredItems={unfilteredItems}
          selectedItems={selectedItems}
          hasSelectedFiles={hasSelectedFiles}
          statusFilter={statusFilter}
          onStatusChange={onStatusChange}
          itemTypeName={itemTypeName}
          itemTypePlural={itemTypePlural}
          getTotalDownloadSize={getTotalDownloadSize}
        />

        {(selectedItems.items?.size > 0 || hasSelectedFiles()) && (
          <ActionButtons
            selectedItems={selectedItems}
            setSelectedItems={setSelectedItems}
            hasSelectedFiles={hasSelectedFiles}
            isDownloading={isDownloading}
            isDeleting={isDeleting}
            isExporting={isExporting}
            onBulkDownload={onBulkDownload}
            onBulkDelete={onBulkDelete}
            onBulkExport={onBulkExport}
            itemTypeName={itemTypeName}
            itemTypePlural={itemTypePlural}
            isDownloadPanelOpen={isDownloadPanelOpen}
            setIsDownloadPanelOpen={setIsDownloadPanelOpen}
            activeType={activeType}
            apiKey={apiKey}
            setToast={setToast}
          />
        )}
      </div>

      {/* Row 2: Search bar + View controls + Column manager */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Search bar - takes available space */}
        <div className="flex-1 min-w-0">
          <SearchBar
            search={search}
            onSearchChange={setSearch}
            itemTypePlural={itemTypePlural}
          />
        </div>

        {/* Right side controls */}
        <div className="flex gap-2 items-center flex-wrap">
          {/* Sort downloads list */}
          {viewMode === 'card' && (
            <div className="flex items-center gap-1">
              <Dropdown
                options={sortOptions}
                value={sortField}
                onChange={(value) => handleSort(value)}
                className="min-w-[150px]"
                sortDir={sortDir}
              />
              <button
                onClick={() => handleSort(sortField)}
                className="px-2 py-1.5 text-primary-text/70 dark:text-primary-text-dark/70 hover:text-accent dark:hover:text-accent-dark hover:bg-surface-alt-hover dark:hover:bg-surface-alt-hover-dark rounded-lg transition-colors shrink-0"
              >
                {sortDir === 'desc' ? '↓' : '↑'}
              </button>
            </div>
          )}

          {/* View controls such as blur, fullscreen, and view mode */}
          <ViewControls
            isBlurred={isBlurred}
            onBlurToggle={onBlurToggle}
            isFullscreen={isFullscreen}
            onFullscreenToggle={onFullscreenToggle}
            viewMode={viewMode}
            onViewModeChange={onViewModeChange}
            expandAllFiles={expandAllFiles}
            collapseAllFiles={collapseAllFiles}
            expandedItems={expandedItems}
            unfilteredItems={unfilteredItems}
          />

          {/* Column manager */}
          <div className="hidden lg:block">
            <ColumnManager
              columns={COLUMNS}
              activeColumns={activeColumns}
              onColumnChange={onColumnChange}
              activeType={activeType}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
