# Automated Scheduling and Webhooks Guide

This guide explains how to use the automated scheduling and webhook features implemented in the destination wedding platform.

## Overview

The platform includes several automated background jobs that run on a schedule to handle:
- RSVP deadline reminders
- Scheduled email processing
- Webhook retry logic
- Temporary file cleanup
- Expired session cleanup
- Old log cleanup

## Cron Job Infrastructure

### Core Service: `cronService.ts`

The cron service provides infrastructure for running scheduled jobs with automatic logging and monitoring.

**Key Features:**
- Automatic job execution logging
- Error handling and recovery
- Job statistics and monitoring
- Prevents duplicate job execution

**Usage Example:**
```typescript
import { executeCronJob } from './services/cronService';

await executeCronJob('my_job_type', async () => {
  // Your job logic here
  return {
    itemsProcessed: 10,
    itemsFailed: 0,
  };
});
```

### Database Table: `cron_job_logs`

Tracks all cron job executions with:
- Job type
- Status (pending, running, completed, failed)
- Start and completion times
- Duration in milliseconds
- Items processed and failed
- Error messages

## RSVP Deadline Reminders

### Service: `rsvpReminderService.ts`

Automatically sends reminder emails to guests who haven't responded to RSVP requests.

**Configuration:**
- Default threshold: 7 days before deadline
- Customizable reminder timing
- Tracks reminders sent to prevent duplicates

**How It Works:**
1. Finds events and activities with upcoming RSVP deadlines
2. Identifies guests with pending RSVPs
3. Sends personalized reminder emails
4. Logs all reminders sent

**Manual Execution:**
```typescript
import { processRSVPReminders } from './services/rsvpReminderService';

// Send reminders for deadlines within 7 days
const result = await processRSVPReminders(7);
```

**Recommended Schedule:** Daily at 9:00 AM

### Database Table: `rsvp_reminders_sent`

Tracks all RSVP reminders sent to prevent duplicate reminders.

## Scheduled Email Processing

### Service: `emailQueueService.ts`

Processes emails that have been scheduled for future delivery.

**Features:**
- Batch processing (100 emails per run)
- Automatic retry for failed emails
- Status tracking (pending, processing, sent, failed, cancelled)
- Retry count limiting

**How It Works:**
1. Finds scheduled emails due to be sent
2. Marks them as processing
3. Sends via email service
4. Updates status based on result

**Manual Execution:**
```typescript
import { processScheduledEmails } from './services/emailQueueService';

const result = await processScheduledEmails();
```

**Recommended Schedule:** Every minute

### Retry Failed Emails

```typescript
import { retryFailedScheduledEmails } from './services/emailQueueService';

// Retry failed emails (max 3 attempts)
const result = await retryFailedScheduledEmails(3);
```

## Cleanup Tasks

### Service: `cleanupService.ts`

Maintains system health by cleaning up old data and temporary files.

**Cleanup Operations:**

1. **Temporary Files** (24 hours)
   - Removes files from `/tmp` directory
   - Configurable age threshold
   - Reports bytes freed

2. **Expired Sessions** (automatic)
   - Handled by Supabase Auth
   - Placeholder for custom session cleanup

3. **Old Audit Logs** (90 days)
   - Prevents database bloat
   - Maintains compliance requirements

4. **Old Cron Job Logs** (30 days)
   - Keeps recent execution history
   - Removes old logs

5. **Old Email Logs** (180 days)
   - Maintains delivery history
   - Removes very old logs

6. **Old Webhook Logs** (30 days)
   - Keeps recent webhook history
   - Removes old delivery logs

**Manual Execution:**
```typescript
import { runAllCleanupTasks } from './services/cleanupService';

const result = await runAllCleanupTasks();
```

**Recommended Schedule:** Daily at 2:00 AM

## Webhook Retry Logic

### Service: `webhookService.ts`

Automatically retries failed webhook deliveries with exponential backoff.

**Features:**
- Exponential backoff (1s, 2s, 4s, 8s, 16s...)
- Configurable max retries (default: 5)
- Automatic retry scheduling
- Delivery status tracking

**How It Works:**
1. Finds webhook deliveries marked for retry
2. Checks if retry time has arrived
3. Attempts delivery
4. Schedules next retry if failed
5. Marks as failed after max retries

**Manual Execution:**
```typescript
import { retryFailedWebhooks } from './services/webhookService';

const result = await retryFailedWebhooks();
```

**Recommended Schedule:** Every 5 minutes

## Setting Up Cron Jobs

### Option 1: Vercel Cron Jobs

