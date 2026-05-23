import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FiChevronDown, FiChevronUp, FiPlayCircle, FiFileText, FiClock, FiBook, FiUser, FiActivity } from 'react-icons/fi';
import { api } from '../context/AuthContext';
import { useAuth } from '../context/AuthContext';

export const CourseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, setUser } = useAuth();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(null);
  const [expandedModules, setExpandedModules] = useState({});
  const [requestStatus, setRequestStatus] = useState(null);
  const [requestLoading, setRequestLoading] = useState(false);

  useEffect(() => {
    const fetchSyllabus = async () => {
      try {
        const response = await api.get(`/courses/${id}`);
        if (response.data.success) {
          const courseData = response.data.data;
          setCourse(courseData);
          
          // Expand first module by default
          if (courseData.modules && courseData.modules.length > 0) {
            setExpandedModules({ [courseData.modules[0]._id]: true });
          }
        }
      } catch (error) {
        console.error('[Course Details Error] Failed to fetch syllabus:', error.message);
      } finally {
        setLoading(false);
      }
    };

    const fetchProgress = async () => {
      if (!user || user.role === 'admin') return;

      // Skip progress checks if the student is not enrolled in this specific course
      const isEnrolled = user.enrolledCourses?.some(cId => (cId._id || cId).toString() === id.toString());
      if (!isEnrolled) return;

      try {
        const response = await api.get(`/progress/${id}`);
        if (response.data.success) {
          setProgress(response.data.data);
        }
      } catch (err) {
        // Safe to ignore
      }
    };

    const fetchRequestStatus = async () => {
      if (!user || user.role === 'admin') return;
      try {
        const response = await api.get(`/courses/${id}/request-status`);
        if (response.data.success) {
          setRequestStatus(response.data.data);
        }
      } catch (err) {
        // Safe to ignore
      }
    };

    const syncUserProfile = async () => {
      if (!user) return;
      try {
        const response = await api.get('/auth/me');
        if (response.data.success) {
          // Compare enrolled courses to prevent recursive context re-renders
          const currentEnrolled = (user.enrolledCourses || []).map(c => (c._id || c).toString()).sort().join(',');
          const newEnrolled = (response.data.user.enrolledCourses || []).map(c => (c._id || c).toString()).sort().join(',');
          
          if (currentEnrolled !== newEnrolled) {
            setUser(response.data.user);
          }
        }
      } catch (err) {
        // Safe to ignore
      }
    };

    fetchSyllabus();
    fetchProgress();
    fetchRequestStatus();
    syncUserProfile();
  }, [id, user]);

  const handleRequestAccess = async () => {
    setRequestLoading(true);
    try {
      const response = await api.post(`/courses/${id}/request`);
      if (response.data.success) {
        alert(response.data.message);
        setRequestStatus('pending');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Access request failed.');
    } finally {
      setRequestLoading(false);
    }
  };

  const toggleModule = (modId) => {
    setExpandedModules(prev => ({
      ...prev,
      [modId]: !prev[modId]
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <FiActivity className="w-10 h-10 animate-spin text-violet-500 mb-4" />
        <p className="text-sm font-semibold tracking-wide">Populating Course Syllabus...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 p-6 text-center">
        <h2 className="text-2xl font-bold text-slate-200 mb-2">Folder Not Found</h2>
        <p className="text-sm text-slate-500 mb-6">The course you are searching for does not exist in our systems.</p>
        <Link to="/courses" className="bg-violet-600 text-white px-6 py-2.5 rounded-xl font-bold">
          Back to Courses
        </Link>
      </div>
    );
  }

  const hasModules = course.modules && course.modules.length > 0;

  // Enforce button label dynamically
  const getEnrollmentButton = () => {
    if (!user) {
      return (
        <button
          onClick={() => navigate('/login')}
          className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-violet-500/10 flex items-center justify-center gap-2 transform active:scale-95 transition-all"
        >
          Sign In to Start Learning
        </button>
      );
    }

    if (user.role === 'admin') {
      return (
        <button
          onClick={() => navigate(`/watch/${course._id}`)}
          className="w-full bg-violet-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"
        >
          Watch Course (Admin Review)
        </button>
      );
    }

    // Check if student is enrolled in this specific course
    const isEnrolled = user.enrolledCourses?.some(id => (id._id || id).toString() === course._id.toString());
    if (user.role !== 'admin' && !isEnrolled) {
      if (requestStatus === 'pending') {
        return (
          <div className="w-full bg-slate-950/80 backdrop-blur-md border border-amber-500/20 py-3.5 px-4 rounded-xl font-bold text-center text-sm shadow-2xl flex flex-col items-center justify-center gap-1.5 animate-pulse">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-lg shadow-amber-500/50 animate-ping" />
              <span className="text-amber-400 text-xs font-black uppercase tracking-widest">
                Request Pending
              </span>
            </div>
            <span className="text-slate-400 text-[11px] font-semibold tracking-wide">
              Awaiting Admin Approval & Mail Dispatch
            </span>
          </div>
        );
      }

      return (
        <button
          onClick={handleRequestAccess}
          disabled={requestLoading}
          className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transform active:scale-95 transition-all shadow-lg shadow-violet-500/10 hover:shadow-violet-500/20 disabled:opacity-50"
        >
          {requestLoading ? 'Submitting Request...' : 'Enroll in Course'}
        </button>
      );
    }

    // Active student
    const isStarted = progress && progress.completedLectures?.length > 0;
    return (
      <button
        onClick={() => navigate(`/watch/${course._id}`)}
        className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transform active:scale-95 transition-all shadow-lg"
      >
        {isStarted ? 'Continue Learning' : 'Start Learning Now'}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main syllabus panel */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Header Card */}
          <div className="space-y-4">
            <span className="bg-violet-600/15 border border-violet-500/20 text-violet-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest px-3.5 py-1 rounded-md block w-fit">
              {course.category?.name || 'Curriculum'}
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-100 tracking-tight leading-tight">
              {course.title}
            </h1>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              {course.description}
            </p>
          </div>

          {/* Instructor & Stats */}
          <div className="flex flex-wrap items-center gap-6 p-4 rounded-xl bg-slate-900/30 border border-slate-900 text-xs sm:text-sm text-slate-350">
            <span className="flex items-center gap-2">
              <FiUser className="text-violet-400 w-4.5 h-4.5" />
              <span>Instructor: <strong className="text-slate-200">{course.instructor}</strong></span>
            </span>
            <span className="flex items-center gap-2">
              <FiClock className="text-violet-400 w-4.5 h-4.5" />
              <span>Duration: <strong className="text-slate-200">{course.totalDuration}</strong></span>
            </span>
            <span className="flex items-center gap-2">
              <FiBook className="text-violet-400 w-4.5 h-4.5" />
              <span>Modules: <strong className="text-slate-200">{course.modules?.length || 0} sections</strong></span>
            </span>
          </div>

          {/* Detailed Outline */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-100">Course Syllabus</h2>
            
            {hasModules ? (
              <div className="space-y-3">
                {course.modules.map((mod, mIdx) => {
                  const isExpanded = expandedModules[mod._id];
                  return (
                    <div key={mod._id} className="rounded-xl border border-slate-850 overflow-hidden bg-slate-900/10">
                      
                      {/* Module Header */}
                      <button
                        onClick={() => toggleModule(mod._id)}
                        className="w-full flex items-center justify-between p-4 bg-slate-900/40 hover:bg-slate-900/60 transition-colors text-left"
                      >
                        <div>
                          <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest block mb-0.5">
                            Module {mIdx + 1}
                          </span>
                          <h4 className="text-sm sm:text-base font-bold text-slate-200">{mod.title}</h4>
                        </div>
                        <div>
                          {isExpanded ? <FiChevronUp className="w-4 h-4 text-slate-400" /> : <FiChevronDown className="w-4 h-4 text-slate-400" />}
                        </div>
                      </button>

                      {/* Lectures Sub list */}
                      {isExpanded && (
                        <div className="divide-y divide-slate-900 border-t border-slate-900/60 bg-slate-950/20">
                          {mod.lectures && mod.lectures.length > 0 ? (
                            mod.lectures.map((lec, lIdx) => (
                              <div key={lec._id} className="p-3.5 flex items-center justify-between text-xs sm:text-sm text-slate-350 hover:bg-slate-900/10 transition-colors">
                                <div className="flex items-center space-x-3 pr-4">
                                  <span className="text-slate-500 flex-shrink-0">
                                    {lec.type === 'video' ? <FiPlayCircle className="w-4.5 h-4.5" /> : <FiFileText className="w-4.5 h-4.5" />}
                                  </span>
                                  <span className="font-semibold text-slate-300 line-clamp-1">{lec.title}</span>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-slate-500 whitespace-nowrap">
                                  {lec.fileSize && lec.type === 'pdf' && (
                                    <span className="bg-slate-800 text-[10px] px-1.5 py-0.5 rounded text-slate-400 font-mono">
                                      {lec.fileSize}
                                    </span>
                                  )}
                                  <span>{lec.duration || '0m'}</span>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="p-4 text-center text-xs text-slate-550 italic">
                              No lessons published in this section yet.
                            </div>
                          )}
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center glass-panel rounded-2xl text-slate-500 text-sm">
                Syllabus curriculum has not been finalized yet.
              </div>
            )}
          </div>

        </div>

        {/* Floating enrollment card (Right Sidebar) */}
        <div className="lg:col-span-1">
          <div className="sticky top-28 glass-card rounded-2xl overflow-hidden p-6 space-y-6">
            
            {/* Thumbnail Preview */}
            <div className="aspect-video w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-800 relative shadow-inner">
              <img
                src={course.thumbnail}
                alt={course.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent" />
            </div>

            {/* Launch / Enroll Controls */}
            <div className="space-y-4">
              {getEnrollmentButton()}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
