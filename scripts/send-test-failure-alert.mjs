#!/usr/bin/env node

/**
 * Send Test Failure Alerts
 * 
 * Sends notifications for test failures via:
 * - Slack webhooks (real-time critical failures)
 * - Email (recurring issues)
 * - GitHub Issues (persistent failures)
 * 
 * Usage:
 *   npm run alert:test-failure
 *   node scripts/send-test-failure-alert.mjs --severity=high
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const METRICS_DIR = path.join(process.cwd(), 'test-results', 'metrics');
const ALERTS_DIR = path.join(METRICS_DIR, 'alerts');

// Configuration from environment variables
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
const EMAIL_API_KEY = process.env.RESEND_API_KEY;
const ALERT_EMAIL = process.env.ALERT_EMAIL || 'dev-team@example.com';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPOSITORY;

// Alert thresholds
const THRESHOLDS = {
  CRITICAL_PASS_RATE: 90, // Alert if pass rate drops below 90%
  WARNING_PASS_RATE: 95,  // Warning if pass rate drops below 95%
  MAX_FLAKY_TESTS: 3,     // Alert if more than 3 flaky tests
  MAX_SLOW_TESTS: 10,     // Alert if more than 10 slow tests
  MAX_DURATION: 300000,   // Alert if tests take >5 minutes
};

/**
 * Load latest test metrics
 */
function loadLatestMetrics() {
  const latestFile = path.join(METRICS_DIR, 'latest.json');
  
  if (!fs.existsSync(latestFile)) {
    console.error('❌ No test metrics found. Run tests first.');
    process.exit(1);
  }
  
  return JSON.parse(fs.readFileSync(latestFile, 'utf8'));
}

/**
 * Load test history for trend analysis
 */
function loadTestHistory() {
  const historyFile = path.join(METRICS_DIR, 'test-history.json');
  
  if (!fs.existsSync(historyFile)) {
    return { runs: [] };
  }
  
  return JSON.parse(fs.readFileSync(historyFile, 'utf8'));
}

/**
 * Determine alert severity based on metrics
 */
function determineAlertSeverity(metrics) {
  const issues = [];
  
  // Critical: Pass rate below 90%
  if (metrics.summary.passRate < THRESHOLDS.CRITICAL_PASS_RATE) {
    issues.push({
      severity: 'critical',
      type: 'pass_rate',
      message: `Pass rate critically low: ${metrics.summary.passRate.toFixed(2)}%`,
      threshold: THRESHOLDS.CRITICAL_PASS_RATE,
      actual: metrics.summary.passRate,
    });
  }
  // Warning: Pass rate below 95%
  else if (metrics.summary.passRate < THRESHOLDS.WARNING_PASS_RATE) {
    issues.push({
      severity: 'warning',
      type: 'pass_rate',
      message: `Pass rate below target: ${metrics.summary.passRate.toFixed(2)}%`,
      threshold: THRESHOLDS.WARNING_PASS_RATE,
      actual: metrics.summary.passRate,
    });
  }
  
  // Critical: Multiple flaky tests
  if (metrics.flakyTests.length > THRESHOLDS.MAX_FLAKY_TESTS) {
    issues.push({
      severity: 'critical',
      type: 'flaky_tests',
      message: `${metrics.flakyTests.length} flaky tests detected`,
      threshold: THRESHOLDS.MAX_FLAKY_TESTS,
      actual: metrics.flakyTests.length,
      details: metrics.flakyTests.slice(0, 5).map(t => t.name),
    });
  }
  
  // Warning: Many slow tests
  if (metrics.slowTests.length > THRESHOLDS.MAX_SLOW_TESTS) {
    issues.push({
      severity: 'warning',
      type: 'slow_tests',
      message: `${metrics.slowTests.length} slow tests (>5s)`,
      threshold: THRESHOLDS.MAX_SLOW_TESTS,
      actual: metrics.slowTests.length,
    });
  }
  
  // Warning: Test suite too slow
  if (metrics.summary.totalDuration > THRESHOLDS.MAX_DURATION) {
    issues.push({
      severity: 'warning',
      type: 'duration',
      message: `Test suite taking ${(metrics.summary.totalDuration / 1000 / 60).toFixed(2)} minutes`,
      threshold: THRESHOLDS.MAX_DURATION / 1000 / 60,
      actual: metrics.summary.totalDuration / 1000 / 60,
    });
  }
  
  // Critical: Any failed tests
  if (metrics.failedTests.length > 0) {
    issues.push({
      severity: 'critical',
      type: 'failed_tests',
      message: `${metrics.failedTests.length} tests failing`,
      actual: metrics.failedTests.length,
      details: metrics.failedTests.slice(0, 5).map(t => ({
        name: t.name,
        suite: t.suite,
        error: t.failureMessages[0]?.split('\n')[0] || 'Unknown error',
      })),
    });
  }
  
  return issues;
}

