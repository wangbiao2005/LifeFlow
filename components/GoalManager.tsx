
import React, { useState } from 'react';
import { Goal, Difficulty } from '../types';
import { Plus, Sparkles, Trash2, ChevronDown, ChevronUp, CheckCircle, Briefcase, Wallet, Heart, Zap, BookOpen, Target, CalendarPlus, Trophy, ListPlus, Wand2 } from 'lucide-react';
import { generateGoalPlan } from '../services/geminiService';

interface GoalManagerProps {
  goals: Goal[];
  setGoals: React.Dispatch<React.SetStateAction<Goal[]>>;
  onGoalAction: (action: 'create' | 'milestone' | 'complete', difficulty?: Difficulty) => void;
  onAddToDailyPlan: (goalId: string, milestoneId: string, title: string, difficulty: Difficulty) => void;
  triggerToast: (msg: string, type: 'success' | 'info' | 'encouragement') => void;
}

const GoalManager: React.FC<GoalManagerProps> = ({ goals, setGoals, onGoalAction, onAddToDailyPlan, triggerToast }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Goal['category']>('skill');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('medium');
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');

  const handleCreateGoal = () => {
    if (!newGoalTitle.trim()) return;
    const newGoal: Goal = {
      id: Date.now().toString(),
      title: newGoalTitle,
      category: selectedCategory,
      description: '',
      milestones: [],
      progress: 0,
      difficulty: selectedDifficulty
    };
    setGoals(prev => [...prev, newGoal]);
    setNewGoalTitle('');
    setIsAdding(false);
    onGoalAction('create');
  };

  const handleGenerateWithAI = async () => {
    if (!newGoalTitle.trim()) return;
    setIsGenerating(true);
    triggerToast("AI 教练正在思考分解步骤...", "info");
    
    const plan = await generateGoalPlan(newGoalTitle);
    
    if (plan) {
      const newGoal: Goal = {
        id: Date.now().toString(),
        title: newGoalTitle,
        category: selectedCategory,
        description: plan.description,
        milestones: plan.milestones.map((m, idx) => ({ id: `${Date.now()}-${idx}`, title: m, completed: false })),
        progress: 0,
        difficulty: selectedDifficulty
      };
      setGoals(prev => [...prev, newGoal]);
      setNewGoalTitle('');
      setIsAdding(false);
      onGoalAction('create');
      triggerToast("规划完成！让我们一步步实现它。", "success");
    } else {
      triggerToast("AI 暂时无法响应，请手动创建。", "info");
    }
    setIsGenerating(false);
  };

  // New function to handle AI breakdown for existing goals
  const handleAiBreakdownForGoal = async (e: React.MouseEvent, goal: Goal) => {
    e.stopPropagation();
    setIsGenerating(true);
    triggerToast(`正在为 "${goal.title}" 生成执行步骤...`, "info");

    const plan = await generateGoalPlan(goal.title);

    if (plan && plan.milestones) {
      setGoals(prev => prev.map(g => {
        if (g.id === goal.id) {
          // Append new milestones to existing ones
          const newMilestones = plan.milestones.map((m, idx) => ({
            id: `${Date.now()}-ai-${idx}`,
            title: m,
            completed: false
          }));
          
          // Recalculate progress
          const allMilestones = [...g.milestones, ...newMilestones];
          const completedCount = allMilestones.filter(m => m.completed).length;
          const progress = Math.round((completedCount / allMilestones.length) * 100);
          
          return { ...g, milestones: allMilestones, progress, description: g.description || plan.description };
        }
        return g;
      }));
      triggerToast("目标步骤已生成！", "success");
    } else {
      triggerToast("AI 生成失败，请重试。", "info");
    }
    setIsGenerating(false);
  };

  const handleAddManualMilestone = (goalId: string) => {
    if (!newMilestoneTitle.trim()) return;
    setGoals(prev => prev.map(g => {
        if (g.id === goalId) {
            const newMilestone = {
                id: Date.now().toString(),
                title: newMilestoneTitle,
                completed: false
            };
            const updatedMilestones = [...g.milestones, newMilestone];
            const completedCount = updatedMilestones.filter(m => m.completed).length;
            const newProgress = Math.round((completedCount / updatedMilestones.length) * 100);
            return { ...g, milestones: updatedMilestones, progress: newProgress };
        }
        return g;
    }));
    setNewMilestoneTitle('');
    triggerToast("步骤已添加", "success");
  };

  const toggleMilestone = (goalId: string, milestoneId: string) => {
    let actionToTrigger: { type: 'milestone' | 'complete', difficulty?: Difficulty } | null = null;

    setGoals(prev => {
      const goal = prev.find(g => g.id === goalId);
      if (!goal) return prev;

      const updatedMilestones = goal.milestones.map(m => 
        m.id === milestoneId ? { ...m, completed: !m.completed } : m
      );
      
      const completedCount = updatedMilestones.filter(m => m.completed).length;
      const newProgress = Math.round((completedCount / updatedMilestones.length) * 100);
      const wasCompleted = goal.progress === 100;
      const isNowCompleted = newProgress === 100;
      
      // Check if we just completed a task (transition from false to true)
      const milestone = updatedMilestones.find(m => m.id === milestoneId);
      const justCompleted = milestone?.completed;

      if (!wasCompleted && isNowCompleted) {
          // Schedule completion action
          setTimeout(() => onGoalAction('complete', goal.difficulty), 0);
      } else if (justCompleted) {
          // Schedule milestone action
          setTimeout(() => onGoalAction('milestone'), 0);
      }

      return prev.map(g => g.id === goalId ? { ...g, milestones: updatedMilestones, progress: newProgress } : g);
    });
  };

  const getCategoryIcon = (cat: string) => {
      switch(cat) {
          case 'career': return <Briefcase size={16} />;
          case 'finance': return <Wallet size={16} />;
          case 'health': return <Heart size={16} />;
          case 'skill': return <Zap size={16} />;
          case 'lifestyle': return <BookOpen size={16} />;
          default: return <Target size={16} />;
      }
  };
  
  const getDifficultyXP = (d: Difficulty) => d === 'hard' ? 500 : d === 'medium' ? 250 : 100;

  const CATEGORY_LABELS: Record<string, string> = {
      career: '事业/学业', finance: '财富管理', health: '身心健康', skill: '技能提升', lifestyle: '生活品质', other: '其他'
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end mb-2">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">目标管理</h2>
        </div>
        <button onClick={() => setIsAdding(!isAdding)} className="bg-slate-900 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl active:scale-95 text-sm font-bold">
          <Plus size={18} /> 新建目标
        </button>
      </div>

      {isAdding && (
        <div className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl shadow-lg animate-in fade-in slide-in-from-top-4 border border-white/60 mb-6">
          <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">1. 选择人生维度</label>
          <div className="flex flex-wrap gap-2 mb-6">
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <button key={key} onClick={() => setSelectedCategory(key as any)} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedCategory === key ? 'bg-teal-600 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                    {getCategoryIcon(key)} {label}
                </button>
            ))}
          </div>
          
           <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">2. 难度评估 <span className="text-[10px] font-normal text-slate-400 normal-case ml-1">(完成奖励)</span></label>
           <div className="flex flex-wrap gap-2 mb-6">
             {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
                <button key={d} onClick={() => setSelectedDifficulty(d)} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedDifficulty === d ? 'bg-slate-800 text-white ring-2 ring-slate-300' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                   {d === 'easy' ? '🌟 简单' : d === 'medium' ? '🌟🌟 中等' : '🌟🌟🌟 困难'}
                   <span className="opacity-60 text-xs ml-1">+{getDifficultyXP(d)}XP</span>
                </button>
             ))}
           </div>

          <div className="flex flex-col md:flex-row gap-3">
            <input type="text" value={newGoalTitle} onChange={(e) => setNewGoalTitle(e.target.value)} placeholder="输入你的目标，例如：考过CPA、学会游泳..." className="flex-1 border-0 bg-white ring-1 ring-slate-200 rounded-xl px-5 py-3 text-base focus:ring-2 focus:ring-teal-500/20 outline-none" />
            <button onClick={handleCreateGoal} disabled={isGenerating} className="px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 text-sm font-bold">手动添加</button>
            <button onClick={handleGenerateWithAI} disabled={isGenerating || !newGoalTitle} className="px-6 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl hover:shadow-lg flex items-center gap-2 text-sm font-bold whitespace-nowrap">
                {isGenerating ? "思考中..." : <><Sparkles size={16} /> AI 拆解</>}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {goals.length === 0 && !isAdding && (
          <div className="text-center py-16 bg-white/40 rounded-2xl border-dashed border-2 border-slate-200/50">
             <div className="bg-white p-4 rounded-full inline-block mb-4 shadow-sm"><Target size={24} className="text-slate-300" /></div>
             <p className="text-slate-500 font-medium">暂无目标，开启你的规划吧。</p>
          </div>
        )}
        {goals.map(goal => (
          <div key={goal.id} className="bg-white/70 backdrop-blur-md rounded-2xl shadow-sm hover:shadow-md transition-all border border-white/60 overflow-hidden group/card">
            <div className="p-5 flex items-start justify-between cursor-pointer" onClick={() => setExpandedGoalId(expandedGoalId === goal.id ? null : goal.id)}>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`p-1.5 rounded-lg ${goal.category === 'finance' ? 'bg-amber-100 text-amber-600' : 'bg-teal-100 text-teal-600'}`}>{getCategoryIcon(goal.category)}</span>
                  <h3 className="text-lg font-bold text-slate-800">{goal.title}</h3>
                  <div className="flex items-center gap-1 ml-2">
                      {goal.difficulty === 'hard' && <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-red-50 text-red-500 border border-red-100">HARD</span>}
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-50 text-amber-600 border border-amber-100 flex items-center gap-1"><Trophy size={10} /> +{getDifficultyXP(goal.difficulty)} XP</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-3">
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden max-w-xs"><div className="h-full bg-teal-500 transition-all duration-1000" style={{ width: `${goal.progress}%` }} /></div>
                    <span className="text-xs font-bold text-slate-400">{goal.progress}%</span>
                </div>
              </div>
              <div className="ml-4 p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">{expandedGoalId === goal.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</div>
            </div>
            
            {expandedGoalId === goal.id && (
              <div className="bg-slate-50/50 p-5 border-t border-slate-100">
                <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">执行步骤 (Milestones)</span>
                    <div className="flex items-center gap-2">
                        {/* AI Breakdown Button for Existing Goals */}
                        <button 
                          onClick={(e) => handleAiBreakdownForGoal(e, goal)}
                          disabled={isGenerating}
                          className="text-teal-600 hover:text-teal-700 text-xs flex items-center gap-1 font-bold px-3 py-1.5 hover:bg-teal-50 rounded-md transition-colors border border-teal-100 bg-white"
                        >
                          <Wand2 size={12} /> {isGenerating ? '生成中...' : 'AI 智能补充'}
                        </button>
                        <button onClick={(e) => {e.stopPropagation(); setGoals(prev => prev.filter(g => g.id !== goal.id))}} className="text-red-400 hover:text-red-600 text-xs flex items-center gap-1 font-medium px-2 py-1 hover:bg-red-50 rounded-md transition-colors"><Trash2 size={12}/> 删除</button>
                    </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  {goal.milestones.length === 0 && <p className="text-slate-400 text-sm italic pl-1 mb-2">暂无步骤，请点击上方 "AI 智能补充" 或手动添加。</p>}
                  {goal.milestones.map(m => (
                    <div key={m.id} className="flex items-center justify-between group hover:bg-white p-2 rounded-xl transition-all border border-transparent hover:border-slate-100 hover:shadow-sm">
                        <button onClick={() => toggleMilestone(goal.id, m.id)} className="flex items-center gap-3 flex-1 text-left">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${m.completed ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 group-hover:border-teal-400'}`}>
                             {m.completed && <CheckCircle size={12} className="text-white" />}
                          </div>
                          <span className={`text-sm ${m.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{m.title}</span>
                        </button>
                        {!m.completed && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); onAddToDailyPlan(goal.id, m.id, m.title, goal.difficulty); }}
                              className="text-xs bg-white border border-teal-100 text-teal-600 px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1 hover:bg-teal-50 shadow-sm font-medium"
                            >
                              <CalendarPlus size={14} /> 加入今日
                            </button>
                        )}
                    </div>
                  ))}
                </div>

                {/* Manual Milestone Input */}
                <div className="flex gap-2 mt-4 pt-4 border-t border-slate-200/50">
                    <input 
                        type="text" 
                        value={newMilestoneTitle}
                        onChange={(e) => setNewMilestoneTitle(e.target.value)}
                        placeholder="添加一个新步骤..."
                        className="flex-1 text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-teal-400"
                    />
                    <button 
                        onClick={() => handleAddManualMilestone(goal.id)}
                        disabled={!newMilestoneTitle.trim()}
                        className="bg-slate-800 text-white px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-slate-700 disabled:opacity-50"
                    >
                        <ListPlus size={14} /> 添加
                    </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
export default GoalManager;
