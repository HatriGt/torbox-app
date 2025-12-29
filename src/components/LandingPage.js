'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import { useTranslations } from 'next-intl';
import AssetTypeTabs from '@/components/shared/AssetTypeTabs';
import ItemUploader from './downloads/ItemUploader';

export default function LandingPage({ onKeyChange, isLoggingIn, loginError }) {
  const t = useTranslations('LandingPage');
  const referralT = useTranslations('Referral');
  const [showCopied, setShowCopied] = useState(false);
  const [activeType, setActiveType] = useState('all');

  return (
    <>
      <Header apiKey={null} />
      <div className="container mx-auto px-4 md:px-6 py-6">
        <div className="mt-6">
          <AssetTypeTabs
            activeType={activeType}
            onTypeChange={setActiveType}
          />

          {/* Collapsible sections for "all" view */}
          {activeType === 'all' && (
            <div className="mb-4">
              {/* Torrents Upload Section */}
              <ItemUploader apiKey={null} activeType="torrents" />

              {/* Usenet Upload Section */}
              <ItemUploader apiKey={null} activeType="usenet" />

              {/* Web Downloads Upload Section */}
              <ItemUploader apiKey={null} activeType="webdl" />
            </div>
          )}

          {activeType !== 'all' && <ItemUploader apiKey={null} activeType={activeType} />}

          {/* Features Section */}
          <div className="mt-8 p-6 md:p-8 border border-border dark:border-border-dark rounded-xl bg-surface dark:bg-surface-dark shadow-sm dark:shadow-none transition-all duration-200">
            <h2 className="text-xl font-semibold mb-4 text-primary-text dark:text-primary-text-dark text-center">
              Features
            </h2>

            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <div className="p-6 border border-border dark:border-border-dark rounded-xl bg-surface-alt dark:bg-surface-alt-dark transition-all duration-200 hover:border-accent/30 dark:hover:border-accent-dark/30 hover:shadow-md dark:hover:shadow-none">
                <div className="w-10 h-10 mb-3 text-accent dark:text-accent-dark">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.625 1.5H9a3.75 3.75 0 013.75 3.75v1.875c0 1.036.84 1.875 1.875 1.875H16.5a3.75 3.75 0 013.75 3.75v7.875c0 1.035-.84 1.875-1.875 1.875H5.625a1.875 1.875 0 01-1.875-1.875V3.375c0-1.036.84-1.875 1.875-1.875zm6.905 9.97a.75.75 0 00-1.06 0l-3 3a.75.75 0 101.06 1.06l1.72-1.72V18a.75.75 0 001.5 0v-5.19l1.72 1.72a.75.75 0 101.06-1.06l-3-3z"
                      clipRule="evenodd"
                    />
                    <path d="M14.25 5.25a5.23 5.23 0 00-1.279-3.434 9.768 9.768 0 016.963 6.963A5.23 5.23 0 0016.5 7.5h-1.875a.375.375 0 01-.375-.375V5.25z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2 text-primary-text dark:text-primary-text-dark">
                  {t('features.batchUpload.title')}
                </h3>
                <p className="text-sm text-primary-text/70 dark:text-primary-text-dark/70">
                  {t('features.batchUpload.description')}
                </p>
              </div>
              <div className="p-6 border border-border dark:border-border-dark rounded-xl bg-surface-alt dark:bg-surface-alt-dark transition-all duration-200 hover:border-accent/30 dark:hover:border-accent-dark/30 hover:shadow-md dark:hover:shadow-none">
                <div className="w-10 h-10 mb-3 text-accent dark:text-accent-dark">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12 2.25a.75.75 0 01.75.75v11.69l3.22-3.22a.75.75 0 111.06 1.06l-4.5 4.5a.75.75 0 01-1.06 0l-4.5-4.5a.75.75 0 111.06-1.06l3.22 3.22V3a.75.75 0 01.75-.75zm-9 13.5a.75.75 0 01.75.75v2.25a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5V16.5a.75.75 0 011.5 0v2.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V16.5a.75.75 0 01.75-.75z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2 text-primary-text dark:text-primary-text-dark">
                  {t('features.search.title')}
                </h3>
                <p className="text-sm text-primary-text/70 dark:text-primary-text-dark/70">
                  {t('features.search.description')}
                </p>
              </div>
              <div className="p-6 border border-border dark:border-border-dark rounded-xl bg-surface-alt dark:bg-surface-alt-dark transition-all duration-200 hover:border-accent/30 dark:hover:border-accent-dark/30 hover:shadow-md dark:hover:shadow-none">
                <div className="w-10 h-10 mb-3 text-accent dark:text-accent-dark">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M20.599 1.5c-.376 0-.743.111-1.055.32l-5.08 3.385a18.747 18.747 0 00-3.471 2.987 10.04 10.04 0 014.815 4.815 18.748 18.748 0 002.987-3.471l3.386-5.08A1.902 1.902 0 0020.599 1.5zm-8.3 14.025a18.76 18.76 0 001.896-1.207 8.026 8.026 0 00-4.513-4.513A18.75 18.75 0 008.475 11.7l-.278.5a5.26 5.26 0 013.601 3.602l.502-.278zM6.75 13.5A3.75 3.75 0 003 17.25a1.5 1.5 0 01-1.601 1.497.75.75 0 00-.7 1.123 5.25 5.25 0 009.8-2.62 3.75 3.75 0 00-3.75-3.75z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2 text-primary-text dark:text-primary-text-dark">
                  {t('features.debrid.title')}
                </h3>
                <p className="text-sm text-primary-text/70 dark:text-primary-text-dark/70">
                  {t('features.debrid.description')}
                </p>
              </div>
            </div>

            <div className="pt-6 border-t border-border dark:border-border-dark">
              {/* Referral Section */}
              <div className="mt-4">
                <p className="text-sm text-primary-text/70 dark:text-primary-text-dark/70">
                  {referralT('landingDescription')}{' '}
                  <a
                    href="https://torbox.app/subscription?referral=f51e356a-462e-4630-8361-47b00a2ee0a3"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent dark:text-accent-dark hover:text-accent/80 dark:hover:text-accent-dark/80 underline"
                  >
                    {referralT('signUp')}
                  </a>
                  {' '}or{' '}
                  <button
                    onClick={async () => {
                      await navigator.clipboard.writeText('f51e356a-462e-4630-8361-47b00a2ee0a3');
                      setShowCopied(true);
                      setTimeout(() => setShowCopied(false), 2000);
                    }}
                    className="text-accent dark:text-accent-dark hover:text-accent/80 dark:hover:text-accent-dark/80 underline"
                  >
                    {showCopied ? referralT('copied') : referralT('copyCode')}
                  </button>
                </p>
              </div>

              <footer className="mt-6 pt-4 border-t border-border dark:border-border-dark text-sm text-primary-text/50 dark:text-primary-text-dark/50">
                <p>
                  {t('footer.description')}{' '}
                  <a
                    href="https://github.com/HatriGt/torbox-app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent dark:text-accent-dark hover:text-accent/80 dark:hover:text-accent-dark/80 underline"
                  >
                    {t('footer.github')}
                  </a>
                </p>
              </footer>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
