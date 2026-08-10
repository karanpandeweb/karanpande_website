import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Aperture, Eye, EyeOff, LogIn, ShieldCheck } from "lucide-react";
import { login } from "../lib/api";
import { LOGIN } from "../constants/testIds/auth";
import Logo from "../components/site/Logo";
import { toast, Toaster } from "sonner";

export default function AdminLogin() {
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(u, p);
      toast.success("Welcome back.");
      nav("/admin");
    } catch (err) {
      toast.error("Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[color:var(--ink)]" data-testid="admin-login">
      <Toaster richColors position="top-center" />
      <div className="min-h-screen grid lg:grid-cols-[1.15fr_.85fr]">
      <motion.section
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}
        className="relative hidden lg:block overflow-hidden min-h-screen"
      >
        <img src="/assets/placeholders/ai-hero-wedding.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[color:var(--ink)] via-[color:var(--ink)]/20 to-[color:var(--ink)]/25" />
        <div className="absolute inset-8 border border-white/25" aria-hidden="true" />
        <div className="absolute top-12 left-12 right-12 flex justify-between text-[color:var(--cream)]">
          <Logo variant="icon" className="h-14 w-14" />
          <span className="eyebrow text-white/70">Studio archive · private access</span>
        </div>
        <div className="absolute bottom-14 left-14 right-14 text-[color:var(--cream)]">
          <div className="eyebrow text-[color:var(--copper)]">The workroom</div>
          <p className="font-serif text-5xl xl:text-6xl leading-[1.02] max-w-xl mt-4">Every frame, story and setting—under one roof.</p>
          <div className="mt-8 flex items-center gap-6 text-xs text-white/65 font-mono uppercase tracking-widest">
            <span>Albums</span><span>Contact sheets</span><span>Films</span>
          </div>
        </div>
      </motion.section>

      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
        className="bg-[color:var(--cream)] min-h-screen flex items-center px-6 sm:px-12 lg:px-16 xl:px-24"
      >
        <div className="w-full max-w-md mx-auto">
          <div className="text-[color:var(--ink)] lg:hidden"><Logo className="h-12 w-auto" /></div>
          <div className="flex items-center justify-between">
            <div className="eyebrow text-[color:var(--copper)]">Studio sign-in</div>
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-[color:var(--ink)]/50"><ShieldCheck size={14} /> Protected</div>
          </div>
          <h1 className="font-serif text-5xl sm:text-6xl mt-4">Welcome back,<br/>Karan.</h1>
          <p className="mt-5 text-sm leading-relaxed text-[color:var(--ink)]/60">Enter the private studio to curate stories, reorder frames, publish films, and update your site.</p>

        <form onSubmit={submit} className="mt-10 space-y-6">
          <div>
            <label className="eyebrow block mb-2">Username</label>
            <input
              type="text"
              value={u}
              onChange={(e) => setU(e.target.value)}
              required
              autoComplete="username"
              data-testid="login-username"
              className="admin-input"
            />
          </div>
          <div>
            <label className="eyebrow block mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={p}
                onChange={(e) => setP(e.target.value)}
                required
                autoComplete="current-password"
                data-testid="login-password"
                className="admin-input pr-12"
              />
              <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[color:var(--ink)]/45 hover:text-[color:var(--copper)]" aria-label={showPassword ? "Hide password" : "Show password"}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            data-testid="login-submit"
          className="btn-pill filled w-full justify-between disabled:opacity-60 py-4"
          >
            {loading ? "Signing in…" : (<>Sign in <LogIn size={14} /></>)}
          </button>
        </form>

          <div className="mt-6 text-right">
            <Link
              to="/admin/forgot-password"
              data-testid={LOGIN.forgotPasswordLink}
              className="text-[10px] font-mono uppercase tracking-wider text-[color:var(--ink)]/45 hover:text-[color:var(--copper)]"
            >
              Forgot password?
            </Link>
          </div>

          <div className="mt-8 pt-6 border-t border-[color:var(--ink)]/10 flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-[color:var(--ink)]/45">
            <Aperture size={15} /> Private studio · Sessions expire automatically
          </div>
        </div>
      </motion.main>
      </div>
    </div>
  );
}
