# Design Document: Admin UI Modernization

## Overview

This design creates a modern, professional admin interface for the destination wedding platform using React Server Components, Next.js App Router, and a component-based architecture. The design emphasizes reusability, accessibility, and developer experience while maintaining the existing Costa Rica tropical theme.

The admin interface will be built using a layered architecture:
- **Presentation Layer**: React components with Tailwind CSS styling
- **State Management Layer**: React hooks with Supabase real-time subscriptions
- **Business Logic Layer**: Existing service layer (no changes needed)
- **Data Layer**: Existing Supabase database (no schema changes needed)

## Architecture

### Component Hierarchy

```
AdminLayout (Server Component)
├── Sidebar (Client Component)
│   ├── SidebarItem
│   └── SidebarBadge
├── TopBar (Client Component)
│   ├── UserMenu
│   └── NotificationBell
└── PageContent (Server Component)
    ├── PageHeader
    │   ├── PageTitle
    │   ├── SearchBar (Client Component)
    │   └── ActionButtons (Client Component)
    ├── DataTable (Client Component)
    │   ├── TableHeader
    │   ├── TableFilters (Client Component)
    │   ├── TableBody
    │   ├── TableRow
    │   └── TablePagination (Client Component)
    ├── FormModal (Client Component)
    │   ├── ModalHeader
    │   ├── ModalBody
    │   │   └── DynamicForm (Client Component)
    │   └── ModalFooter
    └── ToastContainer (Client Component)
        └── Toast
```

### Page Structure

Each admin page follows this pattern:
1. Server Component fetches initial data
2. Client Component manages interactive state
3. Shared components handle common UI patterns
4. Service layer handles all business logic

### Routing Structure

```
/admin
├── /dashboard (metrics, alerts, quick actions)
├── /guests (guest CRUD with data table)
├── /events (event CRUD with data table)
├── /activities (activity CRUD with data table)
├── /vendors (vendor CRUD with data table)
├── /photos (photo moderation grid)
├── /emails (email management and composition)
├── /budget (budget dashboard with charts)
└── /settings (system configuration)
```

## Components and Interfaces

### Core UI Components

#### 1. AdminLayout Component
**Purpose**: Provides consistent layout structure for all admin pages

**Props Interface**:
```typescript
interface AdminLayoutProps {
  children: React.ReactNode;
  currentSection: string;
}
```

**Behavior**:
- Renders persistent sidebar navigation
- Renders top bar with user menu
- Wraps page content in responsive container
- Handles mobile sidebar collapse/expand

#### 2. Sidebar Component
**Purpose**: Persistent navigation menu with section highlighting

**Props Interface**:
```typescript
interface SidebarProps {
  currentSection: string;
  pendingPhotosCount: number;
}

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ComponentType;
  href: string;
  badge?: number;
}
```

**Behavior**:
- Highlights active section based on current route
- Shows badge count for pending items (photos)
- Collapses to icon-only on mobile (<768px)
- Smooth transitions on hover and active states

#### 3. DataTable Component
**Purpose**: Reusable table with sort, filter, search, and pagination

**Props Interface**:
```typescript
interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  onSort: (column: string, direction: 'asc' | 'desc') => void;
  onFilter: (filters: Record<string, any>) => void;
  onSearch: (query: string) => void;
  onPageChange: (page: number) => void;
  onRowClick?: (row: T) => void;
  onDelete?: (row: T) => void;
  loading?: boolean;
  totalCount: number;
  currentPage: number;
  pageSize: number;
  selectable?: boolean;
  onSelectionChange?: (selectedIds: string[]) => void;
}

interface ColumnDef<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  filterType?: 'select' | 'text' | 'date';
  filterOptions?: { label: string; value: any }[];
  render?: (value: any, row: T) => React.ReactNode;
  width?: string;
  mobileHidden?: boolean;
}
```

**Behavior**:
- Renders table header with sortable columns
- Renders filter chips for active filters
- Renders search bar with debounced input
- Renders table body with custom cell renderers
- Renders pagination controls
- Supports row selection with checkboxes
- Shows skeleton loaders during loading state
- Responsive: stacks columns on mobile

#### 4. FormModal Component
**Purpose**: Overlay dialog for create/edit forms

