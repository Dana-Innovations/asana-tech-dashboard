'use client';

import { useState, useMemo, useRef } from 'react';
import { AsanaProject } from '../types/asana';

type TimeScale = 'month' | 'quarter' | 'year';

function getStatusColor(p: AsanaProject): string {
  return p.current_status?.color === 'green' ? '#22c55e' : p.current_status?.color === 'yellow' ? '#eab308' : p.current_status?.color === 'red' ? '#ef4444' : '#6b7280';
}

function getStatusLabel(p: AsanaProject): string {
  const c = p.current_status?.color;
  if (c === 'green') return 'On Track';
  if (c === 'yellow') return 'At Risk';
  if (c === 'red') return 'Off Track';
  const t = p.current_status?.title?.toLowerCase() || '';
  if (t.includes('hold')) return 'On Hold';
  if (t.includes('complete')) return 'Complete';
  return '';
}

function getField(p: AsanaProject, name: string): string {
  return p.custom_fields?.find(f => f.name?.toLowerCase().includes(name.toLowerCase()))?.display_value || '';
}

function getOwner(p: AsanaProject): string {
  return p.members?.[0]?.name?.split(' ')[0] || '';
}

// Estimate timeline based on stage if no dates set
function getEstimatedDates(p: AsanaProject): { start: Date; end: Date; estimated: boolean } {
  // Use Asana's native start_on and due_date (set via the "Due date" range column)
  if (p.start_on || p.due_date) {
    const start = p.start_on ? new Date(p.start_on) : new Date(new Date(p.due_date!).getTime() - 90 * 86400000);
    const end = p.due_date ? new Date(p.due_date) : new Date(start.getTime() + 90 * 86400000);
    return { start, end, estimated: false };
  }

  const now = new Date();
  const stage = getField(p, 'stage').toLowerCase();
  let startOffset = 0; // months from now
  let duration = 3; // months

  if (stage.includes('backlog')) { startOffset = 6; duration = 3; }
  else if (stage.includes('definition')) { startOffset = 2; duration = 4; }
  else if (stage.includes('development')) { startOffset = -1; duration = 5; }
  else if (stage.includes('testing') || stage.includes('alpha')) { startOffset = -2; duration = 3; }
  else if (stage.includes('pilot') || stage.includes('beta')) { startOffset = -1; duration = 2; }
  else if (stage.includes('deploy') || stage.includes('sustain')) { startOffset = -6; duration = 12; }
  else { startOffset = 0; duration = 4; }

  const start = new Date(now.getFullYear(), now.getMonth() + startOffset, 1);
  const end = new Date(start.getFullYear(), start.getMonth() + duration, 0);
  return { start, end, estimated: true };
}

// Status pill colors
function getStatusPillStyle(label: string): { bg: string; text: string } {
  if (label === 'On Track') return { bg: 'rgba(34,197,94,0.15)', text: '#22c55e' };
  if (label === 'At Risk') return { bg: 'rgba(234,179,8,0.15)', text: '#eab308' };
  if (label === 'Off Track') return { bg: 'rgba(239,68,68,0.15)', text: '#ef4444' };
  if (label === 'On Hold') return { bg: 'rgba(107,114,128,0.15)', text: '#9ca3af' };
  if (label === 'Complete') return { bg: 'rgba(59,130,246,0.15)', text: '#3b82f6' };
  return { bg: 'rgba(107,114,128,0.1)', text: '#6b7280' };
}

interface RoadmapViewProps {
  projects: AsanaProject[];
  onProjectClick?: (project: AsanaProject) => void;
}

