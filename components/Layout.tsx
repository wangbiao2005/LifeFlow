
import React, { useState } from 'react';
import { LayoutDashboard, CheckSquare, Target, Bot, Menu, X, Wind, Timer, PenLine, Settings, User, ChevronRight, Quote, Sparkles } from 'lucide-react';
import { ViewState, UserStats, DailyQuote, ToastMessage } from '../types';

interface LayoutProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  onOpenSettings: () => void;
  onOpenProfile: () => void;
  children: React.ReactNode;
  userStats: UserStats;
  dailyQuote: DailyQuote | null;
  toasts: ToastMessage[];
}

const Layout: React.FC<LayoutProps> = ({ 
  currentView, 
  onChangeView, 
  onOpenSettings, 
  onOpenProfile, 
  children, 
  userStats,
  dailyQuote,
  toasts
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: '概览', icon: LayoutDashboard },
    { id: 'planner', label: '每日计划', icon: CheckSquare },
    { id: 'goals', label: '目标管理', icon: Target },
    { id: 'focus', label: '心流模式', icon: Timer },
    { id: 'journal', label: '思维日志', icon: PenLine },
    { id: 'coach', label: '人生教练', icon: Bot },
  ];

  // Formula: 250 * (Level-1)^2
  const currentLevelStartXP = 250 * Math.pow(userStats.level - 1, 2);
  const nextLevelStartXP = 250 * Math.pow(userStats.level, 2);
  const xpNeededForNextLevel = nextLevelStartXP - currentLevelStartXP;
  
  // Current XP gained in this level
  const xpInLevel = userStats.totalXP - currentLevelStartXP;
  const xpProgress = Math.min((xpInLevel / xpNeededForNextLevel) * 100, 100);

  const getLevelTitle = (level: number) => {
    const titles = ["初学者", "实践者", "探索者", "进取者", "破壁人", "坚毅者", "远见者", "追光者", "贤者", "大师", "宗师", "传奇", "半神", "星灵", "光辉", "永恒", "创世", "虚空", "奇点", "LifeFlow"];
    return titles[Math.min(level - 1, titles.length - 1)];
  };

  const UserProfile = () => (
    <div className="px-4 mb-2">
        <button 
          onClick={() => { onOpenProfile(); setIsMobileMenuOpen(false); }}
          className="w-full bg-white/50 hover:bg-white/80 border border-white/40 rounded-2xl p-3 text-slate-800 shadow-sm relative overflow-hidden group text-left transition-all active:scale-95"
        >
             <div className="flex items-center gap-3 mb-2">
                 <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center font-bold shadow-inner overflow-hidden flex-shrink-0">
                     {userStats.avatar ? (
                       <img src={userStats.avatar} alt="Avatar" className="w-full h-full object-cover" />
                     ) : (
                       <User size={20} />
                     )}
                 </div>
                 <div className="flex-1 min-w-0">
                     <div className="font-bold text-sm truncate flex items-center gap-1 text-slate-800">
                        Lv.{userStats.level} {getLevelTitle(userStats.level)}
                     </div>
                     <div className="text-[10px] text-slate-500 flex justify-between items-center">
                        <span className="font-medium">{userStats.totalXP} <span className="text-slate-300">/</span> {nextLevelStartXP} XP</span>
                     </div>
                 </div>
             </div>
             <div className="relative z-10">
                 <div className="h-1.5 w-full bg-slate-200/50 rounded-full overflow-hidden">
                     <div className="h-full bg-gradient-to-r from-teal-400 to-emerald-400 rounded-full transition-all duration-700" style={{ width: `${xpProgress}%` }}></div>
                 </div>
             </div>
        </button>
    </div>
  );

  const SidebarFooter = () => (
    <div className="p-4 space-y-3 mt-auto relative z-10">
      <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-lg shadow-slate-200/50 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-teal-500/20 rounded-full blur-2xl -mr-5 -mt-5"></div>
          <Quote size={16} className="text-teal-400 opacity-50 mb-2" />
          <p className="text-xs font-medium font-serif italic leading-relaxed text-slate-100 z-10 relative">
            "{dailyQuote?.text || '生活不是等待风暴过去，而是学会在雨中跳舞。'}"
          </p>
          <p className="text-[10px] text-teal-400 text-right mt-3 font-bold z-10 relative">— {dailyQuote?.author || 'LifeFlow'}</p>
      </div>
      <button 
        onClick={() => { onOpenSettings(); setIsMobileMenuOpen(false); }}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-wider rounded-xl text-slate-500 hover:bg-white/60 hover:text-slate-800 transition-all"
      >
        <Settings size={16} /> 设置 & 备份
      </button>
    </div>
  );

  const NavContent = () => (
    <div className="flex flex-col h-full pb-safe">
      <div className="flex items-center gap-3 px-6 py-8 mb-2 pt-safe md:pt-8 flex-shrink-0">
        <div className="bg-gradient-to-br from-teal-500 to-emerald-500 text-white p-2 rounded-xl shadow-lg shadow-teal-500/20">
          <Wind size={20} />
        </div>
        <div>
          <span className="text-lg font-bold text-slate-800 tracking-tight block leading-none font-sans">LifeFlow</span>
        </div>
      </div>
      
      {/* Vision/Motto Card - Fills the empty space */}
      <div className="px-4 mb-4">
          <div className="bg-teal-50/50 border border-teal-100 rounded-2xl p-4 relative overflow-hidden">
              <Sparkles size={14} className="text-teal-400 absolute top-3 right-3 opacity-50"/>
              <p className="text-[10px] font-bold text-teal-500 uppercase tracking-widest mb-1">MY VISION</p>
              <p className="text-sm font-serif font-medium text-slate-700 leading-snug line-clamp-2 italic">
                  "{userStats.lifeVision || '寻找更好的自己'}"
              </p>
          </div>
      </div>

      <div className="flex-shrink-0">
        <UserProfile />
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto min-h-0 scrollbar-hide">
        <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 mt-2">导航</p>
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => { onChangeView(item.id as ViewState); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group active:scale-95 ${
                isActive ? 'bg-white shadow-sm text-teal-700 ring-1 ring-black/5' : 'text-slate-500 hover:bg-white/40 hover:text-slate-800'
              }`}
            >
              <item.icon size={18} className={`transition-colors ${isActive ? 'text-teal-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
              {item.label}
            </button>
          );
        })}
      </nav>
      
      <div className="flex-shrink-0">
        <SidebarFooter />
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden mesh-background text-slate-800">
      {/* Toast Notifications */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none">
        {toasts.map(toast => (
          <div key={toast.id} className="bg-white/90 backdrop-blur-xl text-slate-800 px-4 py-3 rounded-2xl shadow-xl shadow-slate-200/50 border border-white/60 flex items-center gap-3 animate-in slide-in-from-top-2 fade-in duration-300 pointer-events-auto">
              <div className={`p-1.5 rounded-full ${toast.type === 'success' ? 'bg-emerald-100 text-emerald-600' : toast.type === 'encouragement' ? 'bg-amber-100 text-amber-600' : 'bg-teal-100 text-teal-600'}`}>
                 {toast.type === 'success' ? <CheckSquare size={14} /> : toast.type === 'encouragement' ? <Target size={14} /> : <Wind size={14} />}
              </div>
              <span className="text-sm font-medium">{toast.text}</span>
          </div>
        ))}
      </div>

      <aside className="hidden md:flex w-72 flex-col glass-sidebar z-20 h-full">
        <NavContent />
      </aside>

      <div className="md:hidden fixed top-0 left-0 right-0 h-[calc(3.5rem+env(safe-area-inset-top))] glass-panel border-b-0 shadow-sm flex items-end justify-between px-4 pb-2 z-40 pt-safe">
        <div className="flex items-center gap-2">
          <div className="bg-teal-600 text-white p-1 rounded-lg"><Wind size={16} /></div>
          <span className="font-bold text-slate-800 text-sm">LifeFlow</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 bg-white/80 rounded-lg text-slate-600 shadow-sm backdrop-blur-sm">
          <Menu size={18} />
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
           <div className="absolute inset-0 bg-black/30 backdrop-blur-sm animate-in fade-in" onClick={() => setIsMobileMenuOpen(false)}></div>
           <div className="absolute right-0 top-0 bottom-0 w-[85%] max-w-xs bg-white/95 backdrop-blur-xl shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
              <div className="flex justify-end p-4 pt-safe">
                  <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-slate-100/50 rounded-full text-slate-500 hover:bg-slate-200/50"><X size={20} /></button>
              </div>
              <div className="flex-1 overflow-hidden relative h-full">
                 <div className="absolute inset-0 overflow-y-auto h-full">
                   <NavContent />
                 </div>
              </div>
           </div>
        </div>
      )}

      <main className="flex-1 h-full overflow-y-auto overflow-x-hidden relative z-10 pt-[calc(3.5rem+env(safe-area-inset-top))] md:pt-0">
         {/* Reduced padding for mobile to prevent crowding */}
         <div className="p-3 md:p-8 pb-24 md:pb-10 max-w-7xl mx-auto min-h-full">
            {children}
         </div>
      </main>
    </div>
  );
};

export default Layout;
