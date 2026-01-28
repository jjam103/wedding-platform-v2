# Admin System User Documentation

Welcome to the comprehensive user documentation for the Wedding Management Admin System. This documentation covers all features and functionality available to administrators.

## Quick Start

New to the system? Start here:

1. **[CMS User Guide](./USER_GUIDE_CMS.md)** - Learn how to create and manage content pages
2. **[Location Management Guide](./USER_GUIDE_LOCATIONS.md)** - Set up your location hierarchy
3. **[Room Types Guide](./USER_GUIDE_ROOM_TYPES.md)** - Organize accommodations and assign guests
4. **[Transportation Guide](./USER_GUIDE_TRANSPORTATION.md)** - Coordinate guest arrivals and departures
5. **[Analytics Guide](./USER_GUIDE_ANALYTICS.md)** - Track RSVPs, budget, and system activity

## Documentation Overview

### Content Management

**[CMS User Guide](./USER_GUIDE_CMS.md)**

Learn how to create and manage custom content pages for your wedding website:
- Creating content pages with unique URLs
- Using the Section Editor to build rich layouts
- Adding rich text, photos, and references
- Managing version history and reverting changes
- Publishing pages for guests to view

**Key Topics**:
- Content page creation and slug generation
- Section editor with one-column and two-column layouts
- Rich text editing with formatting and tables
- Photo galleries and image management
- Reference linking to events, activities, and accommodations
- Version history and rollback
- Publishing workflow

---

### Location Management

**[Location Management Guide](./USER_GUIDE_LOCATIONS.md)**

Organize venues, airports, hotels, and other locations in a hierarchical structure:
- Creating location hierarchies (Country → Region → City → Venue)
- Managing parent-child relationships
- Preventing circular references
- Using the Location Selector in forms
- Searching and filtering locations

**Key Topics**:
- Location hierarchy concepts
- Creating and editing locations
- Managing the location tree
- Circular reference prevention
- Location selector usage
- Search functionality
- Deletion and child location handling

---

### Accommodation Management

**[Room Types Guide](./USER_GUIDE_ROOM_TYPES.md)**

Manage accommodations with room types, capacity tracking, and guest assignments:
- Creating room types within accommodations
- Setting capacity and pricing
- Assigning guests to rooms
- Tracking occupancy rates
- Adding room descriptions and photos

**Key Topics**:
- Room type creation and configuration
- Capacity tracking and occupancy indicators
- Guest assignment workflow
- Pricing management and cost calculations
- Room type content with Section Editor
- Occupancy optimization strategies

---

### Transportation Coordination

**[Transportation Guide](./USER_GUIDE_TRANSPORTATION.md)**

Coordinate guest arrivals and departures with manifests and shuttle assignments:
- Viewing arrival and departure manifests
- Filtering by date and airport
- Assigning guests to shuttles
- Calculating vehicle requirements
- Generating driver sheets
- Printing manifests

**Key Topics**:
- Transportation manifest overview
- Viewing and filtering manifests
- Shuttle assignment process
- Vehicle requirement calculations
- Driver sheet generation
- Manifest printing
- Flight information management

---

### Analytics & Reporting

**[Analytics Guide](./USER_GUIDE_ANALYTICS.md)**

Track RSVPs, monitor budget, and review system activity:
- RSVP Analytics Dashboard with response rates and trends
- Budget Dashboard with vendor payments and subsidies
- Audit Logs for system activity tracking

**Key Topics**:

**RSVP Analytics**:
- Overall response rates
- Response breakdown by status
- Event and activity response rates
- Capacity utilization tracking
- Response trends over time
- Pending reminder management

**Budget Dashboard**:
- Budget summary and metrics
- Vendor payment tracking
- Recording payments
- Individual guest subsidies
- Cost breakdown analysis
- Real-time recalculation

**Audit Logs**:
- Viewing system activity logs
- Filtering by user, action, entity, and date
- Searching log descriptions
- Critical action highlighting
- Exporting logs for compliance

---

## Feature Cross-Reference

### By User Role

**Wedding Coordinators**:
- [CMS User Guide](./USER_GUIDE_CMS.md) - Create informational pages
- [Location Management](./USER_GUIDE_LOCATIONS.md) - Set up venue hierarchy
- [Analytics](./USER_GUIDE_ANALYTICS.md) - Monitor RSVPs and budget