export function RoadmapView({ projects, onProjectClick }: RoadmapViewProps) {
  const [timeScale, setTimeScale] = useState<TimeScale>('quarter');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Build quarter-based timeline
  const { quarters, timelineStart, timelineEnd } = useMemo(() => {
    const now = new Date();
    // Show from 6 months ago to 18 months ahead
    const start = new Date(now.getFullYear(), now.getMonth() - 6, 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 18, 1);

    // Extend based on project dates
    projects.forEach(p => {
      const { start: s, end: e } = getEstimatedDates(p);
      if (s < start) start.setTime(new Date(s.getFullYear(), s.getMonth(), 1).getTime());
      if (e > end) end.setTime(new Date(e.getFullYear(), e.getMonth() + 1, 1).getTime());
    });

    // Build quarters
    const qs: { label: string; startDate: Date; months: number }[] = [];
    const cursor = new Date(start.getFullYear(), Math.floor(start.getMonth() / 3) * 3, 1);
    while (cursor < end) {
      const q = Math.floor(cursor.getMonth() / 3) + 1;
      const label = `Q${q} '${String(cursor.getFullYear()).slice(-2)}`;
      const qEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 3, 1);
      const months = 3;
      qs.push({ label, startDate: new Date(cursor), months });
      cursor.setMonth(cursor.getMonth() + 3);
    }

    return { quarters: qs, timelineStart: start, timelineEnd: end };
  }, [projects]);

  const monthWidth = timeScale === 'month' ? 100 : timeScale === 'quarter' ? 60 : 30;
  const totalMonths = Math.ceil((timelineEnd.getTime() - timelineStart.getTime()) / (30.44 * 86400000));
  const totalWidth = totalMonths * monthWidth;

  const getBarPosition = (p: AsanaProject) => {
    const { start, end, estimated } = getEstimatedDates(p);
    const totalMs = timelineEnd.getTime() - timelineStart.getTime();
    const leftPct = Math.max(0, (start.getTime() - timelineStart.getTime()) / totalMs) * 100;
    const widthPct = Math.max(2, (end.getTime() - start.getTime()) / totalMs * 100);
    return { leftPct, widthPct, estimated };
  };

  const todayPct = ((Date.now() - timelineStart.getTime()) / (timelineEnd.getTime() - timelineStart.getTime())) * 100;

  const ROW_HEIGHT = 72;

  // Sort: projects with dates first, then by stage priority
  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => {
      const aHasDates = a.start_on || a.due_date ? 0 : 1;
      const bHasDates = b.start_on || b.due_date ? 0 : 1;
      if (aHasDates !== bHasDates) return aHasDates - bHasDates;
      return a.name.localeCompare(b.name);
    });
  }, [projects]);

  return (
    <div className="space-y-3">
      {/* Controls */}
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
        <div className="text-xs text-gray-500">
          {projects.filter(p => p.start_on || p.due_date).length} with dates · {projects.filter(p => !p.start_on && !p.due_date).length} estimated
        </div>
      </div>

      {/* Gantt Chart */}
      <div className="border border-gray-700 rounded-xl overflow-hidden bg-gray-900/50">
        <div className="overflow-x-auto" ref={scrollRef}>
          <div style={{ minWidth: `${totalWidth + 240}px`, position: 'relative' }}>
            
            {/* Quarter Headers */}
            <div className="flex border-b border-gray-700 bg-gray-800/60 sticky top-0 z-10">
              <div className="w-[240px] shrink-0 px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider border-r border-gray-700">
                PROJECT
              </div>
              <div className="flex-1 relative" style={{ width: `${totalWidth}px` }}>
                <div className="flex h-full">
                  {quarters.map((q, i) => (
                    <div key={i} className="text-xs font-semibold text-gray-400 py-3 text-center border-r border-gray-700/50"
                      style={{ width: `${q.months * monthWidth}px` }}>
                      {q.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Today line */}
            <div className="absolute top-0 bottom-0 z-20 pointer-events-none"
              style={{ left: `${240 + (todayPct / 100) * totalWidth}px` }}>
              <div className="w-0.5 h-full bg-yellow-500/70" />
              <div className="absolute top-[2px] -translate-x-1/2 text-[0.55rem] font-bold text-yellow-400 bg-yellow-500/20 px-1.5 py-0.5 rounded whitespace-nowrap">
                Today
              </div>
            </div>

            {/* Project Rows */}
            {sortedProjects.map((project) => {
              const { leftPct, widthPct, estimated } = getBarPosition(project);
              const color = getStatusColor(project);
              const statusLabel = getStatusLabel(project);
              const statusPill = getStatusPillStyle(statusLabel);
              const stage = getField(project, 'stage');
              const priority = getField(project, 'priority');
              const owner = getOwner(project);
              const progress = project.progress?.percentage || 0;

              return (
                <div key={project.gid}
                  className="flex border-b border-gray-800/40 hover:bg-gray-800/30 cursor-pointer transition-colors"
                  style={{ height: `${ROW_HEIGHT}px` }}
                  onClick={() => onProjectClick?.(project)}>
                  
                  {/* Project Name */}
                  <div className="w-[240px] shrink-0 px-4 flex items-center gap-2 border-r border-gray-700/50">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                    <span className="text-sm text-gray-200 truncate leading-tight">{project.name}</span>
                  </div>

                  {/* Timeline Bar Area */}
                  <div className="flex-1 relative" style={{ width: `${totalWidth}px` }}>
                    {/* Quarter grid lines */}
                    {quarters.map((q, qi) => (
                      <div key={qi} className="absolute top-0 bottom-0 border-r border-gray-800/20"
                        style={{ left: `${(qi * q.months * monthWidth)}px` }} />
                    ))}

                    {/* The Bar — two lines */}
                    <div className="absolute" style={{ left: `${leftPct}%`, width: `${widthPct}%`, top: '8px' }}>
                      {/* Bar itself */}
                      <div className="relative rounded-full overflow-hidden"
                        style={{
                          height: '24px',
                          backgroundColor: `${color}30`,
                          border: estimated ? `1px dashed ${color}50` : `1px solid ${color}60`,
                        }}>
                        {/* Progress fill */}
                        {progress > 0 && (
                          <div className="absolute inset-y-0 left-0 rounded-full"
                            style={{ width: `${progress}%`, backgroundColor: `${color}50` }} />
                        )}
                        {/* Progress badge */}
                        {progress > 0 && (
                          <div className="absolute right-1 top-1/2 -translate-y-1/2 text-[0.55rem] font-bold px-1.5 py-0.5 rounded-full"
                            style={{ backgroundColor: `${color}40`, color: color }}>
                            {progress}%
                          </div>
                        )}
                      </div>

                      {/* Metadata line below bar */}
                      <div className="flex items-center gap-2 mt-1 text-[0.6rem] text-gray-500 whitespace-nowrap overflow-hidden px-1">
                        {owner && <span className="text-gray-400">{owner}</span>}
                        {stage && <><span className="text-gray-700">·</span><span>{stage}</span></>}
                        {statusLabel && (
                          <>
                            <span className="text-gray-700">·</span>
                            <span className="px-1.5 py-0.5 rounded-full text-[0.55rem] font-medium"
                              style={{ backgroundColor: statusPill.bg, color: statusPill.text }}>
                              {statusLabel}
                            </span>
                          </>
                        )}
                        {priority && <><span className="text-gray-700">·</span><span className={priority === 'P1' ? 'text-red-400 font-bold' : priority === 'P2' ? 'text-yellow-400 font-bold' : ''}>{priority}</span></>}
                        {estimated && <span className="text-gray-600 italic">(est.)</span>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
