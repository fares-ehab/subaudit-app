# Subscription Audit Tool - Setup Guide

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Supabase account

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
3. Fill in your Supabase credentials in `.env`:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Database Setup
1. Go to Supabase Dashboard → SQL Editor
2. Copy and paste the migration from `supabase/migrations/20250729154918_rough_marsh.sql`
3. Run the migration to create tables and policies

### 4. Run the Application
```bash
npm run dev
```
The app will be available at `http://localhost:5173`

## 🧪 Testing the App

### Test User Flow:
1. **Sign Up**: Create a new account
2. **Add Subscription**: Add Netflix ($15.99/month, renewing in 3 days)
3. **Rate Value**: Give it 4 stars, set last used to yesterday
4. **Check Notifications**: Should appear in notifications tab
5. **Export Data**: Test CSV export functionality

### Test Data:
```javascript
// Sample subscriptions for testing
const testSubscriptions = [
  {
    name: "Netflix",
    cost: 15.99,
    billing_cycle: "monthly",
    next_renewal_date: "2024-02-03", // 3 days from now
    category: "Entertainment"
  },
  {
    name: "Spotify",
    cost: 9.99,
    billing_cycle: "monthly", 
    next_renewal_date: "2024-02-15",
    category: "Entertainment"
  }
];
```

## 🔧 Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run type-check

# Linting
npm run lint
```

## 📦 Deployment

### Frontend (Netlify/Vercel)
1. Build the project: `npm run build`
2. Deploy the `dist` folder
3. Set environment variables in hosting dashboard

### Backend (Supabase)
- Database and auth are automatically hosted
- Edge functions can be deployed using Supabase CLI

## 🐛 Troubleshooting

### Common Issues:

**"User not authenticated" errors**
- Check if Supabase URL and anon key are correct
- Ensure user is signed in

**Subscriptions not loading**
- Verify database migration ran successfully
- Check browser console for API errors

**Build errors**
- Run `npm run type-check` to identify TypeScript issues
- Ensure all dependencies are installed

### Debug Mode:
Add to `.env` for detailed logging:
```
VITE_DEBUG=true
```

## 🔒 Security Notes

- Never commit `.env` files
- Use environment variables for all secrets
- RLS policies protect user data
- Input validation prevents XSS attacks
- No payment data is stored locally

## 📈 Performance Tips

- Use React DevTools to monitor re-renders
- Check Network tab for slow API calls
- Monitor Supabase dashboard for query performance
- Consider pagination for large subscription lists

---

Need help? Check the [deployment guide](DEPLOYMENT.md) or create an issue.