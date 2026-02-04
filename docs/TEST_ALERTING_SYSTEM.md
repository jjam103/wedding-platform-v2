# Test Failure Alerting System

## Overview

Automated alerting system for test failures that provides real-time notifications, recurring issue detection, and weekly summary reports to improve test reliability and developer productivity.

## Features

### 1. Real-Time Slack Notifications

**Triggers**:
- Critical: Pass rate drops below 90%
- Critical: Any test failures detected
- Critical: More than 3 flaky tests
- Warning: Pass rate drops below 95%
- Warning: More than 10 slow tests (>5s)
- Warning: Test suite takes >5 minutes

**Notification Content**:
- Pass rate, failed tests, flaky tests, duration
- Critical issues with details
- Warning issues
- Recurring issues
- Links to CI run and metrics

**Configuration**:
```bash
# Set in GitHub repository secrets
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

### 2. Email Alerts for Recurring Issues

**Triggers**:
- Tests failing in 3+ of last 5 runs
- Pass rate declining consistently
- Persistent flaky tests

**Email Content**:
- List of recurring issues with details
- Current test metrics
- Action items

**Configuration**:
```bash
# Set in GitHub repository secrets
RESEND_API_KEY=re_your_api_key
ALERT_EMAIL=dev-team@example.com
```

### 3. GitHub Issues for Persistent Failures

**Triggers**:
- Tests failing in 4+ of last 5 runs

**Issue Content**:
- List of persistent failures
- Test suite and test name
- Failure count
- Current metrics
- Action items checklist

**Configuration**:
```bash
# Automatically uses GitHub Actions token
GITHUB_TOKEN=${{ secrets.GITHUB_TOKEN }}
GITHUB_REPOSITORY=${{ github.repository }}
```

### 4. Weekly Summary Reports

**Schedule**:
- Every Monday at 9:00 AM UTC
- Can be triggered manually

**Report Content**:
- Week-over-week comparison
- Pass rate, duration, coverage trends
- Top flaky tests
- Slowest tests
- Prioritized recommendations
- Historical trends

**Delivery**:
- Saved as artifact in GitHub Actions
- Emailed to team
- Posted as GitHub Discussion or Issue

## Setup Instructions

### 1. Configure Slack Notifications

1. Create a Slack webhook:
   - Go to https://api.slack.com/apps
   - Create new app or select existing
   - Enable "Incoming Webhooks"
   - Add webhook to desired channel
   - Copy webhook URL

2. Add to GitHub secrets:
   ```bash
   # Repository Settings > Secrets and variables > Actions
   Name: SLACK_WEBHOOK_URL
   Value: https://hooks.slack.com/services/YOUR/WEBHOOK/URL
   ```

### 2. Configure Email Alerts

1. Get Resend API key:
   - Sign up at https://resend.com
   - Create API key
   - Verify sending domain

2. Add to GitHub secrets:
   ```bash
   Name: RESEND_API_KEY
   Value: re_your_api_key
   
   Name: ALERT_EMAIL
   Value: dev-team@example.com
   ```

### 3. Enable GitHub Issues

GitHub token is automatically available in Actions. No additional configuration needed.

### 4. Enable Weekly Reports

1. Configure email (same as alerts)

2. Optional: Set discussion category ID:
   ```bash
   Name: DISCUSSION_CATEGORY_ID
   Value: your_category_id
   ```

## Usage

### Manual Alert Sending

```bash
# Send alerts based on latest test metrics
npm run alert:test-failure

# With environment variables
SLACK_WEBHOOK_URL=https://... \
RESEND_API_KEY=re_... \
ALERT_EMAIL=team@example.com \
npm run alert:test-failure
```

### Manual Weekly Report

```bash
# Generate and send weekly report
npm run report:weekly

