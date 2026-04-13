'use client';

import { useEffect, useRef, useState } from 'react';
import packageJson from '../../package.json';

/**
 * AutoRefresh - polls for new app versions and auto-reloads when a new version is deployed.
 * Checks every 30 seconds by fetching the page and comparing the version in the HTML.
 */
export function AutoRefresh() {
  const currentVersion = useRef(packageJson.version);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    const checkForUpdates = async () => {
      try {
        // Fetch the main page with cache-busting
        const res = await fetch(`/?_t=${Date.now()}`, { cache: 'no-store' });
        const html = await res.text();
        
        // Look for version in the HTML (package.json version gets embedded in the VersionBadge)
        const match = html.match(/v(\d+\.\d+\.\d+)/);
        if (match && match[1] !== currentVersion.current) {
          console.log(`[AutoRefresh] New version detected: v${match[1]} (current: v${currentVersion.current})`);
          setUpdateAvailable(true);
          // Auto-reload after a brief delay
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        }
      } catch (e) {
        // Silently fail — don't interrupt the user
      }
    };

    // Check every 30 seconds
    const interval = setInterval(checkForUpdates, 30000);
    
    return () => clearInterval(interval);
  }, []);

  if (!updateAvailable) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] bg-blue-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-pulse">
      <div className="w-2 h-2 bg-white rounded-full" />
      <span className="text-sm font-medium">New version available — refreshing...</span>
    </div>
  );
}
