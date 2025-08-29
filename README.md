# Subscription Audit Tool MVP

A mindful subscription management app that helps users track recurring payments and make conscious renewal decisions.

## 🚀 Features

- **Subscription Tracking**: Manually add and manage recurring subscriptions
- **Renewal Reminders**: Get notified 5 days before renewals with value assessment prompts
- **Mindful Decision Making**: "Keep or Cancel" prompts for each renewal
- **Dashboard Analytics**: View spending patterns and upcoming renewals
- **Responsive Design**: Works on desktop and mobile devices

## 🛠 Tech Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions)
- **Routing**: React Router DOM
- **Forms**: React Hook Form + Zod validation
- **Notifications**: React Hot Toast
- **Icons**: Lucide React
- **Date Handling**: date-fns

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account and project

## 🔧 Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd subscription-audit-tool
npm install
```

### 2. Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your project URL and anon key
3. Copy `.env.example` to `.env` and fill in your Supabase credentials:

```bash
cp .env.example .env
```

Edit `.env`:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Database Setup

1. In your Supabase dashboard, go to the SQL Editor
2. Copy and paste the contents of `supabase/migrations/create_subscription_audit_schema.sql`
3. Run the migration to create all tables, policies, and indexes

### 4. Deploy Edge Function (Optional)

For automated notifications, deploy the notification scheduler:

1. Install Supabase CLI
2. Login to Supabase: `supabase login`
3. Link your project: `supabase link --project-ref your-project-ref`
4. Deploy the function: `supabase functions deploy notification-scheduler`
5. Set up a cron job to call the function daily

### 5. Run the Application

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## 🎯 Usage

### Getting Started
1. Sign up for a new account or sign in
2. Add your first subscription using the "Add Subscription" button
3. Fill in the service name, cost, billing cycle, and renewal date
4. View your subscriptions on the dashboard

### Managing Renewals
1. Check the "Notifications" tab for upcoming renewals
2. Review each subscription's value proposition
3. Click "Keep Subscription" or "Cancel Subscription"
4. Cancelled subscriptions are marked as inactive

### Dashboard Features
- **Monthly Spending**: See your total monthly subscription costs
- **Yearly Projection**: Understand your annual subscription expenses
- **Upcoming Renewals**: Quick view of subscriptions renewing soon

## 🏗 Architecture

### Frontend Structure
```
src/
├── components/          # React components
│   ├── Auth.tsx        # Authentication form
│   ├── Dashboard.tsx   # Main dashboard
│   ├── Layout.tsx      # App layout wrapper
│   ├── NotificationCenter.tsx  # Renewal notifications
│   ├── SubscriptionCard.tsx    # Individual subscription display
│   └── SubscriptionForm.tsx    # Add/edit subscription form
├── lib/                # Utility functions
│   ├── supabase.ts     # Supabase client and auth helpers
│   ├── subscriptions.ts # Subscription CRUD operations
│   └── notifications.ts # Notification management
├── types/              # TypeScript type definitions
└── App.tsx            # Main app component
```

### Database Schema
- **subscriptions**: User subscription data
- **notification_logs**: Tracks sent notifications and user responses
- **auth.users**: Supabase built-in user management

### Security
- Row Level Security (RLS) enabled on all tables
- Users can only access their own data
- Authenticated access required for all operations

## 🚀 Deployment

### Frontend Deployment (Vercel/Netlify)
1. Build the project: `npm run build`
2. Deploy the `dist` folder to your hosting provider
3. Set environment variables in your hosting dashboard

### Backend (Supabase)
- Database and authentication are automatically hosted by Supabase
- Edge functions can be deployed using Supabase CLI

## 🔮 Next Steps & Enhancements

### Phase 2 Features
- **Email Notifications**: Integrate with SendGrid/Resend for email alerts
- **Usage Tracking**: Add "last used" date tracking with reminders
- **Smart Insights**: Analyze spending patterns and suggest optimizations
- **Family Sharing**: Allow household subscription management
- **Export Data**: CSV/PDF reports of subscription history
- **Integrations**: Connect with banking APIs for automatic detection

### Technical Improvements
- **Push Notifications**: Web push notifications for renewal reminders
- **Offline Support**: PWA capabilities for offline access
- **Mobile App**: React Native version for iOS/Android
- **Advanced Analytics**: Charts and trends visualization
- **Bulk Operations**: Import/export subscriptions in bulk

### Business Features
- **Freemium Model**: Implement subscription limits for free tier
- **Payment Integration**: Stripe integration for premium features
- **Referral System**: User referral program
- **Admin Dashboard**: Analytics and user management

## 🐛 Troubleshooting

### Common Issues

**Authentication not working**
- Check Supabase URL and anon key in `.env`
- Ensure RLS policies are properly set up

**Subscriptions not loading**
- Verify database migration ran successfully
- Check browser console for API errors

**Notifications not appearing**
- Ensure notification_logs table exists
- Check that Edge function is deployed and scheduled

### Development Tips
- Use Supabase dashboard to inspect database directly
- Check browser Network tab for API call failures
- Enable Supabase debug mode for detailed error logs

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

---

Built with ❤️ for mindful subscription management