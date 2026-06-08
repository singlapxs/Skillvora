import React, { useEffect, useState, useRef } from 'react';
import ReactPlayer from 'react-player';
import { Watermark } from './Watermark';
import { 
  FiShield, FiCheckCircle, FiPlay, FiPause, 
  FiVolume2, FiVolumeX, FiMaximize, FiMinimize 
} from 'react-icons/fi';

export const VideoPlayer = ({ videoUrl, onCompleted, isCompleted, title, onProgress, startTime = 0 }) => {
  const [blocked, setBlocked] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const playerRef = useRef(null);
  const playerContainerRef = useRef(null);

  // Custom Player States
  const [playing, setPlaying] = useState(true);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [played, setPlayed] = useState(0);
  const [playedSeconds, setPlayedSeconds] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

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

  // Fullscreen event listener
  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Format time utility
  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '00:00';
    const date = new Date(seconds * 1000);
    const hh = date.getUTCHours();
    const mm = date.getUTCMinutes();
    const ss = date.getUTCSeconds().toString().padStart(2, '0');
    if (hh) {
      return `${hh}:${mm.toString().padStart(2, '0')}:${ss}`;
    }
    return `${mm}:${ss}`;
  };

  // Custom Controls Handlers
  const handlePlayPause = () => setPlaying(!playing);
  const handleVolumeChange = (e) => setVolume(parseFloat(e.target.value));
  const toggleMute = () => setMuted(!muted);

  const handleSeekMouseDown = () => setIsSeeking(true);
  const handleSeekChange = (e) => setPlayed(parseFloat(e.target.value));
  const handleSeekMouseUp = (e) => {
    setIsSeeking(false);
    if (playerRef.current) {
      playerRef.current.seekTo(parseFloat(e.target.value), 'fraction');
    }
  };

  const handlePlaybackRateChange = (rate) => {
    setPlaybackRate(rate);
    localStorage.setItem('skillvora_playback_rate', rate.toString());
  };

  const handleProgress = (state) => {
    const p = state?.played || 0;
    const ps = state?.playedSeconds || 0;
    
    if (!isSeeking) {
      setPlayed(p);
      setPlayedSeconds(ps);
    }
    if (onProgress) {
      onProgress(ps);
    }
  };

  const handleDuration = (dur) => setDuration(dur || 0);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen().catch(err => {
        console.error('Error attempting to enable fullscreen:', err);
      });
    } else {
      document.exitFullscreen();
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
      {/* Player Frame Container */}
      <div 
        ref={playerContainerRef}
        onContextMenu={handleContextMenu}
        className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl transition-all duration-300 group"
      >
        {blocked && (
          <div className="absolute top-4 left-4 right-4 z-50 bg-red-600/90 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 backdrop-blur-sm animate-bounce shadow-lg">
            <FiShield className="w-5 h-5 flex-shrink-0" />
            <span>Developer console and source downloads are disabled to protect course content piracy.</span>
          </div>
        )}

        <Watermark />

        {videoUrl ? (
          isYouTube ? (
            <>
              {/* ReactPlayer with native controls completely disabled */}
              <ReactPlayer
                ref={playerRef}
                src={formattedUrl}
                width="100%"
                height="100%"
                controls={false}
                playing={playing}
                volume={volume}
                muted={muted}
                playbackRate={playbackRate}
                onProgress={handleProgress}
                onDuration={handleDuration}
                onEnded={onCompleted}
                config={{
                  youtube: {
                    playerVars: { showinfo: 0, rel: 0, modestbranding: 1, fs: 0 }
                  }
                }}
                className="absolute top-0 left-0"
              />

              {/* Invisible Click Shield to prevent YouTube title bar on hover */}
              <div 
                className="absolute inset-0 z-10 cursor-pointer"
                onClick={handlePlayPause}
                title={playing ? "Pause" : "Play"}
              />

              {/* Custom Branded Control Bar */}
              <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-slate-950/95 via-slate-950/60 to-transparent pt-12 pb-4 px-5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col gap-2">
                
                {/* Scrub Bar */}
                <input
                  type="range" min={0} max={0.999999} step="any"
                  value={played}
                  onMouseDown={handleSeekMouseDown}
                  onChange={handleSeekChange}
                  onMouseUp={handleSeekMouseUp}
                  className="w-full h-1.5 bg-slate-700/50 rounded-lg appearance-none cursor-pointer accent-violet-500 hover:h-2 transition-all"
                />

                <div className="flex items-center justify-between text-slate-200 mt-2">
                  <div className="flex items-center gap-5">
                    
                    {/* Play/Pause */}
                    <button onClick={handlePlayPause} className="hover:text-violet-400 transition-colors transform active:scale-90">
                      {playing ? <FiPause className="w-5 h-5" /> : <FiPlay className="w-5 h-5 fill-current" />}
                    </button>
                    
                    {/* Volume */}
                    <div className="flex items-center gap-2 group/vol">
                      <button onClick={toggleMute} className="hover:text-violet-400 transition-colors">
                        {muted || volume === 0 ? <FiVolumeX className="w-4 h-4" /> : <FiVolume2 className="w-4 h-4" />}
                      </button>
                      <input
                        type="range" min={0} max={1} step="any"
                        value={muted ? 0 : volume}
                        onChange={handleVolumeChange}
                        className="w-16 h-1 bg-slate-700/50 rounded-lg appearance-none cursor-pointer accent-violet-500 opacity-0 group-hover/vol:opacity-100 transition-opacity"
                      />
                    </div>
                    
                    {/* Time */}
                    <div className="text-xs font-mono font-bold tracking-wide select-none">
                      {formatTime(playedSeconds)} <span className="text-slate-500 font-normal">/</span> {formatTime(duration)}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Playback Rate Dropdown */}
                    <select
                      value={playbackRate}
                      onChange={(e) => handlePlaybackRateChange(parseFloat(e.target.value))}
                      className="bg-transparent text-xs font-extrabold focus:outline-none cursor-pointer hover:text-violet-400 transition-colors appearance-none"
                    >
                      <option value={0.5} className="bg-slate-900 text-slate-200">0.5x</option>
                      <option value={1} className="bg-slate-900 text-slate-200">1.0x</option>
                      <option value={1.5} className="bg-slate-900 text-slate-200">1.5x</option>
                      <option value={2} className="bg-slate-900 text-slate-200">2.0x</option>
                    </select>

                    {/* Fullscreen */}
                    <button onClick={toggleFullscreen} className="hover:text-violet-400 transition-colors transform active:scale-90">
                      {isFullscreen ? <FiMinimize className="w-4 h-4" /> : <FiMaximize className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </>
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

      {/* Legacy Fallback UI Bar below player */}
      <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-xl bg-slate-900/40 border border-slate-850">
        <div>
          <h2 className="text-lg font-bold text-slate-100">{title || 'Playing Lecture'}</h2>
          <p className="text-xs text-slate-500 mt-1">
            {isYouTube 
              ? "Premium Platform Experience Active. Auto-switching and note bookmarks are perfectly synced." 
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
