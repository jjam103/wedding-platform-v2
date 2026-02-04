# Component Mocks Usage Guide

## Overview

This guide explains how to use the standardized mock utilities in `componentMocks.ts` to fix failing component tests. These utilities provide consistent mock implementations for custom hooks used throughout the application.

## Quick Start

### Basic Usage

```typescript
import { createMockUseLocations } from '@/__tests__/helpers/componentMocks';

// Mock the hook at the top of your test file
jest.mock('@/hooks/useLocations', () => ({
  useLocations: jest.fn(() => createMockUseLocations()),
}));

describe('MyComponent', () => {
  it('should render with locations', () => {
    render(<MyComponent />);
    // Test your component
  });
});
```

### With Custom Data

```typescript
import { 
  createMockUseLocations, 
  createMockLocation 
} from '@/__tests__/helpers/componentMocks';

const mockLocations = [
  createMockLocation({ id: '1', name: 'Costa Rica' }),
  createMockLocation({ id: '2', name: 'San Jose', parentLocationId: '1' }),
];

jest.mock('@/hooks/useLocations', () => ({
  useLocations: jest.fn(() => createMockUseLocations(mockLocations)),
}));
```

## Available Mock Utilities

### 1. useLocations Mock

**Purpose**: Mock location hierarchy data and CRUD operations

**Structure**:
```typescript
{
  data: Location[],           // Array of location objects
  loading: boolean,           // Loading state
  error: Error | null,        // Error state
  refetch: jest.Mock,         // Refetch function
  create: jest.Mock,          // Create location
  update: jest.Mock,          // Update location
  remove: jest.Mock,          // Delete location
  validateParent: jest.Mock,  // Validate parent relationship
}
```

**Example**:
```typescript
import { createMockUseLocations, createMockLocation } from '@/__tests__/helpers/componentMocks';

// Empty state
const emptyMock = createMockUseLocations();

// With data
const mockLocations = [
  createMockLocation({ id: '1', name: 'Costa Rica' }),
  createMockLocation({ id: '2', name: 'San Jose', parentLocationId: '1' }),
];
const dataMock = createMockUseLocations(mockLocations);

// Loading state
const loadingMock = createMockUseLocations([], { loading: true });

// Error state
const errorMock = createMockUseLocations([], { 
  error: new Error('Failed to fetch locations') 
});
```

### 2. useEvents Mock

**Purpose**: Mock event data and CRUD operations

**Structure**:
```typescript
{
  data: Event[],        // Array of event objects
  loading: boolean,     // Loading state
  error: Error | null,  // Error state
  refetch: jest.Mock,   // Refetch function
  create: jest.Mock,    // Create event
  update: jest.Mock,    // Update event
  remove: jest.Mock,    // Delete event
}
```

**Example**:
```typescript
import { createMockUseEvents, createMockEvent } from '@/__tests__/helpers/componentMocks';

const mockEvents = [
  createMockEvent({ 
    id: '1', 
    name: 'Wedding Ceremony',
    startDate: '2024-06-01',
    endDate: '2024-06-01',
  }),
];

jest.mock('@/hooks/useEvents', () => ({
  useEvents: jest.fn(() => createMockUseEvents(mockEvents)),
}));
```

### 3. useSections Mock

**Purpose**: Mock page sections and content management

**Structure**:
```typescript
{
  data: Section[],      // Array of section objects
  loading: boolean,     // Loading state
  error: Error | null,  // Error state
  refetch: jest.Mock,   // Refetch function
  create: jest.Mock,    // Create section
  update: jest.Mock,    // Update section
  remove: jest.Mock,    // Delete section
  reorder: jest.Mock,   // Reorder sections
}
```

**Example**:
```typescript
import { createMockUseSections, createMockSection } from '@/__tests__/helpers/componentMocks';

const mockSections = [
  createMockSection({
    id: '1',
    pageType: 'activity',
    pageId: 'activity-1',
    layout: 'two-column',
    columns: [
      { id: 'col-1', columnNumber: 1, contentType: 'rich_text', contentData: { html: '<p>Left</p>' } },
      { id: 'col-2', columnNumber: 2, contentType: 'photos', contentData: { photoIds: ['photo-1'] } },
    ],
  }),
];

jest.mock('@/hooks/useSections', () => ({
  useSections: jest.fn(() => createMockUseSections(mockSections)),
}));
```

