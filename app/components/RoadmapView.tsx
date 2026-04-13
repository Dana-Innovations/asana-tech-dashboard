'use client';

import { useState, useMemo } from 'react';
import { AsanaProject } from '../types/asana';

type TimeScale = 'month' | 'quarter' | 'year';

function getStatusColor(project: AsanaProject): string {
  const status = project.current_status?.color;
  if (status === 'green') return '#22c55e';
  if (status === 'yellow') return '#eab308';
  if (status === 'red') return '#ef4444';
  return '#6b7280';
}

function getField(project: AsanaProject, fieldName: string): string {
  const field = project.custom_fields?.find(f => f.name?.toLowerCase().includes(fieldName.toLowerCase()));
  return field?.display_value || '';
}

function getOwner(project: AsanaProject): string {
  return project.members?.[0]?.name?.split(' ')[0] || '';
}

interface RoadmapViewProps {
  projects: AsanaProject[];
  onProjectClick?: (project: AsanaProject) => void;
}

export function RoadmapView({ projects, onProjectClick }: RoadmapViewProps) {
  const [timeScale, setTimeScale] = useState<TimeScale>('quarter');
  const [hoveredProject, setHoveredProject] = useState<string | null>(null);

  const { timelineStart, timelineEnd, months } = useMemo(() => {
    const now = new Date();
    let start = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    let end = new Date(now.getFullYear(), now.getMonth() + 12, 1);
    projects.forEach(p => {
      if (p.start_on) { const s = new Date(p.start_on); if (s < start) start = new Date(s.getFullYear(), s.getMonth(), 1); }
      if (p.due_date) { const d = new Date(p.due_date); if (d > end) end = new Date(d.getFullYear(), d.getMonth() + 1, 1); }
    });
    const monthsList: { date: Date; label: string }[] = [];
    const cursor = new Date(start);
    while (cursor <= end) {
      monthsList.push({ date: new Date(cursor), label: cursor.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }) });
      cursor.setMonth(cursor.getMonth() + 1);
    }
    return { timelineStart: start, timelineEnd: end, months: monthsList };
  }, [projects]);

  const monthWidth = timeScale === 'month' ? 120 : timeScale === 'quarter' ? 80 : 40;
  const totalWidth = months.length * monthWidth;
  const { datedProjects, undatedProjects } = useMemo(() => ({
    datedProjects: projects.filter(p => p.start_on || p.due_date),
    undatedProjects: projects.filter(p => !p.start_on && !p.due_date),
  }), [projects]);

  const getBarStyle = (project: AsanaProject) => {
    const start = project.start_on ? new Date(project.start_on) : new Date();
    const end = project.due_date ? new Date(project.due_date) : new Date(start.getTime() + 90 * 24 * 3600000);
    const startOff = ((start.getTime() - timelineStart.getTime()) / (timelineEnd.getTime() - timelineStart.getTime())) * totalWidth;
    const endOff = ((end.getTime() - timelineStart.getTime()) / (timelineEnd.getTime() - timelineStart.getTime())) * totalWidth;
    return { left: `${Math.max(0, startOff)}px`, width: `${Math.max(endOff - startOff, 40)}px` };
  };

  const todayOffset = ((Date.now() - timelineStart.getTime()) / (timelineEnd.getTime() - timelineStart.getTime())) * totalWidth;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Time Scale:</span>
          {(['month', 'quarter', 'year'] as TimeScale[]).map(scale => (
            <button key={scale} onClick={() => setTimeScale(scale)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${timeScale === scale ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
              {scale.charAt(0).toUpperCase() + scale.slice(1)}
            </button>
          ))}
        </div>
        <div className="text-xs text-gray-500">{datedProjects.length} with dates · {undatedProjects.length} without</div>
      </div>

      <div className="border border-gray-700 rounded-xl overflow-hidden bg-gray-900/50">
        <div className="overflow-x-auto">
          <div style={{ minWidth: `${totalWidth + 280}px`, position: 'relative' }}>
            {/* Header */}
            <div className="flex border-b border-gray-700 bg-gray-800/50 sticky top-0 z-10">
              <div className="w-[280px] shrink-0 px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider border-r border-gray-700">Project</div>
              <div className="flex" style={{ width: `${totalWidth}px` }}>
                {months.map((m, i) => (
                  <div key={i} className="text-xs text-gray-500 py-3 text-center border-r border-gray-800/50" style={{ width: `${monthWidth}px` }}>{m.label}</div>
                ))}
              </div>
            </div>

            {/* Dated rows */}
            {datedProjects.map(project => {
              const barStyle = getBarStyle(project);
              const color = getStatusColor(project);
              return (
                <div key={project.gid}
                  className="flex border-b border-gray-800/50 hover:bg-gray-800/30 cursor-pointer transition-colors"
                  style={{ height: '44px' }}
                  onClick={() => onProjectClick?.(project)}
                  onMouseEnter={() => setHoveredProject(project.gid)}
                  onMouseLeave={() => setHoveredProject(null)}>
                  <div className="w-[280px] shrink-0 px-4 flex items-center gap-2 border-r border-gray-700 overflow-hidden">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                    <span className="text-sm text-gray-200 truncate">{project.name}</span>
                  </div>
                  <div className="relative flex-1" style={{ width: `${totalWidth}px` }}>
                    {months.map((_, mi) => (<div key={mi} className="absolute top-0 bottom-0 border-r border-gray-800/30" style={{ left: `${mi * monthWidth}px` }} />))}
                    <div className="absolute top-2 rounded-md flex items-center px-2 overflow-hidden"
                      style={{ ...barStyle, height: '28px', backgroundColor: `${color}22`, border: `1px solid ${color}66` }}>
                      <div className="flex items-center gap-2 text-[0.65rem] text-gray-300 whitespace-nowrap">
                        <span className="font-medium">{getOwner(project)}</span>
                        <span className="text-gray-500">·</span>
                        <span>{getField(project, 'stage')}</span>
                        {project.progress && (<><span className="text-gray-500">·</span><span style={{ color }}>{project.progress.percentage}%</span></>)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Today line */}
            <div className="absolute top-0 bottom-0 w-px bg-red-500/60 z-20 pointer-events-none" style={{ left: `${280 + todayOffset}px` }}>
              <div className="absolute -top-0 -left-[18px] text-[0.6rem] text-red-400 bg-red-500/20 px-1.5 py-0.5 rounded-b">Today</div>
            </div>
          </div>
        </div>

        {/* Undated */}
        {undatedProjects.length > 0 && (
          <div className="border-t border-gray-700">
            <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-800/30">No Dates ({undatedProjects.length})</div>
            {undatedProjects.map(p => (
              <div key={p.gid} className="flex items-center gap-3 px-4 py-2 border-b border-gray-800/30 hover:bg-gray-800/30 cursor-pointer" onClick={() => onProjectClick?.(p)}>
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: getStatusColor(p) }} />
                <span className="text-sm text-gray-300 flex-1 truncate">{p.name}</span>
                <span className="text-xs text-gray-500">{getField(p, 'stage')}</span>
                <span className="text-xs text-gray-500">{getField(p, 'priority')}</span>
                <span className="text-xs text-gray-600">{getOwner(p)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
