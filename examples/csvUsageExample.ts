/**
 * Example usage of CSV import/export functionality
 * 
 * This file demonstrates how to use the CSV functions in real-world scenarios.
 */

import { exportToCSV, importFromCSV, list } from '@/services/guestService';
import type { Guest } from '@/schemas/guestSchemas';

/**
 * Example 1: Export all guests from a group to CSV file
 */
export async function exportGroupToCSV(groupId: string): Promise<void> {
  // Fetch all guests in the group
  const result = await list({ groupId, pageSize: 1000 });
  
  if (!result.success) {
    console.error('Failed to fetch guests:', result.error.message);
    return;
  }
  
  // Export to CSV
  const csvResult = await exportToCSV(result.data.guests);
  
  if (!csvResult.success) {
    console.error('Failed to export CSV:', csvResult.error.message);
    return;
  }
  
  // In a browser environment, trigger download
  if (typeof window !== 'undefined') {
    const blob = new Blob([csvResult.data], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `guests-${groupId}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }
  
  // In a Node.js environment, save to file
  if (typeof window === 'undefined') {
    const fs = require('fs');
    const filename = `guests-${groupId}-${new Date().toISOString().split('T')[0]}.csv`;
    fs.writeFileSync(filename, csvResult.data, 'utf-8');
    console.log(`Exported ${result.data.guests.length} guests to ${filename}`);
  }
}

/**
 * Example 2: Import guests from CSV file
 */
export async function importGuestsFromFile(csvContent: string): Promise<{
  success: boolean;
  imported: number;
  failed: number;
  errors?: Array<{ guest: string; error: string }>;
}> {
  const result = await importFromCSV(csvContent);
  
  if (result.success) {
    return {
      success: true,
      imported: result.data.length,
      failed: 0,
    };
  }
  
  // Handle partial import failure
  if (result.error.code === 'PARTIAL_IMPORT_FAILURE' && result.error.details) {
    const details = result.error.details as any;
    return {
      success: false,
      imported: details.createdGuests?.length || 0,
      failed: details.errors?.length || 0,
      errors: details.errors,
    };
  }
  
  // Complete failure
  return {
    success: false,
    imported: 0,
    failed: -1, // Unknown number of failures
    errors: [{ guest: 'Unknown', error: result.error.message }],
  };
}

/**
 * Example 3: Export guests with specific filters
 */
export async function exportFilteredGuests(filters: {
  ageType?: 'adult' | 'child' | 'senior';
  guestType?: string;
  invitationSent?: boolean;
}): Promise<string | null> {
  // Fetch filtered guests
  const result = await list({ ...filters, pageSize: 1000 });
  
  if (!result.success) {
    console.error('Failed to fetch guests:', result.error.message);
    return null;
  }
  
  // Export to CSV
  const csvResult = await exportToCSV(result.data.guests);
  
  if (!csvResult.success) {
    console.error('Failed to export CSV:', csvResult.error.message);
    return null;
  }
  
  return csvResult.data;
}

/**
 * Example 4: Validate CSV before import
 */
export async function validateCSVContent(csvContent: string): Promise<{
  valid: boolean;
  rowCount: number;
  errors: Array<{ line: number; error: string }>;
}> {
  const lines = csvContent.trim().split('\n');
  
  if (lines.length < 2) {
    return {
      valid: false,
      rowCount: 0,
      errors: [{ line: 0, error: 'CSV must contain header and at least one data row' }],
    };
  }
  
  // Try to import (this will validate all rows)
  const result = await importFromCSV(csvContent);
  
  if (result.success) {
    return {
      valid: true,
      rowCount: result.data.length,
      errors: [],
    };
  }
  
  // Extract validation errors
  const errors: Array<{ line: number; error: string }> = [];
  
  if (result.error.details && Array.isArray(result.error.details)) {
    result.error.details.forEach((detail: any) => {
      if (detail.line && detail.error) {
        errors.push({ line: detail.line, error: detail.error });
      }
    });
  }
  
  return {
    valid: false,
    rowCount: lines.length - 1, // Exclude header
    errors,
  };
}

/**
 * Example 5: Bulk update guests via CSV
 * 
 * This demonstrates a workflow where you:
 * 1. Export current guests
 * 2. User edits CSV
 * 3. Import updated CSV
 * 4. Match by email to update existing guests
 */
export async function bulkUpdateViaCSV(
  csvContent: string,
  groupId: string
): Promise<{
  updated: number;
  created: number;
  errors: string[];
}> {
  // Import the CSV
  const importResult = await importFromCSV(csvContent);
  
  if (!importResult.success) {
    return {
      updated: 0,
      created: 0,
      errors: [importResult.error.message],
    };
  }
  
  // Fetch existing guests in the group
  const existingResult = await list({ groupId, pageSize: 1000 });
  
  if (!existingResult.success) {
    return {
      updated: 0,
      created: 0,
      errors: ['Failed to fetch existing guests'],
    };
  }
  
  // Create a map of existing guests by email
  const existingByEmail = new Map<string, Guest>();
  existingResult.data.guests.forEach(guest => {
    if (guest.email) {
      existingByEmail.set(guest.email.toLowerCase(), guest);
    }
  });
  
  let updated = 0;
  let created = 0;
  const errors: string[] = [];
  
  // Note: This is a simplified example. In production, you would:
  // 1. Use the update() function for existing guests
  // 2. Handle conflicts and validation
  // 3. Provide detailed progress feedback
  
  for (const importedGuest of importResult.data) {
    if (importedGuest.email) {
      const existing = existingByEmail.get(importedGuest.email.toLowerCase());
      if (existing) {
        updated++;
        // In production: await update(existing.id, importedGuest)
      } else {
        created++;
      }
    } else {
      created++;
    }
  }
  
  return { updated, created, errors };
}

/**
 * Example 6: Generate CSV template for manual entry
 */
export async function generateCSVTemplate(): Promise<string> {
  const sampleGuests: Guest[] = [
    {
      id: '00000000-0000-0000-0000-000000000000',
      groupId: 'YOUR-GROUP-UUID-HERE',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      ageType: 'adult',
      guestType: 'wedding_guest',
      dietaryRestrictions: 'Vegetarian',
      plusOneName: 'Jane Doe',
      plusOneAttending: true,
      arrivalDate: '2025-06-01',
      departureDate: '2025-06-05',
      airportCode: 'SJO',
      flightNumber: 'AA123',
      invitationSent: false,
      invitationSentDate: null,
      rsvpDeadline: '2025-05-01',
      notes: 'Sample guest entry',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
  
  // This will generate a CSV with one sample row
  // Users can delete the sample row and add their own data
  const result = await exportToCSV(sampleGuests);
  
  if (result.success) {
    return result.data;
  }
  
  // Fallback: return just the header
  return 'groupId,firstName,lastName,email,phone,ageType,guestType,dietaryRestrictions,plusOneName,plusOneAttending,arrivalDate,departureDate,airportCode,flightNumber,invitationSent,invitationSentDate,rsvpDeadline,notes';
}

/**
 * Example 7: Handle file upload in React component
 */
export const CSVUploadExample = `
import { useState } from 'react';
import { importFromCSV } from '@/services/guestService';

export function CSVUploadComponent() {
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setResult(null);

    try {
      // Read file content
      const csvContent = await file.text();

      // Import guests
      const importResult = await importFromCSV(csvContent);

      if (importResult.success) {
        setResult(\`Successfully imported \${importResult.data.length} guests\`);
      } else {
        setResult(\`Import failed: \${importResult.error.message}\`);
      }
    } catch (error) {
      setResult(\`Error reading file: \${error.message}\`);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
        disabled={importing}
      />
      {importing && <p>Importing...</p>}
      {result && <p>{result}</p>}
    </div>
  );
}
`;