/**
 * Check for recurring issues
 */
function checkRecurringIssues(history) {
  if (history.runs.length < 3) {
    return [];
  }
  
  const recentRuns = history.runs.slice(-5);
  const recurringIssues = [];
  
  // Check for consistently failing tests
  const failingTests = new Map();
  recentRuns.forEach(run => {
    run.failedTests.forEach(test => {
      const key = `${test.suite}::${test.name}`;
      failingTests.set(key, (failingTests.get(key) || 0) + 1);
    });
  });
  
  failingTests.forEach((count, testKey) => {
    if (count >= 3) {
      const [suite, name] = testKey.split('::');
      recurringIssues.push({
        type: 'recurring_failure',
        message: `Test failing in ${count} of last 5 runs`,
        test: name,
        suite: suite,
        occurrences: count,
      });
    }
  });
  
  // Check for declining pass rate trend
  const passRates = recentRuns.map(r => r.summary.passRate);
  const isDecline = passRates.every((rate, i) => i === 0 || rate <= passRates[i - 1]);
  
  if (isDecline && passRates[0] - passRates[passRates.length - 1] > 5) {
    recurringIssues.push({
      type: 'declining_trend',
      message: `Pass rate declining: ${passRates[0].toFixed(1)}% → ${passRates[passRates.length - 1].toFixed(1)}%`,
      decline: passRates[0] - passRates[passRates.length - 1],
    });
  }
  
  return recurringIssues;
}

/**
 * Send Slack notification
 */
