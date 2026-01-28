'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';

/**
 * Button Test Page
 * 
 * Simple test page to verify button onClick handlers work correctly.
 * This helps diagnose if the issue is with the buttons themselves
 * or with browser caching.
 */
export default function TestButtonsPage() {
  const [clickCount, setClickCount] = useState(0);
  const [lastClicked, setLastClicked] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleTestClick = (buttonName: string) => {
    setClickCount(prev => prev + 1);
    setLastClicked(buttonName);
    console.log(`Button clicked: ${buttonName}`);
  };

  const handleModalTest = () => {
    setIsModalOpen(true);
    console.log('Modal opened');
  };

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-sage-900 mb-2">Button Test Page</h1>
        <p className="text-sage-600">
          This page tests if button onClick handlers work correctly.
          If buttons work here but not on admin pages, it's a caching issue.
        </p>
      </div>

      {/* Test Results Display */}
      <div className="bg-sage-50 border border-sage-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-sage-900 mb-4">Test Results</h2>
        <div className="space-y-2">
          <p className="text-sage-700">
            <strong>Total Clicks:</strong> {clickCount}
          </p>
          <p className="text-sage-700">
            <strong>Last Clicked:</strong> {lastClicked || 'None'}
          </p>
          <p className="text-sage-700">
            <strong>Modal State:</strong> {isModalOpen ? 'Open' : 'Closed'}
          </p>
        </div>
      </div>

      {/* Test Buttons */}
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-sage-900 mb-4">Test 1: Basic Button Clicks</h2>
          <div className="flex flex-wrap gap-4">
            <Button
              variant="primary"
              onClick={() => handleTestClick('Primary Button')}
            >
              Click Me (Primary)
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleTestClick('Secondary Button')}
            >
              Click Me (Secondary)
            </Button>
            <Button
              variant="danger"
              onClick={() => handleTestClick('Danger Button')}
            >
              Click Me (Danger)
            </Button>
          </div>
          <p className="text-sm text-sage-600 mt-2">
            ✅ Expected: Click count increases, last clicked updates
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-sage-900 mb-4">Test 2: Modal State Toggle</h2>
          <div className="flex flex-wrap gap-4">
            <Button
              variant="primary"
              onClick={handleModalTest}
            >
              Open Modal (Test)
            </Button>
            <Button
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Close Modal (Test)
            </Button>
          </div>
          <p className="text-sm text-sage-600 mt-2">
            ✅ Expected: Modal state changes when buttons clicked
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-sage-900 mb-4">Test 3: Simulated Admin Buttons</h2>
          <div className="flex flex-wrap gap-4">
            <Button
              variant="primary"
              onClick={() => {
                handleTestClick('Create Event');
                setIsModalOpen(true);
              }}
              aria-label="Create new event"
              data-action="add-new"
            >
              + Create Event
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                handleTestClick('Add Guest');
                setIsModalOpen(true);
              }}
              aria-label="Add new guest"
              data-action="add-new"
            >
              + Add Guest
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                handleTestClick('Add Activity');
                setIsModalOpen(true);
              }}
              aria-label="Add new activity"
              data-action="add-new"
            >
              + Add Activity
            </Button>
          </div>
          <p className="text-sm text-sage-600 mt-2">
            ✅ Expected: Click count increases, modal opens, NO navigation
          </p>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-ocean-50 border border-ocean-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-ocean-900 mb-4">📋 How to Use This Test</h2>
        <ol className="list-decimal list-inside space-y-2 text-ocean-800">
          <li>Open browser DevTools (F12)</li>
          <li>Go to Console tab</li>
          <li>Go to Network tab</li>
          <li>Click each button above</li>
          <li>Check the results:</li>
        </ol>
        <div className="mt-4 space-y-2 ml-6">
          <p className="text-ocean-800">
            <strong>✅ If buttons work here:</strong> The Button component is fine.
            The issue is browser cache on admin pages.
          </p>
          <p className="text-ocean-800">
            <strong>❌ If buttons DON'T work here:</strong> There's a deeper issue.
            Check console for JavaScript errors.
          </p>
          <p className="text-ocean-800">
            <strong>🔍 What to look for:</strong>
          </p>
          <ul className="list-disc list-inside ml-4 text-ocean-700">
            <li>Console should show "Button clicked: [name]" messages</li>
            <li>Network tab should show NO requests to /new routes</li>
            <li>Click count should increase with each click</li>
            <li>Modal state should toggle</li>
          </ul>
        </div>
      </div>

      {/* Diagnostic Info */}
      <div className="bg-sage-50 border border-sage-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-sage-900 mb-4">🔧 Diagnostic Information</h2>
        <div className="space-y-2 text-sm font-mono text-sage-700">
          <p><strong>Page:</strong> /admin/test-buttons</p>
          <p><strong>Button Component:</strong> components/ui/Button.tsx</p>
          <p><strong>React Version:</strong> {typeof window !== 'undefined' ? 'Client-side' : 'Server-side'}</p>
          <p><strong>Timestamp:</strong> {new Date().toISOString()}</p>
        </div>
      </div>

      {/* Simple Modal Simulation */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-semibold text-sage-900 mb-4">
              Test Modal
            </h3>
            <p className="text-sage-700 mb-6">
              ✅ Modal opened successfully! This proves the button onClick handler works.
            </p>
            <Button
              variant="primary"
              onClick={() => setIsModalOpen(false)}
              fullWidth
            >
              Close Modal
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
