import React, { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, setPersistence, browserLocalPersistence, browserSessionPersistence } from 'firebase/auth';
import { auth } from '../firebase/config';
import { useQuizStore } from '../store/useQuizStore';
const EyeIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

const EyeOffIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
        <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
);

const ShieldIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
);

const t = {
    ar: {
        title: 'لوحة الإدارة',
        sub: 'تسجيل دخول المشرفين فقط',
        email: 'البريد الإلكتروني',
        emailPlaceholder: 'admin@example.com',
        password: 'كلمة المرور',
        passwordPlaceholder: '••••••••',
        remember: 'تذكرني — حفظ الجلسة',
        submit: 'تسجيل الدخول',
        loading: 'جاري التحقق',
        errorAuth: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
        errorPerm: 'هذا الحساب لا يملك صلاحيات الإدارة',
        dir: 'rtl',
    },
    en: {
        title: 'Admin Panel',
        sub: 'Authorized administrators only',
        email: 'Email Address',
        emailPlaceholder: 'admin@example.com',
        password: 'Password',
        passwordPlaceholder: '••••••••',
        remember: 'Remember me — Keep session',
        submit: 'Sign In',
        loading: 'Verifying',
        errorAuth: 'Incorrect email or password',
        errorPerm: 'This account has no admin permissions',
        dir: 'ltr',
    }
};

