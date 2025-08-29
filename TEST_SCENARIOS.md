# 🧪 Test Scenarios - Subscription Audit Tool

## Core User Flows

### 1. New User Onboarding
```
✅ SCENARIO: First-time user signs up and adds subscription

STEPS:
1. Visit app → See auth screen
2. Click "Sign up" → Enter email/password
3. Successfully logged in → See empty dashboard
4. Click "Add Your First Subscription"
5. Fill form with valid data → Submit
6. See subscription in dashboard with stats

EXPECTED RESULTS:
- Clean onboarding flow
- Dashboard shows subscription and spending stats
- No errors in console
- Mobile responsive
```

### 2. Subscription Management
```
✅ SCENARIO: User manages existing subscriptions

STEPS:
1. Add 3-4 test subscriptions with different renewal dates
2. Rate subscriptions (1-5 stars)
3. Set last used dates
4. Use search/filter functionality
5. Select multiple subscriptions
6. Perform bulk cancel operation

EXPECTED RESULTS:
- All CRUD operations work smoothly
- Filters work correctly
- Bulk actions update UI immediately
- Proper success/error messages
```

### 3. Renewal Notifications
```
✅ SCENARIO: User receives and responds to renewal reminders

SETUP:
- Add subscription with renewal date = today + 3 days
- Manually trigger notification (or wait for scheduler)

STEPS:
1. Go to Notifications tab
2. See renewal reminder for upcoming subscription
3. Click "Yes, Keep It" → Verify response logged
4. Add another subscription with near renewal
5. Click "No, Cancel It" → Verify subscription cancelled

EXPECTED RESULTS:
- Notifications appear correctly
- Keep/Cancel responses work
- UI updates reflect changes
- Cancelled subscriptions don't show in active list
```

### 4. Data Export & Analytics
```
✅ SCENARIO: User exports data and views insights

STEPS:
1. Add 5+ subscriptions across different categories
2. Rate some subscriptions (mix of high/low ratings)
3. Set various last-used dates
4. Export to CSV → Verify file contents
5. Generate report → Verify text format
6. Check insights panel for recommendations

EXPECTED RESULTS:
- CSV contains all subscription data
- Report shows spending summary
- Insights identify low-value subscriptions
- Analytics calculations are accurate
```

## Edge Cases & Error Handling

### 5. Invalid Data Handling
```
🔍 SCENARIO: User enters invalid data

TEST CASES:
- Past renewal date → Should show error
- Future last-used date → Should show error
- Extremely high cost (>$10,000) → Should warn user
- Empty required fields → Should prevent submission
- Special characters in names → Should handle gracefully

EXPECTED RESULTS:
- Clear error messages
- Form doesn't submit with invalid data
- No crashes or console errors
```

### 6. Network & Auth Errors
```
🔍 SCENARIO: Handle network issues and auth problems

TEST CASES:
- Disconnect internet → Should show offline message
- Invalid Supabase credentials → Should show auth error
- Session expires → Should redirect to login
- API rate limits → Should handle gracefully

EXPECTED RESULTS:
- Graceful error handling
- User-friendly error messages
- No infinite loading states
- Proper fallbacks
```

### 7. Performance & Scalability
```
🔍 SCENARIO: App performance with many subscriptions

SETUP:
- Add 50+ test subscriptions
- Mix of different categories and dates

TEST CASES:
- Dashboard load time < 2 seconds
- Search/filter response < 500ms
- Bulk operations complete successfully
- Mobile performance remains smooth

EXPECTED RESULTS:
- Fast loading times
- Smooth interactions
- No memory leaks
- Responsive on all devices
```

## Automated Test Commands

### Quick Smoke Test
```bash
# Test basic functionality
npm run dev
# → Visit localhost:5173
# → Sign up new user
# → Add subscription
# → Check notifications
# → Export data
```

### Database Test
```bash
# Test database operations
# In Supabase SQL Editor:

-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Test RLS policies
SELECT * FROM subscriptions; -- Should return empty for new user

-- Test data insertion
INSERT INTO subscriptions (user_id, name, cost, billing_cycle, next_renewal_date, category)
VALUES (auth.uid(), 'Test Sub', 9.99, 'monthly', '2024-02-15', 'Test');
```

### Edge Function Test
```bash
# Test notification scheduler
curl -X POST \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  https://your-project.supabase.co/functions/v1/notification-scheduler

# Expected response: JSON with processed subscriptions
```

## Performance Benchmarks

### Target Metrics
- **Page Load**: < 2 seconds
- **Search Response**: < 500ms
- **Form Submission**: < 1 second
- **Data Export**: < 3 seconds
- **Mobile Performance**: 60fps scrolling

### Monitoring
```javascript
// Add to browser console for performance monitoring
console.time('Dashboard Load');
// Navigate to dashboard
console.timeEnd('Dashboard Load');

// Check bundle size
npm run build
# dist folder should be < 2MB
```

## Security Test Checklist

### Data Protection
- ✅ Users can only see their own subscriptions
- ✅ RLS policies prevent data leaks
- ✅ No sensitive data in localStorage
- ✅ API keys properly secured
- ✅ Input sanitization prevents XSS

### Authentication
- ✅ Password requirements enforced
- ✅ Session management works correctly
- ✅ Logout clears all user data
- ✅ Protected routes require auth

---

**Run these tests before any production deployment!**