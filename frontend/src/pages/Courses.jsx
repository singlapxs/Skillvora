import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiSliders, FiBookOpen, FiClock, FiGrid, FiList } from 'react-icons/fi';
import { api } from '../context/AuthContext';
import { CourseCardSkeleton } from '../components/common/Skeleton';

export const Courses = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [activeSort, setActiveSort] = useState('latest');

  // Fetch Categories and Courses
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const response = await api.get('/categories');
        if (response.data.success) {
          setCategories(response.data.data);
        }
      } catch (err) {
        console.error('[Courses Page Error] Failed to load categories:', err.message);
      }
    };
    fetchCats();
  }, []);

  // Fetch Courses with parameters
  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      try {
        const params = {};
        if (search) params.q = search;
        if (activeCategory) params.category = activeCategory;
        if (activeSort) params.sort = activeSort;

        const response = await api.get('/courses', { params });
        if (response.data.success) {
          setCourses(response.data.data);
        }
      } catch (error) {
        console.error('[Courses Page Error] Failed to fetch courses:', error.message);
      } finally {
        setLoading(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchCourses();
    }, 300); // Debounce search calls

    return () => clearTimeout(delayDebounceFn);
  }, [search, activeCategory, activeSort]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-6">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Page Title Header */}
        <div className="text-center sm:text-left">
          <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest block mb-1">
            Explore Curriculums
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-100 tracking-tight">
            All Study Folders
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Browse structured courses with step-by-step modular structures and downloadable notes.
          </p>
        </div>

        {/* Filter Controls Bar */}
        <div className="glass-panel rounded-2xl p-6 flex flex-col md:flex-row gap-4 items-center justify-between shadow-lg">
          
          {/* Search Input */}
          <div className="relative w-full md:max-w-md">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
              <FiSearch className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search courses..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-xl py-3 pl-10 pr-4 text-xs sm:text-sm text-slate-200 placeholder-slate-650 focus:outline-none transition-colors"
            />
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <span className="text-xs text-slate-400 flex items-center gap-1 font-semibold whitespace-nowrap">
              <FiSliders className="w-3.5 h-3.5" /> Sort By:
            </span>
            <select
              value={activeSort}
              onChange={(e) => setActiveSort(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-xs sm:text-sm text-slate-350 focus:border-violet-500 focus:outline-none transition-all shadow-inner"
            >
              <option value="latest">Latest Released</option>
              <option value="oldest">Oldest Released</option>
            </select>
          </div>

        </div>

        {/* Category Pills Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          <button
            onClick={() => setActiveCategory('')}
            className={`px-4.5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border transform active:scale-95 ${
              activeCategory === ''
                ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-500/10'
                : 'bg-slate-900 border-slate-850 hover:border-slate-700 text-slate-300'
            }`}
          >
            All Subjects
          </button>
          
          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => setActiveCategory(cat.slug)}
              className={`px-4.5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border transform active:scale-95 ${
                activeCategory === cat.slug
                  ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-500/10'
                  : 'bg-slate-900 border-slate-850 hover:border-slate-700 text-slate-300'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Course Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading ? (
            Array(6).fill(0).map((_, idx) => <CourseCardSkeleton key={idx} />)
          ) : courses.length > 0 ? (
            courses.map((c) => (
              <div
                key={c._id}
                className="glass-card rounded-2xl overflow-hidden flex flex-col h-[340px] relative group cursor-pointer"
                onClick={() => navigate(`/courses/${c._id}`)}
              >
                {/* Thumbnail */}
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

                {/* Detail Box */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-100 line-clamp-1 group-hover:text-violet-400 transition-colors duration-200">
                      {c.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-2 leading-relaxed">
                      {c.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 mt-4 border-t border-slate-900 pt-3">
                    <span className="flex items-center gap-1 font-medium">
                      <FiClock className="w-3.5 h-3.5 text-slate-400" /> {c.totalDuration || '0m'}
                    </span>
                    <span className="font-semibold text-violet-400 uppercase tracking-widest text-[9px] sm:text-[10px]">
                      Syllabus &rarr;
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center glass-panel rounded-2xl">
              <FiBookOpen className="w-12 h-12 text-slate-700 mx-auto mb-3 animate-pulse" />
              <p className="text-sm text-slate-400 font-semibold">No courses match your search criteria.</p>
              <button
                onClick={() => {
                  setSearch('');
                  setActiveCategory('');
                }}
                className="mt-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 px-5 py-2.5 rounded-xl text-xs font-semibold transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
