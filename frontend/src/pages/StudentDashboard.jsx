import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiClock, FiActivity, FiFolder, FiCheckCircle, FiPlay, FiBook } from 'react-icons/fi';
import { api } from '../context/AuthContext';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

export const StudentDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeEnrollments, setActiveEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get('/progress/dashboard');
        if (response.data.success) {
          setActiveEnrollments(response.data.data);
        }
      } catch (error) {
        console.error('[Student Dashboard Error] Failed to fetch metrics:', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <FiActivity className="w-10 h-10 animate-spin text-violet-500 mb-4" />
        <p className="text-sm font-semibold tracking-wide">Populating Student Statistics...</p>
      </div>
    );
  }

  // Calculate generic aggregate stats
  const totalEnrolled = activeEnrollments.length;
  const completedCourses = activeEnrollments.filter(e => e.progressPercentage === 100).length;
  
  // Find "Continue Watching" item (most recently updated course progress node)
  const continueWatching = activeEnrollments.find(e => e.progressPercentage < 100 && e.lastWatchedLecture) || activeEnrollments[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-6">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest block mb-1">
              Student Center
            </span>
            <h1 className="text-3xl font-black text-slate-100 tracking-tight">
              Welcome back, {user?.name}!
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
              Review your course completion scores, bookmark links, and watch history checklist.
            </p>
          </div>
          <Link
            to="/courses"
            className="bg-slate-900 hover:bg-slate-800 border border-slate-800 px-5 py-2.5 rounded-xl text-xs font-semibold text-center transition-colors"
          >
            Explore More Subjects
          </Link>
        </div>

        {/* Aggregated Quick Metrics Widgets */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="glass-panel rounded-2xl p-6 flex items-center space-x-4 border-slate-850">
            <div className="w-12 h-12 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
              <FiFolder className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Enrolled Folders</span>
              <h3 className="text-2xl font-black text-slate-100 mt-0.5">{totalEnrolled}</h3>
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-6 flex items-center space-x-4 border-slate-850">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-450">
              <FiCheckCircle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Completed</span>
              <h3 className="text-2xl font-black text-slate-100 mt-0.5">{completedCourses}</h3>
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-6 flex items-center space-x-4 border-slate-850">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-450">
              <FiClock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Activity Status</span>
              <h3 className="text-sm font-extrabold text-emerald-400 mt-1 uppercase tracking-wide">Approved</h3>
            </div>
          </div>
        </div>

        {/* Continue Watching Focus Banner (Requirement 7) */}
        {continueWatching && (
          <div className="glass-panel rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row gap-6 items-center justify-between border-violet-500/20 bg-gradient-to-r from-slate-900/60 via-slate-900/40 to-violet-950/10">
            <div className="space-y-3 flex-1">
              <span className="bg-violet-600/20 text-violet-400 border border-violet-500/30 text-[9px] uppercase font-extrabold tracking-widest px-2.5 py-1 rounded-md block w-fit">
                Continue Watching
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-100">
                {continueWatching.course?.title}
              </h2>
              {continueWatching.lastWatchedLecture ? (
                <p className="text-xs sm:text-sm text-slate-400">
                  Last watched:{' '}
                  <strong className="text-slate-350">{continueWatching.lastWatchedLecture.title}</strong>
                </p>
              ) : (
                <p className="text-xs sm:text-sm text-slate-400">Launch lectures inside syllabus to begin.</p>
              )}
              
              {/* Progress bar */}
              <div className="space-y-1.5 max-w-md pt-2">
                <div className="flex justify-between text-xs font-semibold text-slate-500">
                  <span>Progress</span>
                  <span className="text-violet-400">{continueWatching.progressPercentage}%</span>
                </div>
                <div className="w-full bg-slate-850 h-2 rounded-full overflow-hidden border border-slate-800">
                  <div 
                    className="h-full bg-gradient-to-r from-violet-600 to-indigo-600 rounded-full"
                    style={{ width: `${continueWatching.progressPercentage}%` }}
                  />
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate(`/watch/${continueWatching.course?._id}`)}
              className="bg-violet-600 hover:bg-violet-500 text-white w-full md:w-auto px-8 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transform active:scale-95 transition-all shadow-lg shadow-violet-500/25"
            >
              <FiPlay className="w-4 h-4 fill-white" /> Resume Lecture
            </button>
          </div>
        )}

        {/* My Enrolled Course Grid */}
        <div className="space-y-6">
          <h2 className="text-xl font-black text-slate-100">My Enrolled Courses</h2>
          
          {totalEnrolled > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {activeEnrollments.map((enr) => (
                <div 
                  key={enr.course?._id}
                  className="glass-card rounded-2xl p-5 flex flex-col justify-between h-[180px] hover:border-slate-700/80 cursor-pointer"
                  onClick={() => navigate(`/watch/${enr.course?._id}`)}
                >
                  <div className="flex justify-between items-start">
                    <div className="pr-4">
                      <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest block mb-0.5">
                        {enr.course?.category?.name || 'Class'}
                      </span>
                      <h3 className="font-extrabold text-slate-200 line-clamp-1 text-sm sm:text-base leading-tight">
                        {enr.course?.title}
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-1">Instructor: {enr.course?.instructor}</p>
                    </div>
                    {/* Progress Circle visual */}
                    <div className="relative w-12 h-12 flex-shrink-0 flex items-center justify-center">
                      <svg className="w-12 h-12 transform -rotate-90">
                        <circle cx="24" cy="24" r="20" stroke="#1e293b" strokeWidth="3" fill="transparent" />
                        <circle cx="24" cy="24" r="20" stroke="#7c3aed" strokeWidth="3" fill="transparent"
                          strokeDasharray={2 * Math.PI * 20}
                          strokeDashoffset={2 * Math.PI * 20 * (1 - enr.progressPercentage / 100)}
                        />
                      </svg>
                      <span className="absolute text-[10px] font-extrabold text-slate-350">{enr.progressPercentage}%</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center border-t border-slate-900/60 pt-3">
                    <span className="text-slate-500 text-xs font-semibold flex items-center gap-1">
                      <FiBook className="w-4 h-4" /> Watch course syllabus
                    </span>
                    <span className="text-violet-400 font-bold uppercase tracking-wider text-[10px]">
                      Open Player &rarr;
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center glass-panel rounded-2xl text-slate-500">
              <FiBook className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <h3 className="text-base font-semibold mb-1">No Active Enrollments</h3>
              <p className="text-xs mb-6 max-w-sm mx-auto leading-relaxed">
                Choose a study catalog subject and begin loading lectures into your watching folders.
              </p>
              <Link to="/courses" className="bg-violet-600 text-white px-6 py-2.5 rounded-xl font-bold">
                Browse Curriculum Catalogue
              </Link>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
