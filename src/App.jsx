import React, { useState } from 'react';
import logoImg from './assets/WhatsApp Image 2026-05-24 at 8.26.16 PM-Photoroom.png';
import uniImg from './assets/M.jpg';
import { useQuizStore } from './store/useQuizStore';
import AdminDashboard from './components/AdminDashboard';
import QuizScreen from './components/QuizScreen';
import AdminLogin from './components/AdminLogin';
import VideoScreen from './components/VideoScreen';
const TRANSLATIONS = {
  ar: {
    welcome: "نظام التقييم الذكي",
    welcomeSub: "رحلة تعليمية متكاملة — من التقييم إلى الإتقان",
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
    doneSub: "لقد أتممت جميع مراحل التقييم بنجاح"
  },
  en: {
    welcome: "Smart Assessment System",
    welcomeSub: "A complete learning journey — from assessment to mastery",
    start: "Begin Your Journey",
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
    doneSub: "You've successfully completed all assessment stages"
  }
};
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

const PlayIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M5 3l14 9-14 9V3z" />
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
    <path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
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
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
  </svg>
);

// ── STEP NODE COMPONENT ────────────────────────────────
const StepNode = ({ number, title, subtitle, icon: Icon, state, onClick, lang }) => {
  const isActive = state === 'active';
  const isDone = state === 'done';
  const isLocked = state === 'locked';

  return (
    <div
      onClick={isActive ? onClick : undefined}
      className={`step-node relative flex flex-col items-center group ${isActive ? 'cursor-pointer' : 'cursor-default'}`}
    >
      {/* Outer ring */}
      <div className={`outer-ring absolute inset-[-10px] rounded-full transition-all duration-500 ${isActive ? 'ring-active' :
        isDone ? 'ring-done' : 'opacity-0'
        }`} />

      {/* Node circle */}
      <div className={`node-circle relative w-36 h-36 sm:w-44 sm:h-44 md:w-48 md:h-48 rounded-full flex flex-col items-center justify-center gap-2 transition-all duration-500 select-none ${isActive ? 'node-active' :
        isDone ? 'node-done' :
          'node-locked'
        }`}>

        {/* Step number badge */}
        <div className={`absolute top-4 ${lang === 'ar' ? 'right-4' : 'left-4'} w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${isActive ? 'bg-white/20 text-white' :
          isDone ? 'bg-white/25 text-white' :
            'bg-slate-700 text-slate-500'
          }`}>
          {number}
        </div>

        {/* Icon */}
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-0.5 transition-all ${isActive ? 'bg-white/20 text-white scale-110' :
          isDone ? 'bg-white/20 text-white' :
            'bg-slate-800 text-slate-600'
          }`}>
          {isDone ? <CheckIcon /> : isLocked ? <LockIcon /> : <Icon />}
        </div>

        {/* Text */}
        <div className="text-center px-3">
          <p className={`font-bold text-sm sm:text-base leading-tight ${isActive || isDone ? 'text-white' : 'text-slate-600'
            }`}>{title}</p>
          <p className={`text-xs mt-0.5 ${isActive ? 'text-white/70' :
            isDone ? 'text-white/60' :
              'text-slate-700'
            }`}>{subtitle}</p>
        </div>
      </div>

      {/* Active pulse label */}
      {isActive && (
        <div className="mt-4 tap-label">
          <span className="text-xs font-semibold text-cyan-400 bg-cyan-400/10 border border-cyan-400/25 px-3 py-1 rounded-full">
            {lang === 'ar' ? '← اضغط للبدء' : 'Tap to Start →'}
          </span>
        </div>
      )}
      {isDone && (
        <div className="mt-4">
          <span className="text-xs font-semibold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-3 py-1 rounded-full">
            {lang === 'ar' ? '✓ مكتمل' : '✓ Done'}
          </span>
        </div>
      )}
    </div>
  );
};

// ── CONNECTOR ────────────────────────────────────────────
const Connector = ({ fromDone, lang }) => (
  <div className={`connector-wrap flex items-center justify-center flex-shrink-0 ${fromDone ? 'text-emerald-500' : 'text-slate-700'}`}>
    {/* Desktop: horizontal arrow */}
    <div className="hidden md:block">
      <ArrowIcon dir={lang === 'ar' ? 'rtl' : 'ltr'} />
    </div>
    {/* Mobile: vertical arrow */}
    <div className="md:hidden flex flex-col items-center gap-1 py-2">
      <div className={`w-px h-6 ${fromDone ? 'bg-emerald-500/60' : 'bg-slate-700'}`} />
      <svg viewBox="0 0 12 16" fill="none" className="w-3 h-4">
        <path d="M6 0L6 12M2 9L6 13L10 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  </div>
);
export default function App() {
  const { lang, currentStep, toggleLanguage, startSession, setStep } = useQuizStore();
  const t = TRANSLATIONS[lang];
  const isRTL = lang === 'ar';

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

  return (
    <>
      {/* ── GLOBAL STYLES ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;900&family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; }

        .app-root {
          font-family: 'Cairo', 'Plus Jakarta Sans', sans-serif;
          min-height: 100vh;
          background: #060b18;
          overflow-x: hidden;
        }

        /* Animated background */
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
            linear-gradient(rgba(148,163,184,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(148,163,184,0.025) 1px, transparent 1px);
          background-size: 50px 50px;
        }

        /* Node styles */
        @keyframes outerPulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50%       { transform: scale(1.06); opacity: 0.9; }
        }
        @keyframes floatNode {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-6px); }
        }
        @keyframes shimmerBtn {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
          @keyframes kenBurns {
  0%   { transform: scale(1)    translateX(0px); }
  50%  { transform: scale(1.08) translateX(-15px); }
  100% { transform: scale(1)    translateX(0px); }
}
.bg-university {
  animation: kenBurns 12s ease-in-out infinite;
}
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

        .ring-active {
          border: 2px solid rgba(6,182,212,0.3);
          animation: outerPulse 2.5s ease-in-out infinite;
        }
        .ring-done {
          border: 2px solid rgba(16,185,129,0.25);
        }

        .tap-label { animation: tapPulse 2s ease-in-out infinite; }

        /* Welcome animations */
        .welcome-title  { animation: fadeUp 0.7s ease-out both; }
        .welcome-sub    { animation: fadeUp 0.7s 0.15s ease-out both; }
        .welcome-btn    { animation: fadeUp 0.7s 0.3s ease-out both; }
        .steps-wrap     { animation: scaleIn 0.5s ease-out both; }

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

        .header-blur {
          background: rgba(6, 11, 24, 0.7);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(148,163,184,0.06);
        }

        .lang-btn {
          border: 1px solid rgba(6,182,212,0.3);
          color: #67e8f9;
          transition: all 0.2s;
        }
        .lang-btn:hover {
          background: rgba(6,182,212,0.1);
          border-color: rgba(6,182,212,0.6);
          box-shadow: 0 0 16px rgba(6,182,212,0.2);
        }

        .admin-btn {
          border: 1px solid rgba(148,163,184,0.12);
          color: #94a3b8;
          transition: all 0.2s;
        }
        .admin-btn:hover {
          background: rgba(148,163,184,0.06);
          border-color: rgba(148,163,184,0.25);
          color: #e2e8f0;
        }

        .done-card {
          background: linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(5,150,105,0.05) 100%);
          border: 1px solid rgba(16,185,129,0.2);
          box-shadow: 0 0 60px rgba(16,185,129,0.1);
          animation: scaleIn 0.5s ease-out both;
        }

        .video-container {
          background: rgba(15, 23, 42, 0.9);
          border: 1px solid rgba(148,163,184,0.08);
          backdrop-filter: blur(20px);
          animation: scaleIn 0.35s ease-out both;
        }

        .step-node { transition: all 0.3s ease; }

        /* Connector glow when done */
        .connector-done line, .connector-done path {
          stroke: #10b981;
        }

        /* Scrollbar */
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(6,182,212,0.3); border-radius: 10px; }

        @media (max-width: 640px) {
          .steps-row { flex-direction: column !important; align-items: center !important; }
        }
      `}</style>

      <div className="app-root" dir={isRTL ? 'rtl' : 'ltr'}>
        <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          <img
            src={uniImg}
            className="bg-university"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: 0.07,
              transformOrigin: 'center center',
            }}
          />
          <div className="bg-canvas" style={{ position: 'absolute', inset: 0 }} />
        </div>        <div className="grid-overlay" />

        {/* ── HEADER ── */}
        <header className="header-blur sticky top-0 z-50 px-4 sm:px-6 py-3 flex items-center justify-between">
          <button
            onClick={() => { setShowAdmin(!showAdmin); setIsStepActive(false); }}
            className="admin-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium"
          >
            <SettingsIcon />
            <span className="hidden xs:inline">{showAdmin ? t.backBtn : t.adminBtn}</span>
          </button>

          <button onClick={toggleLanguage} className="lang-btn px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-bold">
            {t.langBtn}
          </button>
        </header>

        {/* ── MAIN ── */}
        <main className="relative z-10 flex-1 flex flex-col items-center justify-center min-h-[calc(100vh-56px)] px-4 py-8">

          {/* ── ADMIN SECTION ── */}
          {showAdmin ? (
            <div className="w-full max-w-4xl">
              {isAdminAuth
                ? <AdminDashboard />
                : <AdminLogin onLoginSuccess={() => setIsAdminAuth(true)} />
              }
            </div>

            /* ── ACTIVE STEP: QUIZ / VIDEO ── */
          ) : isStepActive ? (
            <div className="w-full max-w-3xl">
              {currentStep === 1 && (
                <QuizScreen quizType="pre" onComplete={() => setIsStepActive(false)} />
              )}

              {currentStep === 2 && (
                <VideoScreen onComplete={() => setIsStepActive(false)} />
              )}

              {currentStep === 3 && (
                <QuizScreen quizType="post" onComplete={() => setIsStepActive(false)} />
              )}
            </div>

            /* ── WELCOME SCREEN ── */
          ) : currentStep === 0 ? (
            <div className="text-center flex flex-col items-center gap-6 sm:gap-8 max-w-xl w-full">
              {/* Logo mark */}
              <div className="welcome-title">
                <img
                  src={logoImg}
                  className="w-52 h-52 sm:w-60 sm:h-60 object-contain mx-auto mb-2 -mt-12"

                  alt="RST RIX"
                />
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">{t.welcome}</h1>
              </div>

              <p className="welcome-sub text-slate-400 text-sm sm:text-base max-w-sm leading-relaxed">
                {t.welcomeSub}
              </p>

              {/* Mini step preview */}
              <div className="welcome-sub flex items-center gap-2 sm:gap-3 text-xs text-slate-600">
                {['①', '②', '③'].map((n, i) => (
                  <React.Fragment key={i}>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/50 font-bold">{n}</span>
                    {i < 2 && <span className="text-slate-700">→</span>}
                  </React.Fragment>
                ))}
              </div>

              <button onClick={startSession} className="welcome-btn start-btn px-10 sm:px-14 py-4 rounded-2xl text-lg sm:text-xl font-black text-white">
                {t.start}
              </button>

              <p className="welcome-btn text-slate-600 text-xs mt-2">
                Developed by <span className="text-cyan-500/70 font-semibold">Abdelrahman Abdelaziz</span>
              </p>
            </div>

            /* ── COMPLETION SCREEN ── */
          ) : currentStep === 4 ? (
            <div className="done-card rounded-2xl p-8 sm:p-12 max-w-md w-full text-center">
              <div className="w-20 h-20 rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center mx-auto mb-6 text-emerald-400"
                style={{ boxShadow: '0 0 40px rgba(16,185,129,0.2)' }}>
                <TrophyIcon />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white mb-3">{t.doneTitle}</h2>
              <p className="text-slate-400 text-sm leading-relaxed">{t.doneSub}</p>

              <div className="flex justify-center gap-2 mt-6">
                {[1, 2, 3].map(n => (
                  <div key={n} className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <CheckIcon />
                  </div>
                ))}
              </div>
            </div>

            /* ── STEPS JOURNEY SCREEN ── */
          ) : (
            <div className="flex flex-col items-center w-full max-w-5xl gap-8 steps-wrap">

              {/* Title strip */}
              <div className="text-center">
                <h2 className="text-white font-black text-xl sm:text-2xl tracking-tight mb-1">
                  {isRTL ? 'مراحل رحلتك التعليمية' : 'Your Learning Journey'}
                </h2>
                <p className="text-slate-500 text-xs sm:text-sm">
                  {isRTL ? `المرحلة ${currentStep} من 3 — استمر في التقدم` : `Stage ${currentStep} of 3 — Keep going`}
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
                    />
                    {idx < steps.length - 1 && (
                      <Connector
                        fromDone={currentStep > step.number}
                        lang={lang}
                      />
                    )}
                  </React.Fragment>
                ))}
              </div>

              {/* Progress bar */}
              <div className="w-full max-w-xs sm:max-w-sm">
                <div className="flex justify-between text-xs text-slate-600 mb-2">
                  <span>{isRTL ? 'التقدم الكلي' : 'Overall Progress'}</span>
                  <span className="text-cyan-500 font-semibold">{Math.round(((currentStep - 1) / 3) * 100)}%</span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.round(((currentStep - 1) / 3) * 100)}%`,
                      background: 'linear-gradient(90deg, #06b6d4, #3b82f6)'
                    }}
                  />
                </div>
              </div>

            </div>
          )}

        </main>
      </div>
    </>
  );
}