# With environment variables
RESEND_API_KEY=re_... \
REPORT_EMAIL=team@example.com \
npm run report:weekly
```

### Automatic Execution

Alerts are automatically sent by GitHub Actions:

1. **On every test run** (push/PR):
   - Analyzes test metrics
   - Sends Slack notification if issues detected
   - Sends email for recurring issues
   - Creates GitHub issue for persistent failures

2. **Weekly** (Monday 9 AM UTC):
   - Generates comprehensive report
   - Emails team
   - Posts to GitHub Discussions/Issues

## Alert Thresholds

### Critical Alerts (Slack + Email)

| Metric | Threshold | Action |
|--------|-----------|--------|
| Pass Rate | < 90% | Immediate investigation required |
| Failed Tests | > 0 | Fix failing tests |
| Flaky Tests | > 3 | Fix flaky tests |

### Warning Alerts (Slack)

| Metric | Threshold | Action |
|--------|-----------|--------|
| Pass Rate | < 95% | Monitor and improve |
| Slow Tests | > 10 | Optimize slow tests |
| Duration | > 5 min | Optimize test suite |

### Recurring Issue Detection

| Pattern | Threshold | Action |
|---------|-----------|--------|
| Consistent Failures | 3+ of last 5 runs | Email alert |
| Persistent Failures | 4+ of last 5 runs | GitHub issue |
| Declining Pass Rate | Consistent decline >5% | Email alert |

## Alert Examples

### Slack Notification

```
🚨 Critical Test Failures

Pass Rate: 87.5%
Failed Tests: 15
Flaky Tests: 5
Duration: 245.3s

🔴 Critical Issues:
• Pass rate critically low: 87.5%
• 15 tests failing
  - guestService.create should validate email
  - rsvpService.submit should check capacity
  - photoService.upload should sanitize filename

🟡 Warnings:
• 12 slow tests (>5s)

🔄 Recurring Issues:
• Test failing in 4 of last 5 runs: guestService.create

[View CI Run] [View Metrics]
```

### Email Alert

```
Subject: 🔄 Recurring Test Issues Detected (3 issues)

The following issues have been detected in multiple recent test runs:

• recurring_failure: Test failing in 4 of last 5 runs
  guestService.test.ts :: guestService.create should validate email

• declining_trend: Pass rate declining: 95.2% → 87.5%

• recurring_failure: Test failing in 3 of last 5 runs
  rsvpService.test.ts :: rsvpService.submit should check capacity

Current Test Metrics:
Pass Rate: 87.5%
Failed Tests: 15
Flaky Tests: 5
Duration: 245.3s

Action Required: Please investigate and fix these recurring issues.
```

### GitHub Issue

```
Title: 🔴 Persistent Test Failures (2 tests)

## 🔴 Persistent Test Failures

The following tests have been failing consistently:

### guestService.create should validate email

- **Suite**: `services/guestService.test.ts`
- **Failures**: 4 of last 5 runs
- **Status**: Requires immediate attention

### rsvpService.submit should check capacity

- **Suite**: `services/rsvpService.test.ts`
- **Failures**: 4 of last 5 runs
- **Status**: Requires immediate attention

## Current Metrics

| Metric | Value |
|--------|-------|
| Pass Rate | 87.5% |
| Failed Tests | 15 |
| Flaky Tests | 5 |

## Action Items

- [ ] Investigate root cause of failures
- [ ] Fix or skip failing tests
- [ ] Update test assertions if needed
- [ ] Verify fixes with multiple test runs

**Auto-generated by test failure alerting system**
```

### Weekly Report

```
Subject: 📊 Weekly Test Report - Pass Rate: 92.3%

# Weekly Test Report

**Period**: 2024-01-15 - 2024-01-22
**Generated**: 2024-01-22 09:00:00

## 📊 Executive Summary

| Metric | This Week | Last Week | Change |
|--------|-----------|-----------|--------|
| Pass Rate | 92.3% | 95.1% | 📉 -2.8% |
| Duration | 245.3s | 238.7s | 🐌 +6.6s |
| Coverage | 89.2% | 88.5% | 📈 +0.7% |
| Total Failures | 45 | 28 | ⚠️ +17 |

## 📈 Key Metrics

- **Test Runs**: 23 runs this week
- **Total Tests**: 3,355 tests
- **Unique Failures**: 12 different tests failed
- **Flaky Tests**: 5 tests showing flaky behavior
- **Slow Tests**: 15 tests taking >5 seconds

## 💡 Recommendations

### 🔴 High Priority

1. **Quality**: Average pass rate is 92.3% (target: 95%+)
   - **Action**: Focus on fixing failing tests this week
   - **Impact**: Improve test reliability and catch bugs earlier

2. **Reliability**: 5 flaky tests detected
   - **Action**: Fix top flaky tests: guestService.create, rsvpService.submit
   - **Impact**: Reduce false positives and improve developer confidence

### 🟡 Medium Priority

1. **Performance**: 15 slow tests (>5s)
   - **Action**: Optimize: photoService.upload, emailService.send
   - **Impact**: Reduce overall test execution time

