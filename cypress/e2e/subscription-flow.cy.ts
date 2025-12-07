/**
 * Cypress E2E Tests for Subscription Management Flow
 * 
 * Run with: npx cypress open
 */

describe('Subscription Management Flow', () => {
  beforeEach(() => {
    // Visit the app
    cy.visit('/');
    
    // Mock authentication - in real tests, you'd handle actual auth
    cy.window().then((win) => {
      win.localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-token',
        user: { id: 'test-user', email: 'test@example.com' }
      }));
    });
  });

  it('should complete the full subscription management flow', () => {
    // 1. User should see empty state initially
    cy.contains('Start tracking your subscriptions').should('be.visible');
    cy.contains('Add Your First Subscription').should('be.visible');

    // 2. Click to add first subscription
    cy.contains('Add Your First Subscription').click();

    // 3. Fill out subscription form
    cy.get('input[placeholder*="Netflix"]').type('Netflix');
    cy.get('input[type="number"]').type('15.99');
    cy.get('select').first().select('monthly');
    cy.get('input[type="date"]').first().type('2024-03-15');
    cy.get('select').last().select('Entertainment');

    // 4. Submit form
    cy.contains('Add Subscription').click();

    // 5. Verify subscription appears in dashboard
    cy.contains('Netflix').should('be.visible');
    cy.contains('$15.99/month').should('be.visible');
    cy.contains('Entertainment').should('be.visible');

    // 6. Verify stats are updated
    cy.contains('Monthly Spending').should('be.visible');
    cy.contains('$15.99').should('be.visible');

    // 7. Rate the subscription
    cy.get('[title="Rate subscription"]').click();
    cy.get('[data-testid="star-4"]').click();
    cy.get('input[type="date"]').type('2024-02-15');
    cy.contains('Save Rating').click();

    // 8. Verify rating appears
    cy.get('[data-testid="star-filled"]').should('have.length', 4);

    // 9. Add another subscription
    cy.contains('Add Subscription').click();
    cy.get('input[placeholder*="Netflix"]').type('Spotify');
    cy.get('input[type="number"]').type('9.99');
    cy.get('select').first().select('monthly');
    cy.get('input[type="date"]').first().type('2024-03-20');
    cy.get('select').last().select('Entertainment');
    cy.contains('Add Subscription').click();

    // 10. Verify both subscriptions appear
    cy.contains('Netflix').should('be.visible');
    cy.contains('Spotify').should('be.visible');

    // 11. Test search functionality
    cy.get('input[placeholder*="Search"]').type('Netflix');
    cy.contains('Netflix').should('be.visible');
    cy.contains('Spotify').should('not.exist');

    // 12. Clear search
    cy.get('input[placeholder*="Search"]').clear();
    cy.contains('Netflix').should('be.visible');
    cy.contains('Spotify').should('be.visible');

    // 13. Test bulk selection
    cy.get('input[type="checkbox"]').first().check();
    cy.get('input[type="checkbox"]').eq(1).check();
    cy.contains('2 subscriptions selected').should('be.visible');

    // 14. Test export functionality
    cy.contains('Export CSV').click();
    // Verify download started (file download testing is complex in Cypress)

    // 15. Cancel a subscription
    cy.get('[data-testid="cancel-netflix"]').click();
    cy.contains('Yes, cancel').click();
    cy.contains('Netflix cancelled successfully').should('be.visible');
  });

  it('should handle notification flow', () => {
    // Navigate to notifications
    cy.contains('Notifications').click();

    // Should show empty state initially
    cy.contains('All caught up!').should('be.visible');

    // Add subscription with near renewal date
    cy.contains('Dashboard').click();
    cy.contains('Add Subscription').click();
    
    // Add subscription renewing in 3 days
    const renewalDate = new Date();
    renewalDate.setDate(renewalDate.getDate() + 3);
    const dateString = renewalDate.toISOString().split('T')[0];
    
    cy.get('input[placeholder*="Netflix"]').type('Adobe Creative Cloud');
    cy.get('input[type="number"]').type('52.99');
    cy.get('select').first().select('monthly');
    cy.get('input[type="date"]').first().type(dateString);
    cy.get('select').last().select('Productivity');
    cy.contains('Add Subscription').click();

    // Go to notifications (in real app, this would be triggered by the scheduler)
    cy.contains('Notifications').click();

    // Mock notification data
    cy.window().then((win) => {
      // In real tests, you'd mock the API response
      cy.contains('Adobe Creative Cloud is renewing soon').should('be.visible');
    });

    // Test keep subscription
    cy.contains('Yes, Keep It').click();
    cy.contains('Subscription kept').should('be.visible');
  });

  it('should handle family sharing', () => {
    // Navigate to family section
    cy.contains('Family').click();

    // Create family group
    cy.contains('Create Group').click();
    cy.get('input[placeholder*="Family group name"]').type('Smith Family');
    cy.contains('Create').click();

    // Verify group created
    cy.contains('Smith Family').should('be.visible');

    // Invite family member
    cy.contains('Invite').click();
    cy.get('input[type="email"]').type('family@example.com');
    cy.get('select').select('member');
    cy.contains('Send Invite').click();

    // Verify invite sent
    cy.contains('Invitation sent').should('be.visible');
  });

  it('should work offline', () => {
    // Simulate offline mode
    cy.window().then((win) => {
      // Mock navigator.onLine
      Object.defineProperty(win.navigator, 'onLine', {
        writable: true,
        value: false
      });
    });

    // Try to add subscription while offline
    cy.contains('Add Subscription').click();
    cy.get('input[placeholder*="Netflix"]').type('Offline Test');
    cy.get('input[type="number"]').type('10.00');
    cy.contains('Add Subscription').click();

    // Should show offline message or queue for sync
    cy.contains('Offline').should('be.visible');

    // Simulate coming back online
    cy.window().then((win) => {
      Object.defineProperty(win.navigator, 'onLine', {
        writable: true,
        value: true
      });
      win.dispatchEvent(new Event('online'));
    });

    // Should sync and show subscription
    cy.contains('Offline Test').should('be.visible');
  });
});