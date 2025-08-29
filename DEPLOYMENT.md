# Deployment Guide - Subscription Audit Tool

This guide covers deploying the complete Subscription Audit Tool MVP to production.

## 🚀 Quick Deploy Options

### Option 1: Netlify (Recommended for Frontend)
```bash
# 1. Build the project
npm run build

# 2. Deploy to Netlify
# - Connect your GitHub repo to Netlify
# - Set build command: npm run build
# - Set publish directory: dist
# - Add environment variables in Netlify dashboard
```

### Option 2: Vercel
```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Deploy
vercel --prod

# 3. Set environment variables
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
```

### Option 3: Railway
```bash
# 1. Install Railway CLI
npm i -g @railway/cli

# 2. Login and deploy
railway login
railway init
railway up
```

## 🏗 Architecture Overview

- **Frontend**: React + TypeScript (deployed to Netlify/Vercel)
- **Backend**: Supabase (database + auth + edge functions)
- **Email**: Resend or SendGrid for renewal notifications
- **Scheduling**: Supabase cron jobs or external cron service

## 📋 Prerequisites

- Supabase account and project
- Email service account (Resend recommended)
- Domain name (optional but recommended)
- Git repository

## 🚀 Step-by-Step Deployment

### 1. Supabase Setup

1. **Create Supabase Project**
   ```bash
   # Go to https://supabase.com/dashboard
   # Create new project
   # Note your project URL and anon key
   ```

2. **Run Database Migration**
   - Go to Supabase Dashboard → SQL Editor
   - Copy contents of `supabase/migrations/create_subscription_audit_schema.sql`
   - Execute the migration

3. **Configure Authentication**
   - Go to Authentication → Settings
   - Disable email confirmation: `Enable email confirmations = OFF`
   - Set site URL to your production domain

4. **Deploy Edge Functions**
   ```bash
   # Install Supabase CLI
   npm install -g supabase

   # Login to Supabase
   supabase login

   # Link your project
   supabase link --project-ref YOUR_PROJECT_REF

   # Deploy notification scheduler
   supabase functions deploy notification-scheduler

   # Deploy email sender (optional)
   supabase functions deploy send-renewal-emails
   ```

### 2. Email Service Setup

#### Option A: Resend (Recommended)
1. Sign up at [resend.com](https://resend.com)
2. Create API key
3. Add to Supabase Edge Function secrets:
   ```bash
   supabase secrets set RESEND_API_KEY=your_resend_api_key
   ```

#### Option B: SendGrid
1. Sign up at [sendgrid.com](https://sendgrid.com)
2. Create API key
3. Add to Supabase Edge Function secrets:
   ```bash
   supabase secrets set SENDGRID_API_KEY=your_sendgrid_api_key
   ```

### 3. Frontend Deployment

#### Option A: Netlify (Recommended)
1. **Build Settings**
   ```bash
   # Build command
   npm run build

   # Publish directory
   dist
   ```

2. **Environment Variables**
   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Deploy**
   - Connect your Git repository
   - Set build settings and environment variables
   - Deploy

#### Option B: Vercel
1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   vercel --prod
   ```

3. **Set Environment Variables**
   ```bash
   vercel env add VITE_SUPABASE_URL
   vercel env add VITE_SUPABASE_ANON_KEY
   ```

### 4. Notification Scheduling

#### Option A: Supabase Cron (Recommended)
1. Go to Supabase Dashboard → Database → Extensions
2. Enable `pg_cron` extension
3. Create cron job:
   ```sql
   SELECT cron.schedule(
     'daily-renewal-notifications',
     '0 9 * * *', -- 9 AM daily
     $$
     SELECT net.http_post(
       url := 'https://your-project.supabase.co/functions/v1/notification-scheduler',
       headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
     );
     $$
   );
   ```

#### Option B: External Cron Service
Use services like:
- GitHub Actions (free)
- Cron-job.org
- EasyCron

Example GitHub Action (`.github/workflows/notifications.yml`):
```yaml
name: Daily Notifications
on:
  schedule:
    - cron: '0 9 * * *' # 9 AM daily
jobs:
  send-notifications:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger notifications
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}" \
            https://your-project.supabase.co/functions/v1/notification-scheduler
```

### 5. Domain Setup (Optional)

1. **Custom Domain**
   - Add your domain to Netlify/Vercel
   - Update Supabase site URL
   - Configure DNS records

2. **SSL Certificate**
   - Automatically handled by Netlify/Vercel

## 🔧 Environment Variables

### Frontend (.env)
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### Supabase Edge Functions
```bash
RESEND_API_KEY=your_resend_key
# OR
SENDGRID_API_KEY=your_sendgrid_key

APP_URL=https://your-domain.com
```

## 🧪 Testing Deployment

1. **Frontend Testing**
   ```bash
   # Test locally first
   npm run build
   npm run preview
   ```

2. **Database Testing**
   - Create test user account
   - Add test subscriptions
   - Verify RLS policies work

3. **Notification Testing**
   - Manually trigger edge function
   - Check notification logs table
   - Verify emails are sent

4. **End-to-End Testing**
   - Sign up new user
   - Add subscription with near renewal date
   - Wait for notification
   - Test keep/cancel flow

## 📊 Monitoring & Analytics

### Supabase Dashboard
- Monitor database usage
- Check edge function logs
- Review authentication metrics

### Error Tracking
Consider adding:
- Sentry for error tracking
- LogRocket for user session replay
- Google Analytics for usage metrics

## 🔒 Security Checklist

- ✅ RLS enabled on all tables
- ✅ Environment variables secured
- ✅ HTTPS enforced
- ✅ API keys rotated regularly
- ✅ User data isolated properly

## 🚀 Performance Optimization

1. **Frontend**
   - Enable gzip compression
   - Optimize images
   - Use CDN for static assets

2. **Database**
   - Monitor query performance
   - Add indexes as needed
   - Regular database maintenance

3. **Edge Functions**
   - Optimize function cold starts
   - Monitor execution time
   - Handle rate limits

## 📈 Scaling Considerations

### Database Scaling
- Monitor connection limits
- Consider read replicas for heavy read workloads
- Implement database connection pooling

### Email Scaling
- Monitor email sending limits
- Implement retry logic for failed emails
- Consider multiple email providers for redundancy

### Frontend Scaling
- CDN for global distribution
- Image optimization
- Code splitting for large bundles

## 🔄 Maintenance

### Regular Tasks
- Monitor error logs weekly
- Update dependencies monthly
- Review user feedback
- Backup database regularly

### Updates
- Test in staging environment first
- Use feature flags for gradual rollouts
- Monitor metrics after deployments

## 🆘 Troubleshooting

### Common Issues

1. **Authentication not working**
   - Check Supabase site URL
   - Verify environment variables
   - Check RLS policies

2. **Notifications not sending**
   - Verify edge function deployment
   - Check cron job configuration
   - Monitor email service limits

3. **Database connection issues**
   - Check connection string
   - Verify RLS policies
   - Monitor connection pool

### Support Resources
- Supabase Documentation
- Community Discord
- GitHub Issues

---

This deployment guide ensures a production-ready Subscription Audit Tool with proper monitoring, security, and scalability considerations.