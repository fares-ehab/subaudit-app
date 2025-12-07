import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthProvider';
import { toast } from 'react-hot-toast';
import { User, Settings as SettingsIcon, Image as ImageIcon, KeyRound, LogOut, Loader2, Save, Trash2, ShieldCheck } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

// Profile Update Form
const ProfileSettings = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const { register, handleSubmit, formState: { isSubmitting, errors } } = useForm({
    defaultValues: {
      fullName: profile?.full_name || '',
      email: user?.email || '',
    },
  });

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setIsUploading(true);
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${user!.id}/${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user!.id);
      if (updateError) throw updateError;
      
      await refreshProfile();
      toast.success('Avatar updated!');

    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (data: { fullName: string }) => {
    try {
        const { error } = await supabase
            .from('user_profiles')
            .update({ full_name: data.fullName })
            .eq('id', user!.id);
        if (error) throw error;
        await refreshProfile();
        toast.success('Profile updated!');
    } catch (error: any) {
        toast.error(error.message);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl border">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center space-x-2">
            <User size={20}/>
            <span>Profile Settings</span>
        </h2>
        <div className="mt-6 flex items-center space-x-4">
            <div className="relative">
                <img
                    src={profile?.avatar_url || `https://placehold.co/96/EBF4FF/7F9CF5?text=${profile?.full_name?.charAt(0) || user?.email?.charAt(0)}`}
                    alt="Avatar"
                    className="w-24 h-24 rounded-full object-cover"
                />
                {isUploading && <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center"><Loader2 className="animate-spin text-white"/></div>}
            </div>
            <label htmlFor="avatar-upload" className="cursor-pointer bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-200">
                <ImageIcon size={16} className="inline mr-2"/>
                {isUploading ? 'Uploading...' : 'Change Photo'}
            </label>
            <input type="file" id="avatar-upload" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={isUploading}/>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <div>
                <label className="text-sm font-medium">Full Name</label>
                <input {...register('fullName')} className="w-full mt-1 p-2 border rounded-lg"/>
            </div>
            <div>
                <label className="text-sm font-medium text-gray-500">Email Address (cannot be changed)</label>
                <input {...register('email')} disabled className="w-full mt-1 p-2 border rounded-lg bg-gray-100"/>
            </div>
            <button type="submit" disabled={isSubmitting} className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-semibold flex items-center space-x-2 disabled:opacity-50">
                {isSubmitting ? <Loader2 className="animate-spin"/> : <Save size={16}/>}
                <span>Save Changes</span>
            </button>
        </form>
    </div>
  )
};

// ... you would add other components like PasswordSettings, PlanSettings, etc. here

const SettingsPage: React.FC = () => {
    const { profile } = useAuth();
    
    // Show a loading state until the profile is available
    if (!profile) {
        return <LoadingSpinner message="Loading settings..."/>
    }

    return (
        <div className="space-y-6">
          <div className="flex items-center space-x-3">
            <SettingsIcon className="w-8 h-8 text-indigo-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-600">Manage your profile, plan, and preferences.</p>
            </div>
          </div>

          <div className="max-w-2xl mx-auto space-y-8">
            <ProfileSettings/>
            {/* Future components would go here */}
            {/* <PasswordSettings/> */}
            {/* <PlanSettings/> */}
          </div>
        </div>
      );
};

export default SettingsPage;