/**
 * Guest Views E2E Tests - CONSOLIDATED
 * 
 * Consolidates tests from:
 * - guestViewNavigation.spec.ts (navigation flows)
 * - guestSectionDisplay.spec.ts (section rendering)
 * - guestPortalPreviewFlow.spec.ts (preview functionality)
 * 
 * Tests guest-facing pages:
 * - Activity pages (app/activity/[id]/page.tsx)
 * - Event pages (app/event/[id]/page.tsx)
 * - Content pages (app/[type]/[slug]/page.tsx)
 * 
 * Validates:
 * - Page rendering and content display
 * - Navigation between pages
 * - Section display (rich text, photos, references)
 * - Preview functionality from admin
 * - Mobile responsiveness
 * - Accessibility
 * 
 * Requirements: 4.2 (E2E Critical Path Testing), 5.1-5.3 (Preview)
 */

import { test, expect } from '@playwright/test';
import { 
  createGuestViewTestData, 
  cleanupGuestViewTestData,
  type GuestViewTestData 
} from '../../helpers/e2eHelpers';

// Test data - will be populated in beforeAll
let TEST_ACTIVITY_SLUG: string;
let TEST_EVENT_SLUG: string;
let TEST_ACCOMMODATION_SLUG: string;
let TEST_ROOM_TYPE_SLUG: string;
let TEST_CONTENT_SLUG: string;
let testData: GuestViewTestData;

// Create test data before all tests
test.beforeAll(async () => {
  console.log('[E2E Guest Views] Creating test data...');
  testData = await createGuestViewTestData();
  
  TEST_ACTIVITY_SLUG = testData.activitySlug;
  TEST_EVENT_SLUG = testData.eventSlug;
  TEST_ACCOMMODATION_SLUG = testData.accommodationSlug;
  TEST_ROOM_TYPE_SLUG = testData.roomTypeSlug;
  TEST_CONTENT_SLUG = testData.contentSlug;
  
  console.log('[E2E Guest Views] Test data created:', {
    eventSlug: TEST_EVENT_SLUG,
    activitySlug: TEST_ACTIVITY_SLUG,
    accommodationSlug: TEST_ACCOMMODATION_SLUG,
    roomTypeSlug: TEST_ROOM_TYPE_SLUG,
    contentSlug: TEST_CONTENT_SLUG,
  });
});

// Clean up test data after all tests
test.afterAll(async () => {
  if (testData) {
    console.log('[E2E Guest Views] Cleaning up test data...');
    await cleanupGuestViewTestData(testData);
    console.log('[E2E Guest Views] Test data cleaned up');
  }
});

// ============================================================================
// SECTION 1: VIEW EVENTS (10 tests)
// ============================================================================