### 4. useRoomTypes Mock

**Purpose**: Mock room type data for accommodations

**Structure**:
```typescript
{
  data: RoomType[],     // Array of room type objects
  loading: boolean,     // Loading state
  error: Error | null,  // Error state
  refetch: jest.Mock,   // Refetch function
  create: jest.Mock,    // Create room type
  update: jest.Mock,    // Update room type
  remove: jest.Mock,    // Delete room type
}
```

**Example**:
```typescript
import { createMockUseRoomTypes, createMockRoomType } from '@/__tests__/helpers/componentMocks';

const mockRoomTypes = [
  createMockRoomType({
    id: '1',
    accommodationId: 'acc-1',
    name: 'Ocean View Suite',
    capacity: 2,
    pricePerNight: 150,
    checkInDate: '2024-06-01',
    checkOutDate: '2024-06-05',
  }),
];

jest.mock('@/hooks/useRoomTypes', () => ({
  useRoomTypes: jest.fn(() => createMockUseRoomTypes(mockRoomTypes)),
}));
```

### 5. usePhotos Mock

**Purpose**: Mock photo gallery data and moderation

**Structure**:
```typescript
{
  data: Photo[],        // Array of photo objects
  loading: boolean,     // Loading state
  error: Error | null,  // Error state
  refetch: jest.Mock,   // Refetch function
  create: jest.Mock,    // Create photo
  update: jest.Mock,    // Update photo
  remove: jest.Mock,    // Delete photo
  approve: jest.Mock,   // Approve photo
  reject: jest.Mock,    // Reject photo
}
```

**Example**:
```typescript
import { createMockUsePhotos, createMockPhoto } from '@/__tests__/helpers/componentMocks';

const mockPhotos = [
  createMockPhoto({
    id: '1',
    photo_url: 'https://example.com/photo1.jpg',
    caption: 'Beautiful sunset',
    alt_text: 'Sunset over the ocean',
    moderation_status: 'approved',
  }),
];

jest.mock('@/hooks/usePhotos', () => ({
  usePhotos: jest.fn(() => createMockUsePhotos(mockPhotos)),
}));
```

### 6. useContentPages Mock

**Purpose**: Mock CMS content pages

**Structure**:
```typescript
{
  data: ContentPage[],  // Array of content page objects
  loading: boolean,     // Loading state
  error: Error | null,  // Error state
  refetch: jest.Mock,   // Refetch function
  create: jest.Mock,    // Create page
  update: jest.Mock,    // Update page
  remove: jest.Mock,    // Delete page
}
```

**Example**:
```typescript
import { createMockUseContentPages, createMockContentPage } from '@/__tests__/helpers/componentMocks';

const mockContentPages = [
  createMockContentPage({
    id: '1',
    title: 'Our Story',
    slug: 'our-story',
    description: 'How we met',
    isPublished: true,
  }),
];

jest.mock('@/hooks/useContentPages', () => ({
  useContentPages: jest.fn(() => createMockUseContentPages(mockContentPages)),
}));
```

## Common Test Scenarios

### Loading State

```typescript
import { createLoadingMock } from '@/__tests__/helpers/componentMocks';

jest.mock('@/hooks/useLocations', () => ({
  useLocations: jest.fn(() => createLoadingMock('locations')),
}));

it('should show loading spinner', () => {
  render(<MyComponent />);
  expect(screen.getByText(/loading/i)).toBeInTheDocument();
});
```

### Error State

```typescript
import { createErrorMock } from '@/__tests__/helpers/componentMocks';

jest.mock('@/hooks/useLocations', () => ({
  useLocations: jest.fn(() => createErrorMock('locations', 'Failed to load')),
}));

it('should show error message', () => {
  render(<MyComponent />);
  expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
});
```

### Empty State

```typescript
import { createMockUseLocations } from '@/__tests__/helpers/componentMocks';

jest.mock('@/hooks/useLocations', () => ({
  useLocations: jest.fn(() => createMockUseLocations([])),
}));

it('should show empty state', () => {
  render(<MyComponent />);
  expect(screen.getByText(/no locations/i)).toBeInTheDocument();
});
```

