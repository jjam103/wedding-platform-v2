# Admin Dashboard - What You'll See

## Overview
When you log into the admin dashboard at `/admin`, you'll see a modern, professional interface with a Costa Rica tropical theme featuring jungle greens, sunset oranges, and ocean blues.

## Layout Structure

### 🎨 Visual Layout

```
┌─────────────────────────────────────────────────────────────┐
│  SIDEBAR (Left)          │  MAIN CONTENT AREA               │
│  ─────────────────       │  ──────────────────              │
│  🏠 Dashboard            │  ┌─ TOP BAR ──────────────────┐  │
│  👥 Guests               │  │  User Menu  🔔 Notifications│  │
│  📅 Events               │  └─────────────────────────────┘  │
│  🎯 Activities           │                                   │
│  🤝 Vendors              │  [DASHBOARD CONTENT]              │
│  📸 Photos (3)           │                                   │
│  ✉️  Emails              │                                   │
│  💰 Budget               │                                   │
│  ⚙️  Settings            │                                   │
│                          │                                   │
│  [Collapse on mobile]    │                                   │
└─────────────────────────────────────────────────────────────┘
```

## Dashboard Components

### 1. 🚨 Alerts Section (Top)
**What you'll see:**
- Real-time alerts and notifications
- Color-coded by severity:
  - 🔴 **Red (Error):** Critical issues requiring immediate attention
  - 🟡 **Yellow (Warning):** Important notices (e.g., capacity alerts)
  - 🔵 **Blue (Info):** General information updates
- Each alert shows:
  - Alert message
  - Timestamp
  - Dismiss button (✕)

**Example alerts:**
- "⚠️ Activity 'Beach Volleyball' is at 95% capacity"
- "ℹ️ 5 new RSVPs received in the last hour"
- "❌ Email delivery failed for 2 recipients"

### 2. 📊 Key Metrics Cards (6 Cards in Grid)

**Card 1: Total Guests** 👥
- Shows total number of invited guests
- Click to navigate to Guest Management page
- Color: Jungle Green

**Card 2: RSVP Response Rate** ✉️
- Shows percentage of guests who have responded
- Example: "78.5%"
- Click to view RSVP details
- Color: Ocean Blue

**Card 3: Total Budget** 💰
- Shows total wedding budget amount
- Example: "$45,000"
- Click to view Budget Dashboard
- Color: Sunset Orange

**Card 4: Upcoming Events** 📅
- Shows count of scheduled events
- Click to view Events page
- Color: Volcano Red

**Card 5: Pending Photos** 📸
- Shows number of photos awaiting moderation
- Click to moderate photos
- Color: Sage Gray

**Card 6: Capacity Alerts** ⚠️
- Shows activities at 90%+ capacity
- Click to view capacity details
- Color: Volcano Red

### 3. ⚡ Quick Actions (6 Buttons)

Fast-access buttons for common tasks:
- **👤 Add Guest** - Opens guest creation form
- **📅 Create Event** - Opens event creation form
- **🎯 Add Activity** - Opens activity creation form
- **🤝 Manage Vendors** - Navigate to vendors page
- **✉️ View RSVPs** - Navigate to RSVP overview
- **📸 Moderate Photos** - Navigate to photo moderation

### 4. 📋 Recent Activity Widget (Bottom Left)

Shows real-time activity feed:
- **👤 New guest added:** John Doe (5 minutes ago)
- **✉️ RSVP received from** Jane Smith (15 minutes ago)
- **📸 3 new photos** pending moderation (1 hour ago)

Updates automatically as changes occur.

### 5. ⏰ Upcoming Deadlines Widget (Bottom Right)

Shows important dates with countdown:
- **RSVP Deadline** - March 15, 2025 (48 days) 🔴
- **Final Payment Due** - April 1, 2025 (65 days) 🟡
- **Menu Selection** - March 20, 2025 (53 days) 🔵

Color-coded by urgency.

## Sidebar Navigation

### Main Sections:
1. **🏠 Dashboard** - Overview and metrics (you are here)
2. **👥 Guests** - Manage guest list, groups, RSVPs
3. **📅 Events** - Create and manage wedding events
4. **🎯 Activities** - Plan activities with capacity tracking
5. **🤝 Vendors** - Track vendors and payments
6. **📸 Photos (3)** - Moderate guest-uploaded photos (badge shows pending count)
7. **✉️ Emails** - Send emails and view history
8. **💰 Budget** - View budget breakdown and charts
9. **⚙️ Settings** - Configure system settings

