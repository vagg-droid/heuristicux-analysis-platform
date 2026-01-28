
import React, { useState } from 'react';
import { NIELSEN_HEURISTICS, WEIGHT_DESCRIPTION } from '../constants';

interface ScoringMethodologyProps {
  onBack: () => void;
  theme?: 'dark' | 'light';
}

export const ScoringMethodology: React.FC<ScoringMethodologyProps> = ({ onBack, theme = 'dark' }) => {
  const bgClasses = theme === 'dark' ? 'bg-black text-zinc-100' : 'bg-zinc-50 text-zinc-900';
  const cardClasses = theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm';
  const accentText = theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600';

  return (
    <div className={`flex-1 overflow-y-auto p-6 md:p-12 font-sans ${bgClasses}`}>
      <button onClick={onBack} className={`mb-8 flex items-center gap-2 text-sm font-bold uppercase tracking-widest transition-colors ${accentText}`}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        Back to Auditor
      </button>

      <div className="max-w-4xl mx-auto space-y-16">
        <header>
          <h1 className="text-4xl font-bold mb-4 tracking-tighter uppercase">Scoring System</h1>
          <p className="opacity-75 leading-relaxed max-w-2xl text-sm italic">
            A weighted quantitative framework for measuring user experience based on Nielsen's 10 Heuristics.
          </p>
        </header>

        <section>
          <div className="flex items-center gap-4 mb-6">
            <span className={`${accentText} font-bold text-2xl italic`}>01.</span>
            <h2 className="text-xl font-bold uppercase tracking-tight">Calculation Logic</h2>
          </div>
          <div className={`border rounded-xl p-8 ${cardClasses}`}>
            <p className="opacity-80 mb-6 leading-relaxed text-sm">
              {WEIGHT_DESCRIPTION}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {NIELSEN_HEURISTICS.map(h => (
                <div key={h.id} className={`p-3 rounded border flex justify-between items-center ${theme === 'dark' ? 'bg-black border-white/5' : 'bg-zinc-50 border-zinc-200'}`}>
                  <span className="text-[10px] opacity-60 truncate mr-2 font-bold uppercase">{h.name}</span>
                  <span className={`text-xs font-bold ${accentText}`}>{h.weight.toFixed(1)}x</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-center gap-4 mb-6">
            <span className={`${accentText} font-bold text-2xl italic`}>02.</span>
            <h2 className="text-xl font-bold uppercase tracking-tight">Grade Definitions</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`border rounded-xl p-6 ${theme === 'dark' ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-emerald-50 border-emerald-500/20'}`}>
              <div className="flex justify-between items-center mb-4">
                <span className="px-2 py-1 bg-emerald-600 text-black text-[10px] font-bold rounded">PASS</span>
                <span className={`text-2xl font-bold ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-700'}`}>8.0 - 10</span>
              </div>
              <p className="text-xs opacity-70 leading-relaxed italic">Optimal UX. Zero friction detected. High consistency.</p>
            </div>
            <div className={`border rounded-xl p-6 ${theme === 'dark' ? 'bg-yellow-500/5 border-yellow-500/20' : 'bg-yellow-50 border-yellow-500/20'}`}>
              <div className="flex justify-between items-center mb-4">
                <span className="px-2 py-1 bg-yellow-600 text-black text-[10px] font-bold rounded">PARTIAL</span>
                <span className={`text-2xl font-bold ${theme === 'dark' ? 'text-yellow-400' : 'text-yellow-700'}`}>5.0 - 7.9</span>
              </div>
              <p className="text-xs opacity-70 leading-relaxed italic">Minor violations present. Introduced cognitive load.</p>
            </div>
            <div className={`border rounded-xl p-6 ${theme === 'dark' ? 'bg-rose-500/5 border-rose-500/20' : 'bg-rose-50 border-rose-500/20'}`}>
              <div className="flex justify-between items-center mb-4">
                <span className="px-2 py-1 bg-rose-600 text-black text-[10px] font-bold rounded">FAIL</span>
                <span className={`text-2xl font-bold ${theme === 'dark' ? 'text-rose-400' : 'text-rose-700'}`}>0.0 - 4.9</span>
              </div>
              <p className="text-xs opacity-70 leading-relaxed italic">Critical violations. User flow blocked or severe confusion.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
