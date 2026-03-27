'use client';

import { useState } from 'react';
import { ChangelogModal } from './ChangelogModal';
import packageJson from '../../package.json';

export function VersionBadge() {
  const [showChangelog, setShowChangelog] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowChangelog(true)}
        className="bg-gray-500 dark:bg-gray-600 text-white text-xs font-mono px-2 py-1 rounded hover:bg-gray-600 dark:hover:bg-gray-500 transition-colors"
      >
        v{packageJson.version}
      </button>

      <ChangelogModal 
        isOpen={showChangelog} 
        onClose={() => setShowChangelog(false)} 
      />
    </>
  );
}