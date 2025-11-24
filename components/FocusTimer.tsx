
import React, { useState } from 'react';
import { Play, Pause, RotateCcw, Coffee, Brain, Volume2, VolumeX, Maximize2, Minimize2, CheckCircle2, HelpCircle, X, Plus, Minus, ChevronDown, Music2 } from 'lucide-react';
import { Task, SoundMode } from '../types';

interface FocusTimerProps {
  tasks: Task[];
  onToggleTask?: (taskId: string) => void;
  triggerToast: (msg: string, type: 'success' | 'info' | 'encouragement') => void;
  // New props for global control
  timerControls: {
    isActive: boolean;
    toggle: () => void;
    reset: () => void;
    setMode: (mode: 'focus' | 'break') => void;
    adjustTime: (amount: number) => void;
    minutes: number;
    seconds: number;
    initialMinutes: number;
    mode: 'focus' | 'break';
    selectedTaskId: string;
    setSelectedTaskId: (id: string) => void;
    soundEnabled: boolean;
    setSoundEnabled: (enabled: boolean) => void;
    soundMode: SoundMode;
    setSoundMode: (mode: SoundMode) => void;
    volume: number;
    setVolume: (v: number) => void;
  };
}

const SOUND_OPTIONS: {id: SoundMode, label: string}[] = [
    {id:'none',label:'无'},
    {id:'rain',label:'🌧️ 雨声'},
    {id:'forest',label:'🌲 森林 (鸟鸣)'},
    {id:'ocean',label:'🌊 海浪'},
    {id:'fire',label:'🔥 篝火'},
    {id:'night',label:'🦗 夏夜'},
    {id:'thunder',label:'⚡ 雷雨'},
    {id:'cafe',label:'☕ 咖啡厅'},
    {id:'river',label:'💧 溪流'}
];

