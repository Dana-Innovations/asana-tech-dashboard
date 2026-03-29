# Changelog

All notable changes to the Asana T&I Dashboard project will be documented in this file.

## [1.8.0] - 2026-03-29

### 🚀 Major Features Added
- **Complete Project Metadata Editing System**
  - Real-time drag & drop project stage updates via Asana API
  - Full custom field editing in ProjectModal with dropdown selectors
  - Live Asana integration for Project Type, Department, T&I Priority fields
  - Auto-refresh after successful saves

- **Enhanced Stoplight View - Complete Portfolio Spreadsheet**
  - Added 16-column layout with full portfolio metadata visibility
  - New columns: Type, Department, Priority, GitHub (clickable links)
  - Color-coded badges for Project Type (blue), Department (green), Priority (red)
  - Horizontal scroll support for wide data display
  - Replaced cramped metadata text with proper column structure

- **Advanced Filter System**
  - Added Department filter with all organizational units
  - Added T&I Priority filter functionality
  - 3-column advanced filter layout (Project Type, Department, T&I Priority)
  - Color-coded filter badges with clear/remove functionality

### 🎨 UI/UX Improvements
- **Sticky Header Navigation**
  - Header now stays at top when scrolling with backdrop blur effect
  - Improved navigation experience across all views

- **Enhanced Dark Mode Support**
  - Project cards now have better prominence and visibility in dark mode
  - Enhanced borders, shadows, and contrast ratios
  - Improved text readability across all components

- **Professional Visual Polish**
  - Replaced dashed column borders with clean solid borders
  - Added elegant gold hover effects throughout interface
  - Converted text links to proper styled buttons with hover states
  - Enhanced button design with consistent gold accent theme

### 🔧 Technical Improvements
- **Real Asana API Integration**
  - Implemented `updateProjectStage()` with live API calls
  - Added `updateProjectCustomField()` for metadata editing
  - Proper stage mapping from UI to Asana T&I Stage field
  - Error handling and validation for API operations

- **Enhanced Component Architecture**
  - Improved ProjectModal with form controls and state management
  - Better TypeScript interfaces for custom fields
  - Loading states and error handling
  - Optimized API calls and data fetching

### 🐛 Bug Fixes
- Fixed filter panel advanced options visibility
- Improved component state management
- Better error handling for API failures
- Enhanced responsive layout stability

### 📊 Data Enhancements
- Full custom field support for enum and text types
- GitHub repository links now clickable with proper styling
- Team member avatars optimized for space efficiency
- Progress bars with percentage display and color coding

---

## [1.7.0] - 2026-03-27

### Initial Release
- Basic Kanban and Stoplight views
- Project filtering and search
- Asana integration for project data
- Dark mode support
- Basic project information display
