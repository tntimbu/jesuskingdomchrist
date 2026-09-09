import React, { useState, useMemo } from 'react';
import {
  Layout,
  PlusCircle,
  Grid,
  Layers,
  BellRing,
  Megaphone,
  BarChart3,
  Smartphone,
  Download,
  BookOpen,
  Calendar,
  MessageSquare,
  CreditCard,
  Tv,
  TrendingUp,
  PieChart,
  Clock,
  Activity,
  Eye,
  EyeOff,
  RotateCcw,
  Check,
  Search,
  SlidersHorizontal,
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import { AppSettings } from '../../types';
import {
  DASHBOARD_CATEGORIES,
  DASHBOARD_COMPONENT_DEFS,
  DashboardComponentDef,
  enableAllDashboardComponents,
  disableAllDashboardComponents,
  resetDefaultDashboardComponents
} from '../../data/dashboardComponents';

interface DashboardVisibilityManagerProps {
  settings: Partial<AppSettings>;
  onChange: (updatedSettings: Partial<AppSettings>) => void;
  compact?: boolean;
}

export const DashboardVisibilityManager: React.FC<DashboardVisibilityManagerProps> = ({
  settings,
  onChange,
  compact = false
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const renderIcon = (iconName: string) => {
    const props = { className: 'w-4 h-4' };
    switch (iconName) {
      case 'Layout': return <Layout {...props} />;
      case 'PlusCircle': return <PlusCircle {...props} />;
      case 'Grid': return <Grid {...props} />;
      case 'Layers': return <Layers {...props} />;
      case 'BellRing': return <BellRing {...props} />;
      case 'Megaphone': return <Megaphone {...props} />;
      case 'BarChart3': return <BarChart3 {...props} />;
      case 'Smartphone': return <Smartphone {...props} />;
      case 'Download': return <Download {...props} />;
      case 'BookOpen': return <BookOpen {...props} />;
      case 'Calendar': return <Calendar {...props} />;
      case 'MessageSquare': return <MessageSquare {...props} />;
      case 'CreditCard': return <CreditCard {...props} />;
      case 'Tv': return <Tv {...props} />;
      case 'TrendingUp': return <TrendingUp {...props} />;
      case 'PieChart': return <PieChart {...props} />;
      case 'Clock': return <Clock {...props} />;
      case 'Activity': return <Activity {...props} />;
      default: return <SlidersHorizontal {...props} />;
    }
  };

  const handleToggle = (key: keyof AppSettings) => {
    const currentVal = settings[key] !== false;
    onChange({
      ...settings,
      [key]: !currentVal
    });
  };

  const handleEnableAll = () => {
    const updated = enableAllDashboardComponents(settings);
    onChange(updated);
  };

  const handleDisableAll = () => {
    const updated = disableAllDashboardComponents(settings);
    onChange(updated);
  };

  const handleResetDefault = () => {
    const updated = resetDefaultDashboardComponents(settings);
    onChange(updated);
  };

  // Filtered components based on category and search query
  const filteredComponents = useMemo(() => {
    return DASHBOARD_COMPONENT_DEFS.filter((comp) => {
      const matchCategory = selectedCategory === 'all' || comp.category === selectedCategory;
      const matchSearch =
        !searchQuery.trim() ||
        comp.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        comp.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [selectedCategory, searchQuery]);

  // Statistics calculation
  const totalCount = DASHBOARD_COMPONENT_DEFS.length;
  const activeCount = DASHBOARD_COMPONENT_DEFS.filter(
    (comp) => settings[comp.key] !== false
  ).length;

  return (
    <div className="space-y-4">
      {/* Top Banner & Batch Actions */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/80 via-slate-900 to-purple-950/80 border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 shrink-0">
            <SlidersHorizontal className="w-5 h-5 text-indigo-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-extrabold text-white">
                Kontrol Visibilitas Komponen Dashboard Home
              </span>
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold border border-indigo-500/30">
                {activeCount} / {totalCount} Aktif
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              Atur seluruh widget &amp; elemen yang diizinkan tampil di Dashboard Home untuk Jemaat dan Admin.
            </p>
          </div>
        </div>

        {/* Quick Batch Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleEnableAll}
            className="px-2.5 py-1.5 rounded-xl bg-emerald-600/80 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow active:scale-95"
            title="Aktifkan & tampilkan semua komponen di dashboard"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Tampilkan Semua</span>
          </button>
          <button
            type="button"
            onClick={handleDisableAll}
            className="px-2.5 py-1.5 rounded-xl bg-rose-600/80 hover:bg-rose-500 text-white text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow active:scale-95"
            title="Sembunyikan semua komponen (dashboard minimalis)"
          >
            <EyeOff className="w-3.5 h-3.5" />
            <span>Sembunyikan Semua</span>
          </button>
          <button
            type="button"
            onClick={handleResetDefault}
            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow active:scale-95 border border-slate-700"
            title="Kembalikan semua komponen ke status default rekomendasi"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Reset Default</span>
          </button>
        </div>
      </div>

      {/* Category Pills & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {DASHBOARD_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="relative shrink-0 w-full sm:w-56">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari komponen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Component Cards Grid */}
      {filteredComponents.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-slate-950/60 border border-slate-800 text-slate-400 text-xs">
          Tidak ditemukan komponen dengan kata kunci "{searchQuery}".
        </div>
      ) : (
        <div className={`grid gap-3 ${compact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
          {filteredComponents.map((comp) => {
            const isVisible = settings[comp.key] !== false;

            return (
              <div
                key={comp.key}
                onClick={() => handleToggle(comp.key)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer select-none flex flex-col justify-between space-y-3 min-w-0 overflow-hidden ${
                  isVisible
                    ? 'bg-slate-950/90 border-indigo-500/40 hover:border-indigo-400 shadow-md ring-1 ring-indigo-500/20'
                    : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700 opacity-60'
                }`}
              >
                {/* Card Top Row */}
                <div className="flex items-start justify-between gap-3 min-w-0">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div
                      className={`p-2.5 rounded-xl shrink-0 ${
                        isVisible
                          ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                          : 'bg-slate-800/50 text-slate-500 border border-slate-700/50'
                      }`}
                    >
                      {renderIcon(comp.iconName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        <span
                          className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                            comp.targetRole === 'ALL'
                              ? 'bg-blue-500/10 text-blue-300 border border-blue-500/20'
                              : comp.targetRole === 'ADMIN'
                              ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                          }`}
                        >
                          {comp.targetRole === 'ALL'
                            ? 'Admin & Jemaat'
                            : comp.targetRole === 'ADMIN'
                            ? 'Khusus Admin'
                            : 'Khusus Jemaat'}
                        </span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-white leading-snug break-words">
                        {comp.label}
                      </h4>
                    </div>
                  </div>

                  {/* Switch Toggle */}
                  <div className="shrink-0 pt-0.5">
                    <div
                      className={`w-9 h-5 rounded-full transition-colors relative flex items-center p-0.5 ${
                        isVisible ? 'bg-indigo-600' : 'bg-slate-800'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white transition-transform transform shadow-sm ${
                          isVisible ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-[11px] text-slate-300/80 leading-relaxed break-words">
                  {comp.description}
                </p>

                {/* Status Indicator */}
                <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] gap-2 min-w-0">
                  <span className="text-slate-500 font-mono text-[10px] truncate max-w-[130px] sm:max-w-[160px]">{comp.key}</span>
                  <span
                    className={`font-bold flex items-center gap-1.5 shrink-0 text-xs ${
                      isVisible ? 'text-emerald-400' : 'text-slate-500'
                    }`}
                  >
                    {isVisible ? (
                      <>
                        <Eye className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Tampil di Dashboard</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                        <span>Disembunyikan</span>
                      </>
                    )}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
