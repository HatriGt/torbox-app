'use client';

import Icons from '@/components/icons';
import { formatSize } from './utils/formatters';
import Spinner from '@/components/shared/Spinner';
import Tooltip from '@/components/shared/Tooltip';
import { useTranslations } from 'next-intl';

const ACTIONS_COLUMN_WIDTH = 210;
const CHECKBOX_COLUMN_WIDTH = 60;
const EXTRA_COLUMN_PADDING = 10;

export default function FileRow({
  item,
  selectedItems,
  handleFileSelection,
  handleFileDownload,
  activeColumns,
  downloadHistory,
  isCopying,
  isDownloading,
  isMobile = false,
  isBlurred = false,
  tableWidth,
  fileIndex = null, // If provided, render only this specific file
}) {
  const t = useTranslations('FileActions');
  const assetKey = (itemId, fileId) =>
    fileId ? `${itemId}-${fileId}` : itemId;

  // If fileIndex is provided, render only that file; otherwise render all files
  const filesToRender = fileIndex !== null 
    ? [item.files[fileIndex]].filter(Boolean)
    : item.files;

  return (
    <>
      {filesToRender.map((file, index) => {
        // Use the provided fileIndex for the actual index, or use the map index
        const actualIndex = fileIndex !== null ? fileIndex : index;
        const isChecked =
          selectedItems.files.get(item.id)?.has(file.id) || false;
        const isDisabled = selectedItems.items?.has(item.id);
        const isDownloaded = downloadHistory.some(
          (download) =>
            (download.itemId === item.id && !download.fileId) || // Complete item downloaded
            (download.itemId === item.id && download.fileId === file.id) || // Current file downloaded
            (download.itemId === item.id && item.files.length === 1), // Complete item with single file downloaded
        );

        return (
          <tr
            key={`${item.id}-${file.id}`}
            className={`transition-all duration-150 ${
              isChecked
                ? 'bg-accent/8 dark:bg-accent-dark/8 hover:bg-accent/12 dark:hover:bg-accent-dark/12 border-l-4 border-l-accent dark:border-l-accent-dark'
                : isDownloaded
                  ? 'bg-label-success-bg-dark/3 dark:bg-label-success-bg-dark/8 hover:bg-label-success-bg-dark/8 dark:hover:bg-label-success-bg-dark/12 border-l-4 border-l-label-success-bg-dark/40 dark:border-l-label-success-bg-dark/60'
                  : 'bg-surface/30 dark:bg-surface-dark/30 hover:bg-surface-alt/40 dark:hover:bg-surface-alt-dark/40'
            } ${!isDisabled ? 'cursor-pointer' : ''} group`}
            onMouseDown={(e) => {
              // Prevent text selection on shift+click
              if (e.shiftKey) {
                e.preventDefault();
              }
            }}
            onClick={(e) => {
              // Ignore clicks on buttons or if disabled
              if (e.target.closest('button') || isDisabled) return;
              handleFileSelection(item.id, actualIndex, file, !isChecked, e.shiftKey);
            }}
          >
            <td className="px-4 md:px-5 py-3 text-center whitespace-nowrap">
              <input
                type="checkbox"
                checked={isChecked}
                disabled={isDisabled}
                onChange={(e) =>
                  handleFileSelection(
                    item.id,
                    actualIndex,
                    file,
                    e.target.checked,
                    e.shiftKey,
                  )
                }
                style={{ pointerEvents: 'none' }}
                className="w-4 h-4 accent-accent dark:accent-accent-dark cursor-pointer rounded border-2 border-border dark:border-border-dark hover:border-accent dark:hover:border-accent-dark transition-colors"
              />
            </td>

            <td
              className="pl-4 md:pl-6 py-3"
              colSpan={isMobile ? 1 : activeColumns.length}
            >
              <div
                className={`${isMobile ? 'grid grid-cols-1 gap-1' : 'grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-4'}`}
                style={{
                  maxWidth:
                    tableWidth -
                    ACTIONS_COLUMN_WIDTH -
                    CHECKBOX_COLUMN_WIDTH -
                    EXTRA_COLUMN_PADDING,
                }}
              >
                <div
                  className={`text-sm font-medium text-primary-text/80 dark:text-primary-text-dark/80 truncate max-w-[250px] md:max-w-lg lg:max-w-xl ${isBlurred ? 'blur-[6px] select-none' : ''}`}
                >
                  <Tooltip
                    content={isBlurred ? '' : file.short_name || file.name}
                  >
                    {file.short_name || file.name}
                  </Tooltip>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="text-xs px-2 py-0.5 rounded-full bg-surface-alt dark:bg-surface-alt-dark 
                    text-primary-text/70 dark:text-primary-text-dark/70 whitespace-nowrap"
                  >
                    {formatSize(file.size || 0)}
                  </span>
                  {file.mimetype && (
                    <span
                      className="text-xs px-2 py-0.5 rounded-full bg-accent/5 dark:bg-accent-dark/5 
                      text-accent dark:text-accent-dark whitespace-nowrap"
                    >
                      {file.mimetype}
                    </span>
                  )}
                </div>
              </div>
            </td>

            <td className="px-4 md:px-5 py-3 whitespace-nowrap text-right sticky right-0 z-10 bg-inherit dark:bg-inherit">
              {/* Copy link button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleFileDownload(item.id, file, true);
                }}
                disabled={isCopying[assetKey(item.id, file.id)]}
                className="p-1.5 rounded-full text-accent dark:text-accent-dark 
                  hover:bg-accent/5 dark:hover:bg-accent-dark/5 transition-colors"
                title={t('copyLink')}
              >
                {isCopying[assetKey(item.id, file.id)] ? (
                  <Spinner size="sm" />
                ) : (
                  <Icons.Copy />
                )}
              </button>

              {/* Download button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleFileDownload(item.id, file);
                }}
                disabled={isDownloading[assetKey(item.id, file.id)]}
                className="p-1.5 rounded-full text-accent dark:text-accent-dark 
                  hover:bg-accent/5 dark:hover:bg-accent-dark/5 transition-colors"
                title={t('download')}
              >
                {isDownloading[assetKey(item.id, file.id)] ? (
                  <Spinner size="sm" />
                ) : (
                  <Icons.Download />
                )}
              </button>
            </td>
          </tr>
        );
      })}
    </>
  );
}
