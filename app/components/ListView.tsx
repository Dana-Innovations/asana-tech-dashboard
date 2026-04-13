'use client';

import { useState, useMemo } from 'react';
import { AsanaProject, SortField, SortOrder } from '../types/asana';
import { getStatusColor, getProjectPriority, getPriorityBadgeClasses } from '../lib/asana';
import { ChevronDown, ChevronUp, ArrowUpDown } from 'lucide-react';

interface ListViewProps {
  projects: AsanaProject[];
  onProjectClick?: (project: AsanaProject) => void;
}

export function ListView({ projects, onProjectClick }: ListViewProps) {
  const [sortField, setSortField] = useState<SortField>('modified_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const sorted = useMemo(() => {
    return [...projects].sort((a, b) => {
      let vA: any, vB: any;
      switch (sortField) {
        case 'name': vA = a.name.toLowerCase(); vB = b.name.toLowerCase(); break;
        case 'modified_at': vA = new Date(a.modified_at); vB = new Date(b.modified_at); break;
        case 'due_date': vA = a.due_date ? new Date(a.due_date) : new Date('9999-12-31'); vB = b.due_date ? new Date(b.due_date) : new Date('9999-12-31'); break;
        case 'progress': vA = a.progress?.percentage || 0; vB = b.progress?.percentage || 0; break;
        default: return 0;
      }
      if (vA < vB) return sortOrder === 'asc' ? -1 : 1;
      if (vA > vB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [projects, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortOrder('asc'); }
  };

  const getField = (p: AsanaProject, name: string) => {
    return p.custom_fields?.find(f => f.name === name)?.display_value || '-';
  };

  const getStatusDot = (p: AsanaProject) => {
    const c = getStatusColor(p);
    const cls = c === 'green' ? 'bg-emerald-500' : c === 'yellow' ? 'bg-amber-500' : c === 'red' ? 'bg-red-500' : 'bg-gray-400';
    return <div className={`w-3 h-3 ${cls} rounded-full`} />;
  };

  const getTypeBadge = (p: AsanaProject) => {
    const val = getField(p, 'Project Type');
    if (val === '-') return <span className="text-gray-400">-</span>;
    const code = val.split(' - ')[0] || val;
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
        {code}
      </span>
    );
  };

  const getPriorityBadge = (p: AsanaProject) => {
    const priority = getProjectPriority(p);
    if (!priority) return <span className="text-gray-400">-</span>;
    const classes = getPriorityBadgeClasses(priority);
    return (
      <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded ${classes || ''}`}>
        {priority}
      </span>
    );
  };

  const getOwner = (p: AsanaProject) => {
    if (!p.members || p.members.length === 0) return '-';
    return p.members[0].name.split(' ')[0];
  };

  const formatRelative = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return mins <= 1 ? 'now' : `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return `${Math.floor(days / 30)}mo ago`;
  };

  const SortBtn = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <button onClick={() => handleSort(field)}
      className="flex items-center space-x-1 text-left font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
      <span>{children}</span>
      {sortField === field ? (
        sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
      ) : (
        <ArrowUpDown className="w-4 h-4 opacity-40" />
      )}
    </button>
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-3 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 w-12">Health</th>
              <th className="px-3 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[280px]">
                <SortBtn field="name">Project Name</SortBtn>
              </th>
              <th className="px-3 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 w-20">Type</th>
              <th className="px-3 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 w-32">Department</th>
              <th className="px-3 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 w-32">Stage</th>
              <th className="px-3 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 w-16">Priority</th>
              <th className="px-3 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 w-24">Owner</th>
              <th className="px-3 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 w-28">
                <SortBtn field="progress">Progress</SortBtn>
              </th>
              <th className="px-3 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 w-32">Timeline</th>
              <th className="px-3 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 w-20">
                <SortBtn field="modified_at">Updated</SortBtn>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-6 py-12 text-center">
                  <div className="text-4xl mb-4">📊</div>
                  <p className="text-gray-500 dark:text-gray-400">No projects found</p>
                </td>
              </tr>
            ) : (
              sorted.map((p, i) => {
                const progress = p.progress?.percentage || 0;
                const statusColor = getStatusColor(p);
                const barColor = statusColor === 'green' ? '#22c55e' : statusColor === 'yellow' ? '#eab308' : statusColor === 'red' ? '#ef4444' : '#6b7280';

                return (
                  <tr key={p.gid}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer ${
                      i % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50/50 dark:bg-gray-900/50'
                    }`}
                    onClick={() => onProjectClick?.(p)}>
                    
                    <td className="px-3 py-2"><div className="flex justify-center">{getStatusDot(p)}</div></td>
                    
                    <td className="px-3 py-2">
                      <div className="font-medium text-gray-900 dark:text-white text-sm">{p.name}</div>
                    </td>
                    
                    <td className="px-3 py-2">{getTypeBadge(p)}</td>
                    
                    <td className="px-3 py-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{getField(p, 'Department')}</span>
                    </td>
                    
                    <td className="px-3 py-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{getField(p, 'T&I Stage')}</span>
                    </td>
                    
                    <td className="px-3 py-2">{getPriorityBadge(p)}</td>
                    
                    <td className="px-3 py-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{getOwner(p)}</span>
                    </td>
                    
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: barColor }} />
                        </div>
                        <span className="text-xs text-gray-500 w-8">{progress}%</span>
                      </div>
                    </td>
                    
                    <td className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {p.start_on || p.due_date ? (
                        <>
                          {p.start_on ? new Date(p.start_on).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '?'}
                          {' → '}
                          {p.due_date ? new Date(p.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '?'}
                        </>
                      ) : '-'}
                    </td>
                    
                    <td className="px-3 py-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">{formatRelative(p.modified_at)}</span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
