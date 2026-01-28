'use client';

import { useState } from 'react';
import { CollapsibleForm } from '@/components/admin/CollapsibleForm';
import { z } from 'zod';

const testSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
});

export default function TestFormPage() {
  const [isOpen, setIsOpen] = useState(true); // Start open
  const [result, setResult] = useState<string>('');

  const handleSubmit = async (data: any) => {
    console.log('Form submitted:', data);
    setResult(JSON.stringify(data, null, 2));
    alert('Form submitted! Check console and result below.');
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Form Button Test Page</h1>
      
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded">
        <h2 className="font-semibold mb-2">Instructions:</h2>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>The form below should be open by default</li>
          <li>You should see two input fields (Name and Email)</li>
          <li>Below the fields, you should see two buttons: "Submit" (green) and "Cancel" (gray)</li>
          <li>If you don't see the buttons, scroll down in the form</li>
          <li>Try filling out the form and clicking Submit</li>
        </ol>
      </div>

      <CollapsibleForm
        title="Test Form"
        fields={[
          {
            name: 'name',
            label: 'Name',
            type: 'text',
            required: true,
            placeholder: 'Enter your name',
          },
          {
            name: 'email',
            label: 'Email',
            type: 'email',
            required: true,
            placeholder: 'Enter your email',
          },
        ]}
        schema={testSchema}
        onSubmit={handleSubmit}
        onCancel={() => {
          console.log('Cancel clicked');
          setIsOpen(false);
        }}
        initialData={{}}
        isOpen={isOpen}
        onToggle={() => setIsOpen(!isOpen)}
        submitLabel="Submit"
        cancelLabel="Cancel"
      />

      {result && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded">
          <h3 className="font-semibold mb-2">Submitted Data:</h3>
          <pre className="text-sm">{result}</pre>
        </div>
      )}

      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <h3 className="font-semibold mb-2">Debug Info:</h3>
        <p className="text-sm">Form is open: {isOpen ? 'Yes' : 'No'}</p>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Toggle Form
        </button>
      </div>

      <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded">
        <h3 className="font-semibold mb-2">Browser Console Check:</h3>
        <p className="text-sm mb-2">Open DevTools Console (F12) and run:</p>
        <code className="block bg-white p-2 rounded text-xs">
          document.querySelector('button[type="submit"]')
        </code>
        <p className="text-sm mt-2">This should return the submit button element if it exists.</p>
      </div>
    </div>
  );
}
