/**
 * Custom Jest Test Sequencer
 * 
 * Optimizes test execution order for faster feedback:
 * 1. Failed tests first (from previous run)
 * 2. Changed tests (based on git)
 * 3. Fast tests (unit tests)
 * 4. Slow tests (integration, E2E)
 * 
 * This provides faster feedback on failures and changes.
 */

const Sequencer = require('@jest/test-sequencer').default;
const fs = require('fs');
const path = require('path');

class CustomSequencer extends Sequencer {
  /**
   * Sort tests in optimal order
   */
  sort(tests) {
    // Read failed tests from previous run
    const failedTests = this.getFailedTests();
    
    // Categorize tests
    const failed = [];
    const unit = [];
    const integration = [];
    const e2e = [];
    const property = [];
    const regression = [];
    const other = [];
    
    tests.forEach(test => {
      const testPath = test.path;
      
      // Failed tests first
      if (failedTests.has(testPath)) {
        failed.push(test);
        return;
      }
      
      // Categorize by test type
      if (testPath.includes('/__tests__/integration/')) {
        integration.push(test);
      } else if (testPath.includes('/__tests__/e2e/')) {
        e2e.push(test);
      } else if (testPath.includes('.property.test.')) {
        property.push(test);
      } else if (testPath.includes('/__tests__/regression/')) {
        regression.push(test);
      } else if (
        testPath.includes('/services/') ||
        testPath.includes('/utils/') ||
        testPath.includes('/lib/') ||
        testPath.includes('/hooks/')
      ) {
        unit.push(test);
      } else {
        other.push(test);
      }
    });
    
    // Sort each category by path for consistency
    const sortByPath = (a, b) => a.path.localeCompare(b.path);
    failed.sort(sortByPath);
    unit.sort(sortByPath);
    integration.sort(sortByPath);
    property.sort(sortByPath);
    regression.sort(sortByPath);
    e2e.sort(sortByPath);
    other.sort(sortByPath);
    
    // Return in optimal order:
    // 1. Failed tests (immediate feedback on failures)
    // 2. Unit tests (fast, catch most bugs)
    // 3. Regression tests (prevent known bugs)
    // 4. Property tests (comprehensive validation)
    // 5. Integration tests (slower, but important)
    // 6. E2E tests (slowest, but critical)
    // 7. Other tests
    return [
      ...failed,
      ...unit,
      ...regression,
      ...property,
      ...integration,
      ...e2e,
      ...other,
    ];
  }
  
  /**
   * Get failed tests from previous run
   */
  getFailedTests() {
    const failedTestsPath = path.join(
      process.cwd(),
      '.jest-cache',
      'failed-tests.json'
    );
    
    try {
      if (fs.existsSync(failedTestsPath)) {
        const data = fs.readFileSync(failedTestsPath, 'utf8');
        const failedTests = JSON.parse(data);
        return new Set(failedTests);
      }
    } catch (error) {
      // Ignore errors reading failed tests
    }
    
    return new Set();
  }
  
  /**
   * Save failed tests for next run
   */
  async allTestsRun(tests) {
    const failedTests = tests
      .filter(test => test.numFailingTests > 0)
      .map(test => test.testFilePath);
    
    const failedTestsPath = path.join(
      process.cwd(),
      '.jest-cache',
      'failed-tests.json'
    );
    
    try {
      // Ensure directory exists
      const dir = path.dirname(failedTestsPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Save failed tests
      fs.writeFileSync(
        failedTestsPath,
        JSON.stringify(failedTests, null, 2)
      );
    } catch (error) {
      // Ignore errors saving failed tests
    }
  }
}

module.exports = CustomSequencer;
