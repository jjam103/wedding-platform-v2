#!/usr/bin/env node

/**
 * Generate Weekly Test Summary Report
 * 
 * Creates a comprehensive weekly summary of test metrics including:
 * - Pass rate trends
 * - Test execution time trends
 * - Coverage trends
 * - Top failing tests
 * - Top flaky tests
 * - Recommendations for improvement
 * 
 * Usage:
 *   npm run report:weekly
 *   node scripts/generate-weekly-test-report.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const METRICS_DIR = path.join(process.cwd(), 'test-results', 'metrics');
const REPORTS_DIR = path.join(METRICS_DIR, 'weekly-reports');

// Email configuration
const EMAIL_API_KEY = process.env.RESEND_API_KEY;
const REPORT_EMAIL = process.env.REPORT_EMAIL || 'dev-team@example.com';

/**
 * Load test history
 */
function loadTestHistory() {
  const historyFile = path.join(METRICS_DIR, 'test-history.json');
  
  if (!fs.existsSync(historyFile)) {
    console.error('❌ No test history found');
    process.exit(1);
  }
  
  return JSON.parse(fs.readFileSync(historyFile, 'utf8'));
}

/**
 * Get runs from the last 7 days
 */
function getWeeklyRuns(history) {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  return history.runs.filter(run => {
    const runDate = new Date(run.timestamp);
    return runDate >= oneWeekAgo;
  });
}

/**
 * Calculate weekly statistics
 */
function calculateWeeklyStats(weeklyRuns) {
  if (weeklyRuns.length === 0) {
    return null;
  }
  
  const stats = {
    totalRuns: weeklyRuns.length,
    avgPassRate: 0,
    avgDuration: 0,
    avgCoverage: 0,
    totalTests: weeklyRuns[weeklyRuns.length - 1].summary.totalTests,
    totalFailures: 0,
    uniqueFailures: new Set(),
    flakyTests: new Map(),
    slowTests: new Map(),
    passRateTrend: [],
    durationTrend: [],
    coverageTrend: [],
  };
  
  // Calculate averages and trends
  weeklyRuns.forEach(run => {
    stats.avgPassRate += run.summary.passRate;
    stats.avgDuration += run.summary.totalDuration;
    stats.totalFailures += run.summary.failedTests;
    
    if (run.coverage) {
      stats.avgCoverage += run.coverage.lines;
    }
    
    // Track trends
    stats.passRateTrend.push({
      date: new Date(run.timestamp).toLocaleDateString(),
      value: run.summary.passRate,
    });
    
    stats.durationTrend.push({
      date: new Date(run.timestamp).toLocaleDateString(),
      value: run.summary.totalDuration / 1000,
    });
    
    if (run.coverage) {
      stats.coverageTrend.push({
        date: new Date(run.timestamp).toLocaleDateString(),
        value: run.coverage.lines,
      });
    }
    
    // Track unique failures
    run.failedTests.forEach(test => {
      const key = `${test.suite}::${test.name}`;
      stats.uniqueFailures.add(key);
    });
    
    // Track flaky tests
    run.flakyTests.forEach(test => {
      const key = `${test.suite}::${test.name}`;
      const existing = stats.flakyTests.get(key) || { count: 0, rate: 0 };
      stats.flakyTests.set(key, {
        count: existing.count + 1,
        rate: Math.max(existing.rate, test.flakyRate),
        name: test.name,
        suite: test.suite,
      });
    });
    
    // Track slow tests
    run.slowTests.forEach(test => {
      const key = `${test.suite}::${test.name}`;
      const existing = stats.slowTests.get(key) || { count: 0, maxDuration: 0 };
      stats.slowTests.set(key, {
        count: existing.count + 1,
        maxDuration: Math.max(existing.maxDuration, test.duration),
        name: test.name,
        suite: test.suite,
      });
    });
  });
  
  // Calculate averages
  stats.avgPassRate /= weeklyRuns.length;
  stats.avgDuration /= weeklyRuns.length;
  stats.avgCoverage = stats.coverageTrend.length > 0
    ? stats.avgCoverage / stats.coverageTrend.length
    : 0;
  
  return stats;
}