**Props Interface**:
```typescript
interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  onSubmit: (data: any) => Promise<void>;
  initialData?: any;
  schema: z.ZodSchema;
  fields: FormField[];
  submitLabel?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'number' | 'select' | 'textarea' | 'date' | 'datetime' | 'checkbox' | 'richtext';
  placeholder?: string;
  required?: boolean;
  options?: { label: string; value: any }[];
  validation?: z.ZodSchema;
  helpText?: string;
  disabled?: boolean;
}
```

**Behavior**:
- Renders modal overlay with backdrop
- Renders form with dynamic fields based on configuration
- Validates form data using Zod schema
- Shows field-level error messages
- Disables submit button during submission
- Shows loading spinner on submit button
- Closes on Escape key or backdrop click
- Prevents body scroll when open

#### 5. Toast Component
**Purpose**: Temporary notifications for success/error messages

**Props Interface**:
```typescript
interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose: () => void;
}

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration: number;
}
```

**Behavior**:
- Renders toast notification with icon and message
- Auto-dismisses after duration (default 5000ms)
- Supports manual dismiss with close button
- Stacks multiple toasts vertically
- Animates in from top-right
- Color-coded by type (green=success, red=error, yellow=warning, blue=info)

#### 6. ConfirmDialog Component
**Purpose**: Confirmation dialog for destructive actions

**Props Interface**:
```typescript
interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning';
}
```

**Behavior**:
- Renders modal dialog with title and message
- Shows cancel and confirm buttons
- Disables buttons during confirmation
- Closes on cancel or after successful confirmation
- Styles confirm button based on variant (red for danger)

### Page-Specific Components

#### 7. GuestTable Component
**Purpose**: Guest list with CRUD operations

**Props Interface**:
```typescript
interface GuestTableProps {
  initialGuests: Guest[];
  groups: Group[];
}
```

**Behavior**:
- Uses DataTable component with guest-specific columns
- Filters: group, guest_type, age_type, rsvp_status
- Columns: name, email, group, guest_type, age_type, rsvp_status
- Opens FormModal for create/edit
- Shows ConfirmDialog for delete
- Calls guestService methods for CRUD operations

#### 8. EventTable Component
**Purpose**: Event list with CRUD operations

**Props Interface**:
```typescript
interface EventTableProps {
  initialEvents: Event[];
  locations: Location[];
}
```

**Behavior**:
- Uses DataTable component with event-specific columns
- Filters: status, visibility
- Columns: name, date, time, location, status, visibility
- Opens FormModal for create/edit with rich text editor
- Shows ConfirmDialog for delete
- Calls eventService methods for CRUD operations

#### 9. ActivityTable Component
**Purpose**: Activity list with CRUD operations and capacity tracking

**Props Interface**:
```typescript
interface ActivityTableProps {
  initialActivities: Activity[];
  events: Event[];
  locations: Location[];
}
```

**Behavior**:
- Uses DataTable component with activity-specific columns
- Filters: event, status
- Columns: name, event, date/time, capacity, current_rsvps, status
- Highlights rows at 90%+ capacity in warning color
- Opens FormModal for create/edit
- Shows capacity utilization percentage in form
- Shows ConfirmDialog for delete
- Calls activityService methods for CRUD operations

#### 10. VendorTable Component
**Purpose**: Vendor list with payment tracking

**Props Interface**:
```typescript
interface VendorTableProps {
  initialVendors: Vendor[];
}
```

**Behavior**:
- Uses DataTable component with vendor-specific columns
- Filters: category, payment_status
- Columns: name, category, base_cost, amount_paid, balance, payment_status
- Calculates balance (base_cost - amount_paid)
- Highlights unpaid vendors in warning color
- Opens FormModal for create/edit
- Validates amount_paid <= base_cost
- Calls vendorService methods for CRUD operations

#### 11. PhotoGrid Component
**Purpose**: Photo moderation interface

**Props Interface**:
```typescript
interface PhotoGridProps {
  initialPhotos: Photo[];
}
```

**Behavior**:
- Renders grid of photo thumbnails
- Filters: moderation_status (pending, approved, rejected)
- Shows uploader name, upload date, caption
- Opens full-size preview modal on click
- Preview modal shows approve, reject, delete buttons
- Calls photoService methods for moderation actions
- Uses Supabase real-time subscription for live updates

