import React, { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { CreditCard, Bell, Home, LogOut, User, Settings, X, Menu as MenuIcon, Gift, Star, } from 'lucide-react';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

import { useAuth } from '../hooks/useAuth';
import { signOut } from '../lib/supabase';

const Layout: React.FC = () => {
  const { user } = useAuth();
  const subscription = { plan: 'Free' }; // Placeholder

  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isChangelogOpen, setIsChangelogOpen] = useState(false);

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error('Error signing out');
    } else {
      toast.success('Signed out successfully');
    }
    setIsSignOutModalOpen(false);
  };

  const activeLinkStyle = { color: '#4f46e5', fontWeight: 600 };

  const navLinks = (
    <>
      <NavLink to="/" style={({ isActive }) => isActive ? activeLinkStyle : {}} className="flex items-center space-x-2 text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md">
        <Home className="w-5 h-5" /><span>Dashboard</span>
      </NavLink>
      <NavLink to="/notifications" style={({ isActive }) => isActive ? activeLinkStyle : {}} className="flex items-center space-x-2 text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md">
        <Bell className="w-5 h-5" /><span>Notifications</span>
      </NavLink>
    </>
  );

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-8">
                <NavLink to="/" className="flex items-center space-x-2">
                  <CreditCard className="w-8 h-8 text-indigo-600" />
                  <span className="text-xl font-bold text-gray-900">SubAudit</span>
                </NavLink>
                <nav className="hidden md:flex space-x-1">{navLinks}</nav>
              </div>

              <div className="flex items-center space-x-4">
                <button onClick={() => setIsChangelogOpen(true)} className="p-2 rounded-full text-gray-500 hover:text-indigo-600 hover:bg-gray-100">
                    <Gift size={20}/>
                </button>

                {subscription.plan !== 'Pro' && (
                    <button className="hidden sm:flex items-center space-x-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity">
                        <Star size={16}/>
                        <span>Upgrade to Pro</span>
                    </button>
                )}

                <Menu as="div" className="relative">
                  <MenuButton className="flex items-center justify-center w-10 h-10 bg-gray-200 rounded-full hover:ring-2 hover:ring-indigo-500 hover:ring-offset-2">
                    <User className="w-5 h-5 text-gray-600" />
                  </MenuButton>
                  <MenuItems transition anchor="bottom end" className="w-64 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 z-30 mt-2">
                    <div className="px-4 py-3 border-b">
                        <p className="text-sm font-medium text-gray-900 truncate">{user?.email}</p>
                        <p className={`text-xs font-semibold px-2 py-0.5 rounded-full inline-block mt-1 ${subscription.plan === 'Pro' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                            {subscription.plan} Plan
                        </p>
                    </div>
                    <div className="py-1">
                      <MenuItem><a href="#" className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 data-[focus]:bg-gray-100"><Settings size={16}/>Settings</a></MenuItem>
                      <MenuItem><a href="#" className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 data-[focus]:bg-gray-100"><CreditCard size={16}/>Manage Billing</a></MenuItem>
                      <MenuItem><button onClick={() => setIsSignOutModalOpen(true)} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 data-[focus]:bg-red-50"><LogOut size={16}/>Sign Out</button></MenuItem>
                    </div>
                  </MenuItems>
                </Menu>
                
                <div className="md:hidden"><button onClick={() => setIsMobileMenuOpen(true)} className="p-2 rounded-md text-gray-600 hover:bg-gray-100"><MenuIcon size={24} /></button></div>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"><Outlet /></main>
      </div>
      
      <AnimatePresence>
        {isSignOutModalOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 text-center">
              <LogOut className="mx-auto w-12 h-12 text-red-500" />
              <h3 className="text-xl font-semibold mt-4">Sign Out</h3>
              <p className="text-gray-600 mt-2">Are you sure you want to sign out of your account?</p>
              <div className="flex space-x-3 mt-6">
                <button onClick={() => setIsSignOutModalOpen(false)} className="flex-1 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                <button onClick={handleSignOut} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Sign Out</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {isMobileMenuOpen && (
            <div className="md:hidden fixed inset-0 z-40">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMobileMenuOpen(false)} className="absolute inset-0 bg-black/50"/>
                <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} className="fixed top-0 right-0 h-full w-64 bg-white shadow-lg p-4">
                    <button onClick={() => setIsMobileMenuOpen(false)} className="absolute top-4 right-4 p-2 text-gray-500"><X/></button>
                    <nav className="mt-12 flex flex-col space-y-2">{navLinks}</nav>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      {/* --- FIX: Added the missing Changelog Modal --- */}
      <AnimatePresence>
        {isChangelogOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white rounded-xl shadow-2xl max-w-md w-full">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold flex items-center space-x-2"><Gift className="text-indigo-500"/><span>What's New at SubAudit</span></h3>
                <button onClick={() => setIsChangelogOpen(false)} className="p-1 rounded-full hover:bg-gray-100"><X/></button>
              </div>
              <div className="p-6 max-h-[60vh] overflow-y-auto text-gray-700 space-y-4">
                  <div>
                      <p className="font-semibold text-gray-800">August 2025: Family Cost Splitting</p>
                      <p className="text-sm">You can now automatically calculate who owes whom in your Family Sharing groups!</p>
                  </div>
                  <div>
                      <p className="font-semibold text-gray-800">July 2025: PDF Exports</p>
                      <p className="text-sm">Generate beautiful, professional PDF reports of your subscription spending.</p>
                  </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Layout;
