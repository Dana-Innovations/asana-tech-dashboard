'use client';

export function VersionBadge() {
  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="bg-gray-500 dark:bg-gray-600 text-white text-xs font-mono px-2 py-1 rounded">
        v1.0.0
      </div>
    </div>
  );
}