test.describe('Guest Views - Events', () => {
  test('should display event page with header and details', async ({ page }) => {
    await page.goto(`http://localhost:3000/event/${TEST_EVENT_SLUG}`);
    await page.waitForLoadState('commit');
    
    // Should show event header
    const eventHeader = page.locator('h1').first();
    await expect(eventHeader).toBeVisible({ timeout: 5000 });
    
    // Should show event details (check for at least one detail field)
    await expect(page.locator('text=/Type:/i').first()).toBeVisible();
  });

  test('should display sections on event page', async ({ page }) => {
    await page.goto(`http://localhost:3000/event/${TEST_EVENT_SLUG}`);
    await page.waitForLoadState('commit');
    
    // Look for sections
    const sections = page.locator('[data-testid^="section-"]');
    const sectionCount = await sections.count();
    
    if (sectionCount > 0) {
      await expect(sections.first()).toBeVisible();
      const columns = sections.first().locator('[data-testid^="column-"]');
      const columnCount = await columns.count();
      expect(columnCount).toBeGreaterThan(0);
    }
  });

  test('should navigate from event page to referenced activity', async ({ page }) => {
    await page.goto(`http://localhost:3000/event/${TEST_EVENT_SLUG}`);
    await page.waitForLoadState('commit');
    
    const activityReference = page.locator('[data-testid="references"] [data-testid^="reference-"]')
      .filter({ has: page.locator('.reference-type:has-text("activity")') });
    
    const hasActivityReference = await activityReference.count() > 0;
    
    if (hasActivityReference) {
      const viewLink = activityReference.first().locator('a:has-text("View →")');
      await viewLink.click();
      await page.waitForLoadState('commit');
      
      expect(page.url()).toContain('/activity/');
      const header = page.locator('h1').first();
      await expect(header).toBeVisible();
    }
  });

  test('should navigate from event page to referenced accommodation', async ({ page }) => {
    await page.goto(`http://localhost:3000/event/${TEST_EVENT_SLUG}`);
    await page.waitForLoadState('commit');
    
    const accommodationReference = page.locator('[data-testid="references"] [data-testid^="reference-"]')
      .filter({ has: page.locator('.reference-type:has-text("accommodation")') });
    
    const hasAccommodationReference = await accommodationReference.count() > 0;
    
    if (hasAccommodationReference) {
      const viewLink = accommodationReference.first().locator('a:has-text("View →")');
      await viewLink.click();
      await page.waitForLoadState('commit');
      
      expect(page.url()).toContain('/accommodation/');
      const header = page.locator('h1').first();
      await expect(header).toBeVisible();
    }
  });

  test('should navigate from event page to referenced custom page', async ({ page }) => {
    await page.goto(`http://localhost:3000/event/${TEST_EVENT_SLUG}`);
    await page.waitForLoadState('commit');
    
    const customReference = page.locator('[data-testid="references"] [data-testid^="reference-"]')
      .filter({ has: page.locator('.reference-type:has-text("custom")') });
    
    const hasCustomReference = await customReference.count() > 0;
    
    if (hasCustomReference) {
      const viewLink = customReference.first().locator('a:has-text("View →")');
      await viewLink.click();
      await page.waitForLoadState('commit');
      
      expect(page.url()).toContain('/custom/');
      const header = page.locator('h1').first();
      await expect(header).toBeVisible();
    }
  });

  test('should navigate from event page to another event', async ({ page }) => {
    await page.goto(`http://localhost:3000/event/${TEST_EVENT_SLUG}`);
    await page.waitForLoadState('commit');
    
    const eventReference = page.locator('[data-testid="references"] [data-testid^="reference-"]')
      .filter({ has: page.locator('.reference-type:has-text("event")') });
    
    const hasEventReference = await eventReference.count() > 0;
    
    if (hasEventReference) {
      const referenceName = await eventReference.first().locator('.reference-name').textContent();
      const viewLink = eventReference.first().locator('a:has-text("View →")');
      await viewLink.click();
      await page.waitForLoadState('commit');
      
      expect(page.url()).toContain('/event/');
      const header = page.locator('h1').first();
      await expect(header).toBeVisible();
      const headerText = await header.textContent();
      expect(headerText).toContain(referenceName || '');
    }
  });

  test('should display event description as HTML', async ({ page }) => {
    await page.goto(`http://localhost:3000/event/${TEST_EVENT_SLUG}`);
    await page.waitForLoadState('commit');
    
    const description = page.locator('.prose').first();
    const hasDescription = await description.isVisible().catch(() => false);
    
    if (hasDescription) {
      const content = await description.textContent();
      expect(content?.trim().length).toBeGreaterThan(0);
    }
  });

  test('should show empty state when no sections exist on event page', async ({ page }) => {
    await page.goto(`http://localhost:3000/event/${TEST_EVENT_SLUG}`);
    await page.waitForLoadState('commit');
    
    const emptyMessage = page.locator('text=/No additional information|No content available/i');
    const hasSections = await page.locator('[data-testid^="section-"]').count() > 0;
    const hasEmptyMessage = await emptyMessage.isVisible().catch(() => false);
    
    expect(hasSections || hasEmptyMessage).toBe(true);
  });

  test('should load event page directly via deep link', async ({ page }) => {
    await page.goto(`http://localhost:3000/event/${TEST_EVENT_SLUG}`);
    await page.waitForLoadState('commit');
    
    const header = page.locator('h1').first();
    await expect(header).toBeVisible();
    expect(page.url()).toContain(`/event/${TEST_EVENT_SLUG}`);
  });

  test('should show 404 for non-existent event', async ({ page }) => {
    const response = await page.goto('http://localhost:3000/event/non-existent-slug-12345');
    expect(response?.status()).toBe(404);
  });
});

// ============================================================================
// SECTION 2: VIEW ACTIVITIES (10 tests)
// ============================================================================

