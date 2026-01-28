
import React, { useState } from 'react';
import { NIELSEN_HEURISTICS } from '../constants';

interface NNRulesViewProps {
  onBack: () => void;
  theme?: 'dark' | 'light';
}

export const NNRulesView: React.FC<NNRulesViewProps> = ({ onBack, theme = 'dark' }) => {
  const bgClasses = theme === 'dark' ? 'bg-black text-zinc-100' : 'bg-zinc-50 text-zinc-900';
  const cardClasses = theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm';
  const accentText = theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600';

  return (
    <div className={`flex-1 overflow-y-auto p-6 md:p-12 font-sans ${bgClasses}`}>
      <button onClick={onBack} className={`mb-8 flex items-center gap-2 text-sm font-bold uppercase tracking-widest transition-colors ${accentText}`}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        Back to Auditor
      </button>

      <div className="max-w-4xl mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl font-bold mb-4 tracking-tighter uppercase">10 Nielsen Heuristics</h1>
          <p className="opacity-75 leading-relaxed max-w-2xl text-sm italic">
            Jakob Nielsen's 10 general principles for interaction design. They are called "heuristics" because they are broad rules of thumb and not specific usability guidelines.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-6">
          {NIELSEN_HEURISTICS.map(rule => (
            <div key={rule.id} className={`p-6 rounded-xl border flex gap-6 group transition-all duration-300 ${cardClasses} hover:border-emerald-500/30`}>
              <div className={`w-12 h-12 rounded flex items-center justify-center font-bold text-xl shrink-0 transition-colors ${theme === 'dark' ? 'bg-black text-emerald-400 group-hover:bg-emerald-500/10' : 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100'}`}>
                {rule.id}
              </div>
              <div>
                <h3 className="text-lg font-bold mb-2 uppercase tracking-tight">{rule.name}</h3>
                <p className="text-sm opacity-70 leading-relaxed font-light">{rule.description}</p>
                <div className="mt-4 flex gap-2">
                  <div className="px-2 py-1 rounded bg-black/5 dark:bg-white/5 text-[10px] font-bold opacity-50 uppercase tracking-widest">
                    Heuristic Priority: {rule.weight}x
                  </div>
                  <div className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                    Core Principle
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
