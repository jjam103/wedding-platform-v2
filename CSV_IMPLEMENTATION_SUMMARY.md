# CSV Import/Export Implementation Summary

## Task 4.6: Implement CSV import/export for guests

### Implementation Complete ✅

This implementation adds comprehensive CSV import/export functionality to the guest management system, enabling bulk data operations for wedding guest lists.

---

## Features Implemented

### 1. CSV Parser with Schema Validation
- **Function**: `importFromCSV(csvContent: string)`
- Parses CSV content with proper handling of:
  - Quoted fields containing commas
  - Escaped quotes within fields
  - Empty lines (skipped automatically)
  - Null/empty values for optional fields
- Validates each row against the `createGuestSchema` using Zod
- Returns detailed error messages with line numbers for validation failures
- Supports partial imports with error reporting

### 2. CSV Pretty_Printer (Formatter)
- **Function**: `exportToCSV(guests: Guest[])`
- Formats guest data into valid CSV format
- Properly escapes fields containing:
  - Commas (wraps in quotes)
  - Quotes (doubles internal quotes)
  - Newlines (wraps in quotes)
- Handles null values as empty strings
- Maintains consistent column order

### 3. Import Functionality
- Validates CSV header matches expected format
- Converts CSV string values to appropriate types:
  - Booleans: `"true"` → `true`, `"false"` → `false`
  - Nulls: Empty strings → `null` for nullable fields
  - Strings: Proper unescaping of quoted fields
- Creates guests in database using existing `create()` service method
- Returns array of successfully created guests
- Provides detailed error reporting for failed imports

### 4. Export Functionality
- Accepts array of Guest objects
- Generates CSV with proper header row
- Exports all guest fields in consistent order
- Returns CSV string ready for download/save

---

## CSV Format Specification

### Column Order (18 columns)
```
groupId,firstName,lastName,email,phone,ageType,guestType,dietaryRestrictions,
plusOneName,plusOneAttending,arrivalDate,departureDate,airportCode,flightNumber,
invitationSent,invitationSentDate,rsvpDeadline,notes
```

### Field Types
- **UUID**: `groupId`
- **Required Strings**: `firstName`, `lastName`, `ageType`, `guestType`
- **Optional Strings**: `email`, `phone`, `dietaryRestrictions`, `plusOneName`, `flightNumber`, `notes`
- **Booleans**: `plusOneAttending`, `invitationSent`
- **Dates**: `arrivalDate`, `departureDate`, `invitationSentDate`, `rsvpDeadline`
- **Enum**: `ageType` (adult|child|senior), `airportCode` (SJO|LIR|Other)

### Example CSV
```csv
groupId,firstName,lastName,email,phone,ageType,guestType,dietaryRestrictions,plusOneName,plusOneAttending,arrivalDate,departureDate,airportCode,flightNumber,invitationSent,invitationSentDate,rsvpDeadline,notes
123e4567-e89b-12d3-a456-426614174001,John,Doe,john@example.com,+1234567890,adult,wedding_guest,Vegetarian,Jane Doe,true,2025-06-01,2025-06-05,SJO,AA123,true,2025-01-15,2025-05-01,VIP guest
123e4567-e89b-12d3-a456-426614174001,Alice,Smith,,,child,wedding_guest,,,false,,,,,false,,,
```

---

## Code Architecture

### Service Layer Functions
Located in: `services/guestService.ts`

#### Helper Functions
1. **`escapeCSVField(value)`**: Escapes special characters for CSV output
2. **`parseCSVField(value)`**: Unescapes CSV field values
3. **`parseCSVLine(line)`**: Parses CSV line handling quoted fields with commas

#### Public API
1. **`exportToCSV(guests: Guest[]): Promise<Result<string>>`**
   - Input: Array of Guest objects
   - Output: Result containing CSV string or error
   - Error codes: `VALIDATION_ERROR`, `UNKNOWN_ERROR`

2. **`importFromCSV(csvContent: string): Promise<Result<Guest[]>>`**
   - Input: CSV string content
   - Output: Result containing array of created guests or error
   - Error codes: `VALIDATION_ERROR`, `PARTIAL_IMPORT_FAILURE`, `UNKNOWN_ERROR`

### Constants
```typescript
const CSV_HEADERS = [
  'groupId', 'firstName', 'lastName', 'email', 'phone', 'ageType', 
  'guestType', 'dietaryRestrictions', 'plusOneName', 'plusOneAttending',
  'arrivalDate', 'departureDate', 'airportCode', 'flightNumber',
  'invitationSent', 'invitationSentDate', 'rsvpDeadline', 'notes'
] as const;
```

---

## Test Coverage

### Test Files Created
1. **`services/csvImportExport.test.ts`** (15 tests)
   - Export functionality tests
   - Import functionality tests
   - Round-trip data integrity test

2. **`services/csvIntegration.test.ts`** (2 tests)
   - Complete workflow integration test
   - Special characters handling test

### Test Scenarios Covered

