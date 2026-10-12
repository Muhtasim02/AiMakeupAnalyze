import React, { useState } from 'react';
import { ArrowRight, Lock, Mail, Sparkles, UserCheck, ShieldCheck } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (email: string, password?: string) => void;
  onNavigateToSignUp: () => void;
  onNavigateHome?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  onNavigateToSignUp,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    onLoginSuccess(email.trim(), password.trim());
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF8F5] px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 border border-stone-200/90 shadow-lg space-y-7">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>AI MakeupMatch</span>
          </div>
          <h1 className="text-3xl font-serif-display font-bold text-stone-950">
            Sign In
          </h1>
          <p className="text-xs text-stone-500 max-w-xs mx-auto leading-relaxed">
            Enter your credentials to access your personalized cosmetic shade analysis, catalog, or account management.
          </p>
        </div>

        {/* Standard Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-700">Email Address</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full text-xs bg-white border border-stone-300 rounded-xl pl-9 pr-3 py-2.5 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-900"
              />
              <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-700">Password</label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full text-xs bg-white border border-stone-300 rounded-xl pl-9 pr-3 py-2.5 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-900"
              />
              <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-stone-600 pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded accent-stone-900"
              />
              <span>Remember me</span>
            </label>
            <span className="text-stone-400">Production Auth Protected</span>
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 bg-stone-950 hover:bg-stone-800 text-white text-xs font-semibold uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 mt-2"
          >
            <span>Sign In to MakeupMatch</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        <div className="pt-2 border-t border-stone-100 text-center text-xs text-stone-600">
          <span>New to AI MakeupMatch? </span>
          <button
            onClick={onNavigateToSignUp}
            className="font-bold text-stone-950 hover:underline cursor-pointer ml-1"
          >
            Create an Account
          </button>
        </div>

      </div>
    </div>
  );
};