export default function AdminLogin({ onLoginSuccess }) {
    const { lang } = useQuizStore();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

    const T = t[lang];
    const isAr = lang === 'ar';

    useEffect(() => {
        setMounted(true);
        const savedEmail = localStorage.getItem('admin_email');
        if (savedEmail) { setEmail(savedEmail); setRememberMe(true); }
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            if (!userCredential.user.isAnonymous) {
                if (rememberMe) localStorage.setItem('admin_email', email);
                else localStorage.removeItem('admin_email');
                onLoginSuccess();
            } else {
                setError(T.errorPerm);
            }
        } catch (err) {
            console.error(err);
            setError(T.errorAuth);
        }
        setLoading(false);
    };

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&family=Syne:wght@700;800&display=swap');

        .al-root {
          min-height: 100dvh;
          display: flex; align-items: center; justify-content: center;
          padding: 24px 16px;
          font-family: 'IBM Plex Sans Arabic', sans-serif;
          background:
            radial-gradient(ellipse 70% 50% at 20% 10%, rgba(6,182,212,.1) 0%, transparent 60%),
            radial-gradient(ellipse 50% 40% at 80% 90%, rgba(99,102,241,.08) 0%, transparent 60%),
            #070d1a;
        }

        .al-card {
          width: 100%; max-width: 420px;
          background: rgba(15,23,42,.95);
          backdrop-filter: blur(24px);
          border: 1px solid rgba(148,163,184,.1);
          border-radius: 24px;
          padding: 40px 36px;
          box-shadow: 0 24px 80px rgba(0,0,0,.6);
          opacity: 0; transform: translateY(20px);
          transition: opacity .5s ease, transform .5s ease;
          position: relative;
        }
        .al-card.mounted { opacity: 1; transform: translateY(0); }

        .al-lang-btn {
          position: absolute;
          top: 20px;
          background: rgba(255,255,255,.05);
          border: 1px solid rgba(148,163,184,.15);
          border-radius: 10px;
          padding: 6px 12px;
          color: rgba(148,163,184,.8);
          font-family: 'IBM Plex Sans Arabic', sans-serif;
          font-size: 12px; font-weight: 600;
          cursor: pointer;
          transition: all .2s;
          display: flex; align-items: center; gap: 6px;
        }
        .al-lang-btn:hover {
          background: rgba(6,182,212,.1);
          border-color: rgba(6,182,212,.3);
          color: #06b6d4;
        }
        .al-lang-btn-ltr { right: 20px; }
        .al-lang-btn-rtl { left: 20px; }

        .al-icon-wrap {
          width: 64px; height: 64px;
          border-radius: 20px;
          background: linear-gradient(135deg, rgba(6,182,212,.2), rgba(99,102,241,.15));
          border: 1px solid rgba(6,182,212,.25);
          display: flex; align-items: center; justify-content: center;
          color: #06b6d4;
          margin: 0 auto 20px;
          box-shadow: 0 0 30px rgba(6,182,212,.15);
        }

        .al-title {
          font-family: 'Syne', sans-serif;
          font-size: 22px; font-weight: 800;
          color: #fff; text-align: center; margin-bottom: 4px;
        }
        .al-sub {
          font-size: 13px; color: rgba(148,163,184,.6);
          text-align: center; margin-bottom: 32px;
        }

        .al-label {
          display: block; font-size: 12px; font-weight: 600;
          color: rgba(148,163,184,.8); margin-bottom: 8px; letter-spacing: .04em;
        }

        .al-input-wrap { position: relative; margin-bottom: 18px; }

        .al-input {
          width: 100%; padding: 12px 16px;
          background: rgba(255,255,255,.04);
          border: 1px solid rgba(148,163,184,.12);
          border-radius: 12px; color: #fff; font-size: 14px;
          font-family: 'IBM Plex Sans Arabic', sans-serif;
          outline: none; transition: border-color .2s, box-shadow .2s;
          box-sizing: border-box;
        }
        .al-input:focus {
          border-color: rgba(6,182,212,.5);
          box-shadow: 0 0 0 3px rgba(6,182,212,.08);
        }
        .al-input.has-toggle-rtl { padding-right: 44px; }
        .al-input.has-toggle-ltr { padding-left: 44px; }

        .al-eye-btn {
          position: absolute; top: 50%; transform: translateY(-50%);
          background: none; border: none;
          color: rgba(148,163,184,.5); cursor: pointer;
          padding: 4px; display: flex; align-items: center;
          transition: color .2s;
        }
        .al-eye-btn:hover { color: #06b6d4; }
        .al-eye-rtl { right: 14px; }
        .al-eye-ltr { left: 14px; }

        .al-remember {
          display: flex; align-items: center; gap: 10px;
          margin-bottom: 24px; cursor: pointer; user-select: none;
        }
        .al-remember input[type="checkbox"] { display: none; }
        .al-checkbox {
          width: 18px; height: 18px; border-radius: 5px;
          border: 1.5px solid rgba(148,163,184,.25);
          background: rgba(255,255,255,.03);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; transition: all .2s;
        }
        .al-checkbox.checked { background: #06b6d4; border-color: #06b6d4; }
        .al-checkbox svg { opacity: 0; transition: opacity .2s; }
        .al-checkbox.checked svg { opacity: 1; }
        .al-remember-text { font-size: 13px; color: rgba(148,163,184,.7); }

        .al-divider { height: 1px; background: rgba(148,163,184,.08); margin: 24px 0; }

        .al-btn {
          width: 100%; padding: 14px; border: none; border-radius: 14px;
          background: linear-gradient(135deg, #06b6d4, #6366f1);
          color: #fff; font-family: 'IBM Plex Sans Arabic', sans-serif;
          font-size: 15px; font-weight: 700; cursor: pointer;
          box-shadow: 0 4px 24px rgba(6,182,212,.3);
          transition: transform .2s, box-shadow .2s, opacity .2s;
        }
        .al-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(6,182,212,.4); }
        .al-btn:active:not(:disabled) { transform: translateY(0); }
        .al-btn:disabled { opacity: .5; cursor: not-allowed; }

        .al-error {
          background: rgba(239,68,68,.08);
          border: 1px solid rgba(239,68,68,.25);
          border-radius: 12px; padding: 12px 16px;
          color: rgba(239,68,68,.9); font-size: 13px;
          font-weight: 600; text-align: center; margin-bottom: 20px;
        }

        .al-spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,.3);
          border-top-color: #fff; border-radius: 50%;
          animation: al-spin .7s linear infinite;
          display: inline-block; vertical-align: middle; margin: 0 6px;
        }
        @keyframes al-spin { to { transform: rotate(360deg); } }
      `}</style>

            <div className="al-root">
                <div className={`al-card ${mounted ? 'mounted' : ''}`} dir={T.dir}>

                    {/* ── أيقونة ── */}
                    <div className="al-icon-wrap"><ShieldIcon /></div>

                    {/* ── عنوان ── */}
                    <h2 className="al-title">{T.title}</h2>
                    <p className="al-sub">{T.sub}</p>

                    {/* ── خطأ ── */}
                    {error && <div className="al-error">⚠️ {error}</div>}

                    {/* ── الإيميل ── */}
                    <label className="al-label">{T.email}</label>
                    <div className="al-input-wrap">
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="al-input"
                            dir="ltr"
                            placeholder={T.emailPlaceholder}
                        />
                    </div>

                    {/* ── كلمة السر ── */}
                    <label className="al-label">{T.password}</label>
                    <div className="al-input-wrap">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className={`al-input ${isAr ? 'has-toggle-rtl' : 'has-toggle-ltr'}`}
                            dir="ltr"
                            placeholder={T.passwordPlaceholder}
                        />
                        <button
                            type="button"
                            className={`al-eye-btn ${isAr ? 'al-eye-rtl' : 'al-eye-ltr'}`}
                            onClick={() => setShowPassword(p => !p)}
                            tabIndex={-1}
                        >
                            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                        </button>
                    </div>

                    <div className="al-divider" />

                    {/* ── تذكرني ── */}
                    <label className="al-remember" onClick={() => setRememberMe(p => !p)}>
                        <div className={`al-checkbox ${rememberMe ? 'checked' : ''}`}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" width="11" height="11">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        </div>
                        <span className="al-remember-text">{T.remember}</span>
                    </label>

                    {/* ── زرار الدخول ── */}
                    <button
                        onClick={handleLogin}
                        disabled={loading || !email || !password}
                        className="al-btn"
                    >
                        {loading ? (
                            <>{T.loading}<span className="al-spinner" /></>
                        ) : T.submit}
                    </button>

                </div>
            </div>
        </>
    );
}