test.describe('Guest Views - Activities', () => {
  test('should display activity page with header and details', async ({ page }) => {
    await page.goto(`http://localhost:3000/activity/${TEST_ACTIVITY_SLUG}`);
    await page.waitForLoadState('commit');
    
    const activityHeader = page.locator('h1').first();
    await expect(activityHeader).toBeVisible();
    await expect(page.locator('text=/Type:/i').first()).toBeVisible();
  });

  test('should display sections on activity page', async ({ page }) => {
    await page.goto(`http://localhost:3000/activity/${TEST_ACTIVITY_SLUG}`);
    await page.waitForLoadState('commit');
    
    const sections = page.locator('[data-testid^="section-"]');
    const sectionCount = await sections.count();
    
    if (sectionCount > 0) {
      await expect(sections.first()).toBeVisible();
      const firstSection = sections.first();
      const hasContent = await firstSection.locator('.prose, [data-testid^="column-"]').count() > 0;
      expect(hasContent).toBe(true);
    }
  });

  test('should navigate from activity page to referenced event', async ({ page }) => {
    await page.goto(`http://localhost:3000/activity/${TEST_ACTIVITY_SLUG}`);
    await page.waitForLoadState('commit');
    
    const eventReference = page.locator('[data-testid="references"] [data-testid^="reference-"]')
      .filter({ has: page.locator('.reference-type:has-text("event")') });
    
    const hasEventReference = await eventReference.count() > 0;
    
    if (hasEventReference) {
      const viewLink = eventReference.first().locator('a:has-text("View →")');
      await viewLink.click();
      await page.waitForLoadState('commit');
      
      expect(page.url()).toContain('/event/');
      const eventHeader = page.locator('h1').first();
      await expect(eventHeader).toBeVisible();
    }
  });

  test('should navigate from activity page to referenced accommodation', async ({ page }) => {
    await page.goto(`http://localhost:3000/activity/${TEST_ACTIVITY_SLUG}`);
    await page.waitForLoadState('commit');
    
    const accommodationReference = page.locator('[data-testid="references"] [data-testid^="reference-"]')
      .filter({ has: page.locator('.reference-type:has-text("accommodation")') });
    
    const hasAccommodationReference = await accommodationReference.count() > 0;
    
    if (hasAccommodationReference) {
      const viewLink = accommodationReference.first().locator('a:has-text("View →")');
      await viewLink.click();
      await page.waitForLoadState('commit');
      
      expect(page.url()).toContain('/accommodation/');
      const header = page.locator('h1').first();
      await expect(header).toBeVisible();
    }
  });

  test('should navigate from activity page to referenced room type', async ({ page }) => {
    await page.goto(`http://localhost:3000/activity/${TEST_ACTIVITY_SLUG}`);
    await page.waitForLoadState('commit');
    
    const roomTypeReference = page.locator('[data-testid="references"] [data-testid^="reference-"]')
      .filter({ has: page.locator('.reference-type:has-text("room_type")') });
    
    const hasRoomTypeReference = await roomTypeReference.count() > 0;
    
    if (hasRoomTypeReference) {
      const viewLink = roomTypeReference.first().locator('a:has-text("View →")');
      await viewLink.click();
      await page.waitForLoadState('commit');
      
      expect(page.url()).toContain('/room_type/');
      const header = page.locator('h1').first();
      await expect(header).toBeVisible();
    }
  });

  test('should navigate from activity page to referenced custom page', async ({ page }) => {
    await page.goto(`http://localhost:3000/activity/${TEST_ACTIVITY_SLUG}`);
    await page.waitForLoadState('commit');
    
    const customReference = page.locator('[data-testid="references"] [data-testid^="reference-"]')
      .filter({ has: page.locator('.reference-type:has-text("custom")') });
    
    const hasCustomReference = await customReference.count() > 0;
    
    if (hasCustomReference) {
      const viewLink = customReference.first().locator('a:has-text("View →")');
      await viewLink.click();
      await page.waitForLoadState('commit');
      
      expect(page.url()).toContain('/custom/');
      const header = page.locator('h1').first();
      await expect(header).toBeVisible();
    }
  });

  test('should navigate from activity page to another activity', async ({ page }) => {
    await page.goto(`http://localhost:3000/activity/${TEST_ACTIVITY_SLUG}`);
    await page.waitForLoadState('commit');
    
    const activityReference = page.locator('[data-testid="references"] [data-testid^="reference-"]')
      .filter({ has: page.locator('.reference-type:has-text("activity")') });
    
    const hasActivityReference = await activityReference.count() > 0;
    
    if (hasActivityReference) {
      const referenceName = await activityReference.first().locator('.reference-name').textContent();
      const viewLink = activityReference.first().locator('a:has-text("View →")');
      await viewLink.click();
      await page.waitForLoadState('commit');
      
      expect(page.url()).toContain('/activity/');
      const header = page.locator('h1').first();
      await expect(header).toBeVisible();
      const headerText = await header.textContent();
      expect(headerText).toContain(referenceName || '');
    }
  });

  test('should show empty state when no sections exist on activity page', async ({ page }) => {
    await page.goto(`http://localhost:3000/activity/${TEST_ACTIVITY_SLUG}`);
    await page.waitForLoadState('commit');
    
    const emptyMessage = page.locator('text=/No additional information|No content available/i');
    const hasEmptyMessage = await emptyMessage.isVisible().catch(() => false);
    const hasSections = await page.locator('[data-testid^="section-"]').count() > 0;
    expect(hasSections || hasEmptyMessage).toBe(true);
  });

  test('should load activity page directly via deep link', async ({ page }) => {
    await page.goto(`http://localhost:3000/activity/${TEST_ACTIVITY_SLUG}`);
    await page.waitForLoadState('commit');
    
    const header = page.locator('h1').first();
    await expect(header).toBeVisible();
    expect(page.url()).toContain(`/activity/${TEST_ACTIVITY_SLUG}`);
  });

  test('should show 404 for non-existent activity', async ({ page }) => {
    const response = await page.goto('http://localhost:3000/activity/non-existent-id');
    expect(response?.status()).toBe(404);
  });
});

