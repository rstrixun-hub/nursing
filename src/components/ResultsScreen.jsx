import React, { useEffect, useState } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useQuizStore } from '../store/useQuizStore';

const T = {
    ar: {
        title: 'نتائجك النهائية',
        sub: 'مقارنة أدائك قبل وبعد الشرح',
        preScore: 'نتيجتك قبل الشرح',
        postScore: 'نتيجتك بعد الشرح',
        improvement: 'نسبة تطورك',
        question: 'سؤال',
        yourAnswerPre: 'إجابتك قبل',
        yourAnswerPost: 'إجابتك بعد',
        correct: 'الإجابة الصحيحة',
        correctLabel: '✓ صحيح',
        wrongLabel: '✗ خطأ',
        loading: 'جاري تحميل نتائجك...',
        noData: 'لا توجد بيانات كافية',
        improved: 'تحسّنت! 🎉',
        same: 'نفس المستوى',
        declined: 'تراجع طفيف',
        of: 'من',
        doneTitle: 'أحسنت! اكتملت رحلتك',
        doneSub: 'لقد أتممت جميع مراحل التقييم بنجاح',
    },
    en: {
        title: 'Your Final Results',
        sub: 'Performance comparison before & after the lesson',
        preScore: 'Pre-lesson Score',
        postScore: 'Post-lesson Score',
        improvement: 'Your Improvement',
        question: 'Question',
        yourAnswerPre: 'Your answer before',
        yourAnswerPost: 'Your answer after',
        correct: 'Correct answer',
        correctLabel: '✓ Correct',
        wrongLabel: '✗ Wrong',
        loading: 'Loading your results...',
        noData: 'Not enough data',
        improved: 'Improved! 🎉',
        same: 'Same level',
        declined: 'Slight decline',
        of: 'of',
        doneTitle: 'Well Done! Journey Complete',
        doneSub: "You've successfully completed all assessment stages",
    },
};

const OPTION_CHARS = ['A', 'B', 'C', 'D', 'E'];

const TrophyIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 48, height: 48 }}>
        <path d="M6 9H4.5a2.5 2.5 0 010-5H6" /><path d="M18 9h1.5a2.5 2.5 0 000-5H18" />
        <path d="M4 22h16" />
        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
        <path d="M18 2H6v7a6 6 0 0012 0V2z" />
    </svg>
);

const CheckIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

const XIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

function CircularScore({ percent, size = 100, color, label, sublabel }) {
    const r = (size - 10) / 2;
    const circ = 2 * Math.PI * r;
    const offset = circ - (percent / 100) * circ;
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{ position: 'relative', width: size, height: size }}>
                <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--circle-track)" strokeWidth="8" />
                    <circle
                        cx={size / 2} cy={size / 2} r={r} fill="none"
                        stroke={color} strokeWidth="8"
                        strokeDasharray={circ}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(0.34,1.56,0.64,1)' }}
                    />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 18, fontWeight: 900, color }}>{percent}%</span>
                </div>
            </div>
            {label && <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textAlign: 'center' }}>{label}</p>}
            {sublabel && <p style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center' }}>{sublabel}</p>}
        </div>
    );
}

