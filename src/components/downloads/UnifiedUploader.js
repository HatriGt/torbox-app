'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import ItemUploader from './ItemUploader';
import Icons from '@/components/icons';

const UPLOADER_TYPES = [
  { id: 'torrents', label: 'Torrents', icon: Icons.Torrent, extensions: ['.torrent'], color: 'accent' },
  { id: 'usenet', label: 'Usenet', icon: Icons.Usenet, extensions: ['.nzb'], color: 'accent' },
  { id: 'webdl', label: 'Web Downloads', icon: Icons.Webdl, extensions: [], color: 'accent' },
];

const STORAGE_KEY = 'unified-uploader-expanded';
const ACTIVE_TYPE_KEY = 'unified-uploader-active-type';

export default function UnifiedUploader({ apiKey }) {
  const t = useTranslations('ItemUploader');
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeUploadType, setActiveUploadType] = useState('torrents');
  const [isClient, setIsClient] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  const [detectedType, setDetectedType] = useState(null);
  const containerRef = useRef(null);
  const uploaderRef = useRef(null);

  // Auto-detect file type from dragged files
  const detectFileType = useCallback((files) => {
    if (!files || files.length === 0) return null;
    
    const file = files[0];
    const fileName = file.name.toLowerCase();
    
    for (const type of UPLOADER_TYPES) {
      if (type.extensions.some(ext => fileName.endsWith(ext))) {
        return type.id;
      }
    }
    
    // Check if it's a URL/magnet link
    if (file.type === 'text/plain' || fileName.includes('magnet:') || fileName.startsWith('http')) {
      return 'webdl';
    }
    
    return null;
  }, []);

  const handleToggle = useCallback(() => {
    setIsExpanded(prev => {
      const newExpanded = !prev;
      localStorage.setItem(STORAGE_KEY, String(newExpanded));
      return newExpanded;
    });
  }, []);

  const handleTypeChange = useCallback((type) => {
    setActiveUploadType(type);
    localStorage.setItem(ACTIVE_TYPE_KEY, type);
    setIsExpanded(prev => {
      if (!prev) {
        localStorage.setItem(STORAGE_KEY, 'true');
        return true;
      }
      return prev;
    });
  }, []);

  useEffect(() => {
    setIsClient(true);
    const savedExpanded = localStorage.getItem(STORAGE_KEY);
    const savedActiveType = localStorage.getItem(ACTIVE_TYPE_KEY);
    
    if (savedExpanded === 'true') {
      setIsExpanded(true);
    }
    
    if (savedActiveType && UPLOADER_TYPES.some(t => t.id === savedActiveType)) {
      setActiveUploadType(savedActiveType);
    }
  }, []);

  // Keyboard shortcut support
  useEffect(() => {
    const handleKeyPress = (e) => {
      // U key to toggle uploader (when not in input/textarea)
      if (e.key === 'u' || e.key === 'U') {
        const target = e.target;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && !target.isContentEditable) {
          e.preventDefault();
          handleToggle();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleToggle]);

  // Global drag handlers for smart type detection
  useEffect(() => {
    const handleDragEnter = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setDragCounter(prev => prev + 1);
      
      if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
        setIsDragging(true);
        
        // Try to detect file type
        const items = Array.from(e.dataTransfer.items);
        if (items[0]?.kind === 'file') {
          const file = items[0].getAsFile();
          if (file) {
            const detected = detectFileType([file]);
            if (detected) {
              setDetectedType(detected);
              setActiveUploadType(detected);
              if (!isExpanded) {
                setIsExpanded(true);
                localStorage.setItem(STORAGE_KEY, 'true');
              }
            }
          }
        }
      }
    };

    const handleDragLeave = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setDragCounter(prev => {
        const newCounter = prev - 1;
        if (newCounter === 0) {
          setIsDragging(false);
          setDetectedType(null);
        }
        return newCounter;
      });
    };

    const handleDragOver = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      setDragCounter(0);
      setDetectedType(null);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('dragenter', handleDragEnter);
      container.addEventListener('dragleave', handleDragLeave);
      container.addEventListener('dragover', handleDragOver);
      container.addEventListener('drop', handleDrop);
    }

    return () => {
      if (container) {
        container.removeEventListener('dragenter', handleDragEnter);
        container.removeEventListener('dragleave', handleDragLeave);
        container.removeEventListener('dragover', handleDragOver);
        container.removeEventListener('drop', handleDrop);
      }
    };
  }, [detectFileType, isExpanded, handleTypeChange]);

  if (!isClient) return null;

  const activeTypeInfo = UPLOADER_TYPES.find(t => t.id === activeUploadType);

  return (
    <div ref={containerRef} className="mb-6 relative">
      {/* Global Drag Overlay - Shows when dragging anywhere */}
      {isDragging && (
        <div className="fixed inset-0 z-40 bg-accent/10 dark:bg-accent-dark/10 backdrop-blur-sm flex items-center justify-center pointer-events-none">
          <div className="bg-surface-alt dark:bg-surface-alt-dark border-2 border-dashed border-accent dark:border-accent-dark rounded-2xl p-12 shadow-2xl transform scale-105 animate-pulse-slow">
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-accent/20 dark:bg-accent-dark/20 flex items-center justify-center">
                <Icons.CloudUpload className="w-10 h-10 text-accent dark:text-accent-dark animate-bounce" />
              </div>
              <div className="text-center">
                <p className="text-xl font-semibold text-primary-text dark:text-primary-text-dark">
                  Drop files to upload
                </p>
                {detectedType && (
                  <p className="text-sm text-primary-text/70 dark:text-primary-text-dark/70 mt-2">
                    Detected: {UPLOADER_TYPES.find(t => t.id === detectedType)?.label}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Upload Card */}
      <div 
        ref={uploaderRef}
        className={`
          bg-surface-alt dark:bg-surface-alt-dark 
          border border-border dark:border-border-dark 
          rounded-2xl overflow-hidden 
          transition-all duration-300 mb-6
          ${isDragging ? 'ring-2 ring-accent dark:ring-accent-dark ring-offset-2 ring-offset-surface dark:ring-offset-surface-dark scale-[1.02]' : ''}
          ${isExpanded ? 'shadow-lg dark:shadow-xl' : 'shadow-md dark:shadow-lg hover:shadow-lg dark:hover:shadow-xl'}
        `}
      >
        {/* Compact Header - Always Visible */}
        <div 
          className={`
            p-5 transition-all duration-300 cursor-pointer
            ${isExpanded ? 'border-b border-border dark:border-border-dark' : ''}
          `}
          onClick={handleToggle}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {/* Icon with animation */}
              <div className={`
                w-12 h-12 rounded-xl 
                bg-accent/10 dark:bg-accent-dark/10 
                flex items-center justify-center
                flex-shrink-0
                transition-all duration-300
                ${isExpanded ? 'scale-110' : ''}
              `}>
                <Icons.CloudUpload className={`
                  w-6 h-6 text-accent dark:text-accent-dark
                  transition-transform duration-300
                  ${isExpanded ? 'rotate-12' : ''}
                `} />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-lg font-semibold text-primary-text dark:text-primary-text-dark">
                    Upload Files
                  </h3>
                  {isExpanded && activeTypeInfo && (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-accent/10 dark:bg-accent-dark/10 text-accent dark:text-accent-dark flex items-center gap-1.5">
                      {(() => {
                        const Icon = activeTypeInfo.icon;
                        return Icon ? <Icon className="w-3 h-3" /> : null;
                      })()}
                      {activeTypeInfo.label}
                    </span>
                  )}
                </div>
                <p className="text-sm text-primary-text/70 dark:text-primary-text-dark/70 truncate">
                  {isExpanded 
                    ? 'Drop files, paste links, or browse to upload'
                    : 'Drag & drop files, paste links, or click to browse'
                  }
                </p>
              </div>
            </div>
            
            {/* Quick Type Selector - Always visible, compact */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {UPLOADER_TYPES.map((type) => {
                const Icon = type.icon;
                const isActive = activeUploadType === type.id;
                return (
                  <button
                    key={type.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTypeChange(type.id);
                    }}
                    className={`
                      p-2 rounded-lg transition-all duration-200
                      flex items-center justify-center
                      ${isActive
                        ? 'bg-accent dark:bg-accent-dark text-white scale-110'
                        : 'bg-surface dark:bg-surface-dark text-primary-text/60 dark:text-primary-text-dark/60 hover:bg-surface-alt dark:hover:bg-surface-alt-dark hover:text-primary-text dark:hover:text-primary-text-dark hover:scale-105'
                      }
                    `}
                    title={type.label}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                );
              })}
            </div>

            {/* Expand/Collapse Indicator */}
            <button
              onClick={handleToggle}
              className="p-2 rounded-lg bg-surface dark:bg-surface-dark hover:bg-surface-alt dark:hover:bg-surface-alt-dark transition-all duration-200 flex-shrink-0"
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
            >
              <Icons.ChevronDown 
                className={`w-5 h-5 text-primary-text/70 dark:text-primary-text-dark/70 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} 
              />
            </button>
          </div>
        </div>

        {/* Expanded Content with smooth animation */}
        {isExpanded && (
          <div className="animate-fade-in-up">
            {/* Active Uploader - Seamless integration */}
            <div className="p-6 pt-6">
              <ItemUploader 
                apiKey={apiKey} 
                activeType={activeUploadType}
                isNested={true}
              />
            </div>
          </div>
        )}
      </div>

      {/* Keyboard Shortcut Hint - Subtle */}
      {!isExpanded && (
        <div className="mt-2 text-xs text-primary-text/40 dark:text-primary-text-dark/40 text-center">
          Press <kbd className="px-1.5 py-0.5 bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded text-[10px]">U</kbd> to expand
        </div>
      )}
    </div>
  );
}
