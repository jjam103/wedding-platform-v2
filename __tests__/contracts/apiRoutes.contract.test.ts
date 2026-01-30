/**
 * API Route Contract Tests
 * 
 * These tests validate that all API routes follow required patterns.
 * They catch common mistakes like forgetting to await params or missing auth.
 * 
 * Why this exists:
 * - Next.js 16 made params async, easy to forget await
 * - Auth checks should be consistent across all admin routes
 * - All routes should return Result<T> format
 */

import { readdir, readFile } from 'fs/promises';
import { join } from 'path';

describe('API Route Contracts', () => {
  describe('Dynamic Route Params', () => {
    it('all dynamic routes should await params', async () => {
      const dynamicRoutes = await findDynamicRoutes('app/api');
      
      expect(dynamicRoutes.length).toBeGreaterThan(0);
      
      for (const routePath of dynamicRoutes) {
        const content = await readFile(routePath, 'utf-8');
        
        // Check if route uses params
        if (content.includes('params:') || content.includes('{ params }')) {
          // Should have 'await params' or 'const resolvedParams = await params'
          const hasAwaitParams = 
            content.includes('await params') ||
            content.includes('resolvedParams = await params');
          
          expect(hasAwaitParams).toBe(true);
          
          if (!hasAwaitParams) {
            fail(`Route ${routePath} uses params but doesn't await it`);
          }
        }
      }
    });

    it('dynamic routes should use resolvedParams pattern', async () => {
      const dynamicRoutes = await findDynamicRoutes('app/api');
      
      for (const routePath of dynamicRoutes) {
        const content = await readFile(routePath, 'utf-8');
        
        if (content.includes('params:')) {
          // Recommended pattern: const resolvedParams = await params;
          const hasResolvedParams = content.includes('resolvedParams');
          
          if (!hasResolvedParams) {
            console.warn(`Route ${routePath} should use 'resolvedParams' pattern for clarity`);
          }
        }
      }
    });
  });

  describe('Authentication', () => {
    it('all admin routes should call verifyAuth', async () => {
      const adminRoutes = await findAllRoutes('app/api/admin');
      
      expect(adminRoutes.length).toBeGreaterThan(0);
      
      for (const routePath of adminRoutes) {
        const content = await readFile(routePath, 'utf-8');
        
        // Should call verifyAuth() or have auth check
        const hasAuth = 
          content.includes('verifyAuth()') ||
          content.includes('getSession()') ||
          content.includes('auth.getUser()');
        
        expect(hasAuth).toBe(true);
        
        if (!hasAuth) {
          fail(`Admin route ${routePath} is missing authentication check`);
        }
      }
    });

    it('auth should be checked before params resolution', async () => {
      const dynamicRoutes = await findDynamicRoutes('app/api/admin');
      
      for (const routePath of dynamicRoutes) {
        const content = await readFile(routePath, 'utf-8');
        
        if (content.includes('verifyAuth') && content.includes('await params')) {
          // Find positions
          const authPos = content.indexOf('verifyAuth');
          const paramsPos = content.indexOf('await params');
          
          // Auth should come before params
          expect(authPos).toBeLessThan(paramsPos);
          
          if (authPos >= paramsPos) {
            console.warn(`Route ${routePath} should check auth before resolving params`);
          }
        }
      }
    });
  });

  describe('Response Format', () => {
    it('all routes should return Result<T> format', async () => {
      const allRoutes = await findAllRoutes('app/api');
      
      for (const routePath of allRoutes) {
        const content = await readFile(routePath, 'utf-8');
        
        // Check for Result<T> return type
        const hasResultType = 
          content.includes('Result<') ||
          content.includes('success: true') ||
          content.includes('success: false');
        
        expect(hasResultType).toBe(true);
        
        if (!hasResultType) {
          console.warn(`Route ${routePath} should return Result<T> format`);
        }
      }
    });

    it('error responses should include error code', async () => {
      const allRoutes = await findAllRoutes('app/api');
      
      for (const routePath of allRoutes) {
        const content = await readFile(routePath, 'utf-8');
        
        // If route has error handling, should include error code
        if (content.includes('success: false')) {
          const hasErrorCode = content.includes('error: {') && content.includes('code:');
          
          expect(hasErrorCode).toBe(true);
          
          if (!hasErrorCode) {
            fail(`Route ${routePath} has error response but missing error code`);
          }
        }
      }
    });
  });

  describe('HTTP Methods', () => {
    it('routes should export proper HTTP method functions', async () => {
      const allRoutes = await findAllRoutes('app/api');
      
      for (const routePath of allRoutes) {
        const content = await readFile(routePath, 'utf-8');
        
        // Should export at least one HTTP method
        const hasMethod = 
          content.includes('export async function GET') ||
          content.includes('export async function POST') ||
          content.includes('export async function PUT') ||
          content.includes('export async function DELETE') ||
          content.includes('export async function PATCH');
        
        expect(hasMethod).toBe(true);
        
        if (!hasMethod) {
          fail(`Route ${routePath} doesn't export any HTTP method functions`);
        }
      }
    });
  });
});

// Helper functions

async function findDynamicRoutes(dir: string): Promise<string[]> {
  const routes: string[] = [];
  
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      
      if (entry.isDirectory()) {
        // Check if directory name indicates dynamic route
        if (entry.name.startsWith('[') && entry.name.endsWith(']')) {
          const routeFile = join(fullPath, 'route.ts');
          try {
            await readFile(routeFile);
            routes.push(routeFile);
          } catch {
            // route.ts doesn't exist in this directory
          }
        }
        
        // Recursively search subdirectories
        const subRoutes = await findDynamicRoutes(fullPath);
        routes.push(...subRoutes);
      }
    }
  } catch (error) {
    // Directory doesn't exist or can't be read
  }
  
  return routes;
}

async function findAllRoutes(dir: string): Promise<string[]> {
  const routes: string[] = [];
  
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      
      if (entry.isDirectory()) {
        const subRoutes = await findAllRoutes(fullPath);
        routes.push(...subRoutes);
      } else if (entry.name === 'route.ts') {
        routes.push(fullPath);
      }
    }
  } catch (error) {
    // Directory doesn't exist or can't be read
  }
  
  return routes;
}
