import { Fragment, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertCircle, ArrowLeft, Save, LogOut, ExternalLink, RefreshCw, UploadCloud, Image as ImageIcon, CheckCircle2 } from "lucide-react";
import { toast, Toaster } from "sonner";
import Logo from "../components/site/Logo";
import { fetchSettings, updateSettings, uploadImage, auth, verifyAdmin } from "../lib/api";
import { useSettings } from "../lib/settings";
import RecoveryCodePanel from "../components/admin/RecoveryCodePanel";

const FIELDS = [
  { group: "Opening frame", key: "hero_video_url", label: "Hero video URL (mp4)", full: true, placeholder: "https://…/hero.mp4" },
  { group: "Opening frame", key: "hero_poster_url", label: "Hero cover image", help: "Shown while the hero video loads, or as the main hero when no video is set.", upload: true, full: true, placeholder: "https://…/poster.jpg" },
  { group: "Opening frame", key: "hero_headline_1", label: "Hero — line 1", full: false, placeholder: "Stories that feel" },
  { group: "Opening frame", key: "hero_headline_2", label: "Hero — line 2", full: false, placeholder: "like your own." },
  { group: "Opening frame", key: "hero_subtitle", label: "Hero subtitle", full: true, placeholder: "One sentence about the work…", textarea: true },
  { group: "Photographer's note", key: "about_photo_url", label: "Your portrait", help: "A vertical photograph works best here.", upload: true, full: true, placeholder: "https://…/karan.jpg" },
  { group: "Photographer's note", key: "about_bio_1", label: "Bio paragraph 1", full: true, textarea: true, placeholder: "I photograph weddings…" },
  { group: "Photographer's note", key: "about_bio_2", label: "Bio paragraph 2", full: true, textarea: true, placeholder: "My work sits somewhere between…" },
  { group: "Studio details", key: "phone", label: "Phone", full: false, placeholder: "+91 98765 43210" },
  { group: "Studio details", key: "whatsapp", label: "WhatsApp number", full: false, placeholder: "+91 98765 43210" },
  { group: "Studio details", key: "email", label: "Email", full: false, placeholder: "hello@karanpande.in" },
  { group: "Studio details", key: "instagram", label: "Instagram handle (no @)", full: false, placeholder: "karanpande" },
  { group: "Studio details", key: "location", label: "Studio location", full: true, placeholder: "Sambhaji Nagar, Maharashtra · India" },
];