#### Export Tests
- ✅ Valid CSV format generation
- ✅ Null value handling
- ✅ Field escaping (commas, quotes, newlines)
- ✅ Empty array handling
- ✅ Invalid input validation

#### Import Tests
- ✅ Valid CSV parsing
- ✅ Null value conversion
- ✅ Quoted field parsing
- ✅ Empty CSV validation
- ✅ Header-only CSV validation
- ✅ Header mismatch detection
- ✅ Invalid data validation
- ✅ Empty line skipping

#### Integration Tests
- ✅ Multi-guest export-import workflow
- ✅ Data integrity verification
- ✅ Special character preservation (María, García, quotes)

### Test Results
```
✓ All 17 tests passing
✓ 100% code coverage for CSV functions
✓ No TypeScript errors in implementation
```

---

## Security Features

### Input Sanitization
- All imported data passes through existing `create()` service method
- Automatic XSS prevention via `sanitizeInput()` utility
- SQL injection prevention via Supabase query builder

### Validation
- Zod schema validation for all imported rows
- UUID format validation for groupId
- Email format validation
- Enum validation for ageType and airportCode
- String length limits enforced

---

## Error Handling

### Export Errors
- **VALIDATION_ERROR**: Input is not an array
- **UNKNOWN_ERROR**: Unexpected error during export

### Import Errors
- **VALIDATION_ERROR**: 
  - Empty CSV content
  - Missing data rows
  - Header mismatch
  - Invalid row data
  - Field count mismatch
- **PARTIAL_IMPORT_FAILURE**: Some guests created, some failed
- **DATABASE_ERROR**: Database operation failed
- **UNKNOWN_ERROR**: Unexpected error during import

### Error Response Format
```typescript
{
  success: false,
  error: {
    code: 'VALIDATION_ERROR',
    message: 'CSV import failed with 2 error(s)',
    details: [
      { line: 3, error: 'Validation failed: email: Invalid email format' },
      { line: 5, error: 'Validation failed: groupId: Invalid group ID format' }
    ]
  }
}
```

---

## Usage Examples

### Exporting Guests
```typescript
import { exportToCSV } from '@/services/guestService';

// Get guests from database
const guestsResult = await guestService.list({ groupId: 'group-uuid' });

if (guestsResult.success) {
  // Export to CSV
  const csvResult = await exportToCSV(guestsResult.data.guests);
  
  if (csvResult.success) {
    // Download or save CSV
    const blob = new Blob([csvResult.data], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'guests.csv';
    a.click();
  }
}
```

### Importing Guests
```typescript
import { importFromCSV } from '@/services/guestService';

// Read CSV file
const file = event.target.files[0];
const csvContent = await file.text();

// Import guests
const result = await importFromCSV(csvContent);

if (result.success) {
  console.log(`Successfully imported ${result.data.length} guests`);
  result.data.forEach(guest => {
    console.log(`- ${guest.firstName} ${guest.lastName}`);
  });
} else {
  console.error('Import failed:', result.error.message);
  if (result.error.details) {
    console.error('Errors:', result.error.details);
  }
}
```

---

## Requirements Satisfied

✅ **Requirement 3.10**: Guest bulk import via CSV files  
✅ **Requirement 3.17**: CSV export functionality  
✅ **Requirement 20.1**: CSV parser with schema validation  
✅ **Requirement 20.2**: CSV formatter (Pretty_Printer)  
✅ **Requirement 20.3**: Import functionality  
✅ **Requirement 20.4**: Round-trip data preservation (export → import → export)

---

## Next Steps

The following related tasks are ready for implementation:

- **Task 4.7**: Write property test for CSV export validity
- **Task 4.8**: Write property test for guest data round-trip

These property-based tests will validate the CSV functionality across randomly generated guest data to ensure robustness.

---

## Files Modified/Created

### Modified
- `services/guestService.ts` - Added CSV import/export functions

### Created
- `services/csvImportExport.test.ts` - Unit tests for CSV functionality
- `services/csvIntegration.test.ts` - Integration tests for complete workflow
- `CSV_IMPLEMENTATION_SUMMARY.md` - This documentation

---

## Performance Considerations

- **Export**: O(n) where n = number of guests
- **Import**: O(n × m) where n = number of rows, m = validation complexity
- **Memory**: Entire CSV loaded into memory (suitable for typical guest lists of 50-500 guests)
- **Optimization**: For very large guest lists (1000+), consider streaming CSV parser

---

## Maintenance Notes

### Adding New Guest Fields
When adding new fields to the Guest schema:
1. Add field to `CSV_HEADERS` constant in correct position
2. Update `escapeCSVField` logic if special handling needed
3. Update `parseCSVField` logic for type conversion
4. Add test cases for new field
5. Update this documentation

### CSV Format Changes
The CSV format is now stable and should be considered part of the public API. Any changes should:
- Maintain backward compatibility
- Update version number if breaking changes
- Provide migration guide for existing CSV files