#### 12. EmailComposer Component
**Purpose**: Email composition and sending

**Props Interface**:
```typescript
interface EmailComposerProps {
  guests: Guest[];
  groups: Group[];
  templates: EmailTemplate[];
}
```

**Behavior**:
- Renders form with recipient selection (guests/groups)
- Renders rich text editor for email body
- Supports template selection with variable substitution
- Shows preview before sending
- Validates required fields
- Calls emailService.send() for delivery
- Shows Toast notification on success/error

#### 13. BudgetDashboard Component
**Purpose**: Budget overview with charts

**Props Interface**:
```typescript
interface BudgetDashboardProps {
  vendors: Vendor[];
  activities: Activity[];
  accommodations: Accommodation[];
}
```

**Behavior**:
- Calculates total vendor costs
- Calculates total activity costs (with subsidies)
- Calculates total accommodation costs
- Renders pie chart for category breakdown
- Renders bar chart for vendor spending
- Highlights items exceeding budget
- Provides export to CSV functionality

## Data Models

### Component State Models

#### TableState
```typescript
interface TableState<T> {
  data: T[];
  filteredData: T[];
  sortColumn: keyof T | null;
  sortDirection: 'asc' | 'desc';
  filters: Record<string, any>;
  searchQuery: string;
  currentPage: number;
  pageSize: number;
  selectedIds: string[];
  loading: boolean;
}
```

#### FormState
```typescript
interface FormState {
  data: Record<string, any>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  submitting: boolean;
  submitError: string | null;
}
```

#### ToastState
```typescript
interface ToastState {
  toasts: Toast[];
  nextId: number;
}
```

### UI Configuration Models

#### SidebarConfig
```typescript
const sidebarConfig: SidebarItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: HomeIcon, href: '/admin/dashboard' },
  { id: 'guests', label: 'Guests', icon: UsersIcon, href: '/admin/guests' },
  { id: 'events', label: 'Events', icon: CalendarIcon, href: '/admin/events' },
  { id: 'activities', label: 'Activities', icon: SparklesIcon, href: '/admin/activities' },
  { id: 'vendors', label: 'Vendors', icon: BriefcaseIcon, href: '/admin/vendors' },
  { id: 'photos', label: 'Photos', icon: PhotoIcon, href: '/admin/photos', badge: 'pendingCount' },
  { id: 'emails', label: 'Emails', icon: EnvelopeIcon, href: '/admin/emails' },
  { id: 'budget', label: 'Budget', icon: CurrencyDollarIcon, href: '/admin/budget' },
  { id: 'settings', label: 'Settings', icon: CogIcon, href: '/admin/settings' },
];
```

#### TableColumnConfigs
```typescript
const guestColumns: ColumnDef<Guest>[] = [
  { key: 'firstName', label: 'First Name', sortable: true, filterable: false },
  { key: 'lastName', label: 'Last Name', sortable: true, filterable: false },
  { key: 'email', label: 'Email', sortable: true, filterable: false },
  { key: 'groupName', label: 'Group', sortable: true, filterable: true, filterType: 'select' },
  { key: 'guestType', label: 'Guest Type', sortable: true, filterable: true, filterType: 'select', filterOptions: [
    { label: 'Wedding Party', value: 'wedding_party' },
    { label: 'Wedding Guest', value: 'wedding_guest' },
    { label: 'Pre-wedding Only', value: 'prewedding_only' },
    { label: 'Post-wedding Only', value: 'postwedding_only' },
  ]},
  { key: 'ageType', label: 'Age Type', sortable: true, filterable: true, filterType: 'select', filterOptions: [
    { label: 'Adult', value: 'adult' },
    { label: 'Child', value: 'child' },
    { label: 'Senior', value: 'senior' },
  ]},
  { key: 'rsvpStatus', label: 'RSVP', sortable: true, filterable: true, filterType: 'select', filterOptions: [
    { label: 'Attending', value: 'attending' },
    { label: 'Declined', value: 'declined' },
    { label: 'Maybe', value: 'maybe' },
    { label: 'Pending', value: 'pending' },
  ], render: (value) => <RSVPBadge status={value} /> },
];
```

