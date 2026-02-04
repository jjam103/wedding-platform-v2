'use client';

import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardBody, CardFooter } from '@/components/ui/Card';

/**
 * Design System Demo Page
 * 
 * Demonstrates the base UI components for the admin interface.
 * This page can be removed after development is complete.
 */
export default function DesignSystemDemo() {
  return (
    <div className="min-h-screen bg-sage-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-sage-900 mb-2">Admin Design System</h1>
          <p className="text-lg text-sage-600">Base UI components with Costa Rica color palette</p>
        </div>

        {/* Button Variants */}
        <Card>
          <CardHeader>
            <h2 className="text-2xl font-semibold text-sage-900">Button Variants</h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-sage-700 mb-2">Primary</h3>
                <div className="flex gap-3">
                  <Button variant="primary" size="sm">Small</Button>
                  <Button variant="primary" size="md">Medium</Button>
                  <Button variant="primary" size="lg">Large</Button>
                  <Button variant="primary" disabled>Disabled</Button>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-sage-700 mb-2">Secondary</h3>
                <div className="flex gap-3">
                  <Button variant="secondary" size="sm">Small</Button>
                  <Button variant="secondary" size="md">Medium</Button>
                  <Button variant="secondary" size="lg">Large</Button>
                  <Button variant="secondary" disabled>Disabled</Button>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-sage-700 mb-2">Danger</h3>
                <div className="flex gap-3">
                  <Button variant="danger" size="sm">Small</Button>
                  <Button variant="danger" size="md">Medium</Button>
                  <Button variant="danger" size="lg">Large</Button>
                  <Button variant="danger" disabled>Disabled</Button>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-sage-700 mb-2">Ghost</h3>
                <div className="flex gap-3">
                  <Button variant="ghost" size="sm">Small</Button>
                  <Button variant="ghost" size="md">Medium</Button>
                  <Button variant="ghost" size="lg">Large</Button>
                  <Button variant="ghost" disabled>Disabled</Button>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Card Examples */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <h3 className="text-xl font-semibold text-sage-900">Simple Card</h3>
              <p className="text-sm text-sage-600 mt-1">With header and body</p>
            </CardHeader>
            <CardBody>
              <p className="text-sage-700">
                This is a simple card with a header and body section. Perfect for displaying content.
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-xl font-semibold text-sage-900">Card with Footer</h3>
            </CardHeader>
            <CardBody>
              <p className="text-sage-700">
                This card includes a footer section with action buttons.
              </p>
            </CardBody>
            <CardFooter>
              <div className="flex gap-2 justify-end">
                <Button variant="secondary" size="sm">Cancel</Button>
                <Button variant="primary" size="sm">Save</Button>
              </div>
            </CardFooter>
          </Card>
        </div>

        {/* Color Palette */}
        <Card>
          <CardHeader>
            <h2 className="text-2xl font-semibold text-sage-900">Costa Rica Color Palette</h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-sage-700 mb-2">Jungle (Green)</h3>
                <div className="flex gap-2">
                  <div className="w-16 h-16 bg-jungle-500 rounded-lg shadow-sm"></div>
                  <div className="w-16 h-16 bg-jungle-600 rounded-lg shadow-sm"></div>
                  <div className="w-16 h-16 bg-jungle-700 rounded-lg shadow-sm"></div>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-sage-700 mb-2">Sunset (Orange)</h3>
                <div className="flex gap-2">
                  <div className="w-16 h-16 bg-sunset-500 rounded-lg shadow-sm"></div>
                  <div className="w-16 h-16 bg-sunset-600 rounded-lg shadow-sm"></div>
                  <div className="w-16 h-16 bg-sunset-700 rounded-lg shadow-sm"></div>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-sage-700 mb-2">Ocean (Blue)</h3>
                <div className="flex gap-2">
                  <div className="w-16 h-16 bg-ocean-500 rounded-lg shadow-sm"></div>
                  <div className="w-16 h-16 bg-ocean-600 rounded-lg shadow-sm"></div>
                  <div className="w-16 h-16 bg-ocean-700 rounded-lg shadow-sm"></div>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-sage-700 mb-2">Volcano (Red)</h3>
                <div className="flex gap-2">
                  <div className="w-16 h-16 bg-volcano-500 rounded-lg shadow-sm"></div>
                  <div className="w-16 h-16 bg-volcano-600 rounded-lg shadow-sm"></div>
                  <div className="w-16 h-16 bg-volcano-700 rounded-lg shadow-sm"></div>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-sage-700 mb-2">Sage (Gray)</h3>
                <div className="flex gap-2">
                  <div className="w-16 h-16 bg-sage-500 rounded-lg shadow-sm"></div>
                  <div className="w-16 h-16 bg-sage-600 rounded-lg shadow-sm"></div>
                  <div className="w-16 h-16 bg-sage-700 rounded-lg shadow-sm"></div>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Typography */}
        <Card>
          <CardHeader>
            <h2 className="text-2xl font-semibold text-sage-900">Typography Scale</h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-2">
              <p className="text-4xl font-bold text-sage-900">Heading 1 (4xl)</p>
              <p className="text-3xl font-bold text-sage-900">Heading 2 (3xl)</p>
              <p className="text-2xl font-semibold text-sage-900">Heading 3 (2xl)</p>
              <p className="text-xl font-semibold text-sage-900">Heading 4 (xl)</p>
              <p className="text-lg font-medium text-sage-900">Heading 5 (lg)</p>
              <p className="text-base text-sage-700">Body text (base)</p>
              <p className="text-sm text-sage-600">Small text (sm)</p>
              <p className="text-xs text-sage-500">Extra small text (xs)</p>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