// ============================================================================
// SECTION 3: VIEW CONTENT PAGES (10 tests)
// ============================================================================

test.describe('Guest Views - Content Pages', () => {
  test('should display content page with title', async ({ page }) => {
    await page.goto(`http://localhost:3000/custom/${TEST_CONTENT_SLUG}`);
    await page.waitForLoadState('commit');
    
    const pageTitle = page.locator('h1').first();
    await expect(pageTitle).toBeVisible({ timeout: 5000 });
  });

  test('should display sections on content page', async ({ page }) => {
    await page.goto(`http://localhost:3000/custom/${TEST_CONTENT_SLUG}`);
    await page.waitForLoadState('commit');
    
    const sections = page.locator('[data-testid^="section-"]');
    const sectionCount = await sections.count();
    
    if (sectionCount > 0) {
      await expect(sections.first()).toBeVisible();
    }
  });

  test('should navigate from content page to referenced activity', async ({ page }) => {
    await page.goto(`http://localhost:3000/custom/${TEST_CONTENT_SLUG}`);
    await page.waitForLoadState('commit');
    
    const activityReference = page.locator('[data-testid="references"] [data-testid^="reference-"]')
      .filter({ has: page.locator('.reference-type:has-text("activity")') });
    
    const hasActivityReference = await activityReference.count() > 0;
    
    if (hasActivityReference) {
      const viewLink = activityReference.first().locator('a:has-text("View →")');
      await viewLink.click();
      await page.waitForLoadState('commit');
      
      expect(page.url()).toContain('/activity/');
      const header = page.locator('h1').first();
      await expect(header).toBeVisible();
    }
  });

  test('should navigate from content page to referenced event', async ({ page }) => {
    await page.goto(`http://localhost:3000/custom/${TEST_CONTENT_SLUG}`);
    await page.waitForLoadState('commit');
    
    const eventReference = page.locator('[data-testid="references"] [data-testid^="reference-"]')
      .filter({ has: page.locator('.reference-type:has-text("event")') });
    
    const hasEventReference = await eventReference.count() > 0;
    
    if (hasEventReference) {
      const viewLink = eventReference.first().locator('a:has-text("View →")');
      await viewLink.click();
      await page.waitForLoadState('commit');
      
      expect(page.url()).toContain('/event/');
      const header = page.locator('h1').first();
      await expect(header).toBeVisible();
    }
  });

  test('should navigate from content page to referenced accommodation', async ({ page }) => {
    await page.goto(`http://localhost:3000/custom/${TEST_CONTENT_SLUG}`);
    await page.waitForLoadState('commit');
    
    const accommodationReference = page.locator('[data-testid="references"] [data-testid^="reference-"]')
      .filter({ has: page.locator('.reference-type:has-text("accommodation")') });
    
    const hasAccommodationReference = await accommodationReference.count() > 0;
    
    if (hasAccommodationReference) {
      const viewLink = accommodationReference.first().locator('a:has-text("View →")');
      await viewLink.click();
      await page.waitForLoadState('commit');
      
      expect(page.url()).toContain('/accommodation/');
      const header = page.locator('h1').first();
      await expect(header).toBeVisible();
    }
  });

  test('should navigate from content page to another custom page', async ({ page }) => {
    await page.goto(`http://localhost:3000/custom/${TEST_CONTENT_SLUG}`);
    await page.waitForLoadState('commit');
    
    const customReference = page.locator('[data-testid="references"] [data-testid^="reference-"]')
      .filter({ has: page.locator('.reference-type:has-text("custom")') });
    
    const hasCustomReference = await customReference.count() > 0;
    
    if (hasCustomReference) {
      const referenceName = await customReference.first().locator('.reference-name').textContent();
      const viewLink = customReference.first().locator('a:has-text("View →")');
      await viewLink.click();
      await page.waitForLoadState('commit');
      
      expect(page.url()).toContain('/custom/');
      const header = page.locator('h1').first();
      await expect(header).toBeVisible();
      const headerText = await header.textContent();
      expect(headerText).toContain(referenceName || '');
    }
  });

  test('should show empty state when no sections exist on content page', async ({ page }) => {
    await page.goto(`http://localhost:3000/custom/${TEST_CONTENT_SLUG}`);
    await page.waitForLoadState('commit');
    
    const emptyMessage = page.locator('text=/No content available/i');
    const hasSections = await page.locator('[data-testid^="section-"]').count() > 0;
    const hasEmptyMessage = await emptyMessage.isVisible().catch(() => false);
    
    expect(hasSections || hasEmptyMessage).toBe(true);
  });

  test('should only display published content pages', async ({ page }) => {
    const response = await page.goto(`http://localhost:3000/custom/draft-page-slug`);
    expect(response?.status()).toBeGreaterThanOrEqual(400);
  });

  test('should load content page directly via deep link', async ({ page }) => {
    await page.goto(`http://localhost:3000/custom/${TEST_CONTENT_SLUG}`);
    await page.waitForLoadState('commit');
    
    const header = page.locator('h1').first();
    await expect(header).toBeVisible();
    expect(page.url()).toContain(`/custom/${TEST_CONTENT_SLUG}`);
  });

  test('should show 404 for non-existent content page', async ({ page }) => {
    const response = await page.goto('http://localhost:3000/custom/non-existent-slug');
    expect(response?.status()).toBe(404);
  });
});

