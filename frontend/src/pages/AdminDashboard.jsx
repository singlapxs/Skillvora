import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import { 
  FiUsers, FiLayers, FiFolder, FiFolderPlus, FiFilePlus, FiPlus, 
  FiTrash2, FiActivity, FiCheck, FiX, FiInfo, FiLink, FiEdit 
} from 'react-icons/fi';
import { DashboardWidgetSkeleton, UserRowSkeleton } from '../components/common/Skeleton';
import { Reorder } from 'framer-motion';

export const AdminDashboard = () => {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState('approvals');
  
  // States
  const [analytics, setAnalytics] = useState(null);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [courseRequests, setCourseRequests] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Form states
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [newCourse, setNewCourse] = useState({
    title: '', description: '', thumbnail: '', instructor: 'Admin', category: '', totalDuration: '2h 30m'
  });

  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState('');

  const [selectedModule, setSelectedModule] = useState(null);
  const [showLectureModal, setShowLectureModal] = useState(false);
  const [newLecture, setNewLecture] = useState({
    title: '', type: 'video', videoUrl: '', fileUrl: '', fileSize: '2.4 MB', duration: '10m', order: 0
  });
  const [lectureModalMode, setLectureModalMode] = useState('single'); // 'single' | 'bulk'
  const [bulkInput, setBulkInput] = useState('');

  // Pull Analytics, pending, and catalogue data
  const fetchData = async () => {
    try {
      const analyticRes = await api.get('/admin/analytics');
      if (analyticRes.data.success) setAnalytics(analyticRes.data.data);

      const pendingRes = await api.get('/admin/pending-users');
      if (pendingRes.data.success) setPendingUsers(pendingRes.data.data);

      const requestsRes = await api.get('/admin/course-requests');
      if (requestsRes.data.success) setCourseRequests(requestsRes.data.data);

      const userRes = await api.get('/admin/users');
      if (userRes.data.success) setAllUsers(userRes.data.data);

      const coursesRes = await api.get('/courses');
      if (coursesRes.data.success) setCourses(coursesRes.data.data);

      const catRes = await api.get('/categories');
      if (catRes.data.success) setCategories(catRes.data.data);
    } catch (err) {
      console.error('[Admin Panel Fetch Fail]', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 1. Pending Approvals API triggers (Requirement 26)
  const handleApprove = async (userId) => {
    setActionLoading(true);
    try {
      const res = await api.put(`/admin/approve/${userId}`);
      if (res.data.success) {
        alert(res.data.message);
        await fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Approval failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (userId) => {
    setActionLoading(true);
    try {
      const res = await api.put(`/admin/reject/${userId}`);
      if (res.data.success) {
        alert(res.data.message);
        await fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Decline failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEnroll = async (userId, courseId) => {
    setActionLoading(true);
    try {
      const res = await api.put(`/admin/users/${userId}/enroll`, { courseId });
      if (res.data.success) {
        alert(res.data.message);
        await fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Enrollment failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnenroll = async (userId, courseId) => {
    setActionLoading(true);
    try {
      const res = await api.put(`/admin/users/${userId}/unenroll`, { courseId });
      if (res.data.success) {
        alert(res.data.message);
        await fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Unenrollment failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveCourseRequest = async (requestId) => {
    setActionLoading(true);
    try {
      const res = await api.put(`/admin/course-requests/${requestId}/approve`);
      if (res.data.success) {
        alert(res.data.message);
        await fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Approval failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectCourseRequest = async (requestId) => {
    setActionLoading(true);
    try {
      const res = await api.put(`/admin/course-requests/${requestId}/reject`);
      if (res.data.success) {
        alert(res.data.message);
        await fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Decline failed');
    } finally {
      setActionLoading(false);
    }
  };

  // 2. Course Creation API trigger
  const handleCreateCourse = async (e) => {
    e.preventDefault();
    if (!newCourse.title || !newCourse.description || !newCourse.thumbnail || !newCourse.category) {
      return alert('Please fill in title, description, thumbnail URL, and category.');
    }

    try {
      const response = await api.post('/courses', newCourse);
      if (response.data.success) {
        alert('Course created successfully!');
        setShowCourseModal(false);
        setNewCourse({ title: '', description: '', thumbnail: '', instructor: 'Admin', category: '', totalDuration: '2h 30m' });
        await fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create course');
    }
  };

  // 3. Module Creation API trigger
  const handleCreateModule = async (e) => {
    e.preventDefault();
    if (!newModuleTitle || !selectedCourse) return;

    try {
      const response = await api.post(`/courses/${selectedCourse._id}/modules`, {
        title: newModuleTitle,
        order: selectedCourse.modules?.length || 0
      });
      if (response.data.success) {
        alert('Module added successfully!');
        setShowModuleModal(false);
        setNewModuleTitle('');
        
        // Refresh detailed view of the course
        const detailRes = await api.get(`/courses/${selectedCourse._id}`);
        setSelectedCourse(detailRes.data.data);
        await fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create module');
    }
  };

  // 4. Lecture Creation API trigger (handles automatic link conversion)
  const handleCreateLecture = async (e) => {
    e.preventDefault();
    if (!newLecture.title || !selectedModule) return;

    try {
      const response = await api.post(`/courses/modules/${selectedModule._id}/lectures`, {
        ...newLecture,
        order: selectedModule.lectures?.length || 0
      });
      if (response.data.success) {
        alert('Lecture created successfully!');
        setShowLectureModal(false);
        setNewLecture({ title: '', type: 'video', videoUrl: '', fileUrl: '', fileSize: '2.4 MB', duration: '10m', order: 0 });
        
        // Refresh detailed view
        const detailRes = await api.get(`/courses/${selectedCourse._id}`);
        setSelectedCourse(detailRes.data.data);
        await fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add lecture');
    }
  };

  const handleBulkCreateLectures = async (e) => {
    e.preventDefault();
    if (!bulkInput.trim() || !selectedModule) return;

    const lines = bulkInput.split('\n');
    const lectures = [];

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      let title = '';
      let videoUrl = '';

      if (trimmed.includes('|')) {
        const parts = trimmed.split('|');
        title = parts[0].trim();
        videoUrl = parts[1].trim();
      } else {
        videoUrl = trimmed;
        title = `Lesson ${selectedModule.lectures?.length + index + 1}`;
      }

      if (videoUrl) {
        lectures.push({
          title,
          type: 'video',
          videoUrl,
          duration: '10m',
          fileSize: '0 MB'
        });
      }
    });

    if (lectures.length === 0) {
      return alert('No valid videos found. Please use the format: Title | Link');
    }

    try {
      const response = await api.post(`/courses/modules/${selectedModule._id}/lectures/bulk`, { lectures });
      if (response.data.success) {
        alert(`Successfully added ${lectures.length} lessons!`);
        setShowLectureModal(false);
        setBulkInput('');
        setLectureModalMode('single');

        // Refresh detailed view
        const detailRes = await api.get(`/courses/${selectedCourse._id}`);
        setSelectedCourse(detailRes.data.data);
        await fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to bulk add lectures');
    }
  };

  // 5. Course Deletion API trigger
  const handleDeleteCourse = async (courseId) => {
    if (!confirm('Are you absolutely sure you want to delete this course and all nested materials?')) return;
    try {
      const response = await api.delete(`/courses/${courseId}`);
      if (response.data.success) {
        alert('Course and all its files deleted successfully.');
        setSelectedCourse(null);
        await fetchData();
      }
    } catch (err) {
      alert('Delete failed');
    }
  };

  const handleDeleteLecture = async (lectureId) => {
    if (!confirm('Are you absolutely sure you want to delete this lesson?')) return;
    try {
      const response = await api.delete(`/courses/lectures/${lectureId}`);
      if (response.data.success) {
        alert('Lesson deleted successfully.');
        // Refresh detailed view of the course
        const detailRes = await api.get(`/courses/${selectedCourse._id}`);
        setSelectedCourse(detailRes.data.data);
        await fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete lesson');
    }
  };

  const handleReorderLectures = (moduleId, reorderedLectures) => {
    const updatedModules = selectedCourse.modules.map(mod => {
      if (mod._id === moduleId) {
        return { ...mod, lectures: reorderedLectures };
      }
      return mod;
    });
    setSelectedCourse({ ...selectedCourse, modules: updatedModules });
  };

  const handleSaveLectureOrder = async (moduleId, currentLectures) => {
    try {
      const lectureIds = currentLectures.map(l => l._id);
      await api.put(`/courses/modules/${moduleId}/lectures/reorder`, { lectureIds });
      console.log(`[Reorder System] Persisted new lesson sequence for module: ${moduleId}`);
      await fetchData();
    } catch (err) {
      console.error('[Reorder System Error] Failed to persist new order:', err.message);
    }
  };

  const handleSelectCourseDetails = async (course) => {
    try {
      const res = await api.get(`/courses/${course._id}`);
      setSelectedCourse(res.data.data);
    } catch (err) {
      alert('Failed to load course outline');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <FiActivity className="w-10 h-10 animate-spin text-violet-500 mb-4" />
        <p className="text-sm font-semibold tracking-wide">Syncing Admin Control Board...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-6">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Title Banner */}
        <div>
          <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest block mb-1">
            System Administrator
          </span>
          <h1 className="text-3xl font-black text-slate-100 tracking-tight">Admin Console</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
            Approve enrollments, build deep modular course syllabi, and paste GDrive URL preview tokens.
          </p>
        </div>

        {/* Dynamic Metric Counter widgets (Requirement 26) */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
          <div className="glass-panel rounded-xl p-5 border-slate-850 flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Pending Review</span>
              <h3 className="text-xl font-extrabold text-amber-500">{analytics?.pendingCount || 0}</h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <FiUsers className="w-4 h-4" />
            </div>
          </div>

          <div className="glass-panel rounded-xl p-5 border-slate-850 flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Approved Students</span>
              <h3 className="text-xl font-extrabold text-emerald-500">{analytics?.approvedCount || 0}</h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-450">
              <FiUsers className="w-4 h-4" />
            </div>
          </div>

          <div className="glass-panel rounded-xl p-5 border-slate-850 flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Declined Students</span>
              <h3 className="text-xl font-extrabold text-red-500">{analytics?.rejectedCount || 0}</h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-450">
              <FiUsers className="w-4 h-4" />
            </div>
          </div>

          <div className="glass-panel rounded-xl p-5 border-slate-850 flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Courses</span>
              <h3 className="text-xl font-extrabold text-violet-400">{analytics?.totalCourses || 0}</h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-450">
              <FiLayers className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="flex border-b border-slate-900 overflow-x-auto pb-0.5">
          <button
            onClick={() => setActiveTab('approvals')}
            className={`px-6 py-3 border-b-2 text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${
              activeTab === 'approvals' ? 'border-violet-500 text-violet-450' : 'border-transparent text-slate-450 hover:text-slate-200'
            }`}
          >
            Pending Course Requests ({courseRequests.length})
          </button>
          <button
            onClick={() => setActiveTab('courses')}
            className={`px-6 py-3 border-b-2 text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${
              activeTab === 'courses' ? 'border-violet-500 text-violet-450' : 'border-transparent text-slate-450 hover:text-slate-200'
            }`}
          >
            Course Curriculum Creator
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`px-6 py-3 border-b-2 text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${
              activeTab === 'students' ? 'border-violet-500 text-violet-450' : 'border-transparent text-slate-450 hover:text-slate-200'
            }`}
          >
            Student Roster ({allUsers.length})
          </button>
        </div>

        {/* Tab contents */}

        {/* 1. Pending registrations approval list (Requirement 26) */}
        {activeTab === 'approvals' && (
          <div className="glass-panel rounded-2xl overflow-hidden shadow-xl">
            <div className="p-6 border-b border-slate-900 flex justify-between items-center">
              <h2 className="text-base font-bold text-slate-200">Pending Course Enrollment Requests</h2>
            </div>
            
            {courseRequests.length > 0 ? (
              <div className="divide-y divide-slate-900/60">
                {courseRequests.map((req) => (
                  <div key={req._id} className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs sm:text-sm">
                    <div>
                      <h4 className="font-extrabold text-slate-250 text-sm sm:text-base">{req.user?.name || 'Student'}</h4>
                      <p className="text-xs text-slate-400 mt-1">Email: {req.user?.email || 'N/A'}</p>
                      
                      <div className="mt-2.5 flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Requested Course:</span>
                        <span className="inline-flex items-center bg-violet-600/15 border border-violet-500/25 text-violet-400 px-2.5 py-0.5 rounded-lg text-xs font-semibold">
                          {req.course?.title || 'Unknown Course'}
                        </span>
                      </div>

                      <span className="text-[10px] text-slate-500 font-medium block mt-1.5">
                        Requested:{' '}
                        {new Date(req.createdAt).toLocaleDateString('en-US', {
                          dateStyle: 'medium'
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleApproveCourseRequest(req._id)}
                        disabled={actionLoading}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transform active:scale-95 transition-all shadow-lg shadow-emerald-500/10"
                      >
                        <FiCheck className="w-3.5 h-3.5" /> Approve Request
                      </button>
                      <button
                        onClick={() => handleRejectCourseRequest(req._id)}
                        disabled={actionLoading}
                        className="bg-red-950/40 hover:bg-red-950/70 border border-red-500/30 hover:border-red-500 text-red-400 px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transform active:scale-95 transition-all"
                      >
                        <FiX className="w-3.5 h-3.5" /> Decline Request
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center text-slate-500">
                <FiUsers className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                <p className="text-xs">No pending course enrollment requests found.</p>
              </div>
            )}
          </div>
        )}

        {/* 2. Course syllabus creator (Requirement 2 & 15) */}
        {activeTab === 'courses' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left sidebar: list courses */}
            <div className="lg:col-span-1 glass-panel rounded-2xl p-5 space-y-4 shadow-lg self-start">
              <div className="flex justify-between items-center pb-3 border-b border-slate-900">
                <h3 className="font-bold text-slate-200">Catalog Courses</h3>
                <button
                  onClick={() => setShowCourseModal(true)}
                  className="bg-violet-600 hover:bg-violet-500 text-white p-2 rounded-lg text-xs font-bold flex items-center gap-1"
                >
                  <FiPlus className="w-4 h-4" /> Add
                </button>
              </div>

              {courses.length > 0 ? (
                <div className="space-y-2">
                  {courses.map((c) => (
                    <button
                      key={c._id}
                      onClick={() => handleSelectCourseDetails(c)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start space-x-3 ${
                        selectedCourse?._id === c._id
                          ? 'bg-violet-950/20 border-violet-500/40 text-violet-400'
                          : 'bg-slate-950 border-slate-850 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 bg-slate-900 border border-slate-800">
                        <img src={c.thumbnail} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 pr-2">
                        <h4 className="text-xs sm:text-sm font-extrabold line-clamp-1">{c.title}</h4>
                        <span className="text-[10px] text-slate-400 block mt-1">Instructor: {c.instructor}</span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-555 text-center py-8">No courses available.</p>
              )}
            </div>

            {/* Right: course detail outlines builder */}
            <div className="lg:col-span-2 glass-panel rounded-2xl p-6 space-y-6 shadow-lg min-h-[400px]">
              {selectedCourse ? (
                <div className="space-y-6">
                  
                  {/* Selected course summary */}
                  <div className="flex justify-between items-start pb-4 border-b border-slate-900 gap-4">
                    <div>
                      <h3 className="text-lg font-black text-slate-100">{selectedCourse.title}</h3>
                      <p className="text-xs text-slate-400 mt-1">{selectedCourse.description}</p>
                    </div>
                    
                    <button
                      onClick={() => handleDeleteCourse(selectedCourse._id)}
                      className="bg-red-950/40 border border-red-500/25 text-red-400 p-2.5 rounded-xl hover:bg-red-950/80 transition-colors"
                      title="Delete Entire Course"
                    >
                      <FiTrash2 className="w-4.5 h-4.5" />
                    </button>
                  </div>

                  {/* Syllabus outline actions */}
                  <div className="flex justify-between items-center">
                    <h4 className="font-extrabold text-sm text-slate-200">Modules Outline</h4>
                    <button
                      onClick={() => setShowModuleModal(true)}
                      className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-350 hover:text-slate-100 px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <FiFolderPlus className="w-4 h-4" /> Add Section Module
                    </button>
                  </div>

                  {/* Modules nested loop */}
                  {selectedCourse.modules && selectedCourse.modules.length > 0 ? (
                    <div className="space-y-4">
                      {selectedCourse.modules.map((mod, modIdx) => (
                        <div key={mod._id} className="rounded-xl border border-slate-850 overflow-hidden bg-slate-950/20">
                          
                          {/* Module chapter header */}
                          <div className="p-4 bg-slate-900/40 border-b border-slate-900 flex justify-between items-center">
                            <div>
                              <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest block mb-0.5">
                                Module {modIdx + 1}
                              </span>
                              <h5 className="text-xs sm:text-sm font-extrabold text-slate-200">{mod.title}</h5>
                            </div>

                            <button
                              onClick={() => {
                                setSelectedModule(mod);
                                setLectureModalMode('single');
                                setBulkInput('');
                                setShowLectureModal(true);
                              }}
                              className="bg-violet-600/10 border border-violet-500/20 text-violet-400 hover:bg-violet-600 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all"
                            >
                              <FiFilePlus className="w-3.5 h-3.5" /> Add Lesson
                            </button>
                          </div>

                          {/* Lectures items lists (Drag-to-Reorder enabled using Framer Motion) */}
                          <Reorder.Group
                            axis="y"
                            values={mod.lectures || []}
                            onReorder={(newOrder) => handleReorderLectures(mod._id, newOrder)}
                            className="divide-y divide-slate-900"
                          >
                            {mod.lectures && mod.lectures.length > 0 ? (
                              mod.lectures.map((lec) => (
                                <Reorder.Item
                                  value={lec}
                                  key={lec._id}
                                  onDragEnd={() => handleSaveLectureOrder(mod._id, mod.lectures)}
                                  className="p-3.5 flex items-center justify-between text-xs sm:text-sm text-slate-350 hover:bg-slate-950/40 cursor-grab active:cursor-grabbing bg-slate-950/45 select-none"
                                >
                                  <div className="flex items-center space-x-2.5 pr-4 pointer-events-none">
                                    <span className="text-slate-500 flex items-center">
                                      <span className="mr-2 text-slate-600 font-bold select-none cursor-grab">⋮⋮</span>
                                      {lec.type === 'video' ? <FiInfo className="w-4 h-4" /> : <FiInfo className="w-4 h-4" />}
                                    </span>
                                    <span className="font-semibold text-slate-300 line-clamp-1">{lec.title}</span>
                                  </div>
                                  <div className="flex items-center gap-4 text-xs text-slate-500">
                                    {lec.fileSize && (
                                      <span className="bg-slate-800 text-[10px] px-1 rounded font-mono text-slate-400">{lec.fileSize}</span>
                                    )}
                                    <span>{lec.duration}</span>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteLecture(lec._id);
                                      }}
                                      className="text-slate-500 hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-red-500/10 cursor-pointer pointer-events-auto"
                                      title="Delete Lesson"
                                    >
                                      <FiTrash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </Reorder.Item>
                              ))
                            ) : (
                              <p className="p-4 text-center text-xs text-slate-500 italic pointer-events-none">No lessons in this module. Add one above.</p>
                            )}
                          </Reorder.Group>

                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl text-slate-500 text-xs">
                      No sections have been created for this course. Click add above to build outline.
                    </div>
                  )}

                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 py-16">
                  <FiLayers className="w-12 h-12 text-slate-700 animate-pulse mb-3" />
                  <p className="text-xs">Select a course in the left directory list to view or edit curriculum modules.</p>
                </div>
              )}
            </div>

          </div>
        )}

        {/* 3. Student Roster */}
        {activeTab === 'students' && (
          <div className="glass-panel rounded-2xl overflow-hidden shadow-xl">
            <div className="p-6 border-b border-slate-900">
              <h3 className="font-bold text-slate-200">Registered Accounts</h3>
            </div>
            
            <div className="divide-y divide-slate-900/60">
              {allUsers.map((u) => (
                <div key={u._id} className="p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs sm:text-sm">
                    <div>
                      <h4 className="font-extrabold text-slate-200 text-sm sm:text-base">{u.name}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">Email: {u.email}</p>
                      <span className="text-[10px] text-slate-500 mt-1 block uppercase font-mono tracking-wider">Role: {u.role}</span>
                    </div>

                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide font-mono ${
                      u.role === 'admin' 
                        ? 'bg-violet-500/10 border border-violet-500/20 text-violet-400' 
                        : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                    }`}>
                      {u.role}
                    </span>
                  </div>

                  {u.role === 'student' && (
                    <div className="pt-4 border-t border-slate-900 space-y-3">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                        Course Access Control
                      </span>
                      
                      <div className="flex flex-wrap items-center gap-2">
                        {u.enrolledCourses && u.enrolledCourses.length > 0 ? (
                          u.enrolledCourses.map((c) => (
                            <span 
                              key={c._id || c} 
                              className="inline-flex items-center gap-1.5 bg-violet-600/15 border border-violet-500/25 text-violet-400 px-3 py-1 rounded-xl text-xs font-semibold"
                            >
                              {c.title || 'Course'}
                              <button
                                onClick={() => handleUnenroll(u._id, c._id || c)}
                                disabled={actionLoading}
                                className="text-violet-400 hover:text-red-400 transition-colors p-0.5 rounded-full hover:bg-red-500/10"
                                title="Revoke access"
                              >
                                <FiX className="w-3.5 h-3.5" />
                              </button>
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-500 italic text-xs">No active course approvals. Student has catalog-only view.</span>
                        )}

                        <div className="ml-auto flex items-center gap-2 mt-2 sm:mt-0">
                          <select
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val) {
                                handleEnroll(u._id, val);
                                e.target.value = ''; // Reset select
                              }
                            }}
                            disabled={actionLoading}
                            className="bg-slate-950 border border-slate-850 hover:border-slate-700 rounded-xl py-1.5 px-3 text-xs text-slate-400 focus:outline-none focus:border-violet-500 transition-colors cursor-pointer"
                            defaultValue=""
                          >
                            <option value="" disabled>+ Approve Course Access</option>
                            {courses
                              .filter(course => !u.enrolledCourses?.some(ec => (ec._id || ec).toString() === course._id.toString()))
                              .map(course => (
                                <option key={course._id} value={course._id}>{course.title}</option>
                              ))
                            }
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* CREATION MODALS SECTION */}
      {/* ========================================================================= */}

      {/* Course Modal */}
      {showCourseModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-6">
          <form onSubmit={handleCreateCourse} className="max-w-md w-full glass-panel rounded-2xl p-6 border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <FiFolder className="text-violet-400" /> Create Course
            </h3>
            
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Title</label>
              <input
                type="text" required
                value={newCourse.title}
                onChange={(e) => setNewCourse(prev => ({ ...prev, title: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none"
                placeholder="e.g. MERN Stack Mastery"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Description</label>
              <textarea
                required
                value={newCourse.description}
                onChange={(e) => setNewCourse(prev => ({ ...prev, description: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 h-20 text-xs text-slate-200 placeholder-slate-600 focus:outline-none"
                placeholder="Course outline description..."
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Thumbnail (base64 or link)</label>
              <input
                type="text" required
                value={newCourse.thumbnail}
                onChange={(e) => setNewCourse(prev => ({ ...prev, thumbnail: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none"
                placeholder="e.g. https://images.unsplash.com/photo-..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Category</label>
                <select
                  required
                  value={newCourse.category}
                  onChange={(e) => setNewCourse(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-xs text-slate-350 focus:outline-none"
                >
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Duration</label>
                <input
                  type="text"
                  value={newCourse.totalDuration}
                  onChange={(e) => setNewCourse(prev => ({ ...prev, totalDuration: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none"
                  placeholder="e.g. 5h 30m"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-900">
              <button
                type="button"
                onClick={() => setShowCourseModal(false)}
                className="bg-slate-900 border border-slate-800 text-slate-300 px-4 py-2 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-violet-600 hover:bg-violet-500 text-white px-5 py-2 rounded-xl text-xs font-bold"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Module Modal */}
      {showModuleModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-6">
          <form onSubmit={handleCreateModule} className="max-w-md w-full glass-panel rounded-2xl p-6 border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <FiFolderPlus className="text-violet-400" /> Add Section Module
            </h3>
            
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Module Title</label>
              <input
                type="text" required
                value={newModuleTitle}
                onChange={(e) => setNewModuleTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-855 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-650 focus:outline-none"
                placeholder="e.g. Section 1: Intro to express routers"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-900">
              <button
                type="button"
                onClick={() => setShowModuleModal(false)}
                className="bg-slate-900 border border-slate-800 text-slate-300 px-4 py-2 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-violet-600 hover:bg-violet-500 text-white px-5 py-2 rounded-xl text-xs font-bold"
              >
                Create Module
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lecture Modal (Google Drive Paste URL input!) */}
      {showLectureModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-6 overflow-y-auto">
          <form onSubmit={lectureModalMode === 'bulk' ? handleBulkCreateLectures : handleCreateLecture} className={`max-w-${lectureModalMode === 'bulk' ? 'lg' : 'md'} w-full glass-panel rounded-2xl p-6 border-slate-800 space-y-4 self-start my-8`}>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <FiFilePlus className="text-violet-400" /> {lectureModalMode === 'bulk' ? 'Bulk Add Video Lessons' : 'Add Lesson Item'}
            </h3>

            {/* Mode Switcher Tabs */}
            <div className="flex border-b border-slate-900 pb-2">
              <button
                type="button"
                onClick={() => setLectureModalMode('single')}
                className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest border-b-2 transition-all ${
                  lectureModalMode === 'single' ? 'border-violet-500 text-violet-450' : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                Single Lesson
              </button>
              <button
                type="button"
                onClick={() => setLectureModalMode('bulk')}
                className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest border-b-2 transition-all ${
                  lectureModalMode === 'bulk' ? 'border-violet-500 text-violet-450' : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                Bulk Add Videos
              </button>
            </div>

            {lectureModalMode === 'bulk' ? (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Video List (Title | Link)</label>
                  <textarea
                    required
                    value={bulkInput}
                    onChange={(e) => setBulkInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-855 rounded-lg p-3 h-64 text-xs text-slate-200 placeholder-slate-600 focus:outline-none font-mono"
                    placeholder={`e.g.\nIntroduction to Course | https://drive.google.com/file/d/.../view\nSetting up Environment | https://drive.google.com/file/d/.../view`}
                  />
                  <div className="text-[10px] text-slate-500 space-y-1 mt-1 leading-normal">
                    <p>* Enter one video lesson per line.</p>
                    <p>* Format: <strong>Title | Link</strong></p>
                    <p>* If you only paste links, titles will be generated automatically (e.g. Lesson 1, Lesson 2).</p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Lesson Title</label>
                  <input
                    type="text" required
                    value={newLecture.title}
                    onChange={(e) => setNewLecture(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none"
                    placeholder="e.g. Setting up Express server"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Format Type</label>
                    <select
                      value={newLecture.type}
                      onChange={(e) => setNewLecture(prev => ({ ...prev, type: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-xs text-slate-350 focus:outline-none"
                    >
                      <option value="video">Google Drive Video</option>
                      <option value="pdf">Google Drive PDF</option>
                      <option value="notes">Notes / Text</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Duration</label>
                    <input
                      type="text"
                      value={newLecture.duration}
                      onChange={(e) => setNewLecture(prev => ({ ...prev, duration: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none"
                      placeholder="e.g. 15m"
                    />
                  </div>
                </div>

                {/* Google Drive pasting block (Requirement 4 & 27) */}
                {newLecture.type === 'video' ? (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-violet-400 uppercase tracking-widest flex items-center gap-1">
                      <FiLink /> Paste Google Drive Video Link
                    </label>
                    <input
                      type="url" required
                      value={newLecture.videoUrl}
                      onChange={(e) => setNewLecture(prev => ({ ...prev, videoUrl: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-650 focus:outline-none"
                      placeholder="https://drive.google.com/file/d/FILE_ID/view"
                    />
                    <span className="text-[9px] text-slate-500 block leading-tight">
                      * System will automatically convert GDrive url into embed preview format `/preview`.
                    </span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-violet-400 uppercase tracking-widest flex items-center gap-1">
                        <FiLink /> Paste Google Drive PDF/File Link
                      </label>
                      <input
                        type="url" required
                        value={newLecture.fileUrl}
                        onChange={(e) => setNewLecture(prev => ({ ...prev, fileUrl: e.target.value }))}
                        className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-650 focus:outline-none"
                        placeholder="https://drive.google.com/file/d/FILE_ID/view"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Estimated File Size</label>
                      <input
                        type="text"
                        value={newLecture.fileSize}
                        onChange={(e) => setNewLecture(prev => ({ ...prev, fileSize: e.target.value }))}
                        className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none"
                        placeholder="e.g. 3.2 MB"
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-900">
              <button
                type="button"
                onClick={() => setShowLectureModal(false)}
                className="bg-slate-900 border border-slate-800 text-slate-300 px-4 py-2 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-violet-600 hover:bg-violet-500 text-white px-5 py-2 rounded-xl text-xs font-bold transition-all"
              >
                {lectureModalMode === 'bulk' ? 'Save Lessons' : 'Save Lesson'}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
