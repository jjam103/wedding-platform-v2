# Transportation Management User Guide

## Overview

The Transportation Management system helps you coordinate guest arrivals and departures by generating manifests, assigning shuttles, calculating vehicle requirements, and creating driver sheets. This ensures smooth logistics for getting guests to and from airports.

## Table of Contents

1. [Understanding Transportation Manifests](#understanding-transportation-manifests)
2. [Viewing Manifests](#viewing-manifests)
3. [Filtering and Searching](#filtering-and-searching)
4. [Shuttle Assignment](#shuttle-assignment)
5. [Vehicle Requirements](#vehicle-requirements)
6. [Driver Sheet Generation](#driver-sheet-generation)
7. [Printing Manifests](#printing-manifests)
8. [Managing Flight Information](#managing-flight-information)

---

## Understanding Transportation Manifests

### What is a Transportation Manifest?

A manifest is a list of guests traveling on a specific date, grouped by time windows. It shows:
- Guest names
- Flight numbers
- Arrival/departure times
- Airport codes
- Shuttle assignments
- Vehicle requirements

### Manifest Types

**Arrivals Manifest**:
- Shows guests arriving at airports
- Grouped by arrival date and time window
- Used to coordinate airport pickups

**Departures Manifest**:
- Shows guests departing from airports
- Grouped by departure date and time window
- Used to coordinate airport drop-offs

### Time Windows

Manifests group guests into time windows for easier coordination:

- **Morning**: 6:00 AM - 12:00 PM
- **Afternoon**: 12:00 PM - 6:00 PM
- **Evening**: 6:00 PM - 12:00 AM
- **Night**: 12:00 AM - 6:00 AM

---

## Viewing Manifests

### Step 1: Navigate to Transportation

1. Log in to the admin dashboard
2. Click on **Logistics** in the sidebar
3. Select **Transportation**

### Step 2: Select Manifest Type

The Transportation page has two tabs:
- **Arrivals**: View arrival manifests
- **Departures**: View departure manifests

Click the appropriate tab to view that manifest type.

### Manifest Display

Manifests are displayed with:

**Header Information**:
- Selected date
- Airport filter
- Total guest count for the day

**Time Window Sections**:
Each time window shows:
- Time range (e.g., "Morning (6:00 AM - 12:00 PM)")
- Guest count for that window
- Guest details table

**Guest Details Table**:
```
┌──────────────┬────────────┬──────────┬────────────┐
│ Guest Name   │ Flight     │ Time     │ Shuttle    │
├──────────────┼────────────┼──────────┼────────────┤
│ John Doe     │ AA123      │ 8:30 AM  │ Van 1      │
│ Jane Smith   │ UA456      │ 9:15 AM  │ Van 1      │
│ Bob Johnson  │ DL789      │ 10:00 AM │ Van 2      │
└──────────────┴────────────┴──────────┴────────────┘
```

### Example Arrival Manifest

```
Transportation Management - Arrivals
Date: June 14, 2025    Airport: All    Total: 24 guests

Morning (6:00 AM - 12:00 PM) - 8 guests
┌──────────────────┬────────────┬──────────┬────────────┐
│ Guest Name       │ Flight     │ Time     │ Shuttle    │
├──────────────────┼────────────┼──────────┼────────────┤
│ Sarah Miller     │ AA123      │ 8:30 AM  │ Van 1      │
│ Michael Chen     │ AA123      │ 8:30 AM  │ Van 1      │
│ Emily Davis      │ UA456      │ 9:15 AM  │ Van 1      │
│ David Wilson     │ DL789      │ 10:00 AM │ Van 2      │
└──────────────────┴────────────┴──────────┴────────────┘

Afternoon (12:00 PM - 6:00 PM) - 12 guests
┌──────────────────┬────────────┬──────────┬────────────┐
│ Guest Name       │ Flight     │ Time     │ Shuttle    │
├──────────────────┼────────────┼──────────┼────────────┤
│ Lisa Anderson    │ SW234      │ 1:45 PM  │ Van 3      │
│ ...              │ ...        │ ...      │ ...        │
└──────────────────┴────────────┴──────────┴────────────┘

Evening (6:00 PM - 12:00 AM) - 4 guests
┌──────────────────┬────────────┬──────────┬────────────┐
│ Guest Name       │ Flight     │ Time     │ Shuttle    │
├──────────────────┼────────────┼──────────┼────────────┤
│ Tom Martinez     │ JB567      │ 7:30 PM  │ Van 4      │
│ ...              │ ...        │ ...      │ ...        │
└──────────────────┴────────────┴──────────┴────────────┘

Vehicle Requirements:
• 2 Vans (12 passengers each) - $200
• 1 SUV (6 passengers) - $100
Total Cost: $300
```

---

## Filtering and Searching

### Date Filter

To view manifests for a specific date:

1. Click the **Date** dropdown
2. Select a date from the calendar
3. Or type the date in format: YYYY-MM-DD
4. The manifest updates to show guests for that date

**Quick Date Selection**:
- **Today**: Click "Today" button
- **Tomorrow**: Click "Tomorrow" button
- **Next 7 Days**: Use the week view in calendar

### Airport Filter

To filter by airport:

1. Click the **Airport** dropdown
2. Select an airport:
   - **All**: Show all airports
   - **SJO**: Juan Santamaría International Airport (San José)
   - **LIR**: Daniel Oduber Quirós International Airport (Liberia)
   - **Other**: Other airports

3. The manifest updates to show only guests using that airport

**Example**: Filtering for LIR arrivals on June 14
```
Date: June 14, 2025    Airport: LIR    Total: 15 guests
```

### Combining Filters

You can combine date and airport filters:

**Example**: View all SJO arrivals on June 15
1. Set Date: June 15, 2025
2. Set Airport: SJO
3. View filtered manifest

---

## Shuttle Assignment

### Why Assign Shuttles?

Shuttle assignments help:
- Organize guests into vehicle groups
- Ensure vehicles aren't overloaded
- Coordinate driver schedules
- Track which guests are on which shuttles

### Assigning a Guest to a Shuttle

#### Method 1: From Manifest

1. Find the guest in the manifest table
2. Click in the **Shuttle** column for that guest
3. A dropdown appears with shuttle options:
   - Van 1, Van 2, Van 3, etc.
   - SUV 1, SUV 2, etc.
   - Bus 1, Bus 2, etc.
   - Unassigned

4. Select a shuttle
5. The assignment saves automatically

#### Method 2: Bulk Assignment

1. Select multiple guests (checkboxes)
2. Click **Assign to Shuttle** button
3. Choose a shuttle from the dropdown
4. Click **Assign**
5. All selected guests are assigned to that shuttle

### Shuttle Naming

Shuttles are automatically named based on vehicle type:
- **Vans**: Van 1, Van 2, Van 3, etc.
- **SUVs**: SUV 1, SUV 2, etc.
- **Buses**: Bus 1, Bus 2, etc.

You can customize shuttle names:
1. Click **Manage Shuttles** button
2. Edit shuttle names
3. Click **Save**

### Viewing Shuttle Assignments

To see all guests assigned to a specific shuttle:

1. Click **View by Shuttle** button
2. Shuttles are displayed with their assigned guests
3. Each shuttle shows:
   - Shuttle name
   - Capacity (e.g., 8/12 passengers)
   - Guest list
   - Pickup times

**Example**:
```
Van 1 (8/12 passengers)
┌──────────────────┬────────────┬──────────┐
│ Guest Name       │ Flight     │ Time     │
├──────────────────┼────────────┼──────────┤
│ Sarah Miller     │ AA123      │ 8:30 AM  │
│ Michael Chen     │ AA123      │ 8:30 AM  │
│ Emily Davis      │ UA456      │ 9:15 AM  │
│ David Wilson     │ DL789      │ 10:00 AM │
│ Lisa Anderson    │ SW234      │ 1:45 PM  │
│ Tom Martinez     │ JB567      │ 7:30 PM  │
│ Anna Garcia      │ NK890      │ 8:00 PM  │
│ Chris Lee        │ F9123      │ 9:30 PM  │
└──────────────────┴────────────┴──────────┘
```

### Unassigning Guests

To remove a shuttle assignment:

1. Find the guest in the manifest
2. Click in the **Shuttle** column
3. Select **Unassigned**
4. The guest is removed from the shuttle

### Capacity Validation

The system prevents over-assignment:

**Warning**: If you try to assign more guests than a shuttle can hold:
```
⚠️ Capacity Exceeded
Van 1 is at capacity (12/12 passengers).
Cannot assign more guests to this shuttle.

Options:
• Assign to a different shuttle
• Create a new shuttle
• Use a larger vehicle
```

---

## Vehicle Requirements

### Automatic Calculation

The system automatically calculates vehicle requirements based on:
- Total guest count
- Time window distribution
- Vehicle capacities

### Vehicle Types and Capacities

Standard vehicle capacities:
- **Van**: 12 passengers
- **SUV**: 6 passengers
- **Bus**: 40 passengers
- **Sedan**: 4 passengers

### Viewing Vehicle Requirements

Vehicle requirements appear at the bottom of each manifest:

```
Vehicle Requirements:
• 2 Vans (12 passengers each) - $200
• 1 SUV (6 passengers) - $100
Total Cost: $300
```

### Cost Calculation

Costs are calculated based on:
- Vehicle type
- Number of vehicles needed
- Standard rates per vehicle

**Standard Rates** (customizable):
- Van: $100 per trip
- SUV: $100 per trip
- Bus: $300 per trip
- Sedan: $50 per trip

### Optimizing Vehicle Usage

**Tips for Efficient Vehicle Use**:

1. **Group by Time**: Assign guests with similar arrival times to the same shuttle
2. **Fill Vehicles**: Try to fill vehicles to capacity before adding more
3. **Consider Luggage**: Account for luggage space when assigning capacity
4. **Coordinate Pickups**: Group guests from the same flight when possible

**Example Optimization**:

Before (Inefficient):
```
Van 1: 4 passengers (33% capacity)
Van 2: 3 passengers (25% capacity)
Van 3: 5 passengers (42% capacity)
Total: 3 vans for 12 passengers
```

After (Optimized):
```
Van 1: 12 passengers (100% capacity)
Total: 1 van for 12 passengers
```

---

## Driver Sheet Generation

### What is a Driver Sheet?

A driver sheet is a printable document for shuttle drivers containing:
- Driver name and contact
- Vehicle information
- Pickup schedule
- Guest details
- Special instructions
- Route information

### Generating Driver Sheets

1. On the Transportation page, click **Generate Driver Sheets**
2. Select the date
3. Select which shuttles to include (or select all)
4. Click **Generate**
5. Driver sheets are created as PDF files

### Driver Sheet Content

Each driver sheet includes:

**Header**:
- Date
- Driver name
- Vehicle type and ID
- Contact information

**Pickup Schedule**:
```
┌──────────┬──────────────────┬────────────┬─────────────┐
│ Time     │ Guest Name       │ Flight     │ Airport     │
├──────────┼──────────────────┼────────────┼─────────────┤
│ 8:30 AM  │ Sarah Miller     │ AA123      │ LIR         │
│ 8:30 AM  │ Michael Chen     │ AA123      │ LIR         │
│ 9:15 AM  │ Emily Davis      │ UA456      │ LIR         │
│ 10:00 AM │ David Wilson     │ DL789      │ LIR         │
└──────────┴──────────────────┴────────────┴─────────────┘
```

**Guest Details**:
- Phone numbers
- Special requests (wheelchair, child seat, etc.)
- Luggage count
- Destination (hotel/resort)

**Route Information**:
- Airport location
- Destination addresses
- Estimated travel time
- Map (if available)

**Special Instructions**:
- Any notes for the driver
- Emergency contacts
- Alternative pickup locations

### Printing Driver Sheets

1. After generating, click **Print** button
2. Or click **Download PDF** to save
3. Print one copy per driver
4. Provide to drivers before pickup day

### Updating Driver Sheets

If guest information changes:

1. Update the guest details in Guest Management
2. Regenerate the driver sheets
3. Provide updated sheets to drivers

---

## Printing Manifests

### Print-Friendly Format

The system provides a printer-friendly manifest format optimized for:
- Clear readability
- Efficient paper use
- Easy reference in the field

### Printing a Manifest

1. Set your date and airport filters
2. Click **Print Manifest** button
3. A print preview opens
4. Adjust print settings if needed:
   - Paper size: Letter or A4
   - Orientation: Portrait or Landscape
   - Margins: Normal

5. Click **Print**

### Manifest Print Layout

The printed manifest includes:

**Header**:
- Date
- Airport
- Manifest type (Arrivals/Departures)
- Total guest count
- Print date and time

**Guest Tables**:
- Organized by time window
- Clear column headers
- Alternating row colors for readability

**Footer**:
- Vehicle requirements summary
- Total cost
- Emergency contact information
- Page numbers

### Use Cases for Printed Manifests

1. **Airport Coordination**: Give to airport coordinator
2. **Driver Reference**: Provide to shuttle drivers
3. **Backup**: Keep physical copy in case of tech issues
4. **Check-In**: Use for guest check-in at airport
5. **Records**: File for documentation purposes

---

## Managing Flight Information

### Adding Flight Information

Flight information is managed in Guest Management:

1. Go to **Guest Management** → **Guests**
2. Find the guest
3. Click **Edit**
4. Scroll to **Travel Information** section
5. Fill in flight details:
   - **Arrival Airport**: SJO, LIR, or Other
   - **Arrival Date**: Date of arrival
   - **Arrival Flight Number**: e.g., AA123
   - **Arrival Time**: e.g., 8:30 AM
   - **Departure Airport**: SJO, LIR, or Other
   - **Departure Date**: Date of departure
   - **Departure Flight Number**: e.g., AA456
   - **Departure Time**: e.g., 3:00 PM

6. Click **Save**

### Updating Flight Information

If a guest's flight changes:

1. Edit the guest record
2. Update the flight details
3. Save changes
4. The manifest updates automatically
5. Regenerate driver sheets if already created

### Bulk Flight Updates

To update multiple guests at once:

1. Go to **Guest Management** → **Guests**
2. Click **Bulk Edit** button
3. Select guests to update
4. Choose **Update Flight Information**
5. Enter new flight details
6. Click **Apply to Selected**

### Flight Status Tracking

The system can integrate with flight tracking APIs to show:
- On-time status
- Delays
- Gate changes
- Cancellations

**Note**: Flight tracking requires API integration setup. Contact your administrator to enable this feature.

---

## Best Practices

### Planning Ahead

1. **Collect Flight Info Early**: Request flight details from guests as soon as possible
2. **Set Deadlines**: Give guests a deadline for providing flight information
3. **Regular Updates**: Check for flight changes weekly leading up to the event
4. **Confirm 48 Hours Before**: Verify all flight details 2 days before arrival

### Shuttle Coordination

1. **Group by Flight**: Assign guests on the same flight to the same shuttle when possible
2. **Buffer Time**: Allow 30-60 minutes between pickups for the same shuttle
3. **Capacity Planning**: Don't fill shuttles to 100% - leave room for luggage
4. **Backup Plan**: Have extra vehicles on standby for delays or changes

### Communication

1. **Share Manifests**: Provide manifests to all relevant staff
2. **Driver Briefing**: Brief drivers on routes, guests, and special needs
3. **Guest Notifications**: Send guests their shuttle assignments before arrival
4. **Contact Information**: Ensure drivers have emergency contact numbers

### Day-Of Coordination

1. **Monitor Flights**: Track flight status on arrival day
2. **Update Manifests**: Adjust for delays or changes
3. **Driver Check-In**: Confirm drivers are in position
4. **Guest Communication**: Text guests with shuttle details upon landing

---

## Troubleshooting

### Common Issues

**Problem**: Guest not appearing in manifest
- **Solution**: Verify guest has flight information entered. Check that arrival/departure date matches the selected date. Ensure guest RSVP status is "attending".

**Problem**: Cannot assign guest to shuttle - capacity error
- **Solution**: The shuttle is full. Assign guest to a different shuttle or create a new shuttle.

**Problem**: Vehicle requirements seem incorrect
- **Solution**: Check that all guests have shuttle assignments. Verify vehicle capacities are set correctly. Recalculate by refreshing the page.

**Problem**: Driver sheet missing guest information
- **Solution**: Ensure guest record has complete travel information. Regenerate driver sheets after updating guest details.

**Problem**: Manifest shows wrong time window
- **Solution**: Verify guest arrival/departure time is correct. Check that time zone is set correctly in system settings.

**Problem**: Cannot print manifest - formatting issues
- **Solution**: Try different browser (Chrome recommended). Check print settings. Use "Print to PDF" option if printer issues persist.

### Getting Help

If you encounter issues not covered in this guide:

1. Check **Guest Management** to verify flight information is complete
2. Review **Audit Logs** to see recent transportation changes
3. Verify date and airport filters are set correctly
4. Contact your system administrator for assistance

---

## Quick Reference

### Airport Codes

| Code | Airport Name | Location |
|------|-------------|----------|
| SJO | Juan Santamaría International Airport | San José, Costa Rica |
| LIR | Daniel Oduber Quirós International Airport | Liberia, Guanacaste |

### Time Windows

| Window | Time Range |
|--------|------------|
| Morning | 6:00 AM - 12:00 PM |
| Afternoon | 12:00 PM - 6:00 PM |
| Evening | 6:00 PM - 12:00 AM |
| Night | 12:00 AM - 6:00 AM |

### Vehicle Capacities

| Vehicle Type | Capacity | Typical Cost |
|--------------|----------|--------------|
| Sedan | 4 passengers | $50 |
| SUV | 6 passengers | $100 |
| Van | 12 passengers | $100 |
| Bus | 40 passengers | $300 |

### Common Actions

| Action | Steps |
|--------|-------|
| View arrivals | **Transportation** → **Arrivals** tab |
| View departures | **Transportation** → **Departures** tab |
| Filter by date | Click **Date** → Select date |
| Filter by airport | Click **Airport** → Select airport |
| Assign shuttle | Click guest's **Shuttle** cell → Select shuttle |
| Generate driver sheets | **Generate Driver Sheets** → Select date → **Generate** |
| Print manifest | Set filters → **Print Manifest** |

---

## Next Steps

Now that you understand transportation management, you can:

1. Collect flight information from all guests
2. Generate manifests for arrival and departure days
3. Assign guests to shuttles
4. Create driver sheets for shuttle drivers
5. Print manifests for coordination staff

For more information on related features, see:
- [CMS User Guide](./USER_GUIDE_CMS.md)
- [Location Management Guide](./USER_GUIDE_LOCATIONS.md)
- [Room Types Guide](./USER_GUIDE_ROOM_TYPES.md)
- [Analytics Guide](./USER_GUIDE_ANALYTICS.md)
