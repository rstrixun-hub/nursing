import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { useQuizStore } from '../store/useQuizStore';
import NoteBook from './NoteBook';


const formatVideoUrl = (url) => {
    if (!url || typeof url !== 'string') return '';

    let formattedUrl = url.trim();
    if (formattedUrl.includes('/shorts/')) {
        const videoId = formattedUrl.split('/shorts/')[1].split('?')[0].split('&')[0];
        return `https://www.youtube.com/watch?v=${videoId}`;
    }
    if (formattedUrl.includes('youtu.be/')) {
        const videoId = formattedUrl.split('youtu.be/')[1].split('?')[0].split('&')[0];
        return `https://www.youtube.com/watch?v=${videoId}`;
    }
    if (formattedUrl.includes('youtube.com/watch')) {
        return formattedUrl;
    }
    if (formattedUrl.length === 11 && /^[a-zA-Z0-9_-]{11}$/.test(formattedUrl)) {
        return `https://www.youtube.com/watch?v=${formattedUrl}`;
    }

    return formattedUrl;
};
const getVideoId = (url) => {
    if (url.includes('v=')) {
        return url.split('v=')[1].split('&')[0];
    }
    if (url.includes('youtu.be/')) {
        return url.split('youtu.be/')[1].split('?')[0];
    }
    if (url.length === 11) {
        return url;
    }
    return '';
};
const PlayIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
);

const LockIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
);

const CheckCircleIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
);

const ChevronRightIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <polyline points="9 18 15 12 9 6" />
    </svg>
);

const ChevronLeftIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <polyline points="15 18 9 12 15 6" />
    </svg>
);

const SpinnerIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8 animate-spin">
        <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity="0.2" fill="currentColor" stroke="none" />
        <path d="M12 3a9 9 0 019 9" />
    </svg>
);

const FilmIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <rect x="2" y="2" width="20" height="20" rx="2.18" />
        <line x1="7" y1="2" x2="7" y2="22" />
        <line x1="17" y1="2" x2="17" y2="22" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <line x1="2" y1="7" x2="7" y2="7" />
        <line x1="2" y1="17" x2="7" y2="17" />
        <line x1="17" y1="17" x2="22" y2="17" />
        <line x1="17" y1="7" x2="22" y2="7" />
    </svg>
);

const ArrowIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="12 5 19 12 12 19" />
    </svg>
);

const AlertIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
);
export default function VideoScreen({ onComplete }) {
    const { lang, setStep } = useQuizStore();
    const isAr = lang === 'ar';
    const uid = auth.currentUser?.uid || null;
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [current, setCurrent] = useState(0);
    const [watched, setWatched] = useState(new Set());
    const [transitioning, setTransitioning] = useState(false);
    const [playerReady, setPlayerReady] = useState(false);
    const [slideDir, setSlideDir] = useState('right');
    const [playerError, setPlayerError] = useState(null);
    const [videoProgress, setVideoProgress] = useState(0);
    const [timeLeft, setTimeLeft] = useState(0);
    const playerRef = useRef(null);
    const timerRef = useRef(null);
    const youtubePlayerRef = useRef(null);
    const timeoutRef = useRef(null);
    const loadTimerRef = useRef(null);
    const progressCheckRef = useRef(null);

    useEffect(() => {
        const loadVideos = async () => {
            try {
                const q = query(collection(db, 'videos'), orderBy('step', 'asc'));
                const snap = await getDocs(q);
                const docs = [];
                snap.forEach(d => {
                    const data = d.data();
                    if (data.url && data.title) {
                        docs.push({ id: d.id, ...data });
                    }
                });

                if (docs.length > 0) {
                    setVideos(docs);
                    console.log(`✅ Loaded ${docs.length} videos`);
                } else {
                    console.warn('⚠️ No valid videos found');
                }
            } catch (e) {
                console.error('❌ Error loading videos:', e);
            } finally {
                setLoading(false);
            }
        };

        loadVideos();
    }, []);
    useEffect(() => {
        if (!window.YT) {
            const tag = document.createElement('script');
            tag.src = 'https://www.youtube.com/iframe_api';
            document.body.appendChild(tag);
        }
    }, []);
    useEffect(() => {
        if (!playerRef.current || !window.YT) return;

        const videoId = getVideoId(currentVideo?.url || '');
        if (!videoId) return;

        try {
            youtubePlayerRef.current = new window.YT.Player(playerRef.current, {
                height: '100%',
                width: '100%',
                videoId: videoId,
                events: {
                    onReady: handlePlayerReady,
                    onStateChange: handlePlayerStateChange,
                    onError: handlePlayerError,
                },
                playerVars: {
                    rel: 0,
                    modestbranding: 1,
                    iv_load_policy: 3,
                    autoplay: 0,
                    controls: 1,
                    fs: 1,
                    showinfo: 0,
                },
            });
        } catch (e) {
            console.error('❌ YouTube Player error:', e);
        }

        return () => {
            if (youtubePlayerRef.current && youtubePlayerRef.current.destroy) {
                youtubePlayerRef.current.destroy();
                youtubePlayerRef.current = null;
            }
        };
    }, [current, videos]);
    useEffect(() => {
        const savedWatched = localStorage.getItem('watched_videos');
        const savedCurrent = localStorage.getItem('current_video');
        if (savedWatched) setWatched(new Set(JSON.parse(savedWatched)));
        if (savedCurrent) setCurrent(Number(savedCurrent));
    }, []);

    useEffect(() => {
        if (watched.size > 0) {
            localStorage.setItem('watched_videos', JSON.stringify([...watched]));
        }
    }, [watched]);

    useEffect(() => {
        localStorage.setItem('current_video', current);
    }, [current]);
    useEffect(() => {
        setPlayerReady(false);
        setPlayerError(null);
        setVideoProgress(0);
    }, [current]);
    useEffect(() => {
        if (!currentVideo) return;
        if (watched.has(current)) return;

        const duration = currentVideo.duration || 60;
        setTimeLeft(duration);
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = null;

        return () => {
            clearInterval(timerRef.current);
            timerRef.current = null;
        };
    }, [current, videos]);

    const startTimer = useCallback(() => {
        if (watched.has(current)) return;
        if (timerRef.current) return;

        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                    setWatched(p => new Set([...p, current]));
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }, [current, watched]);
    useEffect(() => {
        const handleMessage = (event) => {
            if (event.origin !== 'https://www.youtube.com') return;
            try {
                const data = JSON.parse(event.data);
                if (data.event === 'onStateChange' && data.info === 0) {
                    setWatched(prev => new Set([...prev, current]));
                }
                if (data.event === 'infoDelivery' && data.info?.currentTime) {
                    const progress = (data.info.currentTime / (data.info.duration || 1)) * 100;
                    setVideoProgress(progress);
                }
            } catch (e) { }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [current]);
    useEffect(() => {
        if (!playerReady) {
            if (loadTimerRef.current) clearTimeout(loadTimerRef.current);
            loadTimerRef.current = setTimeout(() => {
                console.warn('⚠️ Player load timeout - forcing ready state');
                setPlayerReady(true);
            }, 8000);
        }

        return () => {
            if (loadTimerRef.current) clearTimeout(loadTimerRef.current);
        };
    }, [playerReady, current]);
    const currentVideo = useMemo(() => videos[current], [videos, current]);
    const totalVideos = videos.length;
    const isLastVideo = current === totalVideos - 1;
    const isWatched = watched.has(current);
    const canGoNext = isWatched;
    const canGoPrev = current > 0;
    const navigate = useCallback((dir) => {
        if (transitioning) return;

        setSlideDir(dir);
        setTransitioning(true);
        setPlayerReady(false);

        timeoutRef.current = setTimeout(() => {
            setCurrent(prev => {
                const newIndex = prev + (dir === 'right' ? 1 : -1);
                return Math.max(0, Math.min(newIndex, totalVideos - 1));
            });
            setTransitioning(false);
        }, 320);
    }, [transitioning, totalVideos]);

    const goNext = useCallback(() => {
        if (!canGoNext || transitioning) return;

        if (isLastVideo) {
            setStep(3);
            onComplete();
            return;
        }

        navigate('right');
    }, [canGoNext, transitioning, isLastVideo, navigate, setStep, onComplete]);

    const goPrev = useCallback(() => {
        if (!canGoPrev || transitioning) return;
        navigate('left');
    }, [canGoPrev, transitioning, navigate]);

    const jumpTo = useCallback((idx) => {
        if (idx === current || transitioning) return;

        const maxReachable = Math.max(...[...watched], -1) + 1;
        if (idx > maxReachable) return;

        setSlideDir(idx > current ? 'right' : 'left');
        setTransitioning(true);
        setPlayerReady(false);

        timeoutRef.current = setTimeout(() => {
            setCurrent(idx);
            setTransitioning(false);
        }, 320);
    }, [current, transitioning, watched]);
    const handlePlayerReady = useCallback(() => {
        console.log('✅ Player ready');
        setPlayerReady(true);
        setPlayerError(null);
        if (youtubePlayerRef.current) {
            progressCheckRef.current = setInterval(() => {
                try {
                    const current = youtubePlayerRef.current?.getCurrentTime() || 0;
                    const duration = youtubePlayerRef.current?.getDuration() || 0;
                    const progress = duration > 0 ? (current / duration) * 100 : 0;
                    setVideoProgress(progress);
                } catch (e) {
                    console.log('Progress check:', e);
                }
            }, 500);
        }
    }, []);

    const handlePlayerStateChange = useCallback((event) => {
        if (event.data === 0) {
            console.log('✅ Video ended');
            setWatched(prev => new Set([...prev, current]));
            if (progressCheckRef.current) clearInterval(progressCheckRef.current);
        }
    }, [current]);

    const handlePlayerError = useCallback((event) => {
        console.error('❌ Player error:', event.data);
        setPlayerError('Failed to load video');
        setPlayerReady(true);
    }, []);
    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            if (loadTimerRef.current) clearTimeout(loadTimerRef.current);
            if (progressCheckRef.current) clearInterval(progressCheckRef.current);
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);
    if (loading) {
        return (
            <div className="vscreen-root flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="text-cyan-400"><SpinnerIcon /></div>
                    <p className="text-slate-400 text-sm font-medium animate-pulse">
                        {isAr ? 'جاري تحميل المحتوى...' : 'Loading content...'}
                    </p>
                </div>
            </div>
        );
    }
    if (videos.length === 0) {
        return (
            <div className="vscreen-root flex items-center justify-center min-h-[60vh]">
                <div className="vs-card rounded-2xl p-8 max-w-md w-full text-center border border-amber-500/20">
                    <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto mb-4">
                        <FilmIcon />
                    </div>
                    <p className="text-white font-bold mb-2">
                        {isAr ? 'لا توجد فيديوهات بعد' : 'No videos yet'}
                    </p>
                    <p className="text-slate-500 text-sm">
                        {isAr ? 'يرجى إضافة الفيديوهات من لوحة التحكم' : 'Please add videos from the admin panel'}
                    </p>
                </div>
            </div>
        );
    }
    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700;800&family=Syne:wght@700;800&display=swap');

      /* ← كان background: hardcoded dark */
.vscreen-root {
  font-family: 'IBM Plex Sans Arabic', sans-serif;
  direction: ${isAr ? 'rtl' : 'ltr'};
  min-height: 100dvh;
  padding: 24px 16px 40px;
  background:
    radial-gradient(ellipse 80% 50% at 10% 0%,  rgba(6,182,212,.08) 0%, transparent 60%),
    radial-gradient(ellipse 60% 40% at 90% 100%, rgba(99,102,241,.07) 0%, transparent 60%),
    var(--bg-main);
}

/* ← كان rgba(15,23,42,.9) */
.vs-card {
  background: var(--card-bg);
  backdrop-filter: blur(24px);
  border: 1px solid var(--border-subtle);
}
        /* ── Progress Rail ── */
        .vs-rail {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .vs-rail-segment {
          height: 4px;
          border-radius: 99px;
          flex: 1;
          background: rgba(148,163,184,.15);
          transition: all .4s ease;
          cursor: default;
          position: relative;
          overflow: hidden;
        }
        .vs-rail-segment.done   { background: #10b981; cursor: pointer; }
        .vs-rail-segment.active {
          background: rgba(6,182,212,.25);
          cursor: default;
        }
        .vs-rail-segment.reachable { cursor: pointer; }
        .vs-rail-segment.reachable:hover { background: rgba(148,163,184,.3); }

        .vs-step-dot {
          width: 28px; height: 28px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 700;
          flex-shrink: 0;
          transition: all .3s ease;
          border: 2px solid transparent;
        }
        .vs-step-dot.done    { background: #10b981; color: #fff; border-color: #10b981; cursor: pointer; }
        .vs-step-dot.active  { background: rgba(6,182,212,.15); color: #06b6d4; border-color: #06b6d4; box-shadow: 0 0 14px rgba(6,182,212,.35); }
        .vs-step-dot.locked  { background: rgba(148,163,184,.08); color: rgba(148,163,184,.35); border-color: rgba(148,163,184,.12); cursor: not-allowed; }
        .vs-step-dot.reachable { background: rgba(148,163,184,.1); color: #94a3b8; border-color: rgba(148,163,184,.2); cursor: pointer; }
        .vs-step-dot.reachable:hover { border-color: rgba(6,182,212,.4); color: #06b6d4; }

        /* ── Player wrapper ── */
        .vs-player-wrap {
          position: relative;
          padding-top: 56.25%;
          background: #000;
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid rgba(148,163,184,.1);
          box-shadow: 0 8px 60px rgba(0,0,0,.7), 0 0 0 1px rgba(6,182,212,.06);
        }
        .vs-player-wrap > * {
          position: absolute !important;
          top: 0 !important; left: 0 !important;
          width: 100% !important; height: 100% !important;
        }
        #youtube-player {
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          width: 100% !important;
          height: 100% !important;
        }

        /* ── Skeleton shimmer ── */
        .vs-skeleton {
          position: absolute; inset: 0;
          background: linear-gradient(90deg,
            rgba(15,23,42,1) 0%,
            rgba(30,41,59,1) 50%,
            rgba(15,23,42,1) 100%);
          background-size: 200% 100%;
          animation: shimmer 1.6s ease-in-out infinite;
          display: flex; align-items: center; justify-content: center;
          z-index: 10;
        }

        /* ── Slide transitions ── */
        .vs-slide-enter-right { animation: slideInRight .32s cubic-bezier(.4,0,.2,1) forwards; }
        .vs-slide-enter-left  { animation: slideInLeft  .32s cubic-bezier(.4,0,.2,1) forwards; }
        .vs-slide-exit        { animation: fadeOut      .18s ease forwards; }

        /* ── Buttons ── */
        .vs-btn-primary {
          background: linear-gradient(135deg, #06b6d4, #6366f1);
          box-shadow: 0 4px 24px rgba(6,182,212,.3);
          transition: all .25s ease;
        }
        .vs-btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(6,182,212,.45); }
        .vs-btn-primary:active:not(:disabled) { transform: translateY(0); }
        .vs-btn-primary:disabled { opacity: .3; cursor: not-allowed; }

        .vs-btn-ghost {
          background: rgba(148,163,184,.06);
          border: 1px solid rgba(148,163,184,.12);
          transition: all .2s ease;
        }
        .vs-btn-ghost:hover:not(:disabled) {
          background: rgba(148,163,184,.12);
          border-color: rgba(148,163,184,.22);
        }
        .vs-btn-ghost:disabled { opacity: .3; cursor: not-allowed; }

        /* ── Watch gate ── */
        .vs-gate {
          background: rgba(6,182,212,.04);
          border: 1px dashed rgba(6,182,212,.25);
          border-radius: 14px;
          padding: 14px 18px;
          display: flex; align-items: center; gap: 10px;
        }
        .vs-gate-text {
          font-size: 13px; font-weight: 600; color: rgba(6,182,212,.8);
          animation: gateBreath 2s ease-in-out infinite;
        }

        .vs-progress-bar {
          height: 3px;
          background: rgba(6,182,212,.2);
          border-radius: 99px;
          overflow: hidden;
          margin-top: 8px;
        }
        .vs-progress-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #06b6d4, #10b981);
          border-radius: 99px;
          transition: width 0.3s ease;
        }

        /* ── Description block ── */
        .vs-desc {
          background: rgba(99,102,241,.05);
          border: 1px solid rgba(99,102,241,.12);
          border-radius: 14px;
          padding: 14px 18px;
        }

        .vs-error-box {
          background: rgba(239,68,68,.05);
          border: 1px solid rgba(239,68,68,.25);
          border-radius: 14px;
          padding: 14px 18px;
          display: flex; align-items: center; gap: 10px;
        }
        .vs-error-text {
          font-size: 13px; font-weight: 600; color: rgba(239,68,68,.8);
        }

        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes slideInRight {
          from { opacity:0; transform: translateX(${isAr ? '-' : ''}48px); }
          to   { opacity:1; transform: translateX(0); }
        }
        @keyframes slideInLeft {
          from { opacity:0; transform: translateX(${isAr ? '' : '-'}48px); }
          to   { opacity:1; transform: translateX(0); }
        }
        @keyframes fadeOut {
          from { opacity:1; }
          to   { opacity:0; transform: scale(.97); }
        }
        @keyframes gateBreath {
          0%,100% { opacity:.8; }
          50%     { opacity:1; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
        .animate-pulse { animation: pulse 2s ease-in-out infinite; }
        /* ── Light theme overrides ── */
:root[data-theme="light"] .vscreen-root h1,
:root[data-theme="light"] .vscreen-root h2 {
  color: var(--text-primary) !important;
}
:root[data-theme="light"] .vscreen-root .text-white {
  color: var(--text-primary) !important;
}
:root[data-theme="light"] .vscreen-root .text-slate-300,
:root[data-theme="light"] .vscreen-root .text-slate-400 {
  color: var(--text-secondary) !important;
}
:root[data-theme="light"] .vscreen-root .text-slate-500,
:root[data-theme="light"] .vscreen-root .text-slate-600 {
  color: var(--text-muted) !important;
}
:root[data-theme="light"] .vscreen-root .border-slate-800\/80 {
  border-color: var(--border-subtle) !important;
}
:root[data-theme="light"] .vs-btn-ghost {
  background: rgba(148,163,184,0.15) !important;
  border-color: rgba(148,163,184,0.3) !important;
  color: var(--text-secondary) !important;
}
:root[data-theme="light"] .vs-btn-ghost:hover:not(:disabled) {
  background: rgba(148,163,184,0.25) !important;
}
:root[data-theme="light"] .vs-gate {
  background: rgba(6,182,212,0.06);
  border-color: rgba(6,182,212,0.3);
}
:root[data-theme="light"] .vs-desc {
  background: rgba(99,102,241,0.06);
  border-color: rgba(99,102,241,0.2);
}
:root[data-theme="light"] .vs-rail-segment {
  background: rgba(148,163,184,0.3);
}

        /* ── Badges ── */
        .vs-badge-done {
          display: inline-flex; align-items: center; gap: 5px;
          background: rgba(16,185,129,.1);
          border: 1px solid rgba(16,185,129,.25);
          border-radius: 99px;
          padding: 3px 10px;
          font-size: 11px; font-weight: 700; color: #10b981;
          letter-spacing: .03em;
        }
        .vs-badge-stage {
          display: inline-flex; align-items: center; gap: 5px;
          background: rgba(6,182,212,.08);
          border: 1px solid rgba(6,182,212,.18);
          border-radius: 99px;
          padding: 3px 10px;
          font-size: 11px; font-weight: 600; color: rgba(6,182,212,.9);
        }

        /* ── Number accent ── */
        .vs-num {
          font-family: 'Syne', sans-serif;
          font-size: 52px;
          font-weight: 800;
          line-height: 1;
          background: linear-gradient(135deg, rgba(6,182,212,.15), rgba(99,102,241,.1));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          position: absolute;
          top: -8px;
          ${isAr ? 'left: -4px;' : 'right: -4px;'}
          pointer-events: none;
          user-select: none;
        }
      `}</style>

            <div className="vscreen-root">
                <div className="max-w-2xl mx-auto">

                    {/* ── Header ── */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                                <FilmIcon />
                            </div>
                            <div>
                                <h1 className="text-white font-bold text-base leading-none mb-0.5">
                                    {isAr ? 'الفيديوهات التعليمية' : 'Learning Videos'}
                                </h1>
                                <p className="text-slate-500 text-xs">
                                    {isAr ? `${totalVideos} مراحل` : `${totalVideos} stages`}
                                </p>
                            </div>
                        </div>
                        <div className="vs-badge-stage">
                            <FilmIcon />
                            {isAr ? `${current + 1} / ${totalVideos}` : `${current + 1} / ${totalVideos}`}
                        </div>
                    </div>

                    {/* ── Progress Rail ── */}
                    <div className="mb-6">
                        <div className="vs-rail mb-2">
                            {videos.map((_, idx) => {
                                const maxReachable = Math.max(...[...watched], -1) + 1;
                                const isDone = watched.has(idx);
                                const isActive = idx === current;
                                const isReach = !isDone && !isActive && idx <= maxReachable;
                                return (
                                    <React.Fragment key={idx}>
                                        <div
                                            onClick={() => jumpTo(idx)}
                                            className={`vs-step-dot ${isDone ? 'done' : isActive ? 'active' : isReach ? 'reachable' : 'locked'}`}
                                            title={isDone ? (isAr ? 'تمت المشاهدة' : 'Watched') : isActive ? (isAr ? 'يُشاهد الآن' : 'Now playing') : (isAr ? 'مقفل' : 'Locked')}
                                        >
                                            {isDone
                                                ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><polyline points="20 6 9 17 4 12" /></svg>
                                                : isActive
                                                    ? <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                                                    : <LockIcon />
                                            }
                                        </div>
                                        {idx < totalVideos - 1 && (
                                            <div
                                                className={`vs-rail-segment ${isDone ? 'done' : isActive ? 'active' : ''} ${!isDone && !isActive && idx < Math.max(...[...watched], -1) + 1 ? 'reachable' : ''
                                                    }`}
                                            />
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </div>
                        <div className="flex items-center justify-between">
                            <p className="text-slate-600 text-xs">
                                {isAr
                                    ? `${watched.size} من ${totalVideos} مكتمل`
                                    : `${watched.size} of ${totalVideos} complete`}
                            </p>
                            {watched.size > 0 && (
                                <span className="vs-badge-done">
                                    <CheckCircleIcon />
                                    {isAr ? `${watched.size} تم` : `${watched.size} done`}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* ── Main Card ── */}
                    <div
                        key={current}
                        className={`vs-card rounded-2xl overflow-hidden mb-4 ${transitioning
                            ? 'vs-slide-exit'
                            : slideDir === 'right'
                                ? 'vs-slide-enter-right'
                                : 'vs-slide-enter-left'
                            }`}
                    >
                        {/* Card Header */}
                        <div className="px-5 pt-5 pb-4 border-b border-slate-800/80">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 relative">
                                    <div className="vs-num">{current + 1}</div>
                                    <p className="text-slate-500 text-xs font-semibold uppercase tracking-widest mb-1 relative z-10">
                                        {isAr ? `المرحلة ${currentVideo?.step ?? current + 1}` : `Stage ${currentVideo?.step ?? current + 1}`}
                                    </p>
                                    <h2 className="text-white font-bold text-lg leading-snug relative z-10">
                                        {currentVideo?.title?.[lang] || currentVideo?.title?.ar || currentVideo?.title?.en || (isAr ? 'فيديو تعليمي' : 'Educational Video')}
                                    </h2>
                                </div>
                                {isWatched && (
                                    <div className="vs-badge-done flex-shrink-0 mt-1">
                                        <CheckCircleIcon />
                                        {isAr ? 'مكتمل' : 'Done'}
                                    </div>
                                )}
                            </div>
                        </div>
                        {/* Player Section - الحل الجذري باستخدام Iframe */}
                        <div className="p-4">
                            <div className="vs-player-wrap" style={{ position: 'relative', paddingTop: '56.25%', height: 0 }}>
                                {currentVideo?.url ? (
                                    <iframe
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: '100%',
                                            borderRadius: '12px',
                                            border: 'none'
                                        }}
                                        src={`https://www.youtube.com/embed/${getVideoId(formatVideoUrl(currentVideo.url))
                                            }?rel=0&modestbranding=1&enablejsapi=1&origin=${window.location.origin}`}
                                        title="YouTube video player"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                        onLoad={() => {
                                            setPlayerReady(true);
                                            setTimeout(() => startTimer(), 1500);
                                        }}
                                    ></iframe>
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50">
                                        <p className="text-slate-500 text-sm">
                                            {isAr ? 'لم يتم إضافة رابط الفيديو' : 'No video URL'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                        {/* Error Message */}
                        {playerError && playerReady && (
                            <div className="px-4 pt-2">
                                <div className="vs-error-box">
                                    <div className="text-red-500 flex-shrink-0">
                                        <AlertIcon />
                                    </div>
                                    <p className="vs-error-text">
                                        {isAr ? 'حدثت مشكلة في تحميل الفيديو' : 'Failed to load video'}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Description */}
                        {(currentVideo?.description?.ar || currentVideo?.description?.en) && (
                            <div className="px-4 py-4">
                                <div className="vs-desc">
                                    <p className="text-slate-300 text-sm leading-relaxed">
                                        {currentVideo.description?.[lang] || currentVideo.description?.ar || currentVideo.description?.en}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Watch Gate or Next Button */}
                        <div className="px-4 pb-5">
                            {!isWatched ? (
                                <div className="vs-gate">
                                    <div className="text-cyan-500 flex-shrink-0">
                                        <AlertIcon />
                                    </div>
                                    <div className="flex-1">
                                        <p className="vs-gate-text">
                                            {isAr ? 'يرجى مشاهدة الفيديو للمتابعة' : 'Please watch the video to continue'}
                                        </p>
                                        <div className="flex items-center gap-3 mt-2">
                                            <div className="vs-progress-bar flex-1">
                                                <div
                                                    className="vs-progress-bar-fill"
                                                    style={{ width: `${(1 - timeLeft / (currentVideo?.duration || 60)) * 100}%` }}
                                                />
                                            </div>
                                            <span className="text-cyan-400 text-xs font-bold flex-shrink-0">
                                                {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={goNext}
                                    disabled={transitioning}
                                    className="vs-btn-primary w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl text-white font-bold text-sm"
                                >
                                    {isLastVideo ? (
                                        <>
                                            <ArrowIcon />
                                            {isAr ? 'الانتقال للاختبار' : 'Go to Quiz'}
                                        </>
                                    ) : (
                                        <>
                                            {isAr ? <ChevronLeftIcon /> : <ChevronRightIcon />}
                                            {isAr
                                                ? `التالي — المرحلة ${(currentVideo?.step ?? current + 1) + 1}`
                                                : `Next — Stage ${(currentVideo?.step ?? current + 1) + 1}`}
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* ── Bottom Navigation ── */}
                    <div className="flex items-center justify-between gap-3">
                        <button
                            onClick={goPrev}
                            disabled={!canGoPrev || transitioning}
                            className="vs-btn-ghost flex items-center gap-2 px-4 py-2.5 rounded-xl text-slate-300 font-semibold text-sm"
                        >
                            {isAr ? <ChevronRightIcon /> : <ChevronLeftIcon />}
                            {isAr ? 'السابق' : 'Previous'}
                        </button>

                        {/* Progress Dots */}
                        <div className="flex items-center gap-1.5">
                            {videos.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => jumpTo(idx)}
                                    className="transition-all duration-300"
                                    title={`Stage ${idx + 1}`}
                                    disabled={transitioning}
                                >
                                    <div className={`rounded-full transition-all duration-300 ${idx === current
                                        ? 'w-5 h-2 bg-cyan-400'
                                        : watched.has(idx)
                                            ? 'w-2 h-2 bg-emerald-500'
                                            : 'w-2 h-2 bg-slate-700'
                                        }`} />
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={goNext}
                            disabled={!canGoNext || transitioning}
                            className="vs-btn-ghost flex items-center gap-2 px-4 py-2.5 rounded-xl text-slate-300 font-semibold text-sm"
                        >
                            {isAr ? 'التالي' : 'Next'}
                            {isAr ? <ChevronLeftIcon /> : <ChevronRightIcon />}
                        </button>
                    </div>

                </div>
            </div>

            <NoteBook
                uid={uid}
                videoId={currentVideo?.id || String(current)}
                isAr={isAr}
            />
        </>
    );
}