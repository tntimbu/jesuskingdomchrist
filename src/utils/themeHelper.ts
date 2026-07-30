import { AppSettings } from '../types';

export interface ThemeStyles {
  rootBg: string;
  cardBg: string;
  cardPadding: string;
  cardClass: string;
  accentGradient: string;
  accentText: string;
  accentBorder: string;
  accentBg: string;
  accentRing: string;
  fontClass: string;
  isLight: boolean;
}

export const getThemeClasses = (settings?: AppSettings): ThemeStyles => {
  const preset = settings?.theme_preset || 'DARK_SLATE';
  const accent = settings?.accent_color || 'INDIGO';
  const cardStyle = settings?.card_style || 'GLASS';
  const cardSize = settings?.card_size || 'NORMAL';
  const fontFam = settings?.font_family || 'SANS';

  // 1. Root Container Background
  let rootBg = 'bg-slate-950 text-slate-100';
  switch (preset) {
    case 'MIDNIGHT_BLUE':
      rootBg = 'bg-[#030712] text-slate-100';
      break;
    case 'DEEP_PURPLE':
      rootBg = 'bg-[#090514] text-purple-100';
      break;
    case 'FOREST_GREEN':
      rootBg = 'bg-[#04120a] text-emerald-100';
      break;
    case 'WARM_GOLD':
      rootBg = 'bg-[#140c03] text-amber-100';
      break;
    case 'LUXE_LIGHT':
      rootBg = 'bg-slate-100 text-slate-900';
      break;
    case 'DARK_SLATE':
    default:
      rootBg = 'bg-slate-950 text-slate-100';
      break;
  }

  // 2. Card Background & Borders
  let cardBg = 'bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl';
  if (preset === 'LUXE_LIGHT') {
    switch (cardStyle) {
      case 'SOLID':
        cardBg = 'bg-white border border-slate-200 shadow-xl text-slate-900';
        break;
      case 'NEON':
        cardBg = 'bg-white border-2 border-indigo-400 shadow-xl shadow-indigo-500/10 text-slate-900';
        break;
      case 'FLAT':
        cardBg = 'bg-slate-50 border border-slate-200 shadow-none text-slate-900';
        break;
      case 'GLASS':
      default:
        cardBg = 'bg-white/90 backdrop-blur-md border border-slate-200 shadow-lg text-slate-900';
        break;
    }
  } else {
    switch (cardStyle) {
      case 'SOLID':
        cardBg = 'bg-slate-900 border border-slate-800 shadow-xl text-white';
        break;
      case 'NEON':
        cardBg = 'bg-slate-900/90 border-2 border-indigo-500/60 shadow-xl shadow-indigo-500/20 text-white';
        break;
      case 'FLAT':
        cardBg = 'bg-slate-900/40 border border-slate-800 shadow-none text-white';
        break;
      case 'GLASS':
      default:
        cardBg = 'bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl text-white';
        break;
    }
  }

  // 3. Card Size / Padding
  let cardPadding = 'p-5 sm:p-6';
  if (cardSize === 'COMPACT') cardPadding = 'p-3.5 sm:p-4';
  if (cardSize === 'SPACIOUS') cardPadding = 'p-6 sm:p-8';

  // 4. Accent Gradient & Color Accents
  let accentGradient = 'from-indigo-600 to-blue-600';
  let accentText = 'text-indigo-400';
  let accentBorder = 'border-indigo-500';
  let accentBg = 'bg-indigo-600';
  let accentRing = 'ring-indigo-500/50';

  switch (accent) {
    case 'EMERALD':
      accentGradient = 'from-emerald-600 to-teal-600';
      accentText = 'text-emerald-400';
      accentBorder = 'border-emerald-500';
      accentBg = 'bg-emerald-600';
      accentRing = 'ring-emerald-500/50';
      break;
    case 'AMBER':
      accentGradient = 'from-amber-600 to-orange-600';
      accentText = 'text-amber-400';
      accentBorder = 'border-amber-500';
      accentBg = 'bg-amber-600';
      accentRing = 'ring-amber-500/50';
      break;
    case 'ROSE':
      accentGradient = 'from-rose-600 to-pink-600';
      accentText = 'text-rose-400';
      accentBorder = 'border-rose-500';
      accentBg = 'bg-rose-600';
      accentRing = 'ring-rose-500/50';
      break;
    case 'CYAN':
      accentGradient = 'from-cyan-600 to-blue-600';
      accentText = 'text-cyan-400';
      accentBorder = 'border-cyan-500';
      accentBg = 'bg-cyan-600';
      accentRing = 'ring-cyan-500/50';
      break;
    case 'PURPLE':
      accentGradient = 'from-purple-600 to-indigo-600';
      accentText = 'text-purple-400';
      accentBorder = 'border-purple-500';
      accentBg = 'bg-purple-600';
      accentRing = 'ring-purple-500/50';
      break;
    case 'ROYAL_GOLD':
      accentGradient = 'from-amber-500 via-amber-600 to-yellow-600';
      accentText = 'text-amber-400';
      accentBorder = 'border-amber-500';
      accentBg = 'bg-amber-600';
      accentRing = 'ring-amber-500/50';
      break;
  }

  // 5. Font Family
  let fontClass = 'font-sans';
  if (fontFam === 'SERIF') fontClass = 'font-serif';
  if (fontFam === 'MONO') fontClass = 'font-mono';

  return {
    rootBg,
    cardBg,
    cardPadding,
    cardClass: `${cardBg} ${cardPadding}`,
    accentGradient,
    accentText,
    accentBorder,
    accentBg,
    accentRing,
    fontClass,
    isLight: preset === 'LUXE_LIGHT'
  };
};
