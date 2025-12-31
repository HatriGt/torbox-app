import Icons from '@/components/icons';
import { useTranslations } from 'next-intl';

export default function ViewControls({
  isBlurred,
  onBlurToggle,
  isFullscreen,
  onFullscreenToggle,
  viewMode,
  onViewModeChange,
  expandAllFiles,
  collapseAllFiles,
  expandedItems,
  unfilteredItems,
}) {
  const t = useTranslations('ViewControls');

  const handleViewModeChange = (mode) => {
    onViewModeChange(mode);
    localStorage.setItem('downloads-view-mode', mode);
  };

  return (
    <div className="flex items-center gap-2">
      {/* Table and card view buttons */}
      <div className="flex items-center gap-0">
        <button
          onClick={() => handleViewModeChange('table')}
          className={`px-3 py-1.5 min-h-[44px] sm:min-h-0 text-sm border rounded-l-lg transition-all duration-200
          ${
            viewMode === 'table'
              ? 'border-accent dark:border-accent-dark text-accent dark:text-accent-dark bg-accent/10 dark:bg-accent-dark/10'
              : 'border-border dark:border-border-dark text-primary-text/70 dark:text-primary-text-dark/70 hover:border-accent/50 dark:hover:border-accent-dark/50 hover:text-accent dark:hover:text-accent-dark'
          }`}
          title={t('tableView')}
        >
          <Icons.Table />
        </button>
        <button
          onClick={() => handleViewModeChange('card')}
          className={`px-3 py-1.5 min-h-[44px] sm:min-h-0 text-sm border rounded-r-lg transition-all duration-200
          ${
            viewMode === 'card'
              ? 'border-accent dark:border-accent-dark text-accent dark:text-accent-dark bg-accent/10 dark:bg-accent-dark/10'
              : 'border-border dark:border-border-dark text-primary-text/70 dark:text-primary-text-dark/70 hover:border-accent/50 dark:hover:border-accent-dark/50 hover:text-accent dark:hover:text-accent-dark'
          }`}
          title={t('cardView')}
        >
          <Icons.List />
        </button>
      </div>

      {/* Blur button */}
      <button
        onClick={onBlurToggle}
        className={`px-3 py-1.5 min-h-[44px] sm:min-h-0 text-sm border rounded-lg transition-colors
          ${
            isBlurred
              ? 'border-accent dark:border-accent-dark text-accent dark:text-accent-dark bg-accent/10 dark:bg-accent-dark/10'
              : 'border-border dark:border-border-dark text-primary-text/70 dark:text-primary-text-dark/70 hover:border-accent/50 dark:hover:border-accent-dark/50'
          }`}
        title={isBlurred ? t('showSensitive') : t('hideSensitive')}
      >
        {isBlurred ? <Icons.Eye /> : <Icons.EyeOff />}
      </button>

      {/* Fullscreen button */}
      <button
        onClick={onFullscreenToggle}
        className={`px-3 py-1.5 min-h-[44px] sm:min-h-0 text-sm border rounded-lg transition-colors
          ${
            isFullscreen
              ? 'border-accent dark:border-accent-dark text-accent dark:text-accent-dark bg-accent/10 dark:bg-accent-dark/10'
              : 'border-border dark:border-border-dark text-primary-text/70 dark:text-primary-text-dark/70 hover:border-accent/50 dark:hover:border-accent-dark/50'
          }`}
        title={isFullscreen ? t('exitFullscreen') : t('enterFullscreen')}
      >
        {isFullscreen ? <Icons.Minimize /> : <Icons.Maximize />}
      </button>

      {/* Expand/Collapse all files button */}
      {unfilteredItems && unfilteredItems.length > 0 && (() => {
        const itemsWithFiles = unfilteredItems.filter(item => item.files && item.files.length > 0);
        const hasItemsWithFiles = itemsWithFiles.length > 0;
        const allExpanded = hasItemsWithFiles && itemsWithFiles.every(item => expandedItems.has(item.id));
        
        if (!hasItemsWithFiles) return null;
        
        return (
          <button
            onClick={() => {
              if (allExpanded) {
                collapseAllFiles();
              } else {
                expandAllFiles();
              }
            }}
            className={`px-3 py-1.5 min-h-[44px] sm:min-h-0 text-sm border rounded-lg transition-colors
              ${
                allExpanded
                  ? 'border-accent dark:border-accent-dark text-accent dark:text-accent-dark bg-accent/10 dark:bg-accent-dark/10'
                  : 'border-border dark:border-border-dark text-primary-text/70 dark:text-primary-text-dark/70 hover:border-accent/50 dark:hover:border-accent-dark/50'
              }`}
            title={allExpanded ? t('collapseAllFiles') : t('expandAllFiles')}
          >
            {allExpanded ? <Icons.CollapseAll /> : <Icons.ExpandAll />}
          </button>
        );
      })()}
    </div>
  );
}
