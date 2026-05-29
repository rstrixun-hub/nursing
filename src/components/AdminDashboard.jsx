import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, addDoc, deleteDoc, query, orderBy, getCountFromServer, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import AnalyticsDashboard from './AnalyticsDashboard';

const Icons = {
  Questions: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <path d="M9 12h6M9 16h4" />
    </svg>
  ),
  Videos: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <rect x="2" y="4" width="20" height="16" rx="3" />
      <path d="M10 9l5 3-5 3V9z" fill="currentColor" stroke="none" />
    </svg>
  ),
  Chart: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  ChevronLeft: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  ),
  ChevronRight: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M9 18l6-6-6-6" />
    </svg>
  ),
  Save: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  ),
  Plus: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  Trash: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
    </svg>
  ),
  Edit: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  Check: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Error: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  Globe: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
    </svg>
  ),
  Link: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
    </svg>
  ),
  Loader: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 animate-spin">
      <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity="0.25" fill="currentColor" stroke="none" />
      <path d="M12 3a9 9 0 019 9" strokeLinecap="round" />
    </svg>
  ),
  Film: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
      <line x1="7" y1="2" x2="7" y2="22" /><line x1="17" y1="2" x2="17" y2="22" />
      <line x1="2" y1="12" x2="22" y2="12" /><line x1="2" y1="7" x2="7" y2="7" />
      <line x1="2" y1="17" x2="7" y2="17" /><line x1="17" y1="17" x2="22" y2="17" />
      <line x1="17" y1="7" x2="22" y2="7" />
    </svg>
  ),
  Users: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
  AlertTriangle: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
};

const OPTION_LETTERS = 'ABCDEFGHIJ'.split('');

const Field = ({ label, icon, dir = 'rtl', children }) => (
  <div className="flex flex-col gap-1.5">
    <label className={`flex items-center gap-1.5 text-xs font-semibold text-slate-400 tracking-wide uppercase ${dir === 'ltr' ? 'flex-row-reverse' : ''}`}>
      {icon && <span className="text-cyan-400 opacity-70">{icon}</span>}
      {label}
    </label>
    {children}
  </div>
);

const inputCls = (dir = 'rtl') =>
  `w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/60 text-white text-sm placeholder-slate-600
   focus:outline-none focus:border-cyan-500/70 focus:ring-2 focus:ring-cyan-500/20 focus:bg-slate-900
   transition-all duration-200 font-medium ${dir === 'ltr' ? 'text-left' : 'text-right'}`;

const textareaCls = (dir = 'rtl') =>
  `w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/60 text-white text-sm placeholder-slate-600
   focus:outline-none focus:border-cyan-500/70 focus:ring-2 focus:ring-cyan-500/20 focus:bg-slate-900
   transition-all duration-200 resize-none font-medium leading-relaxed ${dir === 'ltr' ? 'text-left' : 'text-right'}`;

