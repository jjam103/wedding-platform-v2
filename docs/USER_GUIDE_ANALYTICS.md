# Analytics & Reporting User Guide

## Overview

The Analytics system provides comprehensive insights into RSVPs, budget, and system activity. This guide covers three main analytics features: RSVP Analytics, Budget Dashboard, and Audit Logs.

## Table of Contents

1. [RSVP Analytics Dashboard](#rsvp-analytics-dashboard)
2. [Budget Dashboard](#budget-dashboard)
3. [Audit Logs](#audit-logs)

---

# RSVP Analytics Dashboard

## Overview

The RSVP Analytics Dashboard provides real-time insights into guest responses, helping you track attendance, identify trends, and plan accordingly.

## Accessing RSVP Analytics

1. Log in to the admin dashboard
2. Click on **Guest Management** in the sidebar
3. Select **RSVP Analytics**

## Dashboard Sections

### 1. Overall Response Rate

The top section shows your overall RSVP response rate:

```
┌─────────────────────────────────────────┐
│ Overall Response Rate: 78%              │
│                                         │
│ 🟢 Attending: 45 guests                 │
│ 🔴 Declined: 8 guests                   │
│ 🟡 Maybe: 5 guests                      │
│ ⚪ Pending: 12 guests                   │
│                                         │
│ Total Invited: 70 guests                │
└─────────────────────────────────────────┘
```

**Metrics Explained**:
- **Response Rate**: Percentage of guests who have responded (attending, declined, or maybe)
- **Attending**: Guests who confirmed they're coming
- **Declined**: Guests who cannot attend
- **Maybe**: Guests who are unsure
- **Pending**: Guests who haven't responded yet

### 2. Response Breakdown Chart

A visual pie chart showing the distribution of responses:

```
        Attending (64%)
           /  \
          /    \
    Declined   Maybe
      (11%)    (7%)
         \    /
          \  /
        Pending (18%)
```

**Using the Chart**:
- Hover over sections to see exact numbers
- Click sections to filter other dashboard views
- Export chart as image for presentations

### 3. Response Rate by Event

Shows response rates for each event with progress bars:

```
┌─────────────────────────────────────────────────────┐
│ Response Rate by Event                              │
├─────────────────────────────────────────────────────┤
│ Ceremony                                            │
│ ████████████████░░░░ 85% (60/70 guests)            │
│                                                     │
│ Reception                                           │
│ ██████████████░░░░░░ 72% (50/70 guests)            │
│                                                     │
│ Welcome Dinner                                      │
│ ████████████░░░░░░░░ 65% (45/70 guests)            │
│                                                     │
│ Farewell Brunch                                     │
│ ██████████░░░░░░░░░░ 58% (40/70 guests)            │
└─────────────────────────────────────────────────────┘
```

**Understanding Event Rates**:
- Green bars (80%+): High response rate
- Yellow bars (60-79%): Moderate response rate
- Red bars (<60%): Low response rate - consider sending reminders

### 4. Response Rate by Activity

Shows response rates and capacity utilization for activities:

```
┌─────────────────────────────────────────────────────┐
│ Response Rate by Activity                           │
├─────────────────────────────────────────────────────┤
│ Beach Day                                           │
│ ████████████████░░░░ 45/50 capacity (90%) ⚠️       │
│ Response Rate: 82%                                  │
│                                                     │
│ Zip Line Adventure                                  │
│ ████████████████████ 20/20 capacity (100%) 🔴      │
│ Response Rate: 95%                                  │
│                                                     │
│ Sunset Cruise                                       │
│ ████████████░░░░░░░░ 28/40 capacity (70%)          │
│ Response Rate: 75%                                  │
└─────────────────────────────────────────────────────┘
```

**Capacity Indicators**:
- 🟢 Green (0-89%): Available capacity
- ⚠️ Orange (90-99%): Near capacity - monitor closely
- 🔴 Red (100%): At capacity - waitlist or add capacity

### 5. Response Trends Timeline

A line chart showing RSVP responses over time:

```
Responses
    │
 60 │                                    ●
    │                              ●
 50 │                        ●
    │                  ●
 40 │            ●
    │      ●
 30 │ ●
    │
 20 │
    └─────────────────────────────────────────
      Jan  Feb  Mar  Apr  May  Jun  Jul  Aug
```

**Using the Trends Chart**:
- Identify response patterns (early vs. late responders)
- See impact of reminder emails (spikes after reminders)
- Forecast final attendance based on trends
- Plan follow-up communications

### 6. Pending Reminders

Shows guests who need RSVP reminders:

```
┌─────────────────────────────────────────────────────┐
│ Pending Reminders                                   │
├─────────────────────────────────────────────────────┤
│ 12 guests past RSVP deadline                        │
│ 5 guests approaching deadline (within 7 days)       │
│                                                     │
│ [Send Reminder Emails]                              │
└─────────────────────────────────────────────────────┘
```

**Reminder Actions**:
1. Click **Send Reminder Emails** to send automated reminders
2. System sends personalized emails to pending guests
3. Emails include RSVP link and deadline information
4. Track reminder effectiveness in Response Trends

## Filtering Options

### Filter by Guest Type

Filter analytics by guest category:

1. Click **Guest Type** dropdown
2. Select:
   - **All Guests**: Show all guests
   - **Wedding Party**: Only wedding party members
   - **Wedding Guests**: Regular wedding guests
   - **Pre-Wedding Only**: Guests attending only pre-wedding events
   - **Post-Wedding Only**: Guests attending only post-wedding events

3. All metrics recalculate for selected guest type

### Filter by Date Range

View response trends for a specific period:

1. Click **Date Range** dropdown
2. Select:
   - **Last 7 Days**
   - **Last 30 Days**
   - **Last 90 Days**
   - **All Time**
   - **Custom Range** (select start and end dates)

3. Response Trends chart updates to show selected period

## Exporting Analytics

### Export Options

1. **PDF Report**: Click **Export PDF** to generate a comprehensive report
2. **CSV Data**: Click **Export CSV** to download raw data
3. **Chart Images**: Right-click charts and select "Save Image As"

### PDF Report Contents

The PDF report includes:
- Overall response rate summary
- Response breakdown chart
- Event-by-event response rates
- Activity capacity utilization
- Response trends chart
- Pending reminders list
- Generated date and time

**Use Cases**:
- Share with wedding planners
- Present to family members
- Keep for records
- Track progress over time

---

# Budget Dashboard

## Overview

The Budget Dashboard provides real-time financial tracking for your wedding, including vendor costs, guest contributions, and host subsidies.

## Accessing Budget Dashboard

1. Log in to the admin dashboard
2. Click on **Financial** in the sidebar
3. Select **Budget**

## Dashboard Sections

### 1. Budget Summary

The top section shows overall financial metrics:

```
┌─────────────────────────────────────────────────────┐
│ Budget Summary                                      │
├─────────────────────────────────────────────────────┤
│ Total Cost:           $45,000                       │
│ Host Contribution:    $30,000                       │
│ Guest Payments:       $12,000                       │
│ Balance Due:          $3,000                        │
│                                                     │
│ Cost Per Guest:       $643                          │
│ Host Subsidy Per Guest: $429                        │
└─────────────────────────────────────────────────────┘
```

**Metrics Explained**:
- **Total Cost**: Sum of all vendor costs and activity expenses
- **Host Contribution**: Amount hosts are paying
- **Guest Payments**: Amount guests have paid or committed
- **Balance Due**: Remaining amount to be paid
- **Cost Per Guest**: Total cost divided by attending guests
- **Host Subsidy Per Guest**: Host contribution divided by attending guests

### 2. Vendor Payment Tracking

Shows all vendors with payment status:

```
┌─────────────────────────────────────────────────────┐
│ Vendor Payment Tracking                             │
├──────────────┬──────────┬─────────┬────────┬────────┤
│ Vendor       │ Category │ Cost    │ Paid   │ Status │
├──────────────┼──────────┼─────────┼────────┼────────┤
│ Beach Photos │ Photo    │ $3,000  │ $3,000 │ 🟢 PAID│
│ Catering Co  │ Catering │ $15,000 │ $7,500 │ 🟡 PART│
│ DJ Services  │ Music    │ $2,000  │ $0     │ 🔴 UNPD│
│ Florist      │ Decor    │ $1,500  │ $1,500 │ 🟢 PAID│
│ Shuttle Co   │ Transport│ $800    │ $0     │ 🔴 UNPD│
└──────────────┴──────────┴─────────┴────────┴────────┘
```

**Payment Status**:
- 🟢 **PAID**: Fully paid
- 🟡 **PARTIAL**: Partially paid
- 🔴 **UNPAID**: Not yet paid

**Actions**:
- Click **Record Payment** to log a payment
- Click **View Details** to see payment history
- Click **Edit** to update vendor information

### 3. Recording Vendor Payments

To record a payment:

1. Find the vendor in the table
2. Click **Record Payment**
3. Enter payment details:
   - **Amount**: Payment amount
   - **Date**: Payment date
   - **Method**: Payment method (check, credit card, wire transfer, etc.)
   - **Reference**: Check number or transaction ID
   - **Notes**: Any additional notes

4. Click **Save Payment**
5. Payment status updates automatically

**Example**:
```
Record Payment for Catering Co

Amount: $7,500
Date: 2025-05-15
Method: Wire Transfer
Reference: TXN-123456
Notes: 50% deposit payment

[Save Payment] [Cancel]
```

### 4. Individual Guest Subsidies

Shows per-guest subsidy breakdown:

```
┌─────────────────────────────────────────────────────┐
│ Individual Guest Subsidies                          │
├──────────────────┬──────────┬──────────┬───────────┤
│ Guest Name       │ Activity │ Accom    │ Total     │
│                  │ Subsidy  │ Subsidy  │ Subsidy   │
├──────────────────┼──────────┼──────────┼───────────┤
│ John Doe         │ $200     │ $300     │ $500      │
│ Jane Smith       │ $200     │ $300     │ $500      │
│ Bob Johnson      │ $150     │ $250     │ $400      │
│ Alice Williams   │ $200     │ $300     │ $500      │
└──────────────────┴──────────┴──────────┴───────────┘
```

**Subsidy Types**:
- **Activity Subsidy**: Host contribution toward activity costs
- **Accommodation Subsidy**: Host contribution toward lodging
- **Total Subsidy**: Combined subsidy per guest

### 5. Cost Breakdown Chart

A pie chart showing cost distribution:

```
        Catering (33%)
           /  \
          /    \
    Photography  Accommodation
      (7%)         (22%)
         \        /
          \      /
        Activities (18%)
            |
         Vendors (20%)
```

**Categories**:
- Catering and food
- Photography and videography
- Accommodation
- Activities and entertainment
- Vendors (florist, DJ, etc.)
- Transportation
- Other expenses

## Budget Calculations

### How Costs are Calculated

**Total Cost**:
```
Total Cost = Vendor Costs + Activity Costs + Accommodation Costs
```

**Activity Costs**:
```
Activity Cost = (Cost Per Person × Attending Guests) - Host Subsidy
```

**Accommodation Costs**:
```
Accommodation Cost = (Room Price × Nights × Rooms) - Host Subsidy
```

**Balance Due**:
```
Balance Due = Total Cost - Host Contribution - Guest Payments
```

### Real-Time Recalculation

The budget recalculates automatically when:
- Vendor costs change
- Activity costs change
- Guest RSVPs change (affects per-person costs)
- Payments are recorded
- Host subsidies are updated

## Exporting Budget Data

### Export Options

1. **PDF Report**: Click **Export PDF** for a comprehensive budget report
2. **CSV Export**: Click **Export CSV** for spreadsheet analysis
3. **Vendor Summary**: Click **Vendor Summary** for vendor-specific report

### PDF Report Contents

- Budget summary with all metrics
- Vendor payment tracking table
- Payment history
- Cost breakdown chart
- Individual guest subsidies
- Payment schedule
- Generated date and time

---

# Audit Logs

## Overview

Audit Logs provide a complete history of all admin actions in the system, ensuring accountability and traceability.

## Accessing Audit Logs

1. Log in to the admin dashboard
2. Click on **System** in the sidebar
3. Select **Audit Logs**

## Log Display

Logs are displayed in reverse chronological order (newest first):

```
┌─────────────────────────────────────────────────────┐
│ Audit Logs                                          │
├──────────┬────────┬────────┬────────┬──────────────┤
│ Time     │ User   │ Action │ Entity │ Details      │
├──────────┼────────┼────────┼────────┼──────────────┤
│ 2:30 PM  │ Sarah  │ UPDATE │ Guest  │ Updated      │
│ Jan 25   │ Admin  │        │ John   │ email        │
│          │        │        │ Doe    │              │
├──────────┼────────┼────────┼────────┼──────────────┤
│ 2:15 PM  │ Michael│ CREATE │ Event  │ Created      │
│ Jan 25   │ Admin  │        │ Ceremony│ event       │
├──────────┼────────┼────────┼────────┼──────────────┤
│ 1:45 PM  │ Sarah  │ DELETE │ Vendor │ Deleted      │
│ Jan 25   │ Admin  │        │ Florist│ vendor       │
│          │        │ ⚠️     │        │              │
└──────────┴────────┴────────┴────────┴──────────────┘
```

## Log Information

Each log entry shows:
- **Timestamp**: Date and time of action
- **User**: Admin who performed the action
- **Action Type**: CREATE, UPDATE, DELETE, LOGIN, LOGOUT
- **Entity Type**: Guest, Event, Activity, Vendor, etc.
- **Entity Name**: Specific entity affected
- **Description**: Details of what changed
- **Metadata**: Additional information (old values, new values, etc.)

## Filtering Logs

### Filter by User

To see actions by a specific admin:

1. Click **User** dropdown
2. Select an admin user
3. Logs filter to show only that user's actions

### Filter by Action Type

To see specific types of actions:

1. Click **Action** dropdown
2. Select action type:
   - **All Actions**
   - **CREATE**: Entity creation
   - **UPDATE**: Entity updates
   - **DELETE**: Entity deletion
   - **LOGIN**: User logins
   - **LOGOUT**: User logouts
   - **PERMISSION_CHANGE**: Permission modifications

3. Logs filter to show only selected action type

### Filter by Entity Type

To see actions on specific entities:

1. Click **Entity** dropdown
2. Select entity type:
   - **All Entities**
   - **Guest**
   - **Event**
   - **Activity**
   - **Vendor**
   - **Content Page**
   - **Location**
   - **Room Type**
   - **User**

3. Logs filter to show only selected entity type

### Filter by Date Range

To see actions within a specific period:

1. Click **Date Range** dropdown
2. Select:
   - **Today**
   - **Last 7 Days**
   - **Last 30 Days**
   - **Last 90 Days**
   - **Custom Range** (select start and end dates)

3. Logs filter to show only selected period

## Searching Logs

### Search by Description

To find specific actions:

1. Enter search terms in the **Search** box
2. Search looks across:
   - Entity names
   - Descriptions
   - User names
   - Action details

3. Results appear in real-time as you type

**Example Searches**:
- "John Doe" → Shows all actions related to guest John Doe
- "email" → Shows all email-related actions
- "delete" → Shows all deletion actions
- "ceremony" → Shows all actions related to ceremony event

## Critical Actions

Critical actions are highlighted with warning indicators:

**Critical Action Types**:
- 🔴 **DELETE**: Entity deletion
- ⚠️ **PERMISSION_CHANGE**: User permission modifications
- ⚠️ **BULK_DELETE**: Multiple entity deletions
- ⚠️ **DATA_EXPORT**: Data export operations

**Why Highlight Critical Actions?**:
- Easy to spot potentially problematic actions
- Quick review of sensitive operations
- Audit compliance requirements
- Security monitoring

## Viewing Log Details

To see full details of a log entry:

1. Click on the log entry row
2. A detail panel opens showing:
   - Complete timestamp
   - User information
   - Full description
   - Metadata (old values, new values)
   - IP address (if available)
   - Browser/device information

**Example Detail View**:
```
┌─────────────────────────────────────────────────────┐
│ Log Entry Details                                   │
├─────────────────────────────────────────────────────┤
│ Timestamp: 2025-01-25 14:30:15 UTC                 │
│ User: Sarah Admin (sarah@example.com)              │
│ Action: UPDATE                                      │
│ Entity: Guest - John Doe (ID: guest-123)           │
│                                                     │
│ Description: Updated guest email address            │
│                                                     │
│ Changes:                                            │
│ • Email: john.old@example.com → john@example.com   │
│                                                     │
│ Metadata:                                           │
│ • IP Address: 192.168.1.100                        │
│ • Browser: Chrome 120.0                            │
│ • Device: Desktop                                   │
└─────────────────────────────────────────────────────┘
```

## Entity Links

Click on entity names in logs to navigate to that entity:

**Example**:
- Click "John Doe" → Opens guest detail page
- Click "Ceremony" → Opens event detail page
- Click "Beach Photos" → Opens vendor detail page

This allows quick investigation of logged actions.

## Exporting Audit Logs

### CSV Export

To export logs for analysis:

1. Set your filters (user, action, entity, date range)
2. Click **Export CSV** button
3. A CSV file downloads with all filtered logs
4. Open in Excel or Google Sheets for analysis

### CSV Contents

The exported CSV includes:
- Timestamp
- User name and email
- Action type
- Entity type and name
- Description
- Metadata (as JSON)

**Use Cases**:
- Compliance reporting
- Security audits
- Troubleshooting issues
- Performance analysis
- User activity tracking

## Pagination

Logs are paginated for performance:

- **50 logs per page** (default)
- Use **Previous** and **Next** buttons to navigate
- Jump to specific page with page number
- Total log count shown at bottom

## Best Practices

### Regular Review

1. **Weekly Review**: Check logs weekly for unusual activity
2. **After Major Changes**: Review logs after bulk operations
3. **Security Monitoring**: Watch for unauthorized access attempts
4. **Compliance**: Export logs monthly for compliance records

### Using Filters Effectively

1. **Start Broad**: Begin with date range filter
2. **Narrow Down**: Add user or entity filters
3. **Search Specific**: Use search for specific entities
4. **Export Results**: Save filtered results for records

### Investigating Issues

When troubleshooting:

1. **Identify Time Frame**: When did the issue occur?
2. **Filter by Entity**: What entity is affected?
3. **Review Actions**: What actions were taken?
4. **Check User**: Who made the changes?
5. **View Details**: Examine metadata for clues

---

## Quick Reference

### RSVP Analytics Metrics

| Metric | Description |
|--------|-------------|
| Response Rate | % of guests who responded |
| Attending | Guests confirmed attending |
| Declined | Guests who cannot attend |
| Maybe | Guests who are unsure |
| Pending | Guests who haven't responded |

### Budget Metrics

| Metric | Description |
|--------|-------------|
| Total Cost | Sum of all expenses |
| Host Contribution | Amount hosts are paying |
| Guest Payments | Amount guests have paid |
| Balance Due | Remaining amount owed |
| Cost Per Guest | Total cost ÷ attending guests |

### Audit Log Actions

| Action | Description |
|--------|-------------|
| CREATE | New entity created |
| UPDATE | Entity modified |
| DELETE | Entity removed |
| LOGIN | User logged in |
| LOGOUT | User logged out |
| PERMISSION_CHANGE | Permissions modified |

### Common Filters

| Filter | Options |
|--------|---------|
| Date Range | Today, Last 7/30/90 days, Custom |
| User | All users, Specific admin |
| Action | All, Create, Update, Delete |
| Entity | All, Guest, Event, Activity, etc. |

---

## Next Steps

Now that you understand analytics and reporting, you can:

1. Monitor RSVP response rates and send reminders
2. Track budget and record vendor payments
3. Review audit logs for system activity
4. Export reports for stakeholders
5. Use insights to make informed decisions

For more information on related features, see:
- [CMS User Guide](./USER_GUIDE_CMS.md)
- [Location Management Guide](./USER_GUIDE_LOCATIONS.md)
- [Room Types Guide](./USER_GUIDE_ROOM_TYPES.md)
- [Transportation Guide](./USER_GUIDE_TRANSPORTATION.md)
