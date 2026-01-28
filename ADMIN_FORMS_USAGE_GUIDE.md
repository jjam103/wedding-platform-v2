# Admin Forms Usage Guide

## Where Are the Save Buttons?

All admin forms use a **collapsible design pattern** to save screen space. The save buttons are hidden inside collapsed forms.

## How to Access Forms and Save Buttons

### Step 1: Open the Form

There are two ways to open a form:

#### Option A: Click the "Add" Button
- Look for buttons like:
  - **"+ Add Guest"**
  - **"+ Add Location"**
  - **"+ Add Activity"**
  - **"+ Add Event"**
- These buttons are usually in the top-right corner of the page

#### Option B: Click the Form Header
- If a form section is visible but collapsed, click the header bar
- Look for the dropdown arrow (▼) that indicates it's collapsible

### Step 2: Fill Out the Form

Once expanded, you'll see:
- All form fields
- Validation messages (if any)
- **Action buttons at the bottom**

### Step 3: Find the Save Button

At the bottom of the expanded form, you'll see:
- **Primary button** (green): "Create", "Save", "Update", or "Submit"
- **Secondary button** (gray): "Cancel"

## Form Locations by Page

### Guest Management (`/admin/guests`)
- **Form Type**: CollapsibleForm
- **Open Button**: "+ Add Guest" (top-right)
- **Submit Button**: "Create" or "Update"

### Locations (`/admin/locations`)
- **Form Type**: CollapsibleForm
- **Open Button**: "+ Add Location" (top-right)
- **Submit Button**: "Create" or "Update"

### Content Pages (`/admin/content-pages`)
- **Form Type**: ContentPageForm (collapsible)
- **Open Method**: Click the form header to expand
- **Submit Button**: "Create" or "Update"

### Activities (`/admin/activities`)
- **Form Type**: CollapsibleForm
- **Open Button**: "+ Add Activity" (top-right)
- **Submit Button**: "Create" or "Update"

### Events (`/admin/events`)
- **Form Type**: CollapsibleForm
- **Open Button**: "+ Add Event" (top-right)
- **Submit Button**: "Create" or "Update"

### Accommodations (`/admin/accommodations`)
- **Form Type**: CollapsibleForm
- **Open Button**: "+ Add Accommodation" (top-right)
- **Submit Button**: "Create" or "Update"

### Vendors (`/admin/vendors`)
- **Form Type**: CollapsibleForm
- **Open Button**: "+ Add Vendor" (top-right)
- **Submit Button**: "Create" or "Update"

## Visual Indicators

### Collapsed Form
```
┌─────────────────────────────────────────┐
│ Add New Guest                         ▼ │  ← Click here to expand
└─────────────────────────────────────────┘
```

### Expanded Form
```
┌─────────────────────────────────────────┐
│ Add New Guest                         ▲ │  ← Click to collapse
├─────────────────────────────────────────┤
│ First Name: [____________]              │
│ Last Name:  [____________]              │
│ Email:      [____________]              │
│ ...                                     │
│                                         │
│ [Create]  [Cancel]  ← Save button here │
└─────────────────────────────────────────┘
```

## Troubleshooting

### "I clicked Add but don't see the form"
- **Solution**: Scroll down - the form appears below the data table

### "The form is there but I don't see fields"
- **Solution**: Click the form header bar to expand it

### "I see fields but no save button"
- **Solution**: Scroll to the bottom of the form - buttons are at the end

### "The save button is grayed out"
- **Reason**: Form is currently submitting (loading state)
- **Solution**: Wait for the operation to complete

### "Nothing happens when I click save"
- **Check**: Look for red validation error messages above fields
- **Solution**: Fix validation errors and try again

## Form Behavior

### Auto-collapse
- Forms automatically collapse after successful submission
- This returns you to the data table view

### Unsaved Changes Warning
- If you try to cancel with unsaved changes, you'll get a confirmation dialog
- This prevents accidental data loss

### Real-time Validation
- Fields validate as you type (after first blur)
- Error messages appear below invalid fields
- Submit button remains enabled (server-side validation is final)

## Keyboard Shortcuts

- **Tab**: Navigate between fields
- **Enter**: Submit form (when focused on a field)
- **Escape**: Close modal forms (FormModal only)

## Mobile Considerations

On mobile devices:
- Forms take full width
- Buttons stack vertically
- Touch targets are minimum 44px for accessibility
- Scroll to see all fields and buttons
