#!/usr/bin/env node

import { readdir, stat } from 'fs/promises';
import { join, relative, extname, basename } from 'path';

/**
 * Recursively find all files matching a pattern
 */
async function findFiles(dir, pattern, results = []) {
  try {
    const entries = await readdir(dir);
    
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stats = await stat(fullPath);
      
      if (stats.isDirectory()) {
        // Skip node_modules and .next directories
        if (!entry.startsWith('.') && entry !== 'node_modules') {
          await findFiles(fullPath, pattern, results);
        }
      } else if (pattern.test(entry)) {
        results.push(fullPath);
      }
    }
  } catch (error) {
    // Skip directories we can't read
  }
  
  return results;
}

/**
 * Analyze component test coverage
 */
async function analyzeComponentCoverage() {
  console.log('🔍 Analyzing Component Test Coverage...\n');
  
  // Find all component files (.tsx files in components/ and app/ directories)
  const componentFiles = await findFiles('.', /\.tsx$/);
  
  // Filter to only include actual component files (not test files)
  const actualComponents = componentFiles.filter(file => {
    const relativePath = relative('.', file);
    return (
      (relativePath.startsWith('components/') || relativePath.startsWith('app/')) &&
      !relativePath.includes('.test.') &&
      !relativePath.includes('.spec.') &&
      !relativePath.includes('node_modules') &&
      !relativePath.includes('.next') &&
      !relativePath.endsWith('layout.tsx') && // Skip layout files
      !relativePath.includes('/api/') // Skip API routes
    );
  });
  
  // Find all test files
  const testFiles = componentFiles.filter(file => {
    const relativePath = relative('.', file);
    return (
      relativePath.includes('.test.') || 
      relativePath.includes('.spec.')
    );
  });
  
  // Create a map of component to test files
  const componentTestMap = new Map();
  
  for (const component of actualComponents) {
    const relativePath = relative('.', component);
    const componentName = basename(component, '.tsx');
    const componentDir = relativePath.replace(/\/[^/]+$/, '');
    
    // Find corresponding test files
    const relatedTests = testFiles.filter(testFile => {
      const testPath = relative('.', testFile);
      const testName = basename(testFile, extname(testFile));
      
      // Check if test file is for this component
      return (
        testPath.includes(componentName) ||
        testName.includes(componentName) ||
        testPath.startsWith(componentDir) && testName.includes('page')
      );
    });
    
    componentTestMap.set(relativePath, {
      component: relativePath,
      tests: relatedTests.map(t => relative('.', t)),
      hasTests: relatedTests.length > 0,
      testCount: relatedTests.length
    });
  }
  
  // Categorize components by test coverage
  const testedComponents = [];
  const untestedComponents = [];
  const partiallyTestedComponents = [];
  
  for (const [component, info] of componentTestMap) {
    if (info.testCount === 0) {
      untestedComponents.push(info);
    } else if (info.testCount === 1) {
      partiallyTestedComponents.push(info);
    } else {
      testedComponents.push(info);
    }
  }
  
  // Calculate coverage statistics
  const totalComponents = actualComponents.length;
  const testedCount = testedComponents.length + partiallyTestedComponents.length;
  const coveragePercentage = ((testedCount / totalComponents) * 100).toFixed(1);
  
  console.log('📊 Component Test Coverage Summary');
  console.log('=====================================');
  console.log(`Total Components: ${totalComponents}`);
  console.log(`Components with Tests: ${testedCount} (${coveragePercentage}%)`);
  console.log(`Components without Tests: ${untestedComponents.length}`);
  console.log(`Well-tested Components: ${testedComponents.length}`);
  console.log(`Partially-tested Components: ${partiallyTestedComponents.length}`);
  console.log('');
  
  // Show components that need tests (< 70% coverage target)
  if (parseFloat(coveragePercentage) < 70) {
    console.log('🚨 BELOW TARGET: Components need more tests to reach 70% coverage');
    console.log('');
  }
  
  // List untested components
  if (untestedComponents.length > 0) {
    console.log('❌ Components WITHOUT Tests:');
    console.log('============================');
    untestedComponents
      .sort((a, b) => a.component.localeCompare(b.component))
      .forEach(info => {
        console.log(`  - ${info.component}`);
      });
    console.log('');
  }
  
  // List partially tested components
  if (partiallyTestedComponents.length > 0) {
    console.log('⚠️  Components with LIMITED Tests (need more coverage):');
    console.log('=====================================================');
    partiallyTestedComponents
      .sort((a, b) => a.component.localeCompare(b.component))
      .forEach(info => {
        console.log(`  - ${info.component}`);
        console.log(`    Tests: ${info.tests.join(', ')}`);
      });
    console.log('');
  }
  
  // List well-tested components
  if (testedComponents.length > 0) {
    console.log('✅ Well-tested Components:');
    console.log('==========================');
    testedComponents
      .sort((a, b) => a.component.localeCompare(b.component))
      .forEach(info => {
        console.log(`  - ${info.component} (${info.testCount} test files)`);
      });
    console.log('');
  }
  
  // Identify priority components for testing
  console.log('🎯 Priority Components for Testing:');
  console.log('===================================');
  
  // Prioritize by importance (admin components, UI components, then guest components)
  const priorityComponents = [...untestedComponents, ...partiallyTestedComponents]
    .sort((a, b) => {
      // Admin components first
      if (a.component.includes('admin/') && !b.component.includes('admin/')) return -1;
      if (!a.component.includes('admin/') && b.component.includes('admin/')) return 1;
      
      // UI components second
      if (a.component.includes('ui/') && !b.component.includes('ui/')) return -1;
      if (!a.component.includes('ui/') && b.component.includes('ui/')) return 1;
      
      // Then alphabetical
      return a.component.localeCompare(b.component);
    })
    .slice(0, 15); // Top 15 priority components
  
  priorityComponents.forEach((info, index) => {
    const status = info.testCount === 0 ? 'NO TESTS' : 'LIMITED TESTS';
    console.log(`  ${index + 1}. ${info.component} - ${status}`);
  });
  
  console.log('');
  console.log('💡 Recommendations:');
  console.log('===================');
  console.log('1. Focus on admin components first (highest business impact)');
  console.log('2. Add tests for UI components (reused across app)');
  console.log('3. Test core interactions: rendering, user events, prop changes');
  console.log('4. Test error states and loading states');
  console.log('5. Test accessibility features');
  
  return {
    totalComponents,
    testedCount,
    coveragePercentage: parseFloat(coveragePercentage),
    untestedComponents,
    partiallyTestedComponents,
    priorityComponents
  };
}

// Run the analysis
analyzeComponentCoverage().catch(console.error);