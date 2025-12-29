'use client';

import { useState, useEffect } from 'react';
import ApiKeyInput from './downloads/ApiKeyInput';
import { useTranslations } from 'next-intl';
import Icons from './icons';

export default function ApiKeyDialog({ 
  isOpen, 
  onClose, 
  onKeyChange, 
  isLoggingIn, 
  loginError 
}) {
  const t = useTranslations('LandingPage');
  const [apiKey, setApiKey] = useState('');

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (apiKey.trim()) {
      onKeyChange(apiKey);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose || undefined}
    >
      <div 
        className="bg-surface dark:bg-surface-dark rounded-xl shadow-2xl max-w-md w-full border border-border dark:border-border-dark transform transition-all duration-200 scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`flex items-center ${onClose ? 'justify-between' : 'justify-start'} p-6 border-b border-border dark:border-border-dark`}>
          <div>
            <h2 className="text-xl font-semibold text-primary-text dark:text-primary-text-dark">
              {t('title')}
            </h2>
            <p className="text-sm text-primary-text/70 dark:text-primary-text-dark/70 mt-1">
              {t('subtitle')}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary-text dark:text-primary-text-dark mb-2">
              API Key
            </label>
            <ApiKeyInput
              value={apiKey}
              onKeyChange={setApiKey}
              allowKeyManager={false}
            />
          </div>

          {loginError && (
            <div className="p-3 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg text-red-700 dark:text-red-400 text-sm">
              {loginError}
            </div>
          )}

          <p className="text-xs text-primary-text/70 dark:text-primary-text-dark/70">
            {t('apiKeyInput.description')}{' '}
            <a
              href="https://torbox.app/settings"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent dark:text-accent-dark hover:text-accent/80 dark:hover:text-accent-dark/80 underline"
            >
              {t('apiKeyInput.link')}
            </a>
          </p>

          <div className={`flex gap-3 pt-2 ${onClose ? '' : 'justify-end'}`}>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg border border-border dark:border-border-dark 
                  text-primary-text dark:text-primary-text-dark 
                  hover:bg-surface-alt dark:hover:bg-surface-alt-dark 
                  transition-all duration-200"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={!apiKey.trim() || isLoggingIn}
              className={`${onClose ? 'flex-1' : 'w-full'} px-4 py-2.5 text-sm font-medium rounded-lg 
                bg-accent dark:bg-accent-dark text-white 
                hover:bg-accent/90 dark:hover:bg-accent-dark/90 
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-200 shadow-sm hover:shadow-md`}
            >
              {isLoggingIn ? 'Connecting...' : 'Connect'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