[View full report...]
```

## Monitoring Dashboard

View real-time metrics:

```bash
# View latest dashboard
npm run test:dashboard

# View comprehensive report
npm run test:metrics

# View weekly reports
ls test-results/metrics/weekly-reports/
```

## Alert History

All alerts are logged for audit purposes:

```bash
# View alert history
cat test-results/metrics/alerts/alert-history.json
```

## Troubleshooting

### Alerts Not Sending

1. **Check configuration**:
   ```bash
   # Verify secrets are set in GitHub
   # Repository Settings > Secrets and variables > Actions
   ```

2. **Check logs**:
   ```bash
   # View GitHub Actions logs
   # Actions tab > Select workflow run > View logs
   ```

3. **Test locally**:
   ```bash
   # Set environment variables
   export SLACK_WEBHOOK_URL=https://...
   export RESEND_API_KEY=re_...
   export ALERT_EMAIL=test@example.com
   
   # Run alert script
   npm run alert:test-failure
   ```

### False Positives

Adjust thresholds in `scripts/send-test-failure-alert.mjs`:

```javascript
const THRESHOLDS = {
  CRITICAL_PASS_RATE: 90,  // Adjust as needed
  WARNING_PASS_RATE: 95,
  MAX_FLAKY_TESTS: 3,
  MAX_SLOW_TESTS: 10,
  MAX_DURATION: 300000,
};
```

### Missing Metrics

Ensure test metrics reporter is configured:

```javascript
// jest.config.js
module.exports = {
  reporters: [
    'default',
    ['./jest-metrics-reporter.js', {}],
  ],
};
```

## Best Practices

### 1. Respond Quickly to Critical Alerts

- Investigate within 1 hour
- Fix or skip failing tests
- Update team on progress

### 2. Address Recurring Issues

- Review weekly reports
- Prioritize persistent failures
- Track fixes in GitHub issues

### 3. Monitor Trends

- Watch for declining pass rates
- Optimize slow tests regularly
- Maintain coverage above 85%

### 4. Keep Alerts Actionable

- Include links to failures
- Provide context and details
- Suggest specific actions

### 5. Review Weekly Reports

- Discuss in team meetings
- Track improvement over time
- Celebrate successes

## Integration with CI/CD

### GitHub Actions

Alerts are automatically integrated:

```yaml
# .github/workflows/test.yml
- name: Send test failure alerts
  if: always()
  run: node scripts/send-test-failure-alert.mjs
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
    RESEND_API_KEY: ${{ secrets.RESEND_API_KEY }}
    ALERT_EMAIL: ${{ secrets.ALERT_EMAIL }}
```

### Other CI Systems

Adapt scripts for your CI system:

```bash
# Jenkins
sh 'npm run alert:test-failure'

# CircleCI
- run: npm run alert:test-failure

# GitLab CI
script:
  - npm run alert:test-failure
```

## Metrics Collected

### Test Execution Metrics

- Total tests, passed, failed, skipped
- Pass rate percentage
- Total duration
- Slow tests (>5s)
- Flaky tests (inconsistent results)

### Coverage Metrics

- Line coverage
- Statement coverage
- Function coverage
- Branch coverage

### Trend Metrics

- Pass rate over time
- Duration over time
- Coverage over time
- Failure patterns

### Alert Metrics

- Alerts sent
- Alert types (Slack, email, GitHub)
- Response times
- Resolution rates

## Future Enhancements

### Planned Features

- [ ] Slack interactive buttons for quick actions
- [ ] Integration with PagerDuty for on-call alerts
- [ ] Machine learning for flaky test prediction
- [ ] Automatic test retry for flaky tests
- [ ] Performance regression detection
- [ ] Visual regression testing alerts
- [ ] Custom alert rules per team/project

### Feedback

Submit feedback and feature requests:
- GitHub Issues: Tag with `test-alerting`
- Team Slack: #test-automation channel
- Email: dev-team@example.com

## References

- [Test Metrics Dashboard](./TEST_METRICS_DASHBOARD.md)
- [Testing Standards](../.kiro/steering/testing-standards.md)
- [Testing Improvements Spec](../.kiro/specs/testing-improvements/)
- [Slack Webhooks Documentation](https://api.slack.com/messaging/webhooks)
- [Resend API Documentation](https://resend.com/docs)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
