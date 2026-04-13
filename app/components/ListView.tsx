'use client';

import { useState, useMemo } from 'react';
import { AsanaProject, SortField, SortOrder } from '../types/asana';

function getStatusColor(p: AsanaProject): string {
  return p.current_status?.color === 'green' ? '#22c55e' : p.current_status?.color === 'yellow' ? '#eab308' : p.current_status?.color === 'red' ? '#ef4444' : '#6b7280';
}
function getField(p: AsanaProject, name: string): string {
  return p.custom_fields?.find(f => f.name?.toLowerCase().includes(name.toLowerCase()))?.display_value || '—';
}
function getOwner(p: AsanaProject): string { return p.members?.[0]?.name || '—'; }
function getHealthLabel(p: AsanaProject): string {
  return p.current_status?.color === 'green' ? 'On Track' : p.current_status?.color === 'yellow' ? 'At Risk' : p.current_status?.color === 'red' ? 'Off Track' : '—';
}

interface ListViewProps { projects: AsanaProject[]; onProjectClick?: (p: AsanaProject) => void; }

export function ListView({ projects, onProjectClick }: ListViewProps) {
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortOrder('asc'); }
  };

  const sorted = useMemo(() => [...projects].sort((a, b) => {
    let c = 0;
    if (sortField === 'name') c = a.name.localeCompare(b.name);
    else if (sortField === 'modified_at') c = (a.modified_at || '').localeCompare(b.modified_at || '');
    else if (sortField === 'due_date') c = (a.due_date || 'z').localeCompare(b.due_date || 'z');
    else if (sortField === 'progress') c = (a.progress?.percentage || 0) - (b.progress?.percentage || 0);
    return sortOrder === 'asc' ? c : -c;
  }), [projects, sortField, sortOrder]);

  const SortBtn = ({ field, label }: { field: SortField; label: string }) => (
    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-200" onClick={() => toggleSort(field)}>
      <div className="flex items-center gap-1">{label} <span className="text-[0.6rem]">{sortField === field ? (sortOrder === 'asc' ? '▲' : '▼') : '△'}</span></div>
    </th>
  );

  return (
    <div className="border border-gray-700 rounded-xl overflow-hidden bg-gray-900/50">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-800/50 border-b border-gray-700">
            <tr>
              <SortBtn field="name" label="Project" />
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Type</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Dept</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Health</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Stage</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Priority</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Owner</th>
              <SortBtn field="progress" label="Progress" />
              <SortBtn field="due_date" label="Timeline" />
            </tr>
          </thead>
          <tbody>
            {sorted.map(p => {
              const color = getStatusColor(p);
              const progress = p.progress?.percentage || 0;
              return (
                <tr key={p.gid} className="border-b border-gray-800/50 hover:bg-gray-800/40 cursor-pointer transition-colors" onClick={() => onProjectClick?.(p)}>
                  <td className="px-3 py-3"><div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full shrink-0" style={{backgroundColor: color}}/><span className="text-sm text-gray-200 font-medium truncate max-w-[220px]">{p.name}</span></div></td>
                  <td className="px-3 py-3"><span className="text-xs px-2 py-1 rounded-md bg-gray-800 text-gray-300 font-mono">{getField(p, 'type')}</span></td>
                  <td className="px-3 py-3 text-xs text-gray-400 max-w-[120px] truncate">{getField(p, 'department')}</td>
                  <td className="px-3 py-3"><div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: color}}/><span className="text-xs text-gray-400">{getHealthLabel(p)}</span></div></td>
                  <td className="px-3 py-3 text-xs text-gray-400">{getField(p, 'stage')}</td>
                  <td className="px-3 py-3"><span className={`text-xs font-bold ${getField(p,'priority')==='P1'?'text-red-400':getField(p,'priority')==='P2'?'text-yellow-400':'text-gray-500'}`}>{getField(p, 'priority')}</span></td>
                  <td className="px-3 py-3 text-xs text-gray-400">{getOwner(p)}</td>
                  <td className="px-3 py-3"><div className="flex items-center gap-2"><div className="w-16 h-1.5 rounded-full bg-gray-700 overflow-hidden"><div className="h-full rounded-full" style={{width:`${progress}%`, backgroundColor: color}}/></div><span className="text-xs text-gray-500 w-8">{progress}%</span></div></td>
                  <td className="px-3 py-3 text-xs text-gray-500 whitespace-nowrap">{p.start_on || p.due_date ? `${p.start_on ? new Date(p.start_on).toLocaleDateString('en-US',{month:'short',day:'numeric'}) : '?'} → ${p.due_date ? new Date(p.due_date).toLocaleDateString('en-US',{month:'short',day:'numeric'}) : '?'}` : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
