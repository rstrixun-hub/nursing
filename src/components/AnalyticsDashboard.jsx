
import React, { useState, useEffect, useRef } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
const Icon = {
  Chart: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>,
  Users: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg>,
  TrendingUp: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>,
  TrendingDown: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6" /><polyline points="17 18 23 18 23 12" /></svg>,
  Filter: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>,
  Star: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>,
  AlertTriangle: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>,
  Download: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>,
  FileText: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>,
  Table: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="3" y1="15" x2="21" y2="15" /><line x1="9" y1="3" x2="9" y2="21" /><line x1="15" y1="3" x2="15" y2="21" /></svg>,
  Loader: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8 animate-spin"><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity="0.2" fill="currentColor" stroke="none" /><path d="M12 3a9 9 0 019 9" /></svg>,
  Check: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><polyline points="20 6 9 17 4 12" /></svg>,
  X: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>,
  Award: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><circle cx="12" cy="8" r="6" /><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" /></svg>,
};
function CircularProgress({ percent, size = 80, strokeWidth = 8, color = '#22d3ee', label, sublabel }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;
  return (
    <div className="flex flex-col items-center gap-1">
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={strokeWidth} />
          <circle
            cx={size / 2} cy={size / 2} r={radius} fill="none"
            stroke={color} strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)' }}
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: size < 80 ? 12 : 15, fontWeight: 700, color: color }}>{percent}%</span>
        </div>
      </div>
      {label && <p className="text-xs font-bold text-slate-300 text-center">{label}</p>}
      {sublabel && <p className="text-[10px] text-slate-500 text-center">{sublabel}</p>}
    </div>
  );
}
function AnimatedNumber({ value, suffix = '', prefix = '' }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = value / 30;
    const timer = setInterval(() => {
      start += step;
      if (start >= value) { setDisplay(value); clearInterval(timer); }
      else setDisplay(Math.round(start));
    }, 25);
    return () => clearInterval(timer);
  }, [value]);
  return <span>{prefix}{display}{suffix}</span>;
}
function ProgressBar({ percent, color = 'bg-cyan-400', height = 'h-2.5', glow = false }) {
  return (
    <div className={`w-full ${height} bg-slate-800/80 rounded-full overflow-hidden`}>
      <div
        className={`h-full ${color} rounded-full transition-all duration-1000`}
        style={{
          width: `${percent}%`,
          boxShadow: glow ? `0 0 8px currentColor` : 'none',
        }}
      />
    </div>
  );
}
function RankBadge({ rank }) {
  const colors = ['#FFD700', '#C0C0C0', '#CD7F32'];
  const color = colors[rank - 1] || '#64748b';
  return (
    <div style={{
      width: 28, height: 28, borderRadius: '50%',
      background: `${color}22`, border: `2px solid ${color}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 11, fontWeight: 700, color, flexShrink: 0
    }}>
      {rank}
    </div>
  );
} async function exportToPDF(stats, avgPrePercent, avgPostPercent, avgImprovement, categoryStats) {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const now = new Date().toLocaleDateString('ar-EG');
  const funnelRate = stats.funnel.started > 0 ? Math.round((stats.funnel.postDone / stats.funnel.started) * 100) : 0;

  // ── غلاف ──
  doc.setFillColor(10, 15, 40);
  doc.rect(0, 0, 210, 297, 'F');
  doc.setFillColor(6, 182, 212, 0.15);
  doc.rect(0, 0, 210, 60, 'F');
  doc.setTextColor(34, 211, 238);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Research Intelligence System', 105, 22, { align: 'center' });
  doc.setFontSize(13);
  doc.setTextColor(200, 220, 240);
  doc.text('Official Analytics Report', 105, 33, { align: 'center' });
  doc.setFontSize(10);
  doc.setTextColor(148, 163, 184);
  doc.text(`Date: ${now}`, 105, 43, { align: 'center' });
  doc.text(`Total Students: ${stats.totalStudents}`, 105, 51, { align: 'center' });

  // ── قسم 1: إجماليات الطلاب ──
  doc.setTextColor(34, 211, 238);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('1. Student Summary', 14, 72);

  autoTable(doc, {
    startY: 76,
    head: [['Metric', 'Value']],
    body: [
      ['Total Registered Students', `${stats.totalStudents}`],
      ['Completed Pre-Assessment', `${stats.funnel.preDone}`],
      ['Completed Post-Assessment', `${stats.funnel.postDone}`],
      ['Dropped Out (Did Not Complete)', `${stats.funnel.started - stats.funnel.postDone}`],
      ['Journey Completion Rate', `${funnelRate}%`],
      ['Overall Pre-Test Average', `${avgPrePercent}%`],
      ['Overall Post-Test Average', `${avgPostPercent}%`],
      ['Average Improvement After Lesson', `${avgImprovement > 0 ? '+' : ''}${avgImprovement}%`],
    ],
    theme: 'grid',
    headStyles: { fillColor: [15, 118, 163], textColor: 255, fontStyle: 'bold', fontSize: 10 },
    bodyStyles: { fontSize: 9, textColor: [30, 41, 59] },
    alternateRowStyles: { fillColor: [241, 245, 249] },
    columnStyles: { 0: { cellWidth: 120 }, 1: { cellWidth: 60, halign: 'center', fontStyle: 'bold' } },
  });

  // ── قسم 2: تحليل مستويات الصعوبة ──
  doc.addPage();
  doc.setFillColor(10, 15, 40);
  doc.rect(0, 0, 210, 297, 'F');
  doc.setTextColor(34, 211, 238);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('2. Performance by Difficulty Level', 14, 20);

  const catRows = ['A', 'B', 'C'].map(cat => {
    const s = categoryStats[cat];
    const label = cat === 'A' ? 'A — Easy' : cat === 'B' ? 'B — Medium' : 'C — Hard';
    if (!s) return [label, '0', '0%', '0%', '0%', '0%', '0%'];
    return [
      label,
      `${s.count}`,
      `${s.avgPre}%`,
      `${100 - s.avgPre}%`,
      `${s.avgPost}%`,
      `${100 - s.avgPost}%`,
      `${s.improvement > 0 ? '+' : ''}${s.improvement}%`,
    ];
  });

  autoTable(doc, {
    startY: 25,
    head: [['Level', 'Questions', 'Correct Pre', 'Wrong Pre', 'Correct Post', 'Wrong Post', 'Improvement']],
    body: catRows,
    theme: 'grid',
    headStyles: { fillColor: [15, 118, 163], textColor: 255, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: [30, 41, 59] },
    alternateRowStyles: { fillColor: [241, 245, 249] },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 6) {
        const val = parseFloat(data.cell.text[0]);
        if (val > 0) data.cell.styles.textColor = [16, 185, 129];
        else if (val < 0) data.cell.styles.textColor = [239, 68, 68];
      }
    }
  });

  // ── قسم 3: التصنيفات ──
  const qs = stats.questionsStats;
  const topPreCorrect = [...qs].sort((a, b) => b.preStats.percent - a.preStats.percent).slice(0, 5);
  const topPostCorrect = [...qs].sort((a, b) => b.postStats.percent - a.postStats.percent).slice(0, 5);
  const mostWrongPre = [...qs].sort((a, b) => a.preStats.percent - b.preStats.percent).slice(0, 5);
  const mostWrongPost = [...qs].sort((a, b) => a.postStats.percent - b.postStats.percent).slice(0, 5);
  const mostImproved = [...qs].sort((a, b) => b.improvement - a.improvement).slice(0, 5);

  const addRankTable = (title, rows, y) => {
    doc.setTextColor(34, 211, 238);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 14, y);
    autoTable(doc, {
      startY: y + 4,
      head: [['#', 'Question', 'Level', 'Value']],
      body: rows,
      theme: 'striped',
      headStyles: { fillColor: [15, 118, 163], textColor: 255, fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
      alternateRowStyles: { fillColor: [241, 245, 249] },
      columnStyles: { 0: { cellWidth: 8 }, 1: { cellWidth: 120 }, 2: { cellWidth: 22 }, 3: { cellWidth: 22, halign: 'center' } },
    });
    return doc.lastAutoTable.finalY + 8;
  };

  doc.addPage();
  doc.setFillColor(10, 15, 40);
  doc.rect(0, 0, 210, 297, 'F');
  doc.setTextColor(34, 211, 238);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('3. Question Rankings', 14, 16);

  let y = 22;
  y = addRankTable('Top 5 — Highest Correct (Pre-Test)', topPreCorrect.map((q, i) => [
    i + 1,
    `Question #${stats.questionsStats.indexOf(q) + 1}`,
    q.category === 'A' ? 'Easy' : q.category === 'B' ? 'Medium' : 'Hard',
    `${q.preStats.percent}%`
  ]), y);
  y = addRankTable('Top 5 — Highest Correct (Post-Test)', topPostCorrect.map((q, i) => [
    i + 1,
    `Question #${stats.questionsStats.indexOf(q) + 1}`,
    q.category === 'A' ? 'Easy' : q.category === 'B' ? 'Medium' : 'Hard',
    `${q.postStats.percent}%`
  ]), y);
  y = addRankTable('Top 5 — Most Wrong (Pre-Test)', mostWrongPre.map((q, i) => [
    i + 1,
    `Question #${stats.questionsStats.indexOf(q) + 1}`,
    q.category === 'A' ? 'Easy' : q.category === 'B' ? 'Medium' : 'Hard',
    `${100 - q.preStats.percent}%`
  ]), y);

  doc.addPage();
  doc.setFillColor(10, 15, 40);
  doc.rect(0, 0, 210, 297, 'F');
  y = 16;
  y = addRankTable('Top 5 — Most Wrong (Post-Test / Needs Review)', mostWrongPost.map((q, i) => [
    i + 1,
    `Question #${stats.questionsStats.indexOf(q) + 1}`,
    q.category === 'A' ? 'Easy' : q.category === 'B' ? 'Medium' : 'Hard',
    `${100 - q.postStats.percent}%`
  ]), y);
  y = addRankTable('Top 5 — Most Improved After Lesson', mostImproved.map((q, i) => [
    i + 1,
    `Question #${stats.questionsStats.indexOf(q) + 1}`,
    q.category === 'A' ? 'Easy' : q.category === 'B' ? 'Medium' : 'Hard',
    `+${q.improvement}%`
  ]), y);
  // ── قسم 4: جميع الأسئلة ──
  doc.addPage();
  doc.setFillColor(10, 15, 40);
  doc.rect(0, 0, 210, 297, 'F');
  doc.setTextColor(34, 211, 238);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('4. All Questions — Full Detail', 14, 16);

  autoTable(doc, {
    startY: 21,
    head: [['#', 'Question', 'Lvl', 'Pre%', 'Pre✓', 'Pre✗', 'Post%', 'Post✓', 'Post✗', 'Δ']],
    body: stats.questionsStats.map((q, i) => [
      i + 1,
      `Question #${i + 1}`,
      q.category === 'A' ? 'E' : q.category === 'B' ? 'M' : 'H',
      `${q.preStats.percent}%`,
      q.preStats.correct,
      q.preStats.total - q.preStats.correct,
      `${q.postStats.percent}%`,
      q.postStats.correct,
      q.postStats.total - q.postStats.correct,
      `${q.improvement > 0 ? '+' : ''}${q.improvement}%`,
    ]),
    theme: 'grid',
    headStyles: { fillColor: [15, 118, 163], textColor: 255, fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 7, textColor: [30, 41, 59] },
    alternateRowStyles: { fillColor: [241, 245, 249] },
    columnStyles: {
      0: { cellWidth: 7 }, 1: { cellWidth: 68 }, 2: { cellWidth: 8 },
      3: { cellWidth: 14, halign: 'center' }, 4: { cellWidth: 12, halign: 'center' },
      5: { cellWidth: 12, halign: 'center' }, 6: { cellWidth: 14, halign: 'center' },
      7: { cellWidth: 12, halign: 'center' }, 8: { cellWidth: 12, halign: 'center' },
      9: { cellWidth: 14, halign: 'center' },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 9) {
        const val = parseFloat(data.cell.text[0]);
        if (val > 0) data.cell.styles.textColor = [16, 185, 129];
        else if (val < 0) data.cell.styles.textColor = [239, 68, 68];
      }
    }
  });

  doc.save(`تقرير_نظام_الذكاء_البحثي_${Date.now()}.pdf`);
}

