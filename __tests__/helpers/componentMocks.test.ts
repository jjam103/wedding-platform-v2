/**
 * Tests for Component Mock Utilities
 * 
 * Validates that all mock utilities return correct structures
 * and can be used consistently across component tests.
 */

import {
  createMockUseLocations,
  createMockUseEvents,
  createMockUseSections,
  createMockUseRoomTypes,
  createMockUsePhotos,
  createMockUseContentPages,
  createMockLocation,
  createMockEvent,
  createMockSection,
  createMockRoomType,
  createMockPhoto,
  createMockContentPage,
  createLoadingMock,
  createErrorMock,
} from './componentMocks';

describe('Component Mock Utilities', () => {
  describe('createMockUseLocations', () => {
    it('should return default mock structure', () => {
      const mock = createMockUseLocations();
      
      expect(mock).toHaveProperty('data');
      expect(mock).toHaveProperty('loading');
      expect(mock).toHaveProperty('error');
      expect(mock).toHaveProperty('refetch');
      expect(mock).toHaveProperty('create');
      expect(mock).toHaveProperty('update');
      expect(mock).toHaveProperty('remove');
      expect(mock).toHaveProperty('validateParent');
      
      expect(Array.isArray(mock.data)).toBe(true);
      expect(mock.loading).toBe(false);
      expect(mock.error).toBeNull();
      expect(jest.isMockFunction(mock.refetch)).toBe(true);
      expect(jest.isMockFunction(mock.create)).toBe(true);
      expect(jest.isMockFunction(mock.update)).toBe(true);
      expect(jest.isMockFunction(mock.remove)).toBe(true);
      expect(jest.isMockFunction(mock.validateParent)).toBe(true);
    });

    it('should accept custom locations array', () => {
      const locations = [
        createMockLocation({ id: '1', name: 'Location 1' }),
        createMockLocation({ id: '2', name: 'Location 2' }),
      ];
      
      const mock = createMockUseLocations(locations);
      
      expect(mock.data).toHaveLength(2);
      expect(mock.data[0].name).toBe('Location 1');
      expect(mock.data[1].name).toBe('Location 2');
    });

    it('should accept custom options', () => {
      const mock = createMockUseLocations([], {
        loading: true,
        error: new Error('Test error'),
      });
      
      expect(mock.loading).toBe(true);
      expect(mock.error).toBeInstanceOf(Error);
      expect(mock.error?.message).toBe('Test error');
    });
  });

  describe('createMockUseEvents', () => {
    it('should return default mock structure', () => {
      const mock = createMockUseEvents();
      
      expect(mock).toHaveProperty('data');
      expect(mock).toHaveProperty('loading');
      expect(mock).toHaveProperty('error');
      expect(mock).toHaveProperty('refetch');
      expect(mock).toHaveProperty('create');
      expect(mock).toHaveProperty('update');
      expect(mock).toHaveProperty('remove');
      
      expect(Array.isArray(mock.data)).toBe(true);
      expect(mock.loading).toBe(false);
      expect(mock.error).toBeNull();
    });

    it('should accept custom events array', () => {
      const events = [
        createMockEvent({ id: '1', name: 'Event 1' }),
        createMockEvent({ id: '2', name: 'Event 2' }),
      ];
      
      const mock = createMockUseEvents(events);
      
      expect(mock.data).toHaveLength(2);
      expect(mock.data[0].name).toBe('Event 1');
      expect(mock.data[1].name).toBe('Event 2');
    });
  });

  describe('createMockUseSections', () => {
    it('should return default mock structure', () => {
      const mock = createMockUseSections();
      
      expect(mock).toHaveProperty('data');
      expect(mock).toHaveProperty('loading');
      expect(mock).toHaveProperty('error');
      expect(mock).toHaveProperty('refetch');
      expect(mock).toHaveProperty('create');
      expect(mock).toHaveProperty('update');
      expect(mock).toHaveProperty('remove');
      expect(mock).toHaveProperty('reorder');
      
      expect(Array.isArray(mock.data)).toBe(true);
      expect(jest.isMockFunction(mock.reorder)).toBe(true);
    });

    it('should accept custom sections array', () => {
      const sections = [
        createMockSection({ id: '1', pageType: 'activity' }),
        createMockSection({ id: '2', pageType: 'event' }),
      ];
      
      const mock = createMockUseSections(sections);
      
      expect(mock.data).toHaveLength(2);
      expect(mock.data[0].pageType).toBe('activity');
      expect(mock.data[1].pageType).toBe('event');
    });
  });

  describe('createMockUseRoomTypes', () => {
    it('should return default mock structure', () => {
      const mock = createMockUseRoomTypes();
      
      expect(mock).toHaveProperty('data');
      expect(mock).toHaveProperty('loading');
      expect(mock).toHaveProperty('error');
      expect(mock).toHaveProperty('refetch');
      expect(mock).toHaveProperty('create');
      expect(mock).toHaveProperty('update');
      expect(mock).toHaveProperty('remove');
      
      expect(Array.isArray(mock.data)).toBe(true);
    });

    it('should accept custom room types array', () => {
      const roomTypes = [
        createMockRoomType({ id: '1', name: 'Suite' }),
        createMockRoomType({ id: '2', name: 'Deluxe' }),
      ];
      
      const mock = createMockUseRoomTypes(roomTypes);
      
      expect(mock.data).toHaveLength(2);
      expect(mock.data[0].name).toBe('Suite');
      expect(mock.data[1].name).toBe('Deluxe');
    });
  });

  describe('createMockUsePhotos', () => {
    it('should return default mock structure', () => {
      const mock = createMockUsePhotos();
      
      expect(mock).toHaveProperty('data');
      expect(mock).toHaveProperty('loading');
      expect(mock).toHaveProperty('error');
      expect(mock).toHaveProperty('refetch');
      expect(mock).toHaveProperty('create');
      expect(mock).toHaveProperty('update');
      expect(mock).toHaveProperty('remove');
      expect(mock).toHaveProperty('approve');
      expect(mock).toHaveProperty('reject');
      
      expect(Array.isArray(mock.data)).toBe(true);
      expect(jest.isMockFunction(mock.approve)).toBe(true);
      expect(jest.isMockFunction(mock.reject)).toBe(true);
    });

    it('should accept custom photos array', () => {
      const photos = [
        createMockPhoto({ id: '1', caption: 'Photo 1' }),
        createMockPhoto({ id: '2', caption: 'Photo 2' }),
      ];
      
      const mock = createMockUsePhotos(photos);
      
      expect(mock.data).toHaveLength(2);
      expect(mock.data[0].caption).toBe('Photo 1');
      expect(mock.data[1].caption).toBe('Photo 2');
    });
  });

  describe('createMockUseContentPages', () => {
    it('should return default mock structure', () => {
      const mock = createMockUseContentPages();
      
      expect(mock).toHaveProperty('data');
      expect(mock).toHaveProperty('loading');
      expect(mock).toHaveProperty('error');
      expect(mock).toHaveProperty('refetch');
      expect(mock).toHaveProperty('create');
      expect(mock).toHaveProperty('update');
      expect(mock).toHaveProperty('remove');
      
      expect(Array.isArray(mock.data)).toBe(true);
    });

    it('should accept custom content pages array', () => {
      const contentPages = [
        createMockContentPage({ id: '1', title: 'Page 1' }),
        createMockContentPage({ id: '2', title: 'Page 2' }),
      ];
      
      const mock = createMockUseContentPages(contentPages);
      
      expect(mock.data).toHaveLength(2);
      expect(mock.data[0].title).toBe('Page 1');
      expect(mock.data[1].title).toBe('Page 2');
    });
  });

  describe('Data Factories', () => {
    describe('createMockLocation', () => {
      it('should create location with default values', () => {
        const location = createMockLocation();
        
        expect(location).toHaveProperty('id');
        expect(location).toHaveProperty('name');
        expect(location).toHaveProperty('createdAt');
        expect(location).toHaveProperty('updatedAt');
        expect(location.name).toBe('Test Location');
      });

      it('should accept overrides', () => {
        const location = createMockLocation({
          id: 'custom-id',
          name: 'Custom Location',
          address: 'Custom Address',
        });
        
        expect(location.id).toBe('custom-id');
        expect(location.name).toBe('Custom Location');
        expect(location.address).toBe('Custom Address');
      });
    });

    describe('createMockEvent', () => {
      it('should create event with default values', () => {
        const event = createMockEvent();
        
        expect(event).toHaveProperty('id');
        expect(event).toHaveProperty('name');
        expect(event).toHaveProperty('startDate');
        expect(event).toHaveProperty('endDate');
        expect(event.name).toBe('Test Event');
      });

      it('should accept overrides', () => {
        const event = createMockEvent({
          id: 'custom-id',
          name: 'Custom Event',
        });
        
        expect(event.id).toBe('custom-id');
        expect(event.name).toBe('Custom Event');
      });
    });

    describe('createMockSection', () => {
      it('should create section with default values', () => {
        const section = createMockSection();
        
        expect(section).toHaveProperty('id');
        expect(section).toHaveProperty('pageType');
        expect(section).toHaveProperty('pageId');
        expect(section).toHaveProperty('layout');
        expect(section).toHaveProperty('columns');
        expect(section.layout).toBe('one-column');
        expect(section.columns).toHaveLength(1);
      });

      it('should accept overrides', () => {
        const section = createMockSection({
          id: 'custom-id',
          layout: 'two-column',
        });
        
        expect(section.id).toBe('custom-id');
        expect(section.layout).toBe('two-column');
      });
    });

    describe('createMockRoomType', () => {
      it('should create room type with default values', () => {
        const roomType = createMockRoomType();
        
        expect(roomType).toHaveProperty('id');
        expect(roomType).toHaveProperty('name');
        expect(roomType).toHaveProperty('capacity');
        expect(roomType).toHaveProperty('pricePerNight');
        expect(roomType.name).toBe('Test Room');
        expect(roomType.capacity).toBe(2);
      });

      it('should accept overrides', () => {
        const roomType = createMockRoomType({
          id: 'custom-id',
          name: 'Custom Room',
          capacity: 4,
        });
        
        expect(roomType.id).toBe('custom-id');
        expect(roomType.name).toBe('Custom Room');
        expect(roomType.capacity).toBe(4);
      });
    });

    describe('createMockPhoto', () => {
      it('should create photo with default values', () => {
        const photo = createMockPhoto();
        
        expect(photo).toHaveProperty('id');
        expect(photo).toHaveProperty('photo_url');
        expect(photo).toHaveProperty('caption');
        expect(photo).toHaveProperty('moderation_status');
        expect(photo.photo_url).toBe('https://example.com/photo.jpg');
        expect(photo.moderation_status).toBe('approved');
      });

      it('should accept overrides', () => {
        const photo = createMockPhoto({
          id: 'custom-id',
          caption: 'Custom Caption',
          moderation_status: 'pending',
        });
        
        expect(photo.id).toBe('custom-id');
        expect(photo.caption).toBe('Custom Caption');
        expect(photo.moderation_status).toBe('pending');
      });
    });

    describe('createMockContentPage', () => {
      it('should create content page with default values', () => {
        const page = createMockContentPage();
        
        expect(page).toHaveProperty('id');
        expect(page).toHaveProperty('title');
        expect(page).toHaveProperty('slug');
        expect(page).toHaveProperty('isPublished');
        expect(page.title).toBe('Test Page');
        expect(page.isPublished).toBe(true);
      });

      it('should accept overrides', () => {
        const page = createMockContentPage({
          id: 'custom-id',
          title: 'Custom Page',
          isPublished: false,
        });
        
        expect(page.id).toBe('custom-id');
        expect(page.title).toBe('Custom Page');
        expect(page.isPublished).toBe(false);
      });
    });
  });

  describe('Common Test Scenarios', () => {
    describe('createLoadingMock', () => {
      it('should create loading mock for locations', () => {
        const mock = createLoadingMock('locations');
        
        expect(mock.loading).toBe(true);
        expect(mock.data).toEqual([]);
        expect(mock.error).toBeNull();
        expect(mock).toHaveProperty('validateParent');
      });

      it('should create loading mock for sections', () => {
        const mock = createLoadingMock('sections');
        
        expect(mock.loading).toBe(true);
        expect(mock).toHaveProperty('reorder');
      });

      it('should create loading mock for photos', () => {
        const mock = createLoadingMock('photos');
        
        expect(mock.loading).toBe(true);
        expect(mock).toHaveProperty('approve');
        expect(mock).toHaveProperty('reject');
      });
    });

    describe('createErrorMock', () => {
      it('should create error mock with default message', () => {
        const mock = createErrorMock('locations');
        
        expect(mock.loading).toBe(false);
        expect(mock.data).toEqual([]);
        expect(mock.error).toBeInstanceOf(Error);
        expect(mock.error?.message).toBe('Test error');
      });

      it('should create error mock with custom message', () => {
        const mock = createErrorMock('events', 'Custom error message');
        
        expect(mock.error).toBeInstanceOf(Error);
        expect(mock.error?.message).toBe('Custom error message');
      });
    });
  });

  describe('Mock Function Behavior', () => {
    it('should have working refetch mock', async () => {
      const mock = createMockUseLocations();
      
      await expect(mock.refetch()).resolves.toBeUndefined();
      expect(mock.refetch).toHaveBeenCalled();
    });

    it('should have working create mock', async () => {
      const locations = [createMockLocation()];
      const mock = createMockUseLocations(locations);
      
      const result = await mock.create({ name: 'New Location' });
      
      expect(result).toEqual({ success: true, data: locations[0] });
      expect(mock.create).toHaveBeenCalledWith({ name: 'New Location' });
    });

    it('should have working update mock', async () => {
      const locations = [createMockLocation()];
      const mock = createMockUseLocations(locations);
      
      const result = await mock.update('loc-1', { name: 'Updated Location' });
      
      expect(result).toEqual({ success: true, data: locations[0] });
      expect(mock.update).toHaveBeenCalledWith('loc-1', { name: 'Updated Location' });
    });

    it('should have working remove mock', async () => {
      const mock = createMockUseLocations();
      
      const result = await mock.remove('loc-1');
      
      expect(result).toEqual({ success: true });
      expect(mock.remove).toHaveBeenCalledWith('loc-1');
    });
  });

  describe('Integration with Jest Mocks', () => {
    it('should work with jest.mock for useLocations', () => {
      const mockLocations = [
        createMockLocation({ id: '1', name: 'Location 1' }),
      ];
      
      const mockImplementation = jest.fn(() => createMockUseLocations(mockLocations));
      
      // Simulate using the mock in a test
      const result = mockImplementation();
      
      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('Location 1');
      expect(mockImplementation).toHaveBeenCalled();
    });

    it('should allow custom mock implementations', () => {
      const customCreate = jest.fn().mockResolvedValue({
        success: false,
        error: 'Custom error',
      });
      
      const mock = createMockUseLocations([], {
        create: customCreate,
      });
      
      expect(mock.create).toBe(customCreate);
    });
  });
});