/**
 * Compare with previous week
 */
function compareWithPreviousWeek(history, weeklyRuns) {
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  const previousWeekRuns = history.runs.filter(run => {
    const runDate = new Date(run.timestamp);
    return runDate >= twoWeeksAgo && runDate < oneWeekAgo;
  });
  
  if (previousWeekRuns.length === 0) {
    return null;
  }
  
  const currentStats = calculateWeeklyStats(weeklyRuns);
  const previousStats = calculateWeeklyStats(previousWeekRuns);
  
  return {
    passRate: {
      current: currentStats.avgPassRate,
      previous: previousStats.avgPassRate,
      change: currentStats.avgPassRate - previousStats.avgPassRate,
      trend: currentStats.avgPassRate > previousStats.avgPassRate ? '📈' : '📉',
    },
    duration: {
      current: currentStats.avgDuration,
      previous: previousStats.avgDuration,
      change: currentStats.avgDuration - previousStats.avgDuration,
      trend: currentStats.avgDuration < previousStats.avgDuration ? '⚡' : '🐌',
    },
    coverage: {
      current: currentStats.avgCoverage,
      previous: previousStats.avgCoverage,
      change: currentStats.avgCoverage - previousStats.avgCoverage,
      trend: currentStats.avgCoverage > previousStats.avgCoverage ? '📈' : '📉',
    },
    failures: {
      current: currentStats.totalFailures,
      previous: previousStats.totalFailures,
      change: currentStats.totalFailures - previousStats.totalFailures,
      trend: currentStats.totalFailures < previousStats.totalFailures ? '✅' : '⚠️',
    },
  };
}

/**
 * Generate recommendations
 */
function generateRecommendations(stats, comparison) {
  const recommendations = [];
  
  // Pass rate recommendations
  if (stats.avgPassRate < 95) {
    recommendations.push({
      priority: 'high',
      category: 'Quality',
      issue: `Average pass rate is ${stats.avgPassRate.toFixed(2)}% (target: 95%+)`,
      action: 'Focus on fixing failing tests this week',
      impact: 'Improve test reliability and catch bugs earlier',
    });
  }
  
  // Flaky test recommendations
  if (stats.flakyTests.size > 0) {
    const topFlaky = Array.from(stats.flakyTests.values())
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 3);
    
    recommendations.push({
      priority: 'high',
      category: 'Reliability',
      issue: `${stats.flakyTests.size} flaky tests detected`,
      action: `Fix top flaky tests: ${topFlaky.map(t => t.name).join(', ')}`,
      impact: 'Reduce false positives and improve developer confidence',
    });
  }
  
  // Performance recommendations
  if (stats.avgDuration > 300000) {
    recommendations.push({
      priority: 'medium',
      category: 'Performance',
      issue: `Average test duration is ${(stats.avgDuration / 1000 / 60).toFixed(2)} minutes`,
      action: 'Optimize slow tests or implement parallel execution',
      impact: 'Faster CI/CD feedback loop',
    });
  }
  
  // Slow test recommendations
  if (stats.slowTests.size > 10) {
    const topSlow = Array.from(stats.slowTests.values())
      .sort((a, b) => b.maxDuration - a.maxDuration)
      .slice(0, 3);
    
    recommendations.push({
      priority: 'medium',
      category: 'Performance',
      issue: `${stats.slowTests.size} slow tests (>5s)`,
      action: `Optimize: ${topSlow.map(t => t.name).join(', ')}`,
      impact: 'Reduce overall test execution time',
    });
  }
  
  // Coverage recommendations
  if (stats.avgCoverage > 0 && stats.avgCoverage < 85) {
    recommendations.push({
      priority: 'medium',
      category: 'Coverage',
      issue: `Average coverage is ${stats.avgCoverage.toFixed(2)}% (target: 85%+)`,
      action: 'Add tests for uncovered code paths',
      impact: 'Better bug detection and code quality',
    });
  }
  
  // Trend-based recommendations
  if (comparison) {
    if (comparison.passRate.change < -2) {
      recommendations.push({
        priority: 'high',
        category: 'Trend',
        issue: `Pass rate declined by ${Math.abs(comparison.passRate.change).toFixed(2)}%`,
        action: 'Investigate recent changes causing test failures',
        impact: 'Prevent further quality degradation',
      });
    }
    
    if (comparison.duration.change > 60000) {
      recommendations.push({
        priority: 'medium',
        category: 'Trend',
        issue: `Test duration increased by ${(comparison.duration.change / 1000).toFixed(1)}s`,
        action: 'Profile and optimize recently added tests',
        impact: 'Maintain fast CI/CD pipeline',
      });
    }
  }
  
  // Positive feedback
  if (recommendations.length === 0) {
    recommendations.push({
      priority: 'low',
      category: 'Success',
      issue: 'All metrics within target ranges',
      action: 'Continue maintaining high test quality',
      impact: 'Sustained high code quality and reliability',
    });
  }
  
  return recommendations;
}