async function exportToExcel(stats, avgPrePercent, avgPostPercent, avgImprovement, categoryStats) {
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();
  const now = new Date().toLocaleDateString('ar-EG');
  const funnelRate = stats.funnel.started > 0 ? Math.round((stats.funnel.postDone / stats.funnel.started) * 100) : 0;

  // ── ورقة 1: الملخص التنفيذي ──
  const summaryData = [
    ['التقرير الرسمي لنظام استكشاف الذكاء البحثي'],
    [`تاريخ الإصدار: ${now}`],
    [],
    ['أولاً: إجماليات الطلاب', ''],
    ['إجمالي الطلاب المسجلين في النظام', stats.totalStudents],
    ['الطلاب الذين أنهوا التقييم المبدئي', stats.funnel.preDone],
    ['الطلاب الذين شاهدوا الفيديو التعليمي', stats.funnel.preDone],
    ['الطلاب الذين أتموا التقييم النهائي', stats.funnel.postDone],
    ['الطلاب الذين تسربوا (لم يكملوا)', stats.funnel.started - stats.funnel.postDone],
    ['معدل إتمام الرحلة الكاملة', `${funnelRate}%`],
    [],
    ['ثانياً: المتوسطات العامة', ''],
    ['متوسط الإجابات الصحيحة — قبل الشرح', `${avgPrePercent}%`],
    ['متوسط الإجابات الصحيحة — بعد الشرح', `${avgPostPercent}%`],
    ['متوسط التحسن بعد الشرح', `${avgImprovement > 0 ? '+' : ''}${avgImprovement}%`],
    ['إجمالي الأسئلة', stats.questionsStats.length],
    ['أسئلة تحسّن أداؤها', stats.questionsStats.filter(q => q.improvement > 0).length],
    ['أسئلة تراجع أداؤها', stats.questionsStats.filter(q => q.improvement < 0).length],
    ['أسئلة بلا تغيير', stats.questionsStats.filter(q => q.improvement === 0).length],
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  wsSummary['!cols'] = [{ wch: 45 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'الملخص التنفيذي');

  const catData = [
    ['تحليل الأداء حسب مستوى الصعوبة'],
    [],
    ['المستوى', 'عدد الأسئلة', 'صح قبل الشرح %', 'عدد الصح قبل', 'غلط قبل الشرح %', 'عدد الغلط قبل', 'صح بعد الشرح %', 'عدد الصح بعد', 'غلط بعد الشرح %', 'عدد الغلط بعد', 'التحسن'],

  ];
  ['A', 'B', 'C'].forEach(cat => {
    const label = cat === 'A' ? 'A — سهل' : cat === 'B' ? 'B — متوسط' : 'C — صعب';
    const s = categoryStats[cat];
    if (s) {
      const correctPreCount = Math.round((s.avgPre / 100) * s.count);
      const correctPostCount = Math.round((s.avgPost / 100) * s.count);
      const wrongPreCount = s.count - correctPreCount;
      const wrongPostCount = s.count - correctPostCount;
      catData.push([
        label, s.count,
        `${s.avgPre}%`, correctPreCount,
        `${100 - s.avgPre}%`, wrongPreCount,
        `${s.avgPost}%`, correctPostCount,
        `${100 - s.avgPost}%`, wrongPostCount,
        `${s.improvement > 0 ? '+' : ''}${s.improvement}%`,
      ]);
    }
  });
  catData.push([], [
    'المتوسط الكلي', stats.questionsStats.length,
    `${avgPrePercent}%`, Math.round((avgPrePercent / 100) * stats.questionsStats.length),
    `${100 - avgPrePercent}%`, Math.round(((100 - avgPrePercent) / 100) * stats.questionsStats.length),
    `${avgPostPercent}%`, Math.round((avgPostPercent / 100) * stats.questionsStats.length),
    `${100 - avgPostPercent}%`, Math.round(((100 - avgPostPercent) / 100) * stats.questionsStats.length),
    `${avgImprovement > 0 ? '+' : ''}${avgImprovement}%`,
  ]);
  const wsCat = XLSX.utils.aoa_to_sheet(catData);
  wsCat['!cols'] = [{ wch: 18 }, { wch: 14 }, { wch: 16 }, { wch: 14 }, { wch: 16 }, { wch: 14 }, { wch: 16 }, { wch: 14 }, { wch: 16 }, { wch: 14 }, { wch: 12 }];

  XLSX.utils.book_append_sheet(wb, wsCat, 'تحليل مستويات الصعوبة');
  const qHeader = ['#', 'السؤال', 'المستوى', 'صح قبل %', 'صح قبل عدد', 'غلط قبل عدد', 'إجمالي قبل', 'صح بعد %', 'صح بعد عدد', 'غلط بعد عدد', 'إجمالي بعد', 'التحسن'];
  const qRows = stats.questionsStats.map((q, i) => {
    const cat = q.category || 'A';
    const catLabel = cat === 'A' ? 'سهل' : cat === 'B' ? 'متوسط' : 'صعب';
    return [
      i + 1,
      q.question?.ar || q.question || '',
      catLabel,
      q.preStats.percent,
      q.preStats.correct,
      q.preStats.total - q.preStats.correct,
      q.preStats.total,
      q.postStats.percent,
      q.postStats.correct,
      q.postStats.total - q.postStats.correct,
      q.postStats.total,
      q.improvement,
    ];
  });
  const wsQ = XLSX.utils.aoa_to_sheet([qHeader, ...qRows]);
  wsQ['!cols'] = [{ wch: 4 }, { wch: 55 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 10 }];
  XLSX.utils.book_append_sheet(wb, wsQ, 'تفاصيل الأسئلة');

  // ── ورقة 4: التصنيفات والمؤشرات ──
  const qs = stats.questionsStats;
  const topPreCorrect = [...qs].sort((a, b) => b.preStats.percent - a.preStats.percent).slice(0, 5);
  const topPostCorrect = [...qs].sort((a, b) => b.postStats.percent - a.postStats.percent).slice(0, 5);
  const mostWrongPre = [...qs].sort((a, b) => a.preStats.percent - b.preStats.percent).slice(0, 5);
  const mostWrongPost = [...qs].sort((a, b) => a.postStats.percent - b.postStats.percent).slice(0, 5);
  const mostImproved = [...qs].sort((a, b) => b.improvement - a.improvement).slice(0, 5);

  const rankData = [
    ['التصنيفات والمؤشرات'],
    [],
    ['أعلى 5 أسئلة إجابة صحيحة — قبل الشرح'],
    ['#', 'السؤال', 'المستوى', 'نسبة الصح'],
    ...topPreCorrect.map((q, i) => [i + 1, q.question?.ar || q.question || '', q.category === 'A' ? 'سهل' : q.category === 'B' ? 'متوسط' : 'صعب', `${q.preStats.percent}%`]),
    [],
    ['أعلى 5 أسئلة إجابة صحيحة — بعد الشرح'],
    ['#', 'السؤال', 'المستوى', 'نسبة الصح'],
    ...topPostCorrect.map((q, i) => [i + 1, q.question?.ar || q.question || '', q.category === 'A' ? 'سهل' : q.category === 'B' ? 'متوسط' : 'صعب', `${q.postStats.percent}%`]),
    [],
    ['أكثر 5 أسئلة إجابة خاطئة — قبل الشرح'],
    ['#', 'السؤال', 'المستوى', 'نسبة الغلط'],
    ...mostWrongPre.map((q, i) => [i + 1, q.question?.ar || q.question || '', q.category === 'A' ? 'سهل' : q.category === 'B' ? 'متوسط' : 'صعب', `${100 - q.preStats.percent}%`]),
    [],
    ['أكثر 5 أسئلة إجابة خاطئة — بعد الشرح (تحتاج مراجعة)'],
    ['#', 'السؤال', 'المستوى', 'نسبة الغلط'],
    ...mostWrongPost.map((q, i) => [i + 1, q.question?.ar || q.question || '', q.category === 'A' ? 'سهل' : q.category === 'B' ? 'متوسط' : 'صعب', `${100 - q.postStats.percent}%`]),
    [],
    ['أكثر 5 أسئلة تحسناً بعد الشرح'],
    ['#', 'السؤال', 'المستوى', 'قبل', 'بعد', 'التحسن'],
    ...mostImproved.map((q, i) => [i + 1, q.question?.ar || q.question || '', q.category === 'A' ? 'سهل' : q.category === 'B' ? 'متوسط' : 'صعب', `${q.preStats.percent}%`, `${q.postStats.percent}%`, `+${q.improvement}%`]),
  ];
  const wsRank = XLSX.utils.aoa_to_sheet(rankData);
  wsRank['!cols'] = [{ wch: 4 }, { wch: 60 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, wsRank, 'التصنيفات والمؤشرات');

  XLSX.writeFile(wb, `تقرير_نظام_الذكاء_البحثي_${Date.now()}.xlsx`);
}
export default function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [categoryStats, setCategoryStats] = useState({ A: null, B: null, C: null });
  const [stats, setStats] = useState({
    totalStudents: 0,
    funnel: { started: 0, preDone: 0, postDone: 0 },
    questionsStats: [],
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const qSnap = await getDocs(collection(db, 'questions'));
        const questions = [];
        qSnap.forEach(d => questions.push({ id: d.id, ...d.data() }));

        const sSnap = await getDocs(collection(db, 'sessions'));
        const sessions = [];
        sSnap.forEach(d => sessions.push(d.data()));

        const totalStudents = sessions.length;
        let preDone = 0, postDone = 0;
        sessions.forEach(s => {
          if (s.answers_pre && Object.keys(s.answers_pre).length > 0) preDone++;
          if (s.answers_post && Object.keys(s.answers_post).length > 0) postDone++;
        });

        const analyzedQuestions = questions.map(q => {
          let preCorrect = 0, preAnswered = 0, postCorrect = 0, postAnswered = 0;
          const correct = q.correctAnswer;
          sessions.forEach(s => {
            if (s.answers_pre?.[q.id] !== undefined) {
              preAnswered++;
              if (String(s.answers_pre[q.id]) === String(correct)) preCorrect++;
            }
            if (s.answers_post?.[q.id] !== undefined) {
              postAnswered++;
              if (String(s.answers_post[q.id]) === String(correct)) postCorrect++;
            }
          });
          const prePercent = preAnswered > 0 ? Math.round((preCorrect / preAnswered) * 100) : 0;
          const postPercent = postAnswered > 0 ? Math.round((postCorrect / postAnswered) * 100) : 0;
          return {
            ...q,
            preStats: { correct: preCorrect, total: preAnswered, percent: prePercent },
            postStats: { correct: postCorrect, total: postAnswered, percent: postPercent },
            improvement: postPercent - prePercent,
          };
        });

        setStats({ totalStudents, funnel: { started: totalStudents, preDone, postDone }, questionsStats: analyzedQuestions });
        const cats = { A: [], B: [], C: [] };
        analyzedQuestions.forEach(q => {
          const c = q.category || 'A';
          if (cats[c]) cats[c].push(q);
        });
        const buildCatStats = (arr) => ({
          count: arr.length,
          avgPre: arr.length > 0 ? Math.round(arr.reduce((a, q) => a + q.preStats.percent, 0) / arr.length) : 0,
          avgPost: arr.length > 0 ? Math.round(arr.reduce((a, q) => a + q.postStats.percent, 0) / arr.length) : 0,
          improvement: arr.length > 0 ? Math.round(arr.reduce((a, q) => a + q.improvement, 0) / arr.length) : 0,
        });
        setCategoryStats({ A: buildCatStats(cats.A), B: buildCatStats(cats.B), C: buildCatStats(cats.C) });
      } catch (err) {
        console.error('Analytics fetch error:', err);
      }
      setLoading(false);
    };
    fetchAnalytics();
  }, []);
  const qs = stats.questionsStats;
  const avgImprovement = qs.length > 0 ? Math.round(qs.reduce((a, q) => a + q.improvement, 0) / qs.length) : 0;
  const avgPrePercent = qs.length > 0 ? Math.round(qs.reduce((a, q) => a + q.preStats.percent, 0) / qs.length) : 0;
  const avgPostPercent = qs.length > 0 ? Math.round(qs.reduce((a, q) => a + q.postStats.percent, 0) / qs.length) : 0;
  const funnelRate = stats.funnel.started > 0 ? Math.round((stats.funnel.postDone / stats.funnel.started) * 100) : 0;
  const dropAtPre = stats.funnel.started - stats.funnel.preDone;
  const dropAtVideo = stats.funnel.preDone - stats.funnel.postDone;
  const topPreCorrect = [...qs].sort((a, b) => b.preStats.percent - a.preStats.percent).slice(0, 5);
  const topPostCorrect = [...qs].sort((a, b) => b.postStats.percent - a.postStats.percent).slice(0, 5);
  const mostImproved = [...qs].sort((a, b) => b.improvement - a.improvement).slice(0, 5);
  const needsAttention = [...qs].sort((a, b) => a.postStats.percent - b.postStats.percent).slice(0, 5);
  const preWrong = [...qs].sort((a, b) => a.preStats.percent - b.preStats.percent).slice(0, 5);
  const postWrong = [...qs].sort((a, b) => a.postStats.percent - b.postStats.percent).slice(0, 5);

  const handleExport = async (type) => {
    setExporting(type);
    try {
      if (type === 'pdf') await exportToPDF(stats, avgPrePercent, avgPostPercent, avgImprovement, categoryStats);
      else await exportToExcel(stats, avgPrePercent, avgPostPercent, avgImprovement, categoryStats);
    } catch (e) {
      console.error('Export error:', e);
      alert(`فشل التصدير: ${e.message}`);
    }
    setExporting(null);
  };
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4" dir="rtl">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-cyan-400 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
          <div className="absolute inset-3 rounded-full border-4 border-t-transparent border-r-blue-400 border-b-transparent border-l-transparent animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.75s' }}></div>
        </div>
        <p className="text-cyan-400 font-bold text-sm tracking-wider animate-pulse">جاري تحليل البيانات...</p>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'نظرة عامة' },
    { id: 'questions', label: 'تفاصيل الأسئلة' },
    { id: 'rankings', label: 'التصنيفات والتحليل' },
  ];

  return (
    <div className="space-y-6" dir="rtl" style={{ fontFamily: 'system-ui, sans-serif' }}>

      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">لوحة التحليلات المتقدمة</h2>
          <p className="text-slate-400 text-sm mt-0.5">تحليل شامل لأداء الطلاب قبل وبعد الشرح</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport('excel')}
            disabled={!!exporting || qs.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {exporting === 'excel' ? <Icon.Loader /> : <Icon.Table />}
            Excel
          </button>
          <button
            onClick={() => handleExport('pdf')}
            disabled={!!exporting || qs.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {exporting === 'pdf' ? <Icon.Loader /> : <Icon.FileText />}
            PDF
          </button>
        </div>
      </div>

      {/* ── TABS ── */}
      <div className="flex gap-1 p-1 bg-slate-800/50 rounded-xl border border-slate-700/50">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold transition-all ${activeTab === t.id
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
              : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {/* ══════════════════ TAB: OVERVIEW ══════════════════ */}
      {activeTab === 'overview' && (
        <div className="space-y-6">

          {/* KPI CARDS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'إجمالي الطلاب', value: stats.totalStudents, suffix: '', color: '#22d3ee', icon: <Icon.Users />, sub: 'بدأوا الرحلة' },
              { label: 'معدل إتمام الرحلة', value: funnelRate, suffix: '%', color: '#a78bfa', icon: <Icon.Award />, sub: 'أتموا الاختبار النهائي' },
              { label: 'متوسط قبل الشرح', value: avgPrePercent, suffix: '%', color: '#94a3b8', icon: <Icon.Chart />, sub: 'التقييم المبدئي' },
              { label: 'متوسط بعد الشرح', value: avgPostPercent, suffix: '%', color: '#34d399', icon: <Icon.TrendingUp />, sub: `تطور +${avgImprovement}%` },
            ].map((card, i) => (
              <div key={i} className="glass-card rounded-2xl p-4 border border-slate-700/50 hover:border-slate-600/70 transition-all group">
                <div className="flex items-start justify-between mb-3">
                  <p className="text-slate-400 text-xs font-bold leading-tight">{card.label}</p>
                  <div style={{ color: card.color }} className="opacity-60 group-hover:opacity-100 transition-opacity">{card.icon}</div>
                </div>
                <p className="text-2xl font-black" style={{ color: card.color }}>
                  <AnimatedNumber value={card.value} suffix={card.suffix} />
                </p>
                <p className="text-slate-500 text-[10px] mt-1">{card.sub}</p>
              </div>
            ))}
          </div>

          {/* PRE vs POST SUMMARY */}
          <div className="glass-card rounded-2xl p-6 border border-slate-700/50">
            <h3 className="text-base font-bold text-white mb-6 flex items-center gap-2">
              <Icon.Chart /> مقارنة الأداء الإجمالي: قبل الشرح vs بعد الشرح
            </h3>
            <div className="flex flex-col md:flex-row items-center gap-8">

              {/* Circles */}
              <div className="flex items-center gap-8 flex-shrink-0">
                <CircularProgress percent={avgPrePercent} size={110} strokeWidth={10} color="#64748b" label="قبل الشرح" sublabel={`متوسط ${avgPrePercent}%`} />
                <div className="flex flex-col items-center gap-1">
                  <div className={`text-xl font-black ${avgImprovement > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {avgImprovement > 0 ? '▲' : '▼'} {Math.abs(avgImprovement)}%
                  </div>
                  <p className="text-[10px] text-slate-500">تطور</p>
                </div>
                <CircularProgress percent={avgPostPercent} size={110} strokeWidth={10} color="#22d3ee" label="بعد الشرح" sublabel={`متوسط ${avgPostPercent}%`} />
              </div>

              {/* Stats Grid */}
              <div className="flex-1 w-full grid grid-cols-2 gap-3">
                {[
                  { label: 'إجمالي إجابات صحيحة (قبل)', value: qs.reduce((a, q) => a + q.preStats.correct, 0), color: 'text-slate-300' },
                  { label: 'إجمالي إجابات صحيحة (بعد)', value: qs.reduce((a, q) => a + q.postStats.correct, 0), color: 'text-cyan-300' },
                  { label: 'أسئلة تحسّنت', value: qs.filter(q => q.improvement > 0).length, color: 'text-emerald-400' },
                  { label: 'أسئلة تراجعت', value: qs.filter(q => q.improvement < 0).length, color: 'text-red-400' },
                  { label: 'أسئلة بلا تغيير', value: qs.filter(q => q.improvement === 0).length, color: 'text-slate-400' },
                  { label: 'إجمالي الأسئلة', value: qs.length, color: 'text-white' },
                ].map((item, i) => (
                  <div key={i} className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/30">
                    <p className="text-slate-500 text-[10px] mb-1">{item.label}</p>
                    <p className={`text-lg font-black ${item.color}`}>{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Overall bar comparison */}
            <div className="mt-6 space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-400 font-bold">متوسط الإجابات الصحيحة — قبل الشرح</span>
                  <span className="text-slate-300 font-bold">{avgPrePercent}%</span>
                </div>
                <ProgressBar percent={avgPrePercent} color="bg-slate-500" height="h-3" />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-cyan-400 font-bold">متوسط الإجابات الصحيحة — بعد الشرح</span>
                  <span className="text-cyan-300 font-bold">{avgPostPercent}%</span>
                </div>
                <ProgressBar percent={avgPostPercent} color="bg-gradient-to-l from-cyan-400 to-blue-500" height="h-3" glow />
              </div>
            </div>
          </div>

          {/* FUNNEL */}
          <div className="glass-card rounded-2xl p-6 border border-slate-700/50">
            <h3 className="text-base font-bold text-white mb-6 flex items-center gap-2">
              <Icon.Filter /> مسار الطلاب ومعدلات التسرب
            </h3>
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 relative">

              {[
                { count: stats.funnel.started, label: 'فتحوا النظام', sub: '100%', color: 'border-cyan-500', shadow: 'shadow-[0_0_20px_rgba(6,182,212,0.3)]', glyph: '🚀' },
                { count: stats.funnel.preDone, label: 'أنهوا التقييم المبدئي', sub: `${stats.funnel.started > 0 ? Math.round((stats.funnel.preDone / stats.funnel.started) * 100) : 0}%`, color: 'border-blue-500', shadow: 'shadow-[0_0_20px_rgba(59,130,246,0.3)]', glyph: '📝' },
                { count: stats.funnel.postDone, label: 'أتموا الرحلة بنجاح', sub: `${funnelRate}%`, color: 'border-emerald-500', shadow: 'shadow-[0_0_20px_rgba(16,185,129,0.3)]', glyph: '🏆' },
              ].map((stage, i, arr) => (
                <React.Fragment key={i}>
                  <div className="flex-1 flex flex-col items-center gap-2 z-10">
                    <div className="text-2xl mb-1">{stage.glyph}</div>
                    <div className={`w-20 h-20 rounded-2xl bg-slate-800/80 border-2 ${stage.color} flex items-center justify-center text-2xl font-black text-white ${stage.shadow}`}>
                      {stage.count}
                    </div>
                    <p className="text-xs font-bold text-slate-300 text-center">{stage.label}</p>
                    <p className="text-xs font-black text-emerald-400">{stage.sub}</p>
                  </div>

                  {i < arr.length - 1 && (
                    <div className="hidden md:flex flex-1 flex-col items-center gap-1 relative">
                      <div className="w-full h-px bg-slate-700"></div>
                      {(i === 0 ? dropAtPre : dropAtVideo) > 0 && (
                        <div className="absolute -top-8 flex flex-col items-center">
                          <span className="bg-red-500/15 border border-red-500/25 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                            ↳ تسرب {i === 0 ? dropAtPre : dropAtVideo} طالب
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Funnel bars */}
            <div className="mt-6 space-y-2">
              {[
                { label: 'فتحوا النظام', count: stats.funnel.started, pct: 100, color: 'bg-cyan-500' },
                { label: 'التقييم المبدئي', count: stats.funnel.preDone, pct: stats.funnel.started > 0 ? Math.round((stats.funnel.preDone / stats.funnel.started) * 100) : 0, color: 'bg-blue-500' },
                { label: 'التقييم النهائي', count: stats.funnel.postDone, pct: funnelRate, color: 'bg-emerald-500' },
              ].map((row, i) => (
                <div key={i} className="flex items-center gap-3">
                  <p className="text-xs text-slate-400 w-28 flex-shrink-0">{row.label}</p>
                  <div className="flex-1 bg-slate-800/60 h-5 rounded-full overflow-hidden">
                    <div className={`h-full ${row.color} rounded-full flex items-center justify-end pr-2 transition-all duration-1000`} style={{ width: `${row.pct}%` }}>
                      <span className="text-[9px] font-black text-white">{row.count}</span>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 w-10 flex-shrink-0">{row.pct}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Category Performance */}
          <div className="glass-card rounded-2xl p-6 border border-slate-700/50">
            <h3 className="text-base font-bold text-white mb-5 flex items-center gap-2">
              <Icon.Chart /> الأداء حسب الفئة
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['A', 'B', 'C'].map(cat => {
                const s = categoryStats[cat];
                if (!s) return null;
                return (
                  <div key={cat} className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/30">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-white font-black text-lg">فئة {cat}</span>
                      <span className="text-slate-500 text-xs">{s.count} سؤال</span>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-400">قبل الشرح</span>
                          <span className="text-slate-300 font-bold">{s.avgPre}%</span>
                        </div>
                        <ProgressBar percent={s.avgPre} color="bg-slate-500" />
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-cyan-400">بعد الشرح</span>
                          <span className="text-cyan-300 font-bold">{s.avgPost}%</span>
                        </div>
                        <ProgressBar percent={s.avgPost} color="bg-gradient-to-l from-cyan-400 to-blue-500" glow />
                      </div>
                      <div className={`text-center py-2 rounded-xl font-black text-sm ${s.improvement > 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : s.improvement < 0 ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                          : 'bg-slate-700/50 text-slate-400'
                        }`}>
                        {s.improvement > 0 ? '▲' : s.improvement < 0 ? '▼' : '—'} {Math.abs(s.improvement)}% تطور
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}
      {/* ══════════════════ TAB: QUESTIONS ══════════════════ */}
      {activeTab === 'questions' && (
        <div className="space-y-4">
          {qs.length === 0 ? (
            <div className="text-center p-12 glass-card rounded-2xl border border-slate-700/50 text-slate-400">
              لا توجد بيانات أسئلة بعد.
            </div>
          ) : (
            qs.map((q, index) => (
              <div key={q.id} className="glass-card p-5 rounded-2xl border border-slate-700/50 hover:border-slate-600 transition-all">

                {/* Header */}
                <div className="flex justify-between items-start gap-4 mb-5 pb-4 border-b border-slate-800">
                  <div className="flex-1">
                    <span className="text-xs font-bold text-cyan-500 bg-cyan-500/10 px-2 py-0.5 rounded-md mb-2 inline-block">سؤال {index + 1}</span>
                    <h4 className="text-white font-semibold text-sm leading-relaxed">{q.question?.ar || q.question}</h4>
                  </div>
                  <div className={`px-3 py-1.5 rounded-xl text-sm font-black flex-shrink-0 ${q.improvement > 0 ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                    : q.improvement < 0 ? 'bg-red-500/15 text-red-400 border border-red-500/25'
                      : 'bg-slate-700/50 text-slate-400 border border-slate-600/50'
                    }`}>
                    {q.improvement > 0 ? '▲' : q.improvement < 0 ? '▼' : '—'} {Math.abs(q.improvement)}%
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  <div className="bg-slate-800/60 rounded-xl p-3 text-center border border-slate-700/30">
                    <p className="text-[10px] text-slate-500 mb-1">صح قبل الشرح</p>
                    <p className="text-lg font-black text-slate-300">{q.preStats.percent}%</p>
                    <p className="text-[10px] text-slate-500">{q.preStats.correct}/{q.preStats.total}</p>
                  </div>
                  <div className="bg-slate-800/60 rounded-xl p-3 text-center border border-slate-700/30 flex flex-col items-center justify-center">
                    <div className={`text-lg font-black ${q.improvement > 0 ? 'text-emerald-400' : q.improvement < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                      {q.improvement > 0 ? '+' : ''}{q.improvement}%
                    </div>
                    <p className="text-[10px] text-slate-500">تطور</p>
                  </div>
                  <div className="bg-cyan-500/5 rounded-xl p-3 text-center border border-cyan-500/15">
                    <p className="text-[10px] text-cyan-500/70 mb-1">صح بعد الشرح</p>
                    <p className="text-lg font-black text-cyan-300">{q.postStats.percent}%</p>
                    <p className="text-[10px] text-slate-500">{q.postStats.correct}/{q.postStats.total}</p>
                  </div>
                </div>

                {/* Bars */}
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1.5">
                      <span className="text-slate-400 font-bold">قبل الشرح</span>
                      <span className="text-slate-400">{q.preStats.percent}% — {q.preStats.correct} من {q.preStats.total}</span>
                    </div>
                    <ProgressBar percent={q.preStats.percent} color="bg-slate-500" />
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] mb-1.5">
                      <span className="text-cyan-400 font-bold">بعد الشرح</span>
                      <span className="text-cyan-400">{q.postStats.percent}% — {q.postStats.correct} من {q.postStats.total}</span>
                    </div>
                    <ProgressBar percent={q.postStats.percent} color="bg-gradient-to-l from-cyan-400 to-blue-500" glow />
                  </div>
                </div>

                {/* Wrong analysis */}
                <div className="mt-4 flex gap-3">
                  <div className="flex-1 flex items-center gap-2 bg-red-500/5 border border-red-500/15 rounded-xl px-3 py-2">
                    <span className="w-4 h-4 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center flex-shrink-0"><Icon.X /></span>
                    <p className="text-[11px] text-red-400">{q.preStats.total - q.preStats.correct} أخطأوا قبل الشرح</p>
                  </div>
                  <div className="flex-1 flex items-center gap-2 bg-emerald-500/5 border border-emerald-500/15 rounded-xl px-3 py-2">
                    <span className="w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0"><Icon.Check /></span>
                    <p className="text-[11px] text-emerald-400">{q.postStats.correct} أصابوا بعد الشرح</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ══════════════════ TAB: RANKINGS ══════════════════ */}
      {activeTab === 'rankings' && (
        <div className="space-y-6">

          {/* Category Comparison */}
          <div className="glass-card rounded-2xl p-5 border border-slate-700/50">
            <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Icon.Chart /> مقارنة الفئات A / B / C
            </h4>
            <div className="space-y-4">
              {['A', 'B', 'C'].map(cat => {
                const s = categoryStats[cat];
                if (!s) return null;
                return (
                  <div key={cat} className="flex items-center gap-4">
                    <span className="w-14 text-center py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white font-black text-sm flex-shrink-0">
                      فئة {cat}
                    </span>
                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 w-16 flex-shrink-0">قبل</span>
                        <ProgressBar percent={s.avgPre} color="bg-slate-500" height="h-2" />
                        <span className="text-xs text-slate-300 font-bold w-10 flex-shrink-0">{s.avgPre}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-cyan-500 w-16 flex-shrink-0">بعد</span>
                        <ProgressBar percent={s.avgPost} color="bg-gradient-to-l from-cyan-400 to-blue-500" height="h-2" />
                        <span className="text-xs text-cyan-300 font-bold w-10 flex-shrink-0">{s.avgPost}%</span>
                      </div>
                    </div>
                    <span className={`text-sm font-black flex-shrink-0 ${s.improvement > 0 ? 'text-emerald-400' : s.improvement < 0 ? 'text-red-400' : 'text-slate-400'
                      }`}>
                      {s.improvement > 0 ? '+' : ''}{s.improvement}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* GRID: Top Correct + Top Wrong */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Highest Correct PRE */}
            <div className="glass-card rounded-2xl p-5 border border-slate-700/50">
              <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-slate-500/20 border border-slate-500/30 flex items-center justify-center"><Icon.Check /></span>
                <span>أعلى إجابات صحيحة — قبل الشرح</span>
              </h4>
              <div className="space-y-3">
                {topPreCorrect.map((q, i) => (
                  <div key={q.id} className="flex items-center gap-3">
                    <RankBadge rank={i + 1} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-300 truncate mb-1">{q.question?.ar || q.question}</p>
                      <ProgressBar percent={q.preStats.percent} color="bg-slate-500" height="h-1.5" />
                    </div>
                    <span className="text-sm font-black text-slate-300 flex-shrink-0">{q.preStats.percent}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Highest Correct POST */}
            <div className="glass-card rounded-2xl p-5 border border-cyan-500/20">
              <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400"><Icon.Check /></span>
                <span>أعلى إجابات صحيحة — بعد الشرح</span>
              </h4>
              <div className="space-y-3">
                {topPostCorrect.map((q, i) => (
                  <div key={q.id} className="flex items-center gap-3">
                    <RankBadge rank={i + 1} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-300 truncate mb-1">{q.question?.ar || q.question}</p>
                      <ProgressBar percent={q.postStats.percent} color="bg-gradient-to-l from-cyan-400 to-blue-500" height="h-1.5" />
                    </div>
                    <span className="text-sm font-black text-cyan-300 flex-shrink-0">{q.postStats.percent}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Most Wrong PRE */}
            <div className="glass-card rounded-2xl p-5 border border-slate-700/50">
              <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400"><Icon.X /></span>
                <span>أكثر إجابات خاطئة — قبل الشرح</span>
              </h4>
              <div className="space-y-3">
                {preWrong.map((q, i) => (
                  <div key={q.id} className="flex items-center gap-3">
                    <RankBadge rank={i + 1} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-300 truncate mb-1">{q.question?.ar || q.question}</p>
                      <div className="w-full h-1.5 bg-slate-800/80 rounded-full overflow-hidden">
                        <div className="h-full bg-red-500/60 rounded-full" style={{ width: `${100 - q.preStats.percent}%` }} />
                      </div>
                    </div>
                    <span className="text-sm font-black text-red-400 flex-shrink-0">{100 - q.preStats.percent}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Most Wrong POST */}
            <div className="glass-card rounded-2xl p-5 border border-slate-700/50">
              <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400"><Icon.AlertTriangle /></span>
                <span>أسئلة تحتاج مراجعة — بعد الشرح</span>
              </h4>
              <div className="space-y-3">
                {postWrong.map((q, i) => (
                  <div key={q.id} className="flex items-center gap-3">
                    <RankBadge rank={i + 1} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-300 truncate mb-1">{q.question?.ar || q.question}</p>
                      <div className="w-full h-1.5 bg-slate-800/80 rounded-full overflow-hidden">
                        <div className="h-full bg-orange-500/60 rounded-full" style={{ width: `${100 - q.postStats.percent}%` }} />
                      </div>
                    </div>
                    <span className="text-sm font-black text-orange-400 flex-shrink-0">{100 - q.postStats.percent}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* MOST IMPROVED */}
          <div className="glass-card rounded-2xl p-5 border border-emerald-500/20">
            <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400"><Icon.TrendingUp /></span>
              <span>أكثر الأسئلة تحسناً بعد الشرح (أكبر قفزة)</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {mostImproved.map((q, i) => (
                <div key={q.id} className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-3 flex flex-col items-center text-center gap-1">
                  <RankBadge rank={i + 1} />
                  <p className="text-[10px] text-slate-400 leading-tight mt-1 line-clamp-2">{q.question?.ar || q.question}</p>
                  <div className="flex items-center gap-1 mt-auto">
                    <span className="text-[10px] text-slate-500">{q.preStats.percent}%</span>
                    <span className="text-slate-600">→</span>
                    <span className="text-[10px] text-cyan-300">{q.postStats.percent}%</span>
                  </div>
                  <span className="text-base font-black text-emerald-400">+{q.improvement}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* COMPREHENSIVE SUMMARY TABLE */}
          <div className="glass-card rounded-2xl p-5 border border-slate-700/50">
            <h4 className="text-sm font-bold text-white mb-5 flex items-center gap-2">
              <Icon.Chart /> ملخص شامل — جميع الأسئلة
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse" style={{ direction: 'rtl' }}>
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-right text-slate-400 font-bold pb-2 pr-2">#</th>
                    <th className="text-right text-slate-400 font-bold pb-2 px-2">السؤال</th>
                    <th className="text-center text-slate-400 font-bold pb-2 px-2">قبل %</th>
                    <th className="text-center text-slate-400 font-bold pb-2 px-2">بعد %</th>
                    <th className="text-center text-slate-400 font-bold pb-2 px-2">التطور</th>
                    <th className="text-center text-slate-400 font-bold pb-2 px-2">خطأ قبل</th>
                    <th className="text-center text-slate-400 font-bold pb-2 px-2">خطأ بعد</th>
                  </tr>
                </thead>
                <tbody>
                  {qs.map((q, i) => (
                    <tr key={q.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                      <td className="py-2.5 pr-2 text-slate-500">{i + 1}</td>
                      <td className="py-2.5 px-2 text-slate-300 max-w-[180px]">
                        <span className="line-clamp-2 leading-tight">{q.question?.ar || q.question}</span>
                      </td>
                      <td className="py-2.5 px-2 text-center text-slate-300 font-bold">{q.preStats.percent}%</td>
                      <td className="py-2.5 px-2 text-center text-cyan-300 font-bold">{q.postStats.percent}%</td>
                      <td className={`py-2.5 px-2 text-center font-black ${q.improvement > 0 ? 'text-emerald-400' : q.improvement < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                        {q.improvement > 0 ? '+' : ''}{q.improvement}%
                      </td>
                      <td className="py-2.5 px-2 text-center text-red-400">
                        {q.preStats.total - q.preStats.correct}
                        <span className="text-slate-600 text-[10px]"> / {q.preStats.total}</span>
                      </td>
                      <td className="py-2.5 px-2 text-center text-orange-400">
                        {q.postStats.total - q.postStats.correct}
                        <span className="text-slate-600 text-[10px]"> / {q.postStats.total}</span>
                      </td>
                    </tr>
                  ))}
                  {/* Totals row */}
                  <tr className="border-t-2 border-slate-600 bg-slate-800/40">
                    <td className="py-2.5 pr-2 text-slate-400 font-bold" colSpan={2}>المجموع / المتوسط</td>
                    <td className="py-2.5 px-2 text-center text-slate-300 font-black">{avgPrePercent}%</td>
                    <td className="py-2.5 px-2 text-center text-cyan-300 font-black">{avgPostPercent}%</td>
                    <td className={`py-2.5 px-2 text-center font-black ${avgImprovement > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {avgImprovement > 0 ? '+' : ''}{avgImprovement}%
                    </td>
                    <td className="py-2.5 px-2 text-center text-red-400 font-bold">
                      {qs.reduce((a, q) => a + (q.preStats.total - q.preStats.correct), 0)}
                    </td>
                    <td className="py-2.5 px-2 text-center text-orange-400 font-bold">
                      {qs.reduce((a, q) => a + (q.postStats.total - q.postStats.correct), 0)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}