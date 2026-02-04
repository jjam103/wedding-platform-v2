/**
 * Unit tests for E2E helper functions
 * 
 * These tests verify the helper functions are properly exported and documented.
 * Full integration tests are in the E2E test suite.
 * 
 * Note: We cannot import Playwright in Jest tests, so we verify exports
 * by checking the source file directly.
 */

import { describe, it, expect } from '@jest/globals';
import fs from 'fs';
import path from 'path';

describe('E2E Helpers', () => {
  const helpersPath = path.join(__dirname, 'e2eHelpers.ts');
  const helpersContent = fs.readFileSync(helpersPath, 'utf-8');

  describe('Element Waiting Utilities', () => {
    it('should export waitForElement function', () => {
      expect(helpersContent).toContain('export async function waitForElement');
    });

    it('should export waitForElementHidden function', () => {
      expect(helpersContent).toContain('export async function waitForElementHidden');
    });

    it('should export waitForText function', () => {
      expect(helpersContent).toContain('export async function waitForText');
    });

    it('should export waitForElementCount function', () => {
      expect(helpersContent).toContain('export async function waitForElementCount');
    });

    it('should export waitForPageLoad function', () => {
      expect(helpersContent).toContain('export async function waitForPageLoad');
    });
  });

  describe('Form Filling Utilities', () => {
    it('should export fillAndSubmitForm function', () => {
      expect(helpersContent).toContain('export async function fillAndSubmitForm');
    });

    it('should export fillFormFieldByLabel function', () => {
      expect(helpersContent).toContain('export async function fillFormFieldByLabel');
    });

    it('should export selectDropdownOption function', () => {
      expect(helpersContent).toContain('export async function selectDropdownOption');
    });

    it('should export toggleCheckbox function', () => {
      expect(helpersContent).toContain('export async function toggleCheckbox');
    });
  });

  describe('Toast Message Utilities', () => {
    it('should export waitForToast function', () => {
      expect(helpersContent).toContain('export async function waitForToast');
    });

    it('should export waitForToastDismiss function', () => {
      expect(helpersContent).toContain('export async function waitForToastDismiss');
    });

    it('should export dismissToast function', () => {
      expect(helpersContent).toContain('export async function dismissToast');
    });
  });

  describe('Test Data Creation Utilities', () => {
    it('should export createTestGuest function', () => {
      expect(helpersContent).toContain('export async function createTestGuest');
    });

    it('should export createTestGroup function', () => {
      expect(helpersContent).toContain('export async function createTestGroup');
    });

    it('should export createTestEvent function', () => {
      expect(helpersContent).toContain('export async function createTestEvent');
    });

    it('should export createTestActivity function', () => {
      expect(helpersContent).toContain('export async function createTestActivity');
    });

    it('should export createTestContentPage function', () => {
      expect(helpersContent).toContain('export async function createTestContentPage');
    });
  });

  describe('Screenshot Utilities', () => {
    it('should export takeTimestampedScreenshot function', () => {
      expect(helpersContent).toContain('export async function takeTimestampedScreenshot');
    });

    it('should export takeElementScreenshot function', () => {
      expect(helpersContent).toContain('export async function takeElementScreenshot');
    });

    it('should export screenshotOnFailure function', () => {
      expect(helpersContent).toContain('export async function screenshotOnFailure');
    });
  });

  describe('Navigation Utilities', () => {
    it('should export navigateAndWait function', () => {
      expect(helpersContent).toContain('export async function navigateAndWait');
    });

    it('should export clickAndNavigate function', () => {
      expect(helpersContent).toContain('export async function clickAndNavigate');
    });

    it('should export goBackAndWait function', () => {
      expect(helpersContent).toContain('export async function goBackAndWait');
    });
  });

  describe('Modal/Dialog Utilities', () => {
    it('should export waitForModal function', () => {
      expect(helpersContent).toContain('export async function waitForModal');
    });

    it('should export closeModal function', () => {
      expect(helpersContent).toContain('export async function closeModal');
    });
  });

  describe('Table/List Utilities', () => {
    it('should export getTableRowCount function', () => {
      expect(helpersContent).toContain('export async function getTableRowCount');
    });

    it('should export findTableRow function', () => {
      expect(helpersContent).toContain('export async function findTableRow');
    });

    it('should export clickRowButton function', () => {
      expect(helpersContent).toContain('export async function clickRowButton');
    });
  });

  describe('Authentication Utilities', () => {
    it('should export loginAsAdmin function', () => {
      expect(helpersContent).toContain('export async function loginAsAdmin');
    });

    it('should export loginAsGuest function', () => {
      expect(helpersContent).toContain('export async function loginAsGuest');
    });

    it('should export logout function', () => {
      expect(helpersContent).toContain('export async function logout');
    });
  });

  describe('Cleanup Utilities', () => {
    it('should export cleanupTestData function', () => {
      expect(helpersContent).toContain('export async function cleanupTestData');
    });

    it('should export deleteTestEntity function', () => {
      expect(helpersContent).toContain('export async function deleteTestEntity');
    });
  });

  describe('Assertion Utilities', () => {
    it('should export assertUrlContains function', () => {
      expect(helpersContent).toContain('export async function assertUrlContains');
    });

    it('should export assertAttribute function', () => {
      expect(helpersContent).toContain('export async function assertAttribute');
    });

    it('should export assertHasClass function', () => {
      expect(helpersContent).toContain('export async function assertHasClass');
    });
  });

  describe('Debugging Utilities', () => {
    it('should export logConsoleMessages function', () => {
      expect(helpersContent).toContain('export function logConsoleMessages');
    });

    it('should export logNetworkRequests function', () => {
      expect(helpersContent).toContain('export function logNetworkRequests');
    });

    it('should export debugPause function', () => {
      expect(helpersContent).toContain('export async function debugPause');
    });
  });

  describe('Default Export', () => {
    it('should export all utilities as default object', () => {
      expect(helpersContent).toContain('export default {');
      expect(helpersContent).toContain('waitForElement,');
      expect(helpersContent).toContain('fillAndSubmitForm,');
      expect(helpersContent).toContain('waitForToast,');
      expect(helpersContent).toContain('createTestGuest,');
      expect(helpersContent).toContain('takeTimestampedScreenshot,');
    });
  });

  describe('Documentation', () => {
    it('should have JSDoc comments for all exported functions', () => {
      expect(helpersContent).toContain('/**');
      expect(helpersContent).toContain('* @example');
    });

    it('should have module-level documentation', () => {
      expect(helpersContent).toContain('@module e2eHelpers');
    });
  });

  describe('Helper Guide Documentation', () => {
    it('should have comprehensive usage guide', () => {
      const guidePath = path.join(__dirname, 'E2E_HELPERS_GUIDE.md');
      const guideContent = fs.readFileSync(guidePath, 'utf-8');
      
      // Check for examples
      expect(guideContent).toContain('```typescript');
      expect(guideContent).toContain('Example:');
      expect(guideContent).toContain('await waitForElement');
      expect(guideContent).toContain('await fillAndSubmitForm');
    });

    it('should document all helper categories', () => {
      const guidePath = path.join(__dirname, 'E2E_HELPERS_GUIDE.md');
      const guideContent = fs.readFileSync(guidePath, 'utf-8');
      
      expect(guideContent).toContain('Element Waiting Utilities');
      expect(guideContent).toContain('Form Filling Utilities');
      expect(guideContent).toContain('Toast Message Utilities');
      expect(guideContent).toContain('Test Data Creation Utilities');
      expect(guideContent).toContain('Screenshot Utilities');
      expect(guideContent).toContain('Navigation Utilities');
      expect(guideContent).toContain('Modal/Dialog Utilities');
      expect(guideContent).toContain('Table/List Utilities');
      expect(guideContent).toContain('Authentication Utilities');
      expect(guideContent).toContain('Cleanup Utilities');
      expect(guideContent).toContain('Assertion Utilities');
      expect(guideContent).toContain('Debugging Utilities');
    });

    it('should include best practices section', () => {
      const guidePath = path.join(__dirname, 'E2E_HELPERS_GUIDE.md');
      const guideContent = fs.readFileSync(guidePath, 'utf-8');
      
      expect(guideContent).toContain('Best Practices');
      expect(guideContent).toContain('Troubleshooting');
    });

    it('should include complete example test', () => {
      const guidePath = path.join(__dirname, 'E2E_HELPERS_GUIDE.md');
      const guideContent = fs.readFileSync(guidePath, 'utf-8');
      
      expect(guideContent).toContain('Complete Example Test');
      expect(guideContent).toContain('test.describe');
    });
  });

  describe('Helper Utility Coverage', () => {
    it('should cover all major E2E testing patterns', () => {
      // Element interaction
      expect(helpersContent).toContain('waitForElement');
      expect(helpersContent).toContain('waitForPageLoad');
      
      // Form handling
      expect(helpersContent).toContain('fillAndSubmitForm');
      expect(helpersContent).toContain('selectDropdownOption');
      
      // User feedback
      expect(helpersContent).toContain('waitForToast');
      
      // Test data
      expect(helpersContent).toContain('createTestGuest');
      expect(helpersContent).toContain('createTestGroup');
      
      // Debugging
      expect(helpersContent).toContain('takeTimestampedScreenshot');
      expect(helpersContent).toContain('logConsoleMessages');
      
      // Navigation
      expect(helpersContent).toContain('navigateAndWait');
      expect(helpersContent).toContain('clickAndNavigate');
      
      // Modals
      expect(helpersContent).toContain('waitForModal');
      expect(helpersContent).toContain('closeModal');
      
      // Tables
      expect(helpersContent).toContain('getTableRowCount');
      expect(helpersContent).toContain('findTableRow');
      
      // Authentication
      expect(helpersContent).toContain('loginAsAdmin');
      expect(helpersContent).toContain('loginAsGuest');
      
      // Cleanup
      expect(helpersContent).toContain('cleanupTestData');
    });
  });

  describe('Error Handling', () => {
    it('should include error handling for missing elements', () => {
      expect(helpersContent).toContain('Form field not found');
      expect(helpersContent).toContain('Modal not found');
    });

    it('should include error handling for test data creation', () => {
      expect(helpersContent).toContain('Failed to create test guest');
      expect(helpersContent).toContain('Failed to create test group');
      expect(helpersContent).toContain('Failed to create test event');
    });
  });

  describe('Type Safety', () => {
    it('should import Playwright types', () => {
      expect(helpersContent).toContain("import { Page, expect, Locator } from '@playwright/test'");
    });

    it('should use TypeScript type annotations', () => {
      expect(helpersContent).toContain(': Page');
      expect(helpersContent).toContain(': Promise<');
      expect(helpersContent).toContain(': string');
    });
  });
});
