'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Github, Zap, Bug, TrendingUp } from 'lucide-react';
import { changelog, type ChangelogEntry } from '../lib/changelog';

interface ChangelogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChangelogModal({ isOpen, onClose }: ChangelogModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const getChangeIcon = (type: 'feature' | 'fix' | 'improvement') => {
    switch (type) {
      case 'feature':
        return <Zap className="w-4 h-4 text-green-500" />;
      case 'fix':
        return <Bug className="w-4 h-4 text-red-500" />;
      case 'improvement':
        return <TrendingUp className="w-4 h-4 text-blue-500" />;
    }
  };

  const getChangeTypeLabel = (type: 'feature' | 'fix' | 'improvement') => {
    switch (type) {
      case 'feature':
        return 'New Feature';
      case 'fix':
        return 'Bug Fix';
      case 'improvement':
        return 'Improvement';
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Github className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Release Notes
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Technology & Innovation Dashboard
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="px-6 py-4">
            {changelog.map((entry, index) => (
              <div key={entry.version} className={index > 0 ? 'mt-8' : ''}>
                {/* Version Header */}
                <div className="flex items-center space-x-3 mb-4">
                  <div className="bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 px-3 py-1 rounded-full text-sm font-mono font-bold">
                    v{entry.version}
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(entry.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>

                {/* Changes */}
                <div className="space-y-3">
                  {entry.changes.map((change, changeIndex) => (
                    <div key={changeIndex} className="flex items-start space-x-3">
                      {getChangeIcon(change.type)}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            {getChangeTypeLabel(change.type)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                          {change.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Built with ❤️ for Technology & Innovation
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}