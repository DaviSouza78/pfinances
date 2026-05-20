"use client";

import { signIn } from "next-auth/react";
import { 
  DollarSign, 
  CalendarCheck, 
  BookOpen, 
  ShieldCheck,
  ArrowRight,
  Sparkles
} from "lucide-react";

const features = [
  {
    icon: DollarSign,
    title: "Finanças em centavos",
    description: "Cálculos precisos sem erros de ponto flutuante",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
  },
  {
    icon: CalendarCheck,
    title: "Hábitos diários",
    description: "Acompanhe sua rotina com animações suaves",
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
  },
  {
    icon: BookOpen,
    title: "Disciplinas de estudo",
    description: "Organize tarefas por área de conhecimento",
    color: "text-violet-400",
    bg: "bg-violet-500/10 border-violet-500/20",
  },
  {
    icon: ShieldCheck,
    title: "Dados locais seguros",
    description: "Tudo salvo no seu banco, com encriptação",
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
  },
];

export default function LoginPage() {
  return (
    <div className="flex h-screen w-screen">
      {/* ─── Coluna Esquerda: Branding ─── */}
      <div className="max-lg:hidden flex lg:w-1/2 bg-slate-950 flex-col justify-between p-10 xl:p-16 relative overflow-hidden">
        {/* Gradient orbs decorativas */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-emerald-600/8 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">PersonalHub</span>
          </div>
          <p className="text-[11px] text-slate-500 uppercase tracking-[0.25em] font-medium ml-[52px] -mt-1">
            Plataforma pessoal
          </p>
        </div>

        <div className="relative z-10 flex-1 flex flex-col justify-center -mt-8">
          {/* Headline */}
          <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-4">
            Sua vida organizada,{" "}
            <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
              num só lugar
            </span>
          </h1>
          <p className="text-slate-400 text-base xl:text-lg leading-relaxed max-w-md mb-10">
            Finanças pessoais com precisão de centavos, hábitos diários,
            disciplinas de estudo e rotina — tudo no seu painel.
          </p>

          {/* Feature Cards */}
          <div className="space-y-3">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className={`flex items-center gap-4 p-4 rounded-xl border ${f.bg} backdrop-blur-sm transition-all duration-200 hover:scale-[1.02]`}
                >
                  <div className={`${f.color} flex-shrink-0`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{f.title}</p>
                    <p className="text-xs text-slate-400">{f.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <p className="relative z-10 text-xs text-slate-600">
          © {new Date().getFullYear()} PersonalHub · Dados armazenados de forma segura no seu banco
        </p>
      </div>

      {/* ─── Coluna Direita: Autenticação ─── */}
      <div className="w-full lg:w-1/2 bg-slate-900 flex items-center justify-center p-8 relative">
        {/* Mobile header (visível apenas em mobile) */}
        <div className="absolute top-8 left-8 flex items-center gap-2 lg:hidden">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold text-white">PersonalHub</span>
        </div>

        <div className="w-full max-w-sm space-y-8">
          {/* Auth Header */}
          <div className="text-center">
            <h2 className="text-2xl xl:text-3xl font-bold text-white mb-2">
              Entrar na sua conta
            </h2>
            <p className="text-sm text-slate-400">
              Use sua conta Google para acessar seus dados pessoais
            </p>
          </div>

          {/* Google Sign In Button */}
          <button
            onClick={() => signIn("google", { callbackUrl: "/" })}
            className="w-full flex items-center justify-between gap-3 px-6 py-4 rounded-xl bg-slate-800 border border-slate-700 hover:border-slate-500 hover:bg-slate-750 transition-all duration-200 group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              {/* Google Icon SVG */}
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              <span className="text-sm font-semibold text-white">
                Continuar com Google
              </span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition-all duration-200" />
          </button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-700" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-slate-900 px-4 text-slate-500">conta única pessoal</span>
            </div>
          </div>

          {/* Info box */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 text-center">
            <p className="text-xs text-slate-400 leading-relaxed">
              Seu nome, e-mail e foto vêm do Google. Os dados do app ficam no seu Postgres (Neon).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
