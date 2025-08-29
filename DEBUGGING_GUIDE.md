# 🐛 Debugging Guide - Subscription Audit Tool

## Quick Setup & Run Commands

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your Supabase credentials
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Database Setup
1. Go to Supabase Dashboard → SQL Editor
2. Run the migration: `supabase/migrations/20250729154918_rough_marsh.sql`
3. (Optional) Run family sharing migration: `supabase/migrations/20250802124333_noisy_resonance.sql`

### 4. Start Development
```bash
npm run dev
```

### 5. Run Tests
```bash
# Unit tests
npm test

# E2E tests
npm run cypress:open
```

## 🔧 Fixed Issues

### Frontend Fixes
- ✅ **Missing React Import**: Added React import to realtime.ts for hooks
- ✅ **Bank Integration**: Enhanced error handling and demo mode simulation
- ✅ **Smart Insights**: Added proper empty state handling and error management
- ✅ **Family Management**: Added table existence checks and better error handling
- ✅ **Form Validation**: Enhanced subscription form with better input validation
- ✅ **Notification Responses**: Improved error handling with specific error messages

### Backend Fixes
- ✅ **Notification Scheduler**: Fixed date filtering logic for renewal detection
- ✅ **Subscription Queries**: Enhanced upcoming renewals query with proper date filtering
- ✅ **Response Recording**: Added input validation for notification responses
- ✅ **Error Handling**: Improved error messages throughout API calls

### Service Worker Fixes
- ✅ **Registration**: Added proper feature detection for service workers
- ✅ **Background Sync**: Added compatibility checks for background sync
- ✅ **Offline Support**: Enhanced offline detection and error handling

## 🧪 Testing Scenarios

### Test 1: Add Subscription
1. Click "Add Subscription"
2. Fill form with valid data
3. Submit and verify success message
4. Check subscription appears in dashboard

### Test 2: Bank Integration (Demo Mode)
1. Go to Bank Integration section
2. Click "Connect Bank Account"
3. Wait for demo simulation
4. Verify detected subscriptions appear
5. Import a subscription and verify it's added

### Test 3: Smart Insights
1. Add multiple subscriptions with different ratings
2. Set last-used dates on some subscriptions
3. Go to Smart Insights section
4. Verify recommendations appear based on usage patterns

### Test 4: Notifications
1. Add subscription with renewal date in 3-5 days
2. Manually trigger notification scheduler (or wait for cron)
3. Go to Notifications tab
4. Test "Keep" and "Cancel" responses

### Test 5: Family Sharing (Optional)
1. Create family group
2. Invite family member
3. Share subscriptions
4. Test role-based permissions

## 🚨 Common Issues & Solutions

### Issue: "User not authenticated" errors
**Solution**: Check Supabase URL and anon key in .env file

### Issue: Subscriptions not loading
**Solution**: Verify database migration ran successfully

### Issue: Family sharing not working
**Solution**: Run the family sharing migration first

### Issue: Service worker not registering
**Solution**: Ensure you're running on HTTPS or localhost

### Issue: Tests failing
**Solution**: Run `npm install` to ensure all test dependencies are installed

## 📊 Performance Monitoring

### Check Bundle Size
```bash
npm run build
# Check dist/ folder size
```

### Monitor API Calls
- Open browser DevTools → Network tab
- Look for slow or failing API calls
- Check Supabase dashboard for query performance

### Test Offline Functionality
1. Open DevTools → Application → Service Workers
2. Check "Offline" checkbox
3. Test app functionality
4. Verify offline messages appear

## 🔒 Security Checklist

- ✅ RLS policies enabled on all tables
- ✅ User authentication required for all operations
- ✅ Input validation on all forms
- ✅ No sensitive data in localStorage
- ✅ Proper error handling without exposing internals

## 📱 Mobile Testing

### Test on Different Screen Sizes
```bash
# Open DevTools → Toggle device toolbar
# Test on iPhone, iPad, Android sizes
```

### Check Touch Interactions
- Verify buttons are large enough (44px minimum)
- Test swipe gestures work properly
- Ensure forms are usable on mobile keyboards

## 🚀 Deployment Checklist

Before deploying:
1. ✅ All tests pass
2. ✅ Environment variables set
3. ✅ Database migrations run
4. ✅ Service worker registered
5. ✅ Error tracking configured
6. ✅ Performance optimized

---

**Ready for Production!** 🎉