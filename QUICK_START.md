# 🚀 Quick Start Guide - Subscription Audit Tool

## Prerequisites
- Node.js 18+ and npm
- Supabase account (free tier works)

## 1. Environment Setup (5 minutes)

### Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and create account
2. Create new project (choose free tier)
3. Wait for project to initialize (~2 minutes)

### Get API Keys
1. Go to Settings → API
2. Copy your `Project URL` and `anon public` key

### Configure Environment
```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your Supabase credentials
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

## 2. Database Setup (2 minutes)

1. In Supabase Dashboard → SQL Editor
2. Copy the entire contents of `supabase/migrations/20250729154918_rough_marsh.sql`
3. Paste and click "Run" to create tables and security policies

## 3. Install & Run (1 minute)

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173` - you should see the login page!

## 4. Test the App (5 minutes)

### Create Account & Add Subscription
1. **Sign Up**: Create account with email/password
2. **Add Subscription**: Click "Add Subscription"
   - Name: Netflix
   - Cost: 15.99
   - Billing: Monthly
   - Renewal: 3 days from today
   - Category: Entertainment

### Test Features
3. **Rate Value**: Click star icon, give 4 stars
4. **Check Notifications**: Go to Notifications tab
5. **Export Data**: Try CSV export
6. **Bulk Actions**: Select subscription and test bulk cancel

## 🎯 Expected Results

✅ **Dashboard**: Shows subscription with renewal alert  
✅ **Stats**: Displays $15.99 monthly spending  
✅ **Notifications**: Shows renewal reminder  
✅ **Export**: Downloads CSV file  
✅ **Mobile**: Responsive on phone/tablet  

## 🐛 Troubleshooting

**"User not authenticated" error**
- Check .env file has correct Supabase URL/key
- Try signing out and back in

**Subscriptions not loading**
- Verify database migration ran successfully
- Check browser console for errors

**Build errors**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 🚀 Deploy to Production

### Netlify (Recommended)
```bash
# Build for production
npm run build

# Deploy dist folder to Netlify
# Set environment variables in Netlify dashboard
```

### Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

## 📱 Demo Data

For testing, add these subscriptions:

| Service | Cost | Cycle | Renewal | Category |
|---------|------|-------|---------|----------|
| Netflix | $15.99 | Monthly | 3 days | Entertainment |
| Spotify | $9.99 | Monthly | 1 week | Entertainment |
| Adobe CC | $52.99 | Monthly | 2 weeks | Productivity |
| GitHub Pro | $4.00 | Monthly | 1 month | Business |

This gives you a good mix to test all features!

---

**Need help?** Check the full [SETUP.md](SETUP.md) or create an issue.