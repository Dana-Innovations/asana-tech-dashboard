'use client';

import { useEffect, useRef, useState } from 'react';
import packageJson from '../../package.json';

export function AutoRefresh() {
  const currentVersion = useRef(packageJson.version);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    const checkForUpdates = async () => {
      try {
        const res = await fetch(`/api/version?_t=${Date.now()}`, { cache: 'no-store' });
        const data = await res.json();
        if (data.version && data.version !== currentVersion.current) {
          console.log(`[AutoRefresh] New version: v${data.version} (was v${currentVersion.current})`);
          setUpdateAvailable(true);
          setTimeout(() => window.location.reload(), 1500);
        }
      } catch (e) { /* silent */ }
    };

    // Check every 15 seconds for faster updates during dev
    const interval = setInterval(checkForUpdates, 15000);
    return () => clearInterval(interval);
  }, []);

  if (!updateAvailable) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] bg-blue-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-pulse">
      <div className="w-2 h-2 bg-white rounded-full animate-ping" />
      <span className="text-sm font-medium">New version available — refreshing...</span>
    </div>
  );
}
