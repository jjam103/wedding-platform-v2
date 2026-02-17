'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { z } from 'zod';
import type { FormField } from '@/components/ui/DynamicForm';

interface CollapsibleFormProps<T extends z.ZodTypeAny> {
  title: string;
  fields: FormField[];
  schema: T;
  onSubmit: (data: z.infer<T>) => Promise<void>;
  onCancel?: () => void;
  initialData?: Partial<z.infer<T>>;
  isOpen: boolean;
  onToggle: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  children?: React.ReactNode;
}

/**
 * CollapsibleForm Component
 * 
 * Inline collapsible form with:
 * - Smooth expand/collapse animation
 * - Form validation with Zod
 * - Unsaved changes warning
 * - Auto-scroll to form on expand
 * - Field-level error display
 */
export function CollapsibleForm<T extends z.ZodTypeAny>({
  title,
  fields,
  schema,
  onSubmit,
  onCancel,
  initialData,
  isOpen,
  onToggle,
  submitLabel = 'Create',
  cancelLabel = 'Cancel',
  children,
}: CollapsibleFormProps<T>) {
  // Initialize formData with initialData immediately (no delay)
  const [formData, setFormData] = useState<Record<string, any>>(() => initialData || {});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Generate unique ID for this form instance
  const formId = useRef(`collapsible-form-${Math.random().toString(36).substr(2, 9)}`).current;

  // Update form when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setFormData(initialData);
      setIsDirty(false);
    }
  }, [initialData]);

  // Auto-scroll to form when expanded and force height recalculation
  useEffect(() => {
    if (isOpen && formRef.current && contentRef.current) {
      // Force height recalculation after content renders
      setTimeout(() => {
        if (contentRef.current) {
          contentRef.current.style.maxHeight = `${contentRef.current.scrollHeight}px`;
        }
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
  }, [isOpen]);

  // Recalculate height when form data or errors change
  useEffect(() => {
    if (isOpen && contentRef.current) {
      // Recalculate height to accommodate dynamic content
      const recalculate = () => {
        if (contentRef.current) {
          contentRef.current.style.maxHeight = `${contentRef.current.scrollHeight}px`;
        }
      };
      
      // Recalculate immediately and after a short delay
      recalculate();
      const timer = setTimeout(recalculate, 50);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, formData, errors, fields]);

  const handleFieldChange = useCallback((name: string, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setIsDirty(true);
    // Clear field error when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  }, [errors]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convert datetime-local values to ISO 8601 format before validation
    const processedData = { ...formData };
    fields.forEach(field => {
      if (field.type === 'datetime-local' && processedData[field.name]) {
        // Convert datetime-local format (YYYY-MM-DDTHH:mm) to ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ)
        const dateValue = processedData[field.name];
        if (typeof dateValue === 'string' && dateValue.length > 0) {
          try {
            processedData[field.name] = new Date(dateValue).toISOString();
          } catch (error) {
            console.error(`Failed to convert datetime field ${field.name}:`, error);
          }
        }
      }
    });
    
    // Validate with Zod
    const validation = schema.safeParse(processedData);
    
    if (!validation.success) {
      // Extract field-level errors
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        if (field) {
          fieldErrors[field] = issue.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(validation.data);
      // Clear form on success
      setFormData({});
      setErrors({});
      setIsDirty(false);
      // CRITICAL FIX: Don't wait for parent - form should close immediately
      // Parent's onSubmit callback should handle closing via onToggle or onCancel
    } catch (error) {
      console.error('Form submission error:', error);
      setErrors({ _form: error instanceof Error ? error.message : 'Submission failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (isDirty) {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to cancel?'
      );
      if (!confirmed) return;
    }

    setFormData(initialData || {});
    setErrors({});
    setIsDirty(false);
    onToggle();
    if (onCancel) onCancel();
  };

  const renderField = (field: FormField) => {
    const value = formData[field.name] || '';
    const error = errors[field.name];
    const fieldId = `field-${field.name}`;

    const baseInputClasses = `w-full px-3 py-2 border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 ${
      error ? 'border-red-500' : 'border-gray-300'
    }`;

    return (
      <div key={field.name} className="space-y-1">
        <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        
        {field.type === 'textarea' ? (
          <textarea
            id={fieldId}
            name={field.name}
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            aria-required={field.required ? 'true' : undefined}
            rows={field.rows || 4}
            className={baseInputClasses}
            aria-invalid={!!error}
            aria-describedby={error ? `${fieldId}-error` : undefined}
          />
        ) : field.type === 'select' ? (
          <select
            id={fieldId}
            name={field.name}
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            required={field.required}
            aria-required={field.required ? 'true' : undefined}
            className={baseInputClasses}
            aria-invalid={!!error}
            aria-describedby={error ? `${fieldId}-error` : undefined}
          >
            <option value="">Select {field.label}</option>
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            id={fieldId}
            type={field.type}
            name={field.name}
            value={value}
            onChange={(e) => {
              // Convert number inputs to actual numbers
              const newValue = field.type === 'number' 
                ? (e.target.value === '' ? '' : Number(e.target.value))
                : e.target.value;
              handleFieldChange(field.name, newValue);
            }}
            placeholder={field.placeholder}
            required={field.required}
            aria-required={field.required ? 'true' : undefined}
            className={baseInputClasses}
            aria-invalid={!!error}
            aria-describedby={error ? `${fieldId}-error` : undefined}
          />
        )}
        
        {error && (
          <p id={`${fieldId}-error`} className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  };

  return (
    <div 
      ref={formRef} 
      className="border border-sage-200 rounded-lg bg-white shadow-sm" 
      style={{
        overflow: isOpen ? 'visible' : 'hidden',
        position: 'relative',
      }}
      data-submitting={isSubmitting ? 'true' : 'false'}
    >
      {/* Header */}
      <button
        onClick={onToggle}
        disabled={isSubmitting}
        className="w-full flex items-center justify-between px-4 py-3 bg-sage-50 hover:bg-sage-100 transition-colors min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          pointerEvents: isSubmitting ? 'none' : 'auto'
        }}
        aria-expanded={isOpen}
        aria-controls={formId}
        data-testid="collapsible-form-toggle"
      >
        <span className="font-medium text-sage-900">{title}</span>
        <span 
          className={`text-sage-600 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden="true"
        >
          ▼
        </span>
      </button>

      {/* Collapsible Content */}
      <div
        ref={contentRef}
        id={formId}
        className={`transition-all ${isSubmitting ? '' : 'duration-300'} ease-in-out ${isOpen ? '' : 'overflow-hidden'}`}
        style={{
          maxHeight: isOpen ? 'none' : '0px',
          opacity: isOpen ? 1 : 0,
          // CRITICAL FIX: Don't disable pointer events when open - this was blocking form submission!
          pointerEvents: isOpen ? 'auto' : 'none',
          position: 'relative',
          zIndex: isOpen ? 10 : 0,
        }}
        aria-hidden={!isOpen}
        data-testid="collapsible-form-content"
        data-state={isOpen ? 'open' : 'closed'}
      >
        <form onSubmit={handleSubmit} noValidate className="p-4 space-y-4" style={{
          position: 'relative',
          zIndex: 1000, // Very high z-index to ensure form is always on top
          // CRITICAL FIX: Removed pointerEvents override - let parent control this
        }}>
          {/* Form-level error */}
          {errors._form && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg" role="alert">
              <p className="text-sm text-red-700">{errors._form}</p>
            </div>
          )}

          {/* Fields in Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {fields.map((field) => {
              // Textarea fields should span full width
              if (field.type === 'textarea') {
                return (
                  <div key={field.name} className="md:col-span-2 lg:col-span-3">
                    {renderField(field)}
                  </div>
                );
              }
              // Regular fields use default grid sizing
              return renderField(field);
            })}
          </div>

          {/* Custom children fields */}
          {children}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              style={{ backgroundColor: '#22c55e', color: '#ffffff' }}
              className="px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium min-h-[44px]"
              data-testid="form-submit-button"
            >
              {isSubmitting ? 'Submitting...' : submitLabel}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
              style={{ backgroundColor: '#e5e7eb', color: '#111827' }}
              className="px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium min-h-[44px]"
              data-testid="form-cancel-button"
            >
              {cancelLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
