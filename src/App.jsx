import React, { useState } from 'react';
import logoImg from './assets/WhatsApp Image 2026-05-24 at 8.26.16 PM-Photoroom.png';
import uniImg from './assets/M.jpg';
import { useQuizStore } from './store/useQuizStore';
import AdminDashboard from './components/AdminDashboard';
import QuizScreen from './components/QuizScreen';
import AdminLogin from './components/AdminLogin';
import VideoScreen from './components/VideoScreen';
import ResultsScreen from './components/ResultsScreen';
import { db } from './firebase/config';
import { getDocs, collection } from 'firebase/firestore';

const TRANSLATIONS = {
  ar: {
    appTitle: "استكشاف الذكاء البحثي",
    welcomeSub: "نظام ذكي يقيّم مستواك قبل التعلم وبعده — لترى أثر المعرفة بوضوح",
    start: "ابدأ الآن",
    step1: "التقييم المبدئي",
    step1Sub: "قِس مستواك",
    step2: "الشرح التعليمي",
    step2Sub: "تعلّم وافهم",
    step3: "التقييم النهائي",
    step3Sub: "أثبت تطورك",
    langBtn: "English",
    videoTitle: "فيديو الشرح التعليمي",
    videoDone: "شاهدت الفيديو — التالي",
    adminBtn: "لوحة التحكم",
    backBtn: "العودة للموقع",
    doneTitle: "أحسنت! اكتملت رحلتك",
    doneSub: "لقد أتممت جميع مراحل التقييم بنجاح",
    journeyTitle: "مراحل رحلتك التعليمية",
    journeyStage: (n) => `المرحلة ${n} من 3 — استمر في التقدم`,
    progress: "التقدم الكلي",
    tapStart: "← اضغط للبدء",
    done: "✓ مكتمل",
    devBy: "تطوير ",
  },
  en: {
    appTitle: "Research Intelligence Explore",
    welcomeSub: "A smart system that evaluates your level before and after learning — to see the real impact of knowledge",
    start: "Start Now",
    step1: "Pre-Assessment",
    step1Sub: "Measure your level",
    step2: "Learning Video",
    step2Sub: "Learn & understand",
    step3: "Post-Assessment",
    step3Sub: "Prove your growth",
    langBtn: "العربية",
    videoTitle: "Educational Explanation",
    videoDone: "Video watched — Next",
    adminBtn: "Admin Panel",
    backBtn: "Back to Site",
    doneTitle: "Well Done! Journey Complete",
    doneSub: "You've successfully completed all assessment stages",
    journeyTitle: "Your Learning Journey",
    journeyStage: (n) => `Stage ${n} of 3 — Keep going`,
    progress: "Overall Progress",
    tapStart: "Tap to Start →",
    done: "✓ Done",
    devBy: "Developed by ",
  }
};

/* ── ICONS ── */
const ArrowIcon = ({ dir = 'ltr' }) => (
  <svg viewBox="0 0 40 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-10 h-4">
    {dir === 'ltr' ? (
      <>
        <line x1="0" y1="8" x2="32" y2="8" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2" />
        <path d="M28 3L35 8L28 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </>
    ) : (
      <>
        <line x1="40" y1="8" x2="8" y2="8" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2" />
        <path d="M12 3L5 8L12 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </>
    )}
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const LockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0110 0v4" />
  </svg>
);

const PencilIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
  </svg>
);

const TrophyIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12">
    <path d="M6 9H4.5a2.5 2.5 0 010-5H6" /><path d="M18 9h1.5a2.5 2.5 0 000-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0012 0V2z" />
  </svg>
);

const VideoIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <rect x="2" y="4" width="20" height="16" rx="3" />
    <path d="M10 9l5 3-5 3V9z" fill="currentColor" stroke="none" />
  </svg>
);

const SettingsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const SunIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}>
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

const MoonIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}>
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

