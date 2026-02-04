/**
 * Example: Selective Test Running with Tags
 * 
 * This file demonstrates how to use the test tagging system
 * for selective test execution.
 * 
 * Run examples:
 * - npm run test:fast          # Run only fast tests
 * - npm run test:critical      # Run only critical tests
 * - npm run test:unit          # Run only unit tests
 * - npm test -- --testNamePattern='@tag:auth'  # Run auth tests
 */

import {
  describeWithTags,
  itWithTags,
  describeFast,
  describeSlow,
  describeCritical,
  describeUnit,
  describeIntegration,
} from '../helpers/testTags';

// Example 1: Basic tagging
describeWithTags('Email Validation', ['unit', 'fast'], () => {
  itWithTags('should validate correct email', ['fast'], () => {
    const email = 'test@example.com';
    const isValid = email.includes('@') && email.includes('.');
    expect(isValid).toBe(true);
  });
  
  itWithTags('should reject invalid email', ['fast'], () => {
    const email = 'invalid-email';
    const isValid = email.includes('@') && email.includes('.');
    expect(isValid).toBe(false);
  });
});

// Example 2: Using helper functions
describeFast('String Utilities', () => {
  it('should capitalize string', () => {
    const result = 'hello'.charAt(0).toUpperCase() + 'hello'.slice(1);
    expect(result).toBe('Hello');
  });
  
  it('should trim whitespace', () => {
    const result = '  hello  '.trim();
    expect(result).toBe('hello');
  });
});

// Example 3: Critical tests
describeCritical('Authentication Logic', () => {
  it('should hash password', () => {
    // Simplified example
    const password = 'secret123';
    const hashed = Buffer.from(password).toString('base64');
    expect(hashed).not.toBe(password);
  });
  
  it('should validate password strength', () => {
    const password = 'Str0ng!Pass';
    const isStrong = password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password);
    expect(isStrong).toBe(true);
  });
});

// Example 4: Multiple tags
describeWithTags('Database Queries', ['integration', 'slow', 'requires-db'], () => {
  itWithTags('should query users table', ['database'], async () => {
    // Mock database query
    const users = await Promise.resolve([
      { id: 1, name: 'John' },
      { id: 2, name: 'Jane' },
    ]);
    
    expect(users).toHaveLength(2);
  });
  
  itWithTags('should handle query errors', ['database', 'error-handling'], async () => {
    // Mock database error
    try {
      await Promise.reject(new Error('Connection failed'));
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
    }
  });
});

// Example 5: Feature-specific tags
describeWithTags('RSVP Service', ['unit', 'fast', 'rsvp'], () => {
  itWithTags('should calculate attendance', ['fast'], () => {
    const rsvps = [
      { status: 'attending' },
      { status: 'attending' },
      { status: 'declined' },
    ];
    
    const attending = rsvps.filter(r => r.status === 'attending').length;
    expect(attending).toBe(2);
  });
  
  itWithTags('should validate RSVP deadline', ['fast'], () => {
    const deadline = new Date('2024-12-31');
    const now = new Date('2024-12-01');
    const isBeforeDeadline = now < deadline;
    
    expect(isBeforeDeadline).toBe(true);
  });
});

// Example 6: Slow integration test
describeSlow('External API Integration', () => {
  it('should fetch data from external API', async () => {
    // Mock slow API call
    await new Promise(resolve => setTimeout(resolve, 100));
    const data = { status: 'success' };
    
    expect(data.status).toBe('success');
  });
});

// Example 7: Unit test with multiple feature tags
describeUnit('Budget Calculations', () => {
  itWithTags('should calculate total budget', ['budget', 'fast'], () => {
    const items = [
      { cost: 100 },
      { cost: 200 },
      { cost: 300 },
    ];
    
    const total = items.reduce((sum, item) => sum + item.cost, 0);
    expect(total).toBe(600);
  });
  
  itWithTags('should calculate per-guest cost', ['budget', 'fast'], () => {
    const totalCost = 1000;
    const guestCount = 50;
    const perGuestCost = totalCost / guestCount;
    
    expect(perGuestCost).toBe(20);
  });
});

// Example 8: Integration test with auth
describeIntegration('API Authentication', () => {
  itWithTags('should require auth token', ['auth', 'api'], async () => {
    // Mock API request without auth
    const response = { status: 401, error: 'Unauthorized' };
    
    expect(response.status).toBe(401);
    expect(response.error).toBe('Unauthorized');
  });
  
  itWithTags('should accept valid auth token', ['auth', 'api'], async () => {
    // Mock API request with auth
    const response = { status: 200, data: { user: 'test' } };
    
    expect(response.status).toBe(200);
    expect(response.data).toBeDefined();
  });
});
