'use client';

import { useState } from 'react';
import { z } from 'zod';
import { FormModal, FormModalSimple, type FormField } from '@/components/ui';
import { Button } from '@/components/ui/Button';

const guestSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  email: z.string().email('Invalid email address').nullable().optional(),
  ageType: z.enum(['adult', 'child', 'senior']),
  guestType: z.enum(['wedding_party', 'wedding_guest', 'prewedding_only', 'postwedding_only']),
  notes: z.string().optional(),
  plusOneAllowed: z.boolean().optional(),
});

const guestFields: FormField[] = [
  { name: 'firstName', label: 'First Name', type: 'text', required: true },
  { name: 'lastName', label: 'Last Name', type: 'text', required: true },
  { name: 'email', label: 'Email', type: 'email', required: false, helpText: 'Optional email address' },
  {
    name: 'ageType',
    label: 'Age Type',
    type: 'select',
    required: true,
    options: [
      { label: 'Adult', value: 'adult' },
      { label: 'Child', value: 'child' },
      { label: 'Senior', value: 'senior' },
    ],
  },
  {
    name: 'guestType',
    label: 'Guest Type',
    type: 'select',
    required: true,
    options: [
      { label: 'Wedding Party', value: 'wedding_party' },
      { label: 'Wedding Guest', value: 'wedding_guest' },
      { label: 'Pre-wedding Only', value: 'prewedding_only' },
      { label: 'Post-wedding Only', value: 'postwedding_only' },
    ],
  },
  { name: 'notes', label: 'Notes', type: 'textarea', required: false, rows: 3 },
  { name: 'plusOneAllowed', label: 'Plus One Allowed', type: 'checkbox', required: false },
];

/**
 * FormModal Demo Page
 * 
 * Demonstrates the FormModal component with various field types and validation.
 */
export default function FormModalDemoPage() {
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isSimpleModalOpen, setIsSimpleModalOpen] = useState(false);
  const [submittedData, setSubmittedData] = useState<any>(null);

  const handleSubmit = async (data: any) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log('Form submitted:', data);
    setSubmittedData(data);
  };

  return (
    <div className="min-h-screen bg-sage-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-sage-900 mb-8">FormModal Component Demo</h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-sage-900 mb-4">Dynamic Form Modal</h2>
          <p className="text-sage-600 mb-4">
            Click the button below to open a modal with a dynamic form. The form includes various field types
            (text, email, select, textarea, checkbox) and validates input using Zod schemas.
          </p>
          <Button onClick={() => setIsFormModalOpen(true)}>Open Form Modal</Button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-sage-900 mb-4">Simple Modal</h2>
          <p className="text-sage-600 mb-4">
            Click the button below to open a simple modal with custom content.
          </p>
          <Button onClick={() => setIsSimpleModalOpen(true)} variant="secondary">
            Open Simple Modal
          </Button>
        </div>

        {submittedData && (
          <div className="bg-jungle-50 border border-jungle-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-jungle-900 mb-4">Last Submitted Data</h2>
            <pre className="bg-white p-4 rounded border border-jungle-200 overflow-auto">
              {JSON.stringify(submittedData, null, 2)}
            </pre>
          </div>
        )}

        <FormModal
          isOpen={isFormModalOpen}
          onClose={() => setIsFormModalOpen(false)}
          title="Add Guest"
          onSubmit={handleSubmit}
          schema={guestSchema}
          fields={guestFields}
          submitLabel="Create Guest"
        />

        <FormModalSimple
          isOpen={isSimpleModalOpen}
          onClose={() => setIsSimpleModalOpen(false)}
          title="Simple Modal Example"
          footer={
            <>
              <Button variant="ghost" onClick={() => setIsSimpleModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsSimpleModalOpen(false)}>Confirm</Button>
            </>
          }
        >
          <div className="space-y-4">
            <p className="text-sage-700">
              This is a simple modal with custom content. You can put anything you want in here.
            </p>
            <p className="text-sage-700">
              The modal supports:
            </p>
            <ul className="list-disc list-inside text-sage-700 space-y-2">
              <li>Escape key to close</li>
              <li>Click outside to close</li>
              <li>Body scroll prevention when open</li>
              <li>Custom footer with action buttons</li>
              <li>Responsive sizing (sm, md, lg, xl)</li>
            </ul>
          </div>
        </FormModalSimple>
      </div>
    </div>
  );
}
