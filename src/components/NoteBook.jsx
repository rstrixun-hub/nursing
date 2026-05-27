import React, { useState, useEffect, useRef, useCallback } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

// ── خدمة الترجمة (MyMemory — مجانية بدون API key) ──
const translateText = async (text, fromLang, toLang) => {
    const res = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${fromLang}|${toLang}`
    );
    const data = await res.json();
    if (data.responseStatus === 200) return data.responseData.translatedText;
    throw new Error('Translation failed');
};

// ── تصحيح إملائي (LanguageTool — مجاني) ──
const spellCheck = async (text) => {
    const res = await fetch('https://api.languagetool.org/v2/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `text=${encodeURIComponent(text)}&language=en-US`,
    });
    const data = await res.json();
    return data.matches || [];
};

export default function NoteBook({ uid, videoId, isAr }) {
    const [open, setOpen] = useState(false);
    const [notes, setNotes] = useState('');
    const [saving, setSaving] = useState(false);
    const [savedMsg, setSavedMsg] = useState(false);
    const [tooltip, setTooltip] = useState({ visible: false, text: '', x: 0, y: 0, loading: false, type: 'translate' });
    const [spellErrors, setSpellErrors] = useState([]); // [{offset, length, message, suggestions}]
    const [checkingSpell, setCheckingSpell] = useState(false);
    const [activeTab, setActiveTab] = useState('write'); // 'write' | 'spell'
    const textareaRef = useRef(null);
    const saveTimer = useRef(null);
    const spellTimer = useRef(null);
    const tooltipTimer = useRef(null);

    // ── تحميل الملاحظات من Firestore ──
    useEffect(() => {
        if (!uid || !videoId) return;
        getDoc(doc(db, `notes/${uid}_${videoId}`)).then(snap => {
            if (snap.exists()) setNotes(snap.data().content || '');
        });
    }, [uid, videoId]);

    // ── حفظ تلقائي ──
    const handleChange = (e) => {
        const val = e.target.value;
        setNotes(val);
        setSpellErrors([]);

        clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => saveNotes(val), 1500);

        // تصحيح إملائي تلقائي بعد 2 ثانية من التوقف (للإنجليزي بس)
        if (!isAr && val.trim().length > 3) {
            clearTimeout(spellTimer.current);
            spellTimer.current = setTimeout(() => runSpellCheck(val), 2000);
        }
    };

    const saveNotes = async (content) => {
        if (!uid) return;
        setSaving(true);
        try {
            await setDoc(doc(db, `notes/${uid}_${videoId}`), {
                content, uid, videoId, updatedAt: new Date()
            });
            setSavedMsg(true);
            setTimeout(() => setSavedMsg(false), 2500);
        } catch (e) {
            console.error('Save error:', e);
        } finally {
            setSaving(false);
        }
    };

    // ── تصحيح إملائي ──
    const runSpellCheck = useCallback(async (text) => {
        if (!text || text.trim().length < 3) return;
        setCheckingSpell(true);
        try {
            const errors = await spellCheck(text);
            setSpellErrors(errors);
        } catch (e) {
            console.error('Spell check error:', e);
        } finally {
            setCheckingSpell(false);
        }
    }, []);

    // ── تطبيق تصحيح ──
    const applySuggestion = (error, suggestion) => {
        const before = notes.substring(0, error.offset);
        const after = notes.substring(error.offset + error.length);
        const newText = before + suggestion + after;
        setNotes(newText);
        setSpellErrors([]);
        clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => saveNotes(newText), 1000);
    };

    // ── ترجمة عند التحديد ──
    const handleSelectionChange = useCallback(async () => {
        const selected = window.getSelection()?.toString().trim();
        if (!selected || selected.length < 2) {
            if (tooltip.visible) setTooltip(t => ({ ...t, visible: false }));
            return;
        }

        // تحقق إن التحديد داخل الـ textarea
        const activeEl = document.activeElement;
        if (activeEl !== textareaRef.current) return;

        const ta = textareaRef.current;
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        if (start === end) return;

        // حساب موضع الـ tooltip
        const rect = ta.getBoundingClientRect();
        const lineHeight = 22;
        const charsPerLine = Math.floor(ta.clientWidth / 8);
        const lineNum = Math.floor(start / charsPerLine);
        const tooltipX = Math.min(rect.left + 20, window.innerWidth - 240);
        const tooltipY = rect.top + lineNum * lineHeight - 50;

        setTooltip({ visible: true, text: '', x: tooltipX, y: Math.max(10, tooltipY), loading: true, type: 'translate' });

        clearTimeout(tooltipTimer.current);
        try {
            const fromLang = isAr ? 'ar' : 'en';
            const toLang = isAr ? 'en' : 'ar';
            const result = await translateText(selected, fromLang, toLang);
            setTooltip(t => ({ ...t, text: result, loading: false }));
            tooltipTimer.current = setTimeout(() => setTooltip(t => ({ ...t, visible: false })), 5000);
        } catch {
            setTooltip(t => ({ ...t, visible: false }));
        }
    }, [isAr, tooltip.visible]);

    // ── إغلاق tooltip عند الضغط خارجه ──
    useEffect(() => {
        const handleClick = (e) => {
            if (!textareaRef.current?.contains(e.target)) {
                setTooltip(t => ({ ...t, visible: false }));
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    // ── رسم النص مع تظليل الأخطاء ──
    const renderHighlighted = () => {
        if (!spellErrors.length || !notes) return null;
        const parts = [];
        let lastIndex = 0;
        const sorted = [...spellErrors].sort((a, b) => a.offset - b.offset);

        sorted.forEach((err, i) => {
            if (err.offset > lastIndex) {
                parts.push(<span key={`t${i}`}>{notes.slice(lastIndex, err.offset)}</span>);
            }
            parts.push(
                <mark key={`e${i}`} style={{
                    background: 'rgba(239,68,68,.25)',
                    borderBottom: '2px wavy #ef4444',
                    borderRadius: '2px',
                    cursor: 'pointer',
                    color: 'inherit',
                }} title={err.message}>
                    {notes.slice(err.offset, err.offset + err.length)}
                </mark>
            );
            lastIndex = err.offset + err.length;
        });
        if (lastIndex < notes.length) {
            parts.push(<span key="last">{notes.slice(lastIndex)}</span>);
        }
        return parts;
    };

    return (
        <>
            {/* ── زر فتح النوتبوك ── */}
            <button
                onClick={() => setOpen(o => !o)}
                style={{
                    position: 'fixed',
                    bottom: '24px',
                    [isAr ? 'left' : 'right']: '24px',
                    zIndex: 1000,
                    width: '54px', height: '54px',
                    borderRadius: '50%',
                    background: open
                        ? 'linear-gradient(135deg,#ef4444,#f97316)'
                        : 'linear-gradient(135deg,#06b6d4,#6366f1)',
                    boxShadow: open
                        ? '0 4px 24px rgba(239,68,68,.4)'
                        : '0 4px 24px rgba(6,182,212,.5)',
                    border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: '22px',
                    transition: 'all .3s cubic-bezier(.4,0,.2,1)',
                    transform: open ? 'rotate(45deg) scale(1.05)' : 'scale(1)',
                }}
                title={isAr ? 'ملاحظاتي' : 'My Notes'}
            >
                {open ? '✕' : '📝'}
            </button>

            {/* ── النوتبوك Panel ── */}
            {open && (
                <div style={{
                    position: 'fixed',
                    bottom: '92px',
                    [isAr ? 'left' : 'right']: '16px',
                    zIndex: 999,
                    width: 'min(400px, calc(100vw - 32px))',
                    background: 'rgba(10,18,35,.98)',
                    backdropFilter: 'blur(24px)',
                    border: '1px solid rgba(6,182,212,.18)',
                    borderRadius: '22px',
                    boxShadow: '0 24px 80px rgba(0,0,0,.7), 0 0 0 1px rgba(6,182,212,.05)',
                    overflow: 'hidden',
                    direction: isAr ? 'rtl' : 'ltr',
                    animation: 'nbSlideIn .28s cubic-bezier(.4,0,.2,1)',
                    fontFamily: 'IBM Plex Sans Arabic, sans-serif',
                }}>

                    {/* ── Header ── */}
                    <div style={{
                        padding: '14px 18px 0',
                        background: 'linear-gradient(135deg, rgba(6,182,212,.08), rgba(99,102,241,.06))',
                        borderBottom: '1px solid rgba(148,163,184,.08)',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                                <div style={{
                                    width: '32px', height: '32px', borderRadius: '10px',
                                    background: 'linear-gradient(135deg,rgba(6,182,212,.2),rgba(99,102,241,.15))',
                                    border: '1px solid rgba(6,182,212,.2)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px',
                                }}>📝</div>
                                <div>
                                    <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '14px', lineHeight: 1 }}>
                                        {isAr ? 'ملاحظاتي' : 'My Notes'}
                                    </div>
                                    <div style={{ color: 'rgba(148,163,184,.6)', fontSize: '10px', marginTop: '2px' }}>
                                        {isAr ? 'حدد كلمة لترجمتها' : 'Select a word to translate'}
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {checkingSpell && (
                                    <span style={{
                                        fontSize: '10px', color: '#06b6d4',
                                        background: 'rgba(6,182,212,.1)', padding: '2px 8px',
                                        borderRadius: '99px', border: '1px solid rgba(6,182,212,.2)',
                                        animation: 'nbPulse 1s ease infinite',
                                    }}>
                                        {isAr ? 'فحص...' : '✦ checking...'}
                                    </span>
                                )}
                                {saving && (
                                    <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                                        {isAr ? '⟳ حفظ...' : '⟳ saving...'}
                                    </span>
                                )}
                                {savedMsg && (
                                    <span style={{
                                        fontSize: '10px', color: '#10b981', fontWeight: 700,
                                        background: 'rgba(16,185,129,.1)', padding: '2px 8px',
                                        borderRadius: '99px',
                                    }}>
                                        ✓ {isAr ? 'محفوظ' : 'Saved'}
                                    </span>
                                )}
                                {!uid && (
                                    <span style={{ fontSize: '10px', color: '#f97316' }}>
                                        ⚠ {isAr ? 'سجّل للحفظ' : 'Login to save'}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Tabs */}
                        <div style={{ display: 'flex', gap: '4px' }}>
                            {[
                                { id: 'write', label: isAr ? '✏️ كتابة' : '✏️ Write' },
                                { id: 'spell', label: isAr ? `🔤 إملاء ${spellErrors.length ? `(${spellErrors.length})` : ''}` : `🔤 Spell ${spellErrors.length ? `(${spellErrors.length})` : ''}` },
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => {
                                        setActiveTab(tab.id);
                                        if (tab.id === 'spell' && notes && !spellErrors.length) runSpellCheck(notes);
                                    }}
                                    style={{
                                        padding: '7px 14px',
                                        borderRadius: '10px 10px 0 0',
                                        border: 'none', cursor: 'pointer',
                                        fontSize: '12px', fontWeight: 600,
                                        background: activeTab === tab.id
                                            ? 'rgba(6,182,212,.12)'
                                            : 'transparent',
                                        color: activeTab === tab.id ? '#06b6d4' : 'rgba(148,163,184,.6)',
                                        borderBottom: activeTab === tab.id ? '2px solid #06b6d4' : '2px solid transparent',
                                        transition: 'all .2s ease',
                                    }}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ── Tab: Write ── */}
                    {activeTab === 'write' && (
                        <div style={{ padding: '14px 18px' }}>
                            <textarea
                                ref={textareaRef}
                                value={notes}
                                onChange={handleChange}
                                onMouseUp={handleSelectionChange}
                                onTouchEnd={handleSelectionChange}
                                onKeyUp={(e) => {
                                    if (e.shiftKey || e.ctrlKey) handleSelectionChange();
                                }}
                                onSelect={handleSelectionChange}
                                placeholder={isAr
                                    ? 'اكتب ملاحظاتك هنا...\n💡 حدد أي كلمة لترجمتها فوراً'
                                    : 'Write your notes here...\n💡 Select any word to translate it instantly'}
                                style={{
                                    width: '100%', height: '185px',
                                    background: 'rgba(20,30,50,.7)',
                                    border: '1px solid rgba(148,163,184,.12)',
                                    borderRadius: '14px',
                                    color: '#e2e8f0', fontSize: '13px',
                                    padding: '13px 15px', resize: 'vertical',
                                    outline: 'none', lineHeight: '1.75',
                                    fontFamily: 'IBM Plex Sans Arabic, sans-serif',
                                    boxSizing: 'border-box',
                                    transition: 'border-color .2s ease',
                                }}
                                onFocus={e => e.target.style.borderColor = 'rgba(6,182,212,.35)'}
                                onBlur={e => e.target.style.borderColor = 'rgba(148,163,184,.12)'}
                            />
                            {/* شريط المعلومات */}
                            <div style={{
                                display: 'flex', justifyContent: 'space-between',
                                marginTop: '8px', padding: '0 2px',
                            }}>
                                <span style={{ color: 'rgba(148,163,184,.4)', fontSize: '10px' }}>
                                    {notes.length} {isAr ? 'حرف' : 'chars'} · {notes.trim().split(/\s+/).filter(Boolean).length} {isAr ? 'كلمة' : 'words'}
                                </span>
                                {spellErrors.length > 0 && (
                                    <span style={{ color: '#f97316', fontSize: '10px', fontWeight: 600 }}>
                                        ⚠ {spellErrors.length} {isAr ? 'خطأ إملائي' : 'spelling error(s)'}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── Tab: Spell Check ── */}
                    {activeTab === 'spell' && (
                        <div style={{ padding: '14px 18px', maxHeight: '260px', overflowY: 'auto' }}>
                            {checkingSpell ? (
                                <div style={{ textAlign: 'center', padding: '30px 0', color: '#06b6d4' }}>
                                    <div style={{ fontSize: '28px', animation: 'nbSpin 1s linear infinite', display: 'inline-block' }}>⟳</div>
                                    <p style={{ fontSize: '12px', marginTop: '8px', color: '#94a3b8' }}>
                                        {isAr ? 'جاري الفحص الإملائي...' : 'Checking spelling...'}
                                    </p>
                                </div>
                            ) : spellErrors.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                                    <div style={{ fontSize: '32px' }}>✅</div>
                                    <p style={{ color: '#10b981', fontSize: '13px', fontWeight: 600, marginTop: '8px' }}>
                                        {isAr ? 'لا توجد أخطاء إملائية!' : 'No spelling errors!'}
                                    </p>
                                    {!notes && (
                                        <p style={{ color: 'rgba(148,163,184,.5)', fontSize: '11px', marginTop: '4px' }}>
                                            {isAr ? 'اكتب شيئاً أولاً' : 'Write something first'}
                                        </p>
                                    )}
                                    {notes && (
                                        <button
                                            onClick={() => runSpellCheck(notes)}
                                            style={{
                                                marginTop: '12px', padding: '7px 18px',
                                                background: 'rgba(6,182,212,.1)',
                                                border: '1px solid rgba(6,182,212,.2)',
                                                borderRadius: '10px', color: '#06b6d4',
                                                fontSize: '12px', cursor: 'pointer',
                                            }}
                                        >
                                            {isAr ? '🔄 إعادة الفحص' : '🔄 Re-check'}
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {spellErrors.map((err, i) => (
                                        <div key={i} style={{
                                            background: 'rgba(239,68,68,.06)',
                                            border: '1px solid rgba(239,68,68,.2)',
                                            borderRadius: '12px', padding: '11px 14px',
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                                                <div style={{ flex: 1 }}>
                                                    <span style={{
                                                        color: '#ef4444', fontWeight: 700, fontSize: '13px',
                                                        background: 'rgba(239,68,68,.12)', padding: '1px 6px',
                                                        borderRadius: '6px',
                                                    }}>
                                                        "{notes.slice(err.offset, err.offset + err.length)}"
                                                    </span>
                                                    <p style={{ color: 'rgba(148,163,184,.7)', fontSize: '11px', marginTop: '5px', marginBottom: 0 }}>
                                                        {err.message}
                                                    </p>
                                                </div>
                                            </div>
                                            {err.replacements?.length > 0 && (
                                                <div style={{ marginTop: '9px', display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                                    <span style={{ color: 'rgba(148,163,184,.5)', fontSize: '10px', alignSelf: 'center' }}>
                                                        {isAr ? 'تصحيح:' : 'Fix:'}
                                                    </span>
                                                    {err.replacements.slice(0, 4).map((r, j) => (
                                                        <button
                                                            key={j}
                                                            onClick={() => applySuggestion(err, r.value)}
                                                            style={{
                                                                padding: '3px 10px',
                                                                background: 'rgba(16,185,129,.1)',
                                                                border: '1px solid rgba(16,185,129,.25)',
                                                                borderRadius: '8px', cursor: 'pointer',
                                                                color: '#10b981', fontSize: '12px', fontWeight: 600,
                                                                transition: 'all .15s ease',
                                                            }}
                                                            onMouseEnter={e => e.target.style.background = 'rgba(16,185,129,.2)'}
                                                            onMouseLeave={e => e.target.style.background = 'rgba(16,185,129,.1)'}
                                                        >
                                                            {r.value}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Footer ── */}
                    <div style={{
                        padding: '0 18px 16px',
                        borderTop: '1px solid rgba(148,163,184,.06)',
                        paddingTop: '12px',
                        display: 'flex', gap: '8px',
                    }}>
                        <button
                            onClick={() => saveNotes(notes)}
                            disabled={saving || !uid}
                            style={{
                                flex: 1, padding: '11px',
                                background: 'linear-gradient(135deg,#06b6d4,#6366f1)',
                                border: 'none', borderRadius: '13px',
                                color: '#fff', fontWeight: 700, fontSize: '13px',
                                cursor: saving || !uid ? 'not-allowed' : 'pointer',
                                opacity: saving || !uid ? .5 : 1,
                                transition: 'all .2s ease',
                                boxShadow: '0 4px 16px rgba(6,182,212,.25)',
                            }}
                            onMouseEnter={e => { if (!saving && uid) e.target.style.transform = 'translateY(-1px)'; }}
                            onMouseLeave={e => e.target.style.transform = 'none'}
                        >
                            {saving ? (isAr ? '⟳ جاري الحفظ' : '⟳ Saving') : (isAr ? '💾 حفظ الآن' : '💾 Save Now')}
                        </button>
                        {notes && (
                            <button
                                onClick={() => { if (window.confirm(isAr ? 'مسح كل الملاحظات؟' : 'Clear all notes?')) { setNotes(''); setSpellErrors([]); saveNotes(''); } }}
                                style={{
                                    padding: '11px 14px',
                                    background: 'rgba(239,68,68,.08)',
                                    border: '1px solid rgba(239,68,68,.2)',
                                    borderRadius: '13px', cursor: 'pointer',
                                    color: '#ef4444', fontSize: '13px',
                                    transition: 'all .2s ease',
                                }}
                                title={isAr ? 'مسح الكل' : 'Clear all'}
                            >
                                🗑
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* ── Tooltip الترجمة ── */}
            {tooltip.visible && (
                <div style={{
                    position: 'fixed',
                    left: `${Math.min(tooltip.x, window.innerWidth - 250)}px`,
                    top: `${tooltip.y}px`,
                    zIndex: 9999,
                    background: 'rgba(10,18,35,.98)',
                    border: '1px solid rgba(6,182,212,.3)',
                    borderRadius: '12px',
                    padding: '9px 16px',
                    boxShadow: '0 12px 40px rgba(0,0,0,.6)',
                    pointerEvents: 'none',
                    maxWidth: '250px',
                    animation: 'nbFadeIn .15s ease',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: tooltip.loading ? 0 : '4px' }}>
                        <span style={{ fontSize: '12px' }}>🔤</span>
                        <span style={{ color: 'rgba(148,163,184,.5)', fontSize: '10px', fontWeight: 600 }}>
                            {isAr ? 'ترجمة' : 'Translation'}
                        </span>
                    </div>
                    {tooltip.loading ? (
                        <div style={{ color: '#06b6d4', fontSize: '12px', animation: 'nbPulse 1s ease infinite' }}>
                            {isAr ? '...' : '...'}
                        </div>
                    ) : (
                        <div style={{ color: '#06b6d4', fontSize: '14px', fontWeight: 700, direction: isAr ? 'ltr' : 'rtl' }}>
                            {tooltip.text}
                        </div>
                    )}
                </div>
            )}

            <style>{`
        @keyframes nbSlideIn {
          from { opacity:0; transform: translateY(20px) scale(.96); }
          to   { opacity:1; transform: translateY(0) scale(1); }
        }
        @keyframes nbFadeIn {
          from { opacity:0; transform: translateY(4px); }
          to   { opacity:1; transform: translateY(0); }
        }
        @keyframes nbPulse {
          0%,100% { opacity:.6; }
          50%      { opacity:1; }
        }
        @keyframes nbSpin {
          to { transform: rotate(360deg); }
        }
      `}</style>
        </>
    );
}