'use client';

import { useState, useMemo, useRef } from 'react';
import { AsanaProject } from '../types/asana';
import { getStatusColor as getStatusColorFn, getProjectPriority, getPriorityBadgeClasses } from '../lib/asana';

type TimeScale = 'month' | 'quarter' | 'year';

function getBarColor(p: AsanaProject): string {
  const c = getStatusColorFn(p);
  if (c === 'green') return '#22c55e';
  if (c === 'yellow') return '#eab308';
  if (c === 'red') return '#ef4444';
  return '#6b7280';
}

function getStatusLabel(p: AsanaProject): string {
  const c = getStatusColorFn(p);
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

function getOwnerName(p: AsanaProject): string {
  return p.members?.[0]?.name?.split(' ')[0] || '';
}

function getEstimatedDates(p: AsanaProject): { start: Date; end: Date; estimated: boolean } {
  if (p.start_on || p.due_date) {
    const start = p.start_on ? new Date(p.start_on) : new Date(new Date(p.due_date!).getTime() - 90 * 86400000);
    const end = p.due_date ? new Date(p.due_date) : new Date(start.getTime() + 90 * 86400000);
    return { start, end, estimated: false };
  }
  const now = new Date();
  const stage = getField(p, 'stage').toLowerCase();
  let so = 0, dur = 3;
  if (stage.includes('backlog')) { so = 6; dur = 3; }
  else if (stage.includes('definition')) { so = 2; dur = 4; }
  else if (stage.includes('development')) { so = -1; dur = 5; }
  else if (stage.includes('testing') || stage.includes('alpha')) { so = -2; dur = 3; }
  else if (stage.includes('pilot') || stage.includes('beta')) { so = -1; dur = 2; }
  else if (stage.includes('deploy') || stage.includes('sustain')) { so = -6; dur = 12; }
  else { so = 0; dur = 4; }
  const start = new Date(now.getFullYear(), now.getMonth() + so, 1);
  const end = new Date(start.getFullYear(), start.getMonth() + dur, 0);
  return { start, end, estimated: true };
}

function getStatusPillStyle(label: string): { bg: string; text: string; darkText: string } {
  if (label === 'On Track') return { bg: 'bg-emerald-100 dark:bg-emerald-900/40', text: 'text-emerald-800', darkText: 'dark:text-emerald-300' };
  if (label === 'At Risk') return { bg: 'bg-amber-100 dark:bg-amber-900/40', text: 'text-amber-800', darkText: 'dark:text-amber-300' };
  if (label === 'Off Track') return { bg: 'bg-red-100 dark:bg-red-900/40', text: 'text-red-800', darkText: 'dark:text-red-300' };
  if (label === 'On Hold') return { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-700', darkText: 'dark:text-gray-300' };
  if (label === 'Complete') return { bg: 'bg-blue-100 dark:bg-blue-900/40', text: 'text-blue-800', darkText: 'dark:text-blue-300' };
  return { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-500', darkText: 'dark:text-gray-400' };
}

interface RoadmapViewProps {
  projects: AsanaProject[];
  onProjectClick?: (project: AsanaProject) => void;
}

export function RoadmapView({ projects, onProjectClick }: RoadmapViewProps) {
  const [timeScale, setTimeScale] = useState<TimeScale>('quarter');
  const [zoomLevel, setZoomLevel] = useState(50); // 0-100 slider
  const scrollRef = useRef<HTMLDivElement>(null);

  const { quarters, timelineStart, timelineEnd } = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 6, 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 18, 1);
    projects.forEach(p => {
      const { start: s, end: e } = getEstimatedDates(p);
      if (s < start) start.setTime(new Date(s.getFullYear(), s.getMonth(), 1).getTime());
      if (e > end) end.setTime(new Date(e.getFullYear(), e.getMonth() + 1, 1).getTime());
    });
    const qs: { label: string; months: number }[] = [];
    const cursor = new Date(start.getFullYear(), Math.floor(start.getMonth() / 3) * 3, 1);
    while (cursor < end) {
      const q = Math.floor(cursor.getMonth() / 3) + 1;
      qs.push({ label: `Q${q} '${String(cursor.getFullYear()).slice(-2)}`, months: 3 });
      cursor.setMonth(cursor.getMonth() + 3);
    }
    return { quarters: qs, timelineStart: start, timelineEnd: end };
  }, [projects]);

  // Zoom: slider controls monthWidth (20-160px range)
  const baseWidth = timeScale === 'month' ? 100 : timeScale === 'quarter' ? 60 : 30;
  const monthWidth = Math.round(baseWidth * (0.4 + (zoomLevel / 100) * 1.2)); // 40% to 160% of base
  const totalMonths = Math.ceil((timelineEnd.getTime() - timelineStart.getTime()) / (30.44 * 86400000));
  const totalWidth = totalMonths * monthWidth;
  const NAME_COL = 320;

  const getBarPosition = (p: AsanaProject) => {
    const { start, end, estimated } = getEstimatedDates(p);
    const totalMs = timelineEnd.getTime() - timelineStart.getTime();
    const leftPct = Math.max(0, (start.getTime() - timelineStart.getTime()) / totalMs) * 100;
    const widthPct = Math.max(2, (end.getTime() - start.getTime()) / totalMs * 100);
    return { leftPct, widthPct, estimated };
  };

  const todayPct = ((Date.now() - timelineStart.getTime()) / (timelineEnd.getTime() - timelineStart.getTime())) * 100;
  const ROW_HEIGHT = 76;

  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => {
      const aD = a.start_on || a.due_date ? 0 : 1;
      const bD = b.start_on || b.due_date ? 0 : 1;
      if (aD !== bD) return aD - bD;
      return a.name.localeCompare(b.name);
    });
  }, [projects]);

  return (
    <div className="space-y-3">
      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">Scale:</span>
          {(['month', 'quarter', 'year'] as TimeScale[]).map(scale => (
            <button key={scale} onClick={() => setTimeScale(scale)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${timeScale === scale ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
              {scale.charAt(0).toUpperCase() + scale.slice(1)}
            </button>
          ))}
        </div>
        {/* Zoom slider */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">Zoom:</span>
          <input
            type="range"
            min="0"
            max="100"
            value={zoomLevel}
            onChange={(e) => setZoomLevel(Number(e.target.value))}
            className="w-32 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer accent-blue-500"
          />
          <span className="text-xs text-gray-400 w-8">{Math.round(40 + (zoomLevel / 100) * 120)}%</span>
        </div>
        <div className="text-xs text-gray-500">
          {projects.filter(p => p.start_on || p.due_date).length} dated · {projects.filter(p => !p.start_on && !p.due_date).length} est.
        </div>
      </div>

      {/* Gantt Chart */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-gray-900/50">
        <div className="overflow-x-auto" ref={scrollRef}>
          <div style={{ minWidth: `${totalWidth + NAME_COL}px`, position: 'relative' }}>
            
            {/* Quarter Headers */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 sticky top-0 z-10">
              <div className="shrink-0 px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700" style={{ width: `${NAME_COL}px` }}>
                PROJECT
              </div>
              <div className="flex-1 relative" style={{ width: `${totalWidth}px` }}>
                <div className="flex h-full">
                  {quarters.map((q, i) => (
                    <div key={i} className="text-xs font-semibold text-gray-500 dark:text-gray-400 py-3 text-center border-r border-gray-200/60 dark:border-gray-700/50"
                      style={{ width: `${q.months * monthWidth}px` }}>
                      {q.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Today line */}
            <div className="absolute top-0 bottom-0 z-20 pointer-events-none"
              style={{ left: `${NAME_COL + (todayPct / 100) * totalWidth}px` }}>
              <div className="w-0.5 h-full bg-yellow-500/70" />
              <div className="absolute top-[2px] -translate-x-1/2 text-[0.55rem] font-bold text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-500/20 px-1.5 py-0.5 rounded whitespace-nowrap">
                Today
              </div>
            </div>

            {/* Project Rows */}
            {sortedProjects.map((project) => {
              const { leftPct, widthPct, estimated } = getBarPosition(project);
              const color = getBarColor(project);
              const statusLabel = getStatusLabel(project);
              const statusPill = getStatusPillStyle(statusLabel);
              const stage = getField(project, 'stage');
              const priority = getProjectPriority(project);
              const priorityClasses = getPriorityBadgeClasses(priority || '');
              const owner = getOwnerName(project);
              const progress = project.progress?.percentage || 0;
              const projectType = getField(project, 'type');

              return (
                <div key={project.gid}
                  className="flex border-b border-gray-100 dark:border-gray-800/40 hover:bg-gray-50 dark:hover:bg-gray-800/30 cursor-pointer transition-colors"
                  style={{ height: `${ROW_HEIGHT}px` }}
                  onClick={() => onProjectClick?.(project)}>
                  
                  {/* Project Name */}
                  <div className="shrink-0 px-4 flex items-center gap-2 border-r border-gray-200/60 dark:border-gray-700/50" style={{ width: `${NAME_COL}px` }}>
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                    <span className="text-sm text-gray-800 dark:text-gray-200 truncate leading-tight font-medium">{project.name}</span>
                  </div>

                  {/* Timeline Bar Area */}
                  <div className="flex-1 relative" style={{ width: `${totalWidth}px` }}>
                    {/* Quarter grid lines */}
                    {quarters.map((q, qi) => (
                      <div key={qi} className="absolute top-0 bottom-0 border-r border-gray-100 dark:border-gray-800/20"
                        style={{ left: `${(qi * q.months * monthWidth)}px` }} />
                    ))}

                    {/* The Bar + badges */}
                    <div className="absolute" style={{ left: `${leftPct}%`, width: `${widthPct}%`, top: '8px' }}>
                      {/* Bar with progress fill */}
                      <div className="relative rounded-full overflow-hidden"
                        style={{
                          height: '28px',
                          backgroundColor: `${color}30`,
                          border: estimated ? `1.5px dashed ${color}80` : `none`,
                        }}>
                        {/* Dark progress fill */}
                        <div className="absolute inset-y-0 left-0 rounded-full"
                          style={{ 
                            width: `${Math.max(progress, estimated ? 0 : 8)}%`, 
                            backgroundColor: `${color}cc`,
                          }} />
                        {/* Progress badge on bar */}
                        {progress > 0 && (
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[0.6rem] font-bold px-1.5 py-0.5 rounded-full"
                            style={{ backgroundColor: 'rgba(0,0,0,0.35)', color: '#fff' }}>
                            {progress}%
                          </div>
                        )}
                      </div>

                      {/* Badges row below bar — matching Josh's design */}
                      <div className="flex items-center gap-1.5 mt-1 text-[0.6rem] whitespace-nowrap overflow-hidden px-0.5">
                        {/* Owner */}
                        {owner && <span className="text-gray-600 dark:text-gray-400 font-medium">{owner}</span>}
                        
                        {/* Type badge */}
                        {projectType && (
                          <span className="px-1.5 py-0.5 rounded text-[0.55rem] font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                            {projectType}
                          </span>
                        )}

                        {/* Stage */}
                        {stage && <span className="text-gray-500">{stage}</span>}
                        
                        {/* Status pill */}
                        {statusLabel && (
                          <span className={`px-1.5 py-0.5 rounded-full text-[0.55rem] font-medium ${statusPill.bg} ${statusPill.text} ${statusPill.darkText}`}>
                            {statusLabel}
                          </span>
                        )}

                        {/* Priority badge */}
                        {priority && (
                          <span className={`px-1.5 py-0.5 text-[0.55rem] font-semibold rounded ${priorityClasses || ''}`}>
                            {priority}
                          </span>
                        )}

                        {/* Estimated indicator */}
                        {estimated && <span className="text-gray-400 dark:text-gray-600 italic">(est.)</span>}
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