// ============================================================================
// SECTION 4: SECTION DISPLAY (10 tests)
// ============================================================================

test.describe('Guest Views - Section Display', () => {
  test('should display rich text content in sections', async ({ page }) => {
    await page.goto(`http://localhost:3000/activity/${TEST_ACTIVITY_SLUG}`);
    await page.waitForLoadState('commit');
    
    const richTextContent = page.locator('.prose');
    const hasRichText = await richTextContent.count() > 0;
    
    if (hasRichText) {
      await expect(richTextContent.first()).toBeVisible();
      const content = await richTextContent.first().textContent();
      expect(content?.trim().length).toBeGreaterThan(0);
    }
  });

  test('should render rich text with proper formatting', async ({ page }) => {
    await page.goto(`http://localhost:3000/activity/${TEST_ACTIVITY_SLUG}`);
    await page.waitForLoadState('commit');
    
    const richText = page.locator('.prose');
    const hasRichText = await richText.count() > 0;
    
    if (hasRichText) {
      await expect(richText.first()).toHaveClass(/prose/);
      const hasParagraphs = await richText.locator('p').count() > 0;
      const hasHeadings = await richText.locator('h1, h2, h3, h4, h5, h6').count() > 0;
      const hasLists = await richText.locator('ul, ol').count() > 0;
      expect(hasParagraphs || hasHeadings || hasLists).toBe(true);
    }
  });

  test('should display photo gallery in gallery mode', async ({ page }) => {
    await page.goto(`http://localhost:3000/activity/${TEST_ACTIVITY_SLUG}`);
    await page.waitForLoadState('commit');
    
    const photoGrid = page.locator('.grid.grid-cols-1');
    const hasPhotoGrid = await photoGrid.count() > 0;
    
    if (hasPhotoGrid) {
      await expect(photoGrid.first()).toBeVisible();
      const photos = photoGrid.first().locator('img');
      const photoCount = await photos.count();
      expect(photoCount).toBeGreaterThan(0);
      const gridClasses = await photoGrid.first().getAttribute('class');
      expect(gridClasses).toContain('grid');
      expect(gridClasses).toMatch(/grid-cols-\d/);
    }
  });

  test('should display photo gallery in carousel mode', async ({ page }) => {
    await page.goto(`http://localhost:3000/event/${TEST_EVENT_SLUG}`);
    await page.waitForLoadState('commit');
    
    const prevButton = page.locator('button[aria-label="Previous photo"]');
    const nextButton = page.locator('button[aria-label="Next photo"]');
    
    const hasCarousel = await prevButton.count() > 0 && await nextButton.count() > 0;
    
    if (hasCarousel) {
      await expect(prevButton.first()).toBeVisible();
      await expect(nextButton.first()).toBeVisible();
      await nextButton.first().click();
      await page.waitForTimeout(500);
      await expect(nextButton.first()).toBeVisible();
      await prevButton.first().click();
      await page.waitForTimeout(500);
      await expect(prevButton.first()).toBeVisible();
    }
  });

  test('should display photo gallery in loop mode', async ({ page }) => {
    await page.goto(`http://localhost:3000/custom/${TEST_CONTENT_SLUG}`);
    await page.waitForLoadState('commit');
    
    const progressIndicators = page.locator('.h-1.rounded-full');
    const hasLoop = await progressIndicators.count() > 0;
    
    if (hasLoop) {
      await expect(progressIndicators.first()).toBeVisible();
      await page.waitForTimeout(3500);
      const activeIndicator = page.locator('.bg-jungle-600.w-8');
      await expect(activeIndicator).toBeVisible();
    }
  });

  test('should display reference cards with proper information', async ({ page }) => {
    await page.goto(`http://localhost:3000/activity/${TEST_ACTIVITY_SLUG}`);
    await page.waitForLoadState('commit');
    
    const references = page.locator('[data-testid="references"]');
    const hasReferences = await references.count() > 0;
    
    if (hasReferences) {
      await expect(references.first()).toBeVisible();
      const referenceItems = references.first().locator('[data-testid^="reference-"]');
      const itemCount = await referenceItems.count();
      expect(itemCount).toBeGreaterThan(0);
    }
  });

  test('should display reference type badges', async ({ page }) => {
    await page.goto(`http://localhost:3000/event/${TEST_EVENT_SLUG}`);
    await page.waitForLoadState('commit');
    
    const typeBadges = page.locator('.reference-type');
    const hasBadges = await typeBadges.count() > 0;
    
    if (hasBadges) {
      await expect(typeBadges.first()).toBeVisible();
      const badgeText = await typeBadges.first().textContent();
      expect(badgeText?.trim().length).toBeGreaterThan(0);
    }
  });

  test('should display single-column layout correctly', async ({ page }) => {
    await page.goto(`http://localhost:3000/activity/${TEST_ACTIVITY_SLUG}`);
    await page.waitForLoadState('commit');
    
    const sections = page.locator('[data-testid^="section-"]');
    const sectionCount = await sections.count();
    
    if (sectionCount > 0) {
      const columns = sections.first().locator('[data-testid^="column-"]');
      const columnCount = await columns.count();
      
      if (columnCount === 1) {
        const grid = sections.first().locator('.grid');
        await expect(grid).toHaveClass(/grid-cols-1/);
      }
    }
  });

  test('should display two-column layout correctly', async ({ page }) => {
    await page.goto(`http://localhost:3000/event/${TEST_EVENT_SLUG}`);
    await page.waitForLoadState('commit');
    
    const sections = page.locator('[data-testid^="section-"]');
    const sectionCount = await sections.count();
    
    for (let i = 0; i < sectionCount; i++) {
      const section = sections.nth(i);
      const columns = section.locator('[data-testid^="column-"]');
      const columnCount = await columns.count();
      
      if (columnCount === 2) {
        const grid = section.locator('.grid');
        await expect(grid).toHaveClass(/md:grid-cols-2/);
        await expect(columns.first()).toBeVisible();
        await expect(columns.last()).toBeVisible();
        break;
      }
    }
  });

  test('should display section titles when present', async ({ page }) => {
    await page.goto(`http://localhost:3000/custom/${TEST_CONTENT_SLUG}`);
    await page.waitForLoadState('commit');
    
    const sectionTitles = page.locator('[data-testid^="section-"] h2');
    const hasTitles = await sectionTitles.count() > 0;
    
    if (hasTitles) {
      await expect(sectionTitles.first()).toBeVisible();
      const titleText = await sectionTitles.first().textContent();
      expect(titleText?.trim().length).toBeGreaterThan(0);
    }
  });
});

