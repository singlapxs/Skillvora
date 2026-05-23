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

  // Open access to logged-in users; no account-wide approval constraints.

  // Admin routing verification
  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};
