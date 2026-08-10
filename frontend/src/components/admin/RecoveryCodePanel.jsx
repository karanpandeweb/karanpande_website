import { useEffect, useState } from "react";
import { Copy, KeyRound, RefreshCw, ShieldAlert, ShieldCheck } from "lucide-react";
import { fetchRecoveryStatus, generateRecoveryCode } from "../../lib/api";
import { toast } from "sonner";

/**
 * Issues the one-time code that unlocks /admin/forgot-password.
 *
 * The server only ever stores a hash, so the plaintext shown here after
 * generating cannot be retrieved again — the panel says so plainly rather
 * than implying the code can be looked up later.
 */
export default function RecoveryCodePanel() {
  const [status, setStatus] = useState(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchRecoveryStatus()
      .then(setStatus)
      .catch(() => setStatus({ has_recovery_code: false, issued_at: null }));
  }, []);

  const generate = async () => {
    setBusy(true);
    try {
      const data = await generateRecoveryCode();
      setCode(data.recovery_code);
      setStatus({ has_recovery_code: true, issued_at: new Date().toISOString() });
      toast.success("Recovery code created. Save it now.");
    } catch (err) {
      toast.error("Could not create a recovery code.");
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Copied to clipboard.");
    } catch {
      toast.error("Copy failed — select the code and copy it manually.");
    }
  };

  const issued = status?.issued_at ? new Date(status.issued_at).toLocaleString() : null;

  return (
    <section
      className="md:col-span-2 border-t border-[color:var(--ink)]/15 pt-8 mt-4"
      data-testid="recovery-code-panel"
    >
      <div className="eyebrow text-[color:var(--copper)]">Account recovery</div>
      <h2 className="font-serif text-3xl mt-2">If you forget your password.</h2>
      <p className="mt-3 text-sm leading-relaxed text-[color:var(--ink)]/60 max-w-2xl">
        A recovery code lets you set a new password from the sign-in screen without
        touching any server settings. Keep it in your password manager or written
        somewhere safe — it is shown once and works once.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={generate}
          disabled={busy}
          data-testid="generate-recovery-code"
          className="btn-pill disabled:opacity-60"
        >
          {busy ? <RefreshCw size={12} className="animate-spin" /> : <KeyRound size={12} />}
          {status?.has_recovery_code ? "Generate a new code" : "Generate recovery code"}
        </button>

        {status && (
          <span className="flex items-center gap-2 text-xs text-[color:var(--ink)]/55">
            {status.has_recovery_code ? (
              <><ShieldCheck size={14} className="text-[color:var(--copper)]" /> Active code{issued ? ` · issued ${issued}` : ""}</>
            ) : (
              <><ShieldAlert size={14} className="text-red-700" /> No recovery code yet</>
            )}
          </span>
        )}
      </div>

      {code && (
        <div className="mt-6 border border-[color:var(--copper)]/40 bg-[color:var(--copper)]/5 p-5" data-testid="recovery-code-value">
          <div className="eyebrow text-[color:var(--copper)]">Save this now</div>
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <code className="font-mono text-xl tracking-[0.2em] select-all break-all">{code}</code>
            <button type="button" onClick={copy} className="btn-pill" style={{ padding: ".55rem 1rem" }}>
              <Copy size={12} /> Copy
            </button>
          </div>
          <p className="mt-3 text-xs text-[color:var(--ink)]/60">
            This code will not be shown again. Generating another one replaces it.
          </p>
        </div>
      )}

      {status?.has_recovery_code && !code && (
        <p className="mt-4 text-xs text-[color:var(--ink)]/50">
          A code is already active. If you no longer have it, generate a new one — the old one stops working.
        </p>
      )}
    </section>
  );
}