async function sendSlackAlert(issues, metrics, recurringIssues) {
  if (!SLACK_WEBHOOK_URL) {
    console.log('⚠️  Slack webhook not configured (SLACK_WEBHOOK_URL)');
    return false;
  }
  
  const criticalIssues = issues.filter(i => i.severity === 'critical');
  const warningIssues = issues.filter(i => i.severity === 'warning');
  
  // Build Slack message
  const blocks = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: criticalIssues.length > 0 ? '🚨 Critical Test Failures' : '⚠️ Test Suite Warnings',
        emoji: true,
      },
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Pass Rate:*\n${metrics.summary.passRate.toFixed(2)}%`,
        },
        {
          type: 'mrkdwn',
          text: `*Failed Tests:*\n${metrics.failedTests.length}`,
        },
        {
          type: 'mrkdwn',
          text: `*Flaky Tests:*\n${metrics.flakyTests.length}`,
        },
        {
          type: 'mrkdwn',
          text: `*Duration:*\n${(metrics.summary.totalDuration / 1000).toFixed(1)}s`,
        },
      ],
    },
  ];
  
  // Add critical issues
  if (criticalIssues.length > 0) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '*🔴 Critical Issues:*',
      },
    });
    
    criticalIssues.forEach(issue => {
      let text = `• ${issue.message}`;
      if (issue.details) {
        text += `\n  ${issue.details.slice(0, 3).map(d => typeof d === 'string' ? d : d.name).join('\n  ')}`;
      }
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text,
        },
      });
    });
  }
  
  // Add warning issues
  if (warningIssues.length > 0) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '*🟡 Warnings:*',
      },
    });
    
    warningIssues.forEach(issue => {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `• ${issue.message}`,
        },
      });
    });
  }
  
  // Add recurring issues
  if (recurringIssues.length > 0) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '*🔄 Recurring Issues:*',
      },
    });
    
    recurringIssues.slice(0, 3).forEach(issue => {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `• ${issue.message}`,
        },
      });
    });
  }
  
  // Add action buttons
  const ciUrl = process.env.GITHUB_SERVER_URL && process.env.GITHUB_REPOSITORY && process.env.GITHUB_RUN_ID
    ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
    : null;
  
  if (ciUrl) {
    blocks.push({
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'View CI Run',
            emoji: true,
          },
          url: ciUrl,
          style: 'primary',
        },
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'View Metrics',
            emoji: true,
          },
          url: `${ciUrl}/artifacts`,
        },
      ],
    });
  }
  
  // Send to Slack
  try {
    const response = await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blocks }),
    });
    
    if (response.ok) {
      console.log('✅ Slack notification sent');
      return true;
    } else {
      console.error('❌ Failed to send Slack notification:', response.statusText);
      return false;
    }
  } catch (error) {
    console.error('❌ Error sending Slack notification:', error.message);
    return false;
  }
}

/**
 * Send email alert for recurring issues
 */
async function sendEmailAlert(recurringIssues, metrics) {
  if (!EMAIL_API_KEY) {
    console.log('⚠️  Email API key not configured (RESEND_API_KEY)');
    return false;
  }
  
  if (recurringIssues.length === 0) {
    console.log('ℹ️  No recurring issues to email');
    return false;
  }
  
  // Build email HTML
  let html = `
    <h2>🔄 Recurring Test Issues Detected</h2>
    <p>The following issues have been detected in multiple recent test runs:</p>
    <ul>
  `;
  
  recurringIssues.forEach(issue => {
    html += `<li><strong>${issue.type}</strong>: ${issue.message}`;
    if (issue.test) {
      html += `<br><code>${issue.suite} :: ${issue.test}</code>`;
    }
    html += `</li>`;
  });
  
  html += `
    </ul>
    <h3>Current Test Metrics</h3>
    <table border="1" cellpadding="5" cellspacing="0">
      <tr><td><strong>Pass Rate</strong></td><td>${metrics.summary.passRate.toFixed(2)}%</td></tr>
      <tr><td><strong>Failed Tests</strong></td><td>${metrics.failedTests.length}</td></tr>
      <tr><td><strong>Flaky Tests</strong></td><td>${metrics.flakyTests.length}</td></tr>
      <tr><td><strong>Duration</strong></td><td>${(metrics.summary.totalDuration / 1000).toFixed(1)}s</td></tr>
    </table>
    <p><strong>Action Required:</strong> Please investigate and fix these recurring issues to improve test reliability.</p>
  `;
  
  // Send via Resend API
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${EMAIL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Test Alerts <alerts@yourdomain.com>',
        to: ALERT_EMAIL,
        subject: `🔄 Recurring Test Issues Detected (${recurringIssues.length} issues)`,
        html,
      }),
    });
    
    if (response.ok) {
      console.log('✅ Email alert sent');
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
 * Create GitHub issue for persistent failures
 */
async function createGitHubIssue(recurringIssues, metrics) {
  if (!GITHUB_TOKEN || !GITHUB_REPO) {
    console.log('⚠️  GitHub integration not configured (GITHUB_TOKEN, GITHUB_REPOSITORY)');
    return false;
  }
  
  const persistentIssues = recurringIssues.filter(i => i.occurrences >= 4);
  
  if (persistentIssues.length === 0) {
    console.log('ℹ️  No persistent issues requiring GitHub issue');
    return false;
  }
  
  // Build issue body
  let body = `## 🔴 Persistent Test Failures\n\n`;
  body += `The following tests have been failing consistently:\n\n`;
  
  persistentIssues.forEach(issue => {
    body += `### ${issue.test}\n\n`;
    body += `- **Suite**: \`${issue.suite}\`\n`;
    body += `- **Failures**: ${issue.occurrences} of last 5 runs\n`;
    body += `- **Status**: Requires immediate attention\n\n`;
  });
  
  body += `## Current Metrics\n\n`;
  body += `| Metric | Value |\n`;
  body += `|--------|-------|\n`;
  body += `| Pass Rate | ${metrics.summary.passRate.toFixed(2)}% |\n`;
  body += `| Failed Tests | ${metrics.failedTests.length} |\n`;
  body += `| Flaky Tests | ${metrics.flakyTests.length} |\n\n`;
  
  body += `## Action Items\n\n`;
  body += `- [ ] Investigate root cause of failures\n`;
  body += `- [ ] Fix or skip failing tests\n`;
  body += `- [ ] Update test assertions if needed\n`;
  body += `- [ ] Verify fixes with multiple test runs\n\n`;
  
  body += `**Auto-generated by test failure alerting system**\n`;
  
  // Create issue via GitHub API
  try {
    const [owner, repo] = GITHUB_REPO.split('/');
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json',
      },
      body: JSON.stringify({
        title: `🔴 Persistent Test Failures (${persistentIssues.length} tests)`,
        body,
        labels: ['test-failure', 'automated', 'priority-high'],
      }),
    });
    
    if (response.ok) {
      const issue = await response.json();
      console.log(`✅ GitHub issue created: ${issue.html_url}`);
      return true;
    } else {
      const error = await response.text();
      console.error('❌ Failed to create GitHub issue:', error);
      return false;
    }
  } catch (error) {
    console.error('❌ Error creating GitHub issue:', error.message);
    return false;
  }
}

