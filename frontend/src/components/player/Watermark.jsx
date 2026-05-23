import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

export const Watermark = () => {
  const { user } = useAuth();
  const [time, setTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!user) return null;

  return (
    <div className="absolute inset-0 z-10 overflow-hidden pointer-events-none opacity-[0.14] select-none">
      <div className="floating-watermark absolute bg-slate-900 text-slate-100 text-xs px-3 py-1.5 rounded-md border border-slate-700/50 shadow-md whitespace-nowrap flex flex-col font-mono uppercase tracking-widest text-[9px] sm:text-[10px]">
        <span>User: {user.email}</span>
        <span>ID: {user.id?.substring(18)}</span>
        <span>Time: {time}</span>
      </div>
    </div>
  );
};