/* ── STEP NODE ── */
const StepNode = ({ number, title, subtitle, icon: Icon, state, onClick, lang, theme }) => {
  const isActive = state === 'active';
  const isDone = state === 'done';
  const isLocked = state === 'locked';

  return (
    <div
      onClick={isActive ? onClick : undefined}
      className={`step-node relative flex flex-col items-center group ${isActive ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <div className={`outer-ring absolute inset-[-10px] rounded-full transition-all duration-500 ${isActive ? 'ring-active' : isDone ? 'ring-done' : 'opacity-0'}`} />

      <div className={`node-circle relative w-36 h-36 sm:w-44 sm:h-44 md:w-48 md:h-48 rounded-full flex flex-col items-center justify-center gap-2 transition-all duration-500 select-none ${isActive ? 'node-active' : isDone ? 'node-done' : isLocked && theme === 'light' ? 'node-locked-light' : 'node-locked'}`}>

        {/* Step number badge */}
        <div className={`absolute top-4 ${lang === 'ar' ? 'right-4' : 'left-4'} w-6 h-6 rounded-full flex items-center justify-center text-xs font-black`}
          style={{
            background: isActive || isDone ? 'rgba(255,255,255,0.2)' : theme === 'light' ? 'rgba(100,116,139,0.15)' : 'rgba(30,41,59,0.8)',
            color: isActive || isDone ? 'white' : theme === 'light' ? '#475569' : '#64748b',
          }}>
          {number}
        </div>

        {/* Icon */}
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-0.5 transition-all`}
          style={{
            background: isActive ? 'rgba(255,255,255,0.2)' : isDone ? 'rgba(255,255,255,0.2)' : theme === 'light' ? 'rgba(100,116,139,0.12)' : 'rgba(30,41,59,0.8)',
            color: isActive || isDone ? 'white' : theme === 'light' ? '#475569' : '#64748b',
            transform: isActive ? 'scale(1.1)' : 'scale(1)',
          }}>
          {isDone ? <CheckIcon /> : isLocked ? <LockIcon /> : <Icon />}
        </div>

        {/* Text */}
        <div className="text-center px-3">
          <p className="font-bold text-sm sm:text-base leading-tight"
            style={{ color: isActive || isDone ? 'white' : theme === 'light' ? '#1e293b' : '#475569' }}>
            {title}
          </p>
          <p className="text-xs mt-0.5"
            style={{ color: isActive ? 'rgba(255,255,255,0.75)' : isDone ? 'rgba(255,255,255,0.65)' : theme === 'light' ? '#64748b' : '#334155' }}>
            {subtitle}
          </p>
        </div>
      </div>

      {isActive && (
        <div className="mt-4 tap-label">
          <span style={{
            fontSize: 12, fontWeight: 600,
            color: theme === 'light' ? '#0369a1' : '#22d3ee',
            background: theme === 'light' ? 'rgba(3,105,161,0.08)' : 'rgba(6,182,212,0.1)',
            border: `1px solid ${theme === 'light' ? 'rgba(3,105,161,0.2)' : 'rgba(6,182,212,0.25)'}`,
            padding: '4px 12px', borderRadius: 999, display: 'inline-block',
          }}>
            {lang === 'ar' ? '← اضغط للبدء' : 'Tap to Start →'}
          </span>
        </div>
      )}
      {isDone && (
        <div className="mt-4">
          <span style={{
            fontSize: 12, fontWeight: 600,
            color: '#10b981',
            background: 'rgba(16,185,129,0.1)',
            border: '1px solid rgba(16,185,129,0.2)',
            padding: '4px 12px', borderRadius: 999, display: 'inline-block',
          }}>
            {lang === 'ar' ? '✓ مكتمل' : '✓ Done'}
          </span>
        </div>
      )}
    </div>
  );
};

