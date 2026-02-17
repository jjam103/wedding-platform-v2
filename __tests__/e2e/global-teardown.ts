/**
 * E2E Global Teardown
 * 
 * Runs after all E2E tests to clean up the test environment.
 * This includes:
 * - Cleaning up test data from database
 * - Removing authentication state files
 * - Logging execution summary
 */

import { FullConfig } from '@playwright/test';
import { cleanup } from '../helpers/cleanup';
import fs from 'fs';
import path from 'path';

/**
 * Global teardown function
 * Called once after all tests complete
 * 
 * IMPORTANT: This runs AFTER all tests finish, not between test files.
 * Do not delete shared resources like auth files here - they're needed
 * for the entire test suite execution.
 */
async function globalTeardown(config: FullConfig) {
  console.log('\n🧹 E2E Global Teardown Starting...\n');
  
  const startTime = Date.now();
  const errors: string[] = [];
  
  try {
    // 1. Clean up test data
    console.log('🗑️  Cleaning up test data...');
    await cleanupTestData(errors);
    console.log('✅ Test data cleaned\n');
    
    // 2. Keep authentication state files for debugging
    // Don't remove them - they're useful for troubleshooting
    console.log('🔓 Keeping authentication state for debugging...');
    console.log('   Auth files preserved in .auth/ directory');
    console.log('   Run "rm -rf .auth" to clean up manually\n');
    
    // 3. Log execution summary
    const duration = Date.now() - startTime;
    logExecutionSummary(duration, errors);
    
    console.log('✨ E2E Global Teardown Complete!\n');
  } catch (error) {
    console.error('\n❌ E2E Global Teardown Failed:', error);
    // Don't throw - we want teardown to complete even if there are errors
    errors.push(`Fatal error: ${error instanceof Error ? error.message : String(error)}`);
  }
  
  // If there were errors, log them but don't fail
  if (errors.length > 0) {
    console.warn('\n⚠️  Teardown completed with warnings:');
    errors.forEach((error, index) => {
      console.warn(`   ${index + 1}. ${error}`);
    });
  }
}

/**
 * Clean up test data from database
 * Uses the cleanup utility to remove all test data
 */
async function cleanupTestData(errors: string[]): Promise<void> {
  try {
    await cleanup();
  } catch (error) {
    const errorMessage = `Test data cleanup failed: ${error instanceof Error ? error.message : String(error)}`;
    console.warn(`   ⚠️  ${errorMessage}`);
    errors.push(errorMessage);
    
    // Continue with teardown even if cleanup fails
    console.warn('   Continuing with teardown...');
  }
}

/**
 * Remove authentication state files
 * Cleans up stored authentication sessions
 */
async function removeAuthState(errors: string[]): Promise<void> {
  const authDir = '.auth';
  const authFiles = ['admin.json', 'guest.json'];
  
  try {
    // Check if .auth directory exists
    if (!fs.existsSync(authDir)) {
      console.log('   No authentication directory found (already clean)');
      return;
    }
    
    // Remove each auth file
    let removedCount = 0;
    for (const file of authFiles) {
      const filePath = path.join(authDir, file);
      
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          removedCount++;
          console.log(`   Removed: ${filePath}`);
        } catch (error) {
          const errorMessage = `Failed to remove ${filePath}: ${error instanceof Error ? error.message : String(error)}`;
          console.warn(`   ⚠️  ${errorMessage}`);
          errors.push(errorMessage);
        }
      }
    }
    
    if (removedCount === 0) {
      console.log('   No authentication files found (already clean)');
    }
    
    // Try to remove .auth directory if empty
    try {
      const remainingFiles = fs.readdirSync(authDir);
      if (remainingFiles.length === 0) {
        fs.rmdirSync(authDir);
        console.log('   Removed empty .auth directory');
      }
    } catch (error) {
      // Ignore errors when removing directory
      // It's okay if directory remains
    }
  } catch (error) {
    const errorMessage = `Authentication state cleanup failed: ${error instanceof Error ? error.message : String(error)}`;
    console.warn(`   ⚠️  ${errorMessage}`);
    errors.push(errorMessage);
  }
}

/**
 * Log execution summary
 * Provides overview of teardown execution
 */
function logExecutionSummary(duration: number, errors: string[]): void {
  console.log('📊 Execution Summary:');
  console.log(`   Duration: ${(duration / 1000).toFixed(2)}s`);
  console.log(`   Errors: ${errors.length}`);
  
  if (errors.length === 0) {
    console.log('   Status: ✅ Clean teardown');
  } else {
    console.log('   Status: ⚠️  Completed with warnings');
  }
  
  console.log('');
}

export default globalTeardown;
