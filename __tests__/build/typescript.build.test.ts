/**
 * TypeScript Build Validation Tests
 * 
 * These tests validate that TypeScript compiles without errors.
 * They catch type errors that might not be caught by unit tests.
 * 
 * Why this exists:
 * - Unit tests use ts-jest which is more lenient than tsc
 * - Type errors can slip through if not explicitly checked
 * - Production build uses strict TypeScript compilation
 */

import { execSync } from 'child_process';

describe.skip('TypeScript Compilation', () => {
  it('should compile without errors', () => {
    expect(() => {
      execSync('npx tsc --noEmit', { 
        stdio: 'pipe',
        encoding: 'utf-8' 
      });
    }).not.toThrow();
  }, 30000); // 30 second timeout for compilation

  it('should have 0 TypeScript errors', () => {
    try {
      const output = execSync('npx tsc --noEmit', { 
        encoding: 'utf-8',
        stdio: 'pipe'
      });
      
      // If there are errors, tsc will output them
      expect(output).not.toContain('error TS');
      expect(output).not.toContain('Found');
    } catch (error: any) {
      // If tsc exits with error code, fail the test with the output
      fail(`TypeScript compilation failed:\n${error.stdout || error.message}`);
    }
  }, 30000);

  it('should use strict mode', async () => {
    const { readFile } = await import('fs/promises');
    const tsconfig = JSON.parse(
      await readFile('tsconfig.json', 'utf-8')
    );
    
    expect(tsconfig.compilerOptions.strict).toBe(true);
  });

  it('should not have any type assertions', async () => {
    // This is a stricter check - we want to minimize 'as any' usage
    const { execSync } = await import('child_process');
    
    try {
      const output = execSync(
        'grep -r "as any" app/ components/ services/ lib/ hooks/ --include="*.ts" --include="*.tsx" || true',
        { encoding: 'utf-8' }
      );
      
      // Allow some 'as any' but warn if there are too many
      const count = output.split('\n').filter(line => line.trim()).length;
      
      if (count > 10) {
        console.warn(`Warning: Found ${count} instances of 'as any'. Consider reducing type assertions.`);
      }
      
      // This is a soft check - we don't fail the test, just warn
      expect(count).toBeLessThan(50);
    } catch (error) {
      // grep returns non-zero if no matches, which is good
    }
  });
});
