import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Home,
  Calendar as CalendarIcon,
  BarChart3,
  Settings as SettingsIcon,
  ChevronLeft,
  ChevronRight,
  Check,
  Layers,
  Compass,
  RotateCcw,
  XCircle,
  Circle,
  Sparkles,
  Flame,
  BookOpen,
  Moon,
  Sun,
  CheckCheck,
  MoreHorizontal,
  Download,
  Upload,
  Trash2,
  X,
  Award,
  Clock,
  FileSpreadsheet,
  FileJson,
  ClipboardPaste,
  AlertTriangle
} from 'lucide-react';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type PrayerStatus = 'completed' | 'jama' | 'qasr' | 'qadha' | 'missed' | 'none';

export type HabitId =
  | 'fajr'
  | 'dhuhr'
  | 'asr'
  | 'maghrib'
  | 'isha'
  | 'tahajjud'
  | 'before_fajr'
  | 'witr'
  | 'quran';

export type HabitGroup = 'fardh' | 'sunnah';

export type DayRecord = Record<HabitId, PrayerStatus>;

export type MonthData = Record<string, DayRecord>; // Key: "YYYY-MM-DD"

export type AllTrackerData = Record<string, MonthData>; // Key: "YYYY-MM"

export type ActiveTab = 'today' | 'month' | 'insights' | 'settings';

export interface HabitItemDefinition {
  id: HabitId;
  label: string;
  shortLabel: string;
  group: HabitGroup;
  arabic: string;
  subtitle: string;
}

export interface StatusOptionDefinition {
  id: PrayerStatus;
  label: string;
  shortLabel: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeLight: string;
  badgeDark: string;
  dotColor: string;
  barColor: string;
  isFardhFulfilled: boolean;
}

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

const HABIT_ITEMS: HabitItemDefinition[] = [
  // Group 1: Obligatory (Fardh)
  {
    id: 'fajr',
    label: 'Fajr',
    shortLabel: 'Fajr',
    group: 'fardh',
    arabic: 'الفَجْر',
    subtitle: '2 Rak’ahs • Dawn Prayer'
  },
  {
    id: 'dhuhr',
    label: 'Dhuhr',
    shortLabel: 'Dhuhr',
    group: 'fardh',
    arabic: 'الظُّهْر',
    subtitle: '4 Rak’ahs • Noon / Jumu’ah'
  },
  {
    id: 'asr',
    label: 'Asr',
    shortLabel: 'Asr',
    group: 'fardh',
    arabic: 'العَصْر',
    subtitle: '4 Rak’ahs • Afternoon Prayer'
  },
  {
    id: 'maghrib',
    label: 'Maghrib',
    shortLabel: 'Maghrib',
    group: 'fardh',
    arabic: 'المَغْرِب',
    subtitle: '3 Rak’ahs • Sunset Prayer'
  },
  {
    id: 'isha',
    label: 'Isha',
    shortLabel: 'Isha',
    group: 'fardh',
    arabic: 'العِشَاء',
    subtitle: '4 Rak’ahs • Night Prayer'
  },
  // Group 2: Sunnah, Nawafil & Habits
  {
    id: 'tahajjud',
    label: 'Tahajjud',
    shortLabel: 'Tahajjud',
    group: 'sunnah',
    arabic: 'تَهَجُّد',
    subtitle: 'Qiyam al-Layl • Night Vigil'
  },
  {
    id: 'before_fajr',
    label: 'Before Fajr',
    shortLabel: 'Pre-Fajr',
    group: 'sunnah',
    arabic: 'سُنَّة الفَجْر',
    subtitle: '2 Rak’ahs Sunnah Mu’akkadah'
  },
  {
    id: 'witr',
    label: 'Witr',
    shortLabel: 'Witr',
    group: 'sunnah',
    arabic: 'الوِتْر',
    subtitle: 'Odd-numbered Night Closing'
  },
  {
    id: 'quran',
    label: 'Quran Recitation',
    shortLabel: 'Quran',
    group: 'sunnah',
    arabic: 'القُرْآن',
    subtitle: 'Daily Tilawah & Reflection'
  }
];

