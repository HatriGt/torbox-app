'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Spinner from '@/components/shared/Spinner';
import Icons from '@/components/icons';

export default function UserProfile({ apiKey, setToast }) {
  const t = useTranslations('User');
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    if (!apiKey) {
      setError('API key is required');
      return;
    }

    fetchUserProfile();
  }, [apiKey]);

  const fetchUserProfile = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/user/me', {
        headers: {
          'x-api-key': apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setUserData(data.data);
      } else {
        const errorMessage = data.error || data.detail || 'Failed to fetch user profile';
        setError(errorMessage);
        if (setToast) {
          setToast({
            message: errorMessage,
            type: 'error',
          });
        }
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
      const errorMessage = err.message || 'Failed to fetch user profile';
      setError(errorMessage);
      if (setToast) {
        setToast({
          message: errorMessage,
          type: 'error',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = async () => {
    if (!userData?.user_referral) return;
    
    const referralLink = `https://torbox.app/subscription?referral=${userData.user_referral}`;
    
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
      
      if (setToast) {
        setToast({
          message: t('copyLink'),
          type: 'success',
        });
      }
    } catch (err) {
      console.error('Failed to copy referral link:', err);
      if (setToast) {
        setToast({
          message: t('copyLinkFailed'),
          type: 'error',
        });
      }
    }
  };

  const copyReferralCode = async () => {
    if (!userData?.user_referral) return;
    
    try {
      await navigator.clipboard.writeText(userData.user_referral);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
      
      if (setToast) {
        setToast({
          message: 'Referral code copied!',
          type: 'success',
        });
      }
    } catch (err) {
      console.error('Failed to copy referral code:', err);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    } catch (err) {
      return 'Invalid Date';
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    try {
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    } catch (err) {
      return '0 B';
    }
  };

  const getPlanName = (planId) => {
    switch (planId) {
      case 0: return t('plans.free');
      case 1: return t('plans.essential');
      case 2: return t('plans.pro');
      case 3: return t('plans.standard');
      default: return t('plans.unknown');
    }
  };

  const getStatusDisplay = (userData) => {
    if (userData.plan > 0) {
      const expiryDate = new Date(userData.premium_expires_at);
      const now = new Date();
      if (expiryDate > now) {
        return { 
          status: t('status.active'), 
          color: 'bg-label-success-bg-dark text-label-success-text-dark border-label-success-bg-dark',
          icon: <Icons.CheckCircle className="w-4 h-4" />
        };
      } else {
        return { 
          status: t('status.expired'), 
          color: 'bg-label-danger-bg-dark text-label-danger-text-dark border-label-danger-bg-dark',
          icon: <Icons.XCircle className="w-4 h-4" />
        };
      }
    } else {
      return { 
        status: t('status.free'), 
        color: 'bg-label-default-bg-dark text-label-default-text-dark border-label-default-bg-dark',
        icon: <Icons.User className="w-4 h-4" />
      };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Icons.AlertCircle className="w-16 h-16 text-label-danger-text-dark mb-4" />
        <p className="text-label-danger-text-dark text-lg mb-4">{error}</p>
        <button
          onClick={fetchUserProfile}
          className="px-6 py-2.5 bg-accent dark:bg-accent-dark text-white rounded-lg hover:bg-accent/90 dark:hover:bg-accent-dark/90 transition-all duration-200 font-medium"
        >
          {t('retry')}
        </button>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-primary-text/70 dark:text-primary-text-dark/70">{t('noData')}</p>
      </div>
    );
  }

  const statusInfo = getStatusDisplay(userData);
  const ratio = userData.total_bytes_downloaded > 0 
    ? (userData.total_bytes_uploaded / userData.total_bytes_downloaded).toFixed(2)
    : '∞';

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-surface-alt dark:bg-surface-alt-dark border border-border dark:border-border-dark rounded-xl p-6 shadow-sm dark:shadow-none">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-accent/10 dark:bg-accent-dark/10 flex items-center justify-center">
              <Icons.User className="w-8 h-8 text-accent dark:text-accent-dark" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-primary-text dark:text-primary-text-dark">
                {userData.email || 'User'}
              </h2>
              <p className="text-sm text-primary-text/70 dark:text-primary-text-dark/70 mt-1">
                {t('profile.userId')}: {userData.id || 'N/A'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-4 py-2 rounded-lg text-sm font-medium border flex items-center gap-2 ${statusInfo.color}`}>
              {statusInfo.icon}
              {statusInfo.status}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Downloads */}
        <div className="bg-surface-alt dark:bg-surface-alt-dark border border-border dark:border-border-dark rounded-xl p-5 hover:border-accent/30 dark:hover:border-accent-dark/30 transition-all duration-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-accent/10 dark:bg-accent-dark/10 flex items-center justify-center">
              <Icons.Download className="w-5 h-5 text-accent dark:text-accent-dark" />
            </div>
            <div className="text-xs font-medium text-primary-text/70 dark:text-primary-text-dark/70 uppercase tracking-wide">
              {t('profile.totalDownloads')}
            </div>
          </div>
          <div className="text-2xl font-bold text-primary-text dark:text-primary-text-dark">
            {userData.total_downloaded || 0}
          </div>
        </div>

        {/* Total Downloaded */}
        <div className="bg-surface-alt dark:bg-surface-alt-dark border border-border dark:border-border-dark rounded-xl p-5 hover:border-accent/30 dark:hover:border-accent-dark/30 transition-all duration-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-label-success-bg-dark/20 flex items-center justify-center">
              <Icons.HardDrive className="w-5 h-5 text-label-success-text-dark" />
            </div>
            <div className="text-xs font-medium text-primary-text/70 dark:text-primary-text-dark/70 uppercase tracking-wide">
              {t('profile.totalSize')}
            </div>
          </div>
          <div className="text-2xl font-bold text-primary-text dark:text-primary-text-dark">
            {formatBytes(userData.total_bytes_downloaded || 0)}
          </div>
        </div>

        {/* Total Uploaded */}
        <div className="bg-surface-alt dark:bg-surface-alt-dark border border-border dark:border-border-dark rounded-xl p-5 hover:border-accent/30 dark:hover:border-accent-dark/30 transition-all duration-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-label-active-bg-dark/20 flex items-center justify-center">
              <Icons.CloudUpload className="w-5 h-5 text-label-active-text-dark" />
            </div>
            <div className="text-xs font-medium text-primary-text/70 dark:text-primary-text-dark/70 uppercase tracking-wide">
              {t('profile.totalUploaded')}
            </div>
          </div>
          <div className="text-2xl font-bold text-primary-text dark:text-primary-text-dark">
            {formatBytes(userData.total_bytes_uploaded || 0)}
          </div>
        </div>

        {/* Ratio */}
        <div className="bg-surface-alt dark:bg-surface-alt-dark border border-border dark:border-border-dark rounded-xl p-5 hover:border-accent/30 dark:hover:border-accent-dark/30 transition-all duration-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-label-warning-bg-dark/20 flex items-center justify-center">
              <Icons.BarChart3 className="w-5 h-5 text-label-warning-text-dark" />
            </div>
            <div className="text-xs font-medium text-primary-text/70 dark:text-primary-text-dark/70 uppercase tracking-wide">
              {t('profile.ratio')}
            </div>
          </div>
          <div className="text-2xl font-bold text-primary-text dark:text-primary-text-dark">
            {ratio}
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Account Information Card */}
        <div className="bg-surface-alt dark:bg-surface-alt-dark border border-border dark:border-border-dark rounded-xl p-6 shadow-sm dark:shadow-none">
          <h3 className="text-lg font-semibold text-primary-text dark:text-primary-text-dark mb-6 flex items-center gap-2">
            <Icons.User className="w-5 h-5 text-accent dark:text-accent-dark" />
            {t('profile.basicInfo')}
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-primary-text/70 dark:text-primary-text-dark/70 uppercase tracking-wide mb-1 block">
                {t('profile.email')}
              </label>
              <p className="text-base text-primary-text dark:text-primary-text-dark font-medium">
                {userData.email || 'N/A'}
              </p>
            </div>

            <div>
              <label className="text-xs font-medium text-primary-text/70 dark:text-primary-text-dark/70 uppercase tracking-wide mb-1 block">
                {t('profile.plan')}
              </label>
              <p className="text-base text-primary-text dark:text-primary-text-dark font-medium">
                {getPlanName(userData.plan)}
              </p>
            </div>

            {userData.plan > 0 && (
              <div>
                <label className="text-xs font-medium text-primary-text/70 dark:text-primary-text-dark/70 uppercase tracking-wide mb-1 block">
                  {t('profile.planExpiry')}
                </label>
                <p className="text-base text-primary-text dark:text-primary-text-dark font-medium">
                  {formatDate(userData.premium_expires_at)}
                </p>
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-primary-text/70 dark:text-primary-text-dark/70 uppercase tracking-wide mb-1 block">
                {t('profile.createdAt')}
              </label>
              <p className="text-base text-primary-text dark:text-primary-text-dark font-medium">
                {formatDate(userData.created_at)}
              </p>
            </div>

            <div>
              <label className="text-xs font-medium text-primary-text/70 dark:text-primary-text-dark/70 uppercase tracking-wide mb-1 block">
                {t('profile.lastLogin')}
              </label>
              <p className="text-base text-primary-text dark:text-primary-text-dark font-medium">
                {formatDate(userData.updated_at)}
              </p>
            </div>
          </div>
        </div>

        {/* Referral Card */}
        <div className="bg-surface-alt dark:bg-surface-alt-dark border border-border dark:border-border-dark rounded-xl p-6 shadow-sm dark:shadow-none">
          <h3 className="text-lg font-semibold text-primary-text dark:text-primary-text-dark mb-6 flex items-center gap-2">
            <Icons.Gift className="w-5 h-5 text-accent dark:text-accent-dark" />
            Referral Program
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-primary-text/70 dark:text-primary-text-dark/70 uppercase tracking-wide mb-2 block">
                {t('profile.referralCode')}
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 px-4 py-2.5 bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-lg font-mono text-sm text-primary-text dark:text-primary-text-dark">
                  {userData.user_referral || 'N/A'}
                </div>
                <button
                  onClick={copyReferralCode}
                  className="px-3 py-2.5 bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-lg hover:bg-surface-alt dark:hover:bg-surface-alt-dark hover:border-accent/50 dark:hover:border-accent-dark/50 transition-all duration-200"
                  title="Copy code"
                >
                  {copiedCode ? (
                    <Icons.Check className="w-5 h-5 text-label-success-text-dark" />
                  ) : (
                    <Icons.Copy className="w-5 h-5 text-primary-text/70 dark:text-primary-text-dark/70" />
                  )}
                </button>
              </div>
            </div>

            {userData.user_referral && (
              <div>
                <label className="text-xs font-medium text-primary-text/70 dark:text-primary-text-dark/70 uppercase tracking-wide mb-2 block">
                  {t('referralLink')}
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-4 py-2.5 bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-lg font-mono text-xs text-primary-text dark:text-primary-text-dark break-all">
                    https://torbox.app/subscription?referral={userData.user_referral}
                  </div>
                  <button
                    onClick={copyReferralLink}
                    className="px-3 py-2.5 bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-lg hover:bg-surface-alt dark:hover:bg-surface-alt-dark hover:border-accent/50 dark:hover:border-accent-dark/50 transition-all duration-200"
                    title={t('copyLink')}
                  >
                    {copiedLink ? (
                      <Icons.Check className="w-5 h-5 text-label-success-text-dark" />
                    ) : (
                      <Icons.Copy className="w-5 h-5 text-primary-text/70 dark:text-primary-text-dark/70" />
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Download Breakdown Card */}
      <div className="bg-surface-alt dark:bg-surface-alt-dark border border-border dark:border-border-dark rounded-xl p-6 shadow-sm dark:shadow-none">
        <h3 className="text-lg font-semibold text-primary-text dark:text-primary-text-dark mb-6 flex items-center gap-2">
          <Icons.BarChart3 className="w-5 h-5 text-accent dark:text-accent-dark" />
          {t('profile.downloadBreakdown')}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <Icons.Torrent className="w-5 h-5 text-accent dark:text-accent-dark rotate-[135deg]" />
              <span className="text-sm font-medium text-primary-text/70 dark:text-primary-text-dark/70">
                {t('profile.torrentDownloads')}
              </span>
            </div>
            <div className="text-2xl font-bold text-primary-text dark:text-primary-text-dark">
              {userData.torrents_downloaded || 0}
            </div>
          </div>

          <div className="p-4 bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <Icons.Webdl className="w-5 h-5 text-accent dark:text-accent-dark" />
              <span className="text-sm font-medium text-primary-text/70 dark:text-primary-text-dark/70">
                {t('profile.webDownloads')}
              </span>
            </div>
            <div className="text-2xl font-bold text-primary-text dark:text-primary-text-dark">
              {userData.web_downloads_downloaded || 0}
            </div>
          </div>

          <div className="p-4 bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <Icons.Usenet className="w-5 h-5 text-accent dark:text-accent-dark" />
              <span className="text-sm font-medium text-primary-text/70 dark:text-primary-text-dark/70">
                {t('profile.usenetDownloads')}
              </span>
            </div>
            <div className="text-2xl font-bold text-primary-text dark:text-primary-text-dark">
              {userData.usenet_downloads_downloaded || 0}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
