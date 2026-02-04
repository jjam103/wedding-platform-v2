#!/usr/bin/env node

/**
 * Generate Comprehensive Test Metrics Report
 * 
 * Analyzes test metrics history and generates:
 * - Trend analysis
 * - Performance insights
 * - Flaky test detection
 * - Coverage trends
 * - Recommendations
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const METRICS_DIR = path.join(process.cwd(), 'test-results', 'metrics');
const REPORT_FILE = path.join(METRICS_DIR, 'COMPREHENSIVE_REPORT.md');

function loadMetrics() {
  const historyFile = path.join(METRICS_DIR, 'test-history.json');
  
  if (!fs.existsSync(historyFile)) {
    console.error('❌ No test history found. Run tests first to generate metrics.');
    process.exit(1);
  }
  
  const history = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
  return history.runs;
}

function calculateTrends(runs) {
  if (runs.length < 2) {
    return null;
  }
  
  const recent = runs.slice(-5);
  const older = runs.slice(-10, -5);
  
  const avgRecent = {
    passRate: recent.reduce((sum, r) => sum + r.summary.passRate, 0) / recent.length,
    duration: recent.reduce((sum, r) => sum + r.summary.totalDuration, 0) / recent.length,
    coverage: recent
      .filter(r => r.coverage)
      .reduce((sum, r) => sum + r.coverage.lines, 0) / recent.filter(r => r.coverage).length,
  };
  
  const avgOlder = {
    passRate: older.reduce((sum, r) => sum + r.summary.passRate, 0) / older.length,
    duration: older.reduce((sum, r) => sum + r.summary.totalDuration, 0) / older.length,
    coverage: older
      .filter(r => r.coverage)
      .reduce((sum, r) => sum + r.coverage.lines, 0) / older.filter(r => r.coverage).length,
  };
  
  return {
    passRate: {
      current: avgRecent.passRate,
      previous: avgOlder.passRate,
      change: avgRecent.passRate - avgOlder.passRate,
      trend: avgRecent.passRate > avgOlder.passRate ? '📈 Improving' : '📉 Declining',
    },
    duration: {
      current: avgRecent.duration,
      previous: avgOlder.duration,
      change: avgRecent.duration - avgOlder.duration,
      trend: avgRecent.duration < avgOlder.duration ? '⚡ Faster' : '🐌 Slower',
    },
    coverage: {
      current: avgRecent.coverage,
      previous: avgOlder.coverage,
      change: avgRecent.coverage - avgOlder.coverage,
      trend: avgRecent.coverage > avgOlder.coverage ? '📈 Improving' : '📉 Declining',
    },
  };
}

function identifyProblemAreas(runs) {
  const latest = runs[runs.length - 1];
  const problems = [];
  
  // Low pass rate
  if (latest.summary.passRate < 95) {
    problems.push({
      severity: 'high',
      area: 'Pass Rate',
      issue: `Pass rate is ${latest.summary.passRate.toFixed(2)}% (target: 95%+)`,
      recommendation: 'Investigate and fix failing tests immediately',
    });
  }
  
  // Slow tests
  if (latest.slowTests.length > 10) {
    problems.push({
      severity: 'medium',
      area: 'Performance',
      issue: `${latest.slowTests.length} tests taking >5 seconds`,
      recommendation: 'Optimize slow tests or split into smaller units',
    });
  }
  
  // Flaky tests
  if (latest.flakyTests.length > 0) {
    problems.push({
      severity: 'high',
      area: 'Reliability',
      issue: `${latest.flakyTests.length} flaky tests detected`,
      recommendation: 'Fix flaky tests to improve reliability',
    });
  }
  
  // Low coverage
  if (latest.coverage && latest.coverage.lines < 85) {
    problems.push({
      severity: 'medium',
      area: 'Coverage',
      issue: `Line coverage is ${latest.coverage.lines.toFixed(2)}% (target: 85%+)`,
      recommendation: 'Add tests for uncovered code paths',
    });
  }
  
  // Long total duration
  if (latest.summary.totalDuration > 300000) { // 5 minutes
    problems.push({
      severity: 'medium',
      area: 'CI/CD Speed',
      issue: `Test suite takes ${(latest.summary.totalDuration / 1000 / 60).toFixed(2)} minutes`,
      recommendation: 'Consider parallel execution or selective test running',
    });
  }
  
  return problems;
}

function generateRecommendations(runs, problems) {
  const recommendations = [];
  
  // Based on problems
  problems.forEach(problem => {
    recommendations.push({
      priority: problem.severity,
      action: problem.recommendation,
      reason: problem.issue,
    });
  });
  
  // Based on trends
  const trends = calculateTrends(runs);
  if (trends) {
    if (trends.passRate.change < -5) {
      recommendations.push({
        priority: 'high',
        action: 'Investigate recent test failures',
        reason: `Pass rate declined by ${Math.abs(trends.passRate.change).toFixed(2)}%`,
      });
    }
    
    if (trends.duration.change > 30000) {
      recommendations.push({
        priority: 'medium',
        action: 'Optimize test performance',
        reason: `Test duration increased by ${(trends.duration.change / 1000).toFixed(2)}s`,
      });
    }
  }
  
  // General recommendations
  if (recommendations.length === 0) {
    recommendations.push({
      priority: 'low',
      action: 'Maintain current test quality',
      reason: 'All metrics are within acceptable ranges',
    });
  }
  
  return recommendations;
}

function generateReport(runs) {
  const latest = runs[runs.length - 1];
  const trends = calculateTrends(runs);
  const problems = identifyProblemAreas(runs);
  const recommendations = generateRecommendations(runs, problems);
  
  let report = `# Comprehensive Test Metrics Report\n\n`;
  report += `**Generated**: ${new Date().toLocaleString()}\n`;
  report += `**Analysis Period**: Last ${runs.length} test runs\n\n`;
  
  // Executive Summary
  report += `## 📋 Executive Summary\n\n`;
  report += `| Metric | Current | Status |\n`;
  report += `|--------|---------|--------|\n`;
  report += `| Total Tests | ${latest.summary.totalTests} | ✅ |\n`;
  report += `| Pass Rate | ${latest.summary.passRate.toFixed(2)}% | ${latest.summary.passRate >= 95 ? '✅' : '⚠️'} |\n`;
  report += `| Duration | ${(latest.summary.totalDuration / 1000).toFixed(2)}s | ${latest.summary.totalDuration < 300000 ? '✅' : '⚠️'} |\n`;
  
  if (latest.coverage) {
    report += `| Coverage | ${latest.coverage.lines.toFixed(2)}% | ${latest.coverage.lines >= 85 ? '✅' : '⚠️'} |\n`;
  }
  
  report += `| Flaky Tests | ${latest.flakyTests.length} | ${latest.flakyTests.length === 0 ? '✅' : '⚠️'} |\n`;
  report += `| Slow Tests | ${latest.slowTests.length} | ${latest.slowTests.length < 10 ? '✅' : '⚠️'} |\n\n`;
  
  // Trends
  if (trends) {
    report += `## 📊 Trends (Last 10 Runs)\n\n`;
    report += `### Pass Rate\n`;
    report += `- **Current Average**: ${trends.passRate.current.toFixed(2)}%\n`;
    report += `- **Previous Average**: ${trends.passRate.previous.toFixed(2)}%\n`;
    report += `- **Change**: ${trends.passRate.change >= 0 ? '+' : ''}${trends.passRate.change.toFixed(2)}%\n`;
    report += `- **Trend**: ${trends.passRate.trend}\n\n`;
    
    report += `### Execution Time\n`;
    report += `- **Current Average**: ${(trends.duration.current / 1000).toFixed(2)}s\n`;
    report += `- **Previous Average**: ${(trends.duration.previous / 1000).toFixed(2)}s\n`;
    report += `- **Change**: ${trends.duration.change >= 0 ? '+' : ''}${(trends.duration.change / 1000).toFixed(2)}s\n`;
    report += `- **Trend**: ${trends.duration.trend}\n\n`;
    
    if (!isNaN(trends.coverage.current)) {
      report += `### Coverage\n`;
      report += `- **Current Average**: ${trends.coverage.current.toFixed(2)}%\n`;
      report += `- **Previous Average**: ${trends.coverage.previous.toFixed(2)}%\n`;
      report += `- **Change**: ${trends.coverage.change >= 0 ? '+' : ''}${trends.coverage.change.toFixed(2)}%\n`;
      report += `- **Trend**: ${trends.coverage.trend}\n\n`;
    }
  }
  
  // Problem Areas
  if (problems.length > 0) {
    report += `## ⚠️ Problem Areas\n\n`;
    problems.forEach(problem => {
      const icon = problem.severity === 'high' ? '🔴' : problem.severity === 'medium' ? '🟡' : '🟢';
      report += `### ${icon} ${problem.area} (${problem.severity.toUpperCase()})\n`;
      report += `**Issue**: ${problem.issue}\n\n`;
      report += `**Recommendation**: ${problem.recommendation}\n\n`;
    });
  }
  
  // Recommendations
  report += `## 💡 Recommendations\n\n`;
  const highPriority = recommendations.filter(r => r.priority === 'high');
  const mediumPriority = recommendations.filter(r => r.priority === 'medium');
  const lowPriority = recommendations.filter(r => r.priority === 'low');
  
  if (highPriority.length > 0) {
    report += `### 🔴 High Priority\n\n`;
    highPriority.forEach((rec, i) => {
      report += `${i + 1}. **${rec.action}**\n`;
      report += `   - Reason: ${rec.reason}\n\n`;
    });
  }
  
  if (mediumPriority.length > 0) {
    report += `### 🟡 Medium Priority\n\n`;
    mediumPriority.forEach((rec, i) => {
      report += `${i + 1}. **${rec.action}**\n`;
      report += `   - Reason: ${rec.reason}\n\n`;
    });
  }
  
  if (lowPriority.length > 0) {
    report += `### 🟢 Low Priority\n\n`;
    lowPriority.forEach((rec, i) => {
      report += `${i + 1}. **${rec.action}**\n`;
      report += `   - Reason: ${rec.reason}\n\n`;
    });
  }
  
  // Detailed Metrics
  report += `## 📈 Detailed Metrics\n\n`;
  
  // Test Suite Breakdown
  report += `### Test Suite Breakdown\n\n`;
  report += `| Suite | Tests | Pass Rate | Duration |\n`;
  report += `|-------|-------|-----------|----------|\n`;
  
  const suiteStats = latest.suites
    .map(suite => ({
      path: suite.path,
      tests: suite.numTests,
      passRate: suite.numTests > 0 ? (suite.numPassed / suite.numTests) * 100 : 0,
      duration: suite.duration,
    }))
    .sort((a, b) => b.duration - a.duration)
    .slice(0, 20);
  
  suiteStats.forEach(suite => {
    report += `| ${suite.path} | ${suite.tests} | ${suite.passRate.toFixed(1)}% | ${(suite.duration / 1000).toFixed(2)}s |\n`;
  });
  
  report += `\n`;
  
  // Historical Data
  report += `### Historical Data\n\n`;
  report += `| Date | Tests | Passed | Failed | Pass Rate | Duration | Coverage |\n`;
  report += `|------|-------|--------|--------|-----------|----------|----------|\n`;
  
  runs.slice(-15).forEach(run => {
    const date = new Date(run.timestamp).toLocaleDateString();
    const coverage = run.coverage ? `${run.coverage.lines.toFixed(1)}%` : 'N/A';
    report += `| ${date} | ${run.summary.totalTests} | ${run.summary.passedTests} | ${run.summary.failedTests} | ${run.summary.passRate.toFixed(1)}% | ${(run.summary.totalDuration / 1000).toFixed(1)}s | ${coverage} |\n`;
  });
  
  report += `\n`;
  
  // Footer
  report += `---\n\n`;
  report += `**Next Steps**:\n`;
  report += `1. Review high-priority recommendations\n`;
  report += `2. Fix flaky tests to improve reliability\n`;
  report += `3. Optimize slow tests for faster CI/CD\n`;
  report += `4. Monitor trends and adjust as needed\n\n`;
  report += `**View Dashboard**: \`test-results/metrics/DASHBOARD.md\`\n`;
  report += `**View Metrics**: \`test-results/metrics/latest.json\`\n`;
  
  return report;
}

function main() {
  console.log('📊 Generating comprehensive test metrics report...\n');
  
  // Ensure metrics directory exists
  if (!fs.existsSync(METRICS_DIR)) {
    fs.mkdirSync(METRICS_DIR, { recursive: true });
  }
  
  // Load metrics
  const runs = loadMetrics();
  console.log(`✅ Loaded ${runs.length} test runs\n`);
  
  // Generate report
  const report = generateReport(runs);
  fs.writeFileSync(REPORT_FILE, report);
  
  console.log(`✅ Report generated: ${REPORT_FILE}\n`);
  
  // Print summary
  const latest = runs[runs.length - 1];
  console.log('📋 Summary:');
  console.log(`   Tests: ${latest.summary.totalTests}`);
  console.log(`   Pass Rate: ${latest.summary.passRate.toFixed(2)}%`);
  console.log(`   Duration: ${(latest.summary.totalDuration / 1000).toFixed(2)}s`);
  if (latest.coverage) {
    console.log(`   Coverage: ${latest.coverage.lines.toFixed(2)}%`);
  }
  console.log(`   Flaky Tests: ${latest.flakyTests.length}`);
  console.log(`   Slow Tests: ${latest.slowTests.length}\n`);
}

main();
