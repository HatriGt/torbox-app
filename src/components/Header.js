'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import Icons from '@/components/icons';
import { locales } from '@/i18n/settings';
import NotificationBell from '@/components/notifications/NotificationBell';
import SystemStatusIndicator from '@/components/shared/SystemStatusIndicator';
import ReferralDropdown from '@/components/ReferralDropdown';
import { useTheme } from '@/contexts/ThemeContext';
import { getVersion } from '@/utils/version';
// import CloudUploadManager from '@/components/downloads/CloudUploadManager';

export default function Header({ apiKey }) {
  const t = useTranslations('Header');
  const pathname = usePathname();
  const { darkMode, toggleDarkMode, isClient } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef(null);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Close more menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target)) {
        setIsMoreMenuOpen(false);
      }
    };

    if (isMoreMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isMoreMenuOpen]);

  const isActive = (path) => {
    // Handle root path specially - it can be `/` or `/${locale}`
    if (path === '/') {
      return pathname === '/' || locales.some((locale) => pathname === `/${locale}` || pathname === `/${locale}/`);
    }
    return pathname === path || locales.some((locale) => pathname === `/${locale}${path}`);
  };

  return (
    <div className="sticky top-0 z-50 mx-2 sm:mx-3 mt-3 sm:mt-4 mb-6">
      <div className="rounded-xl border border-border dark:border-border-dark shadow-lg dark:shadow-xl backdrop-blur-sm bg-surface/95 dark:bg-primary/95 max-w-fit mx-auto">
        <div className="px-4 py-2">
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/images/TBM-logo.png"
              alt={t('logo')}
              width={18}
              height={18}
            />
            <h1 className="text-base font-semibold text-primary-text dark:text-primary-text-dark whitespace-nowrap">
              {t('title')}
            </h1>
          </Link>

          {/* Mobile menu button */}
          <button
            onClick={toggleMenu}
            aria-label={t('menu.toggle')}
            className="md:hidden text-primary-text dark:text-primary-text-dark"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              className="w-6 h-6"
            >
              {isMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2 ml-6">
            {/* Tier 1: Primary Navigation */}
            <div className="flex items-center gap-2">
              <Link
                href="/"
                className={`text-sm text-primary-text dark:text-primary-text-dark font-medium flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg
                  hover:text-accent dark:hover:text-accent-dark hover:bg-surface-alt dark:hover:bg-surface-alt-dark transition-all duration-200
                  ${isActive('/') ? 'text-accent dark:text-accent-dark bg-accent/10 dark:bg-accent-dark/10' : ''}`}
                >
                  <Icons.Download className="w-4 h-4" />
                  <span className="hidden lg:inline">{t('menu.downloads')}</span>
                </Link>

                <Link
                  href="/search"
                  className={`text-sm text-primary-text dark:text-primary-text-dark font-medium flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg
                    hover:text-accent dark:hover:text-accent-dark hover:bg-surface-alt dark:hover:bg-surface-alt-dark transition-all duration-200
                    ${isActive('/search') ? 'text-accent dark:text-accent-dark bg-accent/10 dark:bg-accent-dark/10' : ''}`}
                >
                  <Icons.MagnifyingGlass className="w-4 h-4" />
                  <span className="hidden lg:inline">{t('menu.search')}</span>
                </Link>

              {/* More Menu Dropdown */}
              <div className="relative" ref={moreMenuRef}>
                <button
                  onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                  className={`text-sm text-primary-text dark:text-primary-text-dark font-medium flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg
                    hover:text-accent dark:hover:text-accent-dark hover:bg-surface-alt dark:hover:bg-surface-alt-dark transition-all duration-200
                    ${isActive('/archived') || isActive('/link-history') || isActive('/rss') || isActive('/user') 
                      ? 'text-accent dark:text-accent-dark bg-accent/10 dark:bg-accent-dark/10' 
                      : ''}`}
                >
                  <Icons.VerticalEllipsis className="w-4 h-4" />
                  <span className="hidden lg:inline">{t('menu.more') || 'More'}</span>
                  <svg
                    className={`w-4 h-4 transition-transform ${isMoreMenuOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {isMoreMenuOpen && (
                  <div className="absolute right-0 z-20 mt-2 py-2 w-48 bg-surface-alt dark:bg-surface-alt-dark rounded-lg shadow-xl border border-border dark:border-border-dark">
                    <Link
                      href="/user"
                      onClick={() => setIsMoreMenuOpen(false)}
                      className={`flex w-full items-center gap-3 px-4 py-2 text-sm transition-colors ${
                        isActive('/user')
                          ? 'text-accent dark:text-accent-dark bg-surface-alt-selected dark:bg-surface-alt-selected-dark'
                          : 'text-primary-text dark:text-primary-text-dark hover:bg-surface-alt-selected-hover dark:hover:bg-surface-alt-selected-hover-dark'
                      }`}
                    >
                      <Icons.User className="w-4 h-4" />
                      <span>{t('menu.user')}</span>
                    </Link>

                    <Link
                      href="/link-history"
                      onClick={() => setIsMoreMenuOpen(false)}
                      className={`flex w-full items-center gap-3 px-4 py-2 text-sm transition-colors rounded-lg mx-1 ${
                        isActive('/link-history')
                          ? 'text-accent dark:text-accent-dark bg-accent/10 dark:bg-accent-dark/10'
                          : 'text-primary-text dark:text-primary-text-dark hover:bg-surface-alt-selected-hover dark:hover:bg-surface-alt-selected-hover-dark'
                      }`}
                    >
                      <Icons.History className="w-4 h-4" />
                      <span>{t('menu.linkHistory')}</span>
                    </Link>

                    <Link
                      href="/archived"
                      onClick={() => setIsMoreMenuOpen(false)}
                      className={`flex w-full items-center gap-3 px-4 py-2 text-sm transition-colors rounded-lg mx-1 ${
                        isActive('/archived')
                          ? 'text-accent dark:text-accent-dark bg-accent/10 dark:bg-accent-dark/10'
                          : 'text-primary-text dark:text-primary-text-dark hover:bg-surface-alt-selected-hover dark:hover:bg-surface-alt-selected-hover-dark'
                      }`}
                    >
                      <Icons.Archive className="w-4 h-4" />
                      <span>{t('menu.archived')}</span>
                    </Link>

                    <Link
                      href="/rss"
                      onClick={() => setIsMoreMenuOpen(false)}
                      className={`flex w-full items-center gap-3 px-4 py-2 text-sm transition-colors rounded-lg mx-1 ${
                        isActive('/rss')
                          ? 'text-accent dark:text-accent-dark bg-accent/10 dark:bg-accent-dark/10'
                          : 'text-primary-text dark:text-primary-text-dark hover:bg-surface-alt-selected-hover dark:hover:bg-surface-alt-selected-hover-dark'
                      }`}
                    >
                      <Icons.Rss className="w-4 h-4" />
                      <span>{t('menu.rss')}</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="h-4 w-px bg-border dark:bg-border-dark"></div>

            {/* Tier 1: Utility Items */}
            <div className="flex items-center gap-2">
              <ReferralDropdown />
              {apiKey && <NotificationBell apiKey={apiKey} />}
              <SystemStatusIndicator apiKey={apiKey} />
            </div>

            {/* Divider */}
            <div className="h-4 w-px bg-border dark:bg-border-dark mx-1"></div>

            {/* Settings: Dark mode toggle and Language Switcher */}
            <div className="flex items-center gap-2">
              {isClient && (
                <button
                  onClick={toggleDarkMode}
                  aria-label={
                    darkMode ? t('theme.toggleLight') : t('theme.toggleDark')
                  }
                  className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none bg-gray-200 dark:bg-gray-700"
                >
                  <span
                    className={`${
                      darkMode ? 'translate-x-4' : 'translate-x-0.5'
                    } inline-flex items-center justify-center h-4 w-4 transform rounded-full transition-transform bg-white dark:bg-gray-800`}
                  >
                    {darkMode ? <Icons.Moon className="w-3 h-3" /> : <Icons.Sun className="w-3 h-3" />}
                  </span>
                </button>
              )}
              <LanguageSwitcher compact={true} />
              <a
                href="https://github.com/HatriGt/torbox-app"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub Repository"
                className="p-1.5 rounded-lg text-primary-text dark:text-primary-text-dark hover:text-accent dark:hover:text-accent-dark hover:bg-surface-alt dark:hover:bg-surface-alt-dark transition-all duration-200"
              >
                <Icons.GitHub className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 space-y-4">
            {/* Tier 1: Primary Navigation */}
            <div className="space-y-2 pb-4 border-b border-primary-border dark:border-border-dark">
              <Link
                href="/"
                className={`block text-primary-text dark:text-primary-text-dark font-medium 
                  hover:text-primary-text/80 dark:hover:text-primary-text-dark/80 transition-colors py-2
                  ${isActive('/') ? 'border-l-2 pl-2 border-accent dark:border-accent-dark' : ''}`}
                onClick={() => setIsMenuOpen(false)}
              >
                <div className="flex items-center gap-2">
                  <Icons.Download className="w-5 h-5" />
                  {t('menu.downloads')}
                </div>
              </Link>

              <Link
                href="/search"
                className={`block text-primary-text dark:text-primary-text-dark font-medium 
                  hover:text-primary-text/80 dark:hover:text-primary-text-dark/80 transition-colors py-2
                  ${isActive('/search') ? 'border-l-2 pl-2 border-accent dark:border-accent-dark' : ''}`}
                onClick={() => setIsMenuOpen(false)}
              >
                <div className="flex items-center gap-2">
                  <Icons.MagnifyingGlass className="w-5 h-5" />
                  {t('menu.search')}
                </div>
              </Link>
            </div>

            {/* Tier 1: Secondary Navigation */}
            <div className="space-y-2 pb-4 border-b border-primary-border dark:border-border-dark">
            <Link
                href="/user"
                className={`block text-primary-text dark:text-primary-text-dark font-medium 
                  hover:text-primary-text/80 dark:hover:text-primary-text-dark/80 transition-colors py-2
                  ${isActive('/user') ? 'border-l-2 pl-2 border-accent dark:border-accent-dark' : ''}`}
                onClick={() => setIsMenuOpen(false)}
              >
                <div className="flex items-center gap-2">
                  <Icons.User className="w-5 h-5" />
                  {t('menu.user')}
                </div>
              </Link>

              <Link
                href="/link-history"
                className={`block text-primary-text dark:text-primary-text-dark font-medium 
                  hover:text-primary-text/80 dark:hover:text-primary-text-dark/80 transition-colors py-2
                  ${isActive('/link-history') ? 'border-l-2 pl-2 border-accent dark:border-accent-dark' : ''}`}
                onClick={() => setIsMenuOpen(false)}
              >
                <div className="flex items-center gap-2">
                  <Icons.History className="w-5 h-5" />
                  {t('menu.linkHistory')}
                </div>
              </Link>

              <Link
                href="/archived"
                className={`block text-primary-text dark:text-primary-text-dark font-medium 
                  hover:text-primary-text/80 dark:hover:text-primary-text-dark/80 transition-colors py-2
                  ${isActive('/archived') ? 'border-l-2 pl-2 border-accent dark:border-accent-dark' : ''}`}
                onClick={() => setIsMenuOpen(false)}
              >
                <div className="flex items-center gap-2">
                  <Icons.Archive className="w-5 h-5" />
                  {t('menu.archived')}
                </div>
              </Link>

              <Link
                href="/rss"
                className={`block text-primary-text dark:text-primary-text-dark font-medium 
                  hover:text-primary-text/80 dark:hover:text-primary-text-dark/80 transition-colors py-2
                  ${isActive('/rss') ? 'border-l-2 pl-2 border-accent dark:border-accent-dark' : ''}`}
                onClick={() => setIsMenuOpen(false)}
              >
                <div className="flex items-center gap-2">
                  <Icons.Rss className="w-5 h-5" />
                  {t('menu.rss')}
                </div>
              </Link>
            </div>

            {/* Tier 2: Utility Items */}
            <div className="space-y-2 pb-4 border-b border-primary-border dark:border-border-dark">
              <div className="flex items-center justify-between py-2">
                <span className="text-primary-text dark:text-primary-text-dark font-medium">
                  {t('menu.referrals')}
                </span>
                <ReferralDropdown />
              </div>
              {apiKey && (
                <div className="flex items-center justify-between py-2">
                  <span className="text-primary-text dark:text-primary-text-dark font-medium">
                    {t('menu.notifications')}
                  </span>
                  <NotificationBell apiKey={apiKey} />
                </div>
              )}
              <div className="flex items-center justify-between py-2">
                <span className="text-primary-text dark:text-primary-text-dark font-medium">
                  {t('menu.systemStatus')}
                </span>
                <SystemStatusIndicator apiKey={apiKey} />
              </div>
            </div>

            {/* Settings */}
            {isClient && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-primary-text dark:text-primary-text-dark font-medium">
                    {t('theme.toggleDark')}
                  </span>
                  <button
                    onClick={toggleDarkMode}
                    aria-label={
                      darkMode
                        ? t('theme.toggleLight')
                        : t('theme.toggleDark')
                    }
                    className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none bg-gray-200 dark:bg-gray-700"
                  >
                    <span
                      className={`${
                        darkMode ? 'translate-x-6' : 'translate-x-1'
                      } inline-flex items-center justify-center h-4 w-4 transform rounded-full transition-transform bg-white dark:bg-gray-800`}
                    >
                      {darkMode ? <Icons.Moon /> : <Icons.Sun />}
                    </span>
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-primary-text dark:text-primary-text-dark font-medium">
                    {t('menu.language') || 'Language'}
                  </span>
                  <LanguageSwitcher />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-primary-text dark:text-primary-text-dark font-medium">
                    GitHub
                  </span>
                  <a
                    href="https://github.com/HatriGt/torbox-app"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="GitHub Repository"
                    className="text-primary-text dark:text-primary-text-dark hover:text-primary-text/80 dark:hover:text-primary-text-dark/80 transition-colors"
                  >
                    <Icons.GitHub className="w-5 h-5" />
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
