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
    version: '1.15.0',
    date: '2026-03-31',
    changes: [
      { type: 'feature', description: 'Added three new project status options: "On Hold" (blue), "Complete" (purple), and "Dropped" (gray)' },
      { type: 'feature', description: 'Extended status filtering to support all six status options in filter dropdown' },
      { type: 'improvement', description: 'Updated project cards with new status badge colors and labels for better project visibility' },
      { type: 'improvement', description: 'Enhanced Asana API integration to handle new status types in updateProjectStatus function' },
    ]
  },
  {
    version: '1.13.2',
    date: '2026-03-29',
    changes: [
      { type: 'improvement', description: 'Removed raw link text from cards — icon buttons are sufficient' },
      { type: 'improvement', description: 'Restored Department badge on project cards (next to status and priority)' },
      { type: 'improvement', description: 'Removed redundant custom fields listing from card footer' },
    ]
  },
  {
    version: '1.13.1',
    date: '2026-03-29',
    changes: [
      { type: 'improvement', description: 'Decluttered project cards — removed redundant type/department/stage badges and status subtitle' },
      { type: 'improvement', description: 'Removed project count stats from header — slimmer nav bar for more screen space' },
    ]
  },
  {
    version: '1.13.0',
    date: '2026-03-29',
    changes: [
      { type: 'improvement', description: 'Bolder project titles (font-semibold) for better card readability' },
      { type: 'feature', description: 'Hover tooltip on truncated project titles to see the full name' },
      { type: 'fix', description: 'Status badge colors in project modal now match vivid card colors' },
      { type: 'improvement', description: 'Filter and Preset button text contrast improved for readability' },
      { type: 'feature', description: 'Edit status (On Track/At Risk/Off Track) and due date directly in project modal with Asana API sync' },
    ]
  },
  {
    version: '1.12.1',
    date: '2026-03-29',
    changes: [
      { type: 'fix', description: 'Priority now reads actual TI Priority field (P1-P5) from Asana instead of calculating from due dates' },
      { type: 'feature', description: 'Color-coded P1-P5 priority badges on project cards and Stoplight view' },
      { type: 'improvement', description: 'Removed old priority icons (bullseye/clock/triangle) — replaced with clear P1-P5 labels' },
    ]
  },
  {
    version: '1.12.0',
    date: '2026-03-29',
    changes: [
      { type: 'improvement', description: 'Lighter header in light mode (slate-700) — less heavy, more balanced contrast' },
      { type: 'improvement', description: 'Vivid status badges — emerald/amber/red with white text for instant visibility' },
      { type: 'improvement', description: 'Rebuilt Stoplight view as compact dense table — 7 columns, tight rows, 30+ projects visible' },
    ]
  },
  {
    version: '1.11.0',
    date: '2026-03-29',
    changes: [
      { type: 'improvement', description: 'Visual redesign: Light gray page background with elevated floating cards' },
      { type: 'feature', description: 'Dark charcoal header with live project stats (Total, Backlog, Development, Testing, Completed)' },
      { type: 'improvement', description: 'Enhanced card elevation with shadow-md, hover lift effects, and white backgrounds' },
      { type: 'improvement', description: 'Column headers with blue accent stripe and improved visual separation' },
      { type: 'improvement', description: 'Added Sonance Beam blue accent color for key metrics and interactive elements' },
      { type: 'improvement', description: 'Generous whitespace and breathing room between all sections' },
    ]
  },
  {
    version: '1.10.0',
    date: '2026-03-29',
    changes: [
      { type: 'improvement', description: 'Brand compliance: Switched font from Inter to Montserrat per brand.sonance.com guidelines' },
      { type: 'improvement', description: 'Brand compliance: Sharp corners (0-4px radius) on all buttons, badges, cards, and modals' },
      { type: 'improvement', description: 'Brand compliance: Typography updated — medium weight headings with -0.02em tracking' },
      { type: 'improvement', description: 'Brand compliance: Refined visual polish across all components for premium aesthetic' },
    ]
  },
  {
    version: '1.9.1',
    date: '2026-03-29',
    changes: [
      { type: 'fix', description: 'Team list now pulls only from Owner + Project Participants — no more duplicates' },
      { type: 'fix', description: 'GitHub/Supabase/Vercel links now display as styled icon buttons instead of raw URLs' },
      { type: 'fix', description: 'Drag & drop now persists — projects stay in new column and sync T&I Stage to Asana API' },
    ]
  },
  {
    version: '1.9.0',
    date: '2026-03-29',
    changes: [
      { type: 'fix', description: 'Fixed filter preset save — Save button now properly prompts for name and stores combos to localStorage' },
      { type: 'fix', description: 'Moved status badge below project title to prevent name cutoff on project cards' },
      { type: 'fix', description: 'Removed redundant "More Details" button — click project title to open modal instead' },
      { type: 'improvement', description: 'Increased Kanban column width from 280px to 340px for better readability' },
      { type: 'improvement', description: 'Converted GitHub/Supabase/Vercel raw URLs to styled icon buttons on project cards' },
      { type: 'feature', description: 'Enhanced Stoplight view with complete metadata columns including T&I Stage' },
      { type: 'feature', description: 'Consolidated all filters inside Filters panel with badge-style multi-select' },
      { type: 'feature', description: 'Filter presets system — save, load, and delete custom filter combinations' },
      { type: 'fix', description: '"Open in Asana" button now links directly to the project in Asana' },
    ]
  },
  {
    version: '1.8.0',
    date: '2026-03-29',
    changes: [
      { type: 'feature', description: 'Complete Project Metadata Editing System - Real-time drag & drop project stage updates via Asana API' },
      { type: 'feature', description: 'Full custom field editing in ProjectModal with dropdown selectors for Project Type, Department, T&I Priority' },
      { type: 'feature', description: 'Enhanced Stoplight View - 16-column portfolio spreadsheet with Type, Department, Priority, GitHub links' },
      { type: 'feature', description: 'Advanced Filter System - Department and T&I Priority filters with 3-column layout' },
      { type: 'improvement', description: 'Sticky Header Navigation - Header stays at top when scrolling with backdrop blur effect' },
      { type: 'improvement', description: 'Enhanced Dark Mode Support - Better project card prominence and visibility' },
      { type: 'improvement', description: 'Professional Visual Polish - Clean solid borders, gold hover effects, styled buttons' },
      { type: 'improvement', description: 'Real Asana API Integration - Live updateProjectStage() and updateProjectCustomField() functions' },
      { type: 'improvement', description: 'Color-coded badges for Project Type (blue), Department (green), Priority (red)' },
      { type: 'fix', description: 'Converted text links to proper styled buttons with hover states and accessibility' },
      { type: 'improvement', description: 'GitHub repository links now clickable with proper styling and external link icons' },
      { type: 'improvement', description: 'Enhanced component architecture with loading states and error handling' }
    ]
  },
  {
    version: '1.7.0',
    date: '2026-03-27',
    changes: [
      { type: 'feature', description: 'Added custom field badges to project cards showing Project Type, Department, T&I Stage, and T&I Priority' },
      { type: 'improvement', description: 'Enhanced project card visual hierarchy with color-coded badges for quick identification' },
      { type: 'improvement', description: 'Added compact badge view for smaller cards showing most critical information' },
      { type: 'feature', description: 'Dynamic badge rendering based on available custom field data from Asana portfolio' }
    ]
  },
  {
    version: '1.6.1',
    date: '2026-03-27',
    changes: [
      { type: 'fix', description: 'Fixed Project Type filter to match actual Asana portfolio values (APP, KI, AGENT, IP, AUTO, RSCH)' },
      { type: 'fix', description: 'Connected Project Type dropdown to filtering logic with proper onChange handler' },
      { type: 'improvement', description: 'Enhanced column borders with modern ring styling instead of dashed lines' },
      { type: 'feature', description: 'Added Project Type filter badge in active filters display section' }
    ]
  },
  {
    version: '1.6.0',
    date: '2026-03-27',
    changes: [
      { type: 'improvement', description: 'Full implementation of Sonance Brand MCP guidelines for professional appearance' },
      { type: 'improvement', description: 'Replaced dashed column borders with sophisticated solid borders and subtle shadows' },
      { type: 'feature', description: 'Comprehensive dark and light mode design using Sonance color palette' },
      { type: 'improvement', description: 'Enhanced hover states and transitions throughout the interface' },
      { type: 'improvement', description: 'Refined typography and spacing for premium business look and feel' },
      { type: 'fix', description: 'All 9 requested tasks from Asana TI Dashboard requirements now fully implemented' }
    ]
  },
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