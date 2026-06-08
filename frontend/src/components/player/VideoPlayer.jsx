import React, { useEffect, useState, useRef } from 'react';
import { Watermark } from './Watermark';
import { FiShield, FiAlertOctagon, FiRotateCcw, FiCheckCircle, FiSettings, FiInfo } from 'react-icons/fi';

export const VideoPlayer = ({ videoUrl, onCompleted, isCompleted, title, startTime = 0 }) => {
  const [blocked, setBlocked] = useState(false);
  const [blurActive, setBlurActive] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef(null);

  // Reset error state when url changes
  useEffect(() => {
    setVideoError(false);
  }, [videoUrl]);

  // Extract Drive ID
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
  const apiKey = import.meta.env.VITE_GOOGLE_DRIVE_API_KEY;
  
  let directUrl = videoUrl;
  if (driveId) {
    if (apiKey) {
      directUrl = `https://www.googleapis.com/drive/v3/files/${driveId}?alt=media&key=${apiKey}&acknowledgeAbuse=true`;
    } else {
      directUrl = `https://drive.google.com/uc?export=download&id=${driveId}`;
    }
  }

  const previewUrl = driveId ? `https://drive.google.com/file/d/${driveId}/preview` : videoUrl;

  // Load saved settings
  useEffect(() => {
    const savedRate = localStorage.getItem('skillvora_playback_rate');
    if (savedRate) {
      setPlaybackRate(parseFloat(savedRate));
    }
  }, []);

  // Apply speed to video element when it mounts or when speed changes
  useEffect(() => {
    if (videoRef.current && !videoError) {
      videoRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate, videoUrl, videoError]);

  // Handle start time jump once video is loaded metadata
  const handleLoadedMetadata = () => {
    if (videoRef.current && startTime > 0) {
      videoRef.current.currentTime = startTime;
    }
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
    }
  };

  const changePlaybackRate = (rate) => {
    setPlaybackRate(rate);
    localStorage.setItem('skillvora_playback_rate', rate.toString());
    setShowSettings(false);
    if (videoRef.current && !videoError) {
      videoRef.current.playbackRate = rate;
    }
  };

  // Requirement 27: Keyboard shortcuts inspection locking & DevTools blur triggers
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Key combinations: F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U, Ctrl+Shift+C
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

    const handleResize = () => {
      const threshold = 160;
      const widthDiff = window.outerWidth - window.innerWidth > threshold;
      const heightDiff = window.outerHeight - window.innerHeight > threshold;
      if (widthDiff || heightDiff) {
        setBlurActive(true);
      } else {
        setBlurActive(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
    };
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
        className={`relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl transition-all duration-300 ${
          blurActive ? 'blur-md select-none pointer-events-none' : ''
        }`}
      >
        {blocked && (
          <div className="absolute top-4 left-4 right-4 z-30 bg-red-600/90 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 backdrop-blur-sm animate-bounce shadow-lg">
            <FiShield className="w-5 h-5 flex-shrink-0" />
            <span>Developer console and source downloads are disabled to protect course content piracy.</span>
          </div>
        )}

        {/* Video Settings Menu Overlay - Only show if not in fallback error mode */}
        {!videoError && (
          <div className="absolute top-4 right-4 z-20">
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className="bg-slate-900/80 hover:bg-slate-800 text-slate-200 p-2 rounded-lg backdrop-blur-sm transition-colors border border-slate-700 shadow-lg"
            >
              <FiSettings className={`w-5 h-5 ${showSettings ? 'rotate-90' : ''} transition-transform duration-300`} />
            </button>

            {showSettings && (
              <div className="absolute right-0 mt-2 w-48 bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
                <div className="p-3 border-b border-slate-800">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Playback Speed</h4>
                </div>
                <div className="p-2 space-y-1">
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => changePlaybackRate(rate)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                        playbackRate === rate 
                          ? 'bg-violet-600/20 text-violet-400' 
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {rate === 1 ? 'Normal' : `${rate}x`}
                    </button>
                  ))}
                </div>
                <div className="p-3 border-t border-slate-800">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Quality</h4>
                  <p className="text-[10px] text-slate-500">Fixed (Source Quality)</p>
                </div>
              </div>
            )}
          </div>
        )}

        <Watermark />

        {!videoError && directUrl ? (
          <video
            ref={videoRef}
            src={directUrl}
            className="w-full h-full object-contain"
            controls
            controlsList="nodownload"
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={onCompleted}
            onError={() => {
              console.warn("Direct video stream failed (CORS or Size Limit), falling back to IFrame...");
              setVideoError(true);
            }}
            autoPlay
          >
            Your browser does not support the video tag.
          </video>
        ) : videoUrl ? (
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

      {blurActive && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-6">
          <div className="max-w-md w-full glass-panel rounded-2xl p-8 text-center border-red-500/40">
            <FiAlertOctagon className="w-16 h-16 text-red-500 mx-auto mb-4 animate-pulse" />
            <h3 className="text-xl font-bold text-slate-100 mb-2">Inspect Console Detected</h3>
            <p className="text-slate-400 text-sm mb-6">
              Please close developer tools to restore high-definition video playback. Direct video download links are protected.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-6 py-2.5 rounded-xl font-semibold flex items-center gap-2 mx-auto transition-colors"
            >
              <FiRotateCcw className="w-4 h-4" /> Refresh Player
            </button>
          </div>
        </div>
      )}

      {videoError && (
        <div className="mt-4 flex items-start gap-3 p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold">
          <FiInfo className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p>
            This video stream is blocked from direct playback by Google Drive due to file size or security settings. 
            We have reverted to the standard embedded player. Custom speed control and auto-switching are disabled for this lecture.
          </p>
        </div>
      )}

      <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-xl bg-slate-900/40 border border-slate-850">
        <div>
          <h2 className="text-lg font-bold text-slate-100">{title || 'Playing Lecture'}</h2>
          {!videoError && (
            <p className="text-xs text-slate-500 mt-1">Speed and quality settings are automatically saved.</p>
          )}
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
