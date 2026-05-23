import React, { useState } from 'react';
import { FiChevronDown, FiChevronUp, FiPlayCircle, FiFileText, FiBookOpen, FiCheckCircle } from 'react-icons/fi';

export const SidebarLectures = ({ modules = [], activeLectureId, onSelectLecture, completedLectures = [], onToggleComplete, progressPercentage = 0 }) => {
  const [expandedModules, setExpandedModules] = useState(
    modules.reduce((acc, mod, index) => {
      // By default, expand the first module
      acc[mod._id] = index === 0;
      return acc;
    }, {})
  );

  const toggleModule = (modId) => {
    setExpandedModules(prev => ({
      ...prev,
      [modId]: !prev[modId]
    }));
  };

  const getLectureIcon = (type) => {
    switch (type) {
      case 'video':
        return <FiPlayCircle className="w-4 h-4" />;
      case 'pdf':
        return <FiFileText className="w-4 h-4" />;
      case 'notes':
        return <FiBookOpen className="w-4 h-4" />;
      default:
        return <FiPlayCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="w-full flex flex-col h-full bg-slate-900 border-r border-slate-800">
      
      {/* Course Overall Progress Indicator */}
      <div className="p-6 border-b border-slate-800 bg-slate-950/40">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-bold text-slate-200">Course Progress</span>
          <span className="text-sm font-extrabold text-violet-400">{progressPercentage}%</span>
        </div>
        <div className="w-full bg-slate-850 h-2.5 rounded-full overflow-hidden border border-slate-800">
          <div 
            className="h-full bg-gradient-to-r from-violet-600 to-indigo-600 rounded-full transition-all duration-500 ease-out" 
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <p className="text-[10px] text-slate-400 mt-2">
          {completedLectures.length} lessons completed out of all modules.
        </p>
      </div>

      {/* Accordion List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {modules.map((mod, index) => {
          const isExpanded = expandedModules[mod._id];
          const hasLectures = mod.lectures && mod.lectures.length > 0;

          return (
            <div key={mod._id} className="rounded-xl border border-slate-800/80 overflow-hidden bg-slate-950/20">
              
              {/* Module Header */}
              <button
                onClick={() => toggleModule(mod._id)}
                className="w-full flex items-center justify-between p-4 bg-slate-900/50 hover:bg-slate-900 transition-colors text-left"
              >
                <div className="flex-1 pr-2">
                  <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest block mb-0.5">
                    Module {index + 1}
                  </span>
                  <h4 className="text-sm font-bold text-slate-200 line-clamp-1">{mod.title}</h4>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {mod.lectures?.length || 0} lessons
                  </span>
                </div>
                <div>
                  {isExpanded ? (
                    <FiChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <FiChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </button>

              {/* Module Lectures */}
              {isExpanded && (
                <div className="border-t border-slate-900 bg-slate-950/40">
                  {hasLectures ? (
                    <div className="divide-y divide-slate-900/60">
                      {mod.lectures.map((lec) => {
                        const isActive = lec._id === activeLectureId;
                        const isDone = completedLectures.includes(lec._id);

                        return (
                          <div 
                            key={lec._id}
                            className={`flex items-center justify-between p-3.5 hover:bg-slate-900/40 transition-colors ${
                              isActive ? 'bg-violet-950/20 border-l-2 border-violet-500' : ''
                            }`}
                          >
                            <button
                              onClick={() => onSelectLecture(lec)}
                              className="flex-1 text-left flex items-start space-x-2.5 mr-2"
                            >
                              <span className={`mt-0.5 ${isActive ? 'text-violet-400' : 'text-slate-400'}`}>
                                {getLectureIcon(lec.type)}
                              </span>
                              <div>
                                <span className={`text-xs font-semibold block leading-tight ${
                                  isActive ? 'text-violet-400 font-bold' : 'text-slate-300'
                                }`}>
                                  {lec.title}
                                </span>
                                <span className="text-[10px] text-slate-500 mt-1 block">
                                  {lec.duration || '0m'}
                                </span>
                              </div>
                            </button>

                            {/* Completion Checkmark */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleComplete(lec._id);
                              }}
                              className={`flex-shrink-0 w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                                isDone 
                                  ? 'bg-emerald-500 border-emerald-500 text-white' 
                                  : 'border-slate-700 hover:border-slate-500'
                              }`}
                            >
                              {isDone && <FiCheckCircle className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-xs text-slate-500">
                      No lessons uploaded in this module.
                    </div>
                  )}
                </div>
              )}

            </div>
          );
        })}
      </div>
      
    </div>
  );
};