/* ── CONNECTOR ── */
const Connector = ({ fromDone, lang, theme }) => (
  <div className={`connector-wrap flex items-center justify-center flex-shrink-0`}
    style={{ color: fromDone ? '#10b981' : theme === 'light' ? '#94a3b8' : '#334155' }}>
    <div className="hidden md:block">
      <ArrowIcon dir={lang === 'ar' ? 'rtl' : 'ltr'} />
    </div>
    <div className="md:hidden flex flex-col items-center gap-1 py-2">
      <div style={{ width: 1, height: 24, background: fromDone ? 'rgba(16,185,129,0.6)' : theme === 'light' ? '#cbd5e1' : '#1e293b' }} />
      <svg viewBox="0 0 12 16" fill="none" className="w-3 h-4">
        <path d="M6 0L6 12M2 9L6 13L10 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  </div>
);

/* ── STATS CIRCLES ── */
function StatsCircles({ lang, theme }) {
  const [stats, setStats] = React.useState({ completed: 0, dropped: 0, partial: 0 });
  const [tooltip, setTooltip] = React.useState(null);

  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        const snap = await getDocs(collection(db, 'sessions'));
        let completed = 0, dropped = 0, partial = 0;
        snap.forEach(d => {
          const s = d.data();
          if (s.currentStep >= 4) completed++;
          else if (!s.answers_pre || Object.keys(s.answers_pre).length === 0) dropped++;
          else partial++;
        });
        setStats({ completed, dropped, partial });
      } catch { }
    };
    fetchStats();
  }, []);

  const items = [
    {
      value: stats.completed,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 22, height: 22 }}>
          <path d="M18 2H6v7a6 6 0 0012 0V2z" />
          <path d="M6 9H4.5a2.5 2.5 0 010-5H6" />
          <path d="M18 9h1.5a2.5 2.5 0 000-5H18" />
          <path d="M4 22h16" />
        </svg>
      ),
      color: '#10b981',
      bg: theme === 'light' ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.12)',
      border: theme === 'light' ? 'rgba(16,185,129,0.3)' : 'rgba(16,185,129,0.25)',
      label: lang === 'ar' ? '🏆 أكملوا الرحلة' : '🏆 Completed Journey',
      desc: lang === 'ar' ? 'طلاب أتموا التقييم المبدئي والفيديو والتقييم النهائي بنجاح' : 'Students who finished all 3 stages successfully',
    },
    {
      value: stats.partial,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 22, height: 22 }}>
          <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
        </svg>
      ),
      color: '#f59e0b',
      bg: theme === 'light' ? 'rgba(245,158,11,0.1)' : 'rgba(245,158,11,0.12)',
      border: theme === 'light' ? 'rgba(245,158,11,0.3)' : 'rgba(245,158,11,0.25)',
      label: lang === 'ar' ? '⏳ لم يكملوا بعد' : '⏳ In Progress',
      desc: lang === 'ar' ? 'طلاب بدأوا لكن لم يُنهوا الاختبار النهائي' : "Students who started but haven't finished the post-assessment yet",
    },
    {
      value: stats.dropped,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 22, height: 22 }}>
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <line x1="23" y1="11" x2="17" y2="11" />
        </svg>
      ),
      color: '#f87171',
      bg: theme === 'light' ? 'rgba(248,113,113,0.1)' : 'rgba(248,113,113,0.12)',
      border: theme === 'light' ? 'rgba(248,113,113,0.3)' : 'rgba(248,113,113,0.25)',
      label: lang === 'ar' ? '👤 تسربوا' : '👤 Dropped Out',
      desc: lang === 'ar' ? 'طلاب فتحوا النظام لكن لم يبدأوا أي اختبار' : 'Students who opened the system but never started any assessment',
    },
  ];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
      <style>{`
        @keyframes tooltipIn {
          from { opacity: 0; transform: translateY(8px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .stat-circle { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .stat-circle:hover { transform: scale(1.1) translateY(-4px); }
      `}</style>

      {items.map((item, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, position: 'relative' }}>
          <div
            className="stat-circle"
            onClick={() => setTooltip(tooltip === i ? null : i)}
            style={{
              width: 72, height: 72, borderRadius: '50%',
              background: item.bg,
              border: `2px solid ${item.border}`,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 2,
              boxShadow: `0 0 20px ${item.bg}`,
              cursor: 'pointer',
            }}
          >
            <span style={{ color: item.color }}>{item.icon}</span>
            <span style={{ fontSize: 13, fontWeight: 900, color: item.color, lineHeight: 1 }}>{item.value}</span>
          </div>

          {tooltip === i && (
            <div style={{
              position: 'fixed',
              bottom: '40%',
              left: '50%',
              transform: 'translateX(-50%)',
              background: theme === 'light' ? 'rgba(255,255,255,0.98)' : 'rgba(10,15,30,0.97)',
              border: `1px solid ${item.border}`,
              borderRadius: 14,
              padding: '12px 16px',
              width: 200,
              zIndex: 100,
              boxShadow: theme === 'light'
                ? `0 8px 32px rgba(0,0,0,0.15), 0 0 20px ${item.bg}`
                : `0 8px 32px rgba(0,0,0,0.5), 0 0 20px ${item.bg}`,
              animation: 'tooltipIn 0.2s ease both',
              textAlign: lang === 'ar' ? 'right' : 'left',
              direction: lang === 'ar' ? 'rtl' : 'ltr',
            }}>
              <div style={{
                position: 'absolute', top: -7, left: '50%',
                transform: 'translateX(-50%)',
                width: 12, height: 7,
                background: theme === 'light' ? 'rgba(255,255,255,0.98)' : 'rgba(10,15,30,0.97)',
                clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
                borderTop: `1px solid ${item.border}`,
              }} />
              <p style={{ fontSize: 13, fontWeight: 800, color: item.color, marginBottom: 6 }}>{item.label}</p>
              <p style={{ fontSize: 11, color: theme === 'light' ? '#64748b' : '#94a3b8', lineHeight: 1.6 }}>{item.desc}</p>
              <p style={{ fontSize: 18, fontWeight: 900, color: item.color, marginTop: 8 }}>
                {item.value} {lang === 'ar' ? 'طالب' : 'students'}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════
   MAIN APP
══════════════════════════════════════════════ */
export default function App() {
  const { lang, currentStep, toggleLanguage, startSession, setStep, theme, toggleTheme, isBlocked, setIsBlocked } = useQuizStore();


  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const t = TRANSLATIONS[lang];
  const isRTL = lang === 'ar';
  const isLight = theme === 'light';

  const [showAdmin, setShowAdmin] = useState(false);
  const [isStepActive, setIsStepActive] = useState(false);
  const [isAdminAuth, setIsAdminAuth] = useState(false);

  const getStepState = (n) => {
    if (currentStep > n) return 'done';
    if (currentStep === n) return 'active';
    return 'locked';
  };

  const steps = [
    { number: 1, key: 'step1', Icon: PencilIcon },
    { number: 2, key: 'step2', Icon: VideoIcon },
    { number: 3, key: 'step3', Icon: TrophyIcon },
  ];

  /* ── dynamic colors based on theme ── */
  const colors = {
    appTitle: isLight ? '#0c4a6e' : '#f8fafc',
    welcomeSub: isLight ? '#1e3a5f' : '#94a3b8',
    journeyTitle: isLight ? '#0c4a6e' : '#f8fafc',
    journeyStage: isLight ? '#475569' : '#64748b',
    progressLabel: isLight ? '#475569' : '#475569',
    progressBar: isLight ? '#e2e8f0' : '#1e293b',
    devText: isLight ? '#94a3b8' : '#475569',
    devName: isLight ? '#0369a1' : '#22d3ee',
    adminBtnColor: isLight ? '#1e293b' : '#94a3b8',
    adminBtnBorder: isLight ? 'rgba(30,41,59,0.25)' : 'rgba(148,163,184,0.12)',
    adminBtnHoverBg: isLight ? 'rgba(30,41,59,0.06)' : 'rgba(148,163,184,0.06)',
    langBtnColor: isLight ? '#0369a1' : '#67e8f9',
    langBtnBorder: isLight ? 'rgba(3,105,161,0.4)' : 'rgba(6,182,212,0.3)',
    themeBtnColor: isLight ? '#0369a1' : '#67e8f9',
    themeBtnBg: isLight ? 'transparent' : 'transparent',
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;900&family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        /* ── THEME TOKENS ── */
        :root[data-theme="dark"] {
          --bg-main: #060b18;
          --text-main: #f8fafc;
          --grid-color: rgba(148,163,184,0.025);
          --header-bg-from: rgba(6,182,212,0.15);
          --header-bg-to: rgba(3,105,161,0.12);
          --header-border: rgba(6,182,212,0.2);
          --node-locked-from: #1e293b;
          --node-locked-to: #0f172a;
        }
        :root[data-theme="light"] {
          --bg-main: #dff0f7;
          --text-main: #0f172a;
          --grid-color: rgba(15,23,42,0.05);
          --header-bg-from: rgba(186,230,253,0.75);
          --header-bg-to: rgba(147,210,240,0.7);
          --header-border: rgba(3,105,161,0.15);
          --node-locked-from: #cbd5e1;
          --node-locked-to: #94a3b8;
        }

        .app-root {
          font-family: 'Cairo', 'Plus Jakarta Sans', sans-serif;
          min-height: 100vh;
          background: var(--bg-main);
          color: var(--text-main);
          transition: background 0.4s ease, color 0.4s ease;
          overflow-x: hidden;
        }

        /* Ambient background */
        .bg-canvas {
          position: fixed; inset: 0; z-index: 0; pointer-events: none;
          background:
            radial-gradient(ellipse 80% 50% at 20% 0%, rgba(6,182,212,0.07) 0%, transparent 60%),
            radial-gradient(ellipse 60% 40% at 80% 100%, rgba(59,130,246,0.06) 0%, transparent 60%),
            radial-gradient(ellipse 40% 60% at 50% 50%, rgba(16,185,129,0.03) 0%, transparent 70%);
        }
        .grid-overlay {
          position: fixed; inset: 0; z-index: 0; pointer-events: none;
          background-image:
            linear-gradient(var(--grid-color) 1px, transparent 1px),
            linear-gradient(90deg, var(--grid-color) 1px, transparent 1px);
          background-size: 50px 50px;
        }

        /* ── HEADER ── */
        .header-blur {
          background: linear-gradient(90deg,
            var(--header-bg-from) 0%,
            var(--header-bg-to) 50%,
            var(--header-bg-from) 100%);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid var(--header-border);
          position: relative;
          overflow: hidden;
        }
        .header-blur::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg, transparent, #06b6d4, #0ea5e9, #06b6d4, transparent);
          animation: waveSlide 3s linear infinite;
        }
        @keyframes waveSlide {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }

        /* ── NODE STATES ── */
        @keyframes outerPulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50%       { transform: scale(1.06); opacity: 0.9; }
        }
        @keyframes floatNode {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-6px); }
        }
        .node-active {
          background: linear-gradient(135deg, #0891b2 0%, #0369a1 50%, #1d4ed8 100%);
          box-shadow: 0 0 0 4px rgba(6,182,212,0.2), 0 0 40px rgba(6,182,212,0.35), 0 8px 32px rgba(0,0,0,0.4);
          animation: floatNode 3s ease-in-out infinite;
        }
        .node-active:hover {
          box-shadow: 0 0 0 6px rgba(6,182,212,0.3), 0 0 60px rgba(6,182,212,0.5), 0 12px 40px rgba(0,0,0,0.5);
          transform: translateY(-8px) scale(1.03) !important;
          animation: none !important;
        }
        .node-done {
          background: linear-gradient(135deg, #059669 0%, #047857 100%);
          box-shadow: 0 0 0 3px rgba(16,185,129,0.2), 0 6px 24px rgba(16,185,129,0.2);
        }
        .node-locked {
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
          box-shadow: inset 0 1px 0 rgba(148,163,184,0.05);
        }
        /* Light mode locked node */
        .node-locked-light {
          background: linear-gradient(135deg, #cbd5e1 0%, #94a3b8 100%);
          box-shadow: 0 2px 12px rgba(100,116,139,0.15);
        }
        .ring-active {
          border: 2px solid rgba(6,182,212,0.3);
          animation: outerPulse 2.5s ease-in-out infinite;
        }
        .ring-done {
          border: 2px solid rgba(16,185,129,0.25);
        }

        /* ── ANIMATIONS ── */
        @keyframes kenBurns {
          0%   { transform: scale(1)    translateX(0px); }
          50%  { transform: scale(1.08) translateX(-15px); }
          100% { transform: scale(1)    translateX(0px); }
        }
        .bg-university { animation: kenBurns 12s ease-in-out infinite; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.92); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes tapPulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.5; }
        }
        @keyframes spinSlow {
          0%   { transform: rotate(0deg) scale(1); }
          50%  { transform: rotate(180deg) scale(1.15); }
          100% { transform: rotate(360deg) scale(1); }
        }
        @keyframes shimmerBtn {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }

        .welcome-title { animation: fadeUp 0.7s ease-out both; }
        .welcome-sub   { animation: fadeUp 0.7s 0.15s ease-out both; }
        .welcome-btn   { animation: fadeUp 0.7s 0.3s ease-out both; }
        .steps-wrap    { animation: scaleIn 0.5s ease-out both; }
        .tap-label     { animation: tapPulse 2s ease-in-out infinite; }

        .start-btn {
          background: linear-gradient(90deg, #0891b2, #0369a1, #1d4ed8, #0891b2);
          background-size: 300% auto;
          animation: shimmerBtn 3s linear infinite;
          box-shadow: 0 0 30px rgba(6,182,212,0.4), 0 4px 20px rgba(0,0,0,0.3);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .start-btn:hover {
          transform: scale(1.04) translateY(-2px);
          box-shadow: 0 0 50px rgba(6,182,212,0.6), 0 8px 30px rgba(0,0,0,0.4);
        }

        .theme-btn { animation: spinSlow 6s linear infinite; }
        .theme-btn:hover { opacity: 0.8; }

        /* ── PROGRESS BAR TRACK ── */
        .progress-track {
          height: 6px;
          border-radius: 999px;
          overflow: hidden;
          background: var(--progress-track, #1e293b);
        }

        /* ── SCROLLBAR ── */
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(6,182,212,0.3); border-radius: 10px; }

        @media (max-width: 640px) {
          .steps-row { flex-direction: column !important; align-items: center !important; }
        }
      `}</style>

      <div className="app-root" dir={isRTL ? 'rtl' : 'ltr'} data-theme={theme}>

        {/* ── BACKGROUND ── */}
        <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          <img
            src={uniImg}
            className="bg-university"
            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: isLight ? 0.06 : 0.07, transformOrigin: 'center center' }}
          />
          <div className="bg-canvas" style={{ position: 'absolute', inset: 0 }} />
        </div>
        <div className="grid-overlay" />

        {/* ── HEADER ── */}
        <header dir="ltr" className="header-blur sticky top-0 z-50 px-4 sm:px-6 py-3 flex items-center justify-between">

          {/* Admin button */}
          <button
            onClick={() => { setShowAdmin(!showAdmin); setIsStepActive(false); }}
            style={{
              border: `1px solid ${colors.adminBtnBorder}`,
              color: colors.adminBtnColor,
              background: 'transparent',
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', borderRadius: 8,
              fontSize: 13, fontWeight: 500, cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = colors.adminBtnHoverBg}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <SettingsIcon />
            <span>{showAdmin ? t.backBtn : t.adminBtn}</span>
          </button>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="theme-btn"
            style={{
              border: 'none',
              color: colors.themeBtnColor,
              background: colors.themeBtnBg,
              padding: '7px 9px',
              borderRadius: 8,
              cursor: 'pointer',
              lineHeight: 0,
              transition: 'opacity 0.2s',
            }}
            title={isLight ? 'Dark mode' : 'Light mode'}
          >
            {isLight ? <MoonIcon /> : <SunIcon />}
          </button>

          {/* Language toggle */}
          <button
            onClick={toggleLanguage}
            style={{
              border: `1px solid ${colors.langBtnBorder}`,
              color: colors.langBtnColor,
              background: 'transparent',
              padding: '6px 14px', borderRadius: 8,
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = isLight ? 'rgba(3,105,161,0.08)' : 'rgba(6,182,212,0.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            {t.langBtn}
          </button>
        </header>

        {/* ── MAIN ── */}
        <main className="relative z-10 flex-1 flex flex-col items-center justify-center min-h-[calc(100vh-56px)] px-4 py-8">

          {/* ── ADMIN ── */}
          {showAdmin ? (
            <div className="w-full max-w-4xl">
              {isAdminAuth
                ? <AdminDashboard />
                : <AdminLogin onLoginSuccess={() => setIsAdminAuth(true)} />
              }
            </div>

            /* ── ACTIVE STEP ── */
          ) : isStepActive ? (
            <div className="w-full max-w-3xl">
              {currentStep === 1 && <QuizScreen quizType="pre" onComplete={() => setIsStepActive(false)} />}
              {currentStep === 2 && <VideoScreen onComplete={() => setIsStepActive(false)} />}
              {currentStep === 3 && <QuizScreen quizType="post" onComplete={() => setIsStepActive(false)} />}
            </div>

            /* ── WELCOME SCREEN ── */
          ) : currentStep === 0 ? (
            <div className="text-center flex flex-col items-center gap-6 sm:gap-8 max-w-xl w-full">
              <div className="welcome-title flex flex-col items-center">
                <img
                  src={logoImg}
                  className="w-52 h-52 sm:w-60 sm:h-60 object-contain mx-auto mb-2 -mt-12"
                  alt="RST RIX"
                />
                <h1
                  className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight"
                  style={{ color: colors.appTitle }}
                >
                  {t.appTitle}
                </h1>
              </div>

              <p
                className="welcome-sub text-sm sm:text-base max-w-sm leading-relaxed"
                style={{ color: colors.welcomeSub }}
              >
                {t.welcomeSub}
              </p>

              <StatsCircles lang={lang} theme={theme} />

              <button
                onClick={startSession}
                className="welcome-btn start-btn px-10 sm:px-14 py-4 rounded-2xl text-lg sm:text-xl font-black text-white"
              >
                {t.start}
              </button>
            </div>

            /* ── COMPLETION ── */
          ) : currentStep === 4 ? (
            <ResultsScreen />

            /* ── STEPS JOURNEY ── */
          ) : (
            <div className="flex flex-col items-center w-full max-w-5xl gap-8 steps-wrap">

              {/* Title */}
              <div className="text-center">
                <h2
                  className="font-black text-xl sm:text-2xl tracking-tight mb-1"
                  style={{ color: colors.journeyTitle }}
                >
                  {t.journeyTitle}
                </h2>
                <p className="text-xs sm:text-sm" style={{ color: colors.journeyStage }}>
                  {t.journeyStage(currentStep)}
                </p>
              </div>

              {/* Steps + connectors */}
              <div className="steps-row flex flex-row items-center justify-center gap-2 sm:gap-4 md:gap-6 flex-wrap md:flex-nowrap w-full px-2">
                {steps.map((step, idx) => (
                  <React.Fragment key={step.number}>
                    <StepNode
                      number={step.number}
                      title={t[step.key]}
                      subtitle={t[`${step.key}Sub`]}
                      icon={step.Icon}
                      state={getStepState(step.number)}
                      onClick={() => setIsStepActive(true)}
                      lang={lang}
                      theme={theme}
                    />
                    {idx < steps.length - 1 && (
                      <Connector fromDone={currentStep > step.number} lang={lang} theme={theme} />
                    )}
                  </React.Fragment>
                ))}
              </div>

              {/* Progress bar */}
              <div className="w-full max-w-xs sm:max-w-sm">
                <div className="flex justify-between text-xs mb-2" style={{ color: colors.progressLabel }}>
                  <span>{t.progress}</span>
                  <span style={{ color: '#06b6d4', fontWeight: 600 }}>
                    {Math.round(((currentStep - 1) / 3) * 100)}%
                  </span>
                </div>
                <div style={{
                  height: 6, borderRadius: 999, overflow: 'hidden',
                  background: isLight ? '#cbd5e1' : '#1e293b',
                }}>
                  <div style={{
                    height: '100%',
                    borderRadius: 999,
                    width: `${Math.round(((currentStep - 1) / 3) * 100)}%`,
                    background: 'linear-gradient(90deg, #06b6d4, #3b82f6)',
                    transition: 'width 0.7s ease',
                  }} />
                </div>
              </div>

            </div>
          )}
        </main>

        {/* ── FOOTER ── */}
        <p style={{ textAlign: 'center', width: '100%', paddingBottom: 16, fontSize: 12 }}>
          <span style={{ color: colors.devText }}>
            {t.devBy}
          </span>
          <span style={{ color: colors.devName, fontWeight: 600 }}>
            {lang === 'ar' ? 'عبدالرحمن عبدالعزيز' : 'Abdelrahman Abdelaziz'}
          </span>
        </p>
      </div>

      {isBlocked && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24,
          animation: 'fadeUp 0.3s ease both',
        }}>
          <div style={{
            background: isLight ? 'rgba(255,255,255,0.97)' : 'rgba(10,15,30,0.97)',
            border: `1px solid ${isLight ? 'rgba(239,68,68,0.3)' : 'rgba(239,68,68,0.4)'}`,
            borderRadius: 24,
            padding: '40px 32px',
            maxWidth: 400,
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 0 60px rgba(239,68,68,0.2), 0 20px 60px rgba(0,0,0,0.5)',
          }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'rgba(239,68,68,0.1)',
              border: '2px solid rgba(239,68,68,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
              fontSize: 36,
            }}>
              🔒
            </div>
            <h2 style={{
              fontSize: 22, fontWeight: 900,
              color: '#ef4444',
              marginBottom: 12,
              lineHeight: 1.4,
            }}>
              {lang === 'ar' ? 'اكتمل العدد المسموح به' : 'Registration Closed'}
            </h2>
            <p style={{
              fontSize: 14,
              color: isLight ? '#475569' : '#94a3b8',
              lineHeight: 1.8,
              marginBottom: 8,
            }}>
              {lang === 'ar'
                ? 'عذراً، لقد وصل عدد المشاركين إلى الحد الأقصى المسموح به'
                : 'Sorry, the maximum number of participants has been reached.'}
            </p>
            <div style={{
              display: 'inline-block',
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: 999,
              padding: '6px 18px',
              fontSize: 13,
              fontWeight: 700,
              color: '#ef4444',
              marginBottom: 28,
            }}>
              300 / 300 {lang === 'ar' ? 'مشارك' : 'participants'}
            </div>
            <button
              onClick={() => setIsBlocked(false)}
              style={{
                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                color: 'white',
                border: 'none',
                borderRadius: 14,
                padding: '12px 32px',
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer',
                width: '100%',
                boxShadow: '0 4px 20px rgba(239,68,68,0.4)',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              {lang === 'ar' ? 'حسناً، فهمت' : 'Got it'}
            </button>
          </div>
        </div>
      )}

      {/* Bottom accent line */}
      <div style={{
        height: 4, width: '100%',
        background: 'linear-gradient(90deg, transparent, #06b6d4, #0ea5e9, #06b6d4, transparent)',
      }} />
    </>
  );
}