# Testing Guide - Subscription Audit Tool

## Overview

This project includes comprehensive testing with Jest for unit tests and Cypress for end-to-end testing.

## Running Tests

### Unit Tests (Jest)
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test SubscriptionCard.test.tsx
```

### E2E Tests (Cypress)
```bash
# Open Cypress Test Runner
npx cypress open

# Run Cypress tests headlessly
npx cypress run

# Run specific test file
npx cypress run --spec "cypress/e2e/subscription-flow.cy.ts"
```

## Test Structure

### Unit Tests (`__tests__/`)
- **Components**: Test React component rendering, user interactions, and props
- **Libraries**: Test utility functions, API calls, and business logic
- **Hooks**: Test custom React hooks and state management

### E2E Tests (`cypress/e2e/`)
- **User Flows**: Complete user journeys from start to finish
- **Integration**: Test how different parts of the app work together
- **Cross-browser**: Ensure compatibility across different browsers

## Test Scenarios Covered

### ✅ Core Functionality
- **Subscription CRUD**: Create, read, update, delete subscriptions
- **Authentication**: Sign up, sign in, sign out flows
- **Notifications**: Renewal reminders and user responses
- **Search & Filter**: Finding subscriptions by various criteria
- **Export**: CSV and report generation

### ✅ Advanced Features
- **Bank Integration**: Plaid connection and transaction analysis
- **Smart Insights**: ML-based recommendations
- **Family Sharing**: Multi-user subscription management
- **Real-time Updates**: Live data synchronization
- **Offline Support**: Functionality without internet connection

### ✅ Edge Cases
- **Error Handling**: Network failures, invalid data, auth errors
- **Validation**: Form validation and data integrity
- **Performance**: Large datasets and slow connections
- **Accessibility**: Screen reader compatibility and keyboard navigation

## Writing New Tests

### Unit Test Example
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import MyComponent from '../MyComponent';

describe('MyComponent', () => {
  test('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  test('handles user interaction', () => {
    const mockCallback = jest.fn();
    render(<MyComponent onAction={mockCallback} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(mockCallback).toHaveBeenCalled();
  });
});
```

### E2E Test Example
```typescript
describe('Feature Flow', () => {
  it('should complete the user journey', () => {
    cy.visit('/');
    cy.contains('Start Here').click();
    cy.get('input[name="field"]').type('value');
    cy.contains('Submit').click();
    cy.contains('Success Message').should('be.visible');
  });
});
```

## Mocking Guidelines

### API Mocking
```typescript
// Mock Supabase client
jest.mock('../lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => Promise.resolve({ data: [], error: null }))
    }))
  }
}));
```

### Component Mocking
```typescript
// Mock complex child components
jest.mock('../components/ComplexComponent', () => {
  return function MockComplexComponent() {
    return <div data-testid="mock-complex-component">Mocked</div>;
  };
});
```

## Test Data

### Sample Subscription
```typescript
const mockSubscription = {
  id: '1',
  user_id: 'user1',
  name: 'Netflix',
  cost: 15.99,
  billing_cycle: 'monthly',
  next_renewal_date: '2024-03-15',
  category: 'Entertainment',
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
};
```

### Test User
```typescript
const mockUser = {
  id: 'test-user-123',
  email: 'test@example.com',
  created_at: '2024-01-01T00:00:00Z'
};
```

## Coverage Goals

- **Statements**: 80%+
- **Branches**: 75%+
- **Functions**: 80%+
- **Lines**: 80%+

## Continuous Integration

Tests run automatically on:
- Pull requests
- Main branch pushes
- Nightly builds

## Debugging Tests

### Jest Debugging
```bash
# Run with verbose output
npm test -- --verbose

# Debug specific test
node --inspect-brk node_modules/.bin/jest --runInBand SubscriptionCard.test.tsx
```

### Cypress Debugging
```bash
# Open with browser dev tools
npx cypress open --browser chrome

# Run with debug output
DEBUG=cypress:* npx cypress run
```

## Best Practices

### ✅ Do
- Test user behavior, not implementation details
- Use descriptive test names
- Keep tests focused and isolated
- Mock external dependencies
- Test error conditions
- Use data-testid for reliable element selection

### ❌ Don't
- Test internal component state directly
- Write tests that depend on other tests
- Mock everything (test real integrations when possible)
- Ignore accessibility in tests
- Skip edge cases and error scenarios

## Performance Testing

### Load Testing
```bash
# Test with large datasets
npm run test:performance

# Memory leak detection
npm run test:memory
```

### Bundle Size Testing
```bash
# Analyze bundle size impact
npm run build:analyze
```

---

**Remember**: Good tests give you confidence to refactor and add features without breaking existing functionality!