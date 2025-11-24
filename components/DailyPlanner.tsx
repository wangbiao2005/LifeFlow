
import React, { useState, useMemo, useEffect } from 'react';
import { Task, Goal, Priority, Difficulty } from '../types';
import { Check, X, Calendar, RefreshCw, ArrowRight, Target, Zap, History, Trophy, Clock, CheckCircle2, Link2 } from 'lucide-react';

interface DailyPlannerProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  goals: Goal[];
  onToggleTask: (taskId: string) => void;
  triggerToast: (msg: string, type: 'success' | 'info' | 'encouragement') => void;
}

const DailyPlanner: React.FC<DailyPlannerProps> = ({ tasks, setTasks, goals, onToggleTask, triggerToast }) => {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [selectedGoal, setSelectedGoal] = useState<string>('');
  const [selectedMilestone, setSelectedMilestone] = useState<string>('');
  const [selectedPriority, setSelectedPriority] = useState<Priority>('medium');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('easy');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const displayDate = new Date().toLocaleDateString('zh-CN', { weekday: 'long', month: 'long', day: 'numeric' });
  
  const todaysTasks = tasks.filter(t => t.date === today);
  const overdueTasks = tasks.filter(t => t.date < today && !t.completed);
  
  useEffect(() => {
      setSelectedMilestone('');
  }, [selectedGoal]);

  const availableMilestones = useMemo(() => {
      if (!selectedGoal) return [];
      const goal = goals.find(g => g.id === selectedGoal);
      if (!goal) return [];
      // We only show uncompleted milestones for linking
      return goal.milestones.filter(m => !m.completed);
  }, [selectedGoal, goals]);

  const historyGroups = useMemo(() => {
    const completedPastTasks = tasks.filter(t => t.completed && t.date < today);
    const groups: Record<string, Task[]> = {};
    completedPastTasks.forEach(t => {
        if (!groups[t.date]) groups[t.date] = [];
        groups[t.date].push(t);
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [tasks, today]);

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    // Allow empty title IF milestone is selected (use milestone title)
    let finalTitle = newTaskTitle;
    if (!finalTitle.trim() && selectedMilestone) {
        const mTitle = availableMilestones.find(m => m.id === selectedMilestone)?.title;
        if (mTitle) finalTitle = mTitle;
    }

    if (!finalTitle.trim()) return;

    setTasks(prev => [...prev, {
      id: Date.now().toString(),
      title: finalTitle,
      completed: false,
      date: today,
      relatedGoalId: selectedGoal || undefined,
      relatedMilestoneId: selectedMilestone || undefined,
      priority: selectedPriority,
      difficulty: selectedDifficulty
    }]);
    setNewTaskTitle('');
    setSelectedGoal('');
    setSelectedMilestone('');
    triggerToast("任务已添加，保持专注。", "info");
  };

  const migrateOverdueTasks = () => {
      setTasks(prev => prev.map(t => (t.date < today && !t.completed) ? { ...t, date: today } : t));
      triggerToast("带着经验重新出发，今天会更好！", "encouragement");
  };

  const getDifficultyXP = (d: Difficulty) => d === 'hard' ? 50 : d === 'medium' ? 30 : 10;
  const getDifficultyColor = (d: Difficulty) => d === 'hard' ? 'text-red-500 bg-red-50' : d === 'medium' ? 'text-amber-500 bg-amber-50' : 'text-teal-500 bg-teal-50';

  const getLinkedInfo = (task: Task) => {
      if (!task.relatedGoalId) return null;
      const goal = goals.find(g => g.id === task.relatedGoalId);
      if (!goal) return null;
      const milestone = task.relatedMilestoneId ? goal.milestones.find(m => m.id === task.relatedMilestoneId) : null;
      return { goalTitle: goal.title, milestoneTitle: milestone?.title };
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      <div className="flex justify-between items-start">
        <div>
          <div className="inline-flex items-center gap-2 text-teal-700 bg-teal-100/50 px-4 py-1.5 rounded-full text-sm font-semibold mb-4 border border-teal-100 backdrop-blur-sm">
            <Calendar size={16} /> <span>{displayDate}</span>
          </div>
          <h2 className="text-4xl font-bold text-slate-800 tracking-tight">每日计划</h2>
        </div>
        <button 
          onClick={() => setIsHistoryOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 hover:text-teal-600 transition-colors shadow-sm"
        >
          <History size={16} /> 往期成就
        </button>
      </div>

      {/* Warm Overdue Prompt */}
      {overdueTasks.length > 0 && (
          <div className="bg-amber-50/90 border border-amber-100 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm backdrop-blur-sm">
              <div className="flex items-center gap-4">
                  <div className="bg-amber-100 p-3 rounded-xl text-amber-600 shrink-0"><Clock size={24} /></div>
                  <div>
                    <h3 className="font-bold text-amber-800 text-lg">昨日有些小遗憾 ({overdueTasks.length})</h3>
                    <p className="text-sm text-amber-700/80">"没关系，昨日已逝。把未完成的挑战带到今天，继续前行吧。"</p>
                  </div>
              </div>
              <button onClick={migrateOverdueTasks} className="whitespace-nowrap px-6 py-3 bg-amber-500 text-white font-bold rounded-xl text-sm hover:bg-amber-600 transition-colors shadow-md flex items-center gap-2">
                 <RefreshCw size={16} /> 全部移动到今天
              </button>
          </div>
      )}

      <div className="glass-panel p-8 rounded-3xl shadow-xl shadow-teal-500/5">
        <form onSubmit={addTask} className="space-y-4 mb-10">
          <div className="flex gap-3">
            <input 
                type="text" 
                value={newTaskTitle} 
                onChange={(e) => setNewTaskTitle(e.target.value)} 
                placeholder={selectedMilestone ? "使用里程碑标题 (或输入新标题)..." : "添加今日待办..."} 
                className="flex-1 border-0 ring-1 ring-slate-200 bg-white/70 rounded-xl px-5 py-4 text-lg focus:ring-2 focus:ring-teal-500/30 outline-none placeholder:text-slate-400" 
            />
            <button type="submit" disabled={!newTaskTitle && !selectedMilestone} className="bg-slate-900 text-white px-8 py-4 rounded-xl hover:bg-slate-800 transition-colors shadow-lg disabled:opacity-50"><ArrowRight size={24} /></button>
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            {/* Goal Selector */}
            <select value={selectedGoal} onChange={(e) => setSelectedGoal(e.target.value)} className={`bg-white/50 border rounded-lg px-4 py-2 text-sm outline-none focus:border-teal-500 text-slate-600 max-w-[240px] truncate ${selectedGoal ? 'border-teal-500 text-teal-700 bg-teal-50' : 'border-slate-200'}`}>
                <option value="">🔗 关联目标 (可选)</option>
                {goals.filter(g => g.progress < 100).map(g => (
                    <option key={g.id} value={g.id}>{g.title} ({g.progress}%)</option>
                ))}
            </select>
            
            {/* Milestone Selector (Only shows if goal selected) */}
            {selectedGoal && (
                <select 
                    value={selectedMilestone} 
                    onChange={(e) => setSelectedMilestone(e.target.value)} 
                    className="bg-white/50 border border-teal-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-teal-500 text-teal-700 max-w-[240px] truncate animate-in fade-in slide-in-from-left-2 shadow-sm ring-2 ring-teal-500/10"
                >
                    <option value="">📌 选择具体步骤 (强关联)</option>
                    {availableMilestones.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                </select>
            )}
            
            <div className="h-8 w-[1px] bg-slate-200 mx-1 hidden md:block"></div>

            <div className="flex items-center bg-white/50 border border-slate-200 rounded-lg p-1 gap-1">
              {(['low', 'medium', 'high'] as Priority[]).map((p) => (
                <button key={p} type="button" onClick={() => setSelectedPriority(p)} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${selectedPriority === p ? 'bg-white shadow-sm text-slate-800 ring-1 ring-black/5' : 'text-slate-400'}`}>
                   <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${p === 'high' ? 'bg-red-500' : p === 'medium' ? 'bg-amber-500' : 'bg-slate-400'}`}></span>{p === 'high' ? '高' : p === 'medium' ? '中' : '低'}
                </button>
              ))}
            </div>

            <div className="flex items-center bg-white/50 border border-slate-200 rounded-lg p-1 gap-1">
              {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
                <button key={d} type="button" onClick={() => setSelectedDifficulty(d)} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${selectedDifficulty === d ? 'bg-white shadow-sm text-teal-800 ring-1 ring-black/5' : 'text-slate-400'}`}>
                   {d === 'easy' ? '🌟' : d === 'medium' ? '🌟🌟' : '🌟🌟🌟'} {d === 'easy' ? '简单' : d === 'medium' ? '中等' : '困难'}
                </button>
              ))}
            </div>
            <span className="text-xs text-slate-400 ml-auto hidden sm:block">奖励 +{getDifficultyXP(selectedDifficulty)} XP</span>
          </div>
        </form>

        <div className="space-y-3">
          {todaysTasks.length === 0 && <div className="text-center py-16 text-slate-400 flex flex-col items-center"><Zap size={48} className="text-slate-200 mb-4" /> 今天还没有任务，享受当下或添加新的挑战。</div>}
          {todaysTasks.sort((a, b) => a.completed === b.completed ? 0 : a.completed ? 1 : -1).map(task => {
              const linkInfo = getLinkedInfo(task);
              return (
              <div key={task.id} className={`relative flex items-center gap-5 p-5 rounded-2xl border transition-all group ${task.completed ? 'bg-slate-50/50 border-slate-100/50 opacity-50 grayscale-[0.5]' : 'bg-white/80 border-white/60 shadow-sm hover:shadow-md'}`}>
                <button onClick={() => onToggleTask(task.id)} className={`flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${task.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 hover:border-teal-500'}`}>
                  <Check size={16} strokeWidth={3} className={`transition-transform ${task.completed ? 'scale-100' : 'scale-0'}`} />
                </button>
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <p className={`font-medium text-lg transition-all ${task.completed ? 'text-slate-400 line-through decoration-slate-300 decoration-2' : 'text-slate-800'}`}>{task.title}</p>
                        {!task.completed && (
                           <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${getDifficultyColor(task.difficulty || 'easy')}`}>
                             +{getDifficultyXP(task.difficulty || 'easy')} XP
                           </span>
                        )}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        {linkInfo && (
                            <div className="flex items-center gap-1.5 text-teal-700 font-bold bg-teal-50 border border-teal-100 px-2 py-1 rounded-md animate-in fade-in">
                                <Link2 size={12} />
                                <span>{linkInfo.goalTitle}</span>
                                {linkInfo.milestoneTitle && (
                                    <>
                                        <span className="text-teal-300 mx-1">/</span>
                                        <span className="text-teal-600 font-normal underline decoration-teal-200 underline-offset-2">{linkInfo.milestoneTitle}</span>
                                    </>
                                )}
                            </div>
                        )}
                         <span className="flex items-center gap-1"><span className={`w-1.5 h-1.5 rounded-full ${task.priority === 'high' ? 'bg-red-500' : task.priority === 'medium' ? 'bg-amber-500' : 'bg-slate-400'}`}></span> {task.priority === 'high' ? '高优先' : task.priority === 'medium' ? '中优先' : '低优先'}</span>
                    </div>
                </div>
                <button onClick={() => setTasks(prev => prev.filter(t => t.id !== task.id))} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><X size={18} /></button>
              </div>
          )})}
        </div>
      </div>

      {/* History Modal */}
      {isHistoryOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in" onClick={() => setIsHistoryOpen(false)}>
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b bg-slate-50 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Trophy className="text-amber-500" /> 成就档案馆</h3>
                        <p className="text-xs text-slate-500 mt-1">这里记录着你每一次的全力以赴</p>
                    </div>
                    <button onClick={() => setIsHistoryOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={20} className="text-slate-500"/></button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 bg-white space-y-8 custom-scrollbar">
                    {historyGroups.length === 0 && (
                        <div className="text-center py-20 text-slate-400">
                            <History size={48} className="mx-auto mb-4 opacity-20"/>
                            <p>暂无历史成就，去完成今天的第一个任务吧！</p>
                        </div>
                    )}
                    {historyGroups.map(([date, groupTasks]) => (
                        <div key={date} className="relative pl-8 border-l-2 border-slate-100">
                            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-teal-100 border-2 border-teal-500"></div>
                            <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">{new Date(date).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}</h4>
                            <div className="space-y-3">
                                {groupTasks.map(task => (
                                    <div key={task.id} className="bg-slate-50 p-3 rounded-xl flex items-center gap-3 border border-slate-100">
                                        <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                                            <CheckCircle2 size={12} />
                                        </div>
                                        <span className="text-slate-600 font-medium line-through decoration-slate-300 text-sm">{task.title}</span>
                                        <span className="ml-auto text-[10px] bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-400">
                                            +{getDifficultyXP(task.difficulty)} XP
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
export default DailyPlanner;