export default function ResultsScreen() {
    const { lang, studentId } = useQuizStore();
    const t = T[lang] || T.ar;
    const isRTL = lang === 'ar';

    const [loading, setLoading] = useState(true);
    const [questions, setQuestions] = useState([]);
    const [answersPre, setAnswersPre] = useState({});
    const [answersPost, setAnswersPost] = useState({});

    useEffect(() => {
        const fetchData = async () => {
            try {
                const qSnap = await getDocs(collection(db, 'questions'));
                const qs = [];
                qSnap.forEach(d => qs.push({ id: d.id, ...d.data() }));

                if (studentId) {
                    const sessionDoc = await getDoc(doc(db, 'sessions', studentId));
                    if (sessionDoc.exists()) {
                        const data = sessionDoc.data();
                        const pre = data.answers_pre || {};
                        const post = data.answers_post || {};

                        const answeredIds = new Set([
                            ...Object.keys(pre),
                            ...Object.keys(post)
                        ]);
                        const filteredQs = qs.filter(q => answeredIds.has(q.id));

                        setQuestions(filteredQs);
                        setAnswersPre(pre);
                        setAnswersPost(post);
                    }
                }
            } catch (err) {
                console.error('Error fetching results:', err);
            }
            setLoading(false);
        };
        fetchData();
    }, [studentId]);

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 16 }}>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                <div style={{
                    width: 44, height: 44, borderRadius: '50%',
                    border: '3px solid rgba(6,182,212,0.15)',
                    borderTop: '3px solid #06b6d4',
                    animation: 'spin 0.8s linear infinite',
                }} />
                <p style={{ color: '#67e8f9', fontSize: 14 }}>{t.loading}</p>
            </div>
        );
    }

    const answerToIdx = (ans) => ({ 'A': '0', 'B': '1', 'C': '2', 'D': '3', 'E': '4' })[ans] ?? ans;
    const preCorrect = questions.filter(q => q.correctAnswer !== undefined && answerToIdx(String(answersPre[q.id] ?? '')) === String(q.correctAnswer)).length;
    const postCorrect = questions.filter(q => q.correctAnswer !== undefined && answerToIdx(String(answersPost[q.id] ?? '')) === String(q.correctAnswer)).length;
    const total = questions.length;
    const prePercent = total > 0 ? Math.round((preCorrect / total) * 100) : 0;
    const postPercent = total > 0 ? Math.round((postCorrect / total) * 100) : 0;
    const diff = postPercent - prePercent;

    const improvementLabel = diff > 0 ? t.improved : diff === 0 ? t.same : t.declined;
    const improvementColor = diff > 0 ? '#10b981' : diff === 0 ? '#94a3b8' : '#f87171';

    return (
        <div dir={isRTL ? 'rtl' : 'ltr'} className="results-root" style={styles.root}>
            <style>{cssString}</style>

            {/* ── HEADER ── */}
            <div className="results-header" style={styles.header}>
                <div className="results-trophy" style={styles.trophyWrap}>
                    <TrophyIcon />
                </div>
                <div>
                    <h2 className="results-title" style={styles.title}>{t.doneTitle}</h2>
                    <p className="results-sub" style={styles.sub}>{t.doneSub}</p>
                </div>
            </div>

            {/* ── SCORE SUMMARY ── */}
            <div className="results-score-card" style={styles.scoreCard}>
                <div style={styles.scoreRow}>
                    <CircularScore
                        percent={prePercent}
                        size={110}
                        color="#64748b"
                        label={t.preScore}
                        sublabel={`${preCorrect} ${t.of} ${total}`}
                    />

                    <div style={styles.arrowWrap}>
                        <div style={{ fontSize: 28, fontWeight: 900, color: improvementColor }}>
                            {diff > 0 ? '▲' : diff < 0 ? '▼' : '●'}
                        </div>
                        <div style={{ fontSize: 22, fontWeight: 900, color: improvementColor }}>
                            {diff > 0 ? '+' : ''}{diff}%
                        </div>
                        <div style={{ fontSize: 11, color: improvementColor, fontWeight: 700 }}>{improvementLabel}</div>
                    </div>

                    <CircularScore
                        percent={postPercent}
                        size={110}
                        color="#06b6d4"
                        label={t.postScore}
                        sublabel={`${postCorrect} ${t.of} ${total}`}
                    />
                </div>

                {/* progress bars */}
                <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 6 }}>
                            <span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>{t.preScore}</span>
                            <span style={{ color: 'var(--text-muted)' }}>{prePercent}%</span>
                        </div>
                        <div className="results-bar-track" style={styles.barTrack}>
                            <div className="results-bar" style={{ ...styles.barFill, width: `${prePercent}%`, background: 'var(--bar-pre)' }} />
                        </div>
                    </div>
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 6 }}>
                            <span style={{ color: '#06b6d4', fontWeight: 700 }}>{t.postScore}</span>
                            <span style={{ color: '#06b6d4' }}>{postPercent}%</span>
                        </div>
                        <div className="results-bar-track" style={styles.barTrack}>
                            <div className="results-bar" style={{ ...styles.barFill, width: `${postPercent}%`, background: 'linear-gradient(90deg,#06b6d4,#3b82f6)', boxShadow: '0 0 8px rgba(6,182,212,0.5)' }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* ── QUESTIONS BREAKDOWN ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {questions.map((q, idx) => {
                    const qText = q.question?.[lang] || q.question?.ar || q.question?.en || '—';
                    const correctKey = String(q.correctAnswer);

                    const answerToIndex = (ans) => {
                        const map = { 'A': '0', 'B': '1', 'C': '2', 'D': '3', 'E': '4' };
                        return map[ans] ?? ans;
                    };

                    const preAns = String(answersPre[q.id] ?? '');
                    const postAns = String(answersPost[q.id] ?? '');
                    const preIsCorrect = answerToIndex(preAns) === correctKey;
                    const postIsCorrect = answerToIndex(postAns) === correctKey;

                    const getLabel = (key) => OPTION_CHARS[parseInt(key)] || key;
                    const getOptionText = (key) => {
                        const opt = Array.isArray(q.options)
                            ? q.options[parseInt(key)]
                            : q.options?.[key];
                        return opt?.[lang] || opt?.ar || opt?.en || '—';
                    };

                    const status = !preAns && !postAns ? 'none'
                        : !preIsCorrect && postIsCorrect ? 'improved'
                            : preIsCorrect && !postIsCorrect ? 'declined'
                                : preIsCorrect && postIsCorrect ? 'both'
                                    : 'neither';

                    const statusColors = {
                        improved: { bg: 'rgba(16,185,129,0.06)', border: 'rgba(16,185,129,0.2)', badge: '#10b981', badgeBg: 'rgba(16,185,129,0.12)' },
                        declined: { bg: 'rgba(248,113,113,0.06)', border: 'rgba(248,113,113,0.2)', badge: '#f87171', badgeBg: 'rgba(248,113,113,0.12)' },
                        both: { bg: 'rgba(6,182,212,0.04)', border: 'rgba(6,182,212,0.15)', badge: '#06b6d4', badgeBg: 'rgba(6,182,212,0.1)' },
                        neither: { bg: 'var(--qcard-neither-bg)', border: 'var(--qcard-neither-border)', badge: '#94a3b8', badgeBg: 'rgba(148,163,184,0.08)' },
                        none: { bg: 'var(--qcard-neither-bg)', border: 'var(--qcard-neither-border)', badge: '#475569', badgeBg: 'rgba(100,116,139,0.1)' },
                    };
                    const sc = statusColors[status];

                    return (
                        <div key={q.id} className="result-card" style={{ ...styles.qCard, background: sc.bg, border: `1px solid ${sc.border}` }}>
                            {/* question header */}
                            <div style={styles.qHeader}>
                                <span style={styles.qNum}>{t.question} {idx + 1}</span>
                                <span style={{ ...styles.statusBadge, color: sc.badge, background: sc.badgeBg, border: `1px solid ${sc.border}` }}>
                                    {status === 'improved' ? '↑ تحسّن' : status === 'declined' ? '↓ تراجع' : status === 'both' ? '✓ صح دايمًا' : status === 'neither' ? '✗ خطأ دايمًا' : '—'}
                                </span>
                            </div>

                            <p className="result-qtext" style={styles.qText}>{qText}</p>

                            {/* answers grid */}
                            <div style={styles.answersGrid}>
                                {/* PRE */}
                                <div style={styles.answerBox}>
                                    <p className="result-ans-label" style={styles.answerLabel}>{t.yourAnswerPre}</p>
                                    <div style={{ ...styles.answerPill, background: preIsCorrect ? 'rgba(16,185,129,0.12)' : 'rgba(248,113,113,0.1)', border: `1px solid ${preIsCorrect ? 'rgba(16,185,129,0.3)' : 'rgba(248,113,113,0.3)'}` }}>
                                        <span style={{ ...styles.answerIcon, background: preIsCorrect ? 'rgba(16,185,129,0.2)' : 'rgba(248,113,113,0.2)', color: preIsCorrect ? '#10b981' : '#f87171' }}>
                                            {preIsCorrect ? <CheckIcon /> : <XIcon />}
                                        </span>
                                        <div>
                                            <span style={{ fontSize: 13, fontWeight: 800, color: preIsCorrect ? '#10b981' : '#f87171' }}>
                                                {preAns ? getLabel(answerToIndex(preAns)) : '—'}

                                            </span>
                                            {preAns && (
                                                <p className="result-opt-text" style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{getOptionText(answerToIndex(preAns))}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* arrow */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 18, paddingTop: 20 }}>
                                    {isRTL ? '←' : '→'}
                                </div>

                                {/* POST */}
                                <div style={styles.answerBox}>
                                    <p style={{ ...styles.answerLabel, color: '#06b6d4' }}>{t.yourAnswerPost}</p>
                                    <div style={{ ...styles.answerPill, background: postIsCorrect ? 'rgba(16,185,129,0.12)' : 'rgba(248,113,113,0.1)', border: `1px solid ${postIsCorrect ? 'rgba(16,185,129,0.3)' : 'rgba(248,113,113,0.3)'}` }}>
                                        <span style={{ ...styles.answerIcon, background: postIsCorrect ? 'rgba(16,185,129,0.2)' : 'rgba(248,113,113,0.2)', color: postIsCorrect ? '#10b981' : '#f87171' }}>
                                            {postIsCorrect ? <CheckIcon /> : <XIcon />}
                                        </span>
                                        <div>
                                            <span style={{ fontSize: 13, fontWeight: 800, color: postIsCorrect ? '#10b981' : '#f87171' }}>
                                                {postAns ? getLabel(answerToIndex(postAns)) : '—'}
                                            </span>
                                            {postAns && (
                                                <p className="result-opt-text" style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{getOptionText(answerToIndex(postAns))}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* correct answer strip */}
                            {(!preIsCorrect || !postIsCorrect) && (
                                <div className="result-correct-strip" style={styles.correctStrip}>
                                    <span style={styles.correctDot} />
                                    <span className="result-correct-label" style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.correct}:</span>
                                    <span style={{ fontSize: 12, fontWeight: 800, color: '#10b981' }}>
                                        {getLabel(correctKey)} — {getOptionText(correctKey)}
                                    </span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* completion badges + restart btn */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, marginTop: 8 }}>
                <button
                    onClick={() => useQuizStore.setState({ currentStep: 0 })}
                    className="results-back-btn"
                >
                    {lang === 'ar' ? '← العودة للرئيسية' : 'Back to Home →'}
                </button>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
                    {[1, 2, 3].map(n => (
                        <div key={n} style={styles.doneBadge}>
                            <CheckIcon />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

const styles = {
    root: {
        width: '100%',
        maxWidth: 680,
        margin: '0 auto',
        padding: '8px 4px 32px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        fontFamily: "'Cairo', 'Plus Jakarta Sans', sans-serif",
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(5,150,105,0.05))',
        border: '1px solid rgba(16,185,129,0.2)',
        borderRadius: 20,
        padding: '20px 24px',
        boxShadow: '0 0 40px rgba(16,185,129,0.08)',
    },
    trophyWrap: {
        width: 72, height: 72, borderRadius: '50%',
        background: 'rgba(16,185,129,0.12)',
        border: '1px solid rgba(16,185,129,0.25)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#34d399', flexShrink: 0,
        boxShadow: '0 0 24px rgba(16,185,129,0.2)',
    },
    title: { fontSize: 20, fontWeight: 900, margin: 0, marginBottom: 4 },
    sub: { fontSize: 13, margin: 0 },
    scoreCard: {
        border: '1px solid rgba(148,163,184,0.08)',
        borderRadius: 20,
        padding: '24px 20px',
        backdropFilter: 'blur(20px)',
    },
    scoreRow: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
    },
    arrowWrap: {
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
    },
    barTrack: {
        height: 10,
        borderRadius: 999, overflow: 'hidden',
    },
    barFill: {
        height: '100%', borderRadius: 999,
        transition: 'width 1.2s cubic-bezier(0.34,1.56,0.64,1)',
    },
    qCard: {
        borderRadius: 18,
        padding: '18px 20px',
        backdropFilter: 'blur(16px)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
    },
    qHeader: {
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 10,
    },
    qNum: {
        fontSize: 11, fontWeight: 700, color: '#06b6d4',
        background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)',
        borderRadius: 6, padding: '3px 8px',
    },
    statusBadge: {
        fontSize: 11, fontWeight: 700,
        borderRadius: 8, padding: '3px 10px',
    },
    qText: {
        fontSize: 14, fontWeight: 600,
        lineHeight: 1.7, margin: '0 0 14px 0',
    },
    answersGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        gap: 8, alignItems: 'start',
    },
    answerBox: { display: 'flex', flexDirection: 'column', gap: 6 },
    answerLabel: {
        fontSize: 10, fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.05em',
    },
    answerPill: {
        display: 'flex', alignItems: 'flex-start', gap: 8,
        borderRadius: 10, padding: '8px 10px',
        minHeight: 40,
    },
    answerIcon: {
        width: 22, height: 22, borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, marginTop: 2,
    },
    correctStrip: {
        display: 'flex', alignItems: 'center', gap: 6,
        marginTop: 12, padding: '8px 12px',
        background: 'rgba(16,185,129,0.05)',
        border: '1px solid rgba(16,185,129,0.12)',
        borderRadius: 10,
    },
    correctDot: {
        width: 6, height: 6, borderRadius: '50%',
        background: '#10b981', flexShrink: 0,
    },
    doneBadge: {
        width: 36, height: 36, borderRadius: '50%',
        background: 'rgba(16,185,129,0.15)',
        border: '1px solid rgba(16,185,129,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#10b981',
    },
};

const cssString = `
  @keyframes spin { to { transform: rotate(360deg); } }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .result-card {
    animation: fadeUp 0.4s ease both;
  }

  .results-bar {
    transition: width 1.2s cubic-bezier(0.34,1.56,0.64,1);
  }

  /* ── Dark theme (default) ── */
  :root[data-theme="dark"] .results-root,
  .results-root {
    --circle-track: rgba(255,255,255,0.06);
    --bar-pre: #475569;
    --bar-track: rgba(148,163,184,0.08);
    --qcard-neither-bg: rgba(30,41,59,0.6);
    --qcard-neither-border: rgba(148,163,184,0.08);
  }

  :root[data-theme="dark"] .results-title,
  .results-title {
    color: #f1f5f9;
  }
  :root[data-theme="dark"] .results-sub,
  .results-sub {
    color: #64748b;
  }
  :root[data-theme="dark"] .results-score-card,
  .results-score-card {
    background: rgba(15,23,42,0.85);
    box-shadow: 0 8px 40px rgba(0,0,0,0.3);
  }
  :root[data-theme="dark"] .results-bar-track,
  .results-bar-track {
    background: rgba(148,163,184,0.08);
  }
  :root[data-theme="dark"] .result-qtext,
  .result-qtext {
    color: #e2e8f0;
  }
  :root[data-theme="dark"] .result-ans-label,
  .result-ans-label {
    color: #475569;
  }
  :root[data-theme="dark"] .result-opt-text,
  .result-opt-text {
    color: #94a3b8;
  }
  :root[data-theme="dark"] .result-correct-strip,
  .result-correct-strip {
    background: rgba(16,185,129,0.05);
    border-color: rgba(16,185,129,0.12);
  }
  :root[data-theme="dark"] .result-correct-label,
  .result-correct-label {
    color: #64748b;
  }
  :root[data-theme="dark"] .results-back-btn,
  .results-back-btn {
    padding: 12px 32px;
    border-radius: 14px;
    background: linear-gradient(135deg, #0891b2, #1d4ed8);
    border: 1px solid rgba(6,182,212,0.3);
    color: #fff;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
    box-shadow: 0 0 20px rgba(6,182,212,0.25);
  }

  /* ── Light theme overrides ── */
  :root[data-theme="light"] .results-root {
    --circle-track: rgba(0,0,0,0.08);
    --bar-pre: #94a3b8;
    --bar-track: rgba(148,163,184,0.2);
    --qcard-neither-bg: rgba(241,245,249,0.8);
    --qcard-neither-border: rgba(148,163,184,0.2);
  }

  :root[data-theme="light"] .results-title {
    color: var(--text-primary) !important;
  }
  :root[data-theme="light"] .results-sub {
    color: var(--text-muted) !important;
  }
  :root[data-theme="light"] .results-score-card {
    background: rgba(255,255,255,0.9) !important;
    border-color: rgba(148,163,184,0.2) !important;
    box-shadow: 0 8px 40px rgba(0,0,0,0.08) !important;
  }
  :root[data-theme="light"] .results-bar-track {
    background: rgba(148,163,184,0.2) !important;
  }
  :root[data-theme="light"] .result-card {
    box-shadow: 0 4px 20px rgba(0,0,0,0.06) !important;
  }
  :root[data-theme="light"] .result-qtext {
    color: var(--text-primary) !important;
  }
  :root[data-theme="light"] .result-ans-label {
    color: var(--text-muted) !important;
  }
  :root[data-theme="light"] .result-opt-text {
    color: var(--text-muted) !important;
  }
  :root[data-theme="light"] .result-correct-strip {
    background: rgba(16,185,129,0.07) !important;
    border-color: rgba(16,185,129,0.2) !important;
  }
  :root[data-theme="light"] .result-correct-label {
    color: var(--text-muted) !important;
  }
  :root[data-theme="light"] .results-back-btn {
    padding: 12px 32px;
    border-radius: 14px;
    background: linear-gradient(135deg, #0891b2, #1d4ed8);
    border: 1px solid rgba(6,182,212,0.4);
    color: #fff;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
    box-shadow: 0 0 20px rgba(6,182,212,0.2);
  }
  :root[data-theme="light"] .results-header {
    background: linear-gradient(135deg, rgba(16,185,129,0.08), rgba(5,150,105,0.04)) !important;
    border-color: rgba(16,185,129,0.25) !important;
  }
`;