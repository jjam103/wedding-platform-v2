'use client';

import { useState, useCallback, type FormEvent } from 'react';
import { z } from 'zod';
import { Button } from './Button';

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'number' | 'select' | 'textarea' | 'date' | 'datetime-local' | 'checkbox' | 'richtext';
  placeholder?: string;
  required?: boolean;
  options?: { label: string; value: string | number }[];
  helpText?: string;
  disabled?: boolean;
  rows?: number; // For textarea
}

interface DynamicFormProps {
  fields: FormField[];
  initialData?: Record<string, any>;
  schema: z.ZodSchema;
  onSubmit: (data: Record<string, any>) => Promise<void>;
  submitLabel?: string;
  onCancel?: () => void;
  cancelLabel?: string;
}

interface FormState {
  data: Record<string, any>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  submitting: boolean;
}

/**
 * DynamicForm Component
 * 
 * Renders a form dynamically based on field configuration.
 * Validates input using Zod schemas and displays field-level errors.
 * Supports various input types including text, email, number, select, textarea, date, datetime, and checkbox.
 */
export function DynamicForm({
  fields,
  initialData = {},
  schema,
  onSubmit,
  submitLabel = 'Submit',
  onCancel,
  cancelLabel = 'Cancel',
}: DynamicFormProps) {
  const [formState, setFormState] = useState<FormState>({
    data: initialData,
    errors: {},
    touched: {},
    submitting: false,
  });

  // Handle field change
  const handleChange = useCallback((name: string, value: any) => {
    setFormState((prev) => ({
      ...prev,
      data: {
        ...prev.data,
        [name]: value,
      },
      touched: {
        ...prev.touched,
        [name]: true,
      },
    }));
  }, []);

  // Handle field blur - validate single field
  const handleBlur = useCallback((name: string) => {
    const validation = schema.safeParse(formState.data);
    
    if (!validation.success) {
      const fieldError = validation.error.issues.find(
        (issue) => issue.path[0] === name
      );
      
      if (fieldError) {
        setFormState((prev) => ({
          ...prev,
          errors: {
            ...prev.errors,
            [name]: fieldError.message,
          },
        }));
      } else {
        // Clear error if field is now valid
        setFormState((prev) => {
          const newErrors = { ...prev.errors };
          delete newErrors[name];
          return {
            ...prev,
            errors: newErrors,
          };
        });
      }
    } else {
      // Clear error if validation passes
      setFormState((prev) => {
        const newErrors = { ...prev.errors };
        delete newErrors[name];
        return {
          ...prev,
          errors: newErrors,
        };
      });
    }
  }, [formState.data, schema]);

  // Handle form submission
  const handleSubmit = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    // Validate all fields
    const validation = schema.safeParse(formState.data);
    
    if (!validation.success) {
      // Set all fields as touched
      const allTouched = fields.reduce((acc, field) => {
        acc[field.name] = true;
        return acc;
      }, {} as Record<string, boolean>);
      
      // Map errors
      const errors = validation.error.issues.reduce((acc, issue) => {
        const fieldName = issue.path[0] as string;
        acc[fieldName] = issue.message;
        return acc;
      }, {} as Record<string, string>);
      
      setFormState((prev) => ({
        ...prev,
        errors,
        touched: allTouched,
      }));
      
      return;
    }
    
    // Submit form
    setFormState((prev) => ({ ...prev, submitting: true }));
    
    try {
      await onSubmit(validation.data);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setFormState((prev) => ({ ...prev, submitting: false }));
    }
  }, [formState.data, schema, fields, onSubmit]);

  // Render form field based on type
  const renderField = (field: FormField) => {
    const value = formState.data[field.name] ?? '';
    const error = formState.touched[field.name] ? formState.errors[field.name] : undefined;
    const hasError = !!error;

    const baseInputClasses = `w-full px-3 py-3 md:py-2 text-base md:text-sm border rounded-md transition-colors focus:outline-none focus:ring-2 min-h-[44px] ${
      hasError
        ? 'border-volcano-500 focus:ring-volcano-500 focus:border-volcano-500'
        : 'border-sage-300 focus:ring-jungle-500 focus:border-jungle-500'
    } ${field.disabled ? 'bg-sage-100 cursor-not-allowed' : 'bg-white'}`;

    const labelClasses = `block text-sm font-medium text-sage-700 mb-1 ${
      field.required ? "after:content-['*'] after:ml-1 after:text-volcano-500" : ''
    }`;

    switch (field.type) {
      case 'text':
      case 'email':
      case 'number':
        return (
          <div key={field.name} className="mb-4">
            <label htmlFor={field.name} className={labelClasses}>
              {field.label}
            </label>
            <input
              id={field.name}
              name={field.name}
              type={field.type}
              value={value}
              onChange={(e) => handleChange(field.name, field.type === 'number' ? Number(e.target.value) : e.target.value)}
              onBlur={() => handleBlur(field.name)}
              placeholder={field.placeholder}
              disabled={field.disabled}
              required={field.required}
              className={baseInputClasses}
              aria-invalid={hasError}
              aria-describedby={hasError ? `${field.name}-error` : field.helpText ? `${field.name}-help` : undefined}
            />
            {field.helpText && !hasError && (
              <p id={`${field.name}-help`} className="mt-1 text-sm text-sage-500">
                {field.helpText}
              </p>
            )}
            {hasError && (
              <p id={`${field.name}-error`} className="mt-1 text-sm text-volcano-600" role="alert">
                {error}
              </p>
            )}
          </div>
        );

      case 'select':
        return (
          <div key={field.name} className="mb-4">
            <label htmlFor={field.name} className={labelClasses}>
              {field.label}
            </label>
            <select
              id={field.name}
              name={field.name}
              value={value}
              onChange={(e) => handleChange(field.name, e.target.value)}
              onBlur={() => handleBlur(field.name)}
              disabled={field.disabled}
              required={field.required}
              className={baseInputClasses}
              aria-invalid={hasError}
              aria-describedby={hasError ? `${field.name}-error` : field.helpText ? `${field.name}-help` : undefined}
            >
              <option value="">Select {field.label}</option>
              {field.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {field.helpText && !hasError && (
              <p id={`${field.name}-help`} className="mt-1 text-sm text-sage-500">
                {field.helpText}
              </p>
            )}
            {hasError && (
              <p id={`${field.name}-error`} className="mt-1 text-sm text-volcano-600" role="alert">
                {error}
              </p>
            )}
          </div>
        );

      case 'textarea':
        return (
          <div key={field.name} className="mb-4">
            <label htmlFor={field.name} className={labelClasses}>
              {field.label}
            </label>
            <textarea
              id={field.name}
              name={field.name}
              value={value}
              onChange={(e) => handleChange(field.name, e.target.value)}
              onBlur={() => handleBlur(field.name)}
              placeholder={field.placeholder}
              disabled={field.disabled}
              required={field.required}
              rows={field.rows || 4}
              className={baseInputClasses}
              aria-invalid={hasError}
              aria-describedby={hasError ? `${field.name}-error` : field.helpText ? `${field.name}-help` : undefined}
            />
            {field.helpText && !hasError && (
              <p id={`${field.name}-help`} className="mt-1 text-sm text-sage-500">
                {field.helpText}
              </p>
            )}
            {hasError && (
              <p id={`${field.name}-error`} className="mt-1 text-sm text-volcano-600" role="alert">
                {error}
              </p>
            )}
          </div>
        );

      case 'date':
      case 'datetime-local':
        return (
          <div key={field.name} className="mb-4">
            <label htmlFor={field.name} className={labelClasses}>
              {field.label}
            </label>
            <input
              id={field.name}
              name={field.name}
              type={field.type === 'datetime-local' ? 'datetime-local' : 'date'}
              value={value}
              onChange={(e) => handleChange(field.name, e.target.value)}
              onBlur={() => handleBlur(field.name)}
              disabled={field.disabled}
              required={field.required}
              className={baseInputClasses}
              aria-invalid={hasError}
              aria-describedby={hasError ? `${field.name}-error` : field.helpText ? `${field.name}-help` : undefined}
            />
            {field.helpText && !hasError && (
              <p id={`${field.name}-help`} className="mt-1 text-sm text-sage-500">
                {field.helpText}
              </p>
            )}
            {hasError && (
              <p id={`${field.name}-error`} className="mt-1 text-sm text-volcano-600" role="alert">
                {error}
              </p>
            )}
          </div>
        );

      case 'checkbox':
        return (
          <div key={field.name} className="mb-4">
            <div className="flex items-center min-h-[44px]">
              <input
                id={field.name}
                name={field.name}
                type="checkbox"
                checked={!!value}
                onChange={(e) => handleChange(field.name, e.target.checked)}
                onBlur={() => handleBlur(field.name)}
                disabled={field.disabled}
                className="h-5 w-5 md:h-4 md:w-4 text-jungle-500 focus:ring-jungle-500 border-sage-300 rounded"
                aria-invalid={hasError}
                aria-describedby={hasError ? `${field.name}-error` : field.helpText ? `${field.name}-help` : undefined}
              />
              <label htmlFor={field.name} className="ml-3 md:ml-2 block text-base md:text-sm text-sage-700">
                {field.label}
                {field.required && <span className="ml-1 text-volcano-500">*</span>}
              </label>
            </div>
            {field.helpText && !hasError && (
              <p id={`${field.name}-help`} className="mt-1 text-sm text-sage-500 ml-8 md:ml-6">
                {field.helpText}
              </p>
            )}
            {hasError && (
              <p id={`${field.name}-error`} className="mt-1 text-sm text-volcano-600 ml-8 md:ml-6" role="alert">
                {error}
              </p>
            )}
          </div>
        );

      case 'richtext':
        return (
          <div key={field.name} className="mb-4">
            <label htmlFor={field.name} className={labelClasses}>
              {field.label}
            </label>
            <textarea
              id={field.name}
              name={field.name}
              value={value}
              onChange={(e) => handleChange(field.name, e.target.value)}
              onBlur={() => handleBlur(field.name)}
              placeholder={field.placeholder}
              disabled={field.disabled}
              required={field.required}
              rows={field.rows || 8}
              className={baseInputClasses}
              aria-invalid={hasError}
              aria-describedby={hasError ? `${field.name}-error` : field.helpText ? `${field.name}-help` : undefined}
            />
            {field.helpText && !hasError && (
              <p id={`${field.name}-help`} className="mt-1 text-sm text-sage-500">
                {field.helpText}
              </p>
            )}
            {hasError && (
              <p id={`${field.name}-error`} className="mt-1 text-sm text-volcano-600" role="alert">
                {error}
              </p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      {fields.map(renderField)}
      
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-end gap-3 mt-6">
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={formState.submitting}
            className="w-full md:w-auto order-2 md:order-1"
            data-testid="form-cancel-button"
          >
            {cancelLabel}
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          loading={formState.submitting}
          disabled={formState.submitting}
          className="w-full md:w-auto order-1 md:order-2"
          data-testid="form-submit-button"
        >
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
