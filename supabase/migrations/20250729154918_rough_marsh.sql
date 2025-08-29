/*
  # Subscription Audit Tool Database Schema

  1. New Tables
    - `subscriptions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `name` (text, subscription service name)
      - `cost` (decimal, subscription cost)
      - `billing_cycle` (text, monthly/yearly/weekly)
      - `next_renewal_date` (date, when subscription renews)
      - `category` (text, subscription category)
      - `last_used_date` (date, optional, when user last used service)
      - `value_rating` (integer, optional, user's value rating 1-5)
      - `is_active` (boolean, whether subscription is active)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `notification_logs`
      - `id` (uuid, primary key)
      - `subscription_id` (uuid, foreign key to subscriptions)
      - `user_id` (uuid, foreign key to auth.users)
      - `notification_type` (text, type of notification)
      - `sent_at` (timestamp, when notification was sent)
      - `user_response` (text, optional, keep/cancel response)
      - `response_at` (timestamp, optional, when user responded)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Ensure users can only access their own subscriptions and notifications

  3. Indexes
    - Add indexes for common query patterns
    - Optimize for renewal date lookups and user-specific queries
*/

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  cost decimal(10,2) NOT NULL CHECK (cost >= 0),
  billing_cycle text NOT NULL CHECK (billing_cycle IN ('weekly', 'monthly', 'yearly')),
  next_renewal_date date NOT NULL,
  category text NOT NULL,
  last_used_date date,
  value_rating integer CHECK (value_rating >= 1 AND value_rating <= 5),
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create notification_logs table
CREATE TABLE IF NOT EXISTS notification_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid REFERENCES subscriptions(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  notification_type text NOT NULL CHECK (notification_type IN ('renewal_reminder', 'value_check')),
  sent_at timestamptz DEFAULT now() NOT NULL,
  user_response text CHECK (user_response IN ('keep', 'cancel')),
  response_at timestamptz
);

-- Enable Row Level Security
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for subscriptions
CREATE POLICY "Users can view own subscriptions"
  ON subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions"
  ON subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions"
  ON subscriptions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own subscriptions"
  ON subscriptions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create RLS policies for notification_logs
CREATE POLICY "Users can view own notification logs"
  ON notification_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification logs"
  ON notification_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notification logs"
  ON notification_logs
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_renewal ON subscriptions(next_renewal_date) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_active ON subscriptions(user_id, is_active);

CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id ON notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_subscription_id ON notification_logs(subscription_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_pending ON notification_logs(user_id, user_response) WHERE user_response IS NULL;

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for subscriptions table
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();