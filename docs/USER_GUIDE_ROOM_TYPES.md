# Room Types Management User Guide

## Overview

Room Types allow you to organize accommodations into specific categories (e.g., Ocean View Suite, Standard Room, Villa) and track capacity, pricing, and guest assignments. This helps you manage lodging efficiently and ensure all guests have appropriate accommodations.

## Table of Contents

1. [Understanding Room Types](#understanding-room-types)
2. [Accessing Room Types](#accessing-room-types)
3. [Creating Room Types](#creating-room-types)
4. [Capacity Tracking](#capacity-tracking)
5. [Guest Assignment](#guest-assignment)
6. [Pricing Management](#pricing-management)
7. [Room Type Content](#room-type-content)
8. [Managing Occupancy](#managing-occupancy)

---

## Understanding Room Types

### What are Room Types?

Room Types are categories of rooms within an accommodation. Each room type has:
- **Name**: Descriptive name (e.g., "Ocean View Suite", "Standard Double")
- **Capacity**: Maximum number of guests per room
- **Pricing**: Cost per night
- **Dates**: Check-in and check-out dates
- **Assignments**: Which guests are assigned to this room type

### Accommodation Hierarchy

```
🏨 Accommodation (Hotel/Resort)
  ├─ 🛏️ Room Type 1 (Ocean View Suite)
  │   ├─ Guest 1
  │   ├─ Guest 2
  │   └─ Guest 3
  ├─ 🛏️ Room Type 2 (Standard Double)
  │   ├─ Guest 4
  │   └─ Guest 5
  └─ 🛏️ Room Type 3 (Villa)
      ├─ Guest 6
      ├─ Guest 7
      ├─ Guest 8
      └─ Guest 9
```

### Why Use Room Types?

1. **Organization**: Group similar rooms together
2. **Capacity Management**: Track how many guests can stay in each room type
3. **Pricing**: Set different prices for different room categories
4. **Assignment**: Assign specific guests to specific room types
5. **Reporting**: See occupancy rates and availability at a glance

---

## Accessing Room Types

### Step 1: Navigate to Accommodations

1. Log in to the admin dashboard
2. Click on **Logistics** in the sidebar
3. Select **Accommodations**

### Step 2: Select an Accommodation

1. Find the accommodation in the list
2. Click the **Room Types** button next to it
3. The Room Types page opens for that accommodation

### Room Types Page Layout

The page displays:
- **Accommodation Name**: At the top (e.g., "Room Types: Tamarindo Diria Beach Resort")
- **+ Add Room Type**: Button to create new room types
- **Back to Accommodations**: Link to return to accommodations list
- **Room Types Table**: List of all room types with details

---

## Creating Room Types

### Step 1: Open the Form

1. On the Room Types page, click **+ Add Room Type**
2. The form expands below the button

### Step 2: Fill in Required Fields

#### Room Type Name (Required)
- Descriptive name for the room category
- Be specific and clear
- Examples:
  - "Ocean View Suite"
  - "Standard Double Room"
  - "Deluxe King"
  - "Family Villa"
  - "Beachfront Bungalow"

#### Capacity (Required)
- Maximum number of guests per room
- Enter a positive integer
- Examples:
  - 2 for double rooms
  - 4 for family rooms
  - 6 for villas

#### Price Per Night (Required)
- Cost per night in your currency
- Enter as a decimal number
- Examples:
  - 150.00 for $150/night
  - 250.50 for $250.50/night

#### Check-In Date (Required)
- Date guests can check in
- Use the date picker or type in format: YYYY-MM-DD
- Example: 2025-06-14

#### Check-Out Date (Required)
- Date guests must check out
- Must be after check-in date
- Use the date picker or type in format: YYYY-MM-DD
- Example: 2025-06-17

### Step 3: Add Optional Fields

#### Description (Optional)
- Additional details about the room type
- Include amenities, views, special features
- Example:
  ```
  Spacious suite with ocean views, king bed, private balcony, 
  mini-fridge, coffee maker, and complimentary WiFi. 
  Located on floors 3-5 with elevator access.
  ```

### Step 4: Save the Room Type

1. Review all fields
2. Click **Create Room Type**
3. The room type appears in the table
4. The form collapses and clears

### Example: Creating a Room Type

Let's create an "Ocean View Suite":

1. **Name**: Ocean View Suite
2. **Capacity**: 2
3. **Price Per Night**: 200.00
4. **Check-In Date**: 2025-06-14
5. **Check-Out Date**: 2025-06-17
6. **Description**: Luxury suite with panoramic ocean views, king bed, private balcony, and premium amenities.
7. Click **Create Room Type**

---

## Capacity Tracking

### Understanding Capacity

Each room type has:
- **Capacity**: Maximum guests per room (set when creating room type)
- **Assigned Guests**: Number of guests currently assigned
- **Occupancy**: Percentage of capacity filled

### Viewing Capacity

The room types table shows capacity information:

```
┌─────────────────────┬──────────┬─────────────┬────────────┐
│ Name                │ Capacity │ Price/Night │ Occupancy  │
├─────────────────────┼──────────┼─────────────┼────────────┤
│ Ocean View Suite    │ 2        │ $200        │ 2/2 (100%) │
│ Standard Double     │ 2        │ $150        │ 1/2 (50%)  │
│ Family Villa        │ 6        │ $400        │ 4/6 (67%)  │
└─────────────────────┴──────────┴─────────────┴────────────┘
```

### Occupancy Indicators

The system uses color coding to show occupancy status:

- **Green (0-89%)**: Available capacity
  - Example: 1/2 (50%) - Room has space

- **Orange (90-99%)**: Near capacity
  - Example: 5/6 (83%) - Almost full

- **Red (100%)**: At capacity
  - Example: 2/2 (100%) - Full

### Capacity Warnings

When a room type reaches high occupancy:

**90%+ Capacity**:
```
⚠️ Near Capacity
Ocean View Suite is at 90% capacity (9/10 guests)
```

**100% Capacity**:
```
🔴 At Capacity
Standard Double is full (2/2 guests)
Cannot assign more guests to this room type.
```

### Managing Capacity

If a room type is full:

1. **Create Additional Room Type**: Add more rooms of the same type
2. **Increase Capacity**: Edit the room type to increase capacity (if rooms can accommodate more guests)
3. **Reassign Guests**: Move guests to a different room type
4. **Add New Accommodation**: If the entire property is full

---

## Guest Assignment

### Assigning Guests to Room Types

#### Method 1: From Room Types Page

1. Find the room type in the table
2. Click **Assign Guests** button
3. A guest selection dialog opens
4. Select guests from the list (checkboxes)
5. Click **Assign Selected**
6. Guests are assigned to the room type

#### Method 2: From Guest Management

1. Go to **Guest Management** → **Guests**
2. Find the guest in the list
3. Click **Edit** on the guest
4. In the guest form, find **Room Assignment**
5. Select the accommodation and room type
6. Click **Save**

### Viewing Assigned Guests

To see which guests are assigned to a room type:

1. Find the room type in the table
2. Click **View Guests** button
3. A list of assigned guests appears showing:
   - Guest name
   - Email
   - Age type (adult/child)
   - Plus-one information

### Unassigning Guests

To remove a guest from a room type:

1. Click **View Guests** on the room type
2. Find the guest in the list
3. Click **Unassign** next to their name
4. Confirm the action
5. The guest is removed from the room type
6. Occupancy updates automatically

### Assignment Rules

**Capacity Validation**:
- Cannot assign more guests than capacity allows
- System prevents over-assignment
- Warning appears if attempting to exceed capacity

**Multiple Assignments**:
- A guest can only be assigned to one room type at a time
- Assigning to a new room type removes previous assignment

**Plus-Ones**:
- Plus-ones count toward capacity
- Assign both primary guest and plus-one to same room type

---

## Pricing Management

### Setting Prices

Prices are set per night when creating or editing a room type.

**Price Format**:
- Enter as decimal number
- Example: 150.00 (not $150 or 150)
- System adds currency symbol in display

### Viewing Total Costs

The system calculates total costs automatically:

**Formula**:
```
Total Cost = Price Per Night × Number of Nights
```

**Example**:
```
Ocean View Suite
Price Per Night: $200
Check-In: June 14, 2025
Check-Out: June 17, 2025
Number of Nights: 3
Total Cost: $200 × 3 = $600
```

### Updating Prices

To change the price:

1. Find the room type in the table
2. Click **Edit**
3. Update **Price Per Night** field
4. Click **Save Changes**
5. Total costs recalculate automatically

### Price Considerations

**Per Room vs. Per Guest**:
- Prices are per room, not per guest
- A room with 2 guests costs the same as a room with 1 guest
- Consider this when setting capacity and pricing

**Subsidies**:
- Host subsidies are tracked in the Budget Dashboard
- Room costs contribute to overall wedding budget
- See [Analytics Guide](./USER_GUIDE_ANALYTICS.md) for budget tracking

---

## Room Type Content

### Adding Descriptions and Photos

Each room type can have rich content to help guests understand what to expect.

### Managing Sections

1. Find the room type in the table
2. Click **Manage Sections** button
3. The Section Editor opens (same as content pages)
4. Add sections with:
   - Rich text descriptions
   - Photo galleries
   - Amenity lists
   - Location information

### Section Editor Features

The Section Editor for room types supports:
- **Rich Text**: Describe the room, amenities, views
- **Photos**: Show room images, views, facilities
- **References**: Link to nearby activities or events
- **Layouts**: One-column or two-column sections

**Example Section Content**:

**Section 1: Room Description**
```
The Ocean View Suite offers luxury accommodations with breathtaking 
Pacific Ocean views. Each suite features a king-size bed, private 
balcony, and modern amenities for your comfort.
```

**Section 2: Amenities** (Two Columns)
```
Column 1:                    Column 2:
• King-size bed              • Private balcony
• Ocean view                 • Mini-fridge
• Air conditioning           • Coffee maker
• Flat-screen TV             • Complimentary WiFi
```

**Section 3: Photos**
- Room interior photos
- Balcony view photos
- Bathroom photos

For detailed Section Editor instructions, see [CMS User Guide](./USER_GUIDE_CMS.md).

---

## Managing Occupancy

### Viewing Occupancy Reports

To see overall occupancy across all room types:

1. Go to **Logistics** → **Accommodations**
2. Click on an accommodation
3. Click **Room Types**
4. View the occupancy summary at the top:

```
┌─────────────────────────────────────────────┐
│ Occupancy Summary                           │
│ Total Capacity: 20 guests                   │
│ Assigned: 15 guests                         │
│ Available: 5 spaces                         │
│ Occupancy Rate: 75%                         │
└─────────────────────────────────────────────┘
```

### Optimizing Room Assignments

**Tips for Efficient Assignment**:

1. **Fill Rooms Completely**: Assign guests to fill rooms to capacity before starting new rooms
2. **Group Families**: Assign family members to the same room type
3. **Consider Preferences**: Assign guests based on room preferences (ocean view, ground floor, etc.)
4. **Balance Occupancy**: Distribute guests evenly across room types when possible

**Example Optimization**:

Before (Inefficient):
```
Ocean View Suite (2 capacity): 1 guest assigned (50%)
Standard Double (2 capacity): 1 guest assigned (50%)
Family Villa (6 capacity): 2 guests assigned (33%)
```

After (Optimized):
```
Ocean View Suite (2 capacity): 2 guests assigned (100%)
Standard Double (2 capacity): 2 guests assigned (100%)
Family Villa (6 capacity): 0 guests assigned (0%)
```

### Handling Capacity Issues

**Problem**: All room types are full, but more guests need accommodation

**Solutions**:

1. **Add More Room Types**:
   - Create additional room types of the same category
   - Example: "Ocean View Suite 2", "Ocean View Suite 3"

2. **Increase Capacity**:
   - Edit existing room types to increase capacity
   - Only if rooms can physically accommodate more guests

3. **Add New Accommodation**:
   - Create a new accommodation property
   - Add room types to the new property

4. **Reassign Guests**:
   - Move guests to different room types with availability
   - Consider guest preferences and needs

---

## Best Practices

### Naming Room Types

1. **Be Descriptive**: Include key features in the name
   - ✅ "Ocean View King Suite"
   - ❌ "Room Type 1"

2. **Use Consistent Format**: Keep naming consistent across properties
   - ✅ "Standard Double", "Deluxe Double", "Premium Double"
   - ❌ "Standard Double", "Deluxe Room with 2 Beds", "Premium (2 guests)"

3. **Include View/Location**: When relevant
   - ✅ "Beachfront Bungalow"
   - ✅ "Garden View Suite"
   - ✅ "Poolside Villa"

### Setting Capacity

1. **Be Realistic**: Set capacity based on actual room size and beds
2. **Consider Comfort**: Don't maximize capacity at expense of comfort
3. **Account for Children**: Consider if children count toward capacity
4. **Plus-Ones**: Ensure capacity accommodates plus-ones

### Pricing Strategy

1. **Market Research**: Check comparable properties for pricing guidance
2. **Tiered Pricing**: Offer different price points for different room types
3. **Value Proposition**: Higher prices should reflect better amenities/views
4. **Group Rates**: Consider offering discounts for booking multiple rooms

### Guest Assignment

1. **Assign Early**: Assign guests to rooms as soon as possible
2. **Communicate**: Let guests know their room assignments
3. **Flexibility**: Be prepared to adjust assignments as needed
4. **Preferences**: Track and honor guest room preferences when possible

---

## Troubleshooting

### Common Issues

**Problem**: Cannot assign guest - room type at capacity
- **Solution**: Check occupancy. Either increase capacity, create additional room type, or assign guest to different room type.

**Problem**: Guest assigned to wrong room type
- **Solution**: Unassign guest from current room type, then assign to correct room type.

**Problem**: Occupancy percentage seems incorrect
- **Solution**: Verify capacity is set correctly. Check that all assigned guests are still attending (not declined RSVPs).

**Problem**: Cannot create room type - validation error
- **Solution**: Ensure all required fields are filled. Check that check-out date is after check-in date. Verify capacity is a positive integer.

**Problem**: Room type not appearing in guest assignment dropdown
- **Solution**: Ensure room type is saved. Check that you're looking at the correct accommodation. Refresh the page.

**Problem**: Total cost calculation seems wrong
- **Solution**: Verify price per night is correct. Check check-in and check-out dates. Ensure dates are in correct format.

### Getting Help

If you encounter issues not covered in this guide:

1. Check the **Audit Logs** to see recent room type changes
2. Verify guest assignments in **Guest Management**
3. Review accommodation details in **Accommodations** page
4. Contact your system administrator for assistance

---

## Quick Reference

### Room Type Fields

| Field | Required | Description | Example |
|-------|----------|-------------|---------|
| Name | Yes | Room category name | "Ocean View Suite" |
| Capacity | Yes | Max guests per room | 2 |
| Price Per Night | Yes | Cost per night | 200.00 |
| Check-In Date | Yes | Guest arrival date | 2025-06-14 |
| Check-Out Date | Yes | Guest departure date | 2025-06-17 |
| Description | No | Room details | "Luxury suite with ocean views..." |

### Occupancy Status Colors

| Color | Occupancy | Status |
|-------|-----------|--------|
| 🟢 Green | 0-89% | Available |
| 🟠 Orange | 90-99% | Near Capacity |
| 🔴 Red | 100% | At Capacity |

### Common Actions

| Action | Steps |
|--------|-------|
| Create room type | **+ Add Room Type** → Fill form → **Create** |
| Edit room type | Find in table → **Edit** → Update → **Save** |
| Delete room type | Find in table → **Delete** → Confirm |
| Assign guests | **Assign Guests** → Select guests → **Assign** |
| View assignments | **View Guests** → See assigned guests |
| Unassign guest | **View Guests** → **Unassign** → Confirm |
| Add content | **Manage Sections** → Use Section Editor |

---

## Next Steps

Now that you understand room type management, you can:

1. Create room types for your accommodations
2. Set appropriate capacity and pricing
3. Assign guests to room types
4. Add rich content with photos and descriptions
5. Monitor occupancy and adjust as needed

For more information on related features, see:
- [CMS User Guide](./USER_GUIDE_CMS.md) - For managing room type content
- [Location Management Guide](./USER_GUIDE_LOCATIONS.md) - For accommodation locations
- [Transportation Guide](./USER_GUIDE_TRANSPORTATION.md) - For coordinating guest arrivals
- [Analytics Guide](./USER_GUIDE_ANALYTICS.md) - For budget and occupancy reporting
