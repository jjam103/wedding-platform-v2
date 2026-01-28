'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { generateSlug, getSlugPreview, isValidSlug } from '@/utils/slugs';
import type { ContentPage } from '@/schemas/cmsSchemas';

interface ContentPageFormData {
  title: string;
  slug: string;
  status: 'draft' | 'published';
}

interface ContentPageFormProps {
  title: string;
  onSubmit: (data: ContentPageFormData) => Promise<void>;
  onCancel?: () => void;
  initialData?: ContentPage;
  isOpen: boolean;
  onToggle: () => void;
  submitLabel?: string;
  cancelLabel?: string;
}

/**
 * ContentPageForm Component
 * 
 * Specialized form for content pages with:
 * - Auto-slug generation from title
 * - Manual slug override capability
 * - URL path preview
 * - Validation feedback
 */
export function ContentPageForm({
  title,
  onSubmit,
  onCancel,
  initialData,
  isOpen,
  onToggle,
  submitLabel = 'Create',
  cancelLabel = 'Cancel',
}: ContentPageFormProps) {
  const [formTitle, setFormTitle] = useState(initialData?.title || '');
  const [formSlug, setFormSlug] = useState(initialData?.slug || '');
  const [formStatus, setFormStatus] = useState<'draft' | 'published'>(initialData?.status || 'draft');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Reset form when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormTitle(initialData.title);
      setFormSlug(initialData.slug);
      setFormStatus(initialData.status);
      setSlugManuallyEdited(true); // Preserve existing slug when editing
      setIsDirty(false);
    } else if (!isOpen) {
      // Reset form when closing
      setFormTitle('');
      setFormSlug('');
      setFormStatus('draft');
      setSlugManuallyEdited(false);
      setIsDirty(false);
      setErrors({});
    }
  }, [initialData, isOpen]);

  // Auto-generate slug from title
  useEffect(() => {
    if (!slugManuallyEdited && formTitle) {
      setFormSlug(generateSlug(formTitle));
    }
  }, [formTitle, slugManuallyEdited]);

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

  // Recalculate height when form content changes
  useEffect(() => {
    if (isOpen && contentRef.current) {
      const recalculate = () => {
        if (contentRef.current) {
          contentRef.current.style.maxHeight = `${contentRef.current.scrollHeight}px`;
        }
      };
      
      recalculate();
      const timer = setTimeout(recalculate, 50);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, formTitle, formSlug, formStatus, errors]);

  const handleTitleChange = useCallback((value: string) => {
    setFormTitle(value);
    setIsDirty(true);
    if (errors.title) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.title;
        return next;
      });
    }
  }, [errors.title]);

  const handleSlugChange = useCallback((value: string) => {
    setFormSlug(value);
    setSlugManuallyEdited(true);
    setIsDirty(true);
    if (errors.slug) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.slug;
        return next;
      });
    }
  }, [errors.slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate
    const validationErrors: Record<string, string> = {};
    
    if (!formTitle.trim()) {
      validationErrors.title = 'Title is required';
    }
    
    if (!formSlug.trim()) {
      validationErrors.slug = 'Slug is required';
    } else if (!isValidSlug(formSlug)) {
      validationErrors.slug = 'Slug must contain only lowercase letters, numbers, and hyphens';
    }
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        title: formTitle,
        slug: formSlug,
        status: formStatus,
      });
      // Form will be reset by useEffect when isOpen changes
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

    onToggle();
    if (onCancel) onCancel();
  };

  const slugPreview = formSlug ? getSlugPreview(formSlug, 'pages') : '';

  return (
    <div ref={formRef} className="border border-sage-200 rounded-lg overflow-hidden bg-white shadow-sm">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-sage-50 hover:bg-sage-100 transition-colors"
        aria-expanded={isOpen}
        aria-controls="content-page-form-content"
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
        id="content-page-form-content"
        className={`transition-all duration-300 ease-in-out ${isOpen ? '' : 'overflow-hidden'}`}
        style={{
          maxHeight: isOpen ? 'none' : '0px',
          opacity: isOpen ? 1 : 0,
        }}
        aria-hidden={!isOpen}
      >
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Form-level error */}
          {errors._form && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg" role="alert">
              <p className="text-sm text-red-700">{errors._form}</p>
            </div>
          )}

          {/* Fields in Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title Field */}
            <div className="space-y-1">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Title
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                id="title"
                type="text"
                value={formTitle}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Our Story"
                required
                className={`w-full px-3 py-2 border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  errors.title ? 'border-red-500' : 'border-gray-300'
                }`}
                aria-invalid={!!errors.title}
                aria-describedby={errors.title ? 'title-error' : undefined}
              />
              {errors.title && (
                <p id="title-error" className="text-sm text-red-600" role="alert">
                  {errors.title}
                </p>
              )}
            </div>

            {/* Status Field */}
            <div className="space-y-1">
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Status
                <span className="text-red-500 ml-1">*</span>
              </label>
              <select
                id="status"
                value={formStatus}
                onChange={(e) => {
                  setFormStatus(e.target.value as 'draft' | 'published');
                  setIsDirty(true);
                }}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>

            {/* Slug Field - Full Width */}
            <div className="md:col-span-2 space-y-1">
              <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
                Slug
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                id="slug"
                type="text"
                value={formSlug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="our-story"
                required
                className={`w-full px-3 py-2 border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  errors.slug ? 'border-red-500' : 'border-gray-300'
                }`}
                aria-invalid={!!errors.slug}
                aria-describedby={errors.slug ? 'slug-error slug-help' : 'slug-help'}
              />
              <p id="slug-help" className="text-xs text-gray-600">
                URL-safe identifier (lowercase, hyphens only). Auto-generated from title.
              </p>
              {slugPreview && (
                <div className="mt-1 p-2 bg-gray-50 border border-gray-200 rounded">
                  <p className="text-xs text-gray-600 mb-1">URL Preview:</p>
                  <code className="text-sm text-green-700 font-mono">{slugPreview}</code>
                </div>
              )}
              {errors.slug && (
                <p id="slug-error" className="text-sm text-red-600" role="alert">
                  {errors.slug}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isSubmitting ? 'Submitting...' : submitLabel}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {cancelLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
