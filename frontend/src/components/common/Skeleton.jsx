import React from 'react';

export const CourseCardSkeleton = () => {
  return (
    <div className="glass-card rounded-2xl overflow-hidden h-[340px] flex flex-col relative shimmer-effect">
      <div className="h-44 w-full bg-slate-800" />
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="h-4 bg-slate-800 rounded-md w-1/4 mb-3" />
          <div className="h-6 bg-slate-800 rounded-md w-3/4 mb-2" />
          <div className="h-4 bg-slate-800 rounded-md w-1/2" />
        </div>
        <div className="h-10 bg-slate-800 rounded-xl w-full mt-4" />
      </div>
    </div>
  );
};

export const DashboardWidgetSkeleton = () => {
  return (
    <div className="glass-panel rounded-2xl p-6 relative shimmer-effect overflow-hidden h-[120px] flex flex-col justify-between">
      <div className="flex justify-between items-start">
        <div className="space-y-2 w-1/2">
          <div className="h-4 bg-slate-800 rounded w-2/3" />
          <div className="h-8 bg-slate-800 rounded w-1/2" />
        </div>
        <div className="w-12 h-12 rounded-xl bg-slate-800" />
      </div>
    </div>
  );
};

export const UserRowSkeleton = () => {
  return (
    <div className="flex items-center justify-between p-4 border-b border-slate-800/40 relative shimmer-effect overflow-hidden">
      <div className="flex items-center space-x-3 w-1/2">
        <div className="w-10 h-10 rounded-full bg-slate-800" />
        <div className="space-y-2 w-2/3">
          <div className="h-4 bg-slate-800 rounded w-1/2" />
          <div className="h-3 bg-slate-800 rounded w-3/4" />
        </div>
      </div>
      <div className="w-24 h-8 bg-slate-800 rounded-lg" />
    </div>
  );
};