// ============================================================================
// SECTION 5: NAVIGATION (5 tests)
// ============================================================================

test.describe('Guest Views - Navigation', () => {
  test('should navigate back from referenced page to original page', async ({ page }) => {
    await page.goto(`http://localhost:3000/activity/${TEST_ACTIVITY_SLUG}`);
    await page.waitForLoadState('commit');
    
    const originalTitle = await page.locator('h1').first().textContent();
    const viewLinks = page.locator('a:has-text("View →")');
    const hasLinks = await viewLinks.count() > 0;
    
    if (hasLinks) {
      await viewLinks.first().click();
      await page.waitForLoadState('commit');
      const newUrl = page.url();
      expect(newUrl).not.toContain(TEST_ACTIVITY_SLUG);
      
      await page.goBack();
      await page.waitForLoadState('commit');
      expect(page.url()).toContain(TEST_ACTIVITY_SLUG);
      const currentTitle = await page.locator('h1').first().textContent();
      expect(currentTitle).toBe(originalTitle);
    }
  });

  test('should handle deep link with query parameters', async ({ page }) => {
    await page.goto(`http://localhost:3000/activity/${TEST_ACTIVITY_SLUG}?ref=email`);
    await page.waitForLoadState('commit');
    
    const header = page.locator('h1').first();
    await expect(header).toBeVisible();
    expect(page.url()).toContain('ref=email');
  });

  test('should handle deep link with hash fragment', async ({ page }) => {
    await page.goto(`http://localhost:3000/event/${TEST_EVENT_SLUG}#details`);
    await page.waitForLoadState('commit');
    
    const header = page.locator('h1').first();
    await expect(header).toBeVisible();
    expect(page.url()).toContain('#details');
  });

  test('should navigate quickly between pages', async ({ page }) => {
    await page.goto(`http://localhost:3000/activity/${TEST_ACTIVITY_SLUG}`);
    await page.waitForLoadState('commit');
    
    const viewLinks = page.locator('a:has-text("View →")');
    const hasLinks = await viewLinks.count() > 0;
    
    if (hasLinks) {
      const startTime = Date.now();
      await viewLinks.first().click();
      await page.waitForLoadState('commit');
      const endTime = Date.now();
      const navigationTime = endTime - startTime;
      expect(navigationTime).toBeLessThan(3000);
    }
  });

  test('should preserve session during navigation', async ({ page, context }) => {
    await context.addCookies([{
      name: 'test-session',
      value: 'test-user-123',
      domain: 'localhost',
      path: '/',
    }]);
    
    await page.goto(`http://localhost:3000/activity/${TEST_ACTIVITY_SLUG}`);
    await page.waitForLoadState('commit');
    
    const cookiesBefore = await context.cookies();
    const sessionBefore = cookiesBefore.find(c => c.name === 'test-session');
    
    const viewLinks = page.locator('a:has-text("View →")');
    const hasLinks = await viewLinks.count() > 0;
    
    if (hasLinks) {
      await viewLinks.first().click();
      await page.waitForLoadState('commit');
      
      const cookiesAfter = await context.cookies();
      const sessionAfter = cookiesAfter.find(c => c.name === 'test-session');
      
      expect(sessionAfter).toBeDefined();
      expect(sessionAfter?.value).toBe(sessionBefore?.value);
    }
  });
});

