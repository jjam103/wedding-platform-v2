/**
 * Accessibility Utilities
 * 
 * Utilities for improving accessibility including:
 * - Screen reader announcements
 * - ARIA label generation
 * - Focus management
 */

/**
 * Announce message to screen readers using ARIA live region
 * 
 * @param message - Message to announce
 * @param priority - Priority level ('polite' or 'assertive')
 * 
 * @example
 * announceToScreenReader('Guest created successfully', 'polite');
 * announceToScreenReader('Error: Failed to save', 'assertive');
 */
export function announceToScreenReader(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void {
  // Create or get existing live region
  let liveRegion = document.getElementById('screen-reader-announcements');
  
  if (!liveRegion) {
    liveRegion = document.createElement('div');
    liveRegion.id = 'screen-reader-announcements';
    liveRegion.setAttribute('role', priority === 'assertive' ? 'alert' : 'status');
    liveRegion.setAttribute('aria-live', priority);
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    document.body.appendChild(liveRegion);
  }
  
  // Update aria-live if priority changed
  if (liveRegion.getAttribute('aria-live') !== priority) {
    liveRegion.setAttribute('aria-live', priority);
    liveRegion.setAttribute('role', priority === 'assertive' ? 'alert' : 'status');
  }
  
  // Clear and set new message
  liveRegion.textContent = '';
  setTimeout(() => {
    liveRegion!.textContent = message;
  }, 100);
}

/**
 * Generate descriptive ARIA label for form fields
 * 
 * @param fieldName - Field name
 * @param required - Whether field is required
 * @param error - Error message if any
 * 
 * @example
 * generateAriaLabel('Email', true, 'Invalid email format')
 * // Returns: "Email (required) - Error: Invalid email format"
 */
export function generateAriaLabel(
  fieldName: string,
  required: boolean = false,
  error?: string
): string {
  let label = fieldName;
  
  if (required) {
    label += ' (required)';
  }
  
  if (error) {
    label += ` - Error: ${error}`;
  }
  
  return label;
}

/**
 * Generate ARIA description for complex UI elements
 * 
 * @param description - Base description
 * @param additionalInfo - Additional context
 * 
 * @example
 * generateAriaDescription('Delete guest', 'This action cannot be undone')
 * // Returns: "Delete guest. This action cannot be undone"
 */
export function generateAriaDescription(
  description: string,
  additionalInfo?: string
): string {
  if (additionalInfo) {
    return `${description}. ${additionalInfo}`;
  }
  return description;
}

/**
 * Focus element and announce to screen reader
 * 
 * @param elementId - ID of element to focus
 * @param announcement - Optional announcement message
 * 
 * @example
 * focusElement('search-input', 'Search field focused');
 */
export function focusElement(elementId: string, announcement?: string): void {
  const element = document.getElementById(elementId);
  
  if (element) {
    element.focus();
    
    if (announcement) {
      announceToScreenReader(announcement, 'polite');
    }
  }
}

/**
 * Trap focus within a modal or dialog
 * 
 * @param containerElement - Container element to trap focus within
 * @returns Cleanup function to remove event listeners
 * 
 * @example
 * const cleanup = trapFocus(modalElement);
 * // Later: cleanup();
 */
export function trapFocus(containerElement: HTMLElement): () => void {
  const focusableElements = containerElement.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  
  const handleTabKey = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;
    
    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  };
  
  containerElement.addEventListener('keydown', handleTabKey);
  
  // Focus first element
  firstElement?.focus();
  
  // Return cleanup function
  return () => {
    containerElement.removeEventListener('keydown', handleTabKey);
  };
}

/**
 * Get accessible name for button based on action and entity
 * 
 * @param action - Action being performed
 * @param entityType - Type of entity
 * @param entityName - Name of specific entity
 * 
 * @example
 * getAccessibleButtonName('delete', 'guest', 'John Doe')
 * // Returns: "Delete guest John Doe"
 */
export function getAccessibleButtonName(
  action: string,
  entityType: string,
  entityName?: string
): string {
  const capitalizedAction = action.charAt(0).toUpperCase() + action.slice(1);
  
  if (entityName) {
    return `${capitalizedAction} ${entityType} ${entityName}`;
  }
  
  return `${capitalizedAction} ${entityType}`;
}

/**
 * Format count for screen readers
 * 
 * @param count - Number to format
 * @param singular - Singular form
 * @param plural - Plural form
 * 
 * @example
 * formatCountForScreenReader(1, 'guest', 'guests')
 * // Returns: "1 guest"
 * 
 * formatCountForScreenReader(5, 'guest', 'guests')
 * // Returns: "5 guests"
 */
export function formatCountForScreenReader(
  count: number,
  singular: string,
  plural: string
): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

/**
 * Generate ARIA label for pagination
 * 
 * @param currentPage - Current page number
 * @param totalPages - Total number of pages
 * 
 * @example
 * generatePaginationAriaLabel(2, 10)
 * // Returns: "Page 2 of 10"
 */
export function generatePaginationAriaLabel(
  currentPage: number,
  totalPages: number
): string {
  return `Page ${currentPage} of ${totalPages}`;
}

/**
 * Generate ARIA label for status badge
 * 
 * @param status - Status value
 * @param entityType - Type of entity
 * 
 * @example
 * generateStatusAriaLabel('published', 'page')
 * // Returns: "Page status: published"
 */
export function generateStatusAriaLabel(
  status: string,
  entityType: string
): string {
  return `${entityType} status: ${status}`;
}