const FocusTimer: React.FC<FocusTimerProps> = ({ tasks, onToggleTask, triggerToast, timerControls }) => {
  const {
      isActive, toggle, reset, setMode, adjustTime,
      minutes, seconds, initialMinutes, mode,
      selectedTaskId, setSelectedTaskId,
      soundEnabled, setSoundEnabled, soundMode, setSoundMode,
      volume, setVolume
  } = timerControls;

  const [isImmersive, setIsImmersive] = useState(false);
  const [showNoiseInfo, setShowNoiseInfo] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showSoundMenu, setShowSoundMenu] = useState(false);

  React.useEffect(() => {
      if (!isActive && minutes === 0 && seconds === 0 && mode === 'focus' && selectedTaskId) {
          setShowCompletionModal(true);
      }
  }, [isActive, minutes, seconds, mode, selectedTaskId]);

  const handleTaskComplete = () => {
      if (selectedTaskId && onToggleTask) {
          onToggleTask(selectedTaskId);
          triggerToast("任务已勾选！效率爆棚。", "success");
      }
      setShowCompletionModal(false);
      setSelectedTaskId('');
  };

  const totalSeconds = initialMinutes * 60;
  const currentTotalSeconds = minutes * 60 + seconds;
  const progress = totalSeconds > 0 ? ((totalSeconds - currentTotalSeconds) / totalSeconds) * 100 : 0;
  
  const getProgressColor = () => {
      if (mode === 'break') return 'text-teal-500';
      const percentage = (currentTotalSeconds / totalSeconds) * 100;
      if (percentage > 60) return 'text-teal-500'; 
      if (percentage > 20) return 'text-amber-500'; 
      return 'text-red-500';
  };

  const pendingTasks = tasks.filter(t => !t.completed);
  const selectedTaskTitle = tasks.find(t => t.id === selectedTaskId)?.title;

  return (
    <div className={`h-[calc(100vh-140px)] flex flex-col items-center transition-all duration-500 relative ${isImmersive ? 'fixed inset-0 z-[200] bg-slate-50 h-screen' : ''}`}>
        
        {/* Immersion Toggle */}
        <button 
            onClick={() => setIsImmersive(!isImmersive)}
            className={`absolute top-6 right-6 p-2.5 rounded-full transition-all z-50 ${isImmersive ? 'bg-slate-200 text-slate-600 hover:bg-slate-300' : 'bg-white border border-slate-200 text-slate-400 hover:bg-slate-50'}`}
            title={isImmersive ? "退出沉浸" : "进入沉浸模式"}
        >
            {isImmersive ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
        </button>

        {/* Main Content Container - Spaced Vertically */}
        <div className="flex-1 w-full max-w-lg flex flex-col justify-between py-6 px-4">
            
            {/* TOP SECTION: Task & Mode */}
            <div className="flex flex-col items-center space-y-4 pt-4 z-10">
                 {/* Mode Switcher */}
                 {!isActive && !isImmersive && (
                    <div className="bg-white/60 p-1 rounded-full backdrop-blur-sm border border-white/50 shadow-sm inline-flex">
                        <button onClick={() => setMode('focus')} className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all ${mode === 'focus' ? 'bg-teal-500 text-white shadow-md' : 'text-slate-500 hover:bg-white/50'}`}>心流</button>
                        <button onClick={() => setMode('break')} className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all ${mode === 'break' ? 'bg-amber-500 text-white shadow-md' : 'text-slate-500 hover:bg-white/50'}`}>休息</button>
                    </div>
                 )}

                 {/* Task Selector */}
                 {mode === 'focus' && (
                     <div className={`w-full max-w-xs transition-all duration-300 ${isActive ? 'scale-105' : ''}`}>
                         {isActive ? (
                             <div className="bg-white/80 backdrop-blur-xl border border-white/60 shadow-lg rounded-2xl px-6 py-3 flex items-center justify-center gap-3 mx-auto">
                                 <div className={`w-2 h-2 rounded-full animate-pulse ${getProgressColor().replace('text-', 'bg-')}`}></div>
                                 <span className="font-bold text-slate-800 truncate max-w-[200px]">
                                     {selectedTaskId ? selectedTaskTitle : "自由专注中..."}
                                 </span>
                             </div>
                         ) : (
                             <div className="relative group">
                                 <select 
                                     value={selectedTaskId} 
                                     onChange={(e) => setSelectedTaskId(e.target.value)}
                                     className="w-full appearance-none bg-white border border-slate-200 text-slate-700 font-bold text-sm rounded-2xl px-5 py-3.5 pr-10 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 shadow-sm hover:shadow-md transition-all text-center cursor-pointer"
                                 >
                                     <option value="">🎯 选择一个任务来攻克 (可选)</option>
                                     {pendingTasks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                                 </select>
                                 <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-teal-500 transition-colors">
                                     <ChevronDown size={16} strokeWidth={3}/>
                                 </div>
                             </div>
                         )}
                     </div>
                 )}
            </div>

            {/* MIDDLE SECTION: The Ring */}
            <div className="relative flex items-center justify-center flex-1">
                {/* SVG Ring */}
                <div className="relative w-[280px] h-[280px] md:w-[340px] md:h-[340px] flex items-center justify-center select-none">
                     {/* Background Track */}
                     <svg className="w-full h-full -rotate-90 drop-shadow-xl">
                         <circle cx="50%" cy="50%" r="45%" stroke="#e2e8f0" strokeWidth="8" fill="none" strokeLinecap="round" />
                         <circle 
                             cx="50%" cy="50%" r="45%" 
                             stroke="currentColor" strokeWidth="8" fill="none" 
                             strokeLinecap="round" 
                             strokeDasharray={`${2 * Math.PI * 45}%`} 
                             strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}%`} 
                             className={`transition-all duration-1000 ease-linear ${getProgressColor()}`} 
                         />
                     </svg>
                     
                     {/* Center Content */}
                     <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                         {/* Time Controls Wrapper */}
                         <div className="flex items-center gap-6">
                             {/* Minus Button */}
                             {!isActive && !isImmersive && (
                                 <button 
                                     onClick={() => adjustTime(-5)} 
                                     className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 hover:bg-white hover:text-teal-600 flex items-center justify-center transition-all hover:scale-110 active:scale-90 hover:shadow-md"
                                 >
                                     <Minus size={20} strokeWidth={3} />
                                 </button>
                             )}

                             {/* Digits */}
                             <div className={`font-mono font-bold tracking-tighter text-slate-800 transition-all duration-500 ${isActive ? 'text-7xl md:text-8xl' : 'text-6xl md:text-7xl'}`}>
                                 {String(minutes).padStart(2, '0')}
                                 <span className="text-slate-300 animate-pulse">:</span>
                                 {String(seconds).padStart(2, '0')}
                             </div>

                             {/* Plus Button */}
                             {!isActive && !isImmersive && (
                                 <button 
                                     onClick={() => adjustTime(5)} 
                                     className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 hover:bg-white hover:text-teal-600 flex items-center justify-center transition-all hover:scale-110 active:scale-90 hover:shadow-md"
                                 >
                                     <Plus size={20} strokeWidth={3} />
                                 </button>
                             )}
                         </div>
                         
                         {/* Status Label */}
                         <div className={`mt-4 transition-all duration-500 ${isActive ? 'opacity-100 translate-y-0' : 'opacity-60 -translate-y-2'}`}>
                             <span className={`text-xs font-bold uppercase tracking-[0.4em] ${getProgressColor()}`}>
                                 {isActive ? (mode === 'break' ? 'RECHARGING' : 'FLOWING') : 'READY'}
                             </span>
                         </div>
                     </div>
                </div>
            </div>

            {/* BOTTOM SECTION: Controls */}
            <div className="flex flex-col items-center space-y-8 pb-4 z-10">
                 {/* Play/Reset Buttons */}
                 <div className="flex items-center gap-8">
                      <button 
                        onClick={toggle} 
                        className={`w-20 h-20 rounded-[2.5rem] flex items-center justify-center transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 active:translate-y-0 ${isActive ? 'bg-white text-slate-800 ring-2 ring-slate-100' : 'bg-slate-900 text-white'}`}
                      >
                          {isActive ? <Pause size={32} strokeWidth={2.5} /> : <Play size={32} strokeWidth={2.5} className="ml-1" />}
                      </button>
                      
                      <button 
                        onClick={reset} 
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${isActive ? 'opacity-50 cursor-not-allowed bg-slate-100 text-slate-300' : 'bg-white border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-teal-600 hover:border-teal-200 hover:rotate-180 duration-500 shadow-sm'}`}
                        disabled={isActive}
                        title="重置"
                      >
                          <RotateCcw size={20} />
                      </button>
                 </div>

                 {/* White Noise - Bottom Bar */}
                 {!isImmersive && (
                     <div className="bg-white/50 backdrop-blur-md border border-white/60 rounded-2xl p-2 flex items-center gap-2 shadow-sm relative">
                         <button onClick={() => setSoundEnabled(!soundEnabled)} className={`p-3 rounded-xl transition-all ${soundEnabled ? 'text-teal-600 bg-teal-50' : 'text-slate-300 hover:text-slate-400'}`}>
                             {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                         </button>
                         <div className="w-px h-6 bg-slate-200 mx-1"></div>
                         
                         <button onClick={() => setShowSoundMenu(!showSoundMenu)} className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-100 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-all min-w-[120px] justify-between">
                            <span className="truncate">{SOUND_OPTIONS.find(s => s.id === soundMode)?.label || '选择白噪音'}</span>
                            <ChevronDown size={14} className={`transition-transform ${showSoundMenu ? 'rotate-180' : ''}`} />
                         </button>

                         {/* Sound Dropdown Menu */}
                         {showSoundMenu && (
                             <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-56 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-white/60 p-3 grid grid-cols-1 gap-2 animate-in slide-in-from-bottom-2 fade-in z-50">
                                 <div className="px-2 pb-2 border-b border-slate-100">
                                     <div className="flex justify-between text-[10px] text-slate-400 mb-1 font-bold uppercase"><span>Volume</span><span>{Math.round(volume * 100)}%</span></div>
                                     <input 
                                       type="range" 
                                       min="0" max="1" step="0.05" 
                                       value={volume} 
                                       onChange={(e) => setVolume(parseFloat(e.target.value))}
                                       className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-500"
                                     />
                                 </div>
                                 <div className="max-h-[200px] overflow-y-auto space-y-1 custom-scrollbar">
                                     {SOUND_OPTIONS.map(s => (
                                         <button 
                                            key={s.id}
                                            onClick={() => { setSoundMode(s.id); if(s.id !== 'none') setSoundEnabled(true); }}
                                            className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold text-left flex items-center gap-2 transition-all ${soundMode === s.id ? 'bg-teal-50 text-teal-600' : 'text-slate-500 hover:bg-slate-50'}`}
                                         >
                                             <span className="flex-1">{s.label}</span>
                                             {soundMode === s.id && <CheckCircle2 size={12} />}
                                         </button>
                                     ))}
                                 </div>
                             </div>
                         )}

                         <button onClick={() => setShowNoiseInfo(true)} className="ml-1 p-2 text-slate-300 hover:text-teal-500"><HelpCircle size={14}/></button>
                     </div>
                 )}
            </div>
        </div>

        {/* Modals (Noise Info & Completion) */}
        {showNoiseInfo && (
            <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-in fade-in">
                <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-xs w-full relative animate-in zoom-in-95">
                    <button onClick={() => setShowNoiseInfo(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X size={20}/></button>
                    <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><Brain size={18} className="text-teal-500"/> 专注白噪音</h3>
                    <p className="text-sm text-slate-600 leading-relaxed mb-5">
                        白噪音能遮蔽突发噪音，帮助大脑维持 Alpha 波状态，从而提升心流体验。建议佩戴耳机使用。
                    </p>
                    <button onClick={() => setShowNoiseInfo(false)} className="w-full bg-slate-100 text-slate-700 font-bold py-3 rounded-xl text-sm hover:bg-slate-200">知道了</button>
                </div>
            </div>
        )}

        {showCompletionModal && (
            <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
                <div className="bg-white rounded-[2rem] shadow-2xl p-8 max-w-sm w-full text-center animate-in zoom-in-95">
                    <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                        <CheckCircle2 size={40} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">专注完成！</h2>
                    <p className="text-slate-500 mb-8">
                        你刚刚完成了 {initialMinutes} 分钟的深度工作。<br/>
                        是否标记 <strong className="text-slate-800">"{selectedTaskTitle}"</strong> 为已完成？
                    </p>
                    <div className="flex gap-3">
                        <button onClick={() => setShowCompletionModal(false)} className="flex-1 py-3.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors">保留任务</button>
                        <button onClick={handleTaskComplete} className="flex-1 py-3.5 rounded-xl bg-teal-600 text-white font-bold shadow-lg hover:bg-teal-700 transition-colors">✅ 完成任务</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default FocusTimer;