/**
 * Save alert history
 */
function saveAlertHistory(issues, recurringIssues, alertsSent) {
  if (!fs.existsSync(ALERTS_DIR)) {
    fs.mkdirSync(ALERTS_DIR, { recursive: true });
  }
  
  const alertRecord = {
    timestamp: new Date().toISOString(),
    issues,
    recurringIssues,
    alertsSent,
  };
  
  const historyFile = path.join(ALERTS_DIR, 'alert-history.json');
  let history = { alerts: [] };
  
  if (fs.existsSync(historyFile)) {
    try {
      history = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
    } catch (error) {
      // Start fresh if corrupted
    }
  }
  
  history.alerts.push(alertRecord);
  
  // Keep last 100 alerts
  if (history.alerts.length > 100) {
    history.alerts = history.alerts.slice(-100);
  }
  
  fs.writeFileSync(historyFile, JSON.stringify(history, null, 2));
}

/**
 * Main execution
 */
async function main() {
  console.log('🚨 Test Failure Alert System\n');
  
  // Load metrics
  const metrics = loadLatestMetrics();
  const history = loadTestHistory();
  
  console.log(`📊 Test Metrics:`);
  console.log(`   Pass Rate: ${metrics.summary.passRate.toFixed(2)}%`);
  console.log(`   Failed Tests: ${metrics.failedTests.length}`);
  console.log(`   Flaky Tests: ${metrics.flakyTests.length}`);
  console.log(`   Duration: ${(metrics.summary.totalDuration / 1000).toFixed(1)}s\n`);
  
  // Determine issues
  const issues = determineAlertSeverity(metrics);
  const recurringIssues = checkRecurringIssues(history);
  
  if (issues.length === 0 && recurringIssues.length === 0) {
    console.log('✅ No issues detected - all metrics within acceptable ranges\n');
    return;
  }
  
  console.log(`⚠️  Issues detected:`);
  console.log(`   Critical: ${issues.filter(i => i.severity === 'critical').length}`);
  console.log(`   Warnings: ${issues.filter(i => i.severity === 'warning').length}`);
  console.log(`   Recurring: ${recurringIssues.length}\n`);
  
  // Send alerts
  const alertsSent = {
    slack: false,
    email: false,
    github: false,
  };
  
  // Send Slack for any issues
  if (issues.length > 0) {
    alertsSent.slack = await sendSlackAlert(issues, metrics, recurringIssues);
  }
  
  // Send email for recurring issues
  if (recurringIssues.length > 0) {
    alertsSent.email = await sendEmailAlert(recurringIssues, metrics);
  }
  
  // Create GitHub issue for persistent failures
  if (recurringIssues.some(i => i.occurrences >= 4)) {
    alertsSent.github = await createGitHubIssue(recurringIssues, metrics);
  }
  
  // Save alert history
  saveAlertHistory(issues, recurringIssues, alertsSent);
  
  console.log('\n✅ Alert processing complete');
  
  // Exit with error code if critical issues
  if (issues.some(i => i.severity === 'critical')) {
    process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