/**
 * Generate markdown report
 */
function generateMarkdownReport(stats, comparison, recommendations) {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 7);
  
  let report = `# Weekly Test Report\n\n`;
  report += `**Period**: ${weekStart.toLocaleDateString()} - ${now.toLocaleDateString()}\n`;
  report += `**Generated**: ${now.toLocaleString()}\n\n`;
  
  // Executive Summary
  report += `## 📊 Executive Summary\n\n`;
  report += `| Metric | This Week | Last Week | Change |\n`;
  report += `|--------|-----------|-----------|--------|\n`;
  
  if (comparison) {
    report += `| Pass Rate | ${stats.avgPassRate.toFixed(2)}% | ${comparison.passRate.previous.toFixed(2)}% | ${comparison.passRate.trend} ${comparison.passRate.change >= 0 ? '+' : ''}${comparison.passRate.change.toFixed(2)}% |\n`;
    report += `| Duration | ${(stats.avgDuration / 1000).toFixed(1)}s | ${(comparison.duration.previous / 1000).toFixed(1)}s | ${comparison.duration.trend} ${comparison.duration.change >= 0 ? '+' : ''}${(comparison.duration.change / 1000).toFixed(1)}s |\n`;
    
    if (stats.avgCoverage > 0) {
      report += `| Coverage | ${stats.avgCoverage.toFixed(2)}% | ${comparison.coverage.previous.toFixed(2)}% | ${comparison.coverage.trend} ${comparison.coverage.change >= 0 ? '+' : ''}${comparison.coverage.change.toFixed(2)}% |\n`;
    }
    
    report += `| Total Failures | ${stats.totalFailures} | ${comparison.failures.previous} | ${comparison.failures.trend} ${comparison.failures.change >= 0 ? '+' : ''}${comparison.failures.change} |\n`;
  } else {
    report += `| Pass Rate | ${stats.avgPassRate.toFixed(2)}% | N/A | - |\n`;
    report += `| Duration | ${(stats.avgDuration / 1000).toFixed(1)}s | N/A | - |\n`;
    if (stats.avgCoverage > 0) {
      report += `| Coverage | ${stats.avgCoverage.toFixed(2)}% | N/A | - |\n`;
    }
    report += `| Total Failures | ${stats.totalFailures} | N/A | - |\n`;
  }
  
  report += `\n`;
  
  // Key Metrics
  report += `## 📈 Key Metrics\n\n`;
  report += `- **Test Runs**: ${stats.totalRuns} runs this week\n`;
  report += `- **Total Tests**: ${stats.totalTests} tests\n`;
  report += `- **Unique Failures**: ${stats.uniqueFailures.size} different tests failed\n`;
  report += `- **Flaky Tests**: ${stats.flakyTests.size} tests showing flaky behavior\n`;
  report += `- **Slow Tests**: ${stats.slowTests.size} tests taking >5 seconds\n\n`;
  
  // Top Issues
  if (stats.flakyTests.size > 0) {
    report += `## 🔄 Top Flaky Tests\n\n`;
    report += `| Test | Flaky Rate | Occurrences |\n`;
    report += `|------|------------|-------------|\n`;
    
    const topFlaky = Array.from(stats.flakyTests.values())
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 10);
    
    topFlaky.forEach(test => {
      report += `| ${test.name} | ${test.rate.toFixed(1)}% | ${test.count} |\n`;
    });
    
    report += `\n`;
  }
  
  if (stats.slowTests.size > 0) {
    report += `## 🐌 Slowest Tests\n\n`;
    report += `| Test | Max Duration | Occurrences |\n`;
    report += `|------|--------------|-------------|\n`;
    
    const topSlow = Array.from(stats.slowTests.values())
      .sort((a, b) => b.maxDuration - a.maxDuration)
      .slice(0, 10);
    
    topSlow.forEach(test => {
      report += `| ${test.name} | ${(test.maxDuration / 1000).toFixed(2)}s | ${test.count} |\n`;
    });
    
    report += `\n`;
  }
  
  // Recommendations
  report += `## 💡 Recommendations\n\n`;
  
  const highPriority = recommendations.filter(r => r.priority === 'high');
  const mediumPriority = recommendations.filter(r => r.priority === 'medium');
  const lowPriority = recommendations.filter(r => r.priority === 'low');
  
  if (highPriority.length > 0) {
    report += `### 🔴 High Priority\n\n`;
    highPriority.forEach((rec, i) => {
      report += `${i + 1}. **${rec.category}**: ${rec.issue}\n`;
      report += `   - **Action**: ${rec.action}\n`;
      report += `   - **Impact**: ${rec.impact}\n\n`;
    });
  }
  
  if (mediumPriority.length > 0) {
    report += `### 🟡 Medium Priority\n\n`;
    mediumPriority.forEach((rec, i) => {
      report += `${i + 1}. **${rec.category}**: ${rec.issue}\n`;
      report += `   - **Action**: ${rec.action}\n`;
      report += `   - **Impact**: ${rec.impact}\n\n`;
    });
  }
  
  if (lowPriority.length > 0) {
    report += `### 🟢 Low Priority\n\n`;
    lowPriority.forEach((rec, i) => {
      report += `${i + 1}. **${rec.category}**: ${rec.issue}\n`;
      report += `   - **Action**: ${rec.action}\n`;
      report += `   - **Impact**: ${rec.impact}\n\n`;
    });
  }
  
  // Trends
  report += `## 📉 Trends\n\n`;
  report += `### Pass Rate Trend\n\n`;
  report += `| Date | Pass Rate |\n`;
  report += `|------|----------|\n`;
  stats.passRateTrend.forEach(point => {
    report += `| ${point.date} | ${point.value.toFixed(2)}% |\n`;
  });
  report += `\n`;
  
  report += `### Duration Trend\n\n`;
  report += `| Date | Duration |\n`;
  report += `|------|----------|\n`;
  stats.durationTrend.forEach(point => {
    report += `| ${point.date} | ${point.value.toFixed(1)}s |\n`;
  });
  report += `\n`;
  
  if (stats.coverageTrend.length > 0) {
    report += `### Coverage Trend\n\n`;
    report += `| Date | Coverage |\n`;
    report += `|------|----------|\n`;
    stats.coverageTrend.forEach(point => {
      report += `| ${point.date} | ${point.value.toFixed(2)}% |\n`;
    });
    report += `\n`;
  }
  
  // Footer
  report += `---\n\n`;
  report += `**Next Report**: ${new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}\n`;
  report += `**View Detailed Metrics**: \`test-results/metrics/DASHBOARD.md\`\n`;
  
  return report;
}

