import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { VideoPlayer } from '../components/player/VideoPlayer';
import { PDFViewer } from '../components/player/PDFViewer';
import { SidebarLectures } from '../components/player/SidebarLectures';
import { api } from '../context/AuthContext';
import { useAuth } from '../context/AuthContext';
import { FiArrowLeft, FiMessageSquare, FiInfo, FiThumbsUp, FiThumbsDown, FiBookmark, FiPlayCircle } from 'react-icons/fi';

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

  // Playback & Notes Bookmarks States
  const [playbackTime, setPlaybackTime] = useState(0); // in seconds
  const [playerStartTime, setPlayerStartTime] = useState(0); // to skip to in VideoPlayer
  const [noteTimeInput, setNoteTimeInput] = useState('00:00'); // current formatted capture text
  const [lectureNotes, setLectureNotes] = useState([]); // loaded saved bookmarks array

  // Client-side access guard: redirect non-enrolled students back to course overview
  useEffect(() => {
    if (user && user.role !== 'admin') {
      const isEnrolled = user.enrolledCourses?.some(cId => (cId._id || cId).toString() === id.toString());
      if (!isEnrolled) {
        alert('You are not enrolled in this course. Please contact the administrator for access.');
        navigate(`/courses/${id}`);
      }
    }
  }, [id, user, navigate]);

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

  // Load saved notes for the active lecture
  useEffect(() => {
    if (user && activeLecture) {
      const storageKey = `skillvora_notes_${user.id || user._id}_${activeLecture._id}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          setLectureNotes(JSON.parse(saved));
        } catch (e) {
          setLectureNotes([]);
        }
      } else {
        setLectureNotes([]);
      }
    }
  }, [user, activeLecture]);

  // Reset states on lecture change
  useEffect(() => {
    setPlaybackTime(0);
    setPlayerStartTime(0);
    setNoteTimeInput('00:00');
  }, [activeLecture]);

  // Handle progress updates directly from ReactPlayer
  const handleVideoProgress = (seconds) => {
    setPlaybackTime(seconds);
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (Math.floor(seconds) % 60).toString().padStart(2, '0');
    setNoteTimeInput(`${mins}:${secs}`);
  };

  // Helpers for time formatting
  const formatSeconds = (seconds) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const parseTimeToSeconds = (timeStr) => {
    const parts = timeStr.split(':');
    if (parts.length === 2) {
      const mins = parseInt(parts[0], 10) || 0;
      const secs = parseInt(parts[1], 10) || 0;
      return mins * 60 + secs;
    }
    const secs = parseInt(timeStr, 10);
    return isNaN(secs) ? 0 : secs;
  };

  const handleSaveNote = (e) => {
    e.preventDefault();
    if (!studentNotes.trim()) return;

    const seconds = parseTimeToSeconds(noteTimeInput);
    const formatted = formatSeconds(seconds);
    
    const newNote = {
      id: Date.now(),
      text: studentNotes,
      time: seconds,
      formattedTime: formatted,
      createdAt: new Date().toLocaleDateString()
    };

    const updatedNotes = [...lectureNotes, newNote].sort((a, b) => a.time - b.time);
    setLectureNotes(updatedNotes);
    setStudentNotes('');

    if (user && activeLecture) {
      const storageKey = `skillvora_notes_${user.id || user._id}_${activeLecture._id}`;
      localStorage.setItem(storageKey, JSON.stringify(updatedNotes));
    }
  };

  const handleDeleteNote = (noteId) => {
    const updatedNotes = lectureNotes.filter(n => n.id !== noteId);
    setLectureNotes(updatedNotes);

    if (user && activeLecture) {
      const storageKey = `skillvora_notes_${user.id || user._id}_${activeLecture._id}`;
      localStorage.setItem(storageKey, JSON.stringify(updatedNotes));
    }
  };

  const handleJumpToNoteTime = (seconds) => {
    setPlayerStartTime(seconds);
    setPlaybackTime(seconds);
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    setNoteTimeInput(`${mins}:${secs}`);
  };

  const downloadCertificate = () => {
    if (!course || !user) return;

    // Create the canvas element
    const canvas = document.createElement('canvas');
    canvas.width = 1600;
    canvas.height = 1130;
    const ctx = canvas.getContext('2d');

    // 1. Draw elegant Slate-950 dark background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    bgGrad.addColorStop(0, '#020617'); // slate-950
    bgGrad.addColorStop(0.5, '#0b0f19');
    bgGrad.addColorStop(1, '#1e1b4b'); // indigo-950
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Draw triple-layered glowing linear gradient borders
    const borderGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    borderGrad.addColorStop(0, '#8b5cf6'); // violet-500
    borderGrad.addColorStop(0.5, '#6366f1'); // indigo-500
    borderGrad.addColorStop(1, '#06b6d4'); // cyan-500
    
    ctx.strokeStyle = borderGrad;
    ctx.lineWidth = 14;
    ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);

    // Inner thin border (Slate-800)
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.strokeRect(55, 55, canvas.width - 110, canvas.height - 110);

    // Golden dotted decorative frame
    ctx.strokeStyle = '#eab308'; // yellow-500
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 8]);
    ctx.strokeRect(70, 70, canvas.width - 140, canvas.height - 140);
    ctx.setLineDash([]); // reset dash

    // 3. Draw elegant golden corner vector flourishes
    const drawCornerFlourish = (x, y, scaleX, scaleY) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scaleX, scaleY);
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, 40);
      ctx.lineTo(0, 0);
      ctx.lineTo(40, 0);
      ctx.stroke();

      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(10, 50);
      ctx.lineTo(10, 10);
      ctx.lineTo(50, 10);
      ctx.stroke();
      ctx.restore();
    };

    drawCornerFlourish(85, 85, 1, 1);       // Top-Left
    drawCornerFlourish(canvas.width - 85, 85, -1, 1); // Top-Right
    drawCornerFlourish(85, canvas.height - 85, 1, -1); // Bottom-Left
    drawCornerFlourish(canvas.width - 85, canvas.height - 85, -1, -1); // Bottom-Right

    // 4. Draw certificate header
    ctx.shadowColor = 'rgba(139, 92, 246, 0.4)';
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#f8fafc'; // slate-50
    ctx.font = '900 48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CERTIFICATE OF COMPLETION', canvas.width / 2, 200);
    ctx.shadowBlur = 0; // reset shadow

    // Subtitle
    ctx.fillStyle = '#94a3b8'; // slate-400
    ctx.font = '600 20px sans-serif';
    ctx.fillText('THIS IS PROUDLY PRESENTED TO', canvas.width / 2, 270);

    // 5. Draw Student Name (Vibrant gold gradient, massive size)
    const nameGrad = ctx.createLinearGradient(canvas.width / 2 - 300, 0, canvas.width / 2 + 300, 0);
    nameGrad.addColorStop(0, '#fef08a'); // yellow-200
    nameGrad.addColorStop(0.5, '#eab308'); // yellow-500
    nameGrad.addColorStop(1, '#ca8a04'); // yellow-600

    ctx.fillStyle = nameGrad;
    ctx.font = '900 84px sans-serif';
    ctx.shadowColor = 'rgba(234, 179, 8, 0.25)';
    ctx.shadowBlur = 20;
    ctx.fillText(user.name, canvas.width / 2, 400);
    ctx.shadowBlur = 0; // reset

    // Underline for student name
    ctx.strokeStyle = borderGrad;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2 - 250, 435);
    ctx.lineTo(canvas.width / 2 + 250, 435);
    ctx.stroke();

    // 6. Draw Course Completion Text
    ctx.fillStyle = '#cbd5e1'; // slate-300
    ctx.font = '500 24px sans-serif';
    ctx.fillText('for successfully completing all modular syllabus outlines and lectures of', canvas.width / 2, 530);

    // Course Title (Vibrant violet/cyan gradient)
    const titleGrad = ctx.createLinearGradient(canvas.width / 2 - 400, 0, canvas.width / 2 + 400, 0);
    titleGrad.addColorStop(0, '#a78bfa'); // violet-400
    titleGrad.addColorStop(1, '#22d3ee'); // cyan-400
    ctx.fillStyle = titleGrad;
    ctx.font = '900 52px sans-serif';
    ctx.shadowColor = 'rgba(167, 139, 250, 0.3)';
    ctx.shadowBlur = 12;
    ctx.fillText(course.title, canvas.width / 2, 630);
    ctx.shadowBlur = 0; // reset

    // Academy context
    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 20px sans-serif';
    ctx.fillText(`Issued by Skillvora Academy on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, canvas.width / 2, 720);

    // 7. Draw bottom row elements
    // Left: Signature Line 1 (Academy Registrar)
    ctx.strokeStyle = '#334155'; // slate-700
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(250, 930);
    ctx.lineTo(500, 930);
    ctx.stroke();

    ctx.fillStyle = '#e2e8f0'; // slate-200
    ctx.font = 'italic 26px sans-serif';
    ctx.fillText('Skillvora Academy', 375, 915);
    ctx.fillStyle = '#64748b'; // slate-500
    ctx.font = '600 16px sans-serif';
    ctx.fillText('Academy Registrar', 375, 960);

    // Center: Verified Gold Graduate Seal Emblem
    ctx.shadowColor = 'rgba(234, 179, 8, 0.3)';
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.arc(canvas.width / 2, 890, 60, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw seal inner details (double outline + ribbon tails)
    ctx.strokeStyle = '#78350f'; // amber-900
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(canvas.width / 2, 890, 50, 0, Math.PI * 2);
    ctx.stroke();

    // Ribbon tails
    ctx.fillStyle = '#ca8a04';
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2 - 35, 940);
    ctx.lineTo(canvas.width / 2 - 50, 1010);
    ctx.lineTo(canvas.width / 2 - 15, 995);
    ctx.lineTo(canvas.width / 2 + 10, 1010);
    ctx.lineTo(canvas.width / 2 - 5, 940);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(canvas.width / 2 + 5, 940);
    ctx.lineTo(canvas.width / 2 - 10, 1010);
    ctx.lineTo(canvas.width / 2 + 15, 995);
    ctx.lineTo(canvas.width / 2 + 50, 1010);
    ctx.lineTo(canvas.width / 2 + 35, 940);
    ctx.closePath();
    ctx.fill();

    // Text inside seal
    ctx.fillStyle = '#78350f';
    ctx.font = '900 14px sans-serif';
    ctx.fillText('VERIFIED', canvas.width / 2, 885);
    ctx.fillText('GRADUATE', canvas.width / 2, 905);

    // Right: Signature Line 2 (Lead Instructor)
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(1100, 930);
    ctx.lineTo(1350, 930);
    ctx.stroke();

    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'italic 26px sans-serif';
    ctx.fillText(course.instructor || 'Lead Instructor', 1225, 915);
    ctx.fillStyle = '#64748b';
    ctx.font = '600 16px sans-serif';
    ctx.fillText('Lead Instructor', 1225, 960);

    // 8. Unique Certificate Hash ID at the top right corner
    const certHash = `CERT-SV-${course._id.substring(18).toUpperCase()}-${(user.id || user._id).substring(18).toUpperCase()}`;
    ctx.textAlign = 'right';
    ctx.fillStyle = '#475569'; // slate-600
    ctx.font = 'bold 15px monospace';
    ctx.fillText(certHash, canvas.width - 100, 120);

    // 9. Download file trigger
    const image = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `Skillvora_Certificate_${course.title.replace(/\s+/g, '_')}.png`;
    link.href = image;
    link.click();
  };

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
          onDownloadCertificate={downloadCertificate}
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
                onProgress={handleVideoProgress}
                startTime={playerStartTime}
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
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-black text-slate-200">Study Notepad & Bookmarks</h4>
                    <p className="text-[11px] text-slate-550">
                      Write notes synced to the video playhead. Click any timestamp badge to skip the video to that second.
                    </p>
                  </div>
                  {activeLecture?.type === 'video' && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-400">Current playhead:</span>
                      <span className="px-2.5 py-1 bg-slate-900 text-violet-400 font-mono text-xs font-black border border-slate-800 rounded-lg">
                        {noteTimeInput}
                      </span>
                    </div>
                  )}
                </div>

                {/* Note Editor Form */}
                <form onSubmit={handleSaveNote} className="space-y-4 bg-slate-950/40 p-4 rounded-xl border border-slate-900">
                  <div className="flex flex-col sm:flex-row gap-3">
                    {activeLecture?.type === 'video' && (
                      <div className="sm:w-44 flex flex-col gap-1.5">
                        <label className="text-[9px] font-extrabold uppercase text-slate-500 tracking-wider">Timestamp</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={noteTimeInput}
                            onChange={(e) => setNoteTimeInput(e.target.value)}
                            placeholder="MM:SS"
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono font-bold text-violet-400 focus:outline-none focus:border-violet-500 text-center"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const mins = Math.floor(playbackTime / 60).toString().padStart(2, '0');
                              const secs = (playbackTime % 60).toString().padStart(2, '0');
                              setNoteTimeInput(`${mins}:${secs}`);
                            }}
                            title="Capture current video frame"
                            className="bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-350 p-2 rounded-lg text-xs font-extrabold flex items-center justify-center cursor-pointer"
                          >
                            <FiBookmark />
                          </button>
                        </div>
                      </div>
                    )}
                    <div className="flex-1 flex flex-col gap-1.5">
                      <label className="text-[9px] font-extrabold uppercase text-slate-500 tracking-wider">Note Content</label>
                      <textarea
                        value={studentNotes}
                        onChange={(e) => setStudentNotes(e.target.value)}
                        placeholder="Type personal bookmark notes, code snippets, or annotations..."
                        className="w-full h-16 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-650 focus:outline-none focus:border-violet-500 transition-colors resize-none"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={!studentNotes.trim()}
                      className="bg-violet-600 hover:bg-violet-500 disabled:bg-slate-900 text-white disabled:text-slate-500 px-5 py-2.5 rounded-lg text-xs font-bold transition-all shadow-md shadow-violet-500/10 cursor-pointer"
                    >
                      Save Bookmark Note
                    </button>
                  </div>
                </form>

                {/* Saved Bookmark Cards Stack */}
                <div className="space-y-3">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                    Saved Notes ({lectureNotes.length})
                  </span>
                  
                  {lectureNotes.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3 max-h-80 overflow-y-auto pr-1">
                      {lectureNotes.map((note) => (
                        <div key={note.id} className="p-3.5 rounded-xl bg-slate-950/30 border border-slate-900/60 hover:border-slate-800/80 transition-all flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <button
                              onClick={() => handleJumpToNoteTime(note.time)}
                              title={`Jump video player to ${note.formattedTime}`}
                              className="px-2 py-1 bg-violet-600/10 hover:bg-violet-600/20 border border-violet-500/30 text-violet-400 font-mono text-[10px] font-black rounded-md flex items-center gap-1 transition-colors flex-shrink-0 cursor-pointer"
                            >
                              <FiPlayCircle className="w-3.5 h-3.5" />
                              <span>{note.formattedTime}</span>
                            </button>
                            <p className="text-xs text-slate-350 leading-relaxed font-semibold pt-0.5 break-all">
                              {note.text}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            title="Remove Note Bookmark"
                            className="text-slate-650 hover:text-red-400 text-lg transition-colors cursor-pointer"
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-10 text-center rounded-xl bg-slate-950/20 border border-dashed border-slate-850">
                      <FiBookmark className="w-8 h-8 text-slate-800 mx-auto mb-2" />
                      <p className="text-xs text-slate-500">No notes written for this lecture yet.</p>
                      <p className="text-[10px] text-slate-600 mt-1">Capture timestamps and record summary checkpoints above.</p>
                    </div>
                  )}
                </div>
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
