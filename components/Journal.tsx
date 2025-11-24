
import React, { useState } from 'react';
import { JournalEntry, Goal, Task, UserStats, CoachContext } from '../types';
import { analyzeJournalEntry, generateJournalPrompt } from '../services/geminiService';
import { PenLine, Sparkles, Save, Smile, Meh, Frown, ThumbsUp, AlertCircle, Calendar, Hash, X, Lightbulb, Loader2 } from 'lucide-react';

interface JournalProps {
  entries: JournalEntry[];
  setEntries: React.Dispatch<React.SetStateAction<JournalEntry[]>>;
  onEntrySaved?: () => void;
  // Context for AI Prompt Generation
  goals: Goal[];
  tasks: Task[];
  focusMinutes: number;
  userStats: UserStats;
}

const MOODS = [
    { id: 'great', label: '极好', icon: ThumbsUp, color: 'text-emerald-500 bg-emerald-50' },
    { id: 'good', label: '开心', icon: Smile, color: 'text-teal-500 bg-teal-50' },
    { id: 'neutral', label: '平静', icon: Meh, color: 'text-slate-500 bg-slate-50' },
    { id: 'bad', label: '焦虑', icon: Frown, color: 'text-amber-500 bg-amber-50' },
    { id: 'terrible', label: '糟糕', icon: AlertCircle, color: 'text-red-500 bg-red-50' },
];

const PRESET_TAGS = ['#工作', '#学习', '#情感', '#灵感', '#感恩', '#焦虑', '#健康', '#复盘'];
const EMOJIS = ['😊', '😂', '🤔', '💪', '🎉', '🌟', '🔥', '❤️', '☕', '🌧️', '🎵', '🧘', '🚀', '💤'];

