
import React, { useState, useEffect, useRef } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import GoalManager from './components/GoalManager';
import DailyPlanner from './components/DailyPlanner';
import AICoach from './components/AICoach';
import FocusTimer from './components/FocusTimer';
import Journal from './components/Journal';
import { ViewState, Goal, Task, JournalEntry, AIConfig, AIProvider, UserStats, DailyQuote, ToastMessage, Difficulty, AITaskPlan, AIGoalPlan, SoundMode } from './types';
import { X, Key, Download, Upload, Camera, Unlock, Lock, CheckCircle2, Globe, Zap, Database, HelpCircle, Sparkles, Compass, ArrowRight, PenLine, Settings, LogOut, Info, ExternalLink, Server, Bot } from 'lucide-react';
import confetti from 'canvas-confetti';
import { generateDailyQuote } from './services/geminiService';

const INITIAL_TASKS: Task[] = [{ id: 'welcome-1', title: '👋 欢迎来到 LifeFlow！探索你的成长系统', completed: false, date: new Date().toISOString().split('T')[0], priority: 'high', difficulty: 'easy' }];
const INITIAL_STATS: UserStats = { level: 1, currentXP: 0, totalXP: 0, streakDays: 1, lastActiveDate: new Date().toISOString().split('T')[0], lifeVision: '' };
const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';

const XP_RATES = {
  task_easy: 10,
  task_medium: 30,
  task_hard: 50,
  milestone: 20,
  goal_easy: 100,
  goal_medium: 250,
  goal_hard: 500,
  focus_session: 25,
  journal_entry: 15
};

// Reliable Audio Sources
const SOUND_URLS: Record<SoundMode, string> = {
    none: '',
    rain: 'https://actions.google.com/sounds/v1/weather/rain_heavy_loud.ogg',
    forest: 'https://actions.google.com/sounds/v1/birds/forest_bird_sounds.ogg',
    cafe: 'https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg',
    ocean: 'https://actions.google.com/sounds/v1/water/waves_crashing_on_rocks.ogg',
    fire: 'https://actions.google.com/sounds/v1/ambiences/fire.ogg',
    night: 'https://actions.google.com/sounds/v1/nature/crickets_at_night.ogg',
    thunder: 'https://actions.google.com/sounds/v1/weather/thunderstorm.ogg',
    river: 'https://actions.google.com/sounds/v1/water/river_flow.ogg'
};

// --- Onboarding Component ---
const OnboardingOverlay = ({ onComplete }: { onComplete: (vision: string) => void }) => {
  const [vision, setVision] = useState('');

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-500">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden relative animate-in zoom-in-95 duration-500 ring-1 ring-white/20">
            {/* Decorative Header */}
            <div className="h-48 bg-gradient-to-br from-teal-500 to-emerald-600 relative overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/20 to-transparent"></div>
                <div className="text-center relative z-10 p-6 text-white">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/30 shadow-lg ring-4 ring-white/10">
                        <Compass size={32} className="text-white drop-shadow-md" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">LifeFlow</h1>
                    <p className="text-teal-50 text-sm font-medium mt-1 tracking-wider uppercase opacity-90">Personal Growth OS</p>
                </div>
            </div>

            <div className="p-8">
                <div className="text-center mb-8">
                    <h2 className="text-xl font-bold text-slate-800 mb-2">定义你的核心愿景</h2>
                    <p className="text-slate-500 text-sm leading-relaxed">
                        在你开始之前，AI 教练需要了解你的"北极星"。
                        <br/>
                        <span className="text-teal-600 font-medium">你究竟想成为什么样的人？</span>
                    </p>
                </div>

                <div className="space-y-6">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 focus-within:border-teal-500 focus-within:ring-4 focus-within:ring-teal-500/10 transition-all shadow-inner">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                            <Sparkles size={10} /> My Life Vision
                        </label>
                        <textarea 
                            value={vision}
                            onChange={(e) => setVision(e.target.value)}
                            placeholder="例如：成为一名独立开发者，拥有健康的体魄，并在30岁前环游世界..."
                            className="w-full bg-transparent outline-none text-slate-700 text-base min-h-[100px] resize-none placeholder:text-slate-300 font-medium leading-relaxed"
                            autoFocus
                        />
                    </div>
                    
                    <button 
                        onClick={() => onComplete(vision)}
                        disabled={!vision.trim()}
                        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
                    >
                       <Zap size={18} className={vision.trim() ? "fill-current" : ""} /> 开启成长之旅
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};

