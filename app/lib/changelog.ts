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
    version: '1.5.1',
    date: '2026-03-27',
    changes: [
      { type: 'fix', description: 'Fixed cards getting cut off at the bottom of the screen' },
      { type: 'improvement', description: 'Improved column height calculations for better viewport utilization' },
      { type: 'improvement', description: 'Added proper bottom padding to ensure all cards are fully visible when scrolling' }
    ]
  },
  {
    version: '1.5.0',
    date: '2026-03-27',
    changes: [
      { type: 'fix', description: 'Completed implementation of all 7 requested fixes from Asana tasks' },
      { type: 'fix', description: 'Removed non-functional date range filtering code completely' },
      { type: 'improvement', description: 'Streamlined filter interface and codebase maintenance' },
      { type: 'feature', description: 'All bug fixes and improvements now deployed and operational' }
    ]
  },
  {
    version: '1.4.0',
    date: '2026-03-27',
    changes: [
      { type: 'fix', description: 'Removed emoji icons from stage columns for more professional appearance' },
      { type: 'fix', description: 'Removed mailbox icon from empty "No Projects" columns' },
      { type: 'improvement', description: 'Moved team member filter to main filter bar for better accessibility' },
      { type: 'fix', description: 'Removed non-functional date range filtering options' },
      { type: 'improvement', description: 'Updated project types to match Sonance portfolio (Mobile App, Web Platform, API Integration, etc.)' },
      { type: 'fix', description: 'Hidden "Off track" badges from project cards with no recent status updates (>30 days old)' },
      { type: 'improvement', description: 'Streamlined filter interface for better user experience' }
    ]
  },
  {
    version: '1.3.0',
    date: '2026-03-27',
    changes: [
      { type: 'fix', description: 'Consolidated team members in filter dropdown - no more duplicates' },
      { type: 'fix', description: 'Status badges now only show when there\'s an actual status update, not fallback status' },
      { type: 'feature', description: 'Updated design to conform with Sonance brand guidelines (brand.sonance.com)' },
      { type: 'improvement', description: 'Implemented sophisticated dark monochromatic color scheme with high contrast' },
      { type: 'improvement', description: 'Added Sonance-specific color palette for minimalist, elegant design' }
    ]
  },
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