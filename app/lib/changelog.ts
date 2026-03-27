export interface ChangelogEntry {
  version: string;
  date: string;
  changes: {
    type: 'feature' | 'fix' | 'improvement';
    description: string;
  }[];
}

export const changelog: ChangelogEntry[] = [
  {
    version: '1.2.0',
    date: '2026-03-27',
    changes: [
      { type: 'feature', description: 'Enhanced feedback modal with structured form (Bug Report, Feature Request, General Feedback)' },
      { type: 'feature', description: 'Added title, priority, and detailed description fields to feedback form' },
      { type: 'improvement', description: 'Improved feedback task creation in Asana with better categorization and templates' },
      { type: 'fix', description: 'Fixed Asana integration to create tasks in correct "(APP) Asana TI Dashboard" project' }
    ]
  },
  {
    version: '1.1.1',
    date: '2026-03-27',
    changes: [
      { type: 'fix', description: 'Moved version badge into header bar to prevent overlapping with other elements' }
    ]
  },
  {
    version: '1.1.0',
    date: '2026-03-27',
    changes: [
      { type: 'feature', description: 'Added automatic background sync every 3 minutes' },
      { type: 'feature', description: 'Clickable version badge with changelog modal' },
      { type: 'improvement', description: 'Removed manual sync button from header' },
      { type: 'improvement', description: 'Background sync prevents UI flicker during updates' }
    ]
  },
  {
    version: '1.0.0',
    date: '2026-03-27',
    changes: [
      { type: 'feature', description: 'Full-width responsive layout using entire browser window' },
      { type: 'feature', description: 'Portfolio-based project fetching (56 projects from T&I Portfolio)' },
      { type: 'feature', description: 'Recognition of "T&I Stage" custom field' },
      { type: 'feature', description: 'Fast loading by optimizing progress calculations' },
      { type: 'fix', description: 'Column layout now fills screen width and scrolls horizontally when needed' },
      { type: 'fix', description: 'Added "Deploy / Sustain" stage mapping to completion column' }
    ]
  }
];