### Sidebar Features:
- **Active highlighting:** Current section highlighted in jungle green
- **Badge notifications:** Red badge on Photos shows pending count
- **Mobile responsive:** Collapses to icon-only on mobile (<768px)
- **Smooth animations:** Hover effects and transitions

## Top Bar

### Right Side:
- **User Menu** - Your profile and logout
- **🔔 Notifications** - Bell icon for alerts (coming soon)

## Real-Time Features

### Auto-Updating Data:
- **Metrics refresh** every 30 seconds
- **Alerts refresh** every 60 seconds
- **RSVP changes** update immediately via Supabase subscriptions
- **Photo count** updates when photos are moderated

### Visual Feedback:
- Loading skeletons while data loads
- Smooth transitions and animations
- Toast notifications for actions
- Error messages with retry options

## Keyboard Shortcuts

Press **?** to see all shortcuts:
- **/** - Focus search input
- **n** - Open new entity form
- **Escape** - Close open modals
- **?** - Show keyboard shortcuts help

## Color Theme (Costa Rica)

### Primary Colors:
- **Jungle Green** (#22c55e) - Primary actions, success states
- **Sunset Orange** (#f97316) - Warnings, important items
- **Ocean Blue** (#0ea5e9) - Information, links
- **Volcano Red** (#ef4444) - Errors, critical alerts
- **Sage Gray** (#6b7280) - Text, borders, neutral elements
- **Cloud White** (#ffffff) - Backgrounds, cards

## Responsive Design

### Desktop (1024px+):
- Full sidebar visible
- 3-column metric grid
- 6-column quick actions
- Side-by-side widgets

### Tablet (768px-1023px):
- Full sidebar visible
- 2-column metric grid
- 3-column quick actions
- Side-by-side widgets

### Mobile (<768px):
- Sidebar collapses to icons
- 1-column metric grid
- 2-column quick actions
- Stacked widgets
- Touch-friendly 44x44px tap targets

## What Happens Next

### When You Click on Sections:

**👥 Guests:**
- See sortable, filterable table of all guests
- Filter by group, guest type, age type, RSVP status
- Search by name or email
- Click row to edit, delete icon to remove
- "Add Guest" button opens creation form

**📅 Events:**
- See all wedding events in table
- Filter by status and visibility
- Create events with rich text descriptions
- Manage event details and schedules

**🎯 Activities:**
- See activities with capacity tracking
- Rows turn yellow/red at 90%+ capacity
- Filter by event and status
- Track RSVPs per activity

**🤝 Vendors:**
- See vendor list with payment tracking
- Balance calculated automatically (base_cost - amount_paid)
- Unpaid vendors highlighted in yellow
- Filter by category and payment status

**📸 Photos:**
- Grid view of pending photos
- Click photo to see full size
- Approve, reject, or delete buttons
- Badge count updates in real-time

**✉️ Emails:**
- Compose emails with rich text editor
- Select recipients (guests/groups)
- Use templates with variable substitution
- View sent email history

**💰 Budget:**
- See total budget breakdown
- Pie chart by category
- Bar chart for vendor spending
- Calculate guest contributions vs host subsidies

**⚙️ Settings:**
- Configure wedding date, venue, couple names
- Set timezone
- Email notification preferences
- Photo gallery settings

## Error Handling

### If Something Goes Wrong:
- **Error boundaries** catch component errors
- **Friendly error messages** explain what happened
- **Retry buttons** for network errors
- **Toast notifications** for action failures
- **Console logging** for debugging

## Accessibility Features

### Built-in Support:
- ✅ **WCAG 2.1 AA compliant**
- ✅ **Screen reader compatible** with ARIA labels
- ✅ **Keyboard navigation** - Tab through all elements
- ✅ **Color contrast** - 4.5:1 ratio for text
- ✅ **Focus indicators** - Visible focus states
- ✅ **Skip navigation** - Jump to main content

## Performance

### Optimizations:
- **Skeleton loaders** prevent blank screens
- **Lazy loading** for heavy components
- **Debounced search** (300ms delay)
- **Pagination** for large datasets
- **Memoized calculations** for performance
- **Real-time subscriptions** for live updates

## Summary

The admin dashboard gives you a **comprehensive, at-a-glance view** of your entire wedding coordination:
- See key metrics instantly
- Access any section with one click
- Get real-time alerts and updates
- Use quick actions for common tasks
- Monitor deadlines and activity
- Beautiful, professional design with tropical theme
- Fully responsive and accessible
- Keyboard shortcuts for power users

**Everything you need to manage your destination wedding in one place!** 🌴✨