const ConfirmDialog = ({ message, onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}>
    <div className="glass-card rounded-2xl p-6 max-w-sm w-full border border-red-500/20">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/25 flex items-center justify-center text-red-400">
          <Icons.AlertTriangle />
        </div>
        <div>
          <h3 className="text-white font-bold text-sm">تأكيد الحذف</h3>
          <p className="text-slate-500 text-xs">هذا الإجراء لا يمكن التراجع عنه</p>
        </div>
      </div>
      <p className="text-slate-300 text-sm mb-5 leading-relaxed">{message}</p>
      <div className="flex gap-3">
        <button onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-400 font-semibold text-sm hover:border-slate-500 hover:text-white transition-all">
          إلغاء
        </button>
        <button onClick={onConfirm}
          className="flex-1 py-2.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 font-semibold text-sm hover:bg-red-500/30 transition-all">
          حذف
        </button>
      </div>
    </div>
  </div>
);

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('questions');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [confirmDialog, setConfirmDialog] = useState(null);

  const [questions, setQuestions] = useState([]);
  const [qIndex, setQIndex] = useState(0);
  const [qFormData, setQFormData] = useState({
    qAr: '', qEn: '',
    options: [
      { ar: '', en: '' },
      { ar: '', en: '' },
    ],
    correctAnswer: 0,
  });

  const loadQuestions = async () => {
    try {
      const q = query(collection(db, 'questions'), orderBy('createdAt', 'asc'));
      const snap = await getDocs(q);
      const docs = [];
      snap.forEach((d) => docs.push({ id: d.id, ...d.data() }));
      setQuestions(docs);
      setQIndex(docs.length);
    } catch (err) {
      console.error('Error loading questions:', err);
    }
  };

  useEffect(() => { loadQuestions(); }, []);

  useEffect(() => {
    if (questions[qIndex]) {
      const q = questions[qIndex];
      let opts = [];
      if (Array.isArray(q.options)) {
        opts = q.options;
      } else {
        opts = Object.values(q.options).map(o => ({ ar: o.ar || '', en: o.en || '' }));
      }
      const correctIdx = typeof q.correctAnswer === 'number'
        ? q.correctAnswer
        : OPTION_LETTERS.indexOf(q.correctAnswer);
      setQFormData({
        qAr: q.question.ar,
        qEn: q.question.en,
        options: opts,
        correctAnswer: correctIdx >= 0 ? correctIdx : 0,
      });
    } else {
      setQFormData({
        qAr: '', qEn: '',
        options: [{ ar: '', en: '' }, { ar: '', en: '' }],
        correctAnswer: 0,
      });
    }
  }, [qIndex, questions]);

  const handleQChange = (e) => setQFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleOptionChange = (idx, field, value) => {
    const opts = qFormData.options.map((o, i) => i === idx ? { ...o, [field]: value } : o);
    setQFormData(prev => ({ ...prev, options: opts }));
  };

  const addOption = () => {
    if (qFormData.options.length >= 10) return;
    setQFormData(prev => ({ ...prev, options: [...prev.options, { ar: '', en: '' }] }));
  };

  const removeOption = (idx) => {
    if (qFormData.options.length <= 2) return;
    const opts = qFormData.options.filter((_, i) => i !== idx);
    const correct = qFormData.correctAnswer >= opts.length ? opts.length - 1 : qFormData.correctAnswer;
    setQFormData(prev => ({ ...prev, options: opts, correctAnswer: correct }));
  };

  const handleQSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });
    const questionData = {
      question: { ar: qFormData.qAr, en: qFormData.qEn },
      options: qFormData.options,
      correctAnswer: qFormData.correctAnswer,
      createdAt: questions[qIndex]?.createdAt ?? new Date().toISOString(),
    };
    try {
      if (questions[qIndex]) {
        await setDoc(doc(db, 'questions', questions[qIndex].id), questionData);
        setMessage({ text: 'تم تحديث السؤال بنجاح', type: 'success' });
      } else {
        await addDoc(collection(db, 'questions'), questionData);
        setMessage({ text: 'تم إضافة السؤال الجديد بنجاح', type: 'success' });
      }
      await loadQuestions();
      await setDoc(doc(db, 'config', 'version'), {
        questionsVersion: new Date().toISOString(),
      }, { merge: true });
    } catch {
      setMessage({ text: 'حدث خطأ أثناء الحفظ، حاول مرة أخرى', type: 'error' });
    }
    setLoading(false);
  };

  const handleDeleteQuestion = () => {
    if (!questions[qIndex]) return;
    setConfirmDialog({
      message: `هل تريد حذف السؤال رقم ${qIndex + 1}؟`,
      onConfirm: async () => {
        setConfirmDialog(null);
        setLoading(true);
        try {
          await deleteDoc(doc(db, 'questions', questions[qIndex].id));
          setMessage({ text: 'تم حذف السؤال بنجاح', type: 'success' });
          await loadQuestions();
          setQIndex(prev => Math.max(0, prev - 1));
        } catch {
          setMessage({ text: 'حدث خطأ أثناء الحذف', type: 'error' });
        }
        setLoading(false);
      },
      onCancel: () => setConfirmDialog(null),
    });
  };
  const [videos, setVideos] = useState([]);
  const [videoStep, setVideoStep] = useState(null);
  const [videoFormData, setVideoFormData] = useState({ titleAr: '', titleEn: '', descAr: '', descEn: '', url: '', pdfUrl: '', pptxUrl: '', notes: '' });
  const [uploadProgress, setUploadProgress] = useState({ pdf: 0, pptx: 0 });
  const [stepCounts, setStepCounts] = useState({});

  const loadVideos = async () => {
    try {
      const snap = await getDocs(collection(db, 'videos'));
      const docs = [];
      snap.forEach(d => docs.push({ id: d.id, ...d.data() }));
      docs.sort((a, b) => (a.step || 0) - (b.step || 0));
      setVideos(docs);
      if (docs.length > 0 && videoStep === null) setVideoStep(docs[0].step);
    } catch (err) {
      console.error('Error loading videos:', err);
    }
  };

  const loadStepCounts = async (steps) => {
    const counts = {};
    try {
      for (const step of steps) {
        const q = query(collection(db, 'userProgress'), where('completedStep', '>=', step));
        const snap = await getCountFromServer(q);
        counts[step] = snap.data().count;
      }
    } catch {
    }
    setStepCounts(counts);
  };

  useEffect(() => {
    if (activeTab === 'videos') {
      loadVideos();
    }
  }, [activeTab]);

  useEffect(() => {
    if (videos.length > 0) {
      loadStepCounts(videos.map(v => v.step));
    }
  }, [videos]);

  useEffect(() => {
    if (videoStep === null) return;
    const found = videos.find(v => v.step === videoStep);
    if (found) {
      setVideoFormData({
        titleAr: found.title?.ar || '',
        titleEn: found.title?.en || '',
        descAr: found.description?.ar || '',
        descEn: found.description?.en || '',
        url: found.url || '',
        pdfUrl: found.pdfUrl || '',
        pptxUrl: found.pptxUrl || '',
        notes: found.notes || '',
      });
    } else {
      setVideoFormData({ titleAr: '', titleEn: '', descAr: '', descEn: '', url: '', pdfUrl: '', pptxUrl: '', notes: '' });
    }
  }, [videoStep, videos]);

  const handleVideoChange = (e) => setVideoFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    const { supabase } = await import('../supabase/config');
    const ext = file.name.split('.').pop();
    const path = `step_${videoStep}/${type}_${Date.now()}.${ext}`;
    setUploadProgress(prev => ({ ...prev, [type]: 1 }));
    const { error } = await supabase.storage
      .from('materials')
      .upload(path, file, { upsert: true });
    if (error) {
      console.error(error);
      setMessage({ text: 'فشل رفع الملف', type: 'error' });
      setUploadProgress(prev => ({ ...prev, [type]: 0 }));
      return;
    }
    const { data: urlData } = supabase.storage
      .from('materials')
      .getPublicUrl(path);
    const key = type === 'pdf' ? 'pdfUrl' : 'pptxUrl';
    setVideoFormData(prev => ({ ...prev, [key]: urlData.publicUrl }));
    setUploadProgress(prev => ({ ...prev, [type]: 0 }));
    setMessage({ text: 'تم رفع الملف بنجاح ✓', type: 'success' });
  };
  const addNewVideo = () => {
    const nextStep = videos.length > 0 ? Math.max(...videos.map(v => v.step)) + 1 : 1;
    setVideoStep(nextStep);
    setVideoFormData({ titleAr: '', titleEn: '', descAr: '', descEn: '', url: '' });
  };

  const handleVideoSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });
    try {
      const docId = `video_${videoStep}`;
      await setDoc(doc(db, 'videos', docId), {
        step: videoStep,
        title: { ar: videoFormData.titleAr, en: videoFormData.titleEn },
        description: { ar: videoFormData.descAr, en: videoFormData.descEn },
        url: videoFormData.url,
        pdfUrl: videoFormData.pdfUrl || '',
        pptxUrl: videoFormData.pptxUrl || '',
        notes: videoFormData.notes || '',
        updatedAt: new Date().toISOString(),
      });
      setMessage({ text: `تم حفظ الصفحة التعليمية رقم ${videoStep} بنجاح`, type: 'success' });
      await loadVideos();
      await setDoc(doc(db, 'config', 'version'), {
        videosVersion: new Date().toISOString(),
      }, { merge: true });
    } catch {
      setMessage({ text: 'حدث خطأ أثناء حفظ البيانات', type: 'error' });
    }
    setLoading(false);
  };

  const handleDeleteVideo = () => {
    const found = videos.find(v => v.step === videoStep);
    if (!found) return;
    setConfirmDialog({
      message: `هل تريد حذف الصفحة التعليمية رقم ${videoStep}؟`,
      onConfirm: async () => {
        setConfirmDialog(null);
        setLoading(true);
        try {
          await deleteDoc(doc(db, 'videos', found.id));
          setMessage({ text: 'تم حذف الصفحة التعليمية بنجاح', type: 'success' });
          await loadVideos();
          setVideoStep(null);
        } catch {
          setMessage({ text: 'حدث خطأ أثناء الحذف', type: 'error' });
        }
        setLoading(false);
      },
      onCancel: () => setConfirmDialog(null),
    });
  };

  const isNewQuestion = qIndex === questions.length;
  const isNewVideo = videoStep !== null && !videos.find(v => v.step === videoStep);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap');

        .admin-root * { font-family: 'IBM Plex Sans Arabic', sans-serif; }
        .admin-root { direction: rtl; }

        .glass-card {
          background: rgba(15, 23, 42, 0.85);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(148, 163, 184, 0.08);
        }
        .glow-cyan  { box-shadow: 0 0 30px -8px rgba(6, 182, 212, 0.35); }
        .glow-emerald { box-shadow: 0 0 30px -8px rgba(16, 185, 129, 0.35); }
        .glow-red   { box-shadow: 0 0 20px -8px rgba(239, 68, 68, 0.4); }

        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseRing {
          0%, 100% { box-shadow: 0 0 0 0 rgba(6,182,212,0.4); }
          50%       { box-shadow: 0 0 0 8px rgba(6,182,212,0); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .tab-content { animation: fadeSlideIn 0.25s ease-out; }
        .animate-spin { animation: spin 1s linear infinite; }

        .progress-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: rgba(148,163,184,0.2);
          transition: all 0.3s ease;
          cursor: pointer;
        }
        .progress-dot.active {
          background: #06b6d4;
          box-shadow: 0 0 8px rgba(6,182,212,0.6);
          animation: pulseRing 2s infinite;
        }
        .progress-dot.done { background: #10b981; }

        .shimmer-btn {
          background: linear-gradient(90deg, #0e7490 0%, #06b6d4 40%, #0891b2 60%, #0e7490 100%);
          background-size: 200% auto;
          animation: shimmer 2.5s linear infinite;
        }

        .badge-new  {
          background: linear-gradient(135deg,#06b6d4,#3b82f6);
          font-size:10px; padding:2px 8px; border-radius:20px;
          color:white; font-weight:700; letter-spacing:.05em; text-transform:uppercase;
        }
        .badge-edit {
          background: linear-gradient(135deg,#f59e0b,#ef4444);
          font-size:10px; padding:2px 8px; border-radius:20px;
          color:white; font-weight:700; letter-spacing:.05em; text-transform:uppercase;
        }

        .mesh-bg {
          background:
            radial-gradient(ellipse at top right,   rgba(6,182,212,.06) 0%, transparent 60%),
            radial-gradient(ellipse at bottom left,  rgba(59,130,246,.06) 0%, transparent 60%),
            #0a0f1e;
        }

        .correct-select option { background: #0f172a; }

        ::-webkit-scrollbar { width:5px; }
        ::-webkit-scrollbar-track { background:rgba(15,23,42,.5); }
        ::-webkit-scrollbar-thumb { background:rgba(6,182,212,.3); border-radius:10px; }

        .step-pill {
          position:relative; overflow:hidden;
        }
        .step-pill::after {
          content:''; position:absolute; bottom:0; left:50%;
          transform:translateX(-50%); width:0; height:2px;
          background:#06b6d4; transition:width .25s ease; border-radius:1px;
        }
        .step-pill.active::after { width:70%; }

        .stat-card {
          background: rgba(6,182,212,0.05);
          border: 1px solid rgba(6,182,212,0.12);
          border-radius: 12px;
          padding: 10px 14px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        @media (max-width: 640px) {
          .admin-grid-2 { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {confirmDialog && (
        <ConfirmDialog
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={confirmDialog.onCancel}
        />
      )}

      <div className="admin-root mesh-bg min-h-screen p-3 sm:p-5 lg:p-8">
        <div className="max-w-4xl mx-auto">

          {/* ── HEADER ── */}
          <div className="mb-6 sm:mb-8 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1.5 h-6 rounded-full bg-gradient-to-b from-cyan-400 to-blue-500"></div>
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">لوحة التحكم</h1>
              </div>
              <p className="text-slate-500 text-xs sm:text-sm pr-3.5">إدارة المحتوى التعليمي — الأسئلة والفيديوهات</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-slate-500 text-xs" style={{ fontFamily: 'JetBrains Mono,monospace' }}>
                {questions.length} سؤال · {videos.length} فيديو
              </span>
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-cyan-500/40"></div>
                ))}
              </div>
            </div>
          </div>

          {/* ── TAB SWITCHER ── */}
          <div className="glass-card rounded-2xl p-1.5 mb-5 flex gap-1.5 flex-wrap">
            {[
              { id: 'questions', label: 'إدارة الأسئلة', short: 'الأسئلة', sub: `${questions.length} سؤال`, Icon: Icons.Questions },
              { id: 'videos', label: 'الفيديوهات التعليمية', short: 'الفيديوهات', sub: `${videos.length} مرحلة`, Icon: Icons.Videos },
              { id: 'analytics', label: 'التحليل والبيانات', short: 'البيانات', sub: `إحصائيات ذكية`, Icon: Icons.Chart },
            ].map(({ id, label, short, sub, Icon }) => (
              <button
                key={id}
                onClick={() => { setActiveTab(id); setMessage({ text: '', type: '' }); }}
                className={`flex-1 min-w-[100px] flex items-center justify-center gap-2.5 px-4 py-3 sm:py-3.5 rounded-xl font-semibold text-sm transition-all duration-300 ${activeTab === id
                  ? 'bg-gradient-to-l from-cyan-600/30 to-blue-600/20 text-cyan-300 border border-cyan-500/25 shadow-lg glow-cyan'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
                  }`}
              >
                <Icon />
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{short}</span>
                <span className={`hidden sm:inline text-xs px-2 py-0.5 rounded-full font-medium ${activeTab === id ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-700/60 text-slate-500'
                  }`}>{sub}</span>
              </button>
            ))}
          </div>

          {/* ── MESSAGE BANNER ── */}
          {message.text && (
            <div
              className={`mb-5 flex items-center gap-3 p-4 rounded-xl border font-medium text-sm ${message.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-red-500/10 border-red-500/20 text-red-400'
                }`}
              style={{ animation: 'fadeSlideIn .25s ease-out' }}
            >
              <span className="flex-shrink-0">
                {message.type === 'success' ? <Icons.Check /> : <Icons.Error />}
              </span>
              {message.text}
            </div>
          )}

          {/* ══════════════════════════════════
              TAB: QUESTIONS
          ══════════════════════════════════ */}
          {activeTab === 'questions' && (
            <div className="tab-content">
              {/* Navigation Bar */}
              <div className="glass-card rounded-2xl p-3 sm:p-4 mb-5 flex items-center gap-3">
                <button
                  type="button"
                  disabled={qIndex === 0}
                  onClick={() => { setQIndex(qIndex - 1); setMessage({ text: '', type: '' }); }}
                  className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-slate-800 border border-slate-700/60 text-slate-300 text-sm font-medium
                    hover:border-cyan-500/40 hover:text-white disabled:opacity-25 disabled:cursor-not-allowed transition-all"
                >
                  <Icons.ChevronRight />
                  <span className="hidden sm:inline">السابق</span>
                </button>

                <div className="flex-1 flex flex-col items-center gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap justify-center">
                    {questions.slice(Math.max(0, qIndex - 4), Math.min(questions.length, qIndex + 5)).map((_, i) => {
                      const ri = Math.max(0, qIndex - 4) + i;
                      return (
                        <div
                          key={ri}
                          onClick={() => { setQIndex(ri); setMessage({ text: '', type: '' }); }}
                          className={`progress-dot hover:scale-125 transition-transform ${ri === qIndex ? 'active' : ri < qIndex ? 'done' : ''}`}
                          title={`سؤال ${ri + 1}`}
                        />
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-2">
                    {isNewQuestion ? <span className="badge-new">سؤال جديد</span> : <span className="badge-edit">تعديل</span>}
                    <span className="text-white font-bold text-sm sm:text-base">
                      {isNewQuestion ? `إضافة سؤال ${questions.length + 1}` : `السؤال ${qIndex + 1} من ${questions.length}`}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={qIndex === questions.length}
                  onClick={() => { setQIndex(qIndex + 1); setMessage({ text: '', type: '' }); }}
                  className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-slate-800 border border-slate-700/60 text-slate-300 text-sm font-medium
                    hover:border-cyan-500/40 hover:text-white disabled:opacity-25 disabled:cursor-not-allowed transition-all"
                >
                  <span className="hidden sm:inline">التالي</span>
                  <Icons.ChevronLeft />
                </button>
              </div>

              {/* Question Form */}
              <form onSubmit={handleQSubmit}>
                <div className="glass-card rounded-2xl p-4 sm:p-6 space-y-5">
                  {/* Question Text */}
                  <div className="pb-4 border-b border-slate-800">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                        <Icons.Edit />
                      </div>
                      <span className="text-white font-semibold text-sm">نص السؤال</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 admin-grid-2">
                      <Field label="العربية" icon={<Icons.Globe />}>
                        <input required type="text" name="qAr" value={qFormData.qAr} onChange={handleQChange}
                          className={inputCls('rtl')} />
                      </Field>
                      <Field label="English" icon={<Icons.Globe />} dir="ltr">
                        <input required type="text" name="qEn" value={qFormData.qEn} onChange={handleQChange}
                          className={inputCls('ltr')} dir="ltr" />
                      </Field>
                    </div>
                  </div>

                  {/* Answer Options */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-violet-500/15 border border-violet-500/20 flex items-center justify-center text-violet-400 text-xs font-black">
                          {qFormData.options.length}
                        </div>
                        <span className="text-white font-semibold text-sm">الاختيارات</span>
                        <span className="text-slate-600 text-xs">({qFormData.options.length} اختيارات)</span>
                      </div>
                      <button
                        type="button"
                        onClick={addOption}
                        disabled={qFormData.options.length >= 10}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-semibold
                          hover:bg-violet-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >
                        <Icons.Plus />
                        إضافة اختيار
                      </button>
                    </div>

                    <div className="space-y-3">
                      {qFormData.options.map((opt, idx) => (
                        <div key={idx} className="group rounded-xl border border-slate-700/50 bg-slate-900/40 p-3 sm:p-4 hover:border-slate-600/60 transition-all">
                          <div className="flex items-center justify-between gap-3 mb-3">
                            <div className="flex items-center gap-2">
                              <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black transition-all ${qFormData.correctAnswer === idx
                                ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
                                : 'bg-slate-800 border border-slate-700 text-slate-400'
                                }`}>
                                {OPTION_LETTERS[idx]}
                              </span>
                              <span className={`text-xs font-semibold ${qFormData.correctAnswer === idx ? 'text-emerald-400' : 'text-slate-500'}`}>
                                {qFormData.correctAnswer === idx ? '✓ الإجابة الصحيحة' : `الاختيار ${OPTION_LETTERS[idx]}`}
                              </span>
                            </div>
                            {qFormData.options.length > 2 && (
                              <button
                                type="button"
                                onClick={() => removeOption(idx)}
                                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400
                                  hover:bg-red-500/20 transition-all"
                                title="حذف هذا الاختيار"
                              >
                                <Icons.Trash />
                              </button>
                            )}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 admin-grid-2">
                            <input required type="text" value={opt.ar}
                              onChange={e => handleOptionChange(idx, 'ar', e.target.value)}
                              className={inputCls('rtl')} />
                            <input required type="text" value={opt.en}
                              onChange={e => handleOptionChange(idx, 'en', e.target.value)}
                              className={inputCls('ltr')} dir="ltr" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Correct Answer + Submit + Delete */}
                  <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                    <div className="sm:w-56">
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">الإجابة الصحيحة</label>
                      <div className="relative">
                        <select
                          name="correctAnswer"
                          value={qFormData.correctAnswer}
                          onChange={e => setQFormData(prev => ({ ...prev, correctAnswer: Number(e.target.value) }))}
                          className="correct-select w-full appearance-none px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold text-center
                            focus:outline-none focus:border-emerald-500/60 cursor-pointer transition-all"
                        >
                          {qFormData.options.map((_, idx) => (
                            <option key={idx} value={idx}>الاختيار {OPTION_LETTERS[idx]}</option>
                          ))}
                        </select>
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500 pointer-events-none">
                          <Icons.Check />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 flex-1">
                      {!isNewQuestion && (
                        <button
                          type="button"
                          onClick={handleDeleteQuestion}
                          disabled={loading}
                          className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/25
                            text-red-400 font-semibold text-sm hover:bg-red-500/20 glow-red disabled:opacity-40 transition-all"
                        >
                          <Icons.Trash />
                          <span>حذف</span>
                        </button>
                      )}
                      <button
                        type="submit"
                        disabled={loading}
                        className={`flex-1 flex items-center justify-center gap-2.5 py-3 sm:py-3.5 rounded-xl text-white font-bold text-sm transition-all ${loading ? 'bg-slate-700 cursor-not-allowed'
                          : isNewQuestion ? 'shimmer-btn glow-cyan hover:scale-[1.01]'
                            : 'bg-gradient-to-l from-blue-600 to-cyan-600 glow-cyan hover:scale-[1.01]'
                          }`}
                      >
                        {loading
                          ? <><Icons.Loader /><span>جاري الحفظ...</span></>
                          : isNewQuestion
                            ? <><Icons.Plus /><span>حفظ ونشر السؤال الجديد</span></>
                            : <><Icons.Save /><span>تحديث السؤال</span></>
                        }
                      </button>
                    </div>
                  </div>

                </div>
              </form>
            </div>
          )}

          {/* ══════════════════════════════════
              TAB: VIDEOS
          ══════════════════════════════════ */}
          {activeTab === 'videos' && (
            <div className="tab-content">
              {/* Step Selector */}
              <div className="glass-card rounded-2xl p-3 mb-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-slate-500 text-xs font-medium">اختر الصفحة التعليمية</p>
                  <button
                    type="button"
                    onClick={addNewVideo}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold
                      hover:bg-cyan-500/20 transition-all"
                  >
                    <Icons.Plus />
                    إضافة مرحلة
                  </button>
                </div>

                {videos.length === 0 && videoStep === null ? (
                  <p className="text-slate-600 text-sm text-center py-4">لا توجد مراحل بعد — اضغط «إضافة مرحلة» للبدء</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {/* Existing steps */}
                    {videos.map((v) => (
                      <button
                        key={v.step}
                        type="button"
                        onClick={() => { setVideoStep(v.step); setMessage({ text: '', type: '' }); }}
                        className={`step-pill flex flex-col items-center gap-1 px-4 py-2.5 rounded-xl border font-bold text-sm transition-all ${videoStep === v.step
                          ? 'active bg-gradient-to-b from-cyan-600/25 to-blue-600/15 border-cyan-500/30 text-cyan-300 shadow glow-cyan'
                          : 'bg-slate-900/60 border-slate-700/50 text-slate-500 hover:text-slate-300 hover:border-slate-600/60'
                          }`}
                      >
                        <Icons.Film />
                        <span className="text-xs">{v.step}</span>
                        {/* Student count badge */}
                        {stepCounts[v.step] !== undefined && (
                          <span className="flex items-center gap-0.5 text-[10px] font-medium text-slate-500">
                            <Icons.Users />
                            {stepCounts[v.step]}
                          </span>
                        )}
                      </button>
                    ))}
                    {/* New unsaved step */}
                    {isNewVideo && (
                      <button
                        type="button"
                        className="step-pill active flex flex-col items-center gap-1 px-4 py-2.5 rounded-xl border font-bold text-sm
                          bg-gradient-to-b from-cyan-600/25 to-blue-600/15 border-cyan-500/30 text-cyan-300 shadow glow-cyan"
                      >
                        <Icons.Film />
                        <span className="text-xs">{videoStep}</span>
                        <span className="badge-new" style={{ fontSize: '8px', padding: '1px 5px' }}>جديد</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Student Progress Stats per step */}
              {videos.length > 0 && Object.keys(stepCounts).length > 0 && (
                <div className="glass-card rounded-2xl p-4 mb-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-cyan-500/15 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                      <Icons.Users />
                    </div>
                    <span className="text-white font-semibold text-sm">الطلاب المتجاوزون لكل مرحلة</span>
                  </div>
                  <div className="space-y-2">
                    {videos.map(v => {
                      const count = stepCounts[v.step] ?? 0;
                      const max = Math.max(...Object.values(stepCounts), 1);
                      const pct = Math.round((count / max) * 100);
                      return (
                        <div key={v.step} className="flex items-center gap-3">
                          <span className="text-slate-400 text-xs w-16 text-left shrink-0">مرحلة {v.step}</span>
                          <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-l from-cyan-500 to-blue-500 transition-all duration-700"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-cyan-400 text-xs font-bold w-12 text-right shrink-0">{count} طالب</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Video Form */}
              {videoStep !== null && (
                <form onSubmit={handleVideoSubmit}>
                  <div className="glass-card rounded-2xl p-4 sm:p-6 space-y-5">
                    <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                        <Icons.Videos />
                      </div>
                      <div>
                        <h3 className="text-white font-bold text-base">
                          {isNewVideo ? 'إضافة صفحة تعليمية جديدة' : 'تعديل الصفحة التعليمية'}
                        </h3>
                        <p className="text-slate-500 text-xs">المرحلة رقم {videoStep}</p>
                      </div>
                    </div>

                    {/* Title */}
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">عنوان الشرح</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 admin-grid-2">
                        <Field label="العنوان بالعربية" icon={<Icons.Globe />}>
                          <input required type="text" name="titleAr" value={videoFormData.titleAr} onChange={handleVideoChange}
                            className={inputCls('rtl')} />
                        </Field>
                        <Field label="Title in English" icon={<Icons.Globe />} dir="ltr">
                          <input required type="text" name="titleEn" value={videoFormData.titleEn} onChange={handleVideoChange}
                            className={inputCls('ltr')} dir="ltr" />
                        </Field>
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">الوصف والتوجيهات</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 admin-grid-2">
                        <Field label="الوصف بالعربية" icon={<Icons.Globe />}>
                          <textarea rows="4" name="descAr" value={videoFormData.descAr} onChange={handleVideoChange}
                            className={textareaCls('rtl')} />
                        </Field>
                        <Field label="Description in English" icon={<Icons.Globe />} dir="ltr">
                          <textarea rows="4" name="descEn" value={videoFormData.descEn} onChange={handleVideoChange}
                            className={textareaCls('ltr')} dir="ltr" />
                        </Field>
                      </div>
                    </div>

                    {/* URL */}
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">رابط الفيديو</p>
                      <div className="relative">
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                          <Icons.Link />
                        </span>
                        <input
                          required type="url" name="url" value={videoFormData.url} onChange={handleVideoChange}
                          dir="ltr"
                          className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/60 text-white text-sm placeholder-slate-600
                            focus:outline-none focus:border-cyan-500/70 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                          style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '13px' }}
                        />
                      </div>
                    </div>

                    {/* Materials */}
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">المواد التعليمية (اختياري)</p>
                      <div className="mb-4">
                        <Field label="نص الشرح" icon={<Icons.Edit />}>
                          <textarea rows="4" name="notes" value={videoFormData.notes || ''} onChange={handleVideoChange}
                            placeholder="اكتب ملاحظات أو شرح نصي هنا..." className={textareaCls('rtl')} />
                        </Field>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 admin-grid-2">
                        {/* PDF */}
                        <Field label="رفع PDF" icon={<Icons.Film />}>
                          <input type="file" accept=".pdf" onChange={(e) => handleFileUpload(e, 'pdf')} className="hidden" id="pdf-upload" />
                          <label htmlFor="pdf-upload" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700/60 cursor-pointer hover:border-cyan-500/50 transition-all">
                            {uploadProgress.pdf > 0 ? (
                              <div className="flex items-center gap-2 w-full">
                                <Icons.Loader />
                                <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                  <div className="h-full bg-cyan-500 rounded-full transition-all" style={{ width: `${uploadProgress.pdf}%` }} />
                                </div>
                                <span className="text-cyan-400 text-xs">{uploadProgress.pdf}%</span>
                              </div>
                            ) : videoFormData.pdfUrl ? (
                              <span className="text-emerald-400 text-xs font-semibold flex items-center gap-2"><Icons.Check />تم الرفع — انقر للتغيير</span>
                            ) : (
                              <span className="text-slate-500 text-xs">اختر ملف PDF</span>
                            )}
                          </label>
                        </Field>
                        {/* PPTX */}
                        <Field label="رفع بوربوينت" icon={<Icons.Videos />}>
                          <input type="file" accept=".ppt,.pptx" onChange={(e) => handleFileUpload(e, 'pptx')} className="hidden" id="pptx-upload" />
                          <label htmlFor="pptx-upload" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700/60 cursor-pointer hover:border-violet-500/50 transition-all">
                            {uploadProgress.pptx > 0 ? (
                              <div className="flex items-center gap-2 w-full">
                                <Icons.Loader />
                                <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                  <div className="h-full bg-violet-500 rounded-full transition-all" style={{ width: `${uploadProgress.pptx}%` }} />
                                </div>
                                <span className="text-violet-400 text-xs">{uploadProgress.pptx}%</span>
                              </div>
                            ) : videoFormData.pptxUrl ? (
                              <span className="text-emerald-400 text-xs font-semibold flex items-center gap-2"><Icons.Check />تم الرفع — انقر للتغيير</span>
                            ) : (
                              <span className="text-slate-500 text-xs">اختر ملف PPTX</span>
                            )}
                          </label>
                        </Field>
                      </div>
                    </div>

                    {/* Submit + Delete */}
                    <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row gap-3">
                      {!isNewVideo && (
                        <button
                          type="button"
                          onClick={handleDeleteVideo}
                          disabled={loading}
                          className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/25
                            text-red-400 font-semibold text-sm hover:bg-red-500/20 glow-red disabled:opacity-40 transition-all"
                        >
                          <Icons.Trash />
                          <span>حذف المرحلة</span>
                        </button>
                      )}
                      <button
                        type="submit"
                        disabled={loading}
                        className={`flex-1 flex items-center justify-center gap-2.5 py-3.5 rounded-xl text-white font-bold text-sm transition-all ${loading ? 'bg-slate-700 cursor-not-allowed'
                          : isNewVideo ? 'shimmer-btn glow-cyan hover:scale-[1.01]'
                            : 'bg-gradient-to-l from-emerald-600 to-teal-500 glow-emerald hover:scale-[1.01]'
                          }`}
                      >
                        {loading
                          ? <><Icons.Loader /><span>جاري الحفظ...</span></>
                          : isNewVideo
                            ? <><Icons.Plus /><span>نشر المرحلة الجديدة {videoStep}</span></>
                            : <><Icons.Save /><span>حفظ وتحديث المرحلة {videoStep}</span></>
                        }
                      </button>
                    </div>

                  </div>
                </form>
              )}
            </div>
          )}

          {/* ══════════════════════════════════
              TAB: ANALYTICS
          ══════════════════════════════════ */}
          {activeTab === 'analytics' && (
            <div className="tab-content">
              <AnalyticsDashboard />
            </div>
          )}

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-slate-700 text-xs">لوحة التحكم الإدارية — محمية بصلاحيات المشرف</p>
          </div>

        </div>
      </div>
    </>
  );
}