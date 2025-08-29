import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { signIn, signUp } from '../lib/supabase';

// --- (Password strength utility and other helpers remain the same) ---
const getPasswordStrength = (password: string) => {
    let score = 0;
    if (password.length > 8) score++;
    if (password.length > 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
};

const Auth: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSignUp && formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    
    setLoading(true);

    try {
      if (isSignUp) {
        await signUp(formData.email, formData.password);
        toast.success('Account created! Please check your email to verify.');
        setIsSignUp(false);
      } else {
        await signIn(formData.email, formData.password);
        navigate('/');
        toast.success('Signed in successfully!');
      }
    } catch (error: any) {
      toast.error(error.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = useMemo(() => getPasswordStrength(formData.password), [formData.password]);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <CreditCard className="w-10 h-10 text-indigo-600" />
            <span className="text-3xl font-bold text-gray-900">SubAudit</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </h2>
          <p className="text-gray-600">
            {isSignUp ? 'Start tracking your subscriptions' : 'Sign in to manage your subscriptions'}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input name="email" type="email" value={formData.email} onChange={handleChange} required className="w-full pl-10 pr-4 py-3 border rounded-lg" placeholder="Enter your email" />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input name="password" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={handleChange} required minLength={6} className="w-full pl-10 pr-10 py-3 border rounded-lg" placeholder="Enter your password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><Eye size={20} /></button>
              </div>
            </div>

            <AnimatePresence>
              {isSignUp && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input name="confirmPassword" type={showPassword ? 'text' : 'password'} value={formData.confirmPassword} onChange={handleChange} required minLength={6} className="w-full pl-10 pr-10 py-3 border rounded-lg" placeholder="Confirm your password" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center space-x-2">
              <User className="w-4 h-4" />
              <span>{loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}</span>
            </button>
          </form>

          {/* --- FIX: This button will now be displayed correctly --- */}
          <div className="mt-6 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              {isSignUp 
                ? 'Already have an account? Sign In' 
                : "Don't have an account? Sign Up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