**Logistics Managers**:
- [Room Types Guide](./USER_GUIDE_ROOM_TYPES.md) - Manage accommodations
- [Transportation Guide](./USER_GUIDE_TRANSPORTATION.md) - Coordinate arrivals/departures
- [Analytics](./USER_GUIDE_ANALYTICS.md) - Track occupancy and costs

**Content Managers**:
- [CMS User Guide](./USER_GUIDE_CMS.md) - Create and publish content
- [Location Management](./USER_GUIDE_LOCATIONS.md) - Organize locations
- [Room Types Guide](./USER_GUIDE_ROOM_TYPES.md) - Add room descriptions

**System Administrators**:
- [Analytics](./USER_GUIDE_ANALYTICS.md) - Review audit logs
- All guides for comprehensive system management

### By Task

**Setting Up Your Wedding**:
1. [Location Management](./USER_GUIDE_LOCATIONS.md) - Create location hierarchy
2. [CMS User Guide](./USER_GUIDE_CMS.md) - Create homepage and content pages
3. [Room Types Guide](./USER_GUIDE_ROOM_TYPES.md) - Set up accommodations

**Managing Guests**:
1. [Room Types Guide](./USER_GUIDE_ROOM_TYPES.md) - Assign guests to rooms
2. [Transportation Guide](./USER_GUIDE_TRANSPORTATION.md) - Coordinate arrivals
3. [Analytics](./USER_GUIDE_ANALYTICS.md) - Track RSVPs

**Monitoring Progress**:
1. [Analytics](./USER_GUIDE_ANALYTICS.md) - View RSVP analytics
2. [Analytics](./USER_GUIDE_ANALYTICS.md) - Monitor budget
3. [Analytics](./USER_GUIDE_ANALYTICS.md) - Review audit logs

**Creating Content**:
1. [CMS User Guide](./USER_GUIDE_CMS.md) - Create content pages
2. [CMS User Guide](./USER_GUIDE_CMS.md) - Use Section Editor
3. [CMS User Guide](./USER_GUIDE_CMS.md) - Add photos and references

---

## Common Workflows

### Creating a New Content Page

1. Navigate to **Content** → **Content Pages**
2. Click **+ Add Page**
3. Enter title (slug auto-generates)
4. Set status to **Draft**
5. Click **Create Page**
6. Click **Manage Sections** to add content
7. Use Section Editor to build layout
8. Click **Preview as Guest** to review
9. Change status to **Published** when ready

