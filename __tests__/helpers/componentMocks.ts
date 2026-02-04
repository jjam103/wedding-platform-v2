/**
 * Reusable Mock Utilities for Component Tests
 * 
 * This file provides standardized mock implementations for custom hooks
 * used throughout the application. These mocks ensure consistent behavior
 * across all component tests and reduce duplication.
 * 
 * Usage:
 * ```typescript
 * import { createMockUseLocations } from '@/__tests__/helpers/componentMocks';
 * 
 * jest.mock('@/hooks/useLocations', () => ({
 *   useLocations: jest.fn(() => createMockUseLocations()),
 * }));
 * ```
 * 
 * @see TESTING_IMPROVEMENTS_CONTINUED_EXECUTION_SUMMARY.md for patterns
 */

// ============================================================================
// Type Definitions
// ============================================================================

interface Location {
  id: string;
  name: string;
  address?: string;
  description?: string;
  parentLocationId?: string;
  children?: Location[];
  createdAt: string;
  updatedAt: string;
}

interface RoomType {
  id: string;
  accommodationId: string;
  name: string;
  capacity: number;
  pricePerNight: number;
  description?: string;
  checkInDate: string;
  checkOutDate: string;
  occupancy?: number;
  createdAt: string;
  updatedAt: string;
}

interface Column {
  id: string;
  columnNumber: 1 | 2;
  contentType: 'rich_text' | 'photos' | 'references';
  contentData: any;
}

interface Section {
  id: string;
  pageType: 'activity' | 'event' | 'accommodation' | 'room_type' | 'custom' | 'home';
  pageId: string;
  displayOrder: number;
  layout: 'one-column' | 'two-column';
  columns: Column[];
}

