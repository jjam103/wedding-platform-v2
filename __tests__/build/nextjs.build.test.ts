/**
 * Next.js Build Validation Tests
 * 
 * These tests validate that Next.js builds successfully.
 * They catch issues specific to Next.js compilation and static generation.
 * 
 * Why this exists:
 * - Next.js has its own compiler (Turbopack/Webpack)
 * - Static generation can fail even if TypeScript passes
 * - Build-time errors only appear during production build
 */

import { execSync } from 'child_process';

describe('Next.js Build', () => {
  it('should build successfully', () => {
    expect(() => {
      execSync('npm run build', { 
        stdio: 'pipe',
        encoding: 'utf-8'
      });
    }).not.toThrow();
  }, 120000); // 2 minute timeout for full build

  it('should generate all static pages', () => {
    const output = execSync('npm run build', { 
      encoding: 'utf-8',
      stdio: 'pipe'
    });
    
    // Verify static generation completed
    expect(output).toContain('Generating static pages');
    expect(output).not.toContain('Failed to compile');
    expect(output).not.toContain('Error occurred prerendering page');
    
    // Check that we generated the expected number of pages
    // Adjust this number based on your actual page count
    expect(output).toMatch(/\(\d+\/\d+\)/);
  }, 120000);

  it('should not have any build warnings', () => {
    const output = execSync('npm run build', { 
      encoding: 'utf-8',
      stdio: 'pipe'
    });
    
    // Check for common warnings
    expect(output).not.toContain('Warning:');
    expect(output).not.toContain('deprecated');
    
    // Allow some warnings but fail if there are too many
    const warningCount = (output.match(/warn/gi) || []).length;
    expect(warningCount).toBeLessThan(5);
  }, 120000);

  it('should have reasonable build size', () => {
    const output = execSync('npm run build', { 
      encoding: 'utf-8',
      stdio: 'pipe'
    });
    
    // Extract build size information
    // This is a basic check - adjust thresholds based on your app
    const sizeMatch = output.match(/Total size: ([\d.]+) kB/);
    
    if (sizeMatch) {
      const totalSize = parseFloat(sizeMatch[1]);
      
      // Warn if bundle is getting too large (adjust threshold as needed)
      if (totalSize > 5000) {
        console.warn(`Warning: Total bundle size is ${totalSize} kB. Consider code splitting.`);
      }
      
      // Fail if bundle is unreasonably large
      expect(totalSize).toBeLessThan(10000); // 10 MB
    }
  }, 120000);

  it('should not have duplicate dependencies', () => {
    try {
      const output = execSync('npm ls --depth=0', { 
        encoding: 'utf-8',
        stdio: 'pipe'
      });
      
      // Check for duplicate packages
      expect(output).not.toContain('UNMET DEPENDENCY');
      expect(output).not.toContain('extraneous');
    } catch (error: any) {
      // npm ls returns non-zero if there are issues
      if (error.stdout) {
        fail(`Dependency issues found:\n${error.stdout}`);
      }
    }
  });

  it('should have valid next.config', async () => {
    const { readFile } = await import('fs/promises');
    
    // Verify next.config.ts exists and is valid
    const configContent = await readFile('next.config.ts', 'utf-8');
    
    expect(configContent).toContain('NextConfig');
    expect(configContent).not.toContain('TODO');
    expect(configContent).not.toContain('FIXME');
  });
});