Add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/rsvp-reminders",
      "schedule": "0 9 * * *"
    },
    {
      "path": "/api/cron/scheduled-emails",
      "schedule": "* * * * *"
    },
    {
      "path": "/api/cron/webhook-retry",
      "schedule": "*/5 * * * *"
    },
    {
      "path": "/api/cron/cleanup",
      "schedule": "0 2 * * *"
    }
  ]
}
```

### Option 2: External Cron Service

Use services like:
- **Cron-job.org**: Free cron job service
- **EasyCron**: Reliable cron service
- **AWS EventBridge**: Scheduled events

Configure to call your API endpoints:
- `POST /api/cron/rsvp-reminders`
- `POST /api/cron/scheduled-emails`
- `POST /api/cron/webhook-retry`
- `POST /api/cron/cleanup`

### Option 3: Self-Hosted

Use system cron or systemd timers:
```bash
# /etc/cron.d/wedding-platform
0 9 * * * curl -X POST https://your-domain.com/api/cron/rsvp-reminders
* * * * * curl -X POST https://your-domain.com/api/cron/scheduled-emails
*/5 * * * * curl -X POST https://your-domain.com/api/cron/webhook-retry
0 2 * * * curl -X POST https://your-domain.com/api/cron/cleanup
```

## API Endpoints

Create these API routes to trigger cron jobs:

### `/api/cron/rsvp-reminders`
```typescript
import { processRSVPReminders } from '@/services/rsvpReminderService';

export async function POST(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const result = await processRSVPReminders(7);
  return Response.json(result);
}
```

### `/api/cron/scheduled-emails`
```typescript
import { processScheduledEmails } from '@/services/emailQueueService';

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const result = await processScheduledEmails();
  return Response.json(result);
}
```

### `/api/cron/webhook-retry`
```typescript
import { retryFailedWebhooks } from '@/services/webhookService';

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const result = await retryFailedWebhooks();
  return Response.json(result);
}
```

### `/api/cron/cleanup`
```typescript
import { runAllCleanupTasks } from '@/services/cleanupService';

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const result = await runAllCleanupTasks();
  return Response.json(result);
}
```

## Environment Variables

Add to `.env.local`:
```bash
# Cron job authentication
CRON_SECRET=your-secure-random-string

# Application URL for email links
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## Monitoring

### View Job Logs

```typescript
import { getJobLogs, getJobStats } from './services/cronService';

// Get recent logs
const logs = await getJobLogs('rsvp_deadline_reminders', 50);

// Get statistics
const stats = await getJobStats('rsvp_deadline_reminders');
```

### Check Job Status

```typescript
import { isJobRunning } from './services/cronService';

const isRunning = await isJobRunning('scheduled_email_processing');
```

### Email Queue Statistics

```typescript
import { getScheduledEmailStats } from './services/emailQueueService';

const stats = await getScheduledEmailStats();
// Returns: { pending, processing, sent, failed, total }
```

### RSVP Reminder Statistics

```typescript
import { getReminderStats } from './services/rsvpReminderService';

const stats = await getReminderStats();
// Returns: { totalReminders, remindersByEvent, remindersByActivity }
```

## Best Practices

1. **Authentication**: Always protect cron endpoints with a secret token
2. **Idempotency**: Ensure jobs can be safely run multiple times
3. **Monitoring**: Set up alerts for failed jobs
4. **Logging**: Review job logs regularly
5. **Testing**: Test cron jobs in staging before production
6. **Timeouts**: Set appropriate timeouts for long-running jobs
7. **Batch Processing**: Process items in batches to avoid memory issues
8. **Error Handling**: Log errors but don't fail the entire job

## Troubleshooting

### Job Not Running
- Check cron schedule configuration
- Verify authentication token
- Check job logs for errors
- Ensure database migrations are applied

### High Failure Rate
- Check external service availability (email, webhooks)
- Review error messages in job logs
- Verify database connectivity
- Check rate limits

### Performance Issues
- Reduce batch sizes
- Add database indexes
- Optimize queries
- Consider splitting into multiple jobs

## Database Migrations

Ensure these migrations are applied:
- `013_create_cron_job_logs_table.sql`
- `014_create_rsvp_reminders_table.sql`
- `015_update_scheduled_emails_table.sql`

Run migrations:
```bash
# Using Supabase CLI
supabase db push

# Or apply manually via Supabase dashboard
```

## Summary

The automated scheduling system provides:
- ✅ RSVP deadline reminders (daily)
- ✅ Scheduled email processing (every minute)
- ✅ Webhook retry logic (every 5 minutes)
- ✅ Automated cleanup tasks (daily)
- ✅ Comprehensive logging and monitoring
- ✅ Error handling and recovery

All jobs are designed to be reliable, idempotent, and easy to monitor.

