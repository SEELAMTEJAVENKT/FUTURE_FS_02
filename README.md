# LeadFlow CRM

A complete enterprise-grade Client Lead Management System built with React, TypeScript, and Supabase.

## Features

### 1. Public Contact Form
- Lead submission form accessible at root path `/`
- Email validation and duplicate prevention
- Lead source tracking
- Automatic status assignment

### 2. Admin Authentication
- Email/password authentication via Supabase
- JWT-based sessions
- Protected routes
- Default admin account: `admin@leadflow.com` / `Admin@123`

### 3. Dashboard
- Real-time statistics cards
- Leads by status pie chart
- Monthly growth area chart
- Recent leads table
- Conversion rate tracking

### 4. Lead Management
- Full CRUD operations
- Advanced filtering (status, priority, source, date range)
- Search functionality
- Inline status updates
- Export to CSV/Excel
- Print functionality

### 5. Lead Details
- Complete contact information
- Notes management (add, edit, delete)
- Follow-ups scheduling
- Status change history
- Linked activity tracking

### 6. Follow-up Management
- Calendar-based follow-up scheduling
- Overdue tracking
- Completion status
- Quick reschedule
- Grouped by date (Overdue, Today, Tomorrow, Upcoming)

### 7. Analytics
- Multi-chart dashboard
- Leads by status (donut chart)
- Leads by source (bar chart)
- Monthly trends (area chart)
- Conversion funnel
- Date range filtering (7d, 30d, 90d, 1y)

### 8. Settings
- Profile management
- Password change
- Theme toggle (light/dark mode)
- Theme persistence

### 9. Dark Mode
- System-wide dark theme support
- Persistent storage in localStorage
- Smooth transitions

### 10. Export & Print
- Export leads to CSV
- Export leads to Excel
- Print-friendly reports

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS with dark mode
- React Router v7 for routing
- Recharts for analytics visualizations
- Framer Motion for animations
- Lucide React for icons

### Backend
- Supabase (PostgreSQL database)
- Row Level Security policies
- Edge Functions for admin setup
- JWT authentication

### Database Schema

#### Leads Table
```sql
- id (uuid, primary key)
- name (text, unique email)
- email, phone, company
- source (Website, Referral, Social, Direct, Email Campaign, Other)
- message (initial inquiry)
- status (New, Contacted, Qualified, Proposal Sent, Converted, Closed Lost)
- priority (Low, Medium, High, Urgent)
- created_at, updated_at
```

#### Follow-ups Table
```sql
- id (uuid, primary key)
- lead_id (foreign key)
- date, time
- note
- reminder_sent, completed
- created_by (admin user)
```

#### Notes Table
```sql
- id (uuid, primary key)
- lead_id (foreign key)
- content
- created_by (admin user)
- created_by_email
```

#### Status History Table
```sql
- id (uuid, primary key)
- lead_id (foreign key)
- old_status, new_status
- changed_at, changed_by
```

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables in `.env`:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Run the development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

5. Preview production build:
```bash
npm run preview
```

## Project Structure

```
src/
├── components/
│   ├── Layout/
│   │   ├── AdminLayout.tsx
│   │   ├── Header.tsx
│   │   ├── ProtectedRoute.tsx
│   │   └── Sidebar.tsx
│   └── icons.tsx
├── contexts/
│   ├── AuthContext.tsx
│   ├── ThemeContext.tsx
│   └── NotificationContext.tsx
├── lib/
│   └── supabase.ts
├── pages/
│   ├── AnalyticsPage.tsx
│   ├── ContactPage.tsx
│   ├── DashboardPage.tsx
│   ├── FollowUpsPage.tsx
│   ├── LeadDetailPage.tsx
│   ├── LeadEditPage.tsx
│   ├── LeadsPage.tsx
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   └── SettingsPage.tsx
├── App.tsx
├── index.css
└── main.tsx
```

## Routes

### Public Routes
- `/` - Public contact form
- `/login` - Admin login
- `/register` - Admin registration

### Protected Routes (Admin Only)
- `/dashboard` - Dashboard with analytics
- `/leads` - Lead management
- `/leads/new` - Create new lead
- `/leads/:id` - View lead details
- `/leads/:id/edit` - Edit lead
- `/follow-ups` - Follow-ups management
- `/analytics` - Analytics dashboard
- `/settings` - Admin settings

## Default Credentials

For testing, use the automatically created admin account:
- **Email**: admin@leadflow.com
- **Password**: Admin@123

## Features in Detail

### Search & Filtering
- Real-time search across name, email, company
- Filter by status, priority, source
- Date range filtering on analytics page

### Notifications
- Toast notifications for all actions
- Success, error, warning, and info types
- Auto-dismiss after 4 seconds

### Responsive Design
- Mobile-first approach
- Tablet and desktop optimized
- Dark mode support on all pages

### Security
- Row Level Security enabled on all tables
- JWT authentication
- Protected API endpoints
- Input validation on all forms

## Performance

- Production bundle: ~1.1 MB (gzipped: ~335 KB)
- Optimized chunk loading
- CSS code splitting
- Tree-shaking of unused code

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## License

MIT

## Support

For issues or questions, please refer to the documentation or contact support.
