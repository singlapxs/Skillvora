import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { VideoPlayer } from '../components/player/VideoPlayer';
import { PDFViewer } from '../components/player/PDFViewer';
import { SidebarLectures } from '../components/player/SidebarLectures';
import { api } from '../context/AuthContext';
import { useAuth } from '../context/AuthContext';
import { FiArrowLeft, FiMessageSquare, FiInfo, FiThumbsUp, FiThumbsDown, FiBookmark } from 'react-icons/fi';

export const WatchCourse = () => {
  const { id } = useParams(); // course ID
  const navigate = useNavigate();
  const { user } = useAuth();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(null);
  const [activeLecture, setActiveLecture] = useState(null);

  // Extra Features UI States
  const [activeTab, setActiveTab] = useState('notes');
  const [studentNotes, setStudentNotes] = useState('');
  const [likes, setLikes] = useState(14);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [comments, setComments] = useState([
    { id: 1, author: 'Pulkit', text: 'This MERN module is explained extremely clearly!', date: '2 days ago' },
    { id: 2, author: 'Admin', text: 'Glad you liked it! Let me know if you face any issues.', date: '1 day ago' }
  ]);
  const [newComment, setNewComment] = useState('');

  // Fetch Syllabus and Student Progress Checkpoints
  useEffect(() => {
    const fetchWatchData = async () => {
      try {
        // Fetch Course Syllabus
        const courseRes = await api.get(`/courses/${id}`);
        if (!courseRes.data.success) return;
        const courseData = courseRes.data.data;
        setCourse(courseData);

        // Fetch User Progress
        let completedList = [];
        let lastLecId = null;
        let lastTimestamp = 0;

        try {
          const progressRes = await api.get(`/progress/${id}`);
          if (progressRes.data.success) {
            const progData = progressRes.data.data;
            setProgress(progData);
            completedList = progData.completedLectures.map(l => l._id || l) || [];
            lastLecId = progData.lastWatchedLectureId?._id || progData.lastWatchedLectureId;
            lastTimestamp = progData.lastWatchedTimestamp || 0;
          }
        } catch (e) {
          // Ignored if progress is not set yet
        }

        // Determine active lecture (Requirement 5: Resume last watched position)
        let defaultLec = null;
        if (courseData.modules && courseData.modules.length > 0) {
          // Look for last watched lecture
          if (lastLecId) {
            // Find it in syllabus
            for (const mod of courseData.modules) {
              const matchedLec = mod.lectures.find(l => l._id === lastLecId);
              if (matchedLec) {
                defaultLec = matchedLec;
                break;
              }
            }
          }

          // Fallback to first lecture in first module
          if (!defaultLec && courseData.modules[0].lectures && courseData.modules[0].lectures.length > 0) {
            defaultLec = courseData.modules[0].lectures[0];
          }
        }

        setActiveLecture(defaultLec);

        // Save initial resume checkpoint on backend
        if (defaultLec) {
          await api.post(`/progress/${id}/resume`, {
            lectureId: defaultLec._id,
            timestamp: lastTimestamp
          });
        }

      } catch (error) {
        console.error('[Watch Course Page Error] Failed to populate player data:', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchWatchData();
  }, [id]);

  // Handle active lecture change
  const handleSelectLecture = async (lec) => {
    setActiveLecture(lec);
    try {
      // Save checkpoint on backend
      await api.post(`/progress/${id}/resume`, {
        lectureId: lec._id,
        timestamp: 0
      });
    } catch (err) {
      console.warn('[Checkpoint Save Failed]', err.message);
    }
  };

  // Toggle Completed checkbox on active or side list items
  const handleToggleComplete = async (lectureId) => {
    try {
      const response = await api.post(`/progress/${id}/lecture/${lectureId}/toggle`);
      if (response.data.success) {
        setProgress(response.data.data);
      }
    } catch (error) {
      console.error('[Progress Toggle Error] Action failed:', error.message);
    }
  };

  // Requirement 5: Auto-Next Lecture Trigger
  const handleAutoNext = async () => {
    if (!course || !activeLecture) return;
    
    let allLectures = [];
    course.modules.forEach(mod => {
      if (mod.lectures) {
        allLectures.push(...mod.lectures);
      }
    });

    const activeIndex = allLectures.findIndex(l => l._id === activeLecture._id);
    
    if (activeIndex !== -1 && activeIndex < allLectures.length - 1) {
      const nextLec = allLectures[activeIndex + 1];
      setActiveLecture(nextLec);
      try {
        await api.post(`/progress/${id}/resume`, {
          lectureId: nextLec._id,
          timestamp: 0
        });
      } catch (err) {
        // Safe to ignore
      }
    }
  };

  // Mark Completed & Trigger Auto-Next
  const handleMarkCompletedAndNext = async () => {
    if (!activeLecture) return;
    
    // Toggle completed if not already marked
    const isCompleted = progress?.completedLectures?.some(l => (l._id || l) === activeLecture._id);
    if (!isCompleted) {
      await handleToggleComplete(activeLecture._id);
    }

    // Auto next after 500ms
    setTimeout(() => {
      handleAutoNext();
    }, 500);
  };

  const handleLike = () => {
    if (liked) {
      setLiked(false);
      setLikes(prev => prev - 1);
    } else {
      setLiked(true);
      setLikes(prev => prev + 1);
      if (disliked) {
        setDisliked(false);
      }
    }
  };

  const handleDislike = () => {
    if (disliked) {
      setDisliked(false);
    } else {
      setDisliked(true);
      if (liked) {
        setLiked(false);
        setLikes(prev => prev - 1);
      }
    }
  };

  const handleAddComment = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setComments(prev => [
      ...prev,
      {
        id: Date.now(),
        author: user?.name || 'Student',
        text: newComment,
        date: 'Just now'
      }
    ]);
    setNewComment('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold tracking-wide">Syncing Playback Dashboard...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-slate-400">
        <h2 className="text-xl font-bold text-slate-200 mb-2">Watch Folder Offline</h2>
        <Link to="/courses" className="bg-slate-900 border border-slate-800 px-6 py-2.5 rounded-xl font-bold text-slate-200">
          Back to Catalog
        </Link>
      </div>
    );
  }

  const isLecCompleted = progress?.completedLectures?.some(l => (l._id || l) === activeLecture?._id);
  const completedList = progress?.completedLectures?.map(l => l._id || l) || [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col lg:flex-row">
      
      {/* 1. Sidebar Lectures navigation */}
      <div className="w-full lg:w-[350px] lg:flex-shrink-0 h-auto lg:h-[calc(100vh-73px)] border-b lg:border-b-0 lg:border-r border-slate-900 overflow-hidden">
        <SidebarLectures
          modules={course.modules}
          activeLectureId={activeLecture?._id}
          onSelectLecture={handleSelectLecture}
          completedLectures={completedList}
          onToggleComplete={handleToggleComplete}
          progressPercentage={progress?.progressPercentage || 0}
        />
      </div>

      {/* 2. Main Player Column */}
      <div className="flex-1 flex flex-col h-auto lg:h-[calc(100vh-73px)] overflow-y-auto p-4 sm:p-8">
        
        {/* Back Link */}
        <Link 
          to={`/courses/${course._id}`} 
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-200 mb-6 w-fit transition-colors"
        >
          <FiArrowLeft className="w-4 h-4" /> Back to Syllabus Detail
        </Link>

        {/* Dynamic Player Wrapper */}
        <div className="max-w-4xl w-full mx-auto space-y-6">
          
          {activeLecture ? (
            activeLecture.type === 'video' ? (
              <VideoPlayer
                videoUrl={activeLecture.videoUrl}
                onCompleted={handleMarkCompletedAndNext}
                isCompleted={isLecCompleted}
                title={activeLecture.title}
              />
            ) : (
              <PDFViewer
                fileUrl={activeLecture.fileUrl || activeLecture.videoUrl}
                title={activeLecture.title}
                fileSize={activeLecture.fileSize}
                lectureId={activeLecture._id}
                initialDownloadCount={activeLecture.downloadCount}
              />
            )
          ) : (
            <div className="aspect-video w-full glass-panel rounded-2xl flex flex-col items-center justify-center text-slate-500 gap-3 border-dashed border-slate-800">
              <FiInfo className="w-12 h-12 text-slate-700 animate-bounce" />
              <h3 className="text-base font-semibold">No Lecture Selected</h3>
              <p className="text-xs">Click a modular syllabus file in the sidebar to start watching.</p>
            </div>
          )}

          {/* Interactive Extra Tabs panel (Notes, Likes, Dislikes, Comments) */}
          <div className="glass-panel rounded-2xl border border-slate-850 p-6 space-y-6">
            
            {/* Tabs Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-900 pb-4">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setActiveTab('notes')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'notes' ? 'bg-violet-600/10 border border-violet-500/30 text-violet-400' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  My Notes
                </button>
                <button
                  onClick={() => setActiveTab('comments')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeTab === 'comments' ? 'bg-violet-600/10 border border-violet-500/30 text-violet-400' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FiMessageSquare className="w-3.5 h-3.5" /> Discussion ({comments.length})
                </button>
              </div>

              {/* Likes/Bookmarks */}
              <div className="flex items-center gap-2 text-xs">
                <button
                  onClick={handleLike}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border transition-all ${
                    liked ? 'bg-violet-600/10 border-violet-500/35 text-violet-400' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FiThumbsUp className="w-3.5 h-3.5" />
                  <span>{likes}</span>
                </button>
                <button
                  onClick={handleDislike}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border transition-all ${
                    disliked ? 'bg-red-500/10 border-red-500/35 text-red-400' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FiThumbsDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Tab Contents */}
            {activeTab === 'notes' ? (
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-200">Study Notepad</h4>
                <textarea
                  value={studentNotes}
                  onChange={(e) => setStudentNotes(e.target.value)}
                  placeholder="Draft personal code snippets or summaries. Content persists inside this browser session..."
                  className="w-full h-32 bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs sm:text-sm text-slate-200 placeholder-slate-650 focus:outline-none focus:border-violet-500 transition-colors shadow-inner"
                />
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* Add Comment */}
                <form onSubmit={handleAddComment} className="flex gap-3">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Ask a query or leave feedback..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-violet-500 transition-all"
                  />
                  <button
                    type="submit"
                    className="bg-violet-600 hover:bg-violet-500 text-white px-5 rounded-xl text-xs font-semibold shadow-lg shadow-violet-500/10"
                  >
                    Post
                  </button>
                </form>

                {/* Comment list */}
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="p-4 rounded-xl bg-slate-950/40 border border-slate-900 flex flex-col gap-1 text-xs sm:text-sm">
                      <div className="flex justify-between items-center text-xs">
                        <strong className="text-slate-250 font-bold">{comment.author}</strong>
                        <span className="text-slate-555 text-[10px]">{comment.date}</span>
                      </div>
                      <p className="text-slate-400 mt-1 leading-relaxed">{comment.text}</p>
                    </div>
                  ))}
                </div>

              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
};