const App: React.FC = () => {
  // --- STATE: Core Data ---
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [goals, setGoals] = useState<Goal[]>(() => JSON.parse(localStorage.getItem('unigrow_goals') || '[]'));
  const [tasks, setTasks] = useState<Task[]>(() => JSON.parse(localStorage.getItem('unigrow_tasks') || JSON.stringify(INITIAL_TASKS)));
  const [journalEntries, setEntries] = useState<JournalEntry[]>(() => JSON.parse(localStorage.getItem('unigrow_journal') || '[]'));
  const [userStats, setUserStats] = useState<UserStats>(() => JSON.parse(localStorage.getItem('unigrow_stats') || JSON.stringify(INITIAL_STATS)));
  const [focusMinutes, setFocusMinutes] = useState<number>(() => parseInt(localStorage.getItem('unigrow_focus_minutes') || '0'));
  
  // --- STATE: UI & Config ---
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [aiConfig, setAiConfig] = useState<AIConfig>(() => {
    const saved = localStorage.getItem('unigrow_ai_config');
    return saved ? JSON.parse(saved) : { provider: 'gemini', apiKey: localStorage.getItem('unigrow_api_key') || '', baseUrl: '', modelName: DEFAULT_GEMINI_MODEL };
  });
  const [dailyQuote, setDailyQuote] = useState<DailyQuote | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // --- STATE: Global Timer (Lifted Up) ---
  const [timerState, setTimerState] = useState(() => {
    const saved = localStorage.getItem('unigrow_timer_state');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Ensure we don't restore in a weird state if data is corrupted
      return {
        minutes: parsed.minutes ?? 25,
        seconds: parsed.seconds ?? 0,
        isActive: parsed.isActive ?? false,
        mode: parsed.mode ?? 'focus',
        initialMinutes: parsed.initialMinutes ?? 25,
        selectedTaskId: parsed.selectedTaskId ?? '',
        soundEnabled: parsed.soundEnabled ?? false,
        soundMode: parsed.soundMode ?? 'rain',
        volume: parsed.volume ?? 0.5
      };
    }
    return {
      minutes: 25,
      seconds: 0,
      isActive: false,
      mode: 'focus' as 'focus' | 'break',
      initialMinutes: 25,
      selectedTaskId: '',
      soundEnabled: false,
      soundMode: 'rain' as SoundMode,
      volume: 0.5
    };
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // --- EFFECTS: Persistence ---
  useEffect(() => localStorage.setItem('unigrow_goals', JSON.stringify(goals)), [goals]);
  useEffect(() => localStorage.setItem('unigrow_tasks', JSON.stringify(tasks)), [tasks]);
  useEffect(() => localStorage.setItem('unigrow_journal', JSON.stringify(journalEntries)), [journalEntries]);
  useEffect(() => localStorage.setItem('unigrow_stats', JSON.stringify(userStats)), [userStats]);
  useEffect(() => localStorage.setItem('unigrow_focus_minutes', focusMinutes.toString()), [focusMinutes]);
  useEffect(() => localStorage.setItem('unigrow_ai_config', JSON.stringify(aiConfig)), [aiConfig]);
  
  // Save Timer State
  useEffect(() => {
    localStorage.setItem('unigrow_timer_state', JSON.stringify(timerState));
  }, [timerState]);

  // Daily Init
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const fetchQuote = async () => {
      const storedQuote = localStorage.getItem(`unigrow_quote_${today}`);
      if (storedQuote) {
        setDailyQuote(JSON.parse(storedQuote));
      } else {
        const quote = await generateDailyQuote(goals);
        if (quote) {
          const newQuote = { ...quote, date: today };
          setDailyQuote(newQuote);
          localStorage.setItem(`unigrow_quote_${today}`, JSON.stringify(newQuote));
        }
      }
    };

    if (userStats.lastActiveDate !== today) {
      const isStreak = new Date(today).getTime() - new Date(userStats.lastActiveDate).getTime() <= 86400000;
      setUserStats(prev => ({
        ...prev,
        lastActiveDate: today,
        streakDays: isStreak ? prev.streakDays + 1 : 1
      }));
    }
    fetchQuote();
  }, []); // Run once on mount

  // --- EFFECTS: Audio Engine ---
  useEffect(() => {
      if (!audioRef.current) {
          audioRef.current = new Audio();
          audioRef.current.loop = true;
      }
      
      const audio = audioRef.current;
      const url = SOUND_URLS[timerState.soundMode as SoundMode];

      if (timerState.soundEnabled && url && timerState.isActive) {
          if (audio.src !== url) {
              audio.src = url;
              audio.load();
          }
          audio.volume = timerState.volume;
          const playPromise = audio.play();
          if (playPromise !== undefined) {
              playPromise.catch(error => console.log("Audio play prevented:", error));
          }
      } else {
          audio.pause();
          // Reset src only if explicitly disabled to avoid reloading on pause
      }
      
      return () => {
          // Cleanup not strictly necessary for global audio but good practice
      };
  }, [timerState.soundEnabled, timerState.soundMode, timerState.isActive, timerState.volume]);


  // --- EFFECTS: Timer Logic ---
  useEffect(() => {
    if (timerState.isActive) {
      timerRef.current = setInterval(() => {
        setTimerState(prev => {
          if (prev.seconds === 0) {
            if (prev.minutes === 0) {
              // Timer Finished
              if (timerRef.current) clearInterval(timerRef.current);
              
              // Add XP and Stats
              if (prev.mode === 'focus') {
                  const minutesToAdd = prev.initialMinutes;
                  setFocusMinutes(fm => fm + minutesToAdd);
                  addXP(minutesToAdd >= 25 ? XP_RATES.focus_session : 10);
                  // Don't toast here, let the FocusTimer component handle the completion modal
              }

              return { ...prev, isActive: false, soundEnabled: false }; // Auto stop sound
            }
            return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
          }
          return { ...prev, seconds: prev.seconds - 1 };
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerState.isActive]);


  // --- ACTIONS ---

  const addXP = (amount: number) => {
    setUserStats(prev => {
      const nextLevelStartXP = 250 * Math.pow(prev.level, 2);
      let newTotal = prev.totalXP + amount;
      let newLevel = prev.level;
      let newCurrent = newTotal; // Simplified logic
      
      if (newTotal >= nextLevelStartXP) {
        newLevel++;
        triggerToast(`🎉 升级了！你是 Lv.${newLevel} 了！`, 'success');
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }
      return { ...prev, totalXP: newTotal, level: newLevel, currentXP: newCurrent };
    });
  };

  const triggerToast = (text: string, type: ToastMessage['type']) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, text, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  const handleGoalAction = (action: 'create' | 'milestone' | 'complete', difficulty: Difficulty = 'medium') => {
    let xp = 0;
    if (action === 'create') xp = 5;
    if (action === 'milestone') {
      xp = XP_RATES.milestone;
      triggerToast(`里程碑达成！+${xp} XP`, 'success');
    }
    if (action === 'complete') {
      xp = difficulty === 'hard' ? XP_RATES.goal_hard : difficulty === 'medium' ? XP_RATES.goal_medium : XP_RATES.goal_easy;
      triggerToast(`目标达成！太棒了！+${xp} XP`, 'success');
      confetti();
    }
    addXP(xp);
  };

  const toggleTask = (taskId: string) => {
    setTasks(prev => {
      const task = prev.find(t => t.id === taskId);
      if (!task) return prev;
      
      const isCompleting = !task.completed;
      if (isCompleting) {
        const xp = task.difficulty === 'hard' ? XP_RATES.task_hard : task.difficulty === 'medium' ? XP_RATES.task_medium : XP_RATES.task_easy;
        triggerToast(`任务完成！+${xp} XP`, 'success');
        addXP(xp);
        
        // Update Goal Progress if related
        if (task.relatedGoalId && task.relatedMilestoneId) {
            setGoals(gs => gs.map(g => {
                if (g.id === task.relatedGoalId) {
                    const updatedMilestones = g.milestones.map(m => m.id === task.relatedMilestoneId ? { ...m, completed: true } : m);
                    const completedCount = updatedMilestones.filter(m => m.completed).length;
                    const newProgress = Math.round((completedCount / updatedMilestones.length) * 100);
                    return { ...g, milestones: updatedMilestones, progress: newProgress };
                }
                return g;
            }));
        }
      }
      
      return prev.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);
    });
  };

  const exportData = () => {
    const data = {
      goals,
      tasks,
      userStats,
      journalEntries,
      focusMinutes,
      aiConfig: localStorage.getItem('unigrow_ai_config') ? JSON.parse(localStorage.getItem('unigrow_ai_config')!) : null,
      version: '1.1' 
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lifeflow_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    triggerToast("备份已导出 (含日记与API Key)", "success");
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.goals) setGoals(data.goals);
        if (data.tasks) setTasks(data.tasks);
        if (data.userStats) setUserStats(data.userStats);
        if (data.journalEntries) setEntries(data.journalEntries);
        if (data.focusMinutes) setFocusMinutes(data.focusMinutes);
        if (data.aiConfig) {
            setAiConfig(data.aiConfig);
            localStorage.setItem('unigrow_ai_config', JSON.stringify(data.aiConfig));
        }
        
        triggerToast("数据恢复成功！", "success");
        setIsSettingsOpen(false);
      } catch (err) {
        triggerToast("文件格式错误", "info");
      }
    };
    reader.readAsText(file);
  };

  const handleAIPlanAccept = (plan: AITaskPlan) => {
      const newTasks = plan.items.map((item, idx) => ({
          id: Date.now() + '-' + idx,
          title: item.title,
          completed: false,
          date: new Date().toISOString().split('T')[0],
          priority: item.priority,
          difficulty: item.difficulty
      }));
      setTasks(prev => [...prev, ...newTasks]);
      triggerToast(`已添加 ${newTasks.length} 个智能任务`, 'success');
      setCurrentView('planner');
  };

  const handleAIGoalAccept = (plan: AIGoalPlan) => {
      const newGoal: Goal = {
          id: Date.now().toString(),
          title: plan.title,
          category: plan.category,
          description: plan.description,
          milestones: plan.milestones.map((m, i) => ({ id: `${Date.now()}-${i}`, title: m, completed: false })),
          progress: 0,
          difficulty: plan.difficulty
      };
      setGoals(prev => [...prev, newGoal]);
      triggerToast("新目标已创建！", 'success');
      setCurrentView('goals');
  };

  const handleOnboardingComplete = (vision: string) => {
      setUserStats(prev => ({ ...prev, lifeVision: vision }));
      triggerToast("愿景已设定，系统初始化完成。", "success");
      confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 } });
  };

  // --- TIMER CONTROL HELPERS ---
  const timerControls = {
      isActive: timerState.isActive,
      toggle: () => setTimerState(prev => ({ ...prev, isActive: !prev.isActive })),
      reset: () => setTimerState(prev => ({ ...prev, isActive: false, minutes: prev.initialMinutes, seconds: 0 })),
      setMode: (mode: 'focus' | 'break') => setTimerState(prev => ({ 
          ...prev, 
          mode, 
          isActive: false, 
          minutes: mode === 'focus' ? 25 : 5, 
          initialMinutes: mode === 'focus' ? 25 : 5, 
          seconds: 0 
      })),
      adjustTime: (amount: number) => setTimerState(prev => {
          const newMin = Math.max(1, Math.min(120, prev.minutes + amount));
          return { ...prev, minutes: newMin, initialMinutes: newMin, seconds: 0 };
      }),
      minutes: timerState.minutes,
      seconds: timerState.seconds,
      initialMinutes: timerState.initialMinutes,
      mode: timerState.mode,
      selectedTaskId: timerState.selectedTaskId,
      setSelectedTaskId: (id: string) => setTimerState(prev => ({ ...prev, selectedTaskId: id })),
      soundEnabled: timerState.soundEnabled,
      setSoundEnabled: (enabled: boolean) => setTimerState(prev => ({ ...prev, soundEnabled: enabled })),
      soundMode: timerState.soundMode,
      setSoundMode: (mode: SoundMode) => setTimerState(prev => ({ ...prev, soundMode: mode })),
      volume: timerState.volume,
      setVolume: (v: number) => setTimerState(prev => ({ ...prev, volume: v }))
  };

  const handleProviderChange = (provider: AIProvider) => {
      setAiConfig(prev => {
          let newBaseUrl = prev.baseUrl;
          let newModelName = prev.modelName;

          if (provider === 'gemini') {
              newBaseUrl = ''; // Gemini doesn't use standard base URL usually
              newModelName = 'gemini-2.5-flash';
          } else if (provider === 'deepseek') {
              newBaseUrl = 'https://api.deepseek.com';
              newModelName = 'deepseek-chat';
          } else if (provider === 'custom') {
              if (prev.provider !== 'custom') {
                  newBaseUrl = 'https://api.openai.com/v1'; // Default placeholder
                  newModelName = 'gpt-3.5-turbo';
              }
          }
          return { ...prev, provider, baseUrl: newBaseUrl, modelName: newModelName };
      });
  };

  return (
    <>
      {/* Onboarding Overlay - Appears if no life vision is set */}
      {!userStats.lifeVision && <OnboardingOverlay onComplete={handleOnboardingComplete} />}

      <Layout 
        currentView={currentView} 
        onChangeView={setCurrentView}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        userStats={userStats}
        dailyQuote={dailyQuote}
        toasts={toasts}
      >
        {currentView === 'dashboard' && <Dashboard goals={goals} tasks={tasks} focusMinutes={focusMinutes} userStats={userStats} dailyQuote={dailyQuote} journalEntries={journalEntries} onToggleTask={toggleTask} />}
        {currentView === 'planner' && <DailyPlanner tasks={tasks} setTasks={setTasks} goals={goals} onToggleTask={toggleTask} triggerToast={triggerToast} />}
        {currentView === 'goals' && <GoalManager goals={goals} setGoals={setGoals} onGoalAction={handleGoalAction} onAddToDailyPlan={(gid, mid, title, diff) => { setTasks(p => [...p, { id: Date.now().toString(), title, completed: false, date: new Date().toISOString().split('T')[0], relatedGoalId: gid, relatedMilestoneId: mid, priority: 'medium', difficulty: diff }]); triggerToast("已加入今日计划", "success"); }} triggerToast={triggerToast} />}
        {currentView === 'focus' && <FocusTimer tasks={tasks} onToggleTask={toggleTask} triggerToast={triggerToast} timerControls={timerControls} />}
        {currentView === 'journal' && <Journal entries={journalEntries} setEntries={setEntries} goals={goals} tasks={tasks} focusMinutes={focusMinutes} userStats={userStats} onEntrySaved={() => addXP(XP_RATES.journal_entry)} />}
        {currentView === 'coach' && <AICoach goals={goals} tasks={tasks} journalEntries={journalEntries} focusMinutes={focusMinutes} userStats={userStats} onAcceptTaskPlan={handleAIPlanAccept} onAcceptGoalPlan={handleAIGoalAccept} />}

        {/* Settings Modal */}
        {isSettingsOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in" onClick={() => setIsSettingsOpen(false)}>
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="p-5 border-b flex justify-between items-center bg-slate-50 shrink-0">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Settings size={20} /> 设置与备份</h3>
                    <button onClick={() => setIsSettingsOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={20} className="text-slate-500" /></button>
                </div>
                
                <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
                    
                    {/* Backup Tutorial */}
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                      <h4 className="text-sm font-bold text-blue-700 mb-2 flex items-center gap-2"><Info size={14}/> 备份功能使用说明</h4>
                      <ul className="text-xs text-blue-600/80 space-y-2 list-disc pl-4 leading-relaxed">
                          <li><strong>导出备份：</strong>点击下方“导出”按钮，生成 JSON 文件。</li>
                          <li><strong>恢复备份：</strong>点击“恢复”并上传文件，即可还原数据。</li>
                          <li><strong>安全提示：</strong>备份含 API Key，请妥善保管。</li>
                      </ul>
                    </div>

                    {/* AI Config */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-1">
                            <Sparkles size={16} className="text-teal-600"/>
                            <label className="text-sm font-bold text-slate-800 uppercase tracking-wider">AI 智能配置</label>
                        </div>
                        
                        {/* Provider Tabs */}
                        <div className="flex bg-slate-100 p-1 rounded-xl">
                            {(['gemini', 'deepseek', 'custom'] as AIProvider[]).map(p => (
                              <button 
                                  key={p} 
                                  onClick={() => handleProviderChange(p)} 
                                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${aiConfig.provider === p ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                              >
                                  {p === 'gemini' ? 'Gemini' : p === 'deepseek' ? 'DeepSeek' : '自定义 API'}
                              </button>
                            ))}
                        </div>

                        {/* GEMINI UI */}
                        {aiConfig.provider === 'gemini' && (
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-4 animate-in fade-in slide-in-from-top-2">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Zap size={16}/></div>
                                    <div>
                                        <h5 className="text-sm font-bold text-slate-800">Google Gemini</h5>
                                        <p className="text-[10px] text-slate-500 mt-1">推荐使用。速度快，免费额度高，无需代理。</p>
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-1.5 block">API 密钥 (API Key)</label>
                                    <div className="relative">
                                        <input type="password" value={aiConfig.apiKey} onChange={(e) => setAiConfig(prev => ({ ...prev, apiKey: e.target.value }))} placeholder="粘贴你的 Gemini API Key" className="w-full text-xs p-3 pl-9 rounded-xl border border-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all font-mono" />
                                        <Key size={14} className="absolute left-3 top-3 text-slate-400" />
                                    </div>
                                    <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-[10px] text-blue-600 font-bold hover:underline bg-blue-50 px-2 py-1 rounded-md border border-blue-100">
                                        <ExternalLink size={10} /> 点击获取免费 Key (需登录 Google)
                                    </a>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-1.5 block">模型名称 (Model)</label>
                                    <input type="text" value={aiConfig.modelName} onChange={(e) => setAiConfig(prev => ({ ...prev, modelName: e.target.value }))} placeholder="gemini-2.5-flash" className="w-full text-xs p-3 rounded-xl border border-slate-200 outline-none focus:border-blue-500 bg-white" />
                                </div>
                            </div>
                        )}

                        {/* DEEPSEEK UI */}
                        {aiConfig.provider === 'deepseek' && (
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-4 animate-in fade-in slide-in-from-top-2">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg"><Bot size={16}/></div>
                                    <div>
                                        <h5 className="text-sm font-bold text-slate-800">DeepSeek (深度求索)</h5>
                                        <p className="text-[10px] text-slate-500 mt-1">国产之光。推理能力强，适合复杂任务。</p>
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-1.5 block">API 密钥 (API Key)</label>
                                    <div className="relative">
                                        <input type="password" value={aiConfig.apiKey} onChange={(e) => setAiConfig(prev => ({ ...prev, apiKey: e.target.value }))} placeholder="sk-..." className="w-full text-xs p-3 pl-9 rounded-xl border border-slate-200 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all font-mono" />
                                        <Key size={14} className="absolute left-3 top-3 text-slate-400" />
                                    </div>
                                    <a href="https://platform.deepseek.com/api_keys" target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-[10px] text-indigo-600 font-bold hover:underline bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100">
                                        <ExternalLink size={10} /> 前往 DeepSeek 开放平台获取
                                    </a>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 mb-1.5 block">API 地址 (Base URL)</label>
                                        <input type="text" value={aiConfig.baseUrl} onChange={(e) => setAiConfig(prev => ({ ...prev, baseUrl: e.target.value }))} placeholder="https://api.deepseek.com" className="w-full text-xs p-3 rounded-xl border border-slate-200 outline-none focus:border-indigo-500 bg-white" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 mb-1.5 block">模型 (Model)</label>
                                        <input type="text" value={aiConfig.modelName} onChange={(e) => setAiConfig(prev => ({ ...prev, modelName: e.target.value }))} placeholder="deepseek-chat" className="w-full text-xs p-3 rounded-xl border border-slate-200 outline-none focus:border-indigo-500 bg-white" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* CUSTOM UI */}
                        {aiConfig.provider === 'custom' && (
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-4 animate-in fade-in slide-in-from-top-2">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-slate-200 text-slate-600 rounded-lg"><Server size={16}/></div>
                                    <div>
                                        <h5 className="text-sm font-bold text-slate-800">自定义 API (OpenAI 协议)</h5>
                                        <p className="text-[10px] text-slate-500 mt-1">兼容 SiliconFlow, OpenRouter, LocalAI 等。</p>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-1.5 block">API 地址 (Base URL)</label>
                                    <input type="text" value={aiConfig.baseUrl} onChange={(e) => setAiConfig(prev => ({ ...prev, baseUrl: e.target.value }))} placeholder="例如: https://api.siliconflow.cn/v1" className="w-full text-xs p-3 rounded-xl border border-slate-200 outline-none focus:border-slate-500 bg-white font-mono" />
                                    <p className="text-[9px] text-slate-400 mt-1 ml-1">💡 通常以 /v1 结尾，请参考服务商文档。</p>
                                </div>
                                
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-1.5 block">API 密钥 (API Key)</label>
                                    <div className="relative">
                                        <input type="password" value={aiConfig.apiKey} onChange={(e) => setAiConfig(prev => ({ ...prev, apiKey: e.target.value }))} placeholder="sk-..." className="w-full text-xs p-3 pl-9 rounded-xl border border-slate-200 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-500/10 transition-all font-mono" />
                                        <Key size={14} className="absolute left-3 top-3 text-slate-400" />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-1.5 block">模型名称 (Model Name)</label>
                                    <input type="text" value={aiConfig.modelName} onChange={(e) => setAiConfig(prev => ({ ...prev, modelName: e.target.value }))} placeholder="例如: deepseek-ai/DeepSeek-V3" className="w-full text-xs p-3 rounded-xl border border-slate-200 outline-none focus:border-slate-500 bg-white" />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Data Management */}
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                        <div className="flex items-center gap-2 mb-1">
                            <Database size={16} className="text-amber-600"/>
                            <label className="text-sm font-bold text-slate-800 uppercase tracking-wider">数据管理</label>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={exportData} className="flex flex-col items-center justify-center p-4 bg-white hover:bg-teal-50 border border-slate-200 hover:border-teal-200 rounded-2xl transition-all group shadow-sm">
                                <Download size={24} className="text-slate-400 group-hover:text-teal-600 mb-2" />
                                <span className="text-xs font-bold text-slate-600 group-hover:text-teal-700">导出备份文件</span>
                            </button>
                            <label className="flex flex-col items-center justify-center p-4 bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-200 rounded-2xl transition-all group cursor-pointer shadow-sm">
                                <Upload size={24} className="text-slate-400 group-hover:text-amber-600 mb-2" />
                                <span className="text-xs font-bold text-slate-600 group-hover:text-amber-700">恢复数据备份</span>
                                <input type="file" accept=".json" onChange={importData} className="hidden" />
                            </label>
                        </div>
                    </div>
                    
                    <div className="pt-2 text-center pb-2">
                        <p className="text-[10px] text-slate-300">LifeFlow v1.1.2</p>
                    </div>
                </div>
            </div>
          </div>
        )}

        {/* Profile Modal */}
        {isProfileOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in" onClick={() => setIsProfileOpen(false)}>
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                  {/* Close Button - High Z-Index & Contrast */}
                  <button 
                    onClick={() => setIsProfileOpen(false)} 
                    className="absolute top-4 right-4 z-50 p-2 bg-black/20 hover:bg-black/30 text-white rounded-full backdrop-blur-sm transition-all"
                  >
                    <X size={20} />
                  </button>

                  <div className="h-32 bg-gradient-to-r from-teal-400 to-emerald-500 relative">
                      <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
                          <div className="w-24 h-24 bg-white rounded-full p-1 shadow-xl">
                              <div className="w-full h-full bg-slate-100 rounded-full flex items-center justify-center overflow-hidden">
                                  {userStats.avatar ? <img src={userStats.avatar} alt="Avatar" className="w-full h-full object-cover" /> : <span className="text-4xl">🧑‍🚀</span>}
                              </div>
                              <button className="absolute bottom-0 right-0 p-1.5 bg-slate-800 text-white rounded-full shadow-md hover:bg-teal-600 transition-colors">
                                  <Camera size={14} />
                              </button>
                          </div>
                      </div>
                  </div>
                  
                  <div className="pt-12 pb-8 px-6 text-center">
                      <h2 className="text-2xl font-bold text-slate-800">Level {userStats.level}</h2>
                      <p className="text-slate-500 text-sm font-medium mb-6">初学者 • {userStats.totalXP} XP</p>
                      
                      <div className="bg-slate-50 rounded-xl p-4 mb-6 text-left border border-slate-100">
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">My Life Vision (人生愿景)</label>
                          <textarea 
                            value={userStats.lifeVision}
                            onChange={(e) => setUserStats(prev => ({...prev, lifeVision: e.target.value}))}
                            placeholder="你想要成为什么样的人？写下你的座右铭..."
                            className="w-full bg-transparent text-sm text-slate-700 font-serif italic outline-none resize-none h-16 placeholder:text-slate-300"
                          />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div className="bg-orange-50 p-3 rounded-xl border border-orange-100">
                              <div className="text-2xl font-bold text-orange-600 mb-1">{userStats.streakDays}</div>
                              <div className="text-[10px] text-orange-400 font-bold uppercase">连续打卡</div>
                          </div>
                          <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                              <div className="text-2xl font-bold text-blue-600 mb-1">{goals.filter(g => g.progress === 100).length}</div>
                              <div className="text-[10px] text-blue-400 font-bold uppercase">达成目标</div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
        )}

      </Layout>
    </>
  );
};

export default App;
