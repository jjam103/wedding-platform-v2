'use client';

import { useState, useId, type ReactNode, type FormEvent } from 'react';
import { generateAriaLabel, announceToScreenReader } from '@/utils/accessibility';

interface FormFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'password' | 'tel' | 'number' | 'date' | 'textarea' | 'select';
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  error?: string;
  helpText?: string;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  disabled?: boolean;
  autoComplete?: string;
}

/**
 * Accessible Form Field Component
 * 
 * WCAG 2.1 AA compliant form field with:
 * - Proper ARIA labels
 * - Error announcements
 * - Keyboard navigation
 * - Screen reader support
 */
export function AccessibleFormField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  required = false,
  error,
  helpText,
  placeholder,
  options,
  disabled = false,
  autoComplete,
}: FormFieldProps) {
  const fieldId = useId();
  const errorId = `${fieldId}-error`;
  const helpId = `${fieldId}-help`;

  const ariaLabel = generateAriaLabel(label, required, error);
  const ariaDescribedBy = [
    error ? errorId : null,
    helpText ? helpId : null,
  ].filter(Boolean).join(' ');

  const baseInputClasses = `form-input-mobile w-full ${
    error ? 'border-volcano-500 focus:ring-volcano-500' : ''
  } ${disabled ? 'bg-sage-100 cursor-not-allowed' : ''}`;

  const renderInput = () => {
    if (type === 'textarea') {
      return (
        <textarea
          id={fieldId}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          disabled={disabled}
          placeholder={placeholder}
          aria-label={ariaLabel}
          aria-describedby={ariaDescribedBy || undefined}
          aria-invalid={error ? 'true' : 'false'}
          aria-required={required ? 'true' : 'false'}
          className={`${baseInputClasses} min-h-[120px]`}
          rows={4}
        />
      );
    }

    if (type === 'select' && options) {
      return (
        <select
          id={fieldId}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          disabled={disabled}
          aria-label={ariaLabel}
          aria-describedby={ariaDescribedBy || undefined}
          aria-invalid={error ? 'true' : 'false'}
          aria-required={required ? 'true' : 'false'}
          className={baseInputClasses}
        >
          <option value="">Select {label}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    }

    return (
      <input
        id={fieldId}
        name={name}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy || undefined}
        aria-invalid={error ? 'true' : 'false'}
        aria-required={required ? 'true' : 'false'}
        className={baseInputClasses}
      />
    );
  };

  return (
    <div className="mb-4">
      <label htmlFor={fieldId} className="block text-sm font-medium text-sage-900 mb-2">
        {label}
        {required && <span className="text-volcano-500 ml-1" aria-label="required">*</span>}
      </label>

      {renderInput()}

      {helpText && (
        <p id={helpId} className="mt-2 text-sm text-sage-600">
          {helpText}
        </p>
      )}

      {error && (
        <div
          id={errorId}
          role="alert"
          aria-live="polite"
          className="mt-2 text-sm text-volcano-700 flex items-start space-x-1"
        >
          <span aria-hidden="true">❌</span>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

interface AccessibleFormProps {
  children: ReactNode;
  onSubmit: (e: FormEvent) => void;
  title?: string;
  description?: string;
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
  isSubmitting?: boolean;
  className?: string;
}

/**
 * Accessible Form Component
 * 
 * WCAG 2.1 AA compliant form with:
 * - Proper form structure
 * - Submit/cancel actions
 * - Loading states
 * - Error handling
 */
export function AccessibleForm({
  children,
  onSubmit,
  title,
  description,
  submitLabel = 'Submit',
  cancelLabel = 'Cancel',
  onCancel,
  isSubmitting = false,
  className = '',
}: AccessibleFormProps) {
  const formId = useId();
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);
    
    // Announce form submission to screen readers
    announceToScreenReader('Form submitted', 'polite');
    
    onSubmit(e);
  };

  return (
    <form
      id={formId}
      onSubmit={handleSubmit}
      className={`space-y-6 ${className}`}
      noValidate
      aria-label={title}
    >
      {title && (
        <div className="mb-6">
          <h2 className="text-responsive-lg font-semibold text-sage-900">{title}</h2>
          {description && (
            <p className="mt-2 text-sm text-sage-600">{description}</p>
          )}
        </div>
      )}

      <fieldset disabled={isSubmitting} className="space-y-4">
        <legend className="sr-only">{title || 'Form fields'}</legend>
        {children}
      </fieldset>

      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary-mobile flex-1 sm:flex-initial"
          aria-busy={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
              <span>Submitting...</span>
            </>
          ) : (
            submitLabel
          )}
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="btn-secondary-mobile flex-1 sm:flex-initial"
          >
            {cancelLabel}
          </button>
        )}
      </div>

      {submitAttempted && (
        <div role="status" aria-live="polite" className="sr-only">
          Form submission in progress
        </div>
      )}
    </form>
  );
}
