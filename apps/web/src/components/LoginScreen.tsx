'use client';

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  Sparkles,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  Globe,
} from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { login } = useAuth();
  const { language, toggleLanguage } = useLanguage();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    const res = login(email, password);
    setIsSubmitting(false);

    if (!res.success) {
      setErrorMessage(res.error || 'فشل تسجيل الدخول');
    }
  };

  return (
    <div className="min-h-screen bg-navy-950 flex flex-col justify-center items-center p-4 relative overflow-hidden select-none">
      {/* Background Ambient Lighting */}
      <div className="absolute top-1/4 -start-32 w-96 h-96 rounded-full bg-cyan/15 blur-[128px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 -end-32 w-96 h-96 rounded-full bg-electric-600/15 blur-[128px] pointer-events-none"></div>

      {/* Language Switcher in top corner */}
      <div className="absolute top-6 end-6">
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-navy-900 border border-surface-border hover:border-cyan/40 text-xs font-semibold text-slate-300 hover:text-white transition"
        >
          <Globe className="w-3.5 h-3.5 text-cyan" />
          <span>{language === 'ar' ? 'English' : 'العربية (RTL)'}</span>
        </button>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md relative z-10">
        <div className="glass-panel-cyan rounded-3xl p-8 border border-surface-border-highlight shadow-glow-card">
          {/* Brand Header */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-cyan to-electric-600 flex items-center justify-center text-navy-950 font-black shadow-glow-cyan mb-3">
              <Sparkles className="w-7 h-7 fill-navy-950" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-wider flex items-center justify-center gap-2">
              FEKRA <span className="text-cyan font-mono text-base px-2 py-0.5 rounded bg-cyan-dim border border-cyan/40">AI</span>
            </h1>
            <p className="text-xs text-cyan font-medium mt-1">
              نظام التشغيل المؤسسي الداخلي
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Internal Company Operating System
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                البريد الإلكتروني (Email)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@fekra.com"
                  className="w-full bg-navy-950/80 border border-surface-border rounded-xl ps-10 pe-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan focus:ring-1 focus:ring-cyan/40 transition font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                كلمة المرور (Password)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-navy-950/80 border border-surface-border rounded-xl ps-10 pe-10 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan focus:ring-1 focus:ring-cyan/40 transition font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute end-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full electric-gradient-btn py-3.5 rounded-xl text-xs font-black tracking-wide flex items-center justify-center gap-2 mt-4 shadow-glow-cyan"
            >
              <span>تسجيل الدخول (Sign In)</span>
              <ArrowRight className={`w-4 h-4 ${language === 'ar' ? 'rotate-180' : ''}`} />
            </button>
          </form>

          {/* Security Notice */}
          <div className="mt-6 pt-5 border-t border-surface-border/60 flex items-center gap-2 text-[10px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-cyan shrink-0" />
            <span>تسجيل الدخول مشفر ومخصص فقط للحسابات المعتمدة داخل الشركة.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
