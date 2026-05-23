import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiLock, FiUserPlus, FiAlertCircle, FiLoader, FiCheckCircle } from 'react-icons/fi';

export const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) {
      return setError('Please fill in all registration fields.');
    }

    if (password !== confirmPassword) {
      return setError('Passwords do not match.');
    }

    if (password.length < 6) {
      return setError('Password must be at least 6 characters long.');
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    const res = await register(name, email, password);
    setLoading(false);

    if (res.success) {
      setSuccessMsg(res.message || 'Account created successfully! Preparing your dashboard...');
      setTimeout(() => {
        if (res.user?.role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/courses');
        }
      }, 2000);
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-6 py-12 relative overflow-hidden bg-slate-950">
      
      {/* Background glow sphere */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-violet-600/5 rounded-full blur-[100px] pointer-events-none -z-10" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full glass-panel rounded-2xl p-8 border-slate-800/80 shadow-2xl relative"
      >
        
        {/* Title */}
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
            Create Account
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2">
            Create an account to browse available courses immediately.
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3.5 rounded-xl text-xs sm:text-sm flex items-start gap-2.5 leading-relaxed animate-shake">
            <FiAlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Modal / Message */}
        {successMsg && (
          <div className="mb-6 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-4 rounded-xl text-xs sm:text-sm flex items-start gap-2.5 leading-relaxed">
            <FiCheckCircle className="w-6 h-6 flex-shrink-0 text-emerald-400 animate-pulse mt-0.5" />
            <div>
              <strong className="block font-bold mb-1">Registration Received!</strong>
              <span>{successMsg}</span>
            </div>
          </div>
        )}

        {!successMsg || successMsg.includes('automatically') ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-widest block">
                Full Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <FiUser className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-650 focus:outline-none transition-colors shadow-inner"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-widest block">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <FiMail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-650 focus:outline-none transition-colors shadow-inner"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-widest block">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <FiLock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-650 focus:outline-none transition-colors shadow-inner"
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-widest block">
                Confirm Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <FiLock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-650 focus:outline-none transition-colors shadow-inner"
                />
              </div>
            </div>

            {/* Sign Up Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transform active:scale-[0.98] transition-all shadow-lg shadow-violet-500/10 hover:shadow-violet-500/20 mt-6"
            >
              {loading ? (
                <FiLoader className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <FiUserPlus className="w-4 h-4" /> Sign Up & Browse
                </>
              )}
            </button>

          </form>
        ) : (
          <div className="space-y-4">
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 py-3 rounded-xl font-semibold transition-all duration-200"
            >
              Go to Login Page
            </button>
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-8 text-center border-t border-slate-900 pt-6">
          <p className="text-xs text-slate-400">
            Already have an active registration?{' '}
            <Link
              to="/login"
              className="font-bold text-violet-400 hover:text-violet-300 transition-colors"
            >
              Sign In
            </Link>
          </p>
        </div>

      </motion.div>
    </div>
  );
};
