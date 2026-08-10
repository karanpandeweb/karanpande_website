import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Eye, EyeOff, KeyRound, ShieldCheck } from "lucide-react";
import { resetPassword } from "../lib/api";
import Logo from "../components/site/Logo";
import { toast, Toaster } from "sonner";

const MIN_PASSWORD_LENGTH = 12;

export default function AdminForgotPassword() {
  const [username, setUsername] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const mismatch = confirmation.length > 0 && password !== confirmation;
  const tooShort = password.length > 0 && password.length < MIN_PASSWORD_LENGTH;

  const submit = async (e) => {
    e.preventDefault();
    if (mismatch || tooShort) return;
    setLoading(true);
    try {
      await resetPassword(username, code, password);
      toast.success("Password updated. You're signed in.");
      nav("/admin");
    } catch (err) {
      // 409 means no code was ever generated — a different problem from a
      // wrong one, and the admin can't fix it from this screen.
      const status = err?.response?.status;
      if (status === 409) {
        toast.error(err.response.data?.detail ?? "No recovery code has been generated.");
      } else if (status === 429) {
        toast.error("Too many attempts. Try again in 15 minutes.");
      } else {
        toast.error("That username or recovery code isn't right.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[color:var(--ink)]" data-testid="admin-forgot-password">
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
            <span className="eyebrow text-white/70">Studio archive · account recovery</span>
          </div>
          <div className="absolute bottom-14 left-14 right-14 text-[color:var(--cream)]">
            <div className="eyebrow text-[color:var(--copper)]">Locked out</div>
            <p className="font-serif text-5xl xl:text-6xl leading-[1.02] max-w-xl mt-4">Your recovery code opens the door once.</p>
          </div>
        </motion.section>

        <motion.main
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
          className="bg-[color:var(--cream)] min-h-screen flex items-center px-6 sm:px-12 lg:px-16 xl:px-24 py-12"
        >
          <div className="w-full max-w-md mx-auto">
            <div className="text-[color:var(--ink)] lg:hidden"><Logo className="h-12 w-auto" /></div>
            <div className="flex items-center justify-between">
              <div className="eyebrow text-[color:var(--copper)]">Reset password</div>
              <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-[color:var(--ink)]/50"><ShieldCheck size={14} /> Protected</div>
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl mt-4">Use your<br/>recovery code.</h1>
            <p className="mt-5 text-sm leading-relaxed text-[color:var(--ink)]/60">
              Enter the recovery code generated from Site settings. It works once — after this you'll be signed in and can issue a fresh one.
            </p>

            <form onSubmit={submit} className="mt-9 space-y-5">
              <div>
                <label className="eyebrow block mb-2" htmlFor="recovery-username">Username</label>
                <input
                  id="recovery-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                  data-testid="recovery-username-input"
                  className="admin-input"
                />
              </div>

              <div>
                <label className="eyebrow block mb-2" htmlFor="recovery-code">Recovery code</label>
                <input
                  id="recovery-code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                  spellCheck="false"
                  autoCapitalize="characters"
                  placeholder="XXXXX-XXXXX-XXXXX-XXXXX"
                  data-testid="recovery-code-input"
                  className="admin-input font-mono tracking-[0.18em] uppercase placeholder:tracking-normal placeholder:text-[color:var(--ink)]/25"
                />
              </div>

              <div>
                <label className="eyebrow block mb-2" htmlFor="recovery-password">New password</label>
                <div className="relative">
                  <input
                    id="recovery-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={MIN_PASSWORD_LENGTH}
                    autoComplete="new-password"
                    data-testid="recovery-password-input"
                    className="admin-input pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[color:var(--ink)]/45 hover:text-[color:var(--copper)]"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className={`mt-2 text-[11px] font-mono ${tooShort ? "text-red-700" : "text-[color:var(--ink)]/45"}`}>
                  At least {MIN_PASSWORD_LENGTH} characters.
                </p>
              </div>

              <div>
                <label className="eyebrow block mb-2" htmlFor="recovery-confirm">Confirm new password</label>
                <input
                  id="recovery-confirm"
                  type={showPassword ? "text" : "password"}
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                  required
                  autoComplete="new-password"
                  data-testid="recovery-password-confirm-input"
                  className="admin-input"
                />
                {mismatch && (
                  <p className="mt-2 text-[11px] font-mono text-red-700">Passwords don't match.</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || mismatch || tooShort}
                data-testid="recovery-submit-button"
                className="btn-pill filled w-full justify-between disabled:opacity-60 py-4"
              >
                {loading ? "Updating…" : (<>Set new password <KeyRound size={14} /></>)}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-[color:var(--ink)]/10">
              <Link to="/admin/login" className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-[color:var(--ink)]/45 hover:text-[color:var(--copper)]">
                <ArrowLeft size={14} /> Back to sign-in
              </Link>
            </div>
          </div>
        </motion.main>
      </div>
    </div>
  );
}