### Testing CRUD Operations

```typescript
import { createMockUseLocations, createMockLocation } from '@/__tests__/helpers/componentMocks';

const mockCreate = jest.fn().mockResolvedValue({ 
  success: true, 
  data: createMockLocation({ id: 'new-1', name: 'New Location' }) 
});

jest.mock('@/hooks/useLocations', () => ({
  useLocations: jest.fn(() => createMockUseLocations([], { create: mockCreate })),
}));

it('should create new location', async () => {
  render(<MyComponent />);
  
  const input = screen.getByLabelText(/location name/i);
  const button = screen.getByRole('button', { name: /add/i });
  
  fireEvent.change(input, { target: { value: 'New Location' } });
  fireEvent.click(button);
  
  await waitFor(() => {
    expect(mockCreate).toHaveBeenCalledWith({ name: 'New Location' });
  });
});
```

## Migration Guide

### Before (Old Pattern)

```typescript
// ❌ OLD: Inconsistent mock structure
jest.mock('@/hooks/useLocations', () => ({
  useLocations: jest.fn(() => ({
    locations: [], // Wrong property name
    loading: false,
    error: null,
  })),
}));
```

### After (New Pattern)

```typescript
// ✅ NEW: Standardized mock structure
import { createMockUseLocations } from '@/__tests__/helpers/componentMocks';

jest.mock('@/hooks/useLocations', () => ({
  useLocations: jest.fn(() => createMockUseLocations()),
}));
```

## Common Patterns

### Pattern 1: Admin Page with Multiple Hooks

```typescript
import { 
  createMockUseLocations,
  createMockUseEvents,
  createMockUseSections,
  createMockLocation,
  createMockEvent,
} from '@/__tests__/helpers/componentMocks';

// Mock all hooks
jest.mock('@/hooks/useLocations', () => ({
  useLocations: jest.fn(() => createMockUseLocations([
    createMockLocation({ id: '1', name: 'Costa Rica' }),
  ])),
}));

jest.mock('@/hooks/useEvents', () => ({
  useEvents: jest.fn(() => createMockUseEvents([
    createMockEvent({ id: '1', name: 'Wedding' }),
  ])),
}));

jest.mock('@/hooks/useSections', () => ({
  useSections: jest.fn(() => createMockUseSections()),
}));
```

### Pattern 2: Testing with Dynamic Data

```typescript
import { createMockUseLocations, createMockLocation } from '@/__tests__/helpers/componentMocks';

describe('LocationSelector', () => {
  it('should render all locations', () => {
    const mockLocations = Array.from({ length: 5 }, (_, i) => 
      createMockLocation({ id: `loc-${i}`, name: `Location ${i}` })
    );
    
    jest.mock('@/hooks/useLocations', () => ({
      useLocations: jest.fn(() => createMockUseLocations(mockLocations)),
    }));
    
    render(<LocationSelector />);
    
    mockLocations.forEach(location => {
      expect(screen.getByText(location.name)).toBeInTheDocument();
    });
  });
});
```

### Pattern 3: Testing State Transitions

```typescript
import { createMockUseLocations, createLoadingMock } from '@/__tests__/helpers/componentMocks';

describe('LocationList', () => {
  it('should transition from loading to data', async () => {
    // Start with loading
    const { rerender } = render(<LocationList />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    
    // Update to show data
    jest.mock('@/hooks/useLocations', () => ({
      useLocations: jest.fn(() => createMockUseLocations([
        createMockLocation({ id: '1', name: 'Costa Rica' }),
      ])),
    }));
    
    rerender(<LocationList />);
    
    await waitFor(() => {
      expect(screen.getByText('Costa Rica')).toBeInTheDocument();
    });
  });
});
```

## Troubleshooting

### Issue: "locations.map is not a function"

**Cause**: Hook returns object instead of array

**Solution**: Use `createMockUseLocations()` which returns `data` as an array

