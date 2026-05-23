import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FiUser, FiMail, FiSliders, FiLogOut, FiCheckCircle } from 'react-icons/fi';

export const Settings = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-[80vh] bg-slate-950 text-slate-100 py-12 px-6">
      <div className="max-w-2xl mx-auto space-y-8">
        
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

        {/* Profile Card */}
        <div className="glass-panel rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex items-center space-x-4 border-b border-slate-900 pb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-violet-500/10">
              {user?.name?.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-200">{user?.name}</h3>
              <span className="text-xs uppercase font-extrabold tracking-widest text-violet-400 font-mono mt-1 block">
                {user?.role} Profile
              </span>
            </div>
          </div>

          {/* Account Details list */}
          <div className="space-y-4 text-xs sm:text-sm">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/40 border border-slate-900">
              <span className="text-slate-500 font-semibold flex items-center gap-2">
                <FiMail className="w-4 h-4 text-slate-450" /> Email Address
              </span>
              <strong className="text-slate-300">{user?.email}</strong>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/40 border border-slate-900">
              <span className="text-slate-500 font-semibold flex items-center gap-2">
                <FiSliders className="w-4 h-4 text-slate-450" /> Status Badge
              </span>
              <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 px-2.5 py-0.5 rounded-md uppercase text-[10px] font-bold font-mono">
                {user?.status || 'approved'}
              </span>
            </div>

            {user?.approvedAt && (
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/40 border border-slate-900">
                <span className="text-slate-500 font-semibold flex items-center gap-2">
                  <FiCheckCircle className="w-4 h-4 text-slate-450" /> Enrollment Approved At
                </span>
                <strong className="text-slate-350">
                  {new Date(user.approvedAt).toLocaleDateString('en-US', {
                    dateStyle: 'long'
                  })}
                </strong>
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-slate-900 flex justify-end">
            <button
              onClick={handleLogout}
              className="bg-red-950/40 hover:bg-red-950/75 border border-red-500/35 text-red-400 px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transform active:scale-95 transition-all"
            >
              <FiLogOut className="w-4 h-4" /> Sign Out from Workspace
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
