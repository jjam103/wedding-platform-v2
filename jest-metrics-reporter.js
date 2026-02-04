/**
 * Custom Jest Reporter for Test Metrics Collection
 * 
 * Collects and stores test execution metrics:
 * - Execution time per test and suite
 * - Pass/fail rates
 * - Flaky test detection
 * - Coverage metrics
 * 
 * Metrics are stored in test-results/metrics/ for dashboard generation
 */

const fs = require('fs');
const path = require('path');

class MetricsReporter {
  constructor(globalConfig, options) {
    this._globalConfig = globalConfig;
    this._options = options;
    this.metricsDir = path.join(process.cwd(), 'test-results', 'metrics');
    this.timestamp = new Date().toISOString();
    
    // Ensure metrics directory exists
    if (!fs.existsSync(this.metricsDir)) {
      fs.mkdirSync(this.metricsDir, { recursive: true });
    }
    
    // Initialize metrics
    this.metrics = {
      timestamp: this.timestamp,
      summary: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        skippedTests: 0,
        totalDuration: 0,
        passRate: 0,
      },
      suites: [],
      slowTests: [],
      failedTests: [],
      flakyTests: [],
      coverage: null,
    };
  }

  onRunStart() {
    this.startTime = Date.now();
  }

  onTestResult(test, testResult) {
    const { testFilePath, testResults, perfStats } = testResult;
    const relativePath = path.relative(process.cwd(), testFilePath);
    
    // Calculate suite metrics
    const suiteMetrics = {
      path: relativePath,
      duration: perfStats.runtime,
      numTests: testResults.length,
      numPassed: testResults.filter(t => t.status === 'passed').length,
      numFailed: testResults.filter(t => t.status === 'failed').length,
      numSkipped: testResults.filter(t => t.status === 'skipped' || t.status === 'pending').length,
      tests: testResults.map(t => ({
        name: t.fullName,
        status: t.status,
        duration: t.duration,
        failureMessages: t.failureMessages,
      })),
    };
    
    this.metrics.suites.push(suiteMetrics);
    
    // Update summary
    this.metrics.summary.totalTests += suiteMetrics.numTests;
    this.metrics.summary.passedTests += suiteMetrics.numPassed;
    this.metrics.summary.failedTests += suiteMetrics.numFailed;
    this.metrics.summary.skippedTests += suiteMetrics.numSkipped;
    this.metrics.summary.totalDuration += suiteMetrics.duration;
    
    // Track slow tests (>5 seconds)
    testResults.forEach(test => {
      if (test.duration > 5000) {
        this.metrics.slowTests.push({
          suite: relativePath,
          name: test.fullName,
          duration: test.duration,
        });
      }
      
      // Track failed tests
      if (test.status === 'failed') {
        this.metrics.failedTests.push({
          suite: relativePath,
          name: test.fullName,
          duration: test.duration,
          failureMessages: test.failureMessages,
        });
      }
    });
  }

  onRunComplete(contexts, results) {
    const endTime = Date.now();
    const totalDuration = endTime - this.startTime;
    
    // Calculate pass rate
    if (this.metrics.summary.totalTests > 0) {
      this.metrics.summary.passRate = 
        (this.metrics.summary.passedTests / this.metrics.summary.totalTests) * 100;
    }
    
    // Sort slow tests by duration
    this.metrics.slowTests.sort((a, b) => b.duration - a.duration);
    
    // Detect flaky tests by comparing with previous runs
    this.detectFlakyTests();
    
    // Add coverage if available
    if (results.coverageMap) {
      const coverageSummary = results.coverageMap.getCoverageSummary();
      this.metrics.coverage = {
        lines: coverageSummary.lines.pct,
        statements: coverageSummary.statements.pct,
        functions: coverageSummary.functions.pct,
        branches: coverageSummary.branches.pct,
      };
    }
    
    // Save metrics
    this.saveMetrics();
    
    // Update historical data
    this.updateHistoricalData();
    
    // Generate dashboard
    this.generateDashboard();
  }

  detectFlakyTests() {
    // Read previous test results
    const historyFile = path.join(this.metricsDir, 'test-history.json');
    
    if (!fs.existsSync(historyFile)) {
      return;
    }
    
    try {
      const history = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
      const previousRuns = history.runs.slice(-10); // Last 10 runs
      
      // Find tests that have both passed and failed in recent runs
      const testResults = new Map();
      
      previousRuns.forEach(run => {
        run.suites.forEach(suite => {
          suite.tests.forEach(test => {
            const key = `${suite.path}::${test.name}`;
            if (!testResults.has(key)) {
              testResults.set(key, { passed: 0, failed: 0 });
            }
            const stats = testResults.get(key);
            if (test.status === 'passed') stats.passed++;
            if (test.status === 'failed') stats.failed++;
          });
        });
      });
      
      // Identify flaky tests (both passed and failed in last 10 runs)
      testResults.forEach((stats, key) => {
        if (stats.passed > 0 && stats.failed > 0) {
          const [suite, name] = key.split('::');
          this.metrics.flakyTests.push({
            suite,
            name,
            passCount: stats.passed,
            failCount: stats.failed,
            flakyRate: (stats.failed / (stats.passed + stats.failed)) * 100,
          });
        }
      });
      
      // Sort by flaky rate
      this.metrics.flakyTests.sort((a, b) => b.flakyRate - a.flakyRate);
    } catch (error) {
      // Ignore errors reading history
    }
  }

  saveMetrics() {
    // Save current run metrics
    const metricsFile = path.join(
      this.metricsDir,
      `metrics-${this.timestamp.replace(/:/g, '-')}.json`
    );
    
    fs.writeFileSync(metricsFile, JSON.stringify(this.metrics, null, 2));
    
    // Save as latest
    const latestFile = path.join(this.metricsDir, 'latest.json');
    fs.writeFileSync(latestFile, JSON.stringify(this.metrics, null, 2));
  }

  updateHistoricalData() {
    const historyFile = path.join(this.metricsDir, 'test-history.json');
    
    let history = { runs: [] };
    if (fs.existsSync(historyFile)) {
      try {
        history = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
      } catch (error) {
        // Start fresh if file is corrupted
      }
    }
    
    // Add current run
    history.runs.push(this.metrics);
    
    // Keep only last 30 runs
    if (history.runs.length > 30) {
      history.runs = history.runs.slice(-30);
    }
    
    fs.writeFileSync(historyFile, JSON.stringify(history, null, 2));
  }

  generateDashboard() {
    const dashboardFile = path.join(this.metricsDir, 'DASHBOARD.md');
    
    let dashboard = `# Test Metrics Dashboard\n\n`;
    dashboard += `**Last Updated**: ${new Date(this.timestamp).toLocaleString()}\n\n`;
    
    // Summary
    dashboard += `## 📊 Summary\n\n`;
    dashboard += `| Metric | Value |\n`;
    dashboard += `|--------|-------|\n`;
    dashboard += `| Total Tests | ${this.metrics.summary.totalTests} |\n`;
    dashboard += `| Passed | ${this.metrics.summary.passedTests} ✅ |\n`;
    dashboard += `| Failed | ${this.metrics.summary.failedTests} ❌ |\n`;
    dashboard += `| Skipped | ${this.metrics.summary.skippedTests} ⏭️ |\n`;
    dashboard += `| Pass Rate | ${this.metrics.summary.passRate.toFixed(2)}% |\n`;
    dashboard += `| Total Duration | ${(this.metrics.summary.totalDuration / 1000).toFixed(2)}s |\n\n`;
    
    // Coverage
    if (this.metrics.coverage) {
      dashboard += `## 📈 Coverage\n\n`;
      dashboard += `| Type | Coverage |\n`;
      dashboard += `|------|----------|\n`;
      dashboard += `| Lines | ${this.metrics.coverage.lines.toFixed(2)}% |\n`;
      dashboard += `| Statements | ${this.metrics.coverage.statements.toFixed(2)}% |\n`;
      dashboard += `| Functions | ${this.metrics.coverage.functions.toFixed(2)}% |\n`;
      dashboard += `| Branches | ${this.metrics.coverage.branches.toFixed(2)}% |\n\n`;
    }
    
    // Slow Tests
    if (this.metrics.slowTests.length > 0) {
      dashboard += `## 🐌 Slow Tests (>5s)\n\n`;
      dashboard += `| Test | Duration |\n`;
      dashboard += `|------|----------|\n`;
      this.metrics.slowTests.slice(0, 10).forEach(test => {
        dashboard += `| ${test.name} | ${(test.duration / 1000).toFixed(2)}s |\n`;
      });
      dashboard += `\n`;
    }
    
    // Flaky Tests
    if (this.metrics.flakyTests.length > 0) {
      dashboard += `## 🔄 Flaky Tests\n\n`;
      dashboard += `Tests that have both passed and failed in the last 10 runs:\n\n`;
      dashboard += `| Test | Pass Count | Fail Count | Flaky Rate |\n`;
      dashboard += `|------|------------|------------|------------|\n`;
      this.metrics.flakyTests.forEach(test => {
        dashboard += `| ${test.name} | ${test.passCount} | ${test.failCount} | ${test.flakyRate.toFixed(2)}% |\n`;
      });
      dashboard += `\n`;
    }
    
    // Failed Tests
    if (this.metrics.failedTests.length > 0) {
      dashboard += `## ❌ Failed Tests\n\n`;
      this.metrics.failedTests.forEach(test => {
        dashboard += `### ${test.name}\n\n`;
        dashboard += `**Suite**: ${test.suite}\n\n`;
        dashboard += `**Duration**: ${(test.duration / 1000).toFixed(2)}s\n\n`;
        if (test.failureMessages.length > 0) {
          dashboard += `**Error**:\n\`\`\`\n${test.failureMessages[0]}\n\`\`\`\n\n`;
        }
      });
    }
    
    // Historical Trends
    this.addHistoricalTrends(dashboard);
    
    fs.writeFileSync(dashboardFile, dashboard);
    
    console.log(`\n📊 Test metrics dashboard generated: ${dashboardFile}\n`);
  }

  addHistoricalTrends(dashboard) {
    const historyFile = path.join(this.metricsDir, 'test-history.json');
    
    if (!fs.existsSync(historyFile)) {
      return dashboard;
    }
    
    try {
      const history = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
      const recentRuns = history.runs.slice(-10);
      
      dashboard += `## 📉 Historical Trends (Last 10 Runs)\n\n`;
      dashboard += `| Date | Tests | Pass Rate | Duration | Coverage |\n`;
      dashboard += `|------|-------|-----------|----------|----------|\n`;
      
      recentRuns.forEach(run => {
        const date = new Date(run.timestamp).toLocaleDateString();
        const coverage = run.coverage ? `${run.coverage.lines.toFixed(1)}%` : 'N/A';
        dashboard += `| ${date} | ${run.summary.totalTests} | ${run.summary.passRate.toFixed(1)}% | ${(run.summary.totalDuration / 1000).toFixed(1)}s | ${coverage} |\n`;
      });
      
      dashboard += `\n`;
    } catch (error) {
      // Ignore errors
    }
    
    return dashboard;
  }
}

module.exports = MetricsReporter;