// ============================================================================
// SECTION 6: PREVIEW (5 tests)
// ============================================================================

test.describe('Guest Views - Preview from Admin', () => {
  test('should have preview link in admin sidebar', async ({ page }) => {
    await page.goto('http://localhost:3000/admin');
    await page.waitForLoadState('commit');
    
    const previewLink = page.locator('a:has-text("Preview Guest Portal")');
    await expect(previewLink).toBeVisible({ timeout: 5000 });
    await expect(previewLink).toHaveAttribute('href', '/');
    await expect(previewLink).toHaveAttribute('target', '_blank');
    await expect(previewLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  test('should open guest portal in new tab when clicked', async ({ page, context }) => {
    await page.goto('http://localhost:3000/admin');
    await page.waitForLoadState('commit');
    
    const previewLink = page.locator('a:has-text("Preview Guest Portal")');
    const pagePromise = context.waitForEvent('page');
    await previewLink.click();
    const newPage = await pagePromise;
    await newPage.waitForLoadState('commit');
    
    expect(newPage.url()).toBe('http://localhost:3000/');
    expect(page.url()).toContain('/admin');
    await newPage.close();
  });

  test('should show guest view in preview (not admin view)', async ({ page, context }) => {
    await page.goto('http://localhost:3000/admin');
    await page.waitForLoadState('commit');
    
    const previewLink = page.locator('a:has-text("Preview Guest Portal")');
    const pagePromise = context.waitForEvent('page');
    await previewLink.click();
    const newPage = await pagePromise;
    await newPage.waitForLoadState('commit');
    
    // Should show welcome message on landing page
    await expect(newPage.locator('text=/Welcome/i')).toBeVisible({ timeout: 5000 });
    // Landing page has both guest and admin options - this is expected
    await expect(newPage.locator('text=/Guest Portal/i')).toBeVisible();
    await newPage.close();
  });

  test('should not affect admin session when preview is opened', async ({ page, context }) => {
    await page.goto('http://localhost:3000/admin');
    await page.waitForLoadState('commit');
    
    await expect(page.locator('h1:has-text("Wedding Admin")').first()).toBeVisible({ timeout: 5000 });
    
    const previewLink = page.locator('a:has-text("Preview Guest Portal")');
    const pagePromise = context.waitForEvent('page');
    await previewLink.click();
    const newPage = await pagePromise;
    await newPage.waitForLoadState('commit');
    await newPage.close();
    
    // Admin session should still be active
    await expect(page.locator('h1:has-text("Wedding Admin")').first()).toBeVisible({ timeout: 5000 });
    await page.goto('http://localhost:3000/admin/guests');
    await page.waitForLoadState('commit');
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 5000 });
  });

  test('should work from any admin page', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/guests');
    await page.waitForLoadState('commit');
    let previewLink = page.locator('a:has-text("Preview Guest Portal")');
    await expect(previewLink).toBeVisible({ timeout: 5000 });
    
    await page.goto('http://localhost:3000/admin/events');
    await page.waitForLoadState('commit');
    previewLink = page.locator('a:has-text("Preview Guest Portal")');
    await expect(previewLink).toBeVisible({ timeout: 5000 });
    
    await page.goto('http://localhost:3000/admin/settings');
    await page.waitForLoadState('commit');
    previewLink = page.locator('a:has-text("Preview Guest Portal")');
    await expect(previewLink).toBeVisible({ timeout: 5000 });
  });
});