const FARDH_IDS: HabitId[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
const QUICK_CYCLE_ORDER: PrayerStatus[] = ['none', 'completed', 'qadha', 'missed'];

const STATUS_DEFINITIONS: Record<PrayerStatus, StatusOptionDefinition> = {
  completed: {
    id: 'completed',
    label: 'On-Time',
    shortLabel: 'Done',
    description: 'Performed within its prescribed window',
    icon: Check,
    badgeLight: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30',
    badgeDark: 'dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40',
    dotColor: 'bg-emerald-500',
    barColor: 'bg-emerald-500',
    isFardhFulfilled: true
  },
  jama: {
    id: 'jama',
    label: "Jama' (Combined)",
    shortLabel: "Jama'",
    description: 'Combined two prayers validly (e.g., travel/rain)',
    icon: Layers,
    badgeLight: 'bg-teal-500/15 text-teal-700 border-teal-500/30',
    badgeDark: 'dark:bg-teal-500/20 dark:text-teal-300 dark:border-teal-500/40',
    dotColor: 'bg-teal-500',
    barColor: 'bg-teal-500',
    isFardhFulfilled: true
  },
  qasr: {
    id: 'qasr',
    label: 'Qasr (Shortened)',
    shortLabel: 'Qasr',
    description: 'Shortened 4-Rak’ah prayer while traveling',
    icon: Compass,
    badgeLight: 'bg-indigo-500/15 text-indigo-700 border-indigo-500/30',
    badgeDark: 'dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/40',
    dotColor: 'bg-indigo-500',
    barColor: 'bg-indigo-500',
    isFardhFulfilled: true
  },
  qadha: {
    id: 'qadha',
    label: 'Qadha (Make-up)',
    shortLabel: 'Qadha',
    description: 'Made up after its prescribed time elapsed',
    icon: RotateCcw,
    badgeLight: 'bg-amber-500/15 text-amber-800 border-amber-500/35',
    badgeDark: 'dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40',
    dotColor: 'bg-amber-500',
    barColor: 'bg-amber-500',
    isFardhFulfilled: false
  },
  missed: {
    id: 'missed',
    label: 'Missed',
    shortLabel: 'Missed',
    description: 'Not yet performed or missed',
    icon: XCircle,
    badgeLight: 'bg-rose-500/15 text-rose-700 border-rose-500/30',
    badgeDark: 'dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/40',
    dotColor: 'bg-rose-500',
    barColor: 'bg-rose-500',
    isFardhFulfilled: false
  },
  none: {
    id: 'none',
    label: 'Clear / Pending',
    shortLabel: 'Pending',
    description: 'Unmarked placeholder state',
    icon: Circle,
    badgeLight: 'bg-slate-200/70 text-slate-600 border-slate-300/80',
    badgeDark: 'dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
    dotColor: 'bg-slate-400 dark:bg-slate-600',
    barColor: 'bg-slate-400',
    isFardhFulfilled: false
  }
};

const ALL_STATUS_ORDER: PrayerStatus[] = ['completed', 'jama', 'qasr', 'qadha', 'missed', 'none'];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const SHORT_MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const WEEKDAY_HEADERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const STORAGE_KEY = 'muhasabah_mobile_tracker_v2';
const THEME_KEY = 'muhasabah_mobile_theme_v2';

// Default anchor date: Sunday, Nov 15, 2026
const DEFAULT_TODAY = new Date(2026, 10, 15);

// ============================================================================
// DATE & SAMPLE DATA HELPERS
// ============================================================================

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function toMonthKey(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`;
}

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function isSameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function addDays(date: Date, delta: number): Date {
  const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  copy.setDate(copy.getDate() + delta);
  return copy;
}

/**
 * Formats Islamic Hijri date with graceful fallback to "5 Jumada al-Akhirah 1448" for Nov 15, 2026
 */
function formatHijriDate(date: Date): string {
  if (
    date.getFullYear() === 2026 &&
    date.getMonth() === 10 &&
    date.getDate() === 15
  ) {
    return '5 Jumada al-Akhirah 1448';
  }
  try {
    const formatted = new Intl.DateTimeFormat('en-TN-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
    if (formatted && !formatted.includes('Invalid')) {
      return formatted.replace(/\s*AH$/i, '');
    }
  } catch {
    // Fallback below
  }
  const dayOffset = date.getDate() - 15;
  const approxHijriDay = Math.max(1, Math.min(30, 5 + dayOffset));
  return `${approxHijriDay} Jumada al-Akhirah 1448`;
}

function createEmptyDayRecord(): DayRecord {
  return {
    fajr: 'none',
    dhuhr: 'none',
    asr: 'none',
    maghrib: 'none',
    isha: 'none',
    tahajjud: 'none',
    before_fajr: 'none',
    witr: 'none',
    quran: 'none'
  };
}

/**
 * Generates 14 days of realistic sample data (Nov 1 - Nov 14, 2026 + partial Nov 15)
 */
function generate14DaySampleData(year: number, month: number): MonthData {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const limit = Math.min(14, daysInMonth);
  const sample: MonthData = {};

  const templates: DayRecord[] = [
    { fajr: 'completed', dhuhr: 'completed', asr: 'completed', maghrib: 'completed', isha: 'completed', tahajjud: 'completed', before_fajr: 'completed', witr: 'completed', quran: 'completed' },
    { fajr: 'completed', dhuhr: 'completed', asr: 'completed', maghrib: 'completed', isha: 'completed', tahajjud: 'none', before_fajr: 'completed', witr: 'completed', quran: 'completed' },
    { fajr: 'qadha', dhuhr: 'completed', asr: 'completed', maghrib: 'completed', isha: 'completed', tahajjud: 'none', before_fajr: 'missed', witr: 'completed', quran: 'completed' },
    { fajr: 'completed', dhuhr: 'completed', asr: 'completed', maghrib: 'completed', isha: 'completed', tahajjud: 'completed', before_fajr: 'completed', witr: 'completed', quran: 'completed' },
    { fajr: 'completed', dhuhr: 'jama', asr: 'jama', maghrib: 'completed', isha: 'completed', tahajjud: 'none', before_fajr: 'completed', witr: 'completed', quran: 'completed' },
    { fajr: 'completed', dhuhr: 'qasr', asr: 'qasr', maghrib: 'completed', isha: 'qasr', tahajjud: 'completed', before_fajr: 'completed', witr: 'completed', quran: 'none' },
    { fajr: 'completed', dhuhr: 'completed', asr: 'completed', maghrib: 'completed', isha: 'completed', tahajjud: 'completed', before_fajr: 'completed', witr: 'completed', quran: 'completed' },
    { fajr: 'completed', dhuhr: 'completed', asr: 'completed', maghrib: 'completed', isha: 'completed', tahajjud: 'none', before_fajr: 'completed', witr: 'completed', quran: 'completed' },
    { fajr: 'completed', dhuhr: 'completed', asr: 'qadha', maghrib: 'completed', isha: 'completed', tahajjud: 'none', before_fajr: 'none', witr: 'none', quran: 'completed' },
    { fajr: 'completed', dhuhr: 'completed', asr: 'completed', maghrib: 'completed', isha: 'completed', tahajjud: 'completed', before_fajr: 'completed', witr: 'completed', quran: 'completed' },
    { fajr: 'completed', dhuhr: 'completed', asr: 'completed', maghrib: 'completed', isha: 'completed', tahajjud: 'completed', before_fajr: 'completed', witr: 'completed', quran: 'completed' },
    { fajr: 'completed', dhuhr: 'completed', asr: 'completed', maghrib: 'completed', isha: 'completed', tahajjud: 'none', before_fajr: 'completed', witr: 'completed', quran: 'completed' },
    { fajr: 'completed', dhuhr: 'completed', asr: 'completed', maghrib: 'completed', isha: 'completed', tahajjud: 'completed', before_fajr: 'completed', witr: 'completed', quran: 'completed' },
    { fajr: 'completed', dhuhr: 'completed', asr: 'completed', maghrib: 'completed', isha: 'completed', tahajjud: 'completed', before_fajr: 'completed', witr: 'completed', quran: 'completed' }
  ];

  for (let d = 1; d <= limit; d++) {
    const key = `${year}-${pad2(month + 1)}-${pad2(d)}`;
    sample[key] = { ...templates[(d - 1) % templates.length] };
  }

  // Also add partial progress for Day 15 (Today) so Today screen feels alive immediately
  if (daysInMonth >= 15) {
    const day15Key = `${year}-${pad2(month + 1)}-15`;
    sample[day15Key] = {
      fajr: 'completed',
      dhuhr: 'completed',
      asr: 'none',
      maghrib: 'none',
      isha: 'none',
      tahajjud: 'completed',
      before_fajr: 'completed',
      witr: 'none',
      quran: 'completed'
    };
  }

  return sample;
}

// ============================================================================
// CUSTOM HOOK: LOCAL STORAGE PERSISTENCE
// ============================================================================

function useTrackerStorage() {
  const [allData, setAllData] = useState<AllTrackerData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch (e) {
      console.error('Storage read error:', e);
    }
    const defaultMonthKey = toMonthKey(DEFAULT_TODAY);
    return {
      [defaultMonthKey]: generate14DaySampleData(
        DEFAULT_TODAY.getFullYear(),
        DEFAULT_TODAY.getMonth()
      )
    };
  });

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      const savedTheme = localStorage.getItem(THEME_KEY);
      if (savedTheme === 'dark') return true;
      if (savedTheme === 'light') return false;
      return true; // Default to sleek Deep Slate dark mode
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allData));
    } catch (e) {
      console.error('Storage write error:', e);
    }
  }, [allData]);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(THEME_KEY, darkMode ? 'dark' : 'light');
    } catch {
      // Ignore
    }
  }, [darkMode]);

  const getDayRecord = (date: Date): DayRecord => {
    const mKey = toMonthKey(date);
    const dKey = toDateKey(date);
    return {
      ...createEmptyDayRecord(),
      ...(allData[mKey]?.[dKey] || {})
    };
  };

  const setItemStatus = (date: Date, habitId: HabitId, status: PrayerStatus) => {
    const mKey = toMonthKey(date);
    const dKey = toDateKey(date);
    setAllData((prev) => {
      const existingMonth = prev[mKey] || {};
      const existingDay = existingMonth[dKey] || createEmptyDayRecord();
      return {
        ...prev,
        [mKey]: {
          ...existingMonth,
          [dKey]: {
            ...existingDay,
            [habitId]: status
          }
        }
      };
    });
  };

  const cycleItemStatus = (date: Date, habitId: HabitId) => {
    const current = getDayRecord(date)[habitId] || 'none';
    const idx = QUICK_CYCLE_ORDER.indexOf(current);
    const nextStatus =
      idx === -1
        ? 'completed'
        : QUICK_CYCLE_ORDER[(idx + 1) % QUICK_CYCLE_ORDER.length];
    setItemStatus(date, habitId, nextStatus);
  };

  const markAllFardhDone = (date: Date) => {
    const mKey = toMonthKey(date);
    const dKey = toDateKey(date);
    setAllData((prev) => {
      const existingMonth = prev[mKey] || {};
      const existingDay = existingMonth[dKey] || createEmptyDayRecord();
      const updated: DayRecord = { ...existingDay };
      FARDH_IDS.forEach((fid) => {
        updated[fid] = 'completed';
      });
      return {
        ...prev,
        [mKey]: {
          ...existingMonth,
          [dKey]: updated
        }
      };
    });
  };

  const loadSampleForMonth = (year: number, month: number) => {
    const mKey = `${year}-${pad2(month + 1)}`;
    setAllData((prev) => ({
      ...prev,
      [mKey]: generate14DaySampleData(year, month)
    }));
  };

  const clearMonth = (year: number, month: number) => {
    const mKey = `${year}-${pad2(month + 1)}`;
    setAllData((prev) => {
      const next = { ...prev };
      delete next[mKey];
      return next;
    });
  };

  const importData = (incoming: AllTrackerData) => {
    setAllData((prev) => ({
      ...prev,
      ...incoming
    }));
  };

  return {
    allData,
    darkMode,
    setDarkMode,
    getDayRecord,
    setItemStatus,
    cycleItemStatus,
    markAllFardhDone,
    loadSampleForMonth,
    clearMonth,
    importData
  };
}

// ============================================================================
// SHARED MOBILE UI PRIMITIVES (BOTTOM SHEET, RADIAL RING, TOAST)
// ============================================================================

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/65 backdrop-blur-[2px] transition-opacity"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-md rounded-t-3xl bg-[#FAF9F6] dark:bg-slate-900 border-t border-x border-slate-200 dark:border-slate-800 shadow-2xl pb-safe overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag Handle Indicator */}
        <div className="pt-3 pb-1 flex justify-center">
          <div className="w-10 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>

        {/* Header */}
        <div className="px-5 py-3 flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-11 h-11 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 active:scale-95 transition-transform"
            aria-label="Close sheet"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 max-h-[75vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

interface RadialProgressRingProps {
  completed: number;
  total: number;
  size?: number;
  strokeWidth?: number;
}

const RadialProgressRing: React.FC<RadialProgressRingProps> = ({
  completed,
  total,
  size = 54,
  strokeWidth = 5
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = total > 0 ? Math.min(1, Math.max(0, completed / total)) : 0;
  const dashOffset = circumference * (1 - pct);

  return (
    <div className="relative inline-flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg className="-rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-200 dark:text-slate-800"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          className="text-emerald-500 transition-all duration-500 ease-out"
        />
      </svg>
      <span className="absolute text-xs font-extrabold text-slate-900 dark:text-white">
        {Math.round(pct * 100)}%
      </span>
    </div>
  );
};

// ============================================================================
// PRAYER / HABIT ROW CARD COMPONENT (REUSED IN TODAY & MONTH DAY DRAWER)
// ============================================================================

interface HabitCardRowProps {
  item: HabitItemDefinition;
  status: PrayerStatus;
  onQuickCycle: () => void;
  onOpenPicker: () => void;
}

const HabitCardRow: React.FC<HabitCardRowProps> = ({
  item,
  status,
  onQuickCycle,
  onOpenPicker
}) => {
  const statusDef = STATUS_DEFINITIONS[status] || STATUS_DEFINITIONS.none;
  const StatusIcon = statusDef.icon;
  const longPressTimer = useRef<number | null>(null);
  const longPressTriggered = useRef(false);

  const startPress = () => {
    longPressTriggered.current = false;
    longPressTimer.current = window.setTimeout(() => {
      longPressTriggered.current = true;
      onOpenPicker();
    }, 420);
  };

  const cancelPress = () => {
    if (longPressTimer.current !== null) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleCardClick = () => {
    if (longPressTriggered.current) return;
    onQuickCycle();
  };

  const isPositive =
    status === 'completed' || status === 'jama' || status === 'qasr';

  return (
    <div
      className={`min-h-[60px] rounded-2xl border transition-all duration-150 flex items-center justify-between pl-3.5 pr-2 py-2 select-none ${
        isPositive
          ? 'bg-emerald-500/[0.06] dark:bg-emerald-500/[0.08] border-emerald-500/25 dark:border-emerald-500/30'
          : status === 'qadha'
          ? 'bg-amber-500/[0.05] dark:bg-amber-500/[0.07] border-amber-500/25'
          : status === 'missed'
          ? 'bg-rose-500/[0.05] dark:bg-rose-500/[0.07] border-rose-500/25'
          : 'bg-white dark:bg-slate-900/90 border-slate-200/90 dark:border-slate-800'
      }`}
    >
      {/* Primary Tap Area: Cycles status on tap, opens bottom sheet on long-press */}
      <button
        type="button"
        onClick={handleCardClick}
        onPointerDown={startPress}
        onPointerUp={cancelPress}
        onPointerLeave={cancelPress}
        onPointerCancel={cancelPress}
        className="flex-1 min-h-[44px] flex items-center gap-3 text-left active:scale-[0.98] transition-transform focus:outline-none"
      >
        <div
          className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 transition-colors ${statusDef.badgeLight} ${statusDef.badgeDark}`}
        >
          <StatusIcon className="w-5 h-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[15px] font-bold text-slate-900 dark:text-white truncate">
              {item.label}
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0">
              {item.arabic}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
            {item.subtitle}
          </p>
        </div>
      </button>

      {/* Right Action Cluster: Status Pill + More Trigger -> Opens 6-State Bottom Sheet */}
      <div className="flex items-center gap-1 shrink-0 ml-2">
        <button
          type="button"
          onClick={onOpenPicker}
          className={`min-h-[44px] px-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-transform ${statusDef.badgeLight} ${statusDef.badgeDark}`}
          aria-label={`Change status for ${item.label}`}
        >
          <span>{statusDef.shortLabel}</span>
          <MoreHorizontal className="w-3.5 h-3.5 opacity-75" />
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// STATUS PICKER BOTTOM SHEET (6 STATES)
// ============================================================================

interface StatusPickerSheetProps {
  isOpen: boolean;
  habit: HabitItemDefinition | null;
  currentStatus: PrayerStatus;
  dateLabel: string;
  onSelect: (status: PrayerStatus) => void;
  onClose: () => void;
}

const StatusPickerSheet: React.FC<StatusPickerSheetProps> = ({
  isOpen,
  habit,
  currentStatus,
  dateLabel,
  onSelect,
  onClose
}) => {
  if (!habit) return null;

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={`${habit.label} (${habit.arabic})`}
      subtitle={`${dateLabel} • Select prayer or habit state`}
    >
      <div className="space-y-2">
        {ALL_STATUS_ORDER.map((statusKey) => {
          const def = STATUS_DEFINITIONS[statusKey];
          const Icon = def.icon;
          const isSelected = currentStatus === statusKey;

          return (
            <button
              key={statusKey}
              type="button"
              onClick={() => {
                onSelect(statusKey);
                onClose();
              }}
              className={`w-full min-h-[54px] p-3 rounded-2xl border flex items-center justify-between text-left active:scale-[0.98] transition-all ${
                isSelected
                  ? 'bg-emerald-500/10 dark:bg-emerald-500/15 border-emerald-500 ring-1 ring-emerald-500'
                  : 'bg-white dark:bg-slate-800/70 border-slate-200 dark:border-slate-700/80 hover:bg-slate-100/70 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${def.badgeLight} ${def.badgeDark}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">
                    {def.label}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {def.description}
                  </div>
                </div>
              </div>

              {isSelected && (
                <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </BottomSheet>
  );
};

// ============================================================================
// SCREEN 1: TODAY TRACKER SCREEN
// ============================================================================

interface TodayScreenProps {
  selectedDate: Date;
  onChangeDate: (newDate: Date) => void;
  dayRecord: DayRecord;
  onQuickCycle: (habitId: HabitId) => void;
  onSetStatus: (habitId: HabitId, status: PrayerStatus) => void;
  onMarkAllFardh: () => void;
}

const TodayScreen: React.FC<TodayScreenProps> = ({
  selectedDate,
  onChangeDate,
  dayRecord,
  onQuickCycle,
  onSetStatus,
  onMarkAllFardh
}) => {
  const [pickerHabit, setPickerHabit] = useState<HabitItemDefinition | null>(null);

  const isToday = isSameCalendarDay(selectedDate, DEFAULT_TODAY);
  const isYesterday = isSameCalendarDay(selectedDate, addDays(DEFAULT_TODAY, -1));
  const isTomorrow = isSameCalendarDay(selectedDate, addDays(DEFAULT_TODAY, 1));

  const dateHeadline = isToday
    ? `TODAY (${SHORT_MONTH_NAMES[selectedDate.getMonth()]} ${selectedDate.getDate()})`
    : isYesterday
    ? `YESTERDAY (${SHORT_MONTH_NAMES[selectedDate.getMonth()]} ${selectedDate.getDate()})`
    : isTomorrow
    ? `TOMORROW (${SHORT_MONTH_NAMES[selectedDate.getMonth()]} ${selectedDate.getDate()})`
    : `${WEEKDAY_NAMES[selectedDate.getDay()]}, ${SHORT_MONTH_NAMES[selectedDate.getMonth()]} ${selectedDate.getDate()}`;

  const hijriSubtitle = formatHijriDate(selectedDate);

  // Daily progress calculations
  const totalCompletedCount = HABIT_ITEMS.filter((item) => {
    const st = dayRecord[item.id];
    return st === 'completed' || st === 'jama' || st === 'qasr';
  }).length;

  const fardhFulfilledCount = FARDH_IDS.filter((id) => {
    const st = dayRecord[id];
    return st === 'completed' || st === 'jama' || st === 'qasr';
  }).length;

  const fardhItems = HABIT_ITEMS.filter((i) => i.group === 'fardh');
  const sunnahItems = HABIT_ITEMS.filter((i) => i.group === 'sunnah');

  return (
    <div className="space-y-4 pb-6">
      {/* Top Date Switcher Carousel */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-2 shadow-sm">
        <div className="flex items-center justify-between gap-1">
          <button
            type="button"
            onClick={() => onChangeDate(addDays(selectedDate, -1))}
            className="min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-transform"
            aria-label="Previous day"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="text-center flex-1 min-w-0 px-1">
            <div className="flex items-center justify-center gap-1.5">
              <span className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white truncate">
                {dateHeadline}
              </span>
            </div>
            <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 truncate mt-0.5">
              {hijriSubtitle}
            </p>
          </div>

          <button
            type="button"
            onClick={() => onChangeDate(addDays(selectedDate, 1))}
            className="min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-transform"
            aria-label="Next day"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-carousel quick jump pills */}
        <div className="mt-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 px-1">
          <button
            type="button"
            onClick={() => onChangeDate(addDays(selectedDate, -1))}
            className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 py-1 px-2 rounded-lg active:scale-95 transition-transform"
          >
            ‹ Prev Day
          </button>

          {!isToday && (
            <button
              type="button"
              onClick={() => onChangeDate(DEFAULT_TODAY)}
              className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 active:scale-95 transition-transform"
            >
              Jump to Today
            </button>
          )}

          <button
            type="button"
            onClick={() => onChangeDate(addDays(selectedDate, 1))}
            className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 py-1 px-2 rounded-lg active:scale-95 transition-transform"
          >
            Next Day ›
          </button>
        </div>
      </div>

      {/* Daily Progress Capsule + One-Tap Mark All Fardh */}
      <div className="rounded-2xl bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-900 text-white p-4 border border-emerald-500/25 shadow-md">
        <div className="flex items-center gap-3.5">
          <RadialProgressRing completed={totalCompletedCount} total={HABIT_ITEMS.length} />

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Daily Progress
              </span>
              <span className="text-xs font-semibold text-slate-300">
                {fardhFulfilledCount}/5 Fardh
              </span>
            </div>
            <div className="text-base font-extrabold mt-0.5">
              {totalCompletedCount}/9 Completed
            </div>
            {/* Compact progress bar */}
            <div className="mt-2 w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-400 rounded-full transition-all duration-300"
                style={{ width: `${(totalCompletedCount / HABIT_ITEMS.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onMarkAllFardh}
          disabled={fardhFulfilledCount === 5}
          className={`mt-3.5 w-full min-h-[44px] rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 ${
            fardhFulfilledCount === 5
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 cursor-default'
              : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-sm shadow-emerald-500/25'
          }`}
        >
          <CheckCheck className="w-4 h-4" />
          <span>
            {fardhFulfilledCount === 5
              ? 'All 5 Fardh Prayers Fulfilled'
              : 'Mark All Fardh Done'}
          </span>
        </button>
      </div>

      {/* Section 1: Obligatory (Fardh) Prayers */}
      <div>
        <div className="flex items-center justify-between px-1 mb-2">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Fardh Prayers (5)
          </h2>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            Tap to cycle • Pill for all 6 states
          </span>
        </div>
        <div className="space-y-2">
          {fardhItems.map((item) => (
            <HabitCardRow
              key={item.id}
              item={item}
              status={dayRecord[item.id] || 'none'}
              onQuickCycle={() => onQuickCycle(item.id)}
              onOpenPicker={() => setPickerHabit(item)}
            />
          ))}
        </div>
      </div>

      {/* Section 2: Sunnah & Daily Habits */}
      <div>
        <div className="flex items-center justify-between px-1 mb-2">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Sunnah & Daily Habits (4)
          </h2>
        </div>
        <div className="space-y-2">
          {sunnahItems.map((item) => (
            <HabitCardRow
              key={item.id}
              item={item}
              status={dayRecord[item.id] || 'none'}
              onQuickCycle={() => onQuickCycle(item.id)}
              onOpenPicker={() => setPickerHabit(item)}
            />
          ))}
        </div>
      </div>

      {/* 6-State Bottom Sheet Drawer */}
      <StatusPickerSheet
        isOpen={pickerHabit !== null}
        habit={pickerHabit}
        currentStatus={pickerHabit ? dayRecord[pickerHabit.id] || 'none' : 'none'}
        dateLabel={`${MONTH_NAMES[selectedDate.getMonth()]} ${selectedDate.getDate()}, ${selectedDate.getFullYear()}`}
        onSelect={(st) => {
          if (pickerHabit) onSetStatus(pickerHabit.id, st);
        }}
        onClose={() => setPickerHabit(null)}
      />
    </div>
  );
};

// ============================================================================
// SCREEN 2: MONTH OVERVIEW (HEATMAP CALENDAR + WEEKLY CARDS + DAY DRAWER)
// ============================================================================

interface MonthCalendarScreenProps {
  viewYear: number;
  viewMonth: number;
  onChangeMonth: (year: number, month: number) => void;
  monthData: MonthData;
  getDayRecord: (date: Date) => DayRecord;
  onQuickCycle: (date: Date, habitId: HabitId) => void;
  onSetStatus: (date: Date, habitId: HabitId, status: PrayerStatus) => void;
  onMarkAllFardh: (date: Date) => void;
}

const MonthCalendarScreen: React.FC<MonthCalendarScreenProps> = ({
  viewYear,
  viewMonth,
  onChangeMonth,
  monthData,
  getDayRecord,
  onQuickCycle,
  onSetStatus,
  onMarkAllFardh
}) => {
  const [subMode, setSubMode] = useState<'calendar' | 'weekly'>('calendar');
  const [drawerDay, setDrawerDay] = useState<number | null>(null);
  const [nestedPickerHabit, setNestedPickerHabit] = useState<HabitItemDefinition | null>(null);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayWeekday = new Date(viewYear, viewMonth, 1).getDay();

  const handlePrevMonth = () => {
    if (viewMonth === 0) onChangeMonth(viewYear - 1, 11);
    else onChangeMonth(viewYear, viewMonth - 1);
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) onChangeMonth(viewYear + 1, 0);
    else onChangeMonth(viewYear, viewMonth + 1);
  };

  // Compute day badge visuals
  const getDaySummary = (dayNum: number) => {
    const key = `${viewYear}-${pad2(viewMonth + 1)}-${pad2(dayNum)}`;
    const rec = monthData[key] || createEmptyDayRecord();
    let fardhDone = 0;
    let hasQadha = false;
    let hasMissed = false;

    FARDH_IDS.forEach((fid) => {
      const st = rec[fid] || 'none';
      if (st === 'completed' || st === 'jama' || st === 'qasr') fardhDone++;
      if (st === 'qadha') hasQadha = true;
      if (st === 'missed') hasMissed = true;
    });

    const quranDone =
      rec.quran === 'completed' || rec.quran === 'jama' || rec.quran === 'qasr';

    return { rec, fardhDone, hasQadha, hasMissed, quranDone };
  };

  // Build weeks array for Weekly Cards view
  const weeks = useMemo(() => {
    const result: { weekNum: number; days: number[] }[] = [];
    let currentWeek: number[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      currentWeek.push(d);
      const weekday = new Date(viewYear, viewMonth, d).getDay();
      if (weekday === 6 || d === daysInMonth) {
        result.push({ weekNum: result.length + 1, days: currentWeek });
        currentWeek = [];
      }
    }
    return result;
  }, [viewYear, viewMonth, daysInMonth]);

  const activeDrawerDate =
    drawerDay !== null ? new Date(viewYear, viewMonth, drawerDay) : null;
  const activeDrawerRecord = activeDrawerDate
    ? getDayRecord(activeDrawerDate)
    : createEmptyDayRecord();

  return (
    <div className="space-y-4 pb-6">
      {/* Month Switcher Header */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-2 flex items-center justify-between shadow-sm">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-transform"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="text-center">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
            {MONTH_NAMES[viewMonth]} {viewYear}
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Tap any day to view or edit markings
          </p>
        </div>

        <button
          type="button"
          onClick={handleNextMonth}
          className="min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-transform"
          aria-label="Next month"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Mode Toggle: Heatmap Calendar vs Weekly Cards */}
      <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-slate-200/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setSubMode('calendar')}
          className={`min-h-[44px] rounded-xl text-xs font-bold transition-all active:scale-95 ${
            subMode === 'calendar'
              ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 shadow-sm'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          Heatmap Calendar
        </button>
        <button
          type="button"
          onClick={() => setSubMode('weekly')}
          className={`min-h-[44px] rounded-xl text-xs font-bold transition-all active:scale-95 ${
            subMode === 'weekly'
              ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 shadow-sm'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          Weekly Cards
        </button>
      </div>

      {subMode === 'calendar' ? (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-3 shadow-sm">
          {/* 7-Column Weekday Header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {WEEKDAY_HEADERS.map((w, i) => (
              <div
                key={i}
                className={`text-center text-[11px] font-extrabold py-1 ${
                  i === 5
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                {w}
              </div>
            ))}
          </div>

          {/* 7-Column Mobile Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDayWeekday }).map((_, idx) => (
              <div key={`empty-${idx}`} className="aspect-square" />
            ))}

            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((dayNum) => {
              const { fardhDone, hasQadha, hasMissed } = getDaySummary(dayNum);
              const isTodayCell =
                viewYear === DEFAULT_TODAY.getFullYear() &&
                viewMonth === DEFAULT_TODAY.getMonth() &&
                dayNum === DEFAULT_TODAY.getDate();

              let cellStyle =
                'bg-slate-50 dark:bg-slate-800/60 border-slate-200/70 dark:border-slate-800 text-slate-700 dark:text-slate-300';
              let dotStyle = 'bg-slate-300 dark:bg-slate-600';

              if (fardhDone === 5) {
                cellStyle =
                  'bg-emerald-500/15 dark:bg-emerald-500/20 border-emerald-500/40 text-emerald-900 dark:text-emerald-200';
                dotStyle = 'bg-emerald-500';
              } else if (hasMissed) {
                cellStyle =
                  'bg-rose-500/12 dark:bg-rose-500/15 border-rose-500/35 text-rose-900 dark:text-rose-200';
                dotStyle = 'bg-rose-500';
              } else if (fardhDone > 0 || hasQadha) {
                cellStyle =
                  'bg-amber-500/12 dark:bg-amber-500/15 border-amber-500/35 text-amber-900 dark:text-amber-200';
                dotStyle = 'bg-amber-500';
              }

              return (
                <button
                  key={dayNum}
                  type="button"
                  onClick={() => setDrawerDay(dayNum)}
                  className={`min-h-[48px] rounded-xl border flex flex-col items-center justify-center p-1 active:scale-90 transition-transform relative ${cellStyle} ${
                    isTodayCell ? 'ring-2 ring-emerald-500 ring-offset-1 dark:ring-offset-slate-900' : ''
                  }`}
                >
                  <span className="text-xs font-extrabold leading-none">{dayNum}</span>
                  <span className={`w-1.5 h-1.5 rounded-full mt-1 ${dotStyle}`} />
                  <span className="text-[9px] font-bold opacity-80 mt-0.5 leading-none">
                    {fardhDone}/5
                  </span>
                </button>
              );
            })}
          </div>

          {/* Heatmap Legend */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-around text-[11px] text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> 5/5 Fardh
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Partial/Qadha
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Missed
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400" /> None
            </span>
          </div>
        </div>
      ) : (
        /* Scrollable Compact Weekly Summary Cards */
        <div className="space-y-3">
          {weeks.map((wk) => (
            <div
              key={wk.weekNum}
              className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-3.5 shadow-sm"
            >
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Week {wk.weekNum}
                </span>
                <span className="text-[11px] text-slate-400">
                  {SHORT_MONTH_NAMES[viewMonth]} {wk.days[0]} – {wk.days[wk.days.length - 1]}
                </span>
              </div>

              <div className="space-y-1.5">
                {wk.days.map((dayNum) => {
                  const dateObj = new Date(viewYear, viewMonth, dayNum);
                  const { rec, fardhDone, quranDone } = getDaySummary(dayNum);

                  return (
                    <button
                      key={dayNum}
                      type="button"
                      onClick={() => setDrawerDay(dayNum)}
                      className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between active:scale-[0.98] transition-transform"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 text-left text-xs font-extrabold text-slate-900 dark:text-white">
                          {dayNum}
                        </span>
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 w-8 text-left">
                          {WEEKDAY_NAMES[dateObj.getDay()]}
                        </span>
                        {/* 5 Fardh Status Dots */}
                        <div className="flex items-center gap-1">
                          {FARDH_IDS.map((fid) => {
                            const st = rec[fid] || 'none';
                            return (
                              <span
                                key={fid}
                                className={`w-2.5 h-2.5 rounded-full ${STATUS_DEFINITIONS[st].dotColor}`}
                              />
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {quranDone && (
                          <span className="px-1.5 py-0.5 rounded bg-teal-500/15 text-teal-700 dark:text-teal-300 text-[10px] font-bold">
                            Quran
                          </span>
                        )}
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          {fardhDone}/5
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bottom Sheet Quick-Check Editor for Selected Day */}
      <BottomSheet
        isOpen={activeDrawerDate !== null}
        onClose={() => setDrawerDay(null)}
        title={
          activeDrawerDate
            ? `${WEEKDAY_NAMES[activeDrawerDate.getDay()]}, ${MONTH_NAMES[viewMonth]} ${drawerDay}`
            : ''
        }
        subtitle={activeDrawerDate ? formatHijriDate(activeDrawerDate) : ''}
      >
        {activeDrawerDate && (
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => onMarkAllFardh(activeDrawerDate)}
              className="w-full min-h-[44px] rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Mark All 5 Fardh Completed</span>
            </button>

            <div className="space-y-2">
              {HABIT_ITEMS.map((item) => (
                <HabitCardRow
                  key={item.id}
                  item={item}
                  status={activeDrawerRecord[item.id] || 'none'}
                  onQuickCycle={() => onQuickCycle(activeDrawerDate, item.id)}
                  onOpenPicker={() => setNestedPickerHabit(item)}
                />
              ))}
            </div>
          </div>
        )}
      </BottomSheet>

      {/* Nested 6-State Selector inside Day Drawer */}
      <StatusPickerSheet
        isOpen={nestedPickerHabit !== null}
        habit={nestedPickerHabit}
        currentStatus={
          nestedPickerHabit ? activeDrawerRecord[nestedPickerHabit.id] || 'none' : 'none'
        }
        dateLabel={
          activeDrawerDate
            ? `${MONTH_NAMES[viewMonth]} ${drawerDay}, ${viewYear}`
            : ''
        }
        onSelect={(st) => {
          if (nestedPickerHabit && activeDrawerDate) {
            onSetStatus(activeDrawerDate, nestedPickerHabit.id, st);
          }
        }}
        onClose={() => setNestedPickerHabit(null)}
      />
    </div>
  );
};

// ============================================================================
// SCREEN 3: INSIGHTS & STREAKS SCREEN
// ============================================================================

interface InsightsScreenProps {
  viewYear: number;
  viewMonth: number;
  monthData: MonthData;
}

const InsightsScreen: React.FC<InsightsScreenProps> = ({
  viewYear,
  viewMonth,
  monthData
}) => {
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const analytics = useMemo(() => {
    const isCurrentMonth =
      viewYear === DEFAULT_TODAY.getFullYear() && viewMonth === DEFAULT_TODAY.getMonth();
    const isFutureMonth =
      viewYear > DEFAULT_TODAY.getFullYear() ||
      (viewYear === DEFAULT_TODAY.getFullYear() && viewMonth > DEFAULT_TODAY.getMonth());

    const elapsedDays = isFutureMonth
      ? 0
      : isCurrentMonth
      ? DEFAULT_TODAY.getDate()
      : daysInMonth;

    const counts: Record<PrayerStatus, number> = {
      completed: 0,
      jama: 0,
      qasr: 0,
      qadha: 0,
      missed: 0,
      none: 0
    };

    let tahajjudDays = 0;
    let quranDays = 0;
    const quranDailyMap: boolean[] = [];

    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${viewYear}-${pad2(viewMonth + 1)}-${pad2(d)}`;
      const rec = monthData[key] || createEmptyDayRecord();

      if (d <= elapsedDays) {
        FARDH_IDS.forEach((fid) => {
          const st = rec[fid] || 'none';
          counts[st]++;
        });
      }

      if (
        rec.tahajjud === 'completed' ||
        rec.tahajjud === 'jama' ||
        rec.tahajjud === 'qasr'
      ) {
        tahajjudDays++;
      }

      const qDone =
        rec.quran === 'completed' || rec.quran === 'jama' || rec.quran === 'qasr';
      if (d <= elapsedDays && qDone) {
        quranDays++;
      }
      quranDailyMap.push(qDone);
    }

    // Streak Calculation (Consecutive days where all 5 Fardh are fulfilled: completed, jama, or qasr)
    let currentStreak = 0;
    const checkLimit = elapsedDays > 0 ? elapsedDays : daysInMonth;
    for (let d = checkLimit; d >= 1; d--) {
      const key = `${viewYear}-${pad2(viewMonth + 1)}-${pad2(d)}`;
      const rec = monthData[key] || createEmptyDayRecord();
      const all5Fulfilled = FARDH_IDS.every((fid) =>
        STATUS_DEFINITIONS[rec[fid] || 'none'].isFardhFulfilled
      );

      if (all5Fulfilled) {
        currentStreak++;
      } else {
        // Allow today (Nov 15) to still be in progress without breaking yesterday's streak
        if (isCurrentMonth && d === DEFAULT_TODAY.getDate()) {
          continue;
        }
        break;
      }
    }

    const totalFardhSlots = Math.max(1, elapsedDays * 5);
    const pct = (val: number) =>
      elapsedDays === 0 ? 0 : Math.round((val / totalFardhSlots) * 100);

    const tahajjudRate =
      elapsedDays === 0 ? 0 : Math.round((tahajjudDays / elapsedDays) * 100);
    const quranRate =
      elapsedDays === 0 ? 0 : Math.round((quranDays / elapsedDays) * 100);

    return {
      elapsedDays,
      daysInMonth,
      counts,
      totalFardhSlots: elapsedDays * 5,
      onTimePct: pct(counts.completed),
      jamaPct: pct(counts.jama),
      qasrPct: pct(counts.qasr),
      qadhaPct: pct(counts.qadha),
      missedPct: pct(counts.missed),
      currentStreak,
      tahajjudDays,
      tahajjudRate,
      quranDays,
      quranRate,
      quranDailyMap
    };
  }, [viewYear, viewMonth, daysInMonth, monthData]);

  return (
    <div className="space-y-4 pb-6">
      {/* Celebratory Streak Counter Card */}
      <div className="rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-900 p-5 text-white shadow-lg shadow-emerald-950/30 relative overflow-hidden">
        <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-emerald-400/20 blur-2xl pointer-events-none" />
        <div className="flex items-center justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 text-[11px] font-bold uppercase tracking-wider">
              <Flame className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
              Fardh Streak
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-4xl font-black tracking-tight">
                {analytics.currentStreak}
              </span>
              <span className="text-sm font-semibold text-emerald-100">
                {analytics.currentStreak === 1 ? 'consecutive day' : 'consecutive days'}
              </span>
            </div>
            <p className="text-xs text-emerald-100/80 mt-1">
              All 5 obligatory prayers fulfilled (On-Time, Jama’, or Qasr)
            </p>
          </div>

          <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center shrink-0 border border-white/20">
            <Award className="w-8 h-8 text-amber-300" />
          </div>
        </div>
      </div>

      {/* Fardh 5-State Adherence Breakdown */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
              Fardh Breakdown ({MONTH_NAMES[viewMonth]})
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Across {analytics.totalFardhSlots} elapsed prayer windows
            </p>
          </div>
          <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
            {analytics.onTimePct + analytics.jamaPct + analytics.qasrPct}% Fulfilled
          </span>
        </div>

        {/* Multi-segment Stacked Bar */}
        <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden flex mb-4">
          <div
            className="bg-emerald-500 h-full transition-all duration-500"
            style={{ width: `${analytics.onTimePct}%` }}
            title={`On-Time: ${analytics.onTimePct}%`}
          />
          <div
            className="bg-teal-500 h-full transition-all duration-500"
            style={{ width: `${analytics.jamaPct}%` }}
            title={`Jama': ${analytics.jamaPct}%`}
          />
          <div
            className="bg-indigo-500 h-full transition-all duration-500"
            style={{ width: `${analytics.qasrPct}%` }}
            title={`Qasr: ${analytics.qasrPct}%`}
          />
          <div
            className="bg-amber-500 h-full transition-all duration-500"
            style={{ width: `${analytics.qadhaPct}%` }}
            title={`Qadha: ${analytics.qadhaPct}%`}
          />
          <div
            className="bg-rose-500 h-full transition-all duration-500"
            style={{ width: `${analytics.missedPct}%` }}
            title={`Missed: ${analytics.missedPct}%`}
          />
        </div>

        {/* Detailed Metric Rows */}
        <div className="space-y-2">
          {(
            [
              { key: 'completed', pct: analytics.onTimePct },
              { key: 'jama', pct: analytics.jamaPct },
              { key: 'qasr', pct: analytics.qasrPct },
              { key: 'qadha', pct: analytics.qadhaPct },
              { key: 'missed', pct: analytics.missedPct }
            ] as { key: PrayerStatus; pct: number }[]
          ).map(({ key, pct }) => {
            const def = STATUS_DEFINITIONS[key];
            return (
              <div
                key={key}
                className="flex items-center justify-between text-xs py-1 border-b border-slate-100 dark:border-slate-800/70 last:border-none"
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${def.dotColor}`} />
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {def.label}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-400 dark:text-slate-500">
                    {analytics.counts[key]} prayers
                  </span>
                  <span className="font-extrabold text-slate-900 dark:text-white w-9 text-right">
                    {pct}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tahajjud Consistency Card */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Tahajjud Consistency
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {analytics.tahajjudDays} of {analytics.elapsedDays} elapsed nights
              </p>
            </div>
          </div>
          <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
            {analytics.tahajjudRate}%
          </span>
        </div>
        <div className="mt-3 w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, analytics.tahajjudRate)}%` }}
          />
        </div>
      </div>

      {/* Quran Habit Tracker Card with Mini Dot Grid */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Quran Recitation
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {analytics.quranDays} recited •{' '}
                {Math.max(0, analytics.elapsedDays - analytics.quranDays)} missed
              </p>
            </div>
          </div>
          <span className="text-2xl font-black text-teal-600 dark:text-teal-400">
            {analytics.quranRate}%
          </span>
        </div>

        {/* Mini 30/31-Day Dot Matrix */}
        <div className="grid grid-cols-10 gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          {analytics.quranDailyMap.map((recited, idx) => {
            const dayNum = idx + 1;
            const isElapsed = dayNum <= analytics.elapsedDays;
            return (
              <div
                key={dayNum}
                title={`Day ${dayNum}: ${recited ? 'Recited' : isElapsed ? 'Not logged' : 'Upcoming'}`}
                className={`h-6 rounded-md flex items-center justify-center text-[10px] font-bold ${
                  recited
                    ? 'bg-teal-500 text-white'
                    : isElapsed
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    : 'bg-slate-100/60 dark:bg-slate-900 text-slate-300 dark:text-slate-700 border border-slate-200/50 dark:border-slate-800'
                }`}
              >
                {dayNum}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// SCREEN 4: SETTINGS, BACKUP & SAMPLE DATA SCREEN
// ============================================================================

interface SettingsScreenProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  viewYear: number;
  viewMonth: number;
  allData: AllTrackerData;
  monthData: MonthData;
  onLoadSample: () => void;
  onClearMonth: () => void;
  onImportData: (data: AllTrackerData) => void;
  onNotify: (msg: string) => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({
  darkMode,
  onToggleDarkMode,
  viewYear,
  viewMonth,
  allData,
  monthData,
  onLoadSample,
  onClearMonth,
  onImportData,
  onNotify
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [pasteSheetOpen, setPasteSheetOpen] = useState(false);
  const [jsonInputText, setJsonInputText] = useState('');
  const [confirmAction, setConfirmAction] = useState<'sample' | 'clear' | null>(null);

  const handleExportJSON = () => {
    const payload = {
      app: 'Muhasabah Mobile Prayer Tracker',
      exportedAt: new Date().toISOString(),
      data: allData
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `muhasabah-backup-${viewYear}-${pad2(viewMonth + 1)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    onNotify('JSON backup downloaded');
  };

  const handleExportCSV = () => {
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const headers = ['Date', 'Weekday', ...HABIT_ITEMS.map((h) => h.label)];
    const rows = [headers.join(',')];

    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = `${viewYear}-${pad2(viewMonth + 1)}-${pad2(d)}`;
      const weekday = WEEKDAY_NAMES[new Date(viewYear, viewMonth, d).getDay()];
      const rec = monthData[dateKey] || createEmptyDayRecord();
      const cols = HABIT_ITEMS.map((h) => rec[h.id] || 'none');
      rows.push([dateKey, weekday, ...cols].join(','));
    }

    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `muhasabah-${viewYear}-${pad2(viewMonth + 1)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    onNotify(`${MONTH_NAMES[viewMonth]} CSV exported`);
  };

  const parseAndImport = (rawText: string) => {
    try {
      const parsed = JSON.parse(rawText);
      const extracted =
        parsed && typeof parsed === 'object' && parsed.data ? parsed.data : parsed;
      if (!extracted || typeof extracted !== 'object') {
        throw new Error('Invalid format');
      }
      onImportData(extracted as AllTrackerData);
      onNotify('Backup restored successfully');
      setPasteSheetOpen(false);
      setJsonInputText('');
    } catch {
      onNotify('Invalid JSON format. Check your backup file.');
    }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (typeof ev.target?.result === 'string') {
        parseAndImport(ev.target.result);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-4 pb-6">
      {/* Appearance Section */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-4 shadow-sm">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3">
          Appearance
        </h3>
        <button
          type="button"
          onClick={onToggleDarkMode}
          className="w-full min-h-[52px] px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/70 flex items-center justify-between active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              {darkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </div>
            <div className="text-left">
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                {darkMode ? 'Dark Slate Theme' : 'Warm Eggshell Light Theme'}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Tap to switch color appearance
              </div>
            </div>
          </div>

          <div
            className={`w-12 h-7 rounded-full p-1 transition-colors flex items-center ${
              darkMode ? 'bg-emerald-500 justify-end' : 'bg-slate-300 justify-start'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-white shadow" />
          </div>
        </button>
      </div>

      {/* Export & Backup Section */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-4 shadow-sm space-y-2.5">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-1">
          Backup & Export
        </h3>

        <button
          type="button"
          onClick={handleExportJSON}
          className="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/70 flex items-center justify-between text-left active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-3">
            <FileJson className="w-5 h-5 text-emerald-500 shrink-0" />
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                Export Backup (JSON)
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Full multi-month portable archive
              </div>
            </div>
          </div>
          <Download className="w-4 h-4 text-slate-400" />
        </button>

        <button
          type="button"
          onClick={handleExportCSV}
          className="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/70 flex items-center justify-between text-left active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="w-5 h-5 text-teal-500 shrink-0" />
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                Export {MONTH_NAMES[viewMonth]} (CSV)
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Spreadsheet-compatible table
              </div>
            </div>
          </div>
          <Download className="w-4 h-4 text-slate-400" />
        </button>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="min-h-[46px] px-3 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/15 border border-indigo-500/30 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
          >
            <Upload className="w-4 h-4" />
            <span>Import File</span>
          </button>

          <button
            type="button"
            onClick={() => setPasteSheetOpen(true)}
            className="min-h-[46px] px-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
          >
            <ClipboardPaste className="w-4 h-4" />
            <span>Paste JSON</span>
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleFileImport}
          className="hidden"
        />
      </div>

      {/* Data Management Section */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-4 shadow-sm space-y-2.5">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-1">
          Month Data Controls
        </h3>

        <button
          type="button"
          onClick={() => setConfirmAction('sample')}
          className="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 flex items-center justify-between text-left active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-emerald-500 shrink-0" />
            <div>
              <div className="text-sm font-bold">Load 14-Day Sample Data</div>
              <div className="text-[11px] opacity-80">
                Populate {MONTH_NAMES[viewMonth]} {viewYear} with realistic logs
              </div>
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setConfirmAction('clear')}
          className="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl bg-rose-500/10 dark:bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-300 flex items-center justify-between text-left active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-3">
            <Trash2 className="w-5 h-5 text-rose-500 shrink-0" />
            <div>
              <div className="text-sm font-bold">Clear Current Month</div>
              <div className="text-[11px] opacity-80">
                Reset all {MONTH_NAMES[viewMonth]} {viewYear} entries
              </div>
            </div>
          </div>
        </button>
      </div>

      {/* Paste JSON Bottom Sheet */}
      <BottomSheet
        isOpen={pasteSheetOpen}
        onClose={() => setPasteSheetOpen(false)}
        title="Paste JSON Backup"
        subtitle="Paste your previously exported JSON data below"
      >
        <div className="space-y-3">
          <textarea
            rows={6}
            value={jsonInputText}
            onChange={(e) => setJsonInputText(e.target.value)}
            placeholder='{"data": {"2026-11": {...}}}'
            className="w-full rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 p-3 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            type="button"
            onClick={() => parseAndImport(jsonInputText)}
            disabled={!jsonInputText.trim()}
            className="w-full min-h-[46px] rounded-xl bg-emerald-500 disabled:opacity-40 text-slate-950 font-bold text-xs active:scale-95 transition-transform"
          >
            Restore Backup
          </button>
        </div>
      </BottomSheet>

      {/* Confirmation Bottom Sheet */}
      <BottomSheet
        isOpen={confirmAction !== null}
        onClose={() => setConfirmAction(null)}
        title={
          confirmAction === 'sample'
            ? `Load Sample Data (${MONTH_NAMES[viewMonth]})?`
            : `Clear ${MONTH_NAMES[viewMonth]} ${viewYear}?`
        }
        subtitle="Please confirm this action"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-200">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <p>
              {confirmAction === 'sample'
                ? 'This will overwrite days 1–15 of the currently selected month with realistic sample tracking records.'
                : 'All prayer and Quran logs for the selected month will be permanently cleared.'}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setConfirmAction(null)}
              className="min-h-[46px] rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs active:scale-95 transition-transform"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirmAction === 'sample') {
                  onLoadSample();
                } else {
                  onClearMonth();
                }
                setConfirmAction(null);
              }}
              className={`min-h-[46px] rounded-xl font-bold text-xs text-white active:scale-95 transition-transform ${
                confirmAction === 'sample' ? 'bg-emerald-600' : 'bg-rose-600'
              }`}
            >
              {confirmAction === 'sample' ? 'Load Sample' : 'Yes, Clear'}
            </button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
};

// ============================================================================
// MAIN APPLICATION SHELL (MOBILE-FIRST MAX-W-MD CONTAINER)
// ============================================================================

export default function App() {
  const {
    allData,
    darkMode,
    setDarkMode,
    getDayRecord,
    setItemStatus,
    cycleItemStatus,
    markAllFardhDone,
    loadSampleForMonth,
    clearMonth,
    importData
  } = useTrackerStorage();

  const [activeTab, setActiveTab] = useState<ActiveTab>('today');
  const [selectedDate, setSelectedDate] = useState<Date>(DEFAULT_TODAY);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
  };

  useEffect(() => {
    if (!toastMessage) return;
    const t = window.setTimeout(() => setToastMessage(null), 2600);
    return () => clearTimeout(t);
  }, [toastMessage]);

  const viewYear = selectedDate.getFullYear();
  const viewMonth = selectedDate.getMonth();
  const currentMonthKey = toMonthKey(selectedDate);
  const currentMonthData = allData[currentMonthKey] || {};
  const selectedDayRecord = getDayRecord(selectedDate);

  const handleChangeMonth = (year: number, month: number) => {
    const daysInTarget = new Date(year, month + 1, 0).getDate();
    const clampedDay = Math.min(selectedDate.getDate(), daysInTarget);
    setSelectedDate(new Date(year, month, clampedDay));
  };

  const navItems: {
    id: ActiveTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: 'today', label: 'Today', icon: Home },
    { id: 'month', label: 'Month', icon: CalendarIcon },
    { id: 'insights', label: 'Insights', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: SettingsIcon }
  ];

  return (
    <div className="min-h-screen w-full bg-slate-200/70 dark:bg-slate-950 flex justify-center selection:bg-emerald-500/30">
      {/* Centered Smartphone Shell (max-w-md) */}
      <div className="w-full max-w-md min-h-screen bg-[#FAF9F6] dark:bg-[#0F172A] text-slate-900 dark:text-slate-100 flex flex-col relative shadow-2xl border-x border-slate-200/80 dark:border-slate-800/80 overflow-x-hidden">
        {/* Top App Bar */}
        <header className="sticky top-0 z-30 bg-[#FAF9F6]/90 dark:bg-[#0F172A]/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center shadow-sm shadow-emerald-600/25">
              <Moon className="w-4 h-4 fill-white/20" />
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight leading-none text-slate-900 dark:text-white">
                Muhasabah
              </h1>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Daily Salah & Habit
              </span>
            </div>
          </div>

          {/* Quick Theme Switcher Pill */}
          <button
            type="button"
            onClick={() => setDarkMode(!darkMode)}
            className="min-w-[44px] min-h-[44px] rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 active:scale-95 transition-transform"
            aria-label="Toggle dark mode"
          >
            {darkMode ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>
        </header>

        {/* Scrollable Screen Viewport */}
        <main className="flex-1 px-4 pt-4 pb-24 overflow-y-auto">
          {activeTab === 'today' && (
            <TodayScreen
              selectedDate={selectedDate}
              onChangeDate={setSelectedDate}
              dayRecord={selectedDayRecord}
              onQuickCycle={(habitId) => cycleItemStatus(selectedDate, habitId)}
              onSetStatus={(habitId, st) => setItemStatus(selectedDate, habitId, st)}
              onMarkAllFardh={() => {
                markAllFardhDone(selectedDate);
                triggerToast('All 5 Fardh prayers marked On-Time');
              }}
            />
          )}

          {activeTab === 'month' && (
            <MonthCalendarScreen
              viewYear={viewYear}
              viewMonth={viewMonth}
              onChangeMonth={handleChangeMonth}
              monthData={currentMonthData}
              getDayRecord={getDayRecord}
              onQuickCycle={cycleItemStatus}
              onSetStatus={setItemStatus}
              onMarkAllFardh={(d) => {
                markAllFardhDone(d);
                triggerToast('All 5 Fardh prayers marked On-Time');
              }}
            />
          )}

          {activeTab === 'insights' && (
            <InsightsScreen
              viewYear={viewYear}
              viewMonth={viewMonth}
              monthData={currentMonthData}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsScreen
              darkMode={darkMode}
              onToggleDarkMode={() => setDarkMode(!darkMode)}
              viewYear={viewYear}
              viewMonth={viewMonth}
              allData={allData}
              monthData={currentMonthData}
              onLoadSample={() => {
                loadSampleForMonth(viewYear, viewMonth);
                triggerToast(`14-day sample loaded for ${MONTH_NAMES[viewMonth]}`);
              }}
              onClearMonth={() => {
                clearMonth(viewYear, viewMonth);
                triggerToast(`Cleared ${MONTH_NAMES[viewMonth]} ${viewYear}`);
              }}
              onImportData={importData}
              onNotify={triggerToast}
            />
          )}
        </main>

        {/* Floating Mobile Toast Banner */}
        {toastMessage && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-[380px] pointer-events-none">
            <div className="px-4 py-2.5 rounded-2xl bg-slate-900/95 dark:bg-emerald-950/95 text-white border border-emerald-500/40 shadow-xl backdrop-blur-md text-xs font-bold flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{toastMessage}</span>
            </div>
          </div>
        )}

        {/* Fixed Bottom Tab Navigation Bar (Thumb-Zone Ergonomics) */}
        <nav
          className="fixed bottom-0 left-1/2 -translate-x-1/2 z-30 w-full max-w-md bg-[#FAF9F6]/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200/90 dark:border-slate-800 px-2 pt-1.5 pb-safe"
          aria-label="Primary Bottom Navigation"
        >
          <div className="grid grid-cols-4 gap-1 pb-1">
            {navItems.map((nav) => {
              const Icon = nav.icon;
              const isActive = activeTab === nav.id;
              return (
                <button
                  key={nav.id}
                  type="button"
                  onClick={() => setActiveTab(nav.id)}
                  className={`min-h-[48px] rounded-2xl flex flex-col items-center justify-center gap-0.5 transition-all active:scale-95 select-none ${
                    isActive
                      ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 transition-transform ${
                      isActive ? 'scale-110 stroke-[2.5]' : ''
                    }`}
                  />
                  <span className="text-[11px] font-bold tracking-tight">
                    {nav.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}