const Journal: React.FC<JournalProps> = ({ entries, setEntries, onEntrySaved, goals, tasks, focusMinutes, userStats }) => {
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<JournalEntry['mood']>('neutral');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);

  const handleSave = async () => {
    if (!content.trim()) return;
    const newEntry: JournalEntry = { 
        id: Date.now().toString(), 
        date: new Date().toISOString(), 
        content, 
        mood,
        tags: selectedTags
    };
    setEntries(prev => [newEntry, ...prev]);
    
    // Reset form
    setContent('');
    setMood('neutral');
    setSelectedTags([]);
    
    if (onEntrySaved) onEntrySaved(); 

    setIsAnalyzing(true);
    const feedback = await analyzeJournalEntry(newEntry.content, newEntry.mood, newEntry.tags);
    setEntries(prev => prev.map(e => e.id === newEntry.id ? { ...e, aiFeedback: feedback } : e));
    setIsAnalyzing(false);
  };

  const toggleTag = (tag: string) => {
      setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const insertText = (text: string) => {
      setContent(prev => prev + (prev ? ' ' : '') + text);
  };

  const getInspiration = async () => {
      setIsGeneratingPrompt(true);
      const prompt = await generateJournalPrompt(
          { goals, tasks, journalEntries: entries, focusMinutes, userStats },
          mood
      );
      setContent(prev => {
          const prefix = prev ? prev + "\n\n" : "";
          return prefix + `💡 灵感 (${new Date().toLocaleTimeString()}): ${prompt}\n`;
      });
      setIsGeneratingPrompt(false);
  };

  const getMoodConfig = (id: string) => MOODS.find(m => m.id === id) || MOODS[2];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8 h-[calc(100dvh-6rem)] md:h-[calc(100vh-140px)] animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Editor Section - Takes full height on mobile */}
      <div className="lg:col-span-2 flex flex-col glass-panel rounded-3xl border border-white/60 shadow-xl overflow-hidden relative z-10 h-full">
        <div className="p-3 md:p-5 border-b border-slate-100/50 bg-white/40 backdrop-blur-sm flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2 md:gap-3 text-slate-700 font-bold">
              <div className="p-1.5 md:p-2 bg-teal-100 text-teal-600 rounded-lg"><PenLine size={16} className="md:w-5 md:h-5" /></div>
              <span className="text-sm md:text-base">思维日志</span>
          </div>
          <div className="flex gap-1 md:gap-2">
              {MOODS.map(m => (
                  <button 
                    key={m.id} 
                    onClick={() => setMood(m.id as any)} 
                    className={`p-1.5 md:p-2 rounded-xl border transition-all hover:scale-110 active:scale-95 ${mood === m.id ? 'shadow-md ring-1 ring-slate-200 scale-110 ' + m.color : 'border-transparent text-slate-300 grayscale hover:grayscale-0'}`}
                    title={m.label}
                  >
                      <m.icon size={16} className="md:w-5 md:h-5" />
                  </button>
              ))}
          </div>
        </div>
        
        <div className="flex-1 relative group min-h-0">
             <textarea 
                value={content} 
                onChange={(e) => setContent(e.target.value)} 
                placeholder="记录今天的觉察..." 
                className="w-full h-full p-4 md:p-8 resize-none focus:outline-none text-slate-700 text-base md:text-lg leading-relaxed bg-transparent placeholder:text-slate-300" 
             />
             {!content && (
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none opacity-40">
                     <Sparkles size={32} className="mx-auto text-teal-300 mb-2 md:w-10 md:h-10"/>
                     <p className="text-xs md:text-sm text-teal-600">写下此刻的想法</p>
                 </div>
             )}
        </div>

        {/* Editor Toolbar */}
        <div className="px-3 py-2 md:px-5 md:py-3 bg-white/40 border-t border-slate-100/50 backdrop-blur-sm flex flex-col gap-2 shrink-0">
             {/* Inspiration & Emojis */}
             <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                 <button 
                    onClick={getInspiration} 
                    disabled={isGeneratingPrompt}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-50 text-amber-600 rounded-lg text-[10px] md:text-xs font-bold hover:bg-amber-100 transition-colors whitespace-nowrap shadow-sm disabled:opacity-50"
                 >
                    {isGeneratingPrompt ? <Loader2 size={12} className="animate-spin"/> : <Lightbulb size={12} />} 
                    灵感
                 </button>
                 <div className="w-px h-5 bg-slate-200 mx-1 shrink-0"></div>
                 {EMOJIS.map(e => (
                     <button key={e} onClick={() => insertText(e)} className="text-base md:text-lg hover:scale-125 transition-transform px-1">{e}</button>
                 ))}
             </div>
             
             {/* Tags */}
             <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                 <Hash size={12} className="text-slate-400 shrink-0 md:w-3.5 md:h-3.5" />
                 {PRESET_TAGS.map(tag => (
                     <button 
                        key={tag} 
                        onClick={() => toggleTag(tag)}
                        className={`text-[10px] md:text-xs px-2 py-1 rounded-full border transition-all whitespace-nowrap ${selectedTags.includes(tag) ? 'bg-teal-500 text-white border-teal-500 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-teal-300 hover:text-teal-600'}`}
                     >
                        {tag}
                     </button>
                 ))}
             </div>
        </div>

        <div className="p-3 md:p-5 border-t border-slate-100/50 bg-white/60 flex justify-between items-center shrink-0">
          <span className="text-[10px] md:text-xs text-slate-400 flex items-center gap-2">
              {isAnalyzing ? <><Sparkles size={12} className="animate-pulse text-teal-500"/> 分析中...</> : <><Sparkles size={12}/> AI 就绪</>}
          </span>
          <button onClick={handleSave} disabled={!content.trim() || isAnalyzing} className="bg-slate-900 text-white px-4 py-2 md:px-6 md:py-3 rounded-xl flex items-center gap-2 hover:bg-slate-800 shadow-lg active:scale-95 transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed text-xs md:text-sm">
              <Save size={16} /> 保存
          </button>
        </div>
      </div>

      {/* History Sidebar - Hidden on small screens unless we add a toggle, but for now let's keep it as part of the grid, maybe stacked on mobile but the user complained about space. For mobile we might want to hide history or show it differently.
          Given the request to fix crowding, on mobile let's make this section collapsible or just below. 
          For simplicity in this fix, I'll keep the grid which stacks on mobile, but ensure it doesn't break the "dvh" layout of the editor.
      */}
      <div className="glass-panel rounded-3xl border border-white/60 p-4 md:p-6 overflow-y-auto space-y-4 shadow-xl relative z-10 hidden lg:block">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Calendar size={18} className="text-slate-400" /> 往期回顾</h3>
        {entries.length === 0 && <div className="text-center py-10 opacity-50"><p className="text-sm text-slate-500">暂无记录，写下第一篇吧</p></div>}
        {entries.map(entry => {
            const MoodIcon = getMoodConfig(entry.mood).icon;
            const moodColor = getMoodConfig(entry.mood).color.split(' ')[0];
            return (
              <div 
                key={entry.id} 
                onClick={() => setSelectedEntry(entry)}
                className="bg-white/60 backdrop-blur-sm p-4 rounded-2xl shadow-sm border border-white/50 cursor-pointer hover:bg-white/80 hover:scale-[1.02] transition-all group"
              >
                <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{new Date(entry.date).toLocaleDateString('zh-CN')}</span>
                    <MoodIcon size={16} className={moodColor} />
                </div>
                <p className="text-slate-700 text-sm line-clamp-2 mb-2 font-medium">{entry.content}</p>
              </div>
            );
        })}
      </div>

      {/* Detail Modal */}
      {selectedEntry && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in" onClick={() => setSelectedEntry(null)}>
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                <div className="p-4 md:p-6 border-b flex justify-between items-start bg-slate-50">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{new Date(selectedEntry.date).toLocaleDateString('zh-CN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${getMoodConfig(selectedEntry.mood).color}`}>
                                {React.createElement(getMoodConfig(selectedEntry.mood).icon, { size: 12 })}
                                {getMoodConfig(selectedEntry.mood).label}
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-1">
                            {selectedEntry.tags?.map(t => <span key={t} className="text-[10px] bg-white border border-slate-200 px-2 py-0.5 rounded-full text-slate-500 font-medium">{t}</span>)}
                        </div>
                    </div>
                    <button onClick={() => setSelectedEntry(null)} className="p-2 bg-white rounded-full text-slate-400 hover:text-slate-600 shadow-sm transition-colors"><X size={18}/></button>
                </div>
                
                <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar">
                    <p className="text-slate-800 text-base md:text-lg leading-loose whitespace-pre-wrap font-serif">{selectedEntry.content}</p>
                    
                    {selectedEntry.aiFeedback && (
                        <div className="mt-8 bg-teal-50/50 rounded-2xl p-4 md:p-6 border border-teal-100 relative">
                            <Sparkles size={20} className="text-teal-500 absolute top-4 left-4" />
                            <div className="pl-8 md:pl-10">
                                <h4 className="text-xs font-bold text-teal-700 uppercase tracking-wider mb-2">AI 教练反馈</h4>
                                <p className="text-sm text-teal-900 leading-relaxed italic">"{selectedEntry.aiFeedback}"</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
export default Journal;
