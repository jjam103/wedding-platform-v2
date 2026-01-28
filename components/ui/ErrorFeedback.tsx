/**
 * Error Feedback Components
 * 
 * Provides user-friendly error display for various error types:
 * - Field-level validation errors (Requirement 18.1)
 * - User-friendly error messages (Requirement 18.2)
 * - Scheduling conflict details (Requirement 18.3)
 * - Circular reference chains (Requirement 18.4)
 * - Bulk operation results (Requirement 18.5)
 */

import React from 'react';

/**
 * Field-level validation error
 */
export interface FieldError {
  field: string;
  message: string;
  code?: string;
}

/**
 * Scheduling conflict error
 */
export interface SchedulingConflict {
  conflictingEvent: {
    id: string;
    name: string;
    startDate: string;
    endDate?: string;
    location?: string;
  };
  reason: string;
}

/**
 * Circular reference error
 */
export interface CircularReference {
  chain: Array<{
    id: string;
    name: string;
    type: string;
  }>;
}

/**
 * Bulk operation result
 */
export interface BulkOperationResult {
  total: number;
  succeeded: number;
  failed: number;
  errors: Array<{
    item: string;
    reason: string;
  }>;
}

/**
 * Props for FieldValidationErrors component
 */
interface FieldValidationErrorsProps {
  errors: FieldError[];
  className?: string;
}

/**
 * Display field-level validation errors
 * 
 * Requirement 18.1: Display specific field and validation rule that failed
 */
