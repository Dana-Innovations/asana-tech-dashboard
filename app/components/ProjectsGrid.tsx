'use client';

import { useState, useMemo } from 'react';
import { AsanaProject } from '../types/asana';

type GroupBy = 'all' | 'type' | 'department' | 'priority' | 'stage';

function getStatusColor(p: AsanaProject): string {
  return p.current_status?.color === 'green' ? '#22c55e' : p.current_status?.color === 'yellow' ? '#eab308' : p.current_status?.color === 'red' ? '#ef4444' : '#6b7280';
}
function getField(p: AsanaProject, name: string): string {
  return p.custom_fields?.find(f => f.name?.toLowerCase().includes(name.toLowerCase()))?.display_value || '—';
}
function getOwner(p: AsanaProject): string { return p.members?.[0]?.name || '—'; }

interface Props { projects: AsanaProject[]; onProjectClick?: (p: AsanaProject) => void; }

export function ProjectsGrid({ projects, onProjectClick }: Props) {
  const [groupBy, setGroupBy] = useState<GroupBy>('type');
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const groups = useMemo(() => {
    if (groupBy === 'all') return [{ key: 'All Projects', projects }];
    const map = new Map<string, AsanaProject[]>();
    projects.forEach(p => {
      const key = groupBy === 'type' ? getField(p, 'type') : groupBy === 'department' ? getField(p, 'department') : groupBy === 'priority' ? getField(p, 'priority') : getField(p, 'stage');
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([key, projects]) => ({ key, projects }));
  }, [projects, groupBy]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-400">Group by:</span>
        {(['all', 'type', 'department', 'priority', 'stage'] as GroupBy[]).map(g => (
          <button key={g} onClick={() => setGroupBy(g)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${groupBy === g ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
            {g.charAt(0).toUpperCase() + g.slice(1)}
          </button>
        ))}
      </div>

      {groups.map(group => {
        const isCollapsed = collapsed.has(group.key);
        return (
          <div key={group.key} className="space-y-3">
            <button onClick={() => { const n = new Set(collapsed); isCollapsed ? n.delete(group.key) : n.add(group.key); setCollapsed(n); }}
              className="flex items-center gap-2 w-full text-left group cursor-pointer">
              <span className="text-gray-500 text-xs transition-transform" style={{ transform: isCollapsed ? 'rotate(-90deg)' : '' }}>▼</span>
              <span className="text-sm font-semibold text-gray-300 group-hover:text-white">{group.key}</span>
              <span className="text-xs text-gray-600 bg-gray-800 px-2 py-0.5 rounded-full">{group.projects.length}</span>
            </button>

            {!isCollapsed && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {group.projects.map(p => {
                  const color = getStatusColor(p);
                  const progress = p.progress?.percentage || 0;
                  return (
                    <div key={p.gid} onClick={() => onProjectClick?.(p)}
                      className="border border-gray-700/60 rounded-xl p-4 bg-gray-900/50 hover:bg-gray-800/50 hover:border-gray-600 cursor-pointer transition-all group">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0 pr-2">
                          <h3 className="text-sm font-semibold text-gray-200 truncate group-hover:text-white">{p.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 font-mono">{getField(p, 'type')}</span>
                            <span className="text-xs text-gray-500 truncate">{getField(p, 'department')}</span>
                          </div>
                        </div>
                        <div className="w-3 h-3 rounded-full shrink-0 mt-1" style={{ backgroundColor: color }} />
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between text-gray-400"><span>Stage</span><span className="text-gray-300">{getField(p, 'stage')}</span></div>
                        <div className="flex justify-between text-gray-400"><span>Priority</span><span className={`font-bold ${getField(p,'priority')==='P1'?'text-red-400':getField(p,'priority')==='P2'?'text-yellow-400':'text-gray-500'}`}>{getField(p, 'priority')}</span></div>
                        <div className="flex justify-between text-gray-400"><span>Owner</span><span className="text-gray-300">{getOwner(p)}</span></div>
                        {progress > 0 && (<div className="pt-1"><div className="w-full h-1.5 rounded-full bg-gray-700 overflow-hidden"><div className="h-full rounded-full" style={{width:`${progress}%`, backgroundColor: color}}/></div></div>)}
                        <div className="text-gray-600 pt-1">Updated {p.modified_at ? new Date(p.modified_at).toLocaleDateString('en-US',{month:'short',day:'numeric'}) : '—'}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
