import React, { useEffect, useState } from 'react';
import { Watermark } from './Watermark';
import { FiShield, FiAlertOctagon, FiRotateCcw, FiCheckCircle } from 'react-icons/fi';

export const VideoPlayer = ({ videoUrl, onCompleted, isCompleted, title, startTime = 0 }) => {
  const [blocked, setBlocked] = useState(false);
  const [blurActive, setBlurActive] = useState(false);

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

    // Detect resizing or devtools suspecting
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
    // Initial run to check
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
        {/* Anti-Download Shield Notice */}
        {blocked && (
          <div className="absolute top-4 left-4 right-4 z-30 bg-red-600/90 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 backdrop-blur-sm animate-bounce shadow-lg">
            <FiShield className="w-5 h-5 flex-shrink-0" />
            <span>Developer console and source downloads are disabled to protect course content piracy.</span>
          </div>
        )}

        {/* Floating Watermark */}
        <Watermark />

        {/* The Sandboxed IFrame */}
        {videoUrl ? (
          (() => {
            const separator = videoUrl.includes('?') ? '&' : '?';
            const iframeUrl = startTime > 0 ? `${videoUrl}${separator}start=${startTime}` : videoUrl;
            return (
              <iframe
                key={iframeUrl}
                src={iframeUrl}
                className="w-full h-full border-none select-none"
                allow="autoplay; fullscreen"
                allowFullScreen
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                title={title}
              />
            );
          })()
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-2">
            <FiShield className="w-12 h-12 text-slate-700 animate-pulse" />
            <p className="text-sm">Video feed offline. File link sharing must be allowed.</p>
          </div>
        )}
      </div>

      {/* DevTools Suspended Warning Overlay */}
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

      {/* Video Action Controls Bar */}
      <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-xl bg-slate-900/40 border border-slate-850">
        <div>
          <h2 className="text-lg font-bold text-slate-100">{title || 'Playing Lecture'}</h2>
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