## Design System Specifications

### Color Palette (Costa Rica Theme)

```typescript
const colors = {
  // Primary colors
  jungle: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e', // Primary jungle green
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  sunset: {
    50: '#fff7ed',
    100: '#ffedd5',
    200: '#fed7aa',
    300: '#fdba74',
    400: '#fb923c',
    500: '#f97316', // Primary sunset orange
    600: '#ea580c',
    700: '#c2410c',
    800: '#9a3412',
    900: '#7c2d12',
  },
  ocean: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9', // Primary ocean blue
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },
  volcano: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444', // Primary volcano red
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
  sage: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280', // Primary sage gray
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
  cloud: {
    50: '#ffffff',
    100: '#fafafa',
    200: '#f5f5f5',
    300: '#f0f0f0',
    400: '#e0e0e0',
    500: '#d0d0d0',
  },
};
```

### Typography Scale

```typescript
const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['Fira Code', 'monospace'],
  },
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
};
```

### Spacing Scale

```typescript
const spacing = {
  0: '0',
  1: '0.25rem',  // 4px
  2: '0.5rem',   // 8px
  3: '0.75rem',  // 12px
  4: '1rem',     // 16px
  5: '1.25rem',  // 20px
  6: '1.5rem',   // 24px
  8: '2rem',     // 32px
  10: '2.5rem',  // 40px
  12: '3rem',    // 48px
  16: '4rem',    // 64px
  20: '5rem',    // 80px
  24: '6rem',    // 96px
};
```

### Border Radius

```typescript
const borderRadius = {
  none: '0',
  sm: '0.125rem',   // 2px
  DEFAULT: '0.25rem', // 4px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  full: '9999px',
};
```

### Shadows

```typescript
const boxShadow = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
};
```

### Responsive Breakpoints

```typescript
const screens = {
  sm: '640px',   // Mobile landscape
  md: '768px',   // Tablet
  lg: '1024px',  // Desktop
  xl: '1280px',  // Large desktop
  '2xl': '1536px', // Extra large desktop
};
```

### Component Styling Patterns

#### Button Variants
```typescript
const buttonVariants = {
  primary: 'bg-jungle-500 hover:bg-jungle-600 text-white',
  secondary: 'bg-sage-200 hover:bg-sage-300 text-sage-900',
  danger: 'bg-volcano-500 hover:bg-volcano-600 text-white',
  ghost: 'bg-transparent hover:bg-sage-100 text-sage-700',
};

const buttonSizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};
```

#### Card Styling
```css
.card {
  @apply bg-white rounded-lg shadow-md p-6 border border-sage-200;
}

.card-header {
  @apply border-b border-sage-200 pb-4 mb-4;
}
```

#### Table Styling
```css
.table-container {
  @apply bg-white rounded-lg shadow-md overflow-hidden;
}

.table-header {
  @apply bg-sage-50 border-b border-sage-200;
}

.table-row {
  @apply border-b border-sage-100 hover:bg-sage-50 transition-colors cursor-pointer;
}

.table-cell {
  @apply px-6 py-4 text-sm text-sage-900;
}
```

#### Modal Styling
```css
.modal-overlay {
  @apply fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center;
}

.modal-content {
  @apply bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto;
}

.modal-header {
  @apply px-6 py-4 border-b border-sage-200 flex items-center justify-between;
}

.modal-body {
  @apply px-6 py-4;
}

.modal-footer {
  @apply px-6 py-4 border-t border-sage-200 flex items-center justify-end gap-3;
}
```

## Error Handling

### Client-Side Error Handling

All client components will use a consistent error handling pattern:

```typescript
try {
  const result = await service.method(data);
  
  if (result.success) {
    showToast({ type: 'success', message: 'Operation successful' });
    // Update UI state
  } else {
    showToast({ type: 'error', message: result.error.message });
  }
} catch (error) {
  showToast({ type: 'error', message: 'An unexpected error occurred' });
  console.error('Operation failed:', error);
}
```

### Error Message Mapping

Map technical error codes to user-friendly messages:

```typescript
const errorMessages: Record<string, string> = {
  VALIDATION_ERROR: 'Please check your input and try again',
  DATABASE_ERROR: 'Unable to save changes. Please try again',
  UNAUTHORIZED: 'You do not have permission to perform this action',
  NOT_FOUND: 'The requested item could not be found',
  CONFLICT: 'This action conflicts with existing data',
  CAPACITY_EXCEEDED: 'This activity has reached maximum capacity',
  DUPLICATE_ENTRY: 'An item with this information already exists',
};
```

### Form Validation

Use Zod schemas for client-side validation before submission:

```typescript
const guestFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  email: z.string().email('Invalid email address').nullable(),
  groupId: z.string().uuid('Please select a group'),
  ageType: z.enum(['adult', 'child', 'senior']),
  guestType: z.enum(['wedding_party', 'wedding_guest', 'prewedding_only', 'postwedding_only']),
});
```

## Testing Strategy

### Unit Testing

**Component Tests**:
- Test each UI component in isolation
- Mock service layer calls
- Test user interactions (clicks, form submissions)
- Test conditional rendering
- Test accessibility attributes

**Hook Tests**:
- Test custom hooks with React Testing Library
- Test state updates
- Test side effects
- Test error handling

**Example**:
```typescript
describe('DataTable', () => {
  it('should render table with data', () => {
    render(<DataTable data={mockData} columns={mockColumns} />);
    expect(screen.getByRole('table')).toBeInTheDocument();
  });
  
  it('should call onRowClick when row is clicked', () => {
    const onRowClick = jest.fn();
    render(<DataTable data={mockData} columns={mockColumns} onRowClick={onRowClick} />);
    fireEvent.click(screen.getByText(mockData[0].name));
    expect(onRowClick).toHaveBeenCalledWith(mockData[0]);
  });
  
  it('should show loading skeleton when loading', () => {
    render(<DataTable data={[]} columns={mockColumns} loading={true} />);
    expect(screen.getByTestId('skeleton-loader')).toBeInTheDocument();
  });
});
```

### Integration Testing

**Page Tests**:
- Test full page rendering with real data
- Test navigation between pages
- Test form submission flows
- Test error scenarios

**Example**:
```typescript
describe('Guest Management Page', () => {
  it('should load and display guests', async () => {
    render(<GuestsPage />);
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });
  
  it('should create new guest', async () => {
    render(<GuestsPage />);
    fireEvent.click(screen.getByText('Add Guest'));
    fireEvent.change(screen.getByLabelText('First Name'), { target: { value: 'Jane' } });
    fireEvent.change(screen.getByLabelText('Last Name'), { target: { value: 'Smith' } });
    fireEvent.click(screen.getByText('Save'));
    await waitFor(() => {
      expect(screen.getByText('Guest created successfully')).toBeInTheDocument();
    });
  });
});
```

### Accessibility Testing

**Automated Tests**:
- Run axe-core on all pages
- Test keyboard navigation
- Test screen reader compatibility
- Test color contrast

**Example**:
```typescript
describe('Accessibility', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(<GuestsPage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
  
  it('should support keyboard navigation', () => {
    render(<DataTable data={mockData} columns={mockColumns} />);
    const firstRow = screen.getAllByRole('row')[1];
    firstRow.focus();
    fireEvent.keyDown(firstRow, { key: 'Enter' });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
```

### E2E Testing

**Critical Flows**:
- Guest creation and editing
- Event creation and editing
- Activity creation with capacity tracking
- Photo moderation workflow
- Email composition and sending

**Example**:
```typescript
test('should complete guest management flow', async ({ page }) => {
  await page.goto('/admin/guests');
  await page.click('text=Add Guest');
  await page.fill('input[name="firstName"]', 'John');
  await page.fill('input[name="lastName"]', 'Doe');
  await page.fill('input[name="email"]', 'john@example.com');
  await page.selectOption('select[name="groupId"]', 'group-1');
  await page.click('button[type="submit"]');
  await expect(page.locator('text=Guest created successfully')).toBeVisible();
  await expect(page.locator('text=John Doe')).toBeVisible();
});
```

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property Reflection

After analyzing all acceptance criteria, I identified the following patterns:
- Many UI interaction properties are similar across different entities (guests, events, activities, vendors)
- Toast notifications follow a consistent pattern for all operations
- Form validation follows a consistent pattern for all forms
- Data table operations (sort, filter, search) follow consistent patterns
- Modal interactions follow consistent patterns