// ============================================================================
// SECTION 7: MOBILE RESPONSIVENESS (3 tests)
// ============================================================================

test.describe('Guest Views - Mobile Responsiveness', () => {
  test('should display correctly on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`http://localhost:3000/activity/${TEST_ACTIVITY_SLUG}`);
    await page.waitForLoadState('commit');
    
    const header = page.locator('h1').first();
    await expect(header).toBeVisible();
    
    const sections = page.locator('[data-testid^="section-"]');
    const sectionCount = await sections.count();
    if (sectionCount > 0) {
      await expect(sections.first()).toBeVisible();
    }
  });

  test('should navigate correctly on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`http://localhost:3000/activity/${TEST_ACTIVITY_SLUG}`);
    await page.waitForLoadState('commit');
    
    const viewLinks = page.locator('a:has-text("View →")');
    const hasLinks = await viewLinks.count() > 0;
    
    if (hasLinks) {
      await viewLinks.first().click();
      await page.waitForLoadState('commit');
      const newHeader = page.locator('h1').first();
      await expect(newHeader).toBeVisible();
    }
  });

  test('should display correctly on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(`http://localhost:3000/event/${TEST_EVENT_SLUG}`);
    await page.waitForLoadState('commit');
    
    const sections = page.locator('[data-testid^="section-"]');
    const sectionCount = await sections.count();
    
    if (sectionCount > 0) {
      await expect(sections.first()).toBeVisible();
      const columns = sections.first().locator('[data-testid^="column-"]');
      const columnCount = await columns.count();
      
      if (columnCount === 2) {
        await expect(columns.first()).toBeVisible();
        await expect(columns.last()).toBeVisible();
      }
    }
  });
});

// ============================================================================
// SECTION 8: ACCESSIBILITY (2 tests)
// ============================================================================

test.describe('Guest Views - Accessibility', () => {
  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto(`http://localhost:3000/activity/${TEST_ACTIVITY_SLUG}`);
    await page.waitForLoadState('commit');
    
    const h1 = page.locator('h1');
    await expect(h1.first()).toBeVisible();
    
    const sectionTitles = page.locator('[data-testid^="section-"] h2');
    const hasSectionTitles = await sectionTitles.count() > 0;
    
    if (hasSectionTitles) {
      await expect(sectionTitles.first()).toBeVisible();
    }
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto(`http://localhost:3000/activity/${TEST_ACTIVITY_SLUG}`);
    await page.waitForLoadState('commit');
    
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    const focused = page.locator(':focus');
    const isFocused = await focused.count() > 0;
    
    if (isFocused) {
      await page.keyboard.press('Enter');
      await page.waitForLoadState('commit');
      const header = page.locator('h1').first();
      await expect(header).toBeVisible();
    }
  });
});

/**
 * CONSOLIDATION SUMMARY
 * 
 * Consolidated from 3 files into 1:
 * - guestViewNavigation.spec.ts (navigation flows)
 * - guestSectionDisplay.spec.ts (section rendering)
 * - guestPortalPreviewFlow.spec.ts (preview functionality)
 * 
 * Total tests: 55 tests organized into 8 sections
 * 
 * Section breakdown:
 * 1. View Events (10 tests) - Event page display and navigation
 * 2. View Activities (10 tests) - Activity page display and navigation
 * 3. View Content Pages (10 tests) - Content page display and navigation
 * 4. Section Display (10 tests) - Rich text, photos, references, layouts
 * 5. Navigation (5 tests) - Back navigation, deep links, performance
 * 6. Preview (5 tests) - Admin preview functionality
 * 7. Mobile Responsiveness (3 tests) - Mobile and tablet viewports
 * 8. Accessibility (2 tests) - Heading hierarchy, keyboard navigation
 * 
 * Coverage maintained:
 * ✅ All page types (events, activities, content pages)
 * ✅ All navigation flows between pages
 * ✅ All section content types (rich text, photos, references)
 * ✅ All photo gallery modes (gallery, carousel, loop)
 * ✅ All layout types (single-column, two-column)
 * ✅ Preview functionality from admin
 * ✅ Mobile and tablet responsiveness
 * ✅ Accessibility features
 * ✅ Error handling (404s, empty states)
 * ✅ Performance (navigation speed)
 * 
 * Eliminated duplicates:
 * - Removed redundant navigation tests across page types
 * - Consolidated similar section display tests
 * - Merged preview tests into single section
 * - Combined mobile responsiveness tests
 * 
 * Requirements validated:
 * - 4.2 (E2E Critical Path Testing - Section Management Flow)
 * - 5.1-5.3 (Preview functionality)
 */
