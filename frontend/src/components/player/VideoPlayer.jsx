import React, { useEffect, useState, useRef } from 'react';
import { Watermark } from './Watermark';
import { FiShield, FiCheckCircle, FiClock, FiPauseCircle, FiPlayCircle } from 'react-icons/fi';

export const VideoPlayer = ({ videoUrl, onCompleted, isCompleted, title, duration }) => {
  const [blocked, setBlocked] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [timerActive, setTimerActive] = useState(true);
  
  // Extract Drive ID to create reliable preview embed
  const extractDriveId = (url) => {
    if (!url) return null;
    const patterns = [
      /\/file\/d\/([a-zA-Z0-9_-]+)/, 
      /id=([a-zA-Z0-9_-]+)/,         
      /\/d\/([a-zA-Z0-9_-]+)/        
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  };

  const driveId = extractDriveId(videoUrl);
  const previewUrl = driveId ? `https://drive.google.com/file/d/${driveId}/preview` : videoUrl;

  // Parse duration "15m 30s" to seconds
  useEffect(() => {
    if (duration && !isCompleted) {
      let totalSeconds = 0;
      const minMatch = duration.match(/(\d+)m/);
      const secMatch = duration.match(/(\d+)s/);
      
      if (minMatch) totalSeconds += parseInt(minMatch[1]) * 60;
      if (secMatch) totalSeconds += parseInt(secMatch[1]);
      
      if (totalSeconds > 0) {
        setTimeLeft(totalSeconds);
        setTimerActive(true);
      } else {
        setTimeLeft(null);
      }
    } else {
      setTimeLeft(null);
    }
  }, [duration, isCompleted, videoUrl]);

  // Handle countdown and auto-switch
  useEffect(() => {
    let interval = null;
    if (timerActive && timeLeft !== null && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setTimerActive(false);
      onCompleted(); // Auto-switch when timer hits 0
    }
    
    return () => clearInterval(interval);
  }, [timerActive, timeLeft, onCompleted]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Requirement 27: Keyboard shortcuts inspection locking
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
        (e.ctrlKey && e.key === 'u')
      ) {
        e.preventDefault();
        setBlocked(true);
        setTimeout(() => setBlocked(false), 3000);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleContextMenu = (e) => {
    e.preventDefault();
    setBlocked(true);
    setTimeout(() => setBlocked(false), 3000);
  };

  return (
    <div className="flex flex-col w-full">
      {/* Player Frame */}
      <div 
        onContextMenu={handleContextMenu}
        className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl transition-all duration-300"
      >
        {blocked && (
          <div className="absolute top-4 left-4 right-4 z-30 bg-red-600/90 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 backdrop-blur-sm animate-bounce shadow-lg">
            <FiShield className="w-5 h-5 flex-shrink-0" />
            <span>Developer console and source downloads are disabled to protect course content piracy.</span>
          </div>
        )}

        <Watermark />

        {videoUrl ? (
          <iframe
            key={previewUrl}
            src={previewUrl}
            className="w-full h-full border-none select-none"
            allow="autoplay; fullscreen"
            allowFullScreen
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
            title={title}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-2">
            <FiShield className="w-12 h-12 text-slate-700 animate-pulse" />
            <p className="text-sm">Video feed offline. File link sharing must be allowed.</p>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-xl bg-slate-900/40 border border-slate-850">
        <div>
          <h2 className="text-lg font-bold text-slate-100">{title || 'Playing Lecture'}</h2>
          <p className="text-xs text-slate-500 mt-1">
            Google Drive playback active. Use the player's built-in gear icon to adjust speed and quality.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {timeLeft !== null && !isCompleted && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/50 border border-slate-700">
              <button 
                onClick={() => setTimerActive(!timerActive)}
                className="text-slate-400 hover:text-violet-400 transition-colors"
                title={timerActive ? "Pause Auto-Switch Timer" : "Resume Auto-Switch Timer"}
              >
                {timerActive ? <FiPauseCircle className="w-4 h-4" /> : <FiPlayCircle className="w-4 h-4" />}
              </button>
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-violet-400">
                <FiClock className="w-3.5 h-3.5" />
                <span>Auto-Switch in: {formatTime(timeLeft)}</span>
              </div>
            </div>
          )}

          <button
            onClick={onCompleted}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transform active:scale-95 transition-all duration-200 ${
              isCompleted
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/10 hover:shadow-violet-500/20'
            }`}
          >
            <FiCheckCircle className="w-4 h-4" />
            {isCompleted ? 'Marked Completed' : 'Mark Completed'}
          </button>
        </div>
      </div>
    </div>
  );
};
