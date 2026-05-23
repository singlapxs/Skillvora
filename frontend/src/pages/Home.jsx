import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiBookOpen, FiActivity, FiUsers, FiAward, FiArrowRight, FiCheckCircle } from 'react-icons/fi';
import { api } from '../context/AuthContext';
import { useAuth } from '../context/AuthContext';
import { CourseCardSkeleton } from '../components/common/Skeleton';

export const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [featuredCourses, setFeaturedCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const response = await api.get('/courses?sort=latest');
        if (response.data.success) {
          // Take first 3 courses
          setFeaturedCourses(response.data.data.slice(0, 3));
        }
      } catch (error) {
        console.error('[Home Page Error] Failed to fetch featured courses:', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFeatured();
  }, []);

  const features = [
    {
      icon: <FiActivity className="w-5 h-5" />,
      title: 'Progress Tracking',
      desc: 'Never lose your place. Circular progress metrics and resume watching checkpoints save automatically.'
    },
    {
      icon: <FiUsers className="w-5 h-5" />,
      title: 'Admin Approval',
      desc: 'Secure enrollment workflows protect curriculum content. Admin manually reviews student credentials.'
    },
    {
      icon: <FiAward className="w-5 h-5" />,
      title: 'Built-in Document Reader',
      desc: 'Read course PDFs, assignments, and slides directly in your browser with secure overlay protections.'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between overflow-x-hidden">
      
      {/* Hero Section */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 px-6 flex flex-col items-center justify-center text-center overflow-hidden">
        
        {/* Glow Spheres */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] bg-violet-600/10 rounded-full blur-[100px] pointer-events-none -z-10" />

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto space-y-6"
        >
          <span className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full">
            <FiAward /> Next-Gen Learning Ecosystem
          </span>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.1] text-slate-100">
            Master Premium Skills at{' '}
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent">
              Your Own Pace
            </span>
          </h1>

          <p className="text-slate-400 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
            Welcome to Skillvora Academy. Watch expert-led lessons, track your module completions, view notes, and manage code folders in a gorgeous secure space.
          </p>

          <div className="flex flex-wrap justify-center items-center gap-4 pt-4">
            {user ? (
              <Link
                to={user.role === 'admin' ? '/admin/dashboard' : '/dashboard'}
                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white px-7 py-3 rounded-xl font-bold shadow-lg shadow-violet-500/10 hover:shadow-violet-500/20 flex items-center gap-2 transition-all transform hover:-translate-y-0.5"
              >
                Go to Dashboard <FiArrowRight />
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white px-7 py-3 rounded-xl font-bold shadow-lg shadow-violet-500/10 hover:shadow-violet-500/20 flex items-center gap-2 transition-all transform hover:-translate-y-0.5"
                >
                  Get Started <FiArrowRight />
                </Link>
                <Link
                  to="/courses"
                  className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 px-7 py-3 rounded-xl font-bold transition-all transform hover:-translate-y-0.5"
                >
                  Browse Courses
                </Link>
              </>
            )}
          </div>
        </motion.div>
      </section>

      {/* Feature Grids */}
      <section className="max-w-7xl mx-auto px-6 py-12 w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="glass-card rounded-2xl p-6 flex flex-col justify-between"
            >
              <div className="w-12 h-12 rounded-xl bg-violet-600/10 border border-violet-500/25 flex items-center justify-center text-violet-400 mb-6 shadow-md shadow-violet-500/5">
                {f.icon}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100 mb-2">{f.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Featured Courses Section */}
      <section className="max-w-7xl mx-auto px-6 py-16 w-full">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
          <div>
            <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest">
              Curriculum Highlight
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-100 mt-1">Featured Courseware</h2>
          </div>
          <Link
            to="/courses"
            className="text-sm font-semibold text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors"
          >
            View all courses <FiArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading ? (
            Array(3).fill(0).map((_, idx) => <CourseCardSkeleton key={idx} />)
          ) : featuredCourses.length > 0 ? (
            featuredCourses.map((c) => (
              <div
                key={c._id}
                className="glass-card rounded-2xl overflow-hidden flex flex-col h-[340px] relative group"
              >
                <div className="h-44 w-full relative overflow-hidden bg-slate-900 border-b border-slate-800">
                  <img
                    src={c.thumbnail}
                    alt={c.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent opacity-60" />
                  <span className="absolute bottom-4 left-4 bg-violet-600/90 text-white text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-md backdrop-blur-sm shadow-md">
                    {c.category?.name || 'Curriculum'}
                  </span>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-100 line-clamp-1 group-hover:text-violet-400 transition-colors duration-200">
                      {c.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-2 leading-relaxed">
                      {c.description}
                    </p>
                  </div>

                  <button
                    onClick={() => navigate(`/courses/${c._id}`)}
                    className="w-full bg-slate-900 hover:bg-violet-600 hover:text-white border border-slate-800 hover:border-violet-500 text-slate-200 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-200"
                  >
                    View Syllabus
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-12 text-center glass-panel rounded-2xl">
              <FiBookOpen className="w-12 h-12 text-slate-700 mx-auto mb-3 animate-pulse" />
              <p className="text-sm text-slate-500 font-medium">No courses have been published yet.</p>
              {user && user.role === 'admin' && (
                <Link
                  to="/admin/dashboard"
                  className="mt-4 inline-block bg-violet-600 text-white px-4 py-2 rounded-xl text-xs font-bold"
                >
                  Create Your First Course
                </Link>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Footer Area */}
      <footer className="w-full border-t border-slate-900 bg-slate-950 py-8 px-6 text-center text-xs text-slate-500">
        <p>&copy; {new Date().getFullYear()} Skillvora Academy. All rights reserved.</p>
        <p className="mt-1 text-[10px] text-slate-600">
          Powered by React, Express, MongoDB and Google Drive APIs. Secure content shield active.
        </p>
      </footer>

    </div>
  );
};
