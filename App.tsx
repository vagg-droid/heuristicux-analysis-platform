
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { NIELSEN_HEURISTICS, UI_UX_FUN_FACTS } from './constants';
import { UploadedImage } from './types';
import { analyzeScreenshot } from './services/geminiService';
import { HeuristicCard } from './components/HeuristicCard';
import { ScoringMethodology } from './components/ScoringMethodology';
import { NNRulesView } from './components/NNRulesView';

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    aistudio?: AIStudio;
  }
}

const availableModels = [
  { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro (Advanced)' },
  { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash (Fast & Efficient)' },
];
const DEFAULT_MODEL = availableModels[0].id;


const App: React.FC = () => {
  const [view, setView] = useState<'auditor' | 'scoring' | 'rules'>('auditor');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [isContextExpanded, setIsContextExpanded] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [hoveredFinding, setHoveredFinding] = useState<{ heuristicId: number; index: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [sidebarWidth, setSidebarWidth] = useState(240);
  const [analysisWidth, setAnalysisWidth] = useState(480);
  const isResizingSidebar = useRef(false);
  const isResizingAnalysis = useRef(false);
  
  const [analysisReadyIndices, setAnalysisReadyIndices] = useState<number[]>([]);
  const [funFact, setFunFact] = useState<string>('');

  const activeImage = activeIndex !== null ? images[activeIndex] : null;

  useEffect(() => {
    setIsContextExpanded(false);
    setHoveredFinding(null);
  }, [activeIndex]);

  useEffect(() => {
    const checkApiKey = async () => {
      if (window.aistudio && !(await window.aistudio.hasSelectedApiKey())) {
        await handleOpenKeySelector();
      }
    };
    checkApiKey();
  }, []);
  
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove(theme === 'dark' ? 'light' : 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);


  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const handleOpenKeySelector = async () => {
    try {
      if (window.aistudio) {
        await window.aistudio.openSelectKey();
        if (activeIndex !== null) triggerAnalysis(activeIndex);
      }
    } catch (err) {
      console.error("Failed to open key selector", err);
    }
  };

  const startResizingSidebar = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizingSidebar.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', stopResizing);
    document.body.style.cursor = 'col-resize';
  }, []);

  const startResizingAnalysis = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizingAnalysis.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', stopResizing);
    document.body.style.cursor = 'col-resize';
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isResizingSidebar.current) setSidebarWidth(Math.max(80, Math.min(400, e.clientX)));
    if (isResizingAnalysis.current) setAnalysisWidth(Math.max(320, Math.min(800, window.innerWidth - e.clientX)));
  }, []);

  const stopResizing = useCallback(() => {
    isResizingSidebar.current = false;
    isResizingAnalysis.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', stopResizing);
    document.body.style.cursor = 'default';
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0) return;
    const newImages: UploadedImage[] = files.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      previewUrl: URL.createObjectURL(file),
      isLoading: false,
      userContext: '',
      model: DEFAULT_MODEL,
    }));
    setImages(prev => [...prev, ...newImages]);
    if (activeIndex === null) {
      setActiveIndex(images.length);
      setShowSidebar(true);
    }
  };

  const triggerAnalysis = async (index: number) => {
    const img = images[index];
    if (!img || img.isLoading) return;

    setAnalysisReadyIndices(prev => prev.filter(i => i !== index));
    const randomFact = UI_UX_FUN_FACTS[Math.floor(Math.random() * UI_UX_FUN_FACTS.length)];
    setFunFact(randomFact);

    setImages(prev => prev.map((item, i) => i === index ? { ...item, isLoading: true, error: undefined } : item));
    
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = (reader.result as string).split(',')[1];
          const result = await analyzeScreenshot(base64, img.file.type, img.model, img.userContext);
          setImages(prev => prev.map((item, i) => i === index ? { ...item, analysis: result, isLoading: false, error: undefined } : item));
          setAnalysisReadyIndices(prev => [...prev, index]);
          setIsContextExpanded(false); 
          setShowSidebar(true);
        } catch (err: any) {
          console.error("Analysis inner error:", err);
          let errorMessage = "Analysis failed.";
          const errStr = (err?.message || JSON.stringify(err)).toLowerCase();
          if (errStr.includes('429') || errStr.includes('quota') || errStr.includes('resource_exhausted')) {
            errorMessage = "QUOTA_EXHAUSTED";
          } else if (errStr.includes('missing gemini_api_key') || errStr.includes('api key') || errStr.includes('unauthorized') || errStr.includes('permission')) {
            errorMessage = "MISSING_OR_INVALID_API_KEY";
          } else if (errStr.includes('requested entity was not found')) {
             handleOpenKeySelector();
             return;
          } else if (errStr.includes('model') && errStr.includes('not found')) {
            errorMessage = "MODEL_NOT_FOUND";
          }
          setImages(prev => prev.map((item, i) => i === index ? { ...item, error: errorMessage, isLoading: false } : item));
        }
      };
      reader.readAsDataURL(img.file);
    } catch (err) {
      setImages(prev => prev.map((item, i) => i === index ? { ...item, error: "Analysis failed.", isLoading: false } : item));
    }
  };

  const toggleFindingResolution = (heuristicId: number, observationIndex: number) => {
    if (activeIndex === null) return;

    setImages(prev => {
      const updatedImages = [...prev];
      const img = { ...updatedImages[activeIndex] };
      if (!img.analysis) return prev;

      const analysis = { ...img.analysis };
      const heuristics = { ...analysis.heuristics };
      const detail = { ...heuristics[heuristicId] };
      const observations = [...detail.observations];
      
      observations[observationIndex] = { 
        ...observations[observationIndex], 
        resolved: !observations[observationIndex].resolved 
      };

      const initial = detail.initialScore ?? detail.score;
      const total = observations.length;
      const resolved = observations.filter(o => o.resolved).length;
      
      const newScore = total === 0 ? 10 : initial + (10 - initial) * (resolved / total);
      
      detail.score = Math.min(10, Math.max(0, newScore));
      detail.observations = observations;
      heuristics[heuristicId] = detail;
      analysis.heuristics = heuristics;

      let weightedSum = 0;
      let totalWeights = 0;
      NIELSEN_HEURISTICS.forEach(h => {
        weightedSum += (heuristics[h.id].score * h.weight);
        totalWeights += h.weight;
      });
      analysis.overallScore = Math.round((weightedSum / totalWeights) * 10) / 10;

      img.analysis = analysis;
      updatedImages[activeIndex] = img;
      return updatedImages;
    });
  };

  const removeImage = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setImages(prev => {
      const filtered = prev.filter(img => img.id !== id);
      if (activeIndex !== null && activeIndex >= filtered.length) {
        setActiveIndex(filtered.length > 0 ? filtered.length - 1 : null);
      } else if (filtered.length === 0) {
        setActiveIndex(null);
        setShowSidebar(false);
      }
      return filtered;
    });
  };

  const themeClasses = theme === 'dark' ? 'bg-black text-zinc-200' : 'bg-zinc-50 text-zinc-800';
  const accentClasses = theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600';
  const btnClasses = 'bg-emerald-400 text-black hover:bg-emerald-500';

  const getScoreColor = (score: number) => {
    if (theme === 'dark') {
      if (score >= 8) return 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20';
      if (score >= 5) return 'text-yellow-300 bg-yellow-500/10 border-yellow-500/20';
      return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
    }
    if (score >= 8) return 'text-emerald-800 bg-emerald-100 border-emerald-200';
    if (score >= 5) return 'text-amber-800 bg-amber-100 border-amber-200';
    return 'text-rose-800 bg-rose-100 border-rose-200';
  };

  const currentBoundingBox = hoveredFinding && activeImage?.analysis 
    ? activeImage.analysis.heuristics[hoveredFinding.heuristicId]?.observations[hoveredFinding.index]?.boundingBox 
    : null;

  const showReadyCTA = activeIndex !== null && analysisReadyIndices.includes(activeIndex) && activeImage && !activeImage.isLoading;
  const modelForFooter = activeImage?.model || DEFAULT_MODEL;

  return (
    <div className={`flex flex-col h-screen max-h-screen font-sans selection:bg-emerald-500/30 overflow-hidden ${themeClasses}`}>
      <header className={`h-16 border-b px-6 flex items-center justify-between z-20 shrink-0 ${theme === 'dark' ? 'bg-black border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
        <button onClick={() => setView('auditor')} className="flex items-center gap-3 cursor-pointer group rounded-lg transition-all" aria-label="Back to Auditor">
          <div className="w-8 h-8 bg-emerald-500 rounded flex items-center justify-center shadow-[0_0_15px_rgba(52,211,153,0.3)] group-hover:scale-105 transition-transform">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-zinc-900" fill="currentColor">
              <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
            </svg>
          </div>
          <h1 className={`text-xl font-bold tracking-tighter uppercase ${accentClasses}`}>HEURISTIC<span className={theme === 'dark' ? 'text-white' : 'text-zinc-900'}>UX</span></h1>
        </button>
        <div className="flex items-center gap-6">
          <button onClick={() => setView('rules')} className={`text-[10px] font-bold uppercase tracking-widest transition-all px-2 py-1 rounded ${view === 'rules' ? accentClasses : (theme === 'dark' ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-zinc-900')}`}>About 10 Rules</button>
          <button onClick={() => setView('scoring')} className={`text-[10px] font-bold uppercase tracking-widest transition-all px-2 py-1 rounded ${view === 'scoring' ? accentClasses : (theme === 'dark' ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-zinc-900')}`}>Scoring System</button>
          <button onClick={toggleTheme} className="p-2 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors" aria-label={theme === 'dark' ? 'Activate light mode' : 'Activate dark mode'}>{theme === 'dark' ? '☀️' : '🌙'}</button>
          <button onClick={() => { setView('auditor'); fileInputRef.current?.click(); }} className={`px-4 py-2 text-xs font-bold rounded flex items-center gap-2 transition-all active:scale-95 shadow-sm ${btnClasses}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            UPLOAD SCREENS
          </button>
          <input type="file" multiple accept="image/png, image/jpeg, image/jpg, image/webp" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
        </div>
      </header>

      {view === 'rules' ? <NNRulesView onBack={() => setView('auditor')} theme={theme} /> : view === 'scoring' ? <ScoringMethodology onBack={() => setView('auditor')} theme={theme} /> : (
        <main className="flex flex-1 overflow-hidden relative">
          {images.length > 0 && (
            <button onClick={() => setShowSidebar(!showSidebar)} className={`absolute top-1/2 -translate-y-1/2 z-50 px-1.5 py-6 flex flex-col items-center gap-2 rounded-r-xl border border-l-0 transition-all duration-700 ${theme === 'dark' ? 'bg-zinc-900/80 border-zinc-700 text-zinc-400 hover:text-emerald-400 backdrop-blur-md' : 'bg-white/80 border-zinc-300 text-zinc-400 hover:text-emerald-600 shadow-lg backdrop-blur-md'}`} style={{ transform: `translateY(-50%) translateX(${showSidebar ? sidebarWidth : 0}px)` }}>
              <div className="relative text-[9px] font-bold uppercase tracking-[0.4em] [writing-mode:vertical-lr] rotate-180">{showSidebar ? 'HIDE' : 'SHOW'} SCREENS</div>
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 transition-transform ${showSidebar ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
            </button>
          )}

          <aside style={{ width: showSidebar && images.length > 0 ? `${sidebarWidth}px` : '0px' }} className={`border-r overflow-hidden shrink-0 relative transition-all duration-700 ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-100 border-zinc-200'}`}>
            <div style={{ width: `${sidebarWidth}px`, minWidth: `${sidebarWidth}px`, opacity: showSidebar ? 1 : 0 }} className="h-full flex flex-col p-6 gap-6 overflow-y-auto">
              <div className="flex items-center justify-between">
                <h2 className="text-xs uppercase tracking-[0.2em] text-zinc-500 font-bold whitespace-nowrap">SCREENS ({images.length})</h2>
                <button onClick={() => setShowSidebar(false)} className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest px-1">Hide</button>
              </div>
              <div className="space-y-4">
                {images.map((img, idx) => (
                  <button key={img.id} onClick={() => setActiveIndex(idx)} className={`group relative w-full text-left rounded-xl overflow-hidden border-2 transition-all flex flex-col ${activeIndex === idx ? (img.error ? 'border-rose-500 bg-rose-500/5' : 'border-emerald-500 bg-emerald-500/5') : img.error ? 'border-rose-500/40 bg-rose-500/5' : theme === 'dark' ? 'border-zinc-800 bg-transparent' : 'border-zinc-200 bg-transparent'}`}>
                    <div className="relative w-full aspect-video overflow-hidden">
                      <img src={img.previewUrl} className={`w-full h-full object-cover transition-all duration-500 ${activeIndex === idx ? 'opacity-100' : 'opacity-40 group-hover:opacity-70'} ${img.isLoading ? 'blur-sm brightness-75' : ''}`} alt={`Screen ${idx + 1}`} />
                      {img.isLoading && (
                        <div className="absolute inset-0 overflow-hidden z-10">
                          <div className="animate-scan"></div>
                        </div>
                      )}
                      <div className="absolute top-2 right-2 flex gap-1 z-30">
                        <button onClick={(e) => { e.stopPropagation(); removeImage(img.id, e); }} className="w-6 h-6 rounded-full bg-zinc-900/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-600 shadow-lg" aria-label={`Remove screen ${idx + 1}`}>&times;</button>
                      </div>
                    </div>
                    
                    {img.isLoading && (
                      <div className={`p-3 flex items-center justify-start border-t ${activeIndex === idx ? 'bg-emerald-500/10 border-emerald-500/20' : (theme === 'dark' ? 'border-zinc-800' : 'border-zinc-200')}`}>
                          <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest animate-pulse">Analyzing...</span>
                      </div>
                    )}

                    {img.analysis && !img.isLoading && (
                      <div className={`p-3 flex items-center justify-between border-t ${activeIndex === idx ? 'bg-emerald-500/10 border-emerald-500/20' : (theme === 'dark' ? 'border-zinc-800' : 'border-zinc-200')}`}>
                        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">UX SCORE</span>
                        <div className={`px-2 py-0.5 rounded border text-[10px] font-bold tabular-nums ${getScoreColor(img.analysis.overallScore)}`}>{img.analysis.overallScore.toFixed(1)}</div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
            <div onMouseDown={startResizingSidebar} className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-emerald-500/40 active:bg-emerald-500 z-30" />
          </aside>

          <section className="flex-1 flex flex-col overflow-hidden relative">
            {!activeImage ? (
              <div className={`flex-1 flex flex-col items-center justify-center p-6 md:p-12 transition-colors ${theme === 'dark' ? 'bg-zinc-900' : 'bg-zinc-100'}`}>
                <button 
                  onClick={() => fileInputRef.current?.click()} 
                  className={`w-full h-full max-w-4xl max-h-[85vh] rounded-[2.5rem] border-[1.5px] border-dashed flex flex-col items-center justify-center group transition-all duration-500 hover:border-emerald-500/40 hover:bg-emerald-500/[0.01] ${theme === 'dark' ? 'bg-black/30 border-zinc-700' : 'bg-white border-zinc-300'}`}
                >
                  <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-10 transition-all duration-500 group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(52,211,153,0.1)] ${theme === 'dark' ? 'bg-zinc-900 group-hover:bg-zinc-800' : 'bg-zinc-100 group-hover:bg-zinc-200'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-10 w-10 ${theme === 'dark' ? 'text-zinc-600' : 'text-zinc-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  </div>
                  <h3 className={`text-3xl font-bold mb-4 tracking-tight ${theme === 'dark' ? 'text-zinc-200' : 'text-zinc-800'}`}>Upload Screenshots</h3>
                  <p className={`text-sm font-sans uppercase tracking-[0.3em] ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-500'}`}>PNG, JPG, WEBP</p>
                </button>
              </div>
            ) : (
              <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
                <div className="flex-1 bg-black p-4 flex items-center justify-center overflow-x-auto overflow-y-hidden relative group/mockup">
                  {activeImage && !activeImage.isLoading && (
                    <div className="relative inline-flex h-full items-center justify-center">
                      <img 
                        src={activeImage.previewUrl} 
                        className={`block h-full w-auto max-w-none shadow-2xl rounded transition-opacity duration-500 ${activeImage.error ? 'grayscale opacity-50' : 'opacity-100'}`} 
                        alt="Active Screen" 
                      />
                      
                      {currentBoundingBox && currentBoundingBox.length === 4 && (
                        <div 
                          className="absolute z-40 border-2 border-emerald-500 bg-emerald-500/10 shadow-[0_0_20px_rgba(52,211,153,0.5)] animate-pulse rounded pointer-events-none transition-all duration-300"
                          style={{
                            top: `${currentBoundingBox[0] / 10}%`,
                            left: `${currentBoundingBox[1] / 10}%`,
                            width: `${(currentBoundingBox[3] - currentBoundingBox[1]) / 10}%`,
                            height: `${(currentBoundingBox[2] - currentBoundingBox[0]) / 10}%`,
                          }}
                        >
                          <div className="absolute -top-6 left-0 bg-emerald-500 text-black text-[8px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap uppercase tracking-tighter shadow-lg">
                            Finding Location
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div onMouseDown={startResizingAnalysis} className="hidden lg:block w-1.5 h-full cursor-col-resize hover:bg-emerald-500/40 z-30 shrink-0" />
                <div style={{ width: `${analysisWidth}px` }} className={`border-l overflow-y-auto p-6 shrink-0 transition-all ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>
                  {activeImage.isLoading ? (
                    <div className="h-full flex flex-col items-center justify-center gap-4 text-zinc-500 text-center p-8">
                      <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
                      <p className={`${accentClasses} font-bold uppercase tracking-widest`}>Auditing UI...</p>
                      <p className="text-sm italic text-zinc-400 max-w-sm">{funFact}</p>
                    </div>
                  ) : showReadyCTA ? (
                    <div className="h-full flex flex-col items-center justify-center gap-6 text-center p-8">
                      <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-10 w-10 ${accentClasses}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <h2 className="text-2xl font-bold">Analysis Ready!</h2>
                      <button 
                        onClick={() => setAnalysisReadyIndices(prev => prev.filter(i => i !== activeIndex))}
                        className={`w-full max-w-xs py-4 font-bold rounded-lg transition-all uppercase tracking-widest text-sm ${btnClasses}`}
                      >
                        View Analysis
                      </button>
                    </div>
                  ) : activeImage.error ? (
                    <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                      <div className="text-rose-500 font-bold uppercase mb-2">Audit Failed.</div>
                      {activeImage.error === "QUOTA_EXHAUSTED" && (
                        <div className="text-xs text-zinc-500 max-w-sm">
                          Your Gemini quota is exhausted. Try again later or switch to a different model.
                        </div>
                      )}
                      {activeImage.error === "MISSING_OR_INVALID_API_KEY" && (
                        <div className="text-xs text-zinc-500 max-w-sm">
                          Missing/invalid API key. For local dev set <span className="font-mono">GEMINI_API_KEY</span> in <span className="font-mono">.env.local</span>. For Vercel, set it in Project → Settings → Environment Variables.
                        </div>
                      )}
                      {activeImage.error === "MODEL_NOT_FOUND" && (
                        <div className="text-xs text-zinc-500 max-w-sm">
                          This model isn’t available for your API key/project. Try switching the “Analysis Agent” model and retry.
                        </div>
                      )}
                      {activeImage.error !== "QUOTA_EXHAUSTED" && activeImage.error !== "MISSING_OR_INVALID_API_KEY" && activeImage.error !== "MODEL_NOT_FOUND" && (
                        <div className="text-xs text-zinc-500 max-w-sm">
                          {activeImage.error}
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      {activeImage.analysis && (
                        <div className="mb-8 flex flex-col">
                          <h2 className="text-3xl font-bold tracking-tighter">
                            UX SCORE: <span className={activeImage.analysis.overallScore >= 8 ? 'text-emerald-500' : activeImage.analysis.overallScore >= 5 ? 'text-yellow-500' : 'text-rose-500'}>{activeImage.analysis.overallScore.toFixed(1)}</span>
                          </h2>
                        </div>
                      )}
                      <div className={`mb-6 border rounded-xl overflow-hidden ${theme === 'dark' ? 'bg-zinc-950/50 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                        <button onClick={() => setIsContextExpanded(!isContextExpanded)} className="w-full p-4 flex items-center justify-between hover:opacity-80 transition-all text-left">
                          <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Context & Controls</span>
                          <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${isContextExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </button>
                        {(isContextExpanded || !activeImage.analysis) && (
                          <div className="p-4 pt-0 border-t border-zinc-800/20">
                            <div className="mt-4 mb-4 space-y-4">
                              <div>
                                <label htmlFor="model-select" className="block mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Analysis Agent</label>
                                <div className="relative">
                                  <select
                                    id="model-select"
                                    value={activeImage.model}
                                    onChange={(e) => setImages(prev => prev.map((item, i) => i === activeIndex ? { ...item, model: e.target.value } : item))}
                                    className={`w-full border rounded-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all appearance-none ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-200'}`}
                                  >
                                    {availableModels.map(m => (
                                      <option key={m.id} value={m.id}>{m.name}</option>
                                    ))}
                                  </select>
                                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-zinc-500">
                                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                                  </div>
                                </div>
                              </div>
                              <textarea value={activeImage.userContext || ''} onChange={(e) => setImages(prev => prev.map((item, i) => i === activeIndex ? { ...item, userContext: e.target.value } : item))} placeholder="Describe app purpose, user goals, or specific flows..." aria-label="Provide context for the AI analysis" className={`w-full h-24 border rounded-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all resize-none ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-200'}`} />
                            </div>
                            <button onClick={() => triggerAnalysis(activeIndex!)} disabled={activeImage.isLoading} className={`w-full py-4 font-bold rounded-lg transition-all uppercase tracking-widest text-[10px] ${btnClasses}`}>
                              {activeImage.analysis ? 'Regenerate Audit' : 'Initialize Analysis'}
                            </button>
                          </div>
                        )}
                      </div>
                      {activeImage.analysis && (
                        <div className="space-y-4">
                          <div className={`border rounded-xl p-5 mb-6 ${theme === 'dark' ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-emerald-50 border-emerald-500/20'}`}>
                            <h4 className="text-[10px] font-bold text-emerald-500 uppercase mb-3 tracking-widest">Executive Summary</h4>
                            <p className="text-sm italic opacity-90 leading-relaxed">"{activeImage.analysis.summary}"</p>
                          </div>
                          {NIELSEN_HEURISTICS.map(h => (
                            <HeuristicCard 
                              key={h.id} 
                              heuristic={h} 
                              detail={activeImage.analysis!.heuristics[h.id]} 
                              theme={theme} 
                              onToggleResolution={toggleFindingResolution}
                              onMouseEnterFinding={(idx) => setHoveredFinding({ heuristicId: h.id, index: idx })}
                              onMouseLeaveFinding={() => setHoveredFinding(null)}
                            />
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </section>
        </main>
      )}
      <footer className={`h-8 border-t px-6 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.3em] shrink-0 z-20 ${theme === 'dark' ? 'bg-black border-zinc-800 text-zinc-600' : 'bg-zinc-50 border-zinc-200 text-zinc-500'}`}>
        <div>NIELSEN NORMAN GROUP PRINCIPLES</div>
        <div>ANALYSIS BY {modelForFooter.replace('gemini-', '').replace('-preview', '')}</div>
      </footer>
    </div>
  );
};

export default App;
