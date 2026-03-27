'use client';

import { useState } from 'react';
import { ChangelogModal } from './ChangelogModal';
import packageJson from '../../package.json';

export function VersionBadge() {
  const [showChangelog, setShowChangelog] = useState(false);

  return (
    <>
      <div className="fixed top-4 right-4 z-40">
        <button
          onClick={() => setShowChangelog(true)}
          className="bg-gray-500 dark:bg-gray-600 text-white text-xs font-mono px-2 py-1 rounded hover:bg-gray-600 dark:hover:bg-gray-500 transition-colors cursor-pointer"
        >
          v{packageJson.version}
        </button>
      </div>

      <ChangelogModal 
        isOpen={showChangelog} 
        onClose={() => setShowChangelog(false)} 
      />
    </>
  );
}