interface ContentPage {
  id: string;
  title: string;
  slug: string;
  description?: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Photo {
  id: string;
  photo_url: string;
  caption?: string;
  alt_text?: string;
  attribution?: string;
  moderation_status: 'pending' | 'approved' | 'rejected';
  page_type?: string;
  page_id?: string;
  display_order?: number;
  createdAt: string;
  updatedAt: string;
}

interface Event {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  locationId?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// useLocations Mock
// ============================================================================

export interface MockUseLocationsReturn {
  data: Location[];
  loading: boolean;
  error: Error | null;
  refetch: jest.Mock;
  create: jest.Mock;
  update: jest.Mock;
  remove: jest.Mock;
  validateParent: jest.Mock;
}

/**
 * Creates a mock implementation of useLocations hook
 * 
 * @param locations - Array of location objects (default: empty array)
 * @param options - Optional overrides for loading, error, and functions
 * @returns Mock useLocations return object
 * 
 * @example
 * ```typescript
 * const mockLocations = [
 *   { id: '1', name: 'Costa Rica', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
 *   { id: '2', name: 'San Jose', parentLocationId: '1', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
 * ];
 * 
 * jest.mock('@/hooks/useLocations', () => ({
 *   useLocations: jest.fn(() => createMockUseLocations(mockLocations)),
 * }));
 * ```
 */
export function createMockUseLocations(
  locations: Location[] = [],
  options: Partial<MockUseLocationsReturn> = {}
): MockUseLocationsReturn {
  return {
    data: locations,
    loading: false,
    error: null,
    refetch: jest.fn().mockResolvedValue(undefined),
    create: jest.fn().mockResolvedValue({ success: true, data: locations[0] }),
    update: jest.fn().mockResolvedValue({ success: true, data: locations[0] }),
    remove: jest.fn().mockResolvedValue({ success: true }),
    validateParent: jest.fn().mockResolvedValue({ success: true }),
    ...options,
  };
}

// ============================================================================
// useEvents Mock
// ============================================================================

export interface MockUseEventsReturn {
  data: Event[];
  loading: boolean;
  error: Error | null;
  refetch: jest.Mock;
  create: jest.Mock;
  update: jest.Mock;
  remove: jest.Mock;
}

/**
 * Creates a mock implementation of useEvents hook
 * 
 * @param events - Array of event objects (default: empty array)
 * @param options - Optional overrides for loading, error, and functions
 * @returns Mock useEvents return object
 * 
 * @example
 * ```typescript
 * const mockEvents = [
 *   { id: '1', name: 'Wedding Ceremony', startDate: '2024-06-01', endDate: '2024-06-01', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
 * ];
 * 
 * jest.mock('@/hooks/useEvents', () => ({
 *   useEvents: jest.fn(() => createMockUseEvents(mockEvents)),
 * }));
 * ```
 */
export function createMockUseEvents(
  events: Event[] = [],
  options: Partial<MockUseEventsReturn> = {}
): MockUseEventsReturn {
  return {
    data: events,
    loading: false,
    error: null,
    refetch: jest.fn().mockResolvedValue(undefined),
    create: jest.fn().mockResolvedValue({ success: true, data: events[0] }),
    update: jest.fn().mockResolvedValue({ success: true, data: events[0] }),
    remove: jest.fn().mockResolvedValue({ success: true }),
    ...options,
  };
}

// ============================================================================
// useSections Mock
// ============================================================================

export interface MockUseSectionsReturn {
  data: Section[];
  loading: boolean;
  error: Error | null;
  refetch: jest.Mock;
  create: jest.Mock;
  update: jest.Mock;
  remove: jest.Mock;
  reorder: jest.Mock;
}

/**
 * Creates a mock implementation of useSections hook
 * 
 * @param sections - Array of section objects (default: empty array)
 * @param options - Optional overrides for loading, error, and functions
 * @returns Mock useSections return object
 * 
 * @example
 * ```typescript
 * const mockSections = [
 *   {
 *     id: '1',
 *     pageType: 'activity',
 *     pageId: 'activity-1',
 *     displayOrder: 0,
 *     layout: 'one-column',
 *     columns: [{ id: 'col-1', columnNumber: 1, contentType: 'rich_text', contentData: { html: '<p>Test</p>' } }],
 *   },
 * ];
 * 
 * jest.mock('@/hooks/useSections', () => ({
 *   useSections: jest.fn(() => createMockUseSections(mockSections)),
 * }));
 * ```
 */
export function createMockUseSections(
  sections: Section[] = [],
  options: Partial<MockUseSectionsReturn> = {}
): MockUseSectionsReturn {
  return {
    data: sections,
    loading: false,
    error: null,
    refetch: jest.fn().mockResolvedValue(undefined),
    create: jest.fn().mockResolvedValue({ success: true, data: sections[0] }),
    update: jest.fn().mockResolvedValue({ success: true, data: sections[0] }),
    remove: jest.fn().mockResolvedValue({ success: true }),
    reorder: jest.fn().mockResolvedValue({ success: true }),
    ...options,
  };
}

// ============================================================================
// useRoomTypes Mock
// ============================================================================

export interface MockUseRoomTypesReturn {
  data: RoomType[];
  loading: boolean;
  error: Error | null;
  refetch: jest.Mock;
  create: jest.Mock;
  update: jest.Mock;
  remove: jest.Mock;
}

/**
 * Creates a mock implementation of useRoomTypes hook
 * 
 * @param roomTypes - Array of room type objects (default: empty array)
 * @param options - Optional overrides for loading, error, and functions
 * @returns Mock useRoomTypes return object
 * 
 * @example
 * ```typescript
 * const mockRoomTypes = [
 *   {
 *     id: '1',
 *     accommodationId: 'acc-1',
 *     name: 'Ocean View Suite',
 *     capacity: 2,
 *     pricePerNight: 150,
 *     checkInDate: '2024-06-01',
 *     checkOutDate: '2024-06-05',
 *     createdAt: '2024-01-01',
 *     updatedAt: '2024-01-01',
 *   },
 * ];
 * 
 * jest.mock('@/hooks/useRoomTypes', () => ({
 *   useRoomTypes: jest.fn(() => createMockUseRoomTypes(mockRoomTypes)),
 * }));
 * ```
 */
export function createMockUseRoomTypes(
  roomTypes: RoomType[] = [],
  options: Partial<MockUseRoomTypesReturn> = {}
): MockUseRoomTypesReturn {
  return {
    data: roomTypes,
    loading: false,
    error: null,
    refetch: jest.fn().mockResolvedValue(undefined),
    create: jest.fn().mockResolvedValue({ success: true, data: roomTypes[0] }),
    update: jest.fn().mockResolvedValue({ success: true, data: roomTypes[0] }),
    remove: jest.fn().mockResolvedValue({ success: true }),
    ...options,
  };
}

// ============================================================================
// usePhotos Mock
// ============================================================================

export interface MockUsePhotosReturn {
  data: Photo[];
  loading: boolean;
  error: Error | null;
  refetch: jest.Mock;
  create: jest.Mock;
  update: jest.Mock;
  remove: jest.Mock;
  approve: jest.Mock;
  reject: jest.Mock;
}

/**
 * Creates a mock implementation of usePhotos hook
 * 
 * @param photos - Array of photo objects (default: empty array)
 * @param options - Optional overrides for loading, error, and functions
 * @returns Mock usePhotos return object
 * 
 * @example
 * ```typescript
 * const mockPhotos = [
 *   {
 *     id: '1',
 *     photo_url: 'https://example.com/photo1.jpg',
 *     caption: 'Beautiful sunset',
 *     moderation_status: 'approved',
 *     createdAt: '2024-01-01',
 *     updatedAt: '2024-01-01',
 *   },
 * ];
 * 
 * jest.mock('@/hooks/usePhotos', () => ({
 *   usePhotos: jest.fn(() => createMockUsePhotos(mockPhotos)),
 * }));
 * ```
 */
export function createMockUsePhotos(
  photos: Photo[] = [],
  options: Partial<MockUsePhotosReturn> = {}
): MockUsePhotosReturn {
  return {
    data: photos,
    loading: false,
    error: null,
    refetch: jest.fn().mockResolvedValue(undefined),
    create: jest.fn().mockResolvedValue({ success: true, data: photos[0] }),
    update: jest.fn().mockResolvedValue({ success: true, data: photos[0] }),
    remove: jest.fn().mockResolvedValue({ success: true }),
    approve: jest.fn().mockResolvedValue({ success: true }),
    reject: jest.fn().mockResolvedValue({ success: true }),
    ...options,
  };
}

// ============================================================================
// useContentPages Mock
// ============================================================================

export interface MockUseContentPagesReturn {
  data: ContentPage[];
  loading: boolean;
  error: Error | null;
  refetch: jest.Mock;
  create: jest.Mock;
  update: jest.Mock;
  remove: jest.Mock;
}

/**
 * Creates a mock implementation of useContentPages hook
 * 
 * @param contentPages - Array of content page objects (default: empty array)
 * @param options - Optional overrides for loading, error, and functions
 * @returns Mock useContentPages return object
 * 
 * @example
 * ```typescript
 * const mockContentPages = [
 *   {
 *     id: '1',
 *     title: 'Our Story',
 *     slug: 'our-story',
 *     isPublished: true,
 *     createdAt: '2024-01-01',
 *     updatedAt: '2024-01-01',
 *   },
 * ];
 * 
 * jest.mock('@/hooks/useContentPages', () => ({
 *   useContentPages: jest.fn(() => createMockUseContentPages(mockContentPages)),
 * }));
 * ```
 */
export function createMockUseContentPages(
  contentPages: ContentPage[] = [],
  options: Partial<MockUseContentPagesReturn> = {}
): MockUseContentPagesReturn {
  return {
    data: contentPages,
    loading: false,
    error: null,
    refetch: jest.fn().mockResolvedValue(undefined),
    create: jest.fn().mockResolvedValue({ success: true, data: contentPages[0] }),
    update: jest.fn().mockResolvedValue({ success: true, data: contentPages[0] }),
    remove: jest.fn().mockResolvedValue({ success: true }),
    ...options,
  };
}

// ============================================================================
// Mock Data Factories
// ============================================================================

/**
 * Creates a mock location object with default values
 * 
 * @param overrides - Optional property overrides
 * @returns Mock location object
 */
export function createMockLocation(overrides: Partial<Location> = {}): Location {
  return {
    id: 'loc-1',
    name: 'Test Location',
    address: '123 Test St',
    description: 'A test location',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Creates a mock event object with default values
 * 
 * @param overrides - Optional property overrides
 * @returns Mock event object
 */
export function createMockEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: 'event-1',
    name: 'Test Event',
    description: 'A test event',
    startDate: '2024-06-01',
    endDate: '2024-06-01',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Creates a mock section object with default values
 * 
 * @param overrides - Optional property overrides
 * @returns Mock section object
 */
export function createMockSection(overrides: Partial<Section> = {}): Section {
  return {
    id: 'section-1',
    pageType: 'activity',
    pageId: 'activity-1',
    displayOrder: 0,
    layout: 'one-column',
    columns: [
      {
        id: 'col-1',
        columnNumber: 1,
        contentType: 'rich_text',
        contentData: { html: '<p>Test content</p>' },
      },
    ],
    ...overrides,
  };
}

/**
 * Creates a mock room type object with default values
 * 
 * @param overrides - Optional property overrides
 * @returns Mock room type object
 */
export function createMockRoomType(overrides: Partial<RoomType> = {}): RoomType {
  return {
    id: 'room-1',
    accommodationId: 'acc-1',
    name: 'Test Room',
    capacity: 2,
    pricePerNight: 100,
    checkInDate: '2024-06-01',
    checkOutDate: '2024-06-05',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Creates a mock photo object with default values
 * 
 * @param overrides - Optional property overrides
 * @returns Mock photo object
 */
export function createMockPhoto(overrides: Partial<Photo> = {}): Photo {
  return {
    id: 'photo-1',
    photo_url: 'https://example.com/photo.jpg',
    caption: 'Test photo',
    alt_text: 'A test photo',
    moderation_status: 'approved',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Creates a mock content page object with default values
 * 
 * @param overrides - Optional property overrides
 * @returns Mock content page object
 */
export function createMockContentPage(overrides: Partial<ContentPage> = {}): ContentPage {
  return {
    id: 'page-1',
    title: 'Test Page',
    slug: 'test-page',
    description: 'A test page',
    isPublished: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

// ============================================================================
// Common Test Scenarios
// ============================================================================

/**
 * Creates a mock hook return with loading state
 * 
 * @param hookType - Type of hook to mock
 * @returns Mock hook return in loading state
 */
export function createLoadingMock(hookType: 'locations' | 'events' | 'sections' | 'roomTypes' | 'photos' | 'contentPages') {
  const baseMock = {
    data: [],
    loading: true,
    error: null,
    refetch: jest.fn().mockResolvedValue(undefined),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  switch (hookType) {
    case 'locations':
      return { ...baseMock, validateParent: jest.fn() };
    case 'sections':
      return { ...baseMock, reorder: jest.fn() };
    case 'photos':
      return { ...baseMock, approve: jest.fn(), reject: jest.fn() };
    default:
      return baseMock;
  }
}

/**
 * Creates a mock hook return with error state
 * 
 * @param hookType - Type of hook to mock
 * @param errorMessage - Error message (default: 'Test error')
 * @returns Mock hook return in error state
 */
export function createErrorMock(
  hookType: 'locations' | 'events' | 'sections' | 'roomTypes' | 'photos' | 'contentPages',
  errorMessage: string = 'Test error'
) {
  const baseMock = {
    data: [],
    loading: false,
    error: new Error(errorMessage),
    refetch: jest.fn().mockResolvedValue(undefined),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  switch (hookType) {
    case 'locations':
      return { ...baseMock, validateParent: jest.fn() };
    case 'sections':
      return { ...baseMock, reorder: jest.fn() };
    case 'photos':
      return { ...baseMock, approve: jest.fn(), reject: jest.fn() };
    default:
      return baseMock;
  }
}

// ============================================================================
// Export All
// ============================================================================

export default {
  // Hook mocks
  createMockUseLocations,
  createMockUseEvents,
  createMockUseSections,
  createMockUseRoomTypes,
  createMockUsePhotos,
  createMockUseContentPages,
  
  // Data factories
  createMockLocation,
  createMockEvent,
  createMockSection,
  createMockRoomType,
  createMockPhoto,
  createMockContentPage,
  
  // Common scenarios
  createLoadingMock,
  createErrorMock,
};
