import React, { useState, useEffect } from 'react';
import { useAuth, api } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FiUser, FiMail, FiSliders, FiLogOut, FiCheckCircle, FiLock, FiCamera, FiCheck, FiInfo } from 'react-icons/fi';

const PRESET_AVATARS = [
  { name: 'Aura Violet', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=250&auto=format&fit=crop' },
  { name: 'Emerald Spark', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=250&auto=format&fit=crop' },
  { name: 'Cyber Pink', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=250&auto=format&fit=crop' },
  { name: 'Deep Sapphire', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=250&auto=format&fit=crop' }
];

export const Settings = () => {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();

  // Profile Form States
  const [name, setName] = useState(user?.name || '');
  const [profilePic, setProfilePic] = useState(user?.profilePic || '');

  // Password Form States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Status/Loading States
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Auto-clear notifications after 4 seconds
  useEffect(() => {
    if (message || error) {
      const timer = setTimeout(() => {
        setMessage('');
        setError('');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [message, error]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Convert image file to base64 string
  const handleImageFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      return setError('Image file size must be less than 8 MB.');
    }

    setUploading(true);
    setError('');

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      const base64Data = reader.result;
      try {
        // Upload to backend API which forwards to Cloudinary
        const response = await api.post('/upload', { image: base64Data });
        if (response.data.success) {
          setProfilePic(response.data.url);
          setMessage('Image uploaded to Cloudinary successfully!');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to upload image to Cloudinary.');
      } finally {
        setUploading(false);
      }
    };
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) return setError('Profile name cannot be empty.');

    setLoadingProfile(true);
    setError('');
    setMessage('');

    try {
      const response = await api.put('/auth/profile', { name, profilePic });
      if (response.data.success) {
        setUser(response.data.user);
        setMessage('Profile workspace updated successfully!');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      return setError('Please fill in all password fields.');
    }

    if (newPassword !== confirmNewPassword) {
      return setError('New password and password confirmation do not match.');
    }

    // Client-side quick check matching the backend strong password rule
    const hasLetter = /[a-zA-Z]/.test(newPassword);
    const hasSymbol = /[^a-zA-Z0-9]/.test(newPassword);

    if (newPassword.length < 6 || !hasLetter || !hasSymbol) {
      return setError('Password must contain at least 6 characters, including both letters and symbols.');
    }

    setLoadingPassword(true);
    setError('');
    setMessage('');

    try {
      const response = await api.put('/auth/update-password', { currentPassword, newPassword });
      if (response.data.success) {
        setMessage('Your password has been changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setLoadingPassword(false);
    }
  };

  return (
    <div className="min-h-[80vh] bg-slate-950 text-slate-100 py-12 px-6">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Title */}
        <div>
          <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest block mb-1">
            User Workspace
          </span>
          <h1 className="text-3xl font-black text-slate-100 tracking-tight">Account Settings</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
            Manage your personal profile values, system approvals, and account states.
          </p>
        </div>

        {/* Global Banner Messages */}
        {message && (
          <div className="bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 px-4 py-3.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 animate-pulse">
            <FiCheckCircle className="w-5 h-5 flex-shrink-0" />
            {message}
          </div>
        )}
        {error && (
          <div className="bg-red-500/10 border border-red-500/25 text-red-400 px-4 py-3.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 animate-pulse">
            <FiInfo className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left profile overview card */}
          <div className="md:col-span-1 glass-panel rounded-2xl p-6 border-slate-900 space-y-6 shadow-xl flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex flex-col items-center text-center space-y-3 pb-6 border-b border-slate-900">
                <div className="relative group">
                  {profilePic ? (
                    <img src={profilePic} alt="" className="w-20 h-20 rounded-2xl object-cover shadow-lg border border-slate-800" />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white font-extrabold text-2xl shadow-lg shadow-violet-500/10">
                      {name ? name.substring(0, 2).toUpperCase() : 'U'}
                    </div>
                  )}
                  <label className="absolute inset-0 w-20 h-20 bg-slate-950/70 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity border border-slate-800">
                    <FiCamera className="w-5 h-5 text-slate-200" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-200">{user?.name}</h3>
                  <span className="text-[10px] uppercase font-extrabold tracking-widest text-violet-400 font-mono mt-1 block">
                    {user?.role} Profile
                  </span>
                </div>
              </div>

              {/* Status information */}
              <div className="space-y-3.5 text-xs">
                <div className="flex justify-between items-center text-slate-400">
                  <span className="flex items-center gap-1.5"><FiMail /> Email</span>
                  <span className="text-slate-300 font-semibold line-clamp-1 max-w-[130px]">{user?.email}</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span className="flex items-center gap-1.5"><FiSliders /> Status</span>
                  <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 px-2 py-0.5 rounded uppercase text-[9px] font-bold font-mono">
                    {user?.status || 'approved'}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full mt-6 bg-red-955/20 hover:bg-red-955/50 border border-red-500/20 hover:border-red-500 text-red-400 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 transform active:scale-95 transition-all cursor-pointer"
            >
              <FiLogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          </div>

          {/* Right form editors */}
          <div className="md:col-span-2 space-y-8">
            {/* Edit Profile Form */}
            <form onSubmit={handleUpdateProfile} className="glass-panel rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
              <h2 className="text-base font-bold text-slate-200 flex items-center gap-2">
                <FiUser className="text-violet-400" /> Edit Profile Workspace
              </h2>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Full Name</label>
                  <input
                    type="text" required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-xs text-slate-200 focus:outline-none"
                    placeholder="Update name..."
                  />
                </div>

                {/* Profile Pic Upload Section */}
                <div className="space-y-2.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Profile Avatar</label>
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                    <input
                      type="url"
                      value={profilePic}
                      onChange={(e) => setProfilePic(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-850 rounded-xl p-3 text-xs text-slate-200 focus:outline-none placeholder-slate-650"
                      placeholder="Paste image URL (or upload local file)..."
                    />
                    <label className="bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white px-4 py-3 rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition-all">
                      <FiCamera /> {uploading ? 'Uploading...' : 'Upload Image'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Preset Avatars Selector */}
                <div className="space-y-2">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Or select a preset avatar:</span>
                  <div className="flex gap-3">
                    {PRESET_AVATARS.map((avatar) => (
                      <button
                        key={avatar.name}
                        type="button"
                        onClick={() => setProfilePic(avatar.url)}
                        className={`relative w-11 h-11 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${
                          profilePic === avatar.url ? 'border-violet-500 scale-105 shadow-md shadow-violet-500/10' : 'border-slate-850 hover:border-slate-600'
                        }`}
                        title={avatar.name}
                      >
                        <img src={avatar.url} alt="" className="w-full h-full object-cover" />
                        {profilePic === avatar.url && (
                          <div className="absolute inset-0 bg-violet-600/30 flex items-center justify-center text-white">
                            <FiCheck className="w-4 h-4" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-900 flex justify-end">
                <button
                  type="submit"
                  disabled={loadingProfile}
                  className="bg-violet-600 hover:bg-violet-500 text-white px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transform active:scale-95 transition-all shadow-lg shadow-violet-500/15 cursor-pointer"
                >
                  {loadingProfile ? 'Saving Workspace...' : 'Save Workspace'}
                </button>
              </div>
            </form>

            {/* Change Password Form */}
            <form onSubmit={handleUpdatePassword} className="glass-panel rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
              <h2 className="text-base font-bold text-slate-200 flex items-center gap-2">
                <FiLock className="text-violet-400" /> Change Account Password
              </h2>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Current Password</label>
                  <input
                    type="password" required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-xs text-slate-250 focus:outline-none"
                    placeholder="Enter current password..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">New Password</label>
                    <input
                      type="password" required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-xs text-slate-250 focus:outline-none"
                      placeholder="Enter new strong password..."
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Confirm New Password</label>
                    <input
                      type="password" required
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-xs text-slate-250 focus:outline-none"
                      placeholder="Confirm new password..."
                    />
                  </div>
                </div>

                <div className="bg-slate-950/40 border border-slate-900 rounded-xl p-3 flex gap-2 text-[10px] text-slate-500 leading-normal">
                  <FiInfo className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-slate-400 mb-0.5">Password Strength Rules:</p>
                    <p>* Must be at least 6 characters long.</p>
                    <p>* Must contain both letters (A-Z) and symbols/special characters (e.g. @, #, $, % etc.).</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-900 flex justify-end">
                <button
                  type="submit"
                  disabled={loadingPassword}
                  className="bg-violet-600 hover:bg-violet-500 text-white px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transform active:scale-95 transition-all shadow-lg shadow-violet-500/15 cursor-pointer"
                >
                  {loadingPassword ? 'Updating Password...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};
