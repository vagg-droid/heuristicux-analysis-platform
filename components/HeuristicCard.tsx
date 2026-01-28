
import React, { useState } from 'react';
import { AnalysisDetail, HeuristicItem } from '../types';

interface HeuristicCardProps {
  heuristic: HeuristicItem;
  detail: AnalysisDetail;
  theme?: 'dark' | 'light';
  onToggleResolution: (heuristicId: number, observationIndex: number) => void;
  onMouseEnterFinding?: (observationIndex: number) => void;
  onMouseLeaveFinding?: () => void;
}

export const HeuristicCard: React.FC<HeuristicCardProps> = ({ 
  heuristic, 
  detail, 
  theme = 'dark', 
  onToggleResolution,
  onMouseEnterFinding,
  onMouseLeaveFinding
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const getScoreColor = (score: number) => {
    if (score >= 8) return theme === 'dark' ? 'text-emerald-300' : 'text-emerald-700';
    if (score >= 5) return theme === 'dark' ? 'text-yellow-300' : 'text-amber-700';
    return theme === 'dark' ? 'text-rose-400' : 'text-rose-700';
  };

  const getScoreBg = (score: number) => {
    if (theme === 'dark') {
      if (score >= 8) return 'bg-emerald-500/5 border-emerald-500/20';
      if (score >= 5) return 'bg-yellow-500/5 border-yellow-500/20';
      return 'bg-rose-500/5 border-rose-500/20';
    } else {
      if (score >= 8) return 'bg-emerald-50 border-emerald-200';
      if (score >= 5) return 'bg-amber-50 border-amber-200';
      return 'bg-rose-50 border-rose-200';
    }
  };

  const observations = detail.observations || [];
  const resolvedCount = observations.filter(o => o.resolved).length;
  const totalCount = observations.length;
  
  const isFullyResolved = totalCount > 0 && resolvedCount === totalCount;
  const resolvedTextColor = theme === 'dark' 
    ? (isFullyResolved ? 'text-emerald-400' : 'text-zinc-400')
    : (isFullyResolved ? 'text-emerald-600' : 'text-zinc-600');

  return (
    <div className={`relative rounded-xl border transition-all duration-300 overflow-hidden ${getScoreBg(detail.score)} ${isOpen ? 'ring-2 ring-emerald-500/20 shadow-lg' : ''}`}>
      <div className={`absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 transition-transform duration-500 z-10 ${isOpen ? 'scale-y-100' : 'scale-y-0'}`}></div>

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left p-4 sm:p-5 flex justify-between items-center cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-all focus-visible:ring-2 focus-visible:ring-emerald-500"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div className={`shrink-0 flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold border transition-colors ${theme === 'dark' ? 'bg-zinc-950/50 border-zinc-800 text-zinc-400' : 'bg-white border-zinc-200 text-zinc-600'}`}>
            {heuristic.id}
          </div>
          <div className="flex flex-col overflow-hidden">
            <h3 className={`font-bold text-sm truncate ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-900'}`}>
              {heuristic.name}
            </h3>
            <div className="flex items-center mt-0.5">
               <span className={`text-[9px] font-bold uppercase tracking-wider ${resolvedTextColor}`}>
                {totalCount === 0 ? 'Verified' : `${resolvedCount}/${totalCount} Resolved`}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4 shrink-0">
          <div className={`text-xl font-bold ${getScoreColor(detail.score)} tabular-nums flex items-baseline drop-shadow-sm transition-all`}>
            {detail.score.toFixed(1)}<span className={`text-[10px] ml-0.5 font-normal ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-600'}`}>/10</span>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform duration-500 ${isOpen ? 'rotate-180 text-emerald-500' : 'opacity-30'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      
      {isOpen && (
        <div className="px-4 pb-5 sm:px-5 sm:pb-6 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className={`h-px mb-5 opacity-10 ${theme === 'dark' ? 'bg-white' : 'bg-black'}`}></div>
          <div className="space-y-4">
            {observations.length > 0 ? (
              observations.map((obs, idx) => (
                <div 
                  key={idx} 
                  onMouseEnter={() => onMouseEnterFinding?.(idx)}
                  onMouseLeave={() => onMouseLeaveFinding?.()}
                  className={`group/finding rounded-xl border overflow-hidden transition-all duration-300 ${
                    obs.resolved 
                      ? (theme === 'dark' ? 'bg-emerald-500/5 border-emerald-500/20 opacity-60' : 'bg-emerald-50 border-emerald-500/20 opacity-60')
                      : (theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800 hover:border-emerald-500/30 shadow-sm' : 'bg-white border-zinc-200 hover:border-emerald-500/20 shadow-sm')
                  }`}
                >
                  <div className="p-4 flex gap-4 items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-3.5 w-3.5 shrink-0 ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <h4 className={`text-[9px] font-bold uppercase tracking-[0.2em] ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-600'}`}>
                          Observation
                        </h4>
                      </div>
                      <p className={`text-sm leading-relaxed transition-all ${obs.resolved ? 'line-through opacity-50' : (theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700')}`}>
                        {obs.finding}
                      </p>
                    </div>
                    
                    <button 
                      onClick={() => onToggleResolution(heuristic.id, idx)}
                      className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                        obs.resolved 
                          ? 'text-emerald-500 scale-110 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]' 
                          : 'text-zinc-600 hover:text-emerald-500 hover:scale-105'
                      }`}
                      aria-label={obs.resolved ? "Mark finding as unresolved" : "Mark finding as resolved"}
                    >
                      {obs.resolved ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <circle cx="12" cy="12" r="9" strokeWidth="1.5" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12.5l2 2 4-4" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 opacity-30 group-hover/finding:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <circle cx="12" cy="12" r="9" strokeWidth="1.5" />
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12.5l2 2 4-4" />
                        </svg>
                      )}
                    </button>
                  </div>

                  {!obs.resolved && (
                    <div className={`p-4 flex items-start gap-3 border-t transition-colors text-left ${
                      theme === 'dark' ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-emerald-50 border-emerald-500/10'
                    }`}>
                      <div className="shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className={`text-[9px] font-bold uppercase tracking-[0.2em] mb-1.5 ${theme === 'dark' ? 'text-emerald-500' : 'text-emerald-700'}`}>
                          Action Required
                        </h4>
                        <p className={`text-sm leading-relaxed italic ${theme === 'dark' ? 'text-emerald-200' : 'text-emerald-900'}`}>
                          {obs.recommendation}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className={`py-8 text-center rounded-xl border border-dashed ${theme === 'dark' ? 'border-zinc-800 text-zinc-600' : 'border-zinc-200 text-zinc-400'}`}>
                <p className="text-xs italic tracking-wide uppercase font-bold">No findings. UI is compliant.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