export function FieldValidationErrors({ errors, className = '' }: FieldValidationErrorsProps) {
  if (!errors || errors.length === 0) {
    return null;
  }

  return (
    <div className={`rounded-md bg-red-50 p-4 ${className}`} role="alert" aria-live="polite">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-red-400"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">
            {errors.length === 1 ? 'Validation Error' : `${errors.length} Validation Errors`}
          </h3>
          <div className="mt-2 text-sm text-red-700">
            <ul className="list-disc space-y-1 pl-5">
              {errors.map((error, index) => (
                <li key={`${error.field}-${index}`}>
                  <span className="font-medium">{formatFieldName(error.field)}:</span> {error.message}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Props for UserFriendlyError component
 */
interface UserFriendlyErrorProps {
  error: {
    code: string;
    message: string;
    details?: any;
  };
  className?: string;
}

/**
 * Display user-friendly error messages
 * 
 * Requirement 18.2: Show user-friendly error messages without exposing technical details
 */
export function UserFriendlyError({ error, className = '' }: UserFriendlyErrorProps) {
  const friendlyMessage = getFriendlyErrorMessage(error.code, error.message);

  return (
    <div className={`rounded-md bg-red-50 p-4 ${className}`} role="alert" aria-live="polite">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-red-400"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">Error</h3>
          <div className="mt-2 text-sm text-red-700">
            <p>{friendlyMessage}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Props for SchedulingConflictError component
 */
interface SchedulingConflictErrorProps {
  conflict: SchedulingConflict;
  className?: string;
}

/**
 * Display scheduling conflict details
 * 
 * Requirement 18.3: Display scheduling conflict details with conflicting events
 */
export function SchedulingConflictError({ conflict, className = '' }: SchedulingConflictErrorProps) {
  return (
    <div className={`rounded-md bg-yellow-50 p-4 ${className}`} role="alert" aria-live="polite">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-yellow-400"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-yellow-800">Scheduling Conflict</h3>
          <div className="mt-2 text-sm text-yellow-700">
            <p className="mb-2">{conflict.reason}</p>
            <div className="rounded-md bg-yellow-100 p-3">
              <p className="font-medium">{conflict.conflictingEvent.name}</p>
              <p className="text-xs mt-1">
                {formatDate(conflict.conflictingEvent.startDate)}
                {conflict.conflictingEvent.endDate && ` - ${formatDate(conflict.conflictingEvent.endDate)}`}
              </p>
              {conflict.conflictingEvent.location && (
                <p className="text-xs mt-1">Location: {conflict.conflictingEvent.location}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Props for CircularReferenceError component
 */
interface CircularReferenceErrorProps {
  reference: CircularReference;
  className?: string;
}

/**
 * Display circular reference chains
 * 
 * Requirement 18.4: Show circular reference chains that create the cycle
 */
export function CircularReferenceError({ reference, className = '' }: CircularReferenceErrorProps) {
  return (
    <div className={`rounded-md bg-red-50 p-4 ${className}`} role="alert" aria-live="polite">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-red-400"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">Circular Reference Detected</h3>
          <div className="mt-2 text-sm text-red-700">
            <p className="mb-2">This operation would create a circular reference:</p>
            <div className="rounded-md bg-red-100 p-3">
              <div className="flex items-center space-x-2">
                {reference.chain.map((item, index) => (
                  <React.Fragment key={item.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{item.name}</span>
                      <span className="text-xs text-red-600">{item.type}</span>
                    </div>
                    {index < reference.chain.length - 1 && (
                      <svg
                        className="h-4 w-4 text-red-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    )}
                  </React.Fragment>
                ))}
                <svg
                  className="h-4 w-4 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
                <span className="text-red-600 font-medium">🔄 Back to {reference.chain[0].name}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Props for BulkOperationResults component
 */
interface BulkOperationResultsProps {
  result: BulkOperationResult;
  className?: string;
}

/**
 * Display bulk operation results
 * 
 * Requirement 18.5: Display bulk operation results with success/failure counts
 */
export function BulkOperationResults({ result, className = '' }: BulkOperationResultsProps) {
  const hasErrors = result.failed > 0;
  const allSucceeded = result.succeeded === result.total;

  return (
    <div
      className={`rounded-md ${allSucceeded ? 'bg-green-50' : 'bg-yellow-50'} p-4 ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="flex">
        <div className="flex-shrink-0">
          {allSucceeded ? (
            <svg
              className="h-5 w-5 text-green-400"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg
              className="h-5 w-5 text-yellow-400"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>
        <div className="ml-3">
          <h3 className={`text-sm font-medium ${allSucceeded ? 'text-green-800' : 'text-yellow-800'}`}>
            Bulk Operation Complete
          </h3>
          <div className={`mt-2 text-sm ${allSucceeded ? 'text-green-700' : 'text-yellow-700'}`}>
            <p className="mb-2">
              <span className="font-medium">{result.succeeded}</span> of{' '}
              <span className="font-medium">{result.total}</span> items processed successfully
              {hasErrors && (
                <>
                  {' '}
                  (<span className="font-medium text-red-700">{result.failed} failed</span>)
                </>
              )}
            </p>
            {hasErrors && result.errors.length > 0 && (
              <div className="mt-3">
                <p className="font-medium mb-2">Failed Items:</p>
                <ul className="list-disc space-y-1 pl-5">
                  {result.errors.map((error, index) => (
                    <li key={index}>
                      <span className="font-medium">{error.item}:</span> {error.reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Helper function to format field names for display
 */
function formatFieldName(field: string): string {
  // Convert camelCase or snake_case to Title Case
  return field
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/\./g, ' > ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .trim();
}

/**
 * Helper function to get user-friendly error messages
 */
function getFriendlyErrorMessage(code: string, message: string): string {
  const friendlyMessages: Record<string, string> = {
    VALIDATION_ERROR: 'Please check the form for errors and try again.',
    DATABASE_ERROR: 'We encountered a problem saving your changes. Please try again.',
    UNAUTHORIZED: 'You need to be logged in to perform this action.',
    NOT_FOUND: 'The requested item could not be found.',
    CONFLICT: 'This operation conflicts with existing data. Please review and try again.',
    EXTERNAL_SERVICE_ERROR: 'An external service is temporarily unavailable. Please try again later.',
    UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
    DUPLICATE_ENTRY: 'An item with this information already exists.',
    CAPACITY_EXCEEDED: 'The capacity limit has been reached.',
    FORBIDDEN: 'You do not have permission to perform this action.',
  };

  return friendlyMessages[code] || message || 'An error occurred. Please try again.';
}

/**
 * Helper function to format dates
 */
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}
