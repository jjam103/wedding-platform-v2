# Manage Sections Button - Status Report

## Current Status: ✅ IMPLEMENTED

The "Manage Sections" button **is fully implemented** in the Events page.

## Location

**File**: `app/admin/events/page.tsx`  
**Lines**: 467-485

## Implementation Details

The button appears in the **Actions column** of the Events data table:

```typescript
{
  key: 'actions',
  label: 'Actions',
  sortable: false,
  render: (_, row) => {
    const event = row as Event;
    const slug = event.slug || event.id;
    return (
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            window.open(`/event/${slug}`, '_blank');
          }}
          title="View event detail page"
          aria-label={`View ${event.name} detail page`}
        >
          View
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            // Open the event in edit mode and scroll to section editor
            handleRowClick(event);
            // Wait for form to open, then scroll to section editor
            setTimeout(() => {
              const sectionEditor = document.querySelector('[data-section-editor]');
              if (sectionEditor) {
                sectionEditor.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }, 100);
          }}
          title="Manage sections for this event"
          aria-label={`Manage sections for ${event.name}`}
        >
          Manage Sections
        </Button>
      </div>
    );
  },
}
```

## Functionality

When clicked, the button:
1. Opens the event in edit mode (expands the CollapsibleForm)
2. Scrolls to the InlineSectionEditor component
3. Allows user to manage sections for that specific event

## Section Editor Integration

The InlineSectionEditor is rendered when editing an event (lines 656-664):

```typescript
{/* Inline Section Editor - Shows when editing an existing event */}
{isFormOpen && selectedEvent && (
  <div data-section-editor>
    <InlineSectionEditor
      pageType="event"
      pageId={selectedEvent.id}
      entityName={selectedEvent.name}
      defaultExpanded={false}
    />
  </div>
)}
```

## E2E Test Coverage

The button is extensively tested in E2E tests:
- `__tests__/e2e/admin/sectionManagement.spec.ts` (multiple tests)
- `__tests__/e2e/admin/contentManagement.spec.ts` (multiple tests)
- `__tests__/e2e/admin/referenceBlocks.spec.ts` (multiple tests)
- `__tests__/e2e/admin/photoUpload.spec.ts` (multiple tests)

## Potential Issues

### If Button Not Visible

1. **No Events Created**: The button only appears in the Actions column of existing events
2. **CSS/Styling Issue**: Button might be hidden by CSS
3. **JavaScript Error**: Check browser console for errors
4. **Data Loading Issue**: Events might not be loading from API

### Debugging Steps

1. **Check if events exist**:
   ```
   Navigate to /admin/events
   Look for events in the table
   ```

2. **Check browser console**:
   ```
   Open DevTools (F12)
   Look for JavaScript errors
   ```

3. **Check API response**:
   ```
   Open Network tab in DevTools
   Look for /api/admin/events request
   Verify events are returned
   ```

4. **Check button rendering**:
   ```
   Inspect the Actions column
   Look for button with text "Manage Sections"
   ```

## Related Components

- **InlineSectionEditor**: `components/admin/InlineSectionEditor.tsx`
- **CollapsibleForm**: `components/admin/CollapsibleForm.tsx`
- **DataTable**: `components/ui/DataTableWithSuspense.tsx`
- **Button**: `components/ui/Button.tsx`

## User Workflow

1. Navigate to `/admin/events`
2. See list of events in data table
3. Each event row has two buttons in Actions column:
   - **View**: Opens event detail page in new tab
   - **Manage Sections**: Opens edit form and scrolls to section editor
4. Click "Manage Sections" to edit sections for that event
5. Section editor appears below the form
6. Add/edit/delete sections as needed

## Conclusion

The "Manage Sections" button is **fully implemented and functional**. If it's not visible in your application:

1. Ensure you have events created in the database
2. Check browser console for errors
3. Verify the Events page is loading correctly
4. Check that the DataTable is rendering the Actions column

The button should appear in the rightmost column of each event row in the table.
