# Location Management User Guide

## Overview

The Location Management system allows you to organize venues, airports, hotels, and other locations in a hierarchical structure. This makes it easy to group related locations and assign them to events, activities, and accommodations.

## Table of Contents

1. [Understanding Location Hierarchy](#understanding-location-hierarchy)
2. [Creating Locations](#creating-locations)
3. [Managing the Location Tree](#managing-the-location-tree)
4. [Circular Reference Prevention](#circular-reference-prevention)
5. [Using Location Selector](#using-location-selector)
6. [Searching Locations](#searching-locations)
7. [Deleting Locations](#deleting-locations)

---

## Understanding Location Hierarchy

Locations are organized in a tree structure with parent-child relationships. This allows you to create logical groupings like:

```
📍 Costa Rica (Country)
  ├─ 📍 Guanacaste Province (Region)
  │   ├─ 📍 Tamarindo (City)
  │   │   ├─ 🏨 Tamarindo Diria Beach Resort (Venue)
  │   │   ├─ 🏖️ Playa Tamarindo (Beach)
  │   │   └─ 🍽️ Pangas Beach Club (Restaurant)
  │   └─ 📍 Playa Flamingo (City)
  │       └─ 🏨 Flamingo Beach Resort (Venue)
  └─ 📍 San José (City)
      └─ ✈️ Juan Santamaría International Airport (Airport)
```

### Hierarchy Levels

While there's no strict limit, typical hierarchies follow this pattern:

1. **Country**: Top-level location (e.g., Costa Rica, Mexico)
2. **Region/Province**: State or province (e.g., Guanacaste, Puntarenas)
3. **City/Town**: Municipality (e.g., Tamarindo, San José)
4. **Venue**: Specific location (e.g., hotel, beach, restaurant, airport)

### Benefits of Hierarchy

- **Organization**: Group related locations together
- **Context**: See where a venue is located at a glance
- **Filtering**: Filter events/activities by region or city
- **Clarity**: Guests understand location relationships

---

## Creating Locations

### Step 1: Navigate to Locations

1. Log in to the admin dashboard
2. Click on **Event Planning** in the sidebar
3. Select **Locations**

### Step 2: Add a New Location

1. Click the **+ Add Location** button
2. The form expands below the button
3. Fill in the required fields:

#### Required Fields

**Name** (Required)
- The location name (e.g., "Tamarindo Diria Beach Resort")
- Keep it clear and descriptive
- Use the official name when possible

**Parent Location** (Optional)
- Select a parent location from the dropdown
- Leave empty for top-level locations (countries)
- Choose the most specific parent (e.g., city rather than country)

#### Optional Fields

**Address**
- Full street address
- Include postal code if available
- Example: "Playa Tamarindo, Guanacaste, 50309, Costa Rica"

**Description**
- Additional details about the location
- Include directions, landmarks, or special instructions
- Example: "Beachfront resort with ocean views. Main entrance on Calle Principal."

**Coordinates** (Latitude/Longitude)
- GPS coordinates for mapping
- Format: Latitude, Longitude
- Example: "10.2994, -85.8450"

### Step 3: Save the Location

1. Review all fields
2. Click **Create Location**
3. The location appears in the tree view
4. The form collapses and clears

### Example: Creating a Venue

Let's create "Pangas Beach Club" restaurant:

1. **Name**: Pangas Beach Club
2. **Parent Location**: Tamarindo (select from dropdown)
3. **Address**: Playa Tamarindo, 100m north of Diria Resort
4. **Description**: Upscale beachfront restaurant with sunset views. Reservations recommended.
5. Click **Create Location**

Result in tree:
```
📍 Tamarindo
  ├─ 🏨 Tamarindo Diria Beach Resort
  ├─ 🏖️ Playa Tamarindo
  └─ 🍽️ Pangas Beach Club  ← New location
```

---

## Managing the Location Tree

### Viewing the Tree

The location tree displays all locations in a hierarchical structure:

- **Expand/Collapse**: Click the arrow (▶/▼) next to a location to show/hide children
- **Icons**: Different icons indicate location types (📍 general, 🏨 hotel, ✈️ airport, etc.)
- **Indentation**: Child locations are indented under their parents

### Expanding and Collapsing

**Expand a Location**:
1. Click the ▶ arrow next to a location name
2. Child locations appear below, indented
3. The arrow changes to ▼

**Collapse a Location**:
1. Click the ▼ arrow next to a location name
2. Child locations are hidden
3. The arrow changes to ▶

**Expand All**:
- Click **Expand All** button at the top
- All locations with children expand
- Useful for seeing the full hierarchy

**Collapse All**:
- Click **Collapse All** button at the top
- All locations collapse to top level
- Useful for simplifying the view

### Editing Locations

1. Find the location in the tree
2. Click the **Edit** button next to it
3. The edit form appears with current values
4. Make your changes
5. Click **Save Changes**

**What You Can Edit**:
- Name
- Parent location (see [Changing Parent](#changing-parent-location))
- Address
- Description
- Coordinates

### Changing Parent Location

You can move a location to a different parent:

1. Edit the location
2. Select a new parent from the **Parent Location** dropdown
3. Click **Save Changes**

**Important**: The system prevents circular references (see [Circular Reference Prevention](#circular-reference-prevention))

**Example**: Moving a venue to a different city
```
Before:
📍 Tamarindo
  └─ 🏨 Flamingo Beach Resort  ← Wrong city

After moving:
📍 Tamarindo
📍 Playa Flamingo
  └─ 🏨 Flamingo Beach Resort  ← Correct city
```

### Drag and Drop (Future Feature)

In future versions, you'll be able to drag locations to change their parent. For now, use the edit form to change parent relationships.

---

## Circular Reference Prevention

The system prevents circular references, which occur when a location becomes its own ancestor.

### What is a Circular Reference?

A circular reference creates an infinite loop in the hierarchy:

```
❌ INVALID:
A → B → C → A  (A is parent of B, B is parent of C, C is parent of A)
```

This would create an impossible situation where:
- A is the parent of B
- B is the parent of C
- C is the parent of A (making A its own grandparent!)

### How the System Prevents This

When you try to set a parent location, the system checks:

1. **Direct Self-Reference**: You cannot set a location as its own parent
   ```
   ❌ Tamarindo → Parent: Tamarindo
   ```

2. **Child as Parent**: You cannot set a child location as the parent
   ```
   ❌ Guanacaste → Parent: Tamarindo
   (when Tamarindo is already a child of Guanacaste)
   ```

3. **Descendant as Parent**: You cannot set any descendant as the parent
   ```
   ❌ Costa Rica → Parent: Tamarindo Diria Resort
   (when the resort is a descendant of Costa Rica)
   ```

### Error Messages

If you attempt to create a circular reference, you'll see an error message:

```
⚠️ Circular Reference Detected

Cannot set this parent location because it would create a circular reference:

Costa Rica → Guanacaste → Tamarindo → Tamarindo Diria Resort → Costa Rica

Please choose a different parent location.
```

The error shows the complete reference chain so you can understand the problem.

### How to Fix Circular Reference Errors

1. **Review the Hierarchy**: Look at the current parent-child relationships
2. **Choose a Different Parent**: Select a parent that isn't a descendant
3. **Restructure if Needed**: Sometimes you need to reorganize the hierarchy

**Example Fix**:
```
Problem: Trying to set Guanacaste as parent of Costa Rica
(but Costa Rica is already parent of Guanacaste)

Solution: Keep Costa Rica as the top level, Guanacaste as child
```

---

## Using Location Selector

When creating or editing events, activities, and accommodations, you'll use the Location Selector to choose a location.

### Opening the Location Selector

The Location Selector appears as a dropdown field labeled **Location** on forms for:
- Events
- Activities
- Accommodations

### Selecting a Location

**Method 1: Dropdown Selection**
1. Click the **Location** dropdown
2. Locations appear in hierarchical format
3. Parent locations are shown with indentation
4. Click on a location to select it

**Method 2: Search**
1. Click in the **Location** field
2. Start typing the location name
3. Matching locations appear in the dropdown
4. Click on a location to select it

### Location Display Format

Locations in the selector show the full hierarchy path:

```
Tamarindo Diria Beach Resort
  in Tamarindo, Guanacaste, Costa Rica
```

This helps you distinguish between locations with similar names:

```
Beach Club Restaurant
  in Tamarindo, Guanacaste, Costa Rica

Beach Club Restaurant
  in Playa Flamingo, Guanacaste, Costa Rica
```

### Clearing a Selection

To remove a selected location:
1. Click the **X** button next to the location name
2. The field clears
3. You can select a different location

---

## Searching Locations

The location search helps you find locations quickly, especially in large hierarchies.

### Using the Search Box

1. Find the **Search** box at the top of the Locations page
2. Type any part of the location name, address, or description
3. Results appear in real-time as you type
4. The tree view filters to show only matching locations

### Search Behavior

The search looks across:
- **Location Name**: Primary search field
- **Address**: Street address and postal code
- **Description**: Additional details and notes

**Example Searches**:
- "Tamarindo" → Shows all locations in Tamarindo
- "Beach" → Shows all beach-related locations
- "Resort" → Shows all resort locations
- "Airport" → Shows all airports

### Search Results Display

Matching locations are highlighted in the tree:
- Matching locations appear in **bold**
- Parent locations are shown for context (not bold)
- Non-matching locations are hidden

**Example**:
```
Search: "Diria"

Results:
📍 Costa Rica
  └─ 📍 Guanacaste
      └─ 📍 Tamarindo
          └─ 🏨 Tamarindo Diria Beach Resort  ← Match
```

### Clearing the Search

1. Click the **X** button in the search box
2. Or delete all text
3. The full tree view returns

---

## Deleting Locations

### Before You Delete

**Important Considerations**:
1. **Child Locations**: What happens to child locations?
2. **References**: Is this location used by events, activities, or accommodations?
3. **Permanent Action**: Deletion cannot be undone (except via version history)

### Deletion Behavior

When you delete a location:

**Child Locations**:
- Child locations are **not deleted**
- Their `parent_location_id` is set to `NULL`
- They become top-level locations
- You can reassign them to a new parent later

**Example**:
```
Before deletion:
📍 Guanacaste
  ├─ 📍 Tamarindo
  └─ 📍 Playa Flamingo

Delete Guanacaste:

After deletion:
📍 Tamarindo  ← Now top-level
📍 Playa Flamingo  ← Now top-level
```

**References**:
- Events, activities, and accommodations using this location keep their reference
- The location ID remains in the database for historical records
- You should update these entities to use a different location

### How to Delete a Location

1. Find the location in the tree
2. Click the **Delete** button next to it
3. A confirmation dialog appears:
   ```
   ⚠️ Delete Location?
   
   Are you sure you want to delete "Tamarindo Diria Beach Resort"?
   
   This location has 2 child locations that will become top-level locations.
   This location is used by 3 events and 5 activities.
   
   [Cancel] [Delete Location]
   ```

4. Review the warning information
5. Click **Delete Location** to confirm
6. Or click **Cancel** to abort

### After Deletion

1. The location is removed from the tree
2. Child locations appear at the top level (or under their grandparent)
3. A success message confirms the deletion
4. The action is logged in Audit Logs

### Recovering Deleted Locations

Deleted locations cannot be directly recovered, but you can:

1. Check **Audit Logs** to see the deleted location details
2. Recreate the location manually with the same information
3. Reassign child locations to the new location

---

## Best Practices

### Naming Conventions

1. **Be Specific**: Use full, official names
   - ✅ "Tamarindo Diria Beach Resort"
   - ❌ "Diria" or "The Resort"

2. **Avoid Abbreviations**: Unless commonly used
   - ✅ "Juan Santamaría International Airport (SJO)"
   - ❌ "JS Airport"

3. **Include Type When Helpful**: For clarity
   - ✅ "Playa Tamarindo Beach"
   - ✅ "Pangas Beach Club Restaurant"

### Hierarchy Organization

1. **Start Broad**: Begin with country or region
2. **Add Detail Gradually**: Add cities, then venues
3. **Keep It Logical**: Follow geographic relationships
4. **Limit Depth**: Aim for 3-4 levels maximum

**Good Hierarchy**:
```
Country → Region → City → Venue
Costa Rica → Guanacaste → Tamarindo → Diria Resort
```

**Too Deep**:
```
Country → Region → Province → District → City → Neighborhood → Street → Venue
(7 levels - too complex!)
```

### Address and Description

1. **Complete Addresses**: Include all relevant details
2. **Directions**: Add landmarks or navigation tips
3. **Contact Info**: Include phone numbers if helpful
4. **Special Instructions**: Note parking, entrance locations, etc.

**Example**:
```
Name: Tamarindo Diria Beach Resort
Address: Playa Tamarindo, Guanacaste, 50309, Costa Rica
Description: Beachfront resort on the main beach. Main entrance on Calle Principal, 
             200m south of the town center. Parking available on-site. 
             Reception: +506 2653-0031
```

### Maintenance

1. **Regular Review**: Check for outdated information
2. **Update Addresses**: Keep contact details current
3. **Remove Unused**: Delete locations no longer needed
4. **Consolidate Duplicates**: Merge similar locations

---

## Troubleshooting

### Common Issues

**Problem**: Cannot set parent location - circular reference error
- **Solution**: Review the error message showing the reference chain. Choose a parent that isn't a descendant of the current location.

**Problem**: Location not appearing in Location Selector
- **Solution**: Ensure the location is saved. Try refreshing the page. Check that you're searching for the correct name.

**Problem**: Child locations disappeared after deleting parent
- **Solution**: Child locations become top-level locations. Search for them at the root of the tree, then reassign to a new parent.

**Problem**: Cannot find location in large tree
- **Solution**: Use the search box to filter locations. Search by name, address, or description.

**Problem**: Duplicate locations with same name
- **Solution**: Edit one location to make the name more specific, or delete the duplicate. Use the full hierarchy path to distinguish them.

### Getting Help

If you encounter issues not covered in this guide:

1. Check the **Audit Logs** to see recent location changes
2. Use the search function to locate missing locations
3. Contact your system administrator for assistance

---

## Quick Reference

### Location Hierarchy Example

```
📍 Costa Rica (Country)
  ├─ 📍 Guanacaste Province (Region)
  │   ├─ 📍 Tamarindo (City)
  │   │   ├─ 🏨 Tamarindo Diria Beach Resort
  │   │   ├─ 🏖️ Playa Tamarindo
  │   │   └─ 🍽️ Pangas Beach Club
  │   └─ 📍 Playa Flamingo (City)
  │       └─ 🏨 Flamingo Beach Resort
  └─ 📍 San José (City)
      └─ ✈️ Juan Santamaría International Airport (SJO)
```

### Common Actions

| Action | Steps |
|--------|-------|
| Create location | Click **+ Add Location** → Fill form → **Create** |
| Edit location | Find in tree → **Edit** → Update fields → **Save** |
| Delete location | Find in tree → **Delete** → Confirm |
| Search locations | Type in search box → View filtered results |
| Change parent | Edit location → Select new parent → **Save** |

### Circular Reference Prevention

- ❌ Cannot set location as its own parent
- ❌ Cannot set child as parent
- ❌ Cannot set descendant as parent
- ✅ Can set sibling as parent
- ✅ Can set unrelated location as parent

---

## Next Steps

Now that you understand location management, you can:

1. Create your location hierarchy (start with country/region)
2. Add cities and venues
3. Assign locations to events and activities
4. Use the Location Selector when creating new entities

For more information on related features, see:
- [CMS User Guide](./USER_GUIDE_CMS.md)
- [Room Types Guide](./USER_GUIDE_ROOM_TYPES.md)
- [Transportation Guide](./USER_GUIDE_TRANSPORTATION.md)
- [Analytics Guide](./USER_GUIDE_ANALYTICS.md)