```typescript
// ❌ WRONG
jest.mock('@/hooks/useLocations', () => ({
  useLocations: jest.fn(() => ({
    locations: {}, // Object, not array
  })),
}));

// ✅ CORRECT
import { createMockUseLocations } from '@/__tests__/helpers/componentMocks';

jest.mock('@/hooks/useLocations', () => ({
  useLocations: jest.fn(() => createMockUseLocations()),
}));
```

### Issue: "Cannot read property 'refetch' of undefined"

**Cause**: Missing function mocks

**Solution**: Use complete mock structure from `componentMocks.ts`

```typescript
// ❌ WRONG
jest.mock('@/hooks/useLocations', () => ({
  useLocations: jest.fn(() => ({
    data: [],
    loading: false,
    // Missing refetch, create, update, remove, validateParent
  })),
}));

// ✅ CORRECT
import { createMockUseLocations } from '@/__tests__/helpers/componentMocks';

jest.mock('@/hooks/useLocations', () => ({
  useLocations: jest.fn(() => createMockUseLocations()),
}));
```

### Issue: "Expected mock function to have been called"

**Cause**: Mock function not properly configured

**Solution**: Use custom mock implementation

```typescript
const mockCreate = jest.fn().mockResolvedValue({ success: true });

jest.mock('@/hooks/useLocations', () => ({
  useLocations: jest.fn(() => createMockUseLocations([], { 
    create: mockCreate 
  })),
}));

// Now you can assert on mockCreate
expect(mockCreate).toHaveBeenCalledWith({ name: 'New Location' });
```

## Best Practices

### 1. Always Use Factory Functions

```typescript
// ✅ GOOD: Use factory functions
const location = createMockLocation({ name: 'Costa Rica' });

// ❌ BAD: Manual object creation
const location = {
  id: 'loc-1',
  name: 'Costa Rica',
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
  // Easy to miss required fields
};
```

### 2. Keep Test Data Minimal

```typescript
// ✅ GOOD: Only override what you need
const location = createMockLocation({ name: 'Costa Rica' });

// ❌ BAD: Overriding everything
const location = createMockLocation({
  id: 'loc-1',
  name: 'Costa Rica',
  address: '123 St',
  description: 'A place',
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
});
```

### 3. Use Descriptive Test Data

```typescript
// ✅ GOOD: Clear, descriptive names
const locations = [
  createMockLocation({ id: 'country-1', name: 'Costa Rica' }),
  createMockLocation({ id: 'city-1', name: 'San Jose', parentLocationId: 'country-1' }),
];

// ❌ BAD: Generic names
const locations = [
  createMockLocation({ id: '1', name: 'Location 1' }),
  createMockLocation({ id: '2', name: 'Location 2' }),
];
```

### 4. Test All States

```typescript
describe('MyComponent', () => {
  it('should handle loading state', () => {
    // Test with createLoadingMock
  });
  
  it('should handle error state', () => {
    // Test with createErrorMock
  });
  
  it('should handle empty state', () => {
    // Test with createMockUseLocations([])
  });
  
  it('should handle data state', () => {
    // Test with createMockUseLocations([...data])
  });
});
```

## Reference

### All Available Functions

- `createMockUseLocations(locations?, options?)`
- `createMockUseEvents(events?, options?)`
- `createMockUseSections(sections?, options?)`
- `createMockUseRoomTypes(roomTypes?, options?)`
- `createMockUsePhotos(photos?, options?)`
- `createMockUseContentPages(contentPages?, options?)`
- `createMockLocation(overrides?)`
- `createMockEvent(overrides?)`
- `createMockSection(overrides?)`
- `createMockRoomType(overrides?)`
- `createMockPhoto(overrides?)`
- `createMockContentPage(overrides?)`
- `createLoadingMock(hookType)`
- `createErrorMock(hookType, errorMessage?)`

### Type Definitions

See `componentMocks.ts` for complete type definitions of all interfaces.

## Examples

See `componentMocks.test.ts` for comprehensive examples of all utilities.

## Support

For questions or issues:
1. Check this guide first
2. Review `componentMocks.test.ts` for examples
3. Check `TESTING_IMPROVEMENTS_CONTINUED_EXECUTION_SUMMARY.md` for patterns
4. Ask in team chat

---

**Last Updated**: 2025-01-27  
**Version**: 1.0  
**Author**: Test Fixing Team
