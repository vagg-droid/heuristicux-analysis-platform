
import React, { useState } from 'react';

interface InfoTooltipProps {
  content: string;
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({ content }) => {
  const [show, setShow] = useState(false);

  return (
    <div className="relative inline-block ml-2 align-middle">
      <button 
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="w-5 h-5 flex items-center justify-center rounded-full bg-slate-800 text-emerald-400 hover:bg-slate-700 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
      {show && (
        <div className="absolute z-50 w-64 p-3 mt-2 -left-32 sm:left-auto sm:right-0 bg-slate-900 border border-slate-700 rounded-lg shadow-xl text-xs text-slate-300 leading-relaxed pointer-events-none">
          {content}
        </div>
      )}
    </div>
  );
};
