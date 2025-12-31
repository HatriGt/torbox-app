'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import ApiKeyInput from '@/components/downloads/ApiKeyInput';
import dynamic from 'next/dynamic';
import { useBackendMode } from '@/utils/backendDetector';

const Downloads = dynamic(() => import('@/components/downloads/Downloads'), {
  loading: () => <div className="flex justify-center items-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div></div>,
  ssr: false
});

const LandingPage = dynamic(() => import('@/components/LandingPage'), {
  ssr: false
});
import { Inter } from 'next/font/google';
import { useFileHandler } from '@/hooks/useFileHandler';
import { useUpload } from '@/components/shared/hooks/useUpload';
import ApiKeyDialog from '@/components/ApiKeyDialog';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export default function Home() {
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState(null);
  const { mode: backendMode } = useBackendMode();
  const { setLinkInput, validateAndAddFiles } = useUpload(apiKey, 'torrents');

  // Handle login when backend is enabled
  const handleLogin = async (apiKeyValue) => {
    if (backendMode !== 'backend') {
      // If backend is not enabled, just set the API key
      setApiKey(apiKeyValue);
      localStorage.setItem('torboxApiKey', apiKeyValue);
      return;
    }

    setIsLoggingIn(true);
    setLoginError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKeyValue })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Store session info
      localStorage.setItem('torboxApiKey', apiKeyValue);
      if (data.userId) {
        localStorage.setItem('torboxUserId', data.userId);
      }
      if (data.sessionToken) {
        localStorage.setItem('torboxSessionToken', data.sessionToken);
      }

      setApiKey(apiKeyValue);
      setLoginError(null);
    } catch (error) {
      console.error('Login failed:', error);
      setLoginError(error.message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  useEffect(() => {
    setIsClient(true);

    // Load API key from storage
    const storedKey = localStorage.getItem('torboxApiKey');
    const storedKeys = localStorage.getItem('torboxApiKeys');

    if (storedKey) {
      // If backend is enabled, verify login
      if (backendMode === 'backend') {
        handleLogin(storedKey);
      } else {
      setApiKey(storedKey);
      }
    } else if (storedKeys) {
      // If no active key but we have stored keys, use the first one
      try {
        const keys = JSON.parse(storedKeys);
        if (keys.length > 0) {
          const firstKey = keys[0].key;
          if (backendMode === 'backend') {
            handleLogin(firstKey);
          } else {
            setApiKey(firstKey);
            localStorage.setItem('torboxApiKey', firstKey);
          }
        }
      } catch (error) {
        console.error('Error parsing API keys from localStorage:', error);
      }
    }
    setLoading(false);

    // Register protocol handler
    if (
      'registerProtocolHandler' in navigator &&
      (window.matchMedia('(display-mode: standalone)').matches ||
        window.matchMedia('(display-mode: window-controls-overlay)').matches)
    ) {
      try {
        navigator.registerProtocolHandler(
          'magnet',
          `${window.location.origin}/?magnet=%s`,
          'TorBox Manager',
        );
      } catch (error) {
        console.error('Failed to register protocol handler:', error);
      }
    }

    // Set up file handling
    if ('launchQueue' in window && 'LaunchParams' in window) {
      window.launchQueue.setConsumer(async (launchParams) => {
        if (!launchParams.files.length) return;

        const fileHandles = launchParams.files;
        for (const fileHandle of fileHandles) {
          try {
            const file = await fileHandle.getFile();
            if (file.name.endsWith('.torrent') || file.name.endsWith('.nzb')) {
              window.dispatchEvent(
                new CustomEvent('fileReceived', {
                  detail: {
                    name: file.name,
                    type: file.type,
                    data: await file.arrayBuffer(),
                  },
                }),
              );
            }
          } catch (error) {
            console.error('Error handling file:', error);
          }
        }
      });
    }

    // Handle magnet links
    const urlParams = new URLSearchParams(window.location.search);
    const magnetLink = urlParams.get('magnet');
    if (magnetLink) {
      setLinkInput(magnetLink);
    }
  }, []);

  // Handle received files
  useFileHandler((file) => {
    if (!apiKey) {
      alert('Please enter your API key first');
      return;
    }

    // Here you can handle the file based on its type
    if (file.name.endsWith('.torrent')) {
      // Handle torrent file
      validateAndAddFiles([file]);
    } else if (file.name.endsWith('.nzb')) {
      // Handle NZB file
      validateAndAddFiles([file]);
    }
  });

  // Handle API key change
  const handleKeyChange = async (newKey) => {
    if (newKey && backendMode === 'backend') {
      // If backend is enabled, login with the new key
      await handleLogin(newKey);
    } else {
      // Otherwise just set the key
    setApiKey(newKey);
    localStorage.setItem('torboxApiKey', newKey);
    }
  };

  // Don't render anything until client-side hydration is complete
  if (!isClient)
    return (
      <div
        className={`min-h-screen bg-surface dark:bg-surface-dark ${inter.variable} font-sans`}
      ></div>
    );

  if (loading) return null;

  return (
    <main
      className={`min-h-screen bg-surface dark:bg-surface-dark ${inter.variable} font-sans`}
    >
      {!apiKey ? (
        <>
          <LandingPage 
            onKeyChange={handleKeyChange} 
            isLoggingIn={isLoggingIn}
            loginError={loginError}
          />
          <ApiKeyDialog
            isOpen={true}
            onClose={undefined} // Don't allow closing without API key
            onKeyChange={handleKeyChange}
            isLoggingIn={isLoggingIn}
            loginError={loginError}
          />
        </>
      ) : (
        <>
          <Header apiKey={apiKey} />
          <div className="container mx-auto px-4 md:px-6 lg:px-8 py-6">
            <ApiKeyInput
              value={apiKey}
              onKeyChange={handleKeyChange}
              allowKeyManager={true}
            />
            {loginError && (
              <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg text-red-700 dark:text-red-400">
                {loginError}
              </div>
            )}
            <Downloads apiKey={apiKey} />
          </div>
        </>
      )}
    </main>
  );
}
