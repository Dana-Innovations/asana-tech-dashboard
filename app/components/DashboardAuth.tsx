'use client';

import { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';

interface DashboardAuthProps {
  dashboardName: string;
  onAuthSuccess: () => void;
  slug: string;
}

export function DashboardAuth({ dashboardName, onAuthSuccess, slug }: DashboardAuthProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Check if password is stored in localStorage (remember me functionality)
      const storedAuth = localStorage.getItem(`dashboard-auth-${slug}`);
      
      // Interim password protection until Supabase is connected
      const techProjectsPassword = 'Sonance2024!'; // Temporary password for tech-projects dashboard
      
      if (password === techProjectsPassword) {
        // Store authentication in localStorage for persistence
        const authData = {
          slug,
          timestamp: Date.now(),
          expires: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
        };
        localStorage.setItem(`dashboard-auth-${slug}`, JSON.stringify(authData));
        
        onAuthSuccess();
      } else {
        setError('Incorrect password. Please try again.');
      }
    } catch (error) {
      setError('Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Check for existing authentication on component mount
  useState(() => {
    const storedAuth = localStorage.getItem(`dashboard-auth-${slug}`);
    if (storedAuth) {
      try {
        const authData = JSON.parse(storedAuth);
        if (authData.expires > Date.now()) {
          // Valid stored authentication
          onAuthSuccess();
          return;
        } else {
          // Expired authentication, remove it
          localStorage.removeItem(`dashboard-auth-${slug}`);
        }
      } catch (error) {
        // Invalid stored data, remove it
        localStorage.removeItem(`dashboard-auth-${slug}`);
      }
    }
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
            <Lock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Protected Dashboard
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            {dashboardName}
          </p>
          <p className="mt-1 text-center text-xs text-gray-500 dark:text-gray-500">
            Enter the password to access this dashboard
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 pl-10 pr-10 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Dashboard password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                <Lock className="h-4 w-4 text-gray-400" />
              </div>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="text-red-600 dark:text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading || !password.trim()}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                'Access Dashboard'
              )}
            </button>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Your authentication will be remembered for 7 days
            </p>
          </div>
        </form>

        <div className="mt-6 text-center">
          <a
            href="/"
            className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 text-sm"
          >
            ← Back to Dashboard List
          </a>
        </div>
      </div>
    </div>
  );
}