import React, { useEffect, useState, useRef } from 'react';
import ReactPlayer from 'react-player';
import { Watermark } from './Watermark';
import { FiShield, FiCheckCircle } from 'react-icons/fi';

export const VideoPlayer = ({ videoUrl, onCompleted, isCompleted, title, onProgress, startTime = 0 }) => {
  const [blocked, setBlocked] = useState(false);
  // Check if URL is YouTube
  const isYouTube = videoUrl && (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be'));

  // Ensure URL has https:// so ReactPlayer doesn't fail to recognize it
  let formattedUrl = videoUrl;
  if (isYouTube && formattedUrl && !formattedUrl.startsWith('http')) {
    formattedUrl = `https://${formattedUrl}`;
  }

  // Extract Drive ID for fallback
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

  // Load saved settings
  useEffect(() => {
    const savedRate = localStorage.getItem('skillvora_playback_rate');
    if (savedRate) {
      setPlaybackRate(parseFloat(savedRate));
    }
  }, []);

  // Jump to startTime when it changes (e.g., clicking a note)
  useEffect(() => {
    if (playerRef.current && startTime > 0) {
      playerRef.current.seekTo(startTime, 'seconds');
    }
  }, [startTime]);

  const handlePlaybackRateChange = (rate) => {
    setPlaybackRate(rate);
    localStorage.setItem('skillvora_playback_rate', rate.toString());
  };

  const handleProgress = (state) => {
    if (onProgress) {
      onProgress(state.playedSeconds);
    }
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
          isYouTube ? (
            <ReactPlayer
              ref={playerRef}
              url={formattedUrl}
              width="100%"
              height="100%"
              controls={true}
              playing={true}
              playbackRate={playbackRate}
              onPlaybackRateChange={handlePlaybackRateChange}
              onProgress={handleProgress}
              onEnded={onCompleted}
              config={{
                youtube: {
                  playerVars: { showinfo: 1, rel: 0, modestbranding: 1 }
                }
              }}
              className="absolute top-0 left-0"
            />
          ) : (
            <iframe
              key={previewUrl}
              src={previewUrl}
              className="w-full h-full border-none select-none absolute top-0 left-0"
              allow="autoplay; fullscreen"
              allowFullScreen
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              title={title}
            />
          )
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-2 absolute top-0 left-0">
            <FiShield className="w-12 h-12 text-slate-700 animate-pulse" />
            <p className="text-sm">Video feed offline. File link sharing must be allowed.</p>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-xl bg-slate-900/40 border border-slate-850">
        <div>
          <h2 className="text-lg font-bold text-slate-100">{title || 'Playing Lecture'}</h2>
          <p className="text-xs text-slate-500 mt-1">
            {isYouTube 
              ? "YouTube API Sync Active. Auto-switching and note bookmarks are perfectly synced." 
              : "Google Drive fallback active. Timer and API syncing are disabled for this lecture."}
          </p>
        </div>

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
  );
};