To avoid redundancy, I've consolidated similar properties into general properties that apply across all entity types, rather than creating separate properties for each entity.

### UI Interaction Properties

**Property 1: Table sorting consistency**
*For any* data table with sortable columns, clicking a column header should toggle the sort direction and update the displayed data to reflect the new sort order.
**Validates: Requirements 3.3**

**Property 2: Search filtering accuracy**
*For any* data table with search functionality and any search query, the displayed results should only include rows where at least one searchable field contains the query string (case-insensitive).
**Validates: Requirements 3.5**

**Property 3: Row click opens edit modal**
*For any* data table row representing an entity, clicking the row should open a form modal pre-populated with that entity's current data.
**Validates: Requirements 3.8, 4.8**

**Property 4: Delete confirmation requirement**
*For any* entity delete action, clicking the delete button should display a confirmation dialog before executing the deletion.
**Validates: Requirements 3.9, 13.1**

**Property 5: Success toast on successful operations**
*For any* successful CRUD operation (create, update, delete), the system should display a success toast notification with an appropriate message.
**Validates: Requirements 3.10, 4.9, 8.7**

**Property 6: Error toast on failed operations**
*For any* failed CRUD operation, the system should display an error toast notification with a user-friendly error message.
**Validates: Requirements 3.11, 12.1**

**Property 7: Form validation prevents invalid submission**
*For any* form with required fields, attempting to submit the form with missing or invalid required fields should prevent submission and display field-level error messages.
**Validates: Requirements 4.7, 12.3**

**Property 8: Modal closes on Escape key**
*For any* open modal dialog, pressing the Escape key should close the modal.
**Validates: Requirements 17.3**

**Property 9: Form inputs have associated labels**
*For any* form input field, there should be an associated label element and error messages should be displayed when the field is invalid.
**Validates: Requirements 18.5**

### Data Display Properties

**Property 10: Capacity warning highlighting**
*For any* activity with capacity utilization >= 90%, the activity row in the data table should be styled with warning colors to indicate near-capacity status.
**Validates: Requirements 5.3**

**Property 11: Capacity utilization display**
*For any* activity being edited that has existing RSVPs, the form modal should display the current capacity utilization percentage.
**Validates: Requirements 5.7**

**Property 12: Vendor balance calculation**
*For any* vendor displayed in the vendor table, the balance column should show the value (base_cost - amount_paid).
**Validates: Requirements 6.3**

**Property 13: Unpaid vendor highlighting**
*For any* vendor with payment_status = 'unpaid', the vendor row should be styled with warning colors.
**Validates: Requirements 6.4**

**Property 14: Vendor payment validation**
*For any* vendor form submission, if amount_paid exceeds base_cost, the form validation should fail with an appropriate error message.
**Validates: Requirements 6.8**

**Property 15: Photo grid completeness**
*For any* photo displayed in the photo grid, the display should include the thumbnail image, uploader name, upload date, and caption.
**Validates: Requirements 7.2**

**Property 16: Photo click opens preview**
*For any* photo in the photo grid, clicking the photo should open a full-size preview modal.
**Validates: Requirements 7.4**
**Note:** This property tests complex UI interactions (modal state management, event handling) that are difficult to test reliably in property-based tests. This behavior should be verified through integration tests or E2E tests instead.

**Property 17: Photo moderation updates status**
*For any* photo, clicking the approve button should update the photo's moderation_status to 'approved', and clicking the reject button should update it to 'rejected'.
**Validates: Requirements 7.6, 7.7**
**Note:** This property tests complex UI interactions (modal opening, button clicks, API calls, state updates) that are difficult to test reliably in property-based tests. This behavior should be verified through integration tests or E2E tests instead.

**Property 18: Pending photo count accuracy**
*For any* state of the photo collection, the sidebar badge count should equal the number of photos with moderation_status = 'pending'.
**Validates: Requirements 7.8**

### Budget and Calculation Properties

**Property 19: Budget calculation accuracy**
*For any* budget dashboard state, the displayed guest contributions and host subsidies should equal the sum of all individual contributions and subsidies across all activities and accommodations.
**Validates: Requirements 9.4**

