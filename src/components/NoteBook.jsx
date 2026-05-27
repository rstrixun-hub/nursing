import React, { useState, useEffect, useRef, useCallback } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY;
console.log('GROQ KEY:', GROQ_KEY);
const translateText = async (text, fromLang, toLang) => {
    const res = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${fromLang}|${toLang}`
    );
    const data = await res.json();
    if (data.responseStatus === 200) return data.responseData.translatedText;
    throw new Error('Translation failed');
};

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
    const [tooltip, setTooltip] = useState({ visible: false, text: '', x: 0, y: 0, loading: false });
    const [spellErrors, setSpellErrors] = useState([]);
    const [checkingSpell, setCheckingSpell] = useState(false);
    const [activeTab, setActiveTab] = useState('write'); 
    const [aiResponse, setAiResponse] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const [aiType, setAiType] = useState('');
    const textareaRef = useRef(null);
    const saveTimer = useRef(null);
    const spellTimer = useRef(null);
    const tooltipTimer = useRef(null);

    useEffect(() => {
        if (!uid || !videoId) return;
        getDoc(doc(db, `notes/${uid}_${videoId}`)).then(snap => {
            if (snap.exists()) setNotes(snap.data().content || '');
        });
    }, [uid, videoId]);

    const handleChange = (e) => {
        const val = e.target.value;
        setNotes(val);
        setSpellErrors([]);
        clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => saveNotes(val), 1500);
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

    const applySuggestion = (error, suggestion) => {
        const before = notes.substring(0, error.offset);
        const after = notes.substring(error.offset + error.length);
        const newText = before + suggestion + after;
        setNotes(newText);
        setSpellErrors([]);
        clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => saveNotes(newText), 1000);
    };
    const askAI = async (type) => {
        if (!notes.trim()) return;
        setAiLoading(true);
        setAiResponse('');
        setAiType(type);

        const prompts = {
            explain: isAr
                ? `اشرح لي النقاط دي بطريقة سهلة لطالب جامعة، استخدم أمثلة بسيطة:\n\n${notes}`
                : `Explain these notes in a simple way for a university student, use simple examples:\n\n${notes}`,
            summarize: isAr
                ? `لخص النقاط دي في 5 سطور بس، بشكل منظم ومرتب:\n\n${notes}`
                : `Summarize these notes in 5 lines only, in an organized way:\n\n${notes}`,
            questions: isAr
                ? `اعمل 3 أسئلة مراجعة مهمة من النص ده مع إجاباتها، على شكل:\nس: ...\nج: ...\n\n${notes}`
                : `Create 3 important review questions from this text with answers, in format:\nQ: ...\nA: ...\n\n${notes}`,
            mindmap: isAr
                ? `حول النقاط دي لخريطة ذهنية نصية منظمة بالنقاط الرئيسية والفرعية:\n\n${notes}`
                : `Convert these notes to an organized text mind map with main and sub points:\n\n${notes}`,
        };

        try {
            const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${GROQ_KEY}`,
                },
                body: JSON.stringify({
                    model: 'llama-3.3-70b-versatile',
                    messages: [
                        {
                            role: 'system',
                            content: 'أنت مساعد تعليمي ذكي لطلاب الجامعة. يجب أن ترد دائماً باللغة العربية بغض النظر عن لغة السؤال. ردودك دايما واضحة ومنظمة ومفيدة ومرتبة بشكل جميل.',
                        },
                        { role: 'user', content: prompts[type] }
                    ],
                    max_tokens: 600,
                    temperature: 0.7,
                }),
            });
            const data = await res.json();
            if (data.choices?.[0]?.message?.content) {
                setAiResponse(data.choices[0].message.content);
            } else {
                setAiResponse('⚠️ حدث خطأ، حاول تاني');
            }
        } catch {
            setAiResponse('⚠️ تأكد من الاتصال بالإنترنت');
        } finally {
            setAiLoading(false);
        }
    };
    const handleSelectionChange = useCallback(async () => {
        const selected = window.getSelection()?.toString().trim()
            || document.getSelection()?.toString().trim();
        if (!selected || selected.length < 2) {
            if (tooltip.visible) setTooltip(t => ({ ...t, visible: false }));
            return;
        }
        const activeEl = document.activeElement;
        if (activeEl !== textareaRef.current) return;
        const ta = textareaRef.current;
        if (ta.selectionStart === ta.selectionEnd) return;

        const rect = ta.getBoundingClientRect();
        const charsPerLine = Math.floor(ta.clientWidth / 8);
        const lineNum = Math.floor(ta.selectionStart / charsPerLine);
        const tooltipX = Math.min(rect.left + 20, window.innerWidth - 260);
        const tooltipY = rect.top + lineNum * 22 - 50;

        setTooltip({ visible: true, text: '', x: tooltipX, y: Math.max(10, tooltipY), loading: true });
        clearTimeout(tooltipTimer.current);
        try {
            const result = await translateText(selected, isAr ? 'ar' : 'en', isAr ? 'en' : 'ar');
            setTooltip(t => ({ ...t, text: result, loading: false }));
            tooltipTimer.current = setTimeout(() => setTooltip(t => ({ ...t, visible: false })), 5000);
        } catch {
            setTooltip(t => ({ ...t, visible: false }));
        }
    }, [isAr, tooltip.visible]);

    useEffect(() => {
        const handleClick = (e) => {
            if (!textareaRef.current?.contains(e.target))
                setTooltip(t => ({ ...t, visible: false }));
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const tabs = [
        { id: 'write', label: isAr ? '✏️ كتابة' : '✏️ Write' },
        { id: 'ai', label: isAr ? '🤖 AI' : '🤖 AI' },
        { id: 'spell', label: isAr ? `🔤 إملاء${spellErrors.length ? ` (${spellErrors.length})` : ''}` : `🔤 Spell${spellErrors.length ? ` (${spellErrors.length})` : ''}` },
    ];

    const aiButtons = [
        { type: 'explain', emoji: '💡', label: isAr ? 'اشرح' : 'Explain' },
        { type: 'summarize', emoji: '📝', label: isAr ? 'لخص' : 'Summarize' },
        { type: 'questions', emoji: '❓', label: isAr ? 'أسئلة' : 'Questions' },
        { type: 'mindmap', emoji: '🗺️', label: isAr ? 'خريطة' : 'Mind Map' },
    ];

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
                {open ? (
                    <span style={{ fontSize: '24px', fontWeight: 700 }}>✕</span>
                ) : (
                    <svg viewBox="0 0 24 24" fill="none" style={{ width: '32px', height: '32px' }}>
                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" fill="white" />
                        <path d="M20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="rgba(255,255,255,.7)" />
                        <circle cx="19" cy="19" r="4" fill="url(#aiG)" />
                        <text x="19" y="22.5" textAnchor="middle" fontSize="5.5" fontWeight="bold" fill="white">AI</text>
                        <defs>
                            <linearGradient id="aiG" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor="#06b6d4" />
                                <stop offset="100%" stopColor="#6366f1" />
                            </linearGradient>
                        </defs>
                    </svg>
                )}
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
                                    <div style={{ color: 'rgba(148,163,184,.5)', fontSize: '10px', marginTop: '2px' }}>
                                        {isAr ? 'حدد كلمة لترجمتها • AI مدمج' : 'Select word to translate • AI powered'}
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {checkingSpell && (
                                    <span style={{ fontSize: '10px', color: '#06b6d4', background: 'rgba(6,182,212,.1)', padding: '2px 8px', borderRadius: '99px', border: '1px solid rgba(6,182,212,.2)', animation: 'nbPulse 1s ease infinite' }}>
                                        {isAr ? 'فحص...' : '✦ checking...'}
                                    </span>
                                )}
                                {saving && <span style={{ fontSize: '10px', color: '#94a3b8' }}>{isAr ? '⟳ حفظ...' : '⟳ saving...'}</span>}
                                {savedMsg && (
                                    <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 700, background: 'rgba(16,185,129,.1)', padding: '2px 8px', borderRadius: '99px' }}>
                                        ✓ {isAr ? 'محفوظ' : 'Saved'}
                                    </span>
                                )}
                                {!uid && <span style={{ fontSize: '10px', color: '#f97316' }}>⚠ {isAr ? 'سجّل للحفظ' : 'Login to save'}</span>}
                            </div>
                        </div>

                        {/* Tabs */}
                        <div style={{ display: 'flex', gap: '2px' }}>
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => {
                                        setActiveTab(tab.id);
                                        if (tab.id === 'spell' && notes && !spellErrors.length) runSpellCheck(notes);
                                    }}
                                    style={{
                                        flex: 1, padding: '8px 6px',
                                        borderRadius: '10px 10px 0 0',
                                        border: 'none', cursor: 'pointer',
                                        fontSize: '11px', fontWeight: 700,
                                        background: activeTab === tab.id ? 'rgba(6,182,212,.12)' : 'transparent',
                                        color: activeTab === tab.id ? '#06b6d4' : 'rgba(148,163,184,.55)',
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
                                onKeyUp={(e) => { if (e.shiftKey || e.ctrlKey) handleSelectionChange(); }}
                                onSelect={handleSelectionChange}
                                placeholder={isAr
                                    ? 'اكتب ملاحظاتك هنا...\n💡 حدد أي كلمة لترجمتها فوراً\n🤖 روح تاب AI للمساعدة الذكية'
                                    : 'Write your notes here...\n💡 Select any word to translate instantly\n🤖 Go to AI tab for smart assistance'}
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
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', padding: '0 2px' }}>
                                <span style={{ color: 'rgba(148,163,184,.4)', fontSize: '10px' }}>
                                    {notes.length} {isAr ? 'حرف' : 'chars'} · {notes.trim().split(/\s+/).filter(Boolean).length} {isAr ? 'كلمة' : 'words'}
                                </span>
                                {spellErrors.length > 0 && (
                                    <span style={{ color: '#f97316', fontSize: '10px', fontWeight: 600, cursor: 'pointer' }} onClick={() => setActiveTab('spell')}>
                                        ⚠ {spellErrors.length} {isAr ? 'خطأ إملائي — اضغط للتصحيح' : 'spelling error(s) — tap to fix'}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── Tab: AI ── */}
                    {activeTab === 'ai' && (
                        <div style={{ padding: '14px 18px' }}>
                            {/* أزرار AI */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7px', marginBottom: '12px' }}>
                                {aiButtons.map(btn => (
                                    <button
                                        key={btn.type}
                                        onClick={() => askAI(btn.type)}
                                        disabled={aiLoading || !notes.trim()}
                                        style={{
                                            padding: '10px 8px',
                                            background: aiType === btn.type && aiLoading
                                                ? 'rgba(6,182,212,.2)'
                                                : 'rgba(6,182,212,.08)',
                                            border: `1px solid ${aiType === btn.type && (aiLoading || aiResponse) ? 'rgba(6,182,212,.4)' : 'rgba(6,182,212,.15)'}`,
                                            borderRadius: '12px', cursor: aiLoading || !notes.trim() ? 'not-allowed' : 'pointer',
                                            color: aiLoading || !notes.trim() ? 'rgba(6,182,212,.35)' : '#06b6d4',
                                            fontSize: '12px', fontWeight: 700,
                                            transition: 'all .2s ease',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                                        }}
                                        onMouseEnter={e => { if (!aiLoading && notes.trim()) e.currentTarget.style.background = 'rgba(6,182,212,.16)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = aiType === btn.type && aiLoading ? 'rgba(6,182,212,.2)' : 'rgba(6,182,212,.08)'; }}
                                    >
                                        <span>{btn.emoji}</span>
                                        <span>{btn.label}</span>
                                    </button>
                                ))}
                            </div>

                            {/* منطقة الرد */}
                            <div style={{
                                minHeight: '100px', maxHeight: '180px', overflowY: 'auto',
                                background: 'rgba(20,30,50,.7)',
                                border: '1px solid rgba(148,163,184,.12)',
                                borderRadius: '14px', padding: '13px 15px',
                                color: '#e2e8f0', fontSize: '13px', lineHeight: '1.75',
                            }}>
                                {aiLoading ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#06b6d4' }}>
                                        <span style={{ fontSize: '20px', display: 'inline-block', animation: 'nbSpin 1s linear infinite' }}>⟳</span>
                                        <span style={{ animation: 'nbPulse 1s ease infinite', fontSize: '13px' }}>
                                            {isAr ? 'الـ AI بيفكر...' : 'AI is thinking...'}
                                        </span>
                                    </div>
                                ) : aiResponse ? (
                                    <div style={{ whiteSpace: 'pre-wrap', direction: isAr ? 'rtl' : 'ltr' }}>
                                        {aiResponse}
                                    </div>
                                ) : (
                                    <div style={{ color: 'rgba(148,163,184,.35)', fontSize: '12px', textAlign: 'center', paddingTop: '20px' }}>
                                        {!notes.trim()
                                            ? (isAr ? '✏️ اكتب ملاحظاتك الأول في تاب الكتابة' : '✏️ Write your notes first in the Write tab')
                                            : (isAr ? '👆 اختار اشرح أو لخص أو أسئلة أو خريطة' : '👆 Choose Explain, Summarize, Questions or Mind Map')}
                                    </div>
                                )}
                            </div>

                            {/* زر نسخ الرد */}
                            {aiResponse && !aiLoading && (
                                <div>
                                    <button
                                        onClick={() => { navigator.clipboard.writeText(aiResponse); }}
                                        style={{
                                            marginTop: '8px', width: '100%', padding: '7px',
                                            background: 'rgba(99,102,241,.08)',
                                            border: '1px solid rgba(99,102,241,.2)',
                                            borderRadius: '10px', cursor: 'pointer',
                                            color: 'rgba(99,102,241,.8)', fontSize: '11px', fontWeight: 600,
                                        }}
                                    >
                                        📋 {isAr ? 'نسخ الرد' : 'Copy response'}
                                    </button>
                                    <p style={{
                                        fontSize: '10px',
                                        color: 'rgba(248,113,113,.6)',
                                        marginTop: '6px',
                                        textAlign: 'center',
                                        margin: '6px 0 0 0',
                                    }}>
                                        ⚠️ للمراجعة فقط — تأكد من مصادرك الطبية الأصلية
                                    </p>
                                </div>
                            )}
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
                                        <button onClick={() => runSpellCheck(notes)} style={{ marginTop: '12px', padding: '7px 18px', background: 'rgba(6,182,212,.1)', border: '1px solid rgba(6,182,212,.2)', borderRadius: '10px', color: '#06b6d4', fontSize: '12px', cursor: 'pointer' }}>
                                            {isAr ? '🔄 إعادة الفحص' : '🔄 Re-check'}
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {spellErrors.map((err, i) => (
                                        <div key={i} style={{ background: 'rgba(239,68,68,.06)', border: '1px solid rgba(239,68,68,.2)', borderRadius: '12px', padding: '11px 14px' }}>
                                            <span style={{ color: '#ef4444', fontWeight: 700, fontSize: '13px', background: 'rgba(239,68,68,.12)', padding: '1px 6px', borderRadius: '6px' }}>
                                                "{notes.slice(err.offset, err.offset + err.length)}"
                                            </span>
                                            <p style={{ color: 'rgba(148,163,184,.7)', fontSize: '11px', marginTop: '5px', marginBottom: 0 }}>{err.message}</p>
                                            {err.replacements?.length > 0 && (
                                                <div style={{ marginTop: '9px', display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                                    <span style={{ color: 'rgba(148,163,184,.5)', fontSize: '10px', alignSelf: 'center' }}>{isAr ? 'تصحيح:' : 'Fix:'}</span>
                                                    {err.replacements.slice(0, 4).map((r, j) => (
                                                        <button key={j} onClick={() => applySuggestion(err, r.value)} style={{ padding: '3px 10px', background: 'rgba(16,185,129,.1)', border: '1px solid rgba(16,185,129,.25)', borderRadius: '8px', cursor: 'pointer', color: '#10b981', fontSize: '12px', fontWeight: 600 }}>
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
                    <div style={{ padding: '12px 18px 16px', borderTop: '1px solid rgba(148,163,184,.06)', display: 'flex', gap: '8px' }}>
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
                        >
                            {saving ? (isAr ? '⟳ جاري الحفظ' : '⟳ Saving') : (isAr ? '💾 حفظ الآن' : '💾 Save Now')}
                        </button>
                        {notes && (
                            <button
                                onClick={() => { if (window.confirm(isAr ? 'مسح كل الملاحظات؟' : 'Clear all notes?')) { setNotes(''); setSpellErrors([]); setAiResponse(''); saveNotes(''); } }}
                                style={{ padding: '11px 14px', background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', borderRadius: '13px', cursor: 'pointer', color: '#ef4444', fontSize: '13px' }}
                                title={isAr ? 'مسح الكل' : 'Clear all'}
                            >🗑</button>
                        )}
                    </div>
                </div>
            )}

            {/* ── Tooltip الترجمة ── */}
            {tooltip.visible && (
                <div style={{
                    position: 'fixed',
                    left: `${Math.min(tooltip.x, window.innerWidth - 260)}px`,
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '12px' }}>🔤</span>
                        <span style={{ color: 'rgba(148,163,184,.5)', fontSize: '10px', fontWeight: 600 }}>
                            {isAr ? 'ترجمة' : 'Translation'}
                        </span>
                    </div>
                    {tooltip.loading ? (
                        <div style={{ color: '#06b6d4', fontSize: '12px', animation: 'nbPulse 1s ease infinite' }}>...</div>
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
                    50%     { opacity:1; }
                }
                @keyframes nbSpin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </>
    );
}