'use client';

import { Button } from '@/components/ui/Button';

export default function DebugClickPage() {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    console.log('=== BUTTON CLICK DEBUG ===');
    console.log('Event:', e);
    console.log('Target:', e.target);
    console.log('CurrentTarget:', e.currentTarget);
    console.log('Type:', e.type);
    console.log('Button:', e.button);
    console.log('DefaultPrevented:', e.defaultPrevented);
    console.log('IsPropagationStopped:', e.isPropagationStopped());
    console.log('========================');
    
    alert('Button clicked! Check console for details.');
  };

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-3xl font-bold">Debug Click Test</h1>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Test 1: Button Component</h2>
        <Button
          variant="primary"
          onClick={handleClick}
          data-action="add-new"
        >
          Click Me (Button Component)
        </Button>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Test 2: Raw HTML Button</h2>
        <button
          onClick={handleClick}
          className="px-4 py-2 bg-blue-500 text-white rounded"
          data-action="add-new"
        >
          Click Me (Raw Button)
        </button>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Test 3: Button Without data-action</h2>
        <Button
          variant="primary"
          onClick={handleClick}
        >
          Click Me (No data-action)
        </Button>
      </div>
    </div>
  );
}
