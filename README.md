# Technology Project Dashboard

A comprehensive project management dashboard for the technology team, built with Next.js, Supabase, and Asana API integration.

## Features

### 📊 Dual View Modes
- **Kanban View**: Visual drag-and-drop project management with status columns
- **Stoplight View**: Comprehensive list view with sorting and filtering

### 🎯 Project Insights
- Real-time project progress tracking
- Status indicators (On Track, At Risk, Off Track)
- Team member assignments and avatars
- Due date tracking with overdue alerts
- Custom fields support for future extensibility

### 🔍 Advanced Filtering
- Search by project name or description
- Filter by status, team member, or date range
- Sort by name, progress, due date, or last modified

### ⚡ Real-time Sync
- Automatic synchronization with Asana
- Real-time updates via Supabase
- Offline capability with cached data fallback

## Tech Stack

- **Frontend**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **API Integration**: Asana REST API
- **Deployment**: Vercel-ready
- **Drag & Drop**: React DnD

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- Supabase account and project
- Asana account with API access
- Vercel account (for deployment)

### 1. Clone and Install
```bash
git clone <repository-url>
cd technology-project-dashboard
npm install
```

### 2. Environment Configuration
```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_ASANA_TOKEN=your_asana_personal_access_token
NEXT_PUBLIC_ASANA_TEAM_ID=your_team_id
```

### 3. Database Setup
1. Create a new Supabase project
2. Run the SQL schema in Supabase SQL editor:
```bash
# Copy contents of supabase-schema.sql and run in Supabase
```

### 4. Get Asana Credentials

#### Personal Access Token
1. Go to Asana → My Profile Settings → Apps
2. Create a Personal Access Token
3. Copy the token to `NEXT_PUBLIC_ASANA_TOKEN`

#### Team ID
1. Go to your technology team in Asana
2. Copy team ID from the URL: `https://app.asana.com/0/{TEAM_ID}/list`
3. Add to `NEXT_PUBLIC_ASANA_TEAM_ID`

### 5. Run Development Server
```bash
npm run dev
```

Visit `http://localhost:3000` to see the dashboard.

## Deployment

### Vercel (Recommended)
1. Push code to GitHub repository
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Manual Build
```bash
npm run build
npm start
```

## Project Structure

```
technology-project-dashboard/
├── app/
│   ├── components/          # React components
│   │   ├── DashboardHeader.tsx
│   │   ├── FilterPanel.tsx
│   │   ├── KanbanView.tsx
│   │   ├── StoplightView.tsx
│   │   ├── ProjectCard.tsx
│   │   └── LoadingSpinner.tsx
│   ├── lib/                 # Utilities and services
│   │   ├── asana.ts         # Asana API service
│   │   └── supabase.ts      # Supabase client and data layer
│   ├── types/               # TypeScript type definitions
│   │   └── asana.ts
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Main dashboard page
├── public/                  # Static assets
├── supabase-schema.sql      # Database schema
├── .env.example             # Environment variables template
└── README.md
```

## API Integration

### Asana API
The dashboard integrates with Asana's REST API to fetch:
- Project metadata and status
- Task counts and completion rates
- Team member assignments
- Custom fields
- Due dates and progress

### Supabase Integration
- **Real-time subscriptions**: Live updates when data changes
- **Caching layer**: Improved performance and offline support
- **Data transformation**: Optimized storage of Asana data
- **Sync tracking**: Monitors last sync time and status

## Customization

### Adding Custom Fields
1. Create custom fields in Asana at the project level
2. Fields will automatically appear in the dashboard
3. Filter and display logic can be extended in components

### Status Color Mapping
Edit `lib/asana.ts` to customize status color logic:
```typescript
export function getStatusColor(project: AsanaProject): 'green' | 'yellow' | 'red' {
  // Custom logic here
}
```

### UI Themes
Modify `tailwind.config.js` to adjust colors and styling:
```javascript
theme: {
  extend: {
    colors: {
      primary: { ... },
      success: { ... },
      // etc.
    }
  }
}
```

## Troubleshooting

### Common Issues

**Asana API 401 Unauthorized**
- Verify personal access token is correct
- Check token hasn't expired
- Ensure team ID is valid

**Supabase Connection Issues**
- Verify URL and anon key are correct
- Check RLS policies allow your operations
- Ensure database schema is properly created

**Slow Initial Load**
- First load requires Asana API sync
- Subsequent loads use cached data from Supabase
- Consider implementing background sync jobs

### Debug Mode
Set `NODE_ENV=development` to enable:
- Detailed console logging
- Error boundaries with full stack traces
- Development-only UI indicators

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes and test thoroughly
4. Submit a pull request

## Security Notes

- Never commit `.env.local` or real credentials
- Use Supabase RLS policies to control data access
- Consider implementing authentication for production use
- Rotate Asana tokens periodically

## Performance Optimization

- **Data Caching**: Supabase provides local caching
- **Incremental Sync**: Only fetch changed projects
- **Lazy Loading**: Components load on demand
- **Image Optimization**: Avatar images are optimized
- **Real-time Updates**: Efficient WebSocket connections

## License

This project is proprietary software for Sonance technology team.

---

Built with ❤️ for the technology team