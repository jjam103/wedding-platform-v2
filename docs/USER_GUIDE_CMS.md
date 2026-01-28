# Content Management System (CMS) User Guide

## Overview

The CMS allows you to create and manage custom content pages for your wedding website. You can add rich text content, photos, and references to other entities (events, activities, accommodations) to create informative pages for your guests.

## Table of Contents

1. [Creating Content Pages](#creating-content-pages)
2. [Managing Sections](#managing-sections)
3. [Using the Section Editor](#using-the-section-editor)
4. [Rich Text Editing](#rich-text-editing)
5. [Adding Photos](#adding-photos)
6. [Reference Linking](#reference-linking)
7. [Version History](#version-history)
8. [Publishing Pages](#publishing-pages)

---

## Creating Content Pages

### Step 1: Navigate to Content Pages

1. Log in to the admin dashboard
2. Click on **Content** in the sidebar
3. Select **Content Pages**

### Step 2: Add a New Page

1. Click the **+ Add Page** button at the top of the page
2. The form will expand below the button
3. Fill in the required fields:
   - **Title**: The page title (e.g., "Our Story", "Travel Information")
   - **Slug**: Auto-generated from the title, but you can edit it
     - The slug becomes part of the URL: `yourwedding.com/[slug]`
     - Use lowercase letters, numbers, and hyphens only
   - **Status**: Choose **Draft** (not visible to guests) or **Published** (visible to guests)

4. Click **Create Page**

### Slug Generation

The system automatically generates URL-friendly slugs from your title:

- **Title**: "Our Love Story" → **Slug**: `our-love-story`
- **Title**: "Travel & Accommodations" → **Slug**: `travel-accommodations`

**Slug Conflicts**: If a slug already exists, the system will append a number:
- First page: `our-story`
- Second page with same title: `our-story-2`

**URL Preview**: The full URL path is shown below the slug field:
```
https://yourwedding.com/our-story
```

### Step 3: View Your Pages

After creating a page, it appears in the content pages list showing:
- Title
- Slug
- Status (Draft/Published)
- Actions (Edit, Manage Sections, Delete)

---

## Managing Sections

Sections are the building blocks of your content pages. Each section can have one or two columns with different types of content.

### Opening the Section Editor

1. Find your page in the content pages list
2. Click **Manage Sections** button
3. The Section Editor opens in a new view

### Section Editor Overview

The Section Editor displays:
- All existing sections for the page
- **+ Add Section** button to create new sections
- **Preview as Guest** button to see how guests will view the page
- **Save All** button to save all changes

---

## Using the Section Editor

### Adding a New Section

1. Click **+ Add Section** at the top
2. A new section appears with two empty columns
3. Choose your layout:
   - **1 Column**: Full-width content
   - **2 Columns**: Split content (50/50)

### Section Layout Options

**One-Column Layout**:
```
┌─────────────────────────────────┐
│                                 │
│     Full Width Content          │
│                                 │
└─────────────────────────────────┘
```

**Two-Column Layout**:
```
┌────────────────┬────────────────┐
│                │                │
│   Column 1     │   Column 2     │
│                │                │
└────────────────┴────────────────┘
```

### Reordering Sections

1. Click and hold the drag handle (⋮⋮) on the left of a section
2. Drag the section up or down
3. Release to drop it in the new position
4. The display order updates automatically

### Deleting a Section

1. Click the **Delete** button on the section
2. Confirm the deletion in the dialog
3. The section is removed immediately

---

## Rich Text Editing

Each column can contain rich text with formatting and special elements.

### Basic Formatting

Use the toolbar buttons or keyboard shortcuts:

| Format | Button | Shortcut |
|--------|--------|----------|
| **Bold** | **B** | Ctrl/Cmd + B |
| *Italic* | *I* | Ctrl/Cmd + I |
| <u>Underline</u> | U | Ctrl/Cmd + U |
| Link | 🔗 | Ctrl/Cmd + K |

### Creating Lists

**Bulleted List**:
1. Click the bullet list button
2. Type your first item
3. Press Enter to add more items
4. Press Enter twice to exit the list

**Numbered List**:
1. Click the numbered list button
2. Type your first item
3. Press Enter to add more items
4. Press Enter twice to exit the list

### Adding Links

1. Select the text you want to link
2. Click the link button (🔗) or press Ctrl/Cmd + K
3. Enter the URL
4. Click **Insert**

**Example**:
```
Visit our [wedding website](https://yourwedding.com) for more details.
```

### Slash Commands

Type `/` to open the command menu with quick insert options:

| Command | Description |
|---------|-------------|
| `/heading` | Insert a heading |
| `/list` | Insert a bulleted list |
| `/table` | Insert a 2-column table |
| `/image` | Insert an image |
| `/link` | Insert a link |
| `/divider` | Insert a horizontal line |

### Adding Tables

1. Type `/table` or click the table button
2. A 2-column table is inserted
3. Click in any cell to edit the content
4. Use Tab to move to the next cell
5. Use Shift + Tab to move to the previous cell

**Table Example**:
```
┌─────────────────┬─────────────────┐
│ Event           │ Time            │
├─────────────────┼─────────────────┤
│ Ceremony        │ 4:00 PM         │
│ Reception       │ 6:00 PM         │
└─────────────────┴─────────────────┘
```

---

## Adding Photos

You can add photos from your photo gallery to any column.

### Step 1: Select Photo Content Type

1. In a column, click **Content Type** dropdown
2. Select **Photos**
3. The photo picker interface appears

### Step 2: Choose Photos

1. Click **Add Photos** button
2. Browse your photo gallery
3. Click on photos to select them (multiple selection allowed)
4. Click **Add Selected** to insert them

### Step 3: Arrange Photos

- Photos appear in a grid layout
- Drag photos to reorder them
- Click the **X** on a photo to remove it
- Add captions by clicking on a photo

### Photo Display

Photos in sections are displayed in a responsive grid:
- Desktop: 3 photos per row
- Tablet: 2 photos per row
- Mobile: 1 photo per row

---

## Reference Linking

Reference links allow you to link to other entities in your wedding system (events, activities, accommodations, etc.).

### What Can You Reference?

- **Events**: Ceremony, reception, welcome dinner, etc.
- **Activities**: Beach day, zip-lining, sunset cruise, etc.
- **Accommodations**: Hotels, resorts, vacation rentals
- **Room Types**: Specific room categories within accommodations
- **Other Content Pages**: Link between your custom pages

### Adding a Reference

1. In a column, click **Content Type** dropdown
2. Select **References**
3. Click **Add Reference** button
4. The reference search dialog opens

### Searching for Entities

1. Type in the search box to find entities
2. The search looks across all entity types
3. Results show:
   - Entity type badge (EVENT, ACTIVITY, etc.)
   - Entity name
   - Additional details (date, status, capacity)

4. Click on a result to select it
5. The reference is added to your column

### Reference Display

References appear as cards showing:
- Entity type icon and badge
- Entity name
- Quick preview information
- Actions: View, Edit, Remove

**Example Reference Card**:
```
┌─────────────────────────────────────┐
│ 📅 EVENT                            │
│ Ceremony on the Beach               │
│ June 15, 2025 • 4:00 PM • Active   │
│ [View] [Edit] [Remove]              │
└─────────────────────────────────────┘
```

### Reference Validation

The system automatically validates references:

**Broken References**: If a referenced entity is deleted, the system:
- Marks the reference as broken
- Displays a warning icon
- Shows "Entity not found" message
- Allows you to remove the broken reference

**Circular References**: The system prevents circular references:
- You cannot reference a page from itself
- You cannot create reference loops (A → B → C → A)
- If detected, an error message shows the reference chain

---

## Version History

Every time you save changes to a page, the system creates a version snapshot. This allows you to view previous versions and revert if needed.

### Viewing Version History

1. Open the Section Editor for a page
2. Click **Version History** button
3. A list of all versions appears showing:
   - Version number
   - Date and time saved
   - User who made the changes

### Previewing a Version

1. Click on a version in the history list
2. The content from that version is displayed
3. You can see exactly what the page looked like at that time

### Reverting to a Previous Version

1. Preview the version you want to restore
2. Click **Revert to This Version** button
3. Confirm the revert action
4. The page content is restored to that version
5. A new version is created with the reverted content

**Note**: Version history is preserved even after page deletion, so you can always recover content if needed.

---

## Publishing Pages

### Draft vs. Published Status

- **Draft**: Page is not visible to guests, only admins can see it
- **Published**: Page is live and visible to all guests

### Publishing a Page

1. Go to the Content Pages list
2. Find your page
3. Click **Edit**
4. Change **Status** to **Published**
5. Click **Save**

### Unpublishing a Page

1. Edit the page
2. Change **Status** to **Draft**
3. Click **Save**
4. The page is immediately hidden from guests

### Preview as Guest

Before publishing, you can preview how guests will see your page:

1. Open the Section Editor
2. Click **Preview as Guest** button
3. A new tab opens showing the guest-facing view
4. Review the content and layout
5. Close the tab to return to editing

---

## Best Practices

### Content Organization

1. **Use Clear Titles**: Make page titles descriptive and easy to understand
2. **Logical Sections**: Break content into logical sections with clear purposes
3. **Mix Content Types**: Combine text, photos, and references for engaging pages
4. **Keep It Concise**: Guests prefer shorter, scannable content

### Section Layout Tips

1. **One Column for Text**: Use one-column layout for long-form text content
2. **Two Columns for Comparison**: Use two columns to show side-by-side information
3. **Photos in Separate Sections**: Give photos their own sections for better visual impact
4. **References at the End**: Place reference links at the end of sections for easy navigation

### Writing for Guests

1. **Be Welcoming**: Use friendly, conversational tone
2. **Provide Context**: Explain why information is important
3. **Include Details**: Add specific times, locations, and instructions
4. **Update Regularly**: Keep information current as plans change

### SEO and URLs

1. **Descriptive Slugs**: Use clear, keyword-rich slugs (e.g., `travel-information` not `page-1`)
2. **Consistent Naming**: Keep slug format consistent across pages
3. **Avoid Special Characters**: Stick to letters, numbers, and hyphens
4. **Short and Sweet**: Keep slugs concise but meaningful

---

## Troubleshooting

### Common Issues

**Problem**: Slug conflict error when creating a page
- **Solution**: The slug already exists. Edit the slug to make it unique, or the system will automatically append a number.

**Problem**: Changes not appearing on guest-facing page
- **Solution**: Make sure the page status is set to **Published** and you've clicked **Save All** in the Section Editor.

**Problem**: Reference shows as broken
- **Solution**: The referenced entity was deleted. Remove the broken reference and add a new one if needed.

**Problem**: Can't save section with circular reference
- **Solution**: Review the error message showing the reference chain. Remove one of the references to break the cycle.

**Problem**: Photos not displaying in section
- **Solution**: Ensure photos are approved in the Photo Gallery. Only approved photos can be added to sections.

### Getting Help

If you encounter issues not covered in this guide:

1. Check the **Audit Logs** to see recent changes
2. Try reverting to a previous version using **Version History**
3. Contact your system administrator for assistance

---

## Quick Reference

### Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Save | Ctrl/Cmd + S |
| Bold | Ctrl/Cmd + B |
| Italic | Ctrl/Cmd + I |
| Underline | Ctrl/Cmd + U |
| Link | Ctrl/Cmd + K |
| Undo | Ctrl/Cmd + Z |
| Redo | Ctrl/Cmd + Shift + Z |

### Content Type Options

- **Rich Text**: Formatted text with headings, lists, links, tables
- **Photos**: Image galleries from your photo library
- **References**: Links to events, activities, accommodations, pages

### Status Options

- **Draft**: Not visible to guests
- **Published**: Live and visible to guests

---

## Next Steps

Now that you understand the CMS, you can:

1. Create your first content page (try "Our Story" or "Travel Information")
2. Add sections with rich text and photos
3. Link to your events and activities using references
4. Preview the page as a guest
5. Publish when ready

For more information on related features, see:
- [Location Management Guide](./USER_GUIDE_LOCATIONS.md)
- [Room Types Guide](./USER_GUIDE_ROOM_TYPES.md)
- [Transportation Guide](./USER_GUIDE_TRANSPORTATION.md)
- [Analytics Guide](./USER_GUIDE_ANALYTICS.md)