**See**: [CMS User Guide - Creating Content Pages](./USER_GUIDE_CMS.md#creating-content-pages)

### Setting Up Location Hierarchy

1. Navigate to **Event Planning** → **Locations**
2. Create country-level location (no parent)
3. Create region with country as parent
4. Create city with region as parent
5. Create venues with city as parent
6. Use locations in events and activities

**See**: [Location Management Guide - Creating Locations](./USER_GUIDE_LOCATIONS.md#creating-locations)

### Assigning Guests to Rooms

1. Navigate to **Logistics** → **Accommodations**
2. Click **Room Types** on an accommodation
3. Click **+ Add Room Type** if needed
4. Click **Assign Guests** on a room type
5. Select guests from the list
6. Click **Assign Selected**
7. Monitor occupancy indicators

**See**: [Room Types Guide - Guest Assignment](./USER_GUIDE_ROOM_TYPES.md#guest-assignment)

### Coordinating Airport Pickups

1. Navigate to **Logistics** → **Transportation**
2. Click **Arrivals** tab
3. Select arrival date
4. Filter by airport if needed
5. Assign guests to shuttles
6. Click **Generate Driver Sheets**
7. Print and distribute to drivers

**See**: [Transportation Guide - Shuttle Assignment](./USER_GUIDE_TRANSPORTATION.md#shuttle-assignment)

### Monitoring RSVP Progress

1. Navigate to **Guest Management** → **RSVP Analytics**
2. Review overall response rate
3. Check event and activity response rates
4. Identify activities near capacity
5. Review pending reminders
6. Click **Send Reminder Emails** if needed

**See**: [Analytics Guide - RSVP Analytics Dashboard](./USER_GUIDE_ANALYTICS.md#rsvp-analytics-dashboard)

---

## Troubleshooting

### Common Issues Across Features

**Problem**: Changes not appearing on guest-facing pages
- **Solution**: Ensure status is set to **Published** and you've saved all changes
- **See**: [CMS User Guide - Publishing Pages](./USER_GUIDE_CMS.md#publishing-pages)

**Problem**: Cannot find an entity in dropdown
- **Solution**: Verify the entity is saved. Try refreshing the page. Use search functionality.
- **See**: Relevant guide for that entity type

**Problem**: Capacity or occupancy seems incorrect
- **Solution**: Verify capacity settings. Check that all assignments are current. Refresh the page.
- **See**: [Room Types Guide - Capacity Tracking](./USER_GUIDE_ROOM_TYPES.md#capacity-tracking)

**Problem**: Circular reference error
- **Solution**: Review the error message showing the reference chain. Choose a different parent/reference.
- **See**: [Location Management Guide - Circular Reference Prevention](./USER_GUIDE_LOCATIONS.md#circular-reference-prevention)

### Getting Help

If you encounter issues not covered in the documentation:

1. **Check Audit Logs**: Review recent system changes
   - See: [Analytics Guide - Audit Logs](./USER_GUIDE_ANALYTICS.md#audit-logs)

2. **Search Documentation**: Use browser search (Ctrl/Cmd + F) to find specific topics

3. **Contact Support**: Reach out to your system administrator with:
   - Description of the issue
   - Steps to reproduce
   - Screenshots if applicable
   - Relevant audit log entries

---

## Best Practices

### Content Management

- Use clear, descriptive titles for pages
- Break content into logical sections
- Mix text, photos, and references for engagement
- Preview as guest before publishing
- Keep content current and updated

**See**: [CMS User Guide - Best Practices](./USER_GUIDE_CMS.md#best-practices)

### Location Organization

- Start with broad locations (country/region)
- Use consistent naming conventions
- Include complete addresses
- Limit hierarchy depth to 3-4 levels
- Regular review and maintenance

**See**: [Location Management Guide - Best Practices](./USER_GUIDE_LOCATIONS.md#best-practices)

### Room Management

- Set realistic capacity based on comfort
- Assign guests early
- Monitor occupancy regularly
- Communicate assignments to guests
- Track preferences and special needs

**See**: [Room Types Guide - Best Practices](./USER_GUIDE_ROOM_TYPES.md#best-practices)

### Transportation Coordination

- Collect flight info early
- Set deadlines for information
- Group guests by flight when possible
- Allow buffer time between pickups
- Confirm details 48 hours before

**See**: [Transportation Guide - Best Practices](./USER_GUIDE_TRANSPORTATION.md#best-practices)

### Analytics & Monitoring

- Review RSVP analytics weekly
- Send reminders to pending guests
- Track budget regularly
- Record payments promptly
- Export reports for stakeholders

**See**: [Analytics Guide - Best Practices](./USER_GUIDE_ANALYTICS.md#best-practices)

---

## Additional Resources

### Technical Documentation

For developers and system administrators:
- [CSS Troubleshooting Guide](./CSS_TROUBLESHOOTING_GUIDE.md)
- [CSS Preventive Measures](./CSS_PREVENTIVE_MEASURES.md)

### System Guides

For initial setup and configuration:
- Check the main README.md in the project root
- Review setup guides in the project documentation

---

## Document Version

**Last Updated**: January 28, 2025

**Documentation Version**: 1.0

**Covers System Version**: Admin Backend Integration & CMS

---

## Feedback

We're constantly improving our documentation. If you have suggestions or find errors:

1. Note the specific guide and section
2. Describe the issue or suggestion
3. Contact your system administrator
4. Or submit feedback through the admin dashboard

Your feedback helps us create better documentation for all users!

---

## Quick Links

- [CMS User Guide](./USER_GUIDE_CMS.md)
- [Location Management Guide](./USER_GUIDE_LOCATIONS.md)
- [Room Types Guide](./USER_GUIDE_ROOM_TYPES.md)
- [Transportation Guide](./USER_GUIDE_TRANSPORTATION.md)
- [Analytics Guide](./USER_GUIDE_ANALYTICS.md)

---

**Need help?** Contact your system administrator or refer to the specific guide for detailed instructions.
