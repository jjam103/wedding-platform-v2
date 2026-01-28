'use client';

import { useState } from 'react';

/**
 * Ultra-Simple Button Test
 * No imports, no dependencies, just raw React
 */
export default function SimpleTestPage() {
  const [count, setCount] = useState(0);
  const [message, setMessage] = useState('');

  return (
    <div style={{ padding: '40px', fontFamily: 'system-ui' }}>
      <h1>Ultra-Simple Button Test</h1>
      
      <div style={{ marginTop: '20px', padding: '20px', background: '#f0f0f0', borderRadius: '8px' }}>
        <p><strong>Click Count:</strong> {count}</p>
        <p><strong>Message:</strong> {message}</p>
      </div>

      <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
        <button
          onClick={() => {
            setCount(count + 1);
            setMessage('Button 1 clicked!');
            console.log('Button 1 clicked');
          }}
          style={{
            padding: '12px 24px',
            background: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Test Button 1
        </button>

        <button
          onClick={() => {
            setCount(count + 1);
            setMessage('Button 2 clicked!');
            console.log('Button 2 clicked');
          }}
          style={{
            padding: '12px 24px',
            background: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Test Button 2
        </button>
      </div>

      <div style={{ marginTop: '40px', padding: '20px', background: '#fff3cd', borderRadius: '8px' }}>
        <h2>Instructions:</h2>
        <ol>
          <li>Click the buttons above</li>
          <li>Watch the click count increase</li>
          <li>Check browser console (F12) for log messages</li>
          <li>Check Network tab - should see NO requests</li>
        </ol>
        <p style={{ marginTop: '20px' }}>
          <strong>If this works:</strong> The issue is with the Button component or admin page setup<br/>
          <strong>If this doesn't work:</strong> There's a deeper Next.js or React issue
        </p>
      </div>
    </div>
  );
}
