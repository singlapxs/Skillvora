import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiLoader, FiAlertTriangle } from 'react-icons/fi';

export const ProtectedRoute = ({ adminOnly = false }) => {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <FiLoader className="w-10 h-10 animate-spin text-violet-500 mb-4" />
        <p className="text-sm font-medium tracking-wide">Loading credentials...</p>
      </div>
    );
  }

  // Not logged in -> Go to Login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Handle student approval constraints
  if (user.role !== 'admin') {
    if (user.status === 'pending') {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
          <div className="max-w-md w-full glass-panel rounded-2xl p-8 text-center border-amber-500/30">
            <FiAlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-slate-100 mb-2">Approval Pending</h2>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              Your registration is currently under review by the system administrator. You will receive an email confirmation once your account has been approved.
            </p>
            <button
              onClick={logout}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 py-3 rounded-xl font-semibold transition-all duration-200"
            >
              Sign Out & Return Home
            </button>
          </div>
        </div>
      );
    }

    if (user.status === 'rejected') {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
          <div className="max-w-md w-full glass-panel rounded-2xl p-8 text-center border-red-500/30">
            <FiAlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-slate-100 mb-2">Enrollment Declined</h2>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              Your registration request was declined by the administrator. Please contact support or appeal this decision if you believe this was in error.
            </p>
            <button
              onClick={logout}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 py-3 rounded-xl font-semibold transition-all duration-200"
            >
              Sign Out
            </button>
          </div>
        </div>
      );
    }
  }

  // Admin routing verification
  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};
