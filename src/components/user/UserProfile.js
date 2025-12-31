'use client';

import { useState, useEffect, useRef } from 'react';
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
  const [mounted, setMounted] = useState(false);
  const statsRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

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
          icon: <Icons.CheckCircle className="w-4 h-4" />,
          pulse: true
        };
      } else {
        return { 
          status: t('status.expired'), 
          color: 'bg-label-danger-bg-dark text-label-danger-text-dark border-label-danger-bg-dark',
          icon: <Icons.XCircle className="w-4 h-4" />,
          pulse: false
        };
      }
    } else {
      return { 
        status: t('status.free'), 
        color: 'bg-label-default-bg-dark text-label-default-text-dark border-label-default-bg-dark',
        icon: <Icons.User className="w-4 h-4" />,
        pulse: false
      };
    }
  };

  // Animated number counter component
  const AnimatedNumber = ({ value, duration = 1000, className = '' }) => {
    const [displayValue, setDisplayValue] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !isVisible) {
            setIsVisible(true);
            animateNumber(0, value, duration);
          }
        },
        { threshold: 0.1 }
      );

      if (ref.current) {
        observer.observe(ref.current);
      }

      return () => {
        if (ref.current) {
          observer.unobserve(ref.current);
        }
      };
    }, [value, duration, isVisible]);

    const animateNumber = (start, end, duration) => {
      const startTime = performance.now();
      const isFloat = typeof end === 'number' && end % 1 !== 0;

      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function (ease-out)
        const easeOut = 1 - Math.pow(1 - progress, 3);
        
        const current = start + (end - start) * easeOut;
        setDisplayValue(isFloat ? parseFloat(current.toFixed(2)) : Math.floor(current));

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setDisplayValue(end);
        }
      };

      requestAnimationFrame(animate);
    };

    return <span ref={ref} className={className}>{displayValue}</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-pulse">
          <Spinner />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center py-16 ${mounted ? 'animate-fade-in' : 'opacity-0'}`}>
        <div className="animate-bounce">
          <Icons.AlertCircle className="w-16 h-16 text-label-danger-text-dark mb-4" />
        </div>
        <p className="text-label-danger-text-dark text-lg mb-4">{error}</p>
        <button
          onClick={fetchUserProfile}
          className="px-6 py-2.5 bg-accent dark:bg-accent-dark text-white rounded-lg hover:bg-accent/90 dark:hover:bg-accent-dark/90 transition-all duration-200 font-medium hover:scale-105 active:scale-95 shadow-md"
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

  const totalDownloaded = userData.total_bytes_downloaded || 0;
  const totalUploaded = userData.total_bytes_uploaded || 0;
  const totalSize = totalDownloaded + totalUploaded;
  const downloadPercentage = totalSize > 0 ? (totalDownloaded / totalSize) * 100 : 0;
  const uploadPercentage = totalSize > 0 ? (totalUploaded / totalSize) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header Card with slide-in animation */}
      <div className={`bg-surface-alt dark:bg-surface-alt-dark border border-border dark:border-border-dark rounded-xl p-6 shadow-md dark:shadow-lg overflow-hidden relative ${mounted ? 'animate-slide-in-up' : 'opacity-0'}`}>
        {/* Gradient accent line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent/0 via-accent dark:via-accent-dark to-accent/0"></div>
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-accent/10 dark:bg-accent-dark/10 flex items-center justify-center relative group">
              <div className="absolute inset-0 rounded-full bg-accent/20 dark:bg-accent-dark/20 animate-ping opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <Icons.User className="w-8 h-8 text-accent dark:text-accent-dark relative z-10 transition-transform duration-300 group-hover:scale-110" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-primary-text dark:text-primary-text-dark transition-colors">
                {userData.email || 'User'}
              </h2>
              <p className="text-sm text-primary-text/70 dark:text-primary-text-dark/70 mt-1">
                {t('profile.userId')}: {userData.id || 'N/A'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-4 py-2 rounded-lg text-sm font-medium border flex items-center gap-2 transition-all duration-300 hover:scale-105 ${statusInfo.color} ${statusInfo.pulse ? 'animate-pulse-slow' : ''}`}>
              {statusInfo.icon}
              {statusInfo.status}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid with stagger animation */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" ref={statsRef}>
        {/* Total Downloads */}
        <div className={`bg-surface-alt dark:bg-surface-alt-dark border border-border dark:border-border-dark rounded-xl p-5 hover:border-accent/50 dark:hover:border-accent-dark/50 transition-all duration-300 hover:scale-105 hover:shadow-lg dark:hover:shadow-xl group relative overflow-hidden shadow-md dark:shadow-lg ${mounted ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0ms' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent dark:from-accent-dark/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 dark:bg-accent-dark/10 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                <Icons.Download className="w-5 h-5 text-accent dark:text-accent-dark" />
              </div>
              <div className="text-xs font-medium text-primary-text/70 dark:text-primary-text-dark/70 uppercase tracking-wide">
                {t('profile.totalDownloads')}
              </div>
            </div>
            <div className="text-2xl font-bold text-primary-text dark:text-primary-text-dark">
              <AnimatedNumber value={userData.total_downloaded || 0} duration={800} />
            </div>
          </div>
        </div>

        {/* Total Downloaded */}
        <div className={`bg-surface-alt dark:bg-surface-alt-dark border border-border dark:border-border-dark rounded-xl p-5 hover:border-label-success-bg-dark/50 transition-all duration-300 hover:scale-105 hover:shadow-lg dark:hover:shadow-xl group relative overflow-hidden shadow-md dark:shadow-lg ${mounted ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '100ms' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-label-success-bg-dark/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-label-success-bg-dark/20 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
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
        </div>

        {/* Total Uploaded */}
        <div className={`bg-surface-alt dark:bg-surface-alt-dark border border-border dark:border-border-dark rounded-xl p-5 hover:border-label-active-bg-dark/50 transition-all duration-300 hover:scale-105 hover:shadow-lg dark:hover:shadow-xl group relative overflow-hidden shadow-md dark:shadow-lg ${mounted ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '200ms' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-label-active-bg-dark/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-label-active-bg-dark/20 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
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
        </div>

        {/* Ratio */}
        <div className={`bg-surface-alt dark:bg-surface-alt-dark border border-border dark:border-border-dark rounded-xl p-5 hover:border-label-warning-bg-dark/50 transition-all duration-300 hover:scale-105 hover:shadow-lg dark:hover:shadow-xl group relative overflow-hidden shadow-md dark:shadow-lg ${mounted ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '300ms' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-label-warning-bg-dark/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-label-warning-bg-dark/20 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
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
      </div>

      {/* Data Usage Visualization */}
      {totalSize > 0 && (
        <div className={`bg-surface-alt dark:bg-surface-alt-dark border border-border dark:border-border-dark rounded-xl p-6 shadow-md dark:shadow-lg ${mounted ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '400ms' }}>
          <h3 className="text-lg font-semibold text-primary-text dark:text-primary-text-dark mb-4 flex items-center gap-2">
            <Icons.BarChart3 className="w-5 h-5 text-accent dark:text-accent-dark" />
            Data Usage Overview
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-primary-text/70 dark:text-primary-text-dark/70">Downloaded</span>
                <span className="text-primary-text dark:text-primary-text-dark font-medium">{formatBytes(totalDownloaded)}</span>
              </div>
              <div className="h-3 bg-surface dark:bg-surface-dark rounded-full overflow-hidden">
                <div 
                  className="h-full bg-label-success-bg-dark transition-all duration-1000 ease-out"
                  style={{ width: `${downloadPercentage}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-primary-text/70 dark:text-primary-text-dark/70">Uploaded</span>
                <span className="text-primary-text dark:text-primary-text-dark font-medium">{formatBytes(totalUploaded)}</span>
              </div>
              <div className="h-3 bg-surface dark:bg-surface-dark rounded-full overflow-hidden">
                <div 
                  className="h-full bg-label-active-bg-dark transition-all duration-1000 ease-out"
                  style={{ width: `${uploadPercentage}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Account Information Card */}
        <div className={`bg-surface-alt dark:bg-surface-alt-dark border border-border dark:border-border-dark rounded-xl p-6 shadow-md dark:shadow-lg transition-all duration-300 hover:shadow-lg dark:hover:shadow-xl ${mounted ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '500ms' }}>
          <h3 className="text-lg font-semibold text-primary-text dark:text-primary-text-dark mb-6 flex items-center gap-2">
            <Icons.User className="w-5 h-5 text-accent dark:text-accent-dark" />
            {t('profile.basicInfo')}
          </h3>
          
          <div className="space-y-4">
            <div className="group">
              <label className="text-xs font-medium text-primary-text/70 dark:text-primary-text-dark/70 uppercase tracking-wide mb-1 block transition-colors group-hover:text-accent dark:group-hover:text-accent-dark">
                {t('profile.email')}
              </label>
              <p className="text-base text-primary-text dark:text-primary-text-dark font-medium">
                {userData.email || 'N/A'}
              </p>
            </div>

            <div className="group">
              <label className="text-xs font-medium text-primary-text/70 dark:text-primary-text-dark/70 uppercase tracking-wide mb-1 block transition-colors group-hover:text-accent dark:group-hover:text-accent-dark">
                {t('profile.plan')}
              </label>
              <p className="text-base text-primary-text dark:text-primary-text-dark font-medium">
                {getPlanName(userData.plan)}
              </p>
            </div>

            {userData.plan > 0 && (
              <div className="group">
                <label className="text-xs font-medium text-primary-text/70 dark:text-primary-text-dark/70 uppercase tracking-wide mb-1 block transition-colors group-hover:text-accent dark:group-hover:text-accent-dark">
                  {t('profile.planExpiry')}
                </label>
                <p className="text-base text-primary-text dark:text-primary-text-dark font-medium">
                  {formatDate(userData.premium_expires_at)}
                </p>
              </div>
            )}

            <div className="group">
              <label className="text-xs font-medium text-primary-text/70 dark:text-primary-text-dark/70 uppercase tracking-wide mb-1 block transition-colors group-hover:text-accent dark:group-hover:text-accent-dark">
                {t('profile.createdAt')}
              </label>
              <p className="text-base text-primary-text dark:text-primary-text-dark font-medium">
                {formatDate(userData.created_at)}
              </p>
            </div>

            <div className="group">
              <label className="text-xs font-medium text-primary-text/70 dark:text-primary-text-dark/70 uppercase tracking-wide mb-1 block transition-colors group-hover:text-accent dark:group-hover:text-accent-dark">
                {t('profile.lastLogin')}
              </label>
              <p className="text-base text-primary-text dark:text-primary-text-dark font-medium">
                {formatDate(userData.updated_at)}
              </p>
            </div>
          </div>
        </div>

        {/* Referral Card */}
        <div className={`bg-surface-alt dark:bg-surface-alt-dark border border-border dark:border-border-dark rounded-xl p-6 shadow-md dark:shadow-lg transition-all duration-300 hover:shadow-lg dark:hover:shadow-xl ${mounted ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '600ms' }}>
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
                <div className="flex-1 px-4 py-2.5 bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-lg font-mono text-sm text-primary-text dark:text-primary-text-dark transition-all duration-200 hover:border-accent/50 dark:hover:border-accent-dark/50">
                  {userData.user_referral || 'N/A'}
                </div>
                <button
                  onClick={copyReferralCode}
                  className="px-3 py-2.5 bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-lg hover:bg-surface-alt dark:hover:bg-surface-alt-dark hover:border-accent/50 dark:hover:border-accent-dark/50 transition-all duration-200 hover:scale-110 active:scale-95"
                  title="Copy code"
                >
                  {copiedCode ? (
                    <Icons.Check className="w-5 h-5 text-label-success-text-dark animate-scale-in" />
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
                  <div className="flex-1 px-4 py-2.5 bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-lg font-mono text-xs text-primary-text dark:text-primary-text-dark break-all transition-all duration-200 hover:border-accent/50 dark:hover:border-accent-dark/50">
                    https://torbox.app/subscription?referral={userData.user_referral}
                  </div>
                  <button
                    onClick={copyReferralLink}
                    className="px-3 py-2.5 bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-lg hover:bg-surface-alt dark:hover:bg-surface-alt-dark hover:border-accent/50 dark:hover:border-accent-dark/50 transition-all duration-200 hover:scale-110 active:scale-95"
                    title={t('copyLink')}
                  >
                    {copiedLink ? (
                      <Icons.Check className="w-5 h-5 text-label-success-text-dark animate-scale-in" />
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
      <div className={`bg-surface-alt dark:bg-surface-alt-dark border border-border dark:border-border-dark rounded-xl p-6 shadow-md dark:shadow-lg transition-all duration-300 hover:shadow-lg dark:hover:shadow-xl ${mounted ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '700ms' }}>
        <h3 className="text-lg font-semibold text-primary-text dark:text-primary-text-dark mb-6 flex items-center gap-2">
          <Icons.BarChart3 className="w-5 h-5 text-accent dark:text-accent-dark" />
          {t('profile.downloadBreakdown')}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-lg transition-all duration-300 hover:scale-105 hover:border-accent/50 dark:hover:border-accent-dark/50 group">
            <div className="flex items-center gap-3 mb-2">
              <Icons.Torrent className="w-5 h-5 text-accent dark:text-accent-dark rotate-[135deg] transition-transform duration-300 group-hover:rotate-180" />
              <span className="text-sm font-medium text-primary-text/70 dark:text-primary-text-dark/70">
                {t('profile.torrentDownloads')}
              </span>
            </div>
            <div className="text-2xl font-bold text-primary-text dark:text-primary-text-dark">
              <AnimatedNumber value={userData.torrents_downloaded || 0} duration={800} />
            </div>
          </div>

          <div className="p-4 bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-lg transition-all duration-300 hover:scale-105 hover:border-accent/50 dark:hover:border-accent-dark/50 group">
            <div className="flex items-center gap-3 mb-2">
              <Icons.Webdl className="w-5 h-5 text-accent dark:text-accent-dark transition-transform duration-300 group-hover:scale-110" />
              <span className="text-sm font-medium text-primary-text/70 dark:text-primary-text-dark/70">
                {t('profile.webDownloads')}
              </span>
            </div>
            <div className="text-2xl font-bold text-primary-text dark:text-primary-text-dark">
              <AnimatedNumber value={userData.web_downloads_downloaded || 0} duration={800} />
            </div>
          </div>

          <div className="p-4 bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-lg transition-all duration-300 hover:scale-105 hover:border-accent/50 dark:hover:border-accent-dark/50 group">
            <div className="flex items-center gap-3 mb-2">
              <Icons.Usenet className="w-5 h-5 text-accent dark:text-accent-dark transition-transform duration-300 group-hover:scale-110" />
              <span className="text-sm font-medium text-primary-text/70 dark:text-primary-text-dark/70">
                {t('profile.usenetDownloads')}
              </span>
            </div>
            <div className="text-2xl font-bold text-primary-text dark:text-primary-text-dark">
              <AnimatedNumber value={userData.usenet_downloads_downloaded || 0} duration={800} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