export default function AdminSettings() {
  const nav = useNavigate();
  const { refresh } = useSettings();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [uploading, setUploading] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);

  const loadSettings = async () => {
    setLoadError("");
    try { setForm(await fetchSettings()); }
    catch { setLoadError("The settings could not be loaded from the studio API."); }
  };

  useEffect(() => {
    (async () => {
      const ok = await verifyAdmin();
      if (!ok) { nav("/admin/login"); return; }
      await loadSettings();
    })();
  }, [nav]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const frames = Array.from({ length: 5 }, (_, index) => form?.featured_frames?.[index] || { url: "", title: `Frame ${index + 1}`, fit: "cover", position: "center" });

  const uploadToField = async (key, file) => {
    if (!file) return;
    setUploading(key); setUploadProgress(0);
    try {
      const url = await uploadImage(file, setUploadProgress);
      set(key, url);
      toast.success("Image uploaded. Save changes when you are ready.");
    } catch (err) { toast.error(err?.response?.data?.detail || "Upload failed"); }
    finally { setUploading(""); setUploadProgress(0); }
  };

  const setFrame = (index, patch) => setForm((current) => {
    const next = Array.from({ length: 5 }, (_, frameIndex) => current.featured_frames?.[frameIndex] || { url: "", title: `Frame ${frameIndex + 1}`, fit: "cover", position: "center" });
    next[index] = { ...next[index], ...patch };
    return { ...current, featured_frames: next };
  });

  const uploadFrame = async (index, file) => {
    if (!file) return;
    const uploadKey = `frame-${index}`;
    setUploading(uploadKey); setUploadProgress(0);
    try {
      const url = await uploadImage(file, setUploadProgress);
      setFrame(index, { url });
      toast.success(`Collage frame ${index + 1} replaced. Save changes when ready.`);
    } catch (err) { toast.error(err?.response?.data?.detail || "Upload failed"); }
    finally { setUploading(""); setUploadProgress(0); }
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await updateSettings(form);
      setForm(updated);
      await refresh();
      toast.success("Settings saved");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const logout = () => { auth.clear(); nav("/admin/login"); };

  if (!form && loadError) {
    return <div className="min-h-screen bg-[color:var(--cream)] flex flex-col gap-5 items-center justify-center px-6 text-center"><AlertCircle className="text-[color:var(--copper)]"/><p>{loadError}</p><button onClick={loadSettings} className="btn-pill filled"><RefreshCw size={12}/> Retry</button></div>;
  }

  if (!form) {
    return (
      <div className="min-h-screen bg-[color:var(--cream)] flex items-center justify-center" data-testid="admin-settings-loading">
        <div className="eyebrow text-[color:var(--ink)]/50">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[color:var(--cream)]" data-testid="admin-settings">
      <Toaster richColors position="top-center" />

      <div className="border-b border-white/10 bg-[color:var(--ink)] text-[color:var(--cream)]">
        <div className="mx-auto max-w-[1400px] px-6 md:px-10 py-5 flex items-center justify-between">
          <div className="flex items-baseline gap-6">
            <Link to="/" className="block text-[color:var(--cream)]">
              <Logo className="h-10 w-auto" />
            </Link>
            <span className="eyebrow text-[color:var(--copper)] hidden md:inline">Studio Panel</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/admin" className="btn-pill on-dark" data-testid="admin-back-media"><ArrowLeft size={12}/> Media library</Link>
            <Link to="/" target="_blank" className="btn-pill on-dark hidden md:inline-flex" data-testid="admin-view-site"><ExternalLink size={12}/> View site</Link>
            <button onClick={logout} className="btn-pill on-dark" data-testid="admin-settings-logout"><LogOut size={12}/> Logout</button>
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}
        className="mx-auto max-w-[1000px] px-6 md:px-10 py-14"
      >
        <div className="eyebrow">Site settings · Visual identity</div>
        <h1 className="font-serif text-5xl md:text-6xl mt-2">The darkroom.</h1>
        <p className="mt-4 max-w-xl text-[color:var(--ink)]/70">
          Replace photographs by choosing a file from your device, edit the words,
          preview the result, then press Save changes. No code or image URLs required.
        </p>

        <form onSubmit={submit} className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
          {FIELDS.map((f, index) => (
            <Fragment key={f.key}>
            {FIELDS.findIndex((item) => item.group === f.group) === index && (
              <div className="md:col-span-2 border-t border-[color:var(--ink)]/15 pt-6 mt-4"><span className="eyebrow text-[color:var(--copper)]">{f.group}</span></div>
            )}
            <div className={f.full ? "md:col-span-2" : ""}>
              <label className="eyebrow block mb-2">{f.label}</label>
              {f.help && <p className="text-xs text-[color:var(--ink)]/55 mb-3">{f.help}</p>}
              {f.upload && (
                <div className="grid sm:grid-cols-[180px_1fr] gap-4 mb-4 items-stretch">
                  <div className="aspect-[4/3] bg-[color:var(--ink)] overflow-hidden border border-[color:var(--ink)]/10">
                    {form[f.key] ? <img src={form[f.key]} alt={`${f.label} preview`} className="w-full h-full object-cover" /> : <div className="h-full flex items-center justify-center text-white/35"><ImageIcon/></div>}
                  </div>
                  <label className="upload-dropzone">
                    {uploading === f.key ? <RefreshCw className="animate-spin"/> : <UploadCloud/>}
                    <span className="font-medium">{uploading === f.key ? `Uploading ${uploadProgress}%` : "Choose a new photograph"}</span>
                    <span className="text-xs text-[color:var(--ink)]/50">JPG, PNG or WebP · up to 12 MB</span>
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={!!uploading} onChange={(event) => uploadToField(f.key, event.target.files?.[0])} />
                  </label>
                </div>
              )}
              {f.textarea ? (
                <textarea
                  rows={3}
                  value={form[f.key] || ""}
                  onChange={(e) => set(f.key, e.target.value)}
                  data-testid={`settings-${f.key}`}
                  placeholder={f.placeholder}
                  className="w-full border border-[color:var(--ink)]/15 bg-[color:var(--surface)] px-4 py-3 outline-none focus:border-[color:var(--copper)] font-sans text-sm"
                />
              ) : (
                <input
                  type="text"
                  value={form[f.key] || ""}
                  onChange={(e) => set(f.key, e.target.value)}
                  data-testid={`settings-${f.key}`}
                  placeholder={f.placeholder}
                  className="w-full border border-[color:var(--ink)]/15 bg-[color:var(--surface)] px-4 py-3 outline-none focus:border-[color:var(--copper)] font-sans text-sm"
                />
              )}
            </div></Fragment>
          ))}

          <section className="md:col-span-2 border-t border-[color:var(--ink)]/15 pt-8 mt-4" data-testid="collage-editor">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div><div className="eyebrow text-[color:var(--copper)]">Homepage collage</div><h2 className="font-serif text-3xl mt-2">Five frames below the hero.</h2></div>
              <p className="text-xs text-[color:var(--ink)]/55 max-w-sm">Choose five photographs and short names. The first image is the large vertical frame.</p>
            </div>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {frames.map((frame, index) => (
                <div key={index} className="bg-[color:var(--surface)] border border-[color:var(--ink)]/10 p-3">
                  <div className="relative aspect-[4/5] bg-[color:var(--ink)] overflow-hidden">
                    {frame.url ? <img src={frame.url} alt={`Collage frame ${index + 1}`} className="w-full h-full" style={{ objectFit: frame.fit || "cover", objectPosition: frame.position || "center" }} /> : <div className="h-full flex items-center justify-center text-white/30"><ImageIcon/></div>}
                    <span className="absolute top-2 left-2 bg-[color:var(--ink)] text-white px-2 py-1 text-[9px] font-mono">0{index + 1}</span>
                  </div>
                  <input value={frame.title || ""} onChange={(event) => setFrame(index, { title: event.target.value })} className="w-full border-b border-[color:var(--ink)]/15 bg-transparent py-2 text-sm outline-none focus:border-[color:var(--copper)]" placeholder="Short caption" aria-label={`Caption for collage frame ${index + 1}`} />
                  <label className="block mt-2 text-[9px] font-mono uppercase tracking-wider text-[color:var(--ink)]/55">Photo fit
                    <select value={frame.fit || "cover"} onChange={(event) => setFrame(index, { fit: event.target.value })} className="mt-1 w-full bg-transparent border border-[color:var(--ink)]/15 p-2 text-xs normal-case tracking-normal font-sans">
                      <option value="cover">Fill frame</option><option value="contain">Show whole photo</option>
                    </select>
                  </label>
                  <label className="block mt-2 text-[9px] font-mono uppercase tracking-wider text-[color:var(--ink)]/55">Focus
                    <select value={frame.position || "center"} onChange={(event) => setFrame(index, { position: event.target.value })} disabled={(frame.fit || "cover") === "contain"} className="mt-1 w-full bg-transparent border border-[color:var(--ink)]/15 p-2 text-xs normal-case tracking-normal font-sans disabled:opacity-40">
                      <option value="center">Center</option><option value="top">Top</option><option value="bottom">Bottom</option><option value="left">Left</option><option value="right">Right</option>
                    </select>
                  </label>
                  <label className="mt-2 btn-pill w-full justify-center cursor-pointer" style={{ padding: ".55rem" }}>
                    {uploading === `frame-${index}` ? <RefreshCw size={12} className="animate-spin"/> : <UploadCloud size={12}/>} {uploading === `frame-${index}` ? `${uploadProgress}%` : "Replace"}
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={!!uploading} onChange={(event) => uploadFrame(index, event.target.files?.[0])}/>
                  </label>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-[color:var(--ink)]/55"><CheckCircle2 size={14} className="text-[color:var(--copper)]"/> Changes stay private until you press Save changes.</div>
          </section>

          {/* Recovery codes save and apply on their own, not via Save changes */}
          <RecoveryCodePanel />

          {/* Live hero preview */}
          <div className="md:col-span-2 border-t border-[color:var(--ink)]/10 pt-8">
            <div className="eyebrow mb-3">Live preview</div>
            <div className="relative aspect-[21/9] overflow-hidden bg-[color:var(--ink)]">
              {form.hero_video_url ? (
                <video
                  key={form.hero_video_url}
                  className="w-full h-full object-cover"
                  src={form.hero_video_url}
                  poster={form.hero_poster_url}
                  autoPlay muted loop playsInline
                  data-testid="settings-hero-preview"
                />
              ) : (
                <img src={form.hero_poster_url} alt="poster" className="w-full h-full object-cover" />
              )}
              <div className="absolute inset-0 video-scrim" />
              <div className="absolute bottom-6 left-6 right-6 text-[color:var(--cream)]">
                <div className="font-serif italic text-3xl md:text-5xl leading-[0.9]">
                  <div>{form.hero_headline_1 || "—"}</div>
                  <div>{form.hero_headline_2 || "—"}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 flex items-center gap-3 justify-end">
            <button
              type="button"
              onClick={async () => { const s = await fetchSettings(); setForm(s); toast.info("Reverted"); }}
              className="btn-pill"
              data-testid="settings-revert"
            >
              Revert
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-pill filled"
              data-testid="settings-save"
            >
              <Save size={12}/> {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
