import React, { useEffect, useState, useRef } from 'react';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useQuizStore } from '../store/useQuizStore';
const T = {
    ar: {
        pre: 'التقييم المبدئي',
        post: 'التقييم النهائي',
        loading: 'جاري تحميل الأسئلة...',
        noQ: 'لا توجد أسئلة متاحة',
        next: 'التالي',
        prev: 'السابق',
        submit: 'إرسال الإجابات',
        submitting: 'جاري الإرسال...',
        question: 'سؤال',
        of: 'من',
        answered: 'مُجاب',
        remaining: 'متبقٍ',
        completed: 'مكتمل',
        skip: 'تخطَّ',
        sessionLost: 'فقدت الجلسة، برجاء العودة للصفحة الرئيسية.',
        saveError: 'خطأ في الحفظ',
        answerAll: 'برجاء الإجابة على جميع الأسئلة',
        reviewMode: 'مراجعة إجاباتك',
        goTo: 'اذهب إلى',
        finish: 'إنهاء وإرسال',
    },
    en: {
        pre: 'Pre-Assessment',
        post: 'Post-Assessment',
        loading: 'Loading questions...',
        noQ: 'No questions available',
        next: 'Next',
        prev: 'Previous',
        submit: 'Submit Answers',
        submitting: 'Submitting...',
        question: 'Question',
        of: 'of',
        answered: 'Answered',
        remaining: 'Remaining',
        completed: 'Complete',
        skip: 'Skip',
        sessionLost: 'Session lost, return to home.',
        saveError: 'Save error',
        answerAll: 'Please answer all questions',
        reviewMode: 'Review Your Answers',
        goTo: 'Go to',
        finish: 'Finish & Submit',
    }
};
const OPTION_CHARS = ['A', 'B', 'C', 'D', 'E'];
const ChevronRight = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M9 18l6-6-6-6" />
    </svg>
);
const ChevronLeft = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M15 18l-6-6 6-6" />
    </svg>
);
const CheckCircle = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
    </svg>
);
const SendIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
);
const CircularProgress = ({ value, total, size = 72 }) => {
    const pct = total === 0 ? 0 : (value / total);
    const r = (size / 2) - 6;
    const circ = 2 * Math.PI * r;
    const dash = pct * circ;

    return (
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(148,163,184,0.08)" strokeWidth="5" />
            <circle
                cx={size / 2} cy={size / 2} r={r} fill="none"
                stroke="url(#cpGrad)" strokeWidth="5"
                strokeDasharray={`${dash} ${circ}`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 0.6s cubic-bezier(0.34,1.56,0.64,1)' }}
            />
            <defs>
                <linearGradient id="cpGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
            </defs>
        </svg>
    );
};
export default function QuizScreen({ quizType, onComplete }) {
    const { lang, studentId, setStep } = useQuizStore();
    const t = T[lang] || T.en;
    const isRTL = lang === 'ar';

    const [questions, setQuestions] = useState([]);
    const [selectedAnswers, setSelectedAnswers] = useState({});
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [direction, setDirection] = useState('next'); // 'next' | 'prev'
    const [animating, setAnimating] = useState(false);
    const [showReview, setShowReview] = useState(false);
    const [ripple, setRipple] = useState(null);
    const [lockedAnswers, setLockedAnswers] = useState({});
    const cardRef = useRef(null);
    useEffect(() => {
        const fetchQuestions = async () => {
            try {
                const snapshot = await getDocs(collection(db, 'questions'));
                const docs = [];
                snapshot.forEach(d => docs.push({ id: d.id, ...d.data() }));
                setQuestions(docs);
            } catch (err) {
                console.error('Error fetching questions:', err);
            }
            setLoading(false);
        };
        fetchQuestions();
    }, []);

    const currentQ = questions[currentIndex];
    const answeredCount = Object.keys(selectedAnswers).length;
    const remainingCount = questions.length - answeredCount;
    const progressPct = questions.length === 0 ? 0 : Math.round(((currentIndex) / questions.length) * 100);
    const isLastQuestion = currentIndex === questions.length - 1;
    const isAnswered = currentQ && selectedAnswers[currentQ.id] !== undefined;
    const navigate = (dir) => {
        if (animating) return;
        setDirection(dir);
        setAnimating(true);
        setTimeout(() => {
            if (dir === 'next' && currentIndex < questions.length - 1) setCurrentIndex(i => i + 1);
            if (dir === 'prev' && currentIndex > 0) setCurrentIndex(i => i - 1);
            setAnimating(false);
        }, 220);
    };

    const jumpTo = (idx) => {
        if (animating || idx === currentIndex) return;
        setDirection(idx > currentIndex ? 'next' : 'prev');
        setAnimating(true);
        setTimeout(() => {
            setCurrentIndex(idx);
            setAnimating(false);
            setShowReview(false);
        }, 220);
    };

    const handleSelect = async (questionId, optionKey, e) => {
        if (lockedAnswers[questionId]) return;

        if (selectedAnswers[questionId] !== undefined) {
            setLockedAnswers(prev => ({ ...prev, [questionId]: true }));
        }
        if (e) {
            const rect = e.currentTarget.getBoundingClientRect();
            setRipple({ x: e.clientX - rect.left, y: e.clientY - rect.top, key: Date.now() });
            setTimeout(() => setRipple(null), 600);
        }

        setSelectedAnswers(prev => ({ ...prev, [questionId]: optionKey }));

        try {
            await setDoc(doc(db, 'sessions', studentId), {
                [`answers_${quizType}`]: { ...selectedAnswers, [questionId]: optionKey },
                lastUpdate: new Date().toISOString()
            }, { merge: true });
        } catch (err) {
            console.error('Error saving answer:', err);
        }

        if (currentIndex < questions.length - 1) {
            setTimeout(() => navigate('next'), 420);
        }
    };
    const handleSubmit = async () => {
        if (answeredCount !== questions.length) return;
        if (!studentId) { alert(t.sessionLost); return; }
        setIsSubmitting(true);
        try {
            const nextStep = quizType === 'pre' ? 2 : 4;
            await setDoc(doc(db, 'sessions', studentId), {
                [`answers_${quizType}`]: selectedAnswers,
                currentStep: nextStep,
                lastUpdate: new Date().toISOString()
            }, { merge: true });
            await setStep(nextStep);
            onComplete();
        } catch (err) {
            alert(`${t.saveError}: ${err.message}`);
        }
        setIsSubmitting(false);
    };
    if (loading) return (
        <div style={styles.loadWrap}>
            <div style={styles.loadSpinner} />
            <p style={styles.loadText}>{t.loading}</p>
        </div>
    );

    if (questions.length === 0) return (
        <div style={styles.loadWrap}>
            <p style={{ color: '#f59e0b', fontSize: 18 }}>{t.noQ}</p>
        </div>
    );
    if (showReview) return (
        <div dir={isRTL ? 'rtl' : 'ltr'} style={styles.root}>
            <style>{cssString}</style>

            {/* Header */}
            <div style={styles.reviewHeader}>
                <button onClick={() => setShowReview(false)} style={styles.backBtn}>
                    {isRTL ? <ChevronRight /> : <ChevronLeft />}
                </button>
                <h2 style={styles.reviewTitle}>{t.reviewMode}</h2>
                <div style={styles.reviewStats}>
                    <span style={{ color: '#10b981' }}>{answeredCount} ✓</span>
                    {remainingCount > 0 && <span style={{ color: '#f59e0b', marginRight: 8, marginLeft: 8 }}>{remainingCount} ○</span>}
                </div>
            </div>

            {/* Grid */}
            <div style={styles.reviewGrid}>
                {questions.map((q, idx) => {
                    const ans = selectedAnswers[q.id];
                    return (
                        <button key={q.id} onClick={() => jumpTo(idx)}
                            style={{
                                ...styles.reviewCell,
                                background: ans ? 'linear-gradient(135deg,#065f46,#047857)' : 'rgba(30,41,59,0.9)',
                                border: ans ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(148,163,184,0.1)',
                                boxShadow: ans ? '0 0 12px rgba(16,185,129,0.15)' : 'none',
                            }}
                        >
                            <span style={styles.reviewCellNum}>{idx + 1}</span>
                            {ans && <span style={styles.reviewCellAns}>{ans}</span>}
                        </button>
                    );
                })}
            </div>

            {/* Submit */}
            {answeredCount === questions.length && (
                <button onClick={handleSubmit} disabled={isSubmitting} style={styles.submitBtn} className="quiz-submit-btn">
                    {isSubmitting ? t.submitting : <><SendIcon /><span style={{ marginRight: 8, marginLeft: 8 }}>{t.finish}</span></>}
                </button>
            )}
        </div>
    );
    const options = currentQ ? Object.entries(currentQ.options || {}) : [];
    return (
        <div dir={isRTL ? 'rtl' : 'ltr'} style={styles.root}>
            <style>{cssString}</style>

            {/* ── TOP BAR ── */}
            <div style={styles.topBar}>
                {/* Stats pill */}
                <div style={styles.statsPill}>
                    <div style={styles.statItem}>
                        <span style={{ color: '#10b981', fontWeight: 700 }}>{answeredCount}</span>
                        <span style={styles.statLabel}>{t.answered}</span>
                    </div>
                    <div style={styles.statDivider} />
                    <div style={styles.statItem}>
                        <span style={{ color: '#f59e0b', fontWeight: 700 }}>{remainingCount}</span>
                        <span style={styles.statLabel}>{t.remaining}</span>
                    </div>
                </div>

                {/* Circular progress + count */}
                <div style={styles.circleWrap}>
                    <CircularProgress value={currentIndex + 1} total={questions.length} size={64} />
                    <div style={styles.circleText}>
                        <span style={styles.circleNum}>{currentIndex + 1}</span>
                        <span style={styles.circleTotal}>/{questions.length}</span>
                    </div>
                </div>

                {/* Review button */}
                <button onClick={() => setShowReview(true)} style={styles.reviewBtn} className="quiz-review-btn">
                    {isRTL ? 'مراجعة' : 'Review'}
                </button>
            </div>

            {/* ── PROGRESS BAR ── */}
            <div style={styles.progressTrack}>
                <div style={{ ...styles.progressFill, width: `${((currentIndex + (isAnswered ? 1 : 0)) / questions.length) * 100}%` }} />
                {/* Dots */}
                <div style={styles.dotsRow}>
                    {questions.map((q, idx) => {
                        const ans = selectedAnswers[q.id];
                        const isCur = idx === currentIndex;
                        return (
                            <button key={q.id} onClick={() => jumpTo(idx)} style={{
                                ...styles.dot,
                                background: ans ? '#10b981' : isCur ? '#06b6d4' : 'rgba(148,163,184,0.15)',
                                transform: isCur ? 'scale(1.5)' : 'scale(1)',
                                boxShadow: isCur ? '0 0 8px rgba(6,182,212,0.6)' : ans ? '0 0 6px rgba(16,185,129,0.4)' : 'none',
                            }} />
                        );
                    })}
                </div>
            </div>

            {/* ── QUESTION CARD ── */}
            <div
                ref={cardRef}
                key={currentIndex}
                style={styles.card}
                className={`quiz-card ${animating ? (direction === 'next' ? 'slide-out-left' : 'slide-out-right') : 'slide-in'}`}
            >
                {/* Question number badge */}
                <div style={styles.qBadge}>
                    <span style={styles.qBadgeLabel}>{t.question}</span>
                    <span style={styles.qBadgeNum}>{currentIndex + 1}</span>
                    <span style={styles.qBadgeOf}>{t.of} {questions.length}</span>
                </div>

                {/* Question text */}
                <h3 style={styles.qText}>
                    {currentQ?.question?.[lang] || currentQ?.question?.ar || currentQ?.question?.en || '—'}
                </h3>

                {/* Options */}
                <div style={styles.optionsWrap}>
                    {options.map(([key, option], oi) => {
                        const isSelected = selectedAnswers[currentQ.id] === key;
                        const label = OPTION_CHARS[oi] || key;
                        return (
                            <button
                                key={key}
                                onClick={(e) => handleSelect(currentQ.id, key, e)}
                                style={{
                                    ...styles.option,
                                    ...(isSelected ? styles.optionSelected : styles.optionDefault),
                                    animationDelay: `${oi * 0.07}s`,
                                    cursor: lockedAnswers[currentQ.id] ? 'not-allowed' : 'pointer',
                                    opacity: lockedAnswers[currentQ.id] && !isSelected ? 0.35 : 1,
                                    filter: lockedAnswers[currentQ.id] && !isSelected ? 'grayscale(1)' : 'none',
                                    transition: 'all 0.3s ease',
                                }}
                                className={`quiz-option ${lockedAnswers[currentQ.id] ? 'cursor-not-allowed' : ''}`}
                            >
                                {/* Ripple */}
                                {ripple && isSelected && (
                                    <span style={{
                                        position: 'absolute',
                                        left: ripple.x - 60,
                                        top: ripple.y - 60,
                                        width: 120, height: 120,
                                        borderRadius: '50%',
                                        background: 'rgba(6,182,212,0.2)',
                                        animation: 'ripple 0.6s ease-out forwards',
                                        pointerEvents: 'none',
                                    }} />
                                )}

                                {/* Label bubble */}
                                <div style={{
                                    ...styles.optLabel,
                                    background: isSelected ? 'rgba(6,182,212,0.25)' : 'rgba(30,41,59,0.8)',
                                    color: isSelected ? '#67e8f9' : '#94a3b8',
                                    border: isSelected ? '1px solid rgba(6,182,212,0.5)' : '1px solid rgba(148,163,184,0.1)',
                                }}>
                                    {label}
                                </div>

                                {/* Option text */}
                                <span style={{
                                    ...styles.optText,
                                    color: isSelected ? '#e2e8f0' : '#94a3b8',
                                }}>
                                    {option?.[lang] || option?.ar || option?.en || option}
                                </span>

                                {/* Check */}
                                {isSelected && (
                                    <div style={styles.optCheck}>
                                        <CheckCircle />
                                    </div>
                                )}

                                {/* Glow line */}
                                {isSelected && <div style={styles.optGlow} />}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── NAVIGATION ── */}
            <div style={styles.navRow}>
                <button
                    onClick={() => navigate('prev')}
                    disabled={currentIndex === 0 || animating}
                    style={{
                        ...styles.navBtn,
                        opacity: currentIndex === 0 ? 0.3 : 1,
                    }}
                    className="quiz-nav-btn"
                >
                    {isRTL ? <ChevronRight /> : <ChevronLeft />}
                    <span>{t.prev}</span>
                </button>

                {/* Middle: submit if last + all answered, else next */}
                {isLastQuestion && answeredCount === questions.length ? (
                    <button onClick={handleSubmit} disabled={isSubmitting} style={styles.submitBtnSmall} className="quiz-submit-btn">
                        {isSubmitting
                            ? <><div style={styles.spinnerSmall} />{t.submitting}</>
                            : <><SendIcon /><span style={{ marginRight: 6, marginLeft: 6 }}>{t.submit}</span></>
                        }
                    </button>
                ) : (
                    <button
                        onClick={() => navigate('next')}
                        disabled={isLastQuestion || animating}
                        style={{
                            ...styles.navBtnNext,
                            opacity: isLastQuestion ? 0.3 : 1,
                        }}
                        className="quiz-nav-btn-next"
                    >
                        <span>{t.next}</span>
                        {isRTL ? <ChevronLeft /> : <ChevronRight />}
                    </button>
                )}
            </div>

        </div>
    );
}
const styles = {
    root: {
        width: '100%',
        maxWidth: 720,
        margin: '0 auto',
        padding: '8px 4px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        fontFamily: "'Cairo', 'Plus Jakarta Sans', sans-serif",
    },
    loadWrap: {
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: 300, gap: 16,
    },
    loadSpinner: {
        width: 44, height: 44, borderRadius: '50%',
        border: '3px solid rgba(6,182,212,0.15)',
        borderTop: '3px solid #06b6d4',
        animation: 'spin 0.8s linear infinite',
    },
    loadText: { color: '#67e8f9', fontSize: 15 },

    // Top bar
    topBar: {
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 4px',
    },
    statsPill: {
        display: 'flex', alignItems: 'center',
        background: 'rgba(15,23,42,0.8)',
        border: '1px solid rgba(148,163,184,0.08)',
        borderRadius: 12, padding: '8px 14px', gap: 12,
        backdropFilter: 'blur(12px)',
    },
    statItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 },
    statLabel: { fontSize: 10, color: '#475569', fontWeight: 600, letterSpacing: '0.05em' },
    statDivider: { width: 1, height: 24, background: 'rgba(148,163,184,0.1)' },
    circleWrap: { position: 'relative', width: 64, height: 64 },
    circleText: {
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
        justifyContent: 'center',
    },
    circleNum: { fontSize: 16, fontWeight: 900, color: '#e2e8f0' },
    circleTotal: { fontSize: 11, color: '#475569', marginTop: 2 },
    reviewBtn: {
        background: 'rgba(15,23,42,0.8)',
        border: '1px solid rgba(148,163,184,0.12)',
        color: '#94a3b8', borderRadius: 10,
        padding: '8px 14px', fontSize: 13, fontWeight: 600,
        cursor: 'pointer', backdropFilter: 'blur(12px)',
        fontFamily: 'inherit',
    },
    progressTrack: {
        height: 4, background: 'rgba(148,163,184,0.08)',
        borderRadius: 999, position: 'relative', overflow: 'visible',
        margin: '4px 0',
    },
    progressFill: {
        height: '100%', borderRadius: 999,
        background: 'linear-gradient(90deg, #06b6d4, #3b82f6)',
        transition: 'width 0.5s cubic-bezier(0.34,1.56,0.64,1)',
        boxShadow: '0 0 8px rgba(6,182,212,0.5)',
    },
    dotsRow: {
        position: 'absolute', top: '50%', transform: 'translateY(-50%)',
        left: 0, right: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 2px',
    },
    dot: {
        width: 8, height: 8, borderRadius: '50%',
        border: 'none', cursor: 'pointer', padding: 0,
        transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
    },
    card: {
        background: 'rgba(15,23,42,0.85)',
        border: '1px solid rgba(148,163,184,0.08)',
        borderRadius: 20,
        padding: '28px 24px',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)',
        position: 'relative',
        overflow: 'hidden',
    },
    qBadge: {
        display: 'inline-flex', alignItems: 'center', gap: 6,
        background: 'rgba(6,182,212,0.08)',
        border: '1px solid rgba(6,182,212,0.2)',
        borderRadius: 8, padding: '4px 10px',
        marginBottom: 16,
    },
    qBadgeLabel: { fontSize: 11, color: '#67e8f9', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' },
    qBadgeNum: { fontSize: 13, color: '#06b6d4', fontWeight: 900 },
    qBadgeOf: { fontSize: 11, color: '#475569' },
    qText: {
        fontSize: 18, fontWeight: 700, color: '#f1f5f9',
        lineHeight: 1.65, marginBottom: 24, marginTop: 0,
    },
    optionsWrap: { display: 'flex', flexDirection: 'column', gap: 10 },
    option: {
        position: 'relative', display: 'flex', alignItems: 'center', gap: 14,
        padding: '14px 16px', borderRadius: 14, cursor: 'pointer',
        border: 'none', textAlign: 'start', width: '100%',
        transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
        fontFamily: 'inherit',
        animation: 'optIn 0.4s ease both',
        overflow: 'hidden',
    },
    optionDefault: {
        background: 'rgba(30,41,59,0.7)',
        border: '1px solid rgba(148,163,184,0.08)',
    },
    optionSelected: {
        background: 'rgba(6,182,212,0.08)',
        border: '1px solid rgba(6,182,212,0.35)',
        boxShadow: '0 0 20px rgba(6,182,212,0.12), inset 0 1px 0 rgba(6,182,212,0.1)',
        transform: 'translateX(4px)',
    },
    optLabel: {
        minWidth: 34, height: 34, borderRadius: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13, fontWeight: 800, flexShrink: 0,
        transition: 'all 0.25s ease',
    },
    optText: { fontSize: 15, fontWeight: 500, lineHeight: 1.5, transition: 'color 0.2s ease', flex: 1 },
    optCheck: { color: '#10b981', flexShrink: 0, marginRight: 4, marginLeft: 4 },
    optGlow: {
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
        background: 'linear-gradient(180deg, #06b6d4, #3b82f6)',
        borderRadius: '3px 0 0 3px',
    },
    navRow: {
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 12, marginTop: 4,
    },
    navBtn: {
        display: 'flex', alignItems: 'center', gap: 6,
        background: 'rgba(30,41,59,0.8)',
        border: '1px solid rgba(148,163,184,0.1)',
        color: '#94a3b8', borderRadius: 12,
        padding: '12px 20px', fontSize: 14, fontWeight: 600,
        cursor: 'pointer', fontFamily: 'inherit',
        transition: 'all 0.2s ease',
    },
    navBtnNext: {
        display: 'flex', alignItems: 'center', gap: 6,
        background: 'linear-gradient(135deg, #0891b2, #1d4ed8)',
        border: '1px solid rgba(6,182,212,0.3)',
        color: '#fff', borderRadius: 12,
        padding: '12px 24px', fontSize: 14, fontWeight: 700,
        cursor: 'pointer', fontFamily: 'inherit',
        boxShadow: '0 0 20px rgba(6,182,212,0.25)',
        transition: 'all 0.2s ease',
    },
    submitBtn: {
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        background: 'linear-gradient(135deg, #059669, #047857)',
        border: '1px solid rgba(16,185,129,0.3)',
        color: '#fff', borderRadius: 14,
        padding: '14px 28px', fontSize: 15, fontWeight: 700,
        cursor: 'pointer', fontFamily: 'inherit', width: '100%',
        boxShadow: '0 0 30px rgba(16,185,129,0.25)',
        marginTop: 16,
    },
    submitBtnSmall: {
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        background: 'linear-gradient(135deg, #059669, #047857)',
        border: '1px solid rgba(16,185,129,0.3)',
        color: '#fff', borderRadius: 12,
        padding: '12px 24px', fontSize: 14, fontWeight: 700,
        cursor: 'pointer', fontFamily: 'inherit',
        boxShadow: '0 0 20px rgba(16,185,129,0.2)',
    },
    backBtn: {
        display: 'flex', alignItems: 'center',
        background: 'rgba(30,41,59,0.8)',
        border: '1px solid rgba(148,163,184,0.1)',
        color: '#94a3b8', borderRadius: 10,
        padding: '8px 12px', cursor: 'pointer',
    },
    reviewHeader: {
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 16,
    },
    reviewTitle: { fontSize: 18, fontWeight: 800, color: '#f1f5f9', margin: 0 },
    reviewStats: { display: 'flex', alignItems: 'center', fontSize: 14, fontWeight: 700 },
    reviewGrid: {
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(52px, 1fr))',
        gap: 8,
    },
    reviewCell: {
        height: 52, borderRadius: 10, cursor: 'pointer',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 2, border: 'none', fontFamily: 'inherit',
        transition: 'all 0.2s ease',
    },
    reviewCellNum: { fontSize: 13, fontWeight: 800, color: '#e2e8f0' },
    reviewCellAns: { fontSize: 10, fontWeight: 700, color: '#6ee7b7' },
    spinnerSmall: {
        width: 16, height: 16, borderRadius: '50%',
        border: '2px solid rgba(255,255,255,0.2)',
        borderTop: '2px solid #fff',
        animation: 'spin 0.7s linear infinite',
        flexShrink: 0,
    },
};
const cssString = `
  @keyframes spin { to { transform: rotate(360deg); } }

  @keyframes slideInFromRight {
    from { opacity: 0; transform: translateX(40px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes slideInFromLeft {
    from { opacity: 0; transform: translateX(-40px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes slideOutToLeft {
    from { opacity: 1; transform: translateX(0); }
    to   { opacity: 0; transform: translateX(-40px); }
  }
  @keyframes slideOutToRight {
    from { opacity: 1; transform: translateX(0); }
    to   { opacity: 0; transform: translateX(40px); }
  }
  @keyframes optIn {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes ripple {
    from { transform: scale(0); opacity: 1; }
    to   { transform: scale(3); opacity: 0; }
  }

  .quiz-card.slide-in       { animation: slideInFromRight 0.28s cubic-bezier(0.22,1,0.36,1) both; }
  .quiz-card.slide-in-prev  { animation: slideInFromLeft  0.28s cubic-bezier(0.22,1,0.36,1) both; }
  .quiz-card.slide-out-left  { animation: slideOutToLeft  0.22s ease both; }
  .quiz-card.slide-out-right { animation: slideOutToRight 0.22s ease both; }

  .quiz-option:hover {
    transform: translateX(6px) !important;
    border-color: rgba(6,182,212,0.25) !important;
    background: rgba(30,41,59,0.9) !important;
  }
  .quiz-nav-btn:hover:not(:disabled) {
    background: rgba(51,65,85,0.9) !important;
    color: #e2e8f0 !important;
    border-color: rgba(148,163,184,0.2) !important;
  }
  .quiz-nav-btn-next:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 0 32px rgba(6,182,212,0.4) !important;
  }
  .quiz-submit-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 0 40px rgba(16,185,129,0.4) !important;
  }
  .quiz-review-btn:hover {
    background: rgba(30,41,59,0.9) !important;
    color: #e2e8f0 !important;
    border-color: rgba(148,163,184,0.2) !important;
  }

  @media (max-width: 480px) {
    .quiz-card { padding: 20px 16px !important; }
  }
`;