**Property 20: Budget item highlighting**
*For any* budget item where actual cost exceeds planned cost, the item should be highlighted with warning styling.
**Validates: Requirements 9.5**

### Bulk Operations Properties

**Property 21: Bulk action toolbar visibility**
*For any* data table with row selection enabled, when one or more rows are selected, the bulk action toolbar should be visible.
**Validates: Requirements 14.2**

**Property 22: Selected count accuracy**
*For any* data table with selected rows, the bulk action toolbar should display a count that equals the number of currently selected rows.
**Validates: Requirements 14.3**

**Property 23: Bulk operation progress indication**
*For any* bulk operation in progress, a progress indicator should be visible to the user.
**Validates: Requirements 14.5**

### Export Properties

**Property 24: CSV export data accuracy**
*For any* data table state with active filters, exporting to CSV should generate a file containing exactly the rows currently visible in the filtered table.
**Validates: Requirements 15.2**

**Property 25: CSV column completeness**
*For any* CSV export, the file should include all columns that are currently visible in the data table.
**Validates: Requirements 15.3**

**Property 26: CSV filename format**
*For any* CSV export operation, the generated filename should follow the pattern `{entity-type}-{timestamp}.csv`.
**Validates: Requirements 15.4**

### URL State Persistence Properties

**Property 27: Filter state URL persistence**
*For any* filter change in a data table, the URL query parameters should be updated to reflect the current filter values.
**Validates: Requirements 16.1**

**Property 28: Filter state restoration**
*For any* page load with filter query parameters in the URL, the data table should apply those filters and display the filtered results.
**Validates: Requirements 16.2**

**Property 29: Active filter chip display**
*For any* active filter in a data table, a removable chip/tag should be displayed that shows the filter name and value.
**Validates: Requirements 16.3**

**Property 30: Sort state URL persistence**
*For any* sort change in a data table, the URL query parameters should be updated to include the sort column and direction.
**Validates: Requirements 16.5**

### Loading State Properties

**Property 31: Loading skeleton display**
*For any* component in a loading state, skeleton loaders should be displayed in place of the actual content.
**Validates: Requirements 11.1**

**Property 32: Form submission button state**
*For any* form in a submitting state, the submit button should be disabled and display a loading spinner.
**Validates: Requirements 11.3**

**Property 33: Action button loading state**
*For any* action button processing an operation, the button should display a loading indicator.
**Validates: Requirements 11.4**

**Property 34: No blank screens during loading**
*For any* page load operation, either actual content or skeleton loaders should be visible (never a blank screen).
**Validates: Requirements 11.5**

### Confirmation Dialog Properties

**Property 35: Confirmation dialog content**
*For any* confirmation dialog displayed, the dialog should clearly state what entity or data will be deleted, including the entity name or identifier.
**Validates: Requirements 13.2**

**Property 36: Confirmed delete execution**
*For any* delete confirmation, clicking the confirm button should call the appropriate delete service method and display a toast notification with the result.
**Validates: Requirements 13.5**

### Keyboard Navigation Properties

**Property 37: Tab navigation completeness**
*For any* admin page, pressing Tab repeatedly should move focus through all interactive elements in a logical order without skipping any focusable elements.
**Validates: Requirements 17.5**

### Settings Persistence Property

**Property 38: Settings validation and persistence**
*For any* settings form submission with valid data, the system should persist the changes and display a success toast notification.
**Validates: Requirements 20.5**

### Testing Implementation Notes

**Unit Tests vs Property Tests**:
- Properties 1-38 should be implemented as property-based tests using fast-check
- Each property test should run a minimum of 100 iterations
- Properties involving UI interactions should use React Testing Library
- Properties involving E2E flows should use Playwright

**Test Data Generators**:
Create custom arbitraries for:
- Guest data (with various guest types, age types, RSVP statuses)
- Event data (with various dates, statuses, visibilities)
- Activity data (with various capacities and RSVP counts)
- Vendor data (with various payment statuses and amounts)
- Photo data (with various moderation statuses)
- Filter combinations
- Sort configurations
- URL query parameter combinations

**Edge Cases to Cover**:
- Empty data sets
- Single item data sets
- Maximum capacity scenarios
- Zero cost scenarios
- Null/undefined optional fields
- Very long text strings
- Special characters in search queries
- Concurrent user actions