/**
 * Generate HTML email report
 */
function generateHTMLReport(stats, comparison, recommendations) {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 7);
  
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        h1 { color: #2c3e50; }
        h2 { color: #34495e; border-bottom: 2px solid #3498db; padding-bottom: 5px; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #3498db; color: white; }
        tr:nth-child(even) { background-color: #f2f2f2; }
        .metric { display: inline-block; margin: 10px 20px 10px 0; }
        .metric-value { font-size: 24px; font-weight: bold; color: #3498db; }
        .metric-label { font-size: 14px; color: #7f8c8d; }
        .priority-high { color: #e74c3c; font-weight: bold; }
        .priority-medium { color: #f39c12; font-weight: bold; }
        .priority-low { color: #27ae60; font-weight: bold; }
        .trend-up { color: #27ae60; }
        .trend-down { color: #e74c3c; }
      </style>
    </head>
    <body>
      <h1>📊 Weekly Test Report</h1>
      <p><strong>Period:</strong> ${weekStart.toLocaleDateString()} - ${now.toLocaleDateString()}</p>
      
      <h2>Executive Summary</h2>
      <div>
        <div class="metric">
          <div class="metric-value">${stats.avgPassRate.toFixed(1)}%</div>
          <div class="metric-label">Pass Rate</div>
        </div>
        <div class="metric">
          <div class="metric-value">${(stats.avgDuration / 1000).toFixed(1)}s</div>
          <div class="metric-label">Avg Duration</div>
        </div>
        <div class="metric">
          <div class="metric-value">${stats.totalRuns}</div>
          <div class="metric-label">Test Runs</div>
        </div>
        <div class="metric">
          <div class="metric-value">${stats.flakyTests.size}</div>
          <div class="metric-label">Flaky Tests</div>
        </div>
      </div>
  `;
  
  if (comparison) {
    html += `
      <h2>Week-over-Week Comparison</h2>
      <table>
        <tr>
          <th>Metric</th>
          <th>This Week</th>
          <th>Last Week</th>
          <th>Change</th>
        </tr>
        <tr>
          <td>Pass Rate</td>
          <td>${stats.avgPassRate.toFixed(2)}%</td>
          <td>${comparison.passRate.previous.toFixed(2)}%</td>
          <td class="${comparison.passRate.change >= 0 ? 'trend-up' : 'trend-down'}">
            ${comparison.passRate.change >= 0 ? '+' : ''}${comparison.passRate.change.toFixed(2)}%
          </td>
        </tr>
        <tr>
          <td>Duration</td>
          <td>${(stats.avgDuration / 1000).toFixed(1)}s</td>
          <td>${(comparison.duration.previous / 1000).toFixed(1)}s</td>
          <td class="${comparison.duration.change <= 0 ? 'trend-up' : 'trend-down'}">
            ${comparison.duration.change >= 0 ? '+' : ''}${(comparison.duration.change / 1000).toFixed(1)}s
          </td>
        </tr>
      </table>
    `;
  }
  
  // Recommendations
  html += `<h2>💡 Recommendations</h2>`;
  
  const highPriority = recommendations.filter(r => r.priority === 'high');
  const mediumPriority = recommendations.filter(r => r.priority === 'medium');
  
  if (highPriority.length > 0) {
    html += `<h3 class="priority-high">🔴 High Priority</h3><ul>`;
    highPriority.forEach(rec => {
      html += `<li><strong>${rec.category}</strong>: ${rec.issue}<br>`;
      html += `<em>Action: ${rec.action}</em></li>`;
    });
    html += `</ul>`;
  }
  
  if (mediumPriority.length > 0) {
    html += `<h3 class="priority-medium">🟡 Medium Priority</h3><ul>`;
    mediumPriority.forEach(rec => {
      html += `<li><strong>${rec.category}</strong>: ${rec.issue}<br>`;
      html += `<em>Action: ${rec.action}</em></li>`;
    });
    html += `</ul>`;
  }
  
  // Top flaky tests
  if (stats.flakyTests.size > 0) {
    html += `<h2>🔄 Top Flaky Tests</h2><table>`;
    html += `<tr><th>Test</th><th>Flaky Rate</th><th>Occurrences</th></tr>`;
    
    const topFlaky = Array.from(stats.flakyTests.values())
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 5);
    
    topFlaky.forEach(test => {
      html += `<tr><td>${test.name}</td><td>${test.rate.toFixed(1)}%</td><td>${test.count}</td></tr>`;
    });
    
    html += `</table>`;
  }
  
  html += `
      <hr>
      <p><small>Next report: ${new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}</small></p>
    </body>
    </html>
  `;
  
  return html;
}

/**
 * Send email report
 */
async function sendEmailReport(html, stats) {
  if (!EMAIL_API_KEY) {
    console.log('⚠️  Email API key not configured (RESEND_API_KEY)');
    return false;
  }
  
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${EMAIL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Test Reports <reports@yourdomain.com>',
        to: REPORT_EMAIL,
        subject: `📊 Weekly Test Report - Pass Rate: ${stats.avgPassRate.toFixed(1)}%`,
        html,
      }),
    });
    
    if (response.ok) {
      console.log('✅ Email report sent');
      return true;
    } else {
      const error = await response.text();
      console.error('❌ Failed to send email:', error);
      return false;
    }
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    return false;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('📊 Generating Weekly Test Report\n');
  
  // Ensure reports directory exists
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }
  
  // Load data
  const history = loadTestHistory();
  const weeklyRuns = getWeeklyRuns(history);
  
  if (weeklyRuns.length === 0) {
    console.error('❌ No test runs in the last 7 days');
    process.exit(1);
  }
  
  console.log(`✅ Found ${weeklyRuns.length} test runs this week\n`);
  
  // Calculate statistics
  const stats = calculateWeeklyStats(weeklyRuns);
  const comparison = compareWithPreviousWeek(history, weeklyRuns);
  const recommendations = generateRecommendations(stats, comparison);
  
  // Generate reports
  const markdownReport = generateMarkdownReport(stats, comparison, recommendations);
  const htmlReport = generateHTMLReport(stats, comparison, recommendations);
  
  // Save markdown report
  const timestamp = new Date().toISOString().split('T')[0];
  const reportFile = path.join(REPORTS_DIR, `weekly-report-${timestamp}.md`);
  fs.writeFileSync(reportFile, markdownReport);
  console.log(`✅ Markdown report saved: ${reportFile}`);
  
  // Save latest report
  const latestFile = path.join(REPORTS_DIR, 'latest.md');
  fs.writeFileSync(latestFile, markdownReport);
  console.log(`✅ Latest report updated: ${latestFile}`);
  
  // Send email
  const emailSent = await sendEmailReport(htmlReport, stats);
  
  // Print summary
  console.log('\n📋 Report Summary:');
  console.log(`   Pass Rate: ${stats.avgPassRate.toFixed(2)}%`);
  console.log(`   Duration: ${(stats.avgDuration / 1000).toFixed(1)}s`);
  console.log(`   Test Runs: ${stats.totalRuns}`);
  console.log(`   Flaky Tests: ${stats.flakyTests.size}`);
  console.log(`   Recommendations: ${recommendations.length}`);
  
  if (emailSent) {
    console.log(`   Email: Sent to ${REPORT_EMAIL}`);
  }
  
  console.log('\n✅ Weekly report generation complete');
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
