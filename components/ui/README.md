# UI Components

Base UI components for the admin interface, following the Costa Rica design system.

## Button Component

Modern button with four variants: primary, secondary, danger, and ghost.

### Usage

```tsx
import { Button } from '@/components/ui';

// Primary button (default)
<Button variant="primary" onClick={handleClick}>
  Save Changes
</Button>

// Secondary button
<Button variant="secondary" size="sm">
  Cancel
</Button>

// Danger button for destructive actions
<Button variant="danger" loading={isDeleting}>
  Delete
</Button>

// Ghost button for subtle actions
<Button variant="ghost" fullWidth>
  View Details
</Button>
```

### Props

- `variant`: 'primary' | 'secondary' | 'danger' | 'ghost' (default: 'primary')
- `size`: 'sm' | 'md' | 'lg' (default: 'md')
- `loading`: boolean (default: false) - Shows spinner and disables button
- `fullWidth`: boolean (default: false) - Makes button full width
- `disabled`: boolean (default: false)
- All standard button HTML attributes

## Card Component

Modern card with header, body, and footer sections.

### Usage

```tsx
import { Card, CardHeader, CardBody, CardFooter } from '@/components/ui';

<Card>
  <CardHeader>
    <h2 className="text-xl font-semibold">Guest Information</h2>
  </CardHeader>
  <CardBody>
    <p>Card content goes here</p>
  </CardBody>
  <CardFooter>
    <Button variant="primary">Save</Button>
    <Button variant="secondary">Cancel</Button>
  </CardFooter>
</Card>

// Clickable card
<Card onClick={handleCardClick}>
  <CardBody>
    <p>Click me!</p>
  </CardBody>
</Card>
```

### Components

- `Card`: Main container with shadow and border
- `CardHeader`: Header section with bottom border
- `CardBody`: Main content section
- `CardFooter`: Footer section with top border

### Props

**Card:**
- `onClick`: () => void (optional) - Makes card clickable with hover effect
- `className`: string (optional) - Additional CSS classes

**CardHeader, CardBody, CardFooter:**
- `className`: string (optional) - Additional CSS classes

## Design System

### Colors

The components use the Costa Rica color palette:

- **Jungle** (Green): Primary actions, success states
- **Sunset** (Orange): Warning states
- **Ocean** (Blue): Info states
- **Volcano** (Red): Danger, destructive actions
- **Sage** (Gray): Secondary actions, neutral states
- **Cloud** (White/Light Gray): Backgrounds

### Typography

- Font Family: Inter (sans-serif)
- Font Sizes: xs (12px), sm (14px), base (16px), lg (18px), xl (20px), 2xl (24px), 3xl (30px), 4xl (36px)
- Font Weights: normal (400), medium (500), semibold (600), bold (700)

### Spacing

Consistent spacing scale: 0, 1 (4px), 2 (8px), 3 (12px), 4 (16px), 5 (20px), 6 (24px), 8 (32px), 10 (40px), 12 (48px), 16 (64px), 20 (80px), 24 (96px)

### Shadows

- sm: Subtle shadow for small elements
- DEFAULT: Standard shadow for cards
- md: Medium shadow for elevated elements
- lg: Large shadow for modals
- xl: Extra large shadow for prominent elements
- 2xl: Maximum shadow for overlays

### Border Radius

- sm: 2px
- DEFAULT: 4px
- md: 6px
- lg: 8px
- xl: 12px
- 2xl: 16px
- full: Fully rounded (pills, circles)
