import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiBookOpen, FiLogOut, FiUser, FiSliders, FiMenu, FiSettings } from 'react-icons/fi';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setDropdownOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Logo and Brand */}
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-violet-500/20 transform group-hover:scale-105 transition-transform duration-300">
            <FiBookOpen className="w-5 h-5" />
          </div>
          <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 to-slate-200 bg-clip-text text-transparent">
            Skillvora
          </span>
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center space-x-8">
          <Link
            to="/"
            className={`text-sm font-medium tracking-wide transition-colors ${
              isActive('/') ? 'text-violet-400 font-semibold' : 'text-slate-300 hover:text-slate-100'
            }`}
          >
            Home
          </Link>
          <Link
            to="/courses"
            className={`text-sm font-medium tracking-wide transition-colors ${
              isActive('/courses') ? 'text-violet-400 font-semibold' : 'text-slate-300 hover:text-slate-100'
            }`}
          >
            All Courses
          </Link>

          {user && user.role === 'admin' && (
            <Link
              to="/admin/dashboard"
              className={`text-sm font-medium tracking-wide flex items-center gap-1 transition-colors ${
                location.pathname.startsWith('/admin') ? 'text-violet-400 font-semibold' : 'text-slate-300 hover:text-slate-100'
              }`}
            >
              <FiSliders className="w-4 h-4" /> Admin Portal
            </Link>
          )}

          {user && user.role === 'student' && (
            <Link
              to="/dashboard"
              className={`text-sm font-medium tracking-wide transition-colors ${
                isActive('/dashboard') ? 'text-violet-400 font-semibold' : 'text-slate-300 hover:text-slate-100'
              }`}
            >
              My Dashboard
            </Link>
          )}
        </div>

        {/* User Account Controls */}
        <div className="flex items-center space-x-4 relative" ref={dropdownRef}>
          {user ? (
            <div className="flex items-center space-x-4">
              <div className="hidden lg:flex flex-col text-right">
                <span className="text-sm font-semibold text-slate-200">{user.name}</span>
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-violet-400 font-mono">
                  {user.role}
                </span>
              </div>

              {/* Profile Toggle Avatar Button */}
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-black text-sm flex items-center justify-center cursor-pointer border border-violet-500/20 hover:border-violet-400/40 shadow-lg shadow-violet-500/5 transform active:scale-95 transition-all"
                title="Profile"
              >
                {user.name?.substring(0, 2).toUpperCase()}
              </button>

              {/* Dropdown Menu Overlay */}
              {dropdownOpen && (
                <div className="absolute right-0 top-12 w-64 glass-panel bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-2xl space-y-4 animate-in fade-in slide-in-from-top-2 duration-250 z-50">
                  {/* Student Details header */}
                  <div className="border-b border-slate-900 pb-3">
                    <span className="text-xs font-bold text-slate-200 block truncate">{user.name}</span>
                    <span className="text-[10px] text-slate-500 block truncate mt-0.5">{user.email}</span>
                    <span className="inline-block mt-2 bg-violet-500/10 border border-violet-500/20 text-violet-400 text-[9px] uppercase font-extrabold font-mono tracking-wider px-2 py-0.5 rounded">
                      {user.role} Status: {user.status || 'Active'}
                    </span>
                  </div>

                  {/* Actions Links */}
                  <div className="space-y-1.5">
                    {user.role === 'admin' ? (
                      <Link
                        to="/admin/dashboard"
                        className="flex items-center gap-2 p-2 rounded-xl text-xs font-bold text-slate-350 hover:bg-slate-900 hover:text-slate-100 transition-colors"
                      >
                        <FiSliders className="w-4 h-4 text-violet-450" /> Admin Console
                      </Link>
                    ) : (
                      <Link
                        to="/dashboard"
                        className="flex items-center gap-2 p-2 rounded-xl text-xs font-bold text-slate-350 hover:bg-slate-900 hover:text-slate-100 transition-colors"
                      >
                        <FiUser className="w-4 h-4 text-violet-450" /> My Dashboard
                      </Link>
                    )}

                    <Link
                      to="/settings"
                      className="flex items-center gap-2 p-2 rounded-xl text-xs font-bold text-slate-350 hover:bg-slate-900 hover:text-slate-100 transition-colors"
                    >
                      <FiSettings className="w-4 h-4 text-slate-450" /> Account Settings
                    </Link>
                  </div>

                  {/* Sign Out Trigger */}
                  <button
                    onClick={handleLogout}
                    className="w-full bg-slate-900 hover:bg-red-950/40 border border-slate-800 hover:border-red-500/30 text-slate-300 hover:text-red-400 p-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all duration-200"
                  >
                    <FiLogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <Link
                to="/login"
                className="text-slate-300 hover:text-slate-100 px-4 py-2 text-sm font-semibold transition-colors"
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-violet-500/10 hover:shadow-violet-500/20 transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>

      </div>
    </nav>
  );
};
