import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Trash2, Edit3, LogOut, Image as ImageIcon, Film,
  ExternalLink, Settings as SettingsIcon, Star, Folder, FileImage,
  AlertCircle, CheckCircle2, RefreshCw, Database,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import Logo from "../components/site/Logo";
import {
  fetchAllMedia, createMedia, updateMedia, deleteMedia,
  fetchAllAlbums, createAlbum, updateAlbum, deleteAlbum,
  fetchTestimonials, createTestimonial, updateTestimonial, deleteTestimonial,
  auth, verifyAdmin, uploadImage,
} from "../lib/api";

const CATEGORIES = [
  { key: "wedding", label: "Wedding" },
  { key: "pre-wedding", label: "Pre-Wedding" },
  { key: "cinematic", label: "Cinematic" },
];

export default function AdminDashboard() {
  const nav = useNavigate();
  const [section, setSection] = useState("albums"); // albums | media | testimonials
  const [tab, setTab] = useState("wedding"); // category filter for albums/media
  const [albums, setAlbums] = useState([]);
  const [media, setMedia] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [modal, setModal] = useState(null); // { kind, mode, item }
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    (async () => {
      const ok = await verifyAdmin();
      if (!ok) { nav("/admin/login"); return; }
      loadAll();
    })();
  // eslint-disable-next-line
  }, []);

  const loadAll = async () => {
    setLoading(true);
    setLoadError("");
    const results = await Promise.allSettled([fetchAllAlbums(), fetchAllMedia(), fetchTestimonials()]);
    if (results[0].status === "fulfilled") setAlbums(results[0].value);
    if (results[1].status === "fulfilled") setMedia(results[1].value);
    if (results[2].status === "fulfilled") setTestimonials(results[2].value);
    if (results.some((result) => result.status === "rejected")) setLoadError("Some studio content could not be loaded. Your existing data has not been changed.");
    setLoading(false);
  };

  const logout = () => { auth.clear(); nav("/admin/login"); };

  const albumsByCategory = useMemo(() => albums.filter((a) => a.category === tab), [albums, tab]);
  const mediaByCategory = useMemo(() => media.filter((m) => m.category === tab), [media, tab]);

  const albumOptions = albumsByCategory.map((a) => ({ id: a.id, name: a.name }));
  const albumNameById = Object.fromEntries(albums.map((a) => [a.id, a.name]));

  const counts = {
    albums: albums.length,
    media: media.length,
    testimonials: testimonials.length,
  };
  const orphanedMedia = media.filter((item) => !item.album_id || !albums.some((album) => album.id === item.album_id)).length;

  const onSaveAlbum = async (payload, id) => {
    try {
      if (id) { await updateAlbum(id, payload); toast.success("Album updated"); }
      else { await createAlbum(payload); toast.success("Album created"); }
      setModal(null); loadAll();
    } catch (e) { toast.error(e?.response?.data?.detail || "Save failed"); }
  };
  const onDeleteAlbum = async (id) => {
    if (!window.confirm("Delete this album? (Media stays but is un-linked.)")) return;
    try { await deleteAlbum(id); toast.success("Album deleted"); loadAll(); }
    catch { toast.error("Delete failed"); }
  };

  const onSaveMedia = async (payload, id) => {
    try {
      if (id) { await updateMedia(id, payload); toast.success("Media updated"); }
      else { await createMedia(payload); toast.success("Media added"); }
      setModal(null); loadAll();
    } catch (e) { toast.error(e?.response?.data?.detail || "Save failed"); }
  };
  const onDeleteMedia = async (id) => {
    if (!window.confirm("Delete this media item?")) return;
    try { await deleteMedia(id); toast.success("Deleted"); loadAll(); }
    catch { toast.error("Delete failed"); }
  };

  const onSaveTestimonial = async (payload, id) => {
    try {
      if (id) { await updateTestimonial(id, payload); toast.success("Testimonial updated"); }
      else { await createTestimonial(payload); toast.success("Testimonial added"); }
      setModal(null); loadAll();
    } catch (e) { toast.error(e?.response?.data?.detail || "Save failed"); }
  };
  const onDeleteTestimonial = async (id) => {
    if (!window.confirm("Delete this testimonial?")) return;
    try { await deleteTestimonial(id); toast.success("Deleted"); loadAll(); }
    catch { toast.error("Delete failed"); }
  };

  return (
    <div className="contact-sheet min-h-screen bg-[color:var(--cream)]" data-testid="admin-dashboard">
      <Toaster richColors position="top-center" />

      {/* Top bar */}
      <div className="border-b border-white/10 bg-[color:var(--ink)] text-[color:var(--cream)] sticky top-0 z-40">
        <div className="mx-auto max-w-[1500px] px-6 md:px-10 py-4 flex items-center justify-between">
          <Link to="/" className="block text-[color:var(--cream)]">
            <Logo className="h-10 w-auto" />
          </Link>
          <div className="flex items-center gap-2 md:gap-3">
            <Link to="/admin/settings" className="btn-pill on-dark" data-testid="admin-settings-link">
              <SettingsIcon size={12} /> Site Settings
            </Link>
            <Link to="/" target="_blank" className="btn-pill on-dark hidden sm:inline-flex" data-testid="admin-view-site">
              <ExternalLink size={12} /> View site
            </Link>
            <button onClick={logout} data-testid="admin-logout" className="btn-pill on-dark">
              <LogOut size={12} /> Logout
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1500px] px-6 md:px-10 py-10">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 bg-[color:var(--surface)] border border-[color:var(--ink)]/10 p-6 md:p-8">
          <div>
            <div className="eyebrow">Studio operating system · Archive 01</div>
            <h1 className="font-serif text-5xl md:text-6xl mt-3">The contact sheet.</h1>
            <p className="mt-3 text-sm text-[color:var(--ink)]/60 max-w-xl">Curate albums, sequence photographs, publish films, and keep every public-facing detail in focus.</p>
          </div>
          <div className="grid grid-cols-3 gap-2 md:gap-4 min-w-0 lg:min-w-[520px]">
            <SectionCard active={section === "albums"} onClick={() => setSection("albums")} icon={Folder} label="Stories" count={counts.albums} testid="section-albums" />
            <SectionCard active={section === "media"} onClick={() => setSection("media")} icon={FileImage} label="Photos & films" count={counts.media} testid="section-media" />
            <SectionCard active={section === "testimonials"} onClick={() => setSection("testimonials")} icon={Star} label="Client notes" count={counts.testimonials} testid="section-testimonials" />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 bg-[color:var(--ink)] text-[color:var(--cream)]">
          <StudioMetric icon={loading ? RefreshCw : CheckCircle2} label="API status" value={loading ? "Syncing" : loadError ? "Attention" : "In sync"} spin={loading} />
          <StudioMetric icon={Database} label="Published frames" value={String(media.length).padStart(2, "0")} />
          <StudioMetric icon={Folder} label="Story folders" value={String(albums.length).padStart(2, "0")} />
          <StudioMetric icon={orphanedMedia ? AlertCircle : CheckCircle2} label="Unassigned media" value={String(orphanedMedia).padStart(2, "0")} alert={orphanedMedia > 0} />
        </div>

        {loadError && (
          <div className="mt-4 border border-[color:var(--copper)]/40 bg-[color:var(--surface)] p-4 flex items-center justify-between gap-4" role="alert">
            <span className="text-sm flex items-center gap-3"><AlertCircle size={17} className="text-[color:var(--copper)]" />{loadError}</span>
            <button onClick={loadAll} className="btn-pill"><RefreshCw size={12}/> Retry</button>
          </div>
        )}

        <div className="mt-6 grid md:grid-cols-3 border border-[color:var(--ink)]/10 bg-[color:var(--surface)]">
          {["Create a story folder", "Upload photographs into it", "Preview the site and publish"].map((step, index) => <div key={step} className="p-4 md:p-5 border-b md:border-b-0 md:border-r last:border-0 border-[color:var(--ink)]/10 flex gap-3"><span className="font-mono text-[color:var(--copper)] text-xs">0{index + 1}</span><span className="text-sm">{step}</span></div>)}
        </div>

        {/* Category tab bar (only for albums / media) */}
        {(section === "albums" || section === "media") && (
          <div className="mt-10 flex items-center gap-2 border-b border-[color:var(--ink)]/10">
            {CATEGORIES.map((c) => (
              <button
                key={c.key}
                onClick={() => setTab(c.key)}
                data-testid={`tab-${c.key}`}
                className={`px-4 py-3 text-[11px] tracking-[0.28em] uppercase font-semibold transition-colors ${
                  tab === c.key ? "text-[color:var(--copper)] border-b-2 border-[color:var(--copper)]" : "text-[color:var(--ink)]/60 hover:text-[color:var(--ink)]"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        )}

        {/* ALBUMS section */}
        {section === "albums" && (
          <div className="mt-8">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-3xl">{CATEGORIES.find(c => c.key === tab)?.label} — {albumsByCategory.length} albums</h2>
              <button
                onClick={() => setModal({ kind: "album", mode: "create", item: { category: tab, order: albumsByCategory.length + 1 } })}
                data-testid="add-album-btn"
                className="btn-pill filled"
              >
                <Plus size={14} /> Create story
              </button>
            </div>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              {albumsByCategory.map((a) => (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  className="admin-content-card border border-[color:var(--ink)]/10 bg-[color:var(--surface)] overflow-hidden"
                  data-testid={`album-row-${a.slug}`}
                >
                  <div className="aspect-[4/3] bg-[color:var(--cream-2)] overflow-hidden">
                    {a.cover && <img src={a.cover} alt={a.name} className="w-full h-full" style={{ objectFit: a.cover_fit || "cover", objectPosition: a.cover_position || "center" }} />}
                  </div>
                  <div className="p-4">
                    <div className="font-serif italic text-2xl">{a.name}</div>
                    <div className="text-[10px] tracking-[0.28em] uppercase text-[color:var(--ink)]/60 mt-1">
                      {a.location || "—"} {a.date && ` · ${a.date}`}
                    </div>
                    <div className="mt-1 text-xs text-[color:var(--ink)]/60">
                      {media.filter((m) => m.album_id === a.id).length} items · slug: {a.slug}
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => setModal({ kind: "album", mode: "edit", item: a })}
                        data-testid={`album-edit-${a.slug}`}
                        className="btn-pill flex-1 justify-center" style={{ padding: "0.55rem 0.8rem" }}
                      >
                        <Edit3 size={12}/> Edit
                      </button>
                      <button
                        onClick={() => onDeleteAlbum(a.id)}
                        data-testid={`album-delete-${a.slug}`}
                        className="btn-pill flex-1 justify-center"
                        style={{ padding: "0.55rem 0.8rem", borderColor: "rgba(180,60,60,0.4)", color: "#a33" }}
                      >
                        <Trash2 size={12}/> Delete
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
              {albumsByCategory.length === 0 && (
                <div className="col-span-full text-center py-16 border border-dashed border-[color:var(--ink)]/20">
                  <p className="font-serif text-2xl">No albums yet.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MEDIA section */}
        {section === "media" && (
          <div className="mt-8">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-3xl">{CATEGORIES.find(c => c.key === tab)?.label} media — {mediaByCategory.length} items</h2>
              <button
                onClick={() => setModal({
                  kind: "media", mode: "create",
                  item: {
                    category: tab, kind: tab === "cinematic" ? "video" : "image",
                    url: "", poster: "", title: "", caption: "",
                    order: mediaByCategory.length + 1,
                    album_id: albumsByCategory[0]?.id || "",
                  }
                })}
                data-testid="add-media-btn"
                className="btn-pill filled"
              >
                <Plus size={14} /> Add {tab === "cinematic" ? "film" : "photograph"}
              </button>
            </div>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mediaByCategory.map((it) => (
                <motion.div key={it.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  className="admin-content-card border border-[color:var(--ink)]/10 bg-[color:var(--surface)] overflow-hidden"
                  data-testid={`media-item-${it.id}`}
                >
                  <div className="aspect-[4/3] bg-[color:var(--cream-2)] relative overflow-hidden">
                    {it.kind === "video" ? (
                      <>
                        {it.poster && <img src={it.poster} alt={it.title} className="w-full h-full" style={{ objectFit: it.fit || "cover", objectPosition: it.position || "center" }} />}
                        <div className="absolute top-3 left-3 bg-[color:var(--copper)] text-[color:var(--cream)] text-[10px] tracking-[0.2em] uppercase px-2 py-1 flex items-center gap-1"><Film size={12}/>Video</div>
                      </>
                    ) : (
                      <>
                        <img src={it.url} alt={it.title} className="w-full h-full" style={{ objectFit: it.fit || "cover", objectPosition: it.position || "center" }} />
                        <div className="absolute top-3 left-3 bg-[color:var(--sage-deep)] text-[color:var(--cream)] text-[10px] tracking-[0.2em] uppercase px-2 py-1 flex items-center gap-1"><ImageIcon size={12}/>Image</div>
                      </>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="font-serif text-xl truncate">{it.title || "Untitled"}</div>
                    <div className="text-[10px] tracking-[0.3em] uppercase text-[color:var(--ink)]/50 mt-1">
                      Album · {albumNameById[it.album_id] || "—"} · Order {it.order}
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => setModal({ kind: "media", mode: "edit", item: it })}
                        data-testid={`edit-${it.id}`}
                        className="btn-pill flex-1 justify-center" style={{ padding: "0.55rem 0.8rem" }}
                      ><Edit3 size={12}/> Edit</button>
                      <button
                        onClick={() => onDeleteMedia(it.id)}
                        data-testid={`delete-${it.id}`}
                        className="btn-pill flex-1 justify-center"
                        style={{ padding: "0.55rem 0.8rem", borderColor: "rgba(180,60,60,0.4)", color: "#a33" }}
                      ><Trash2 size={12}/> Delete</button>
                    </div>
                  </div>
                </motion.div>
              ))}
              {mediaByCategory.length === 0 && (
                <div className="col-span-full text-center py-16 border border-dashed border-[color:var(--ink)]/20">
                  <p className="font-serif text-2xl">No media in this category yet.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TESTIMONIALS section */}
        {section === "testimonials" && (
          <div className="mt-10">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-3xl">Testimonials — {testimonials.length}</h2>
              <button
                onClick={() => setModal({ kind: "testimonial", mode: "create", item: { author: "", role: "", quote: "", rating: 5, order: testimonials.length + 1 } })}
                data-testid="add-testimonial-btn"
                className="btn-pill filled"
              ><Plus size={14} /> New testimonial</button>
            </div>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {testimonials.map((t) => (
                <div key={t.id} className="border border-[color:var(--ink)]/10 bg-[color:var(--surface)] p-6" data-testid={`testimonial-row-${t.id}`}>
                  <div className="flex gap-1 text-[color:var(--copper)] mb-3">
                    {[...Array(t.rating || 5)].map((_, i) => <Star key={i} size={12} fill="currentColor" />)}
                  </div>
                  <p className="font-serif italic text-xl leading-snug">&ldquo;{t.quote}&rdquo;</p>
                  <div className="mt-4 text-sm">
                    <div className="font-serif text-lg">{t.author}</div>
                    <div className="text-[10px] tracking-[0.28em] uppercase text-[color:var(--ink)]/60 mt-1">{t.role}</div>
                  </div>
                  <div className="mt-5 flex gap-2">
                    <button onClick={() => setModal({ kind: "testimonial", mode: "edit", item: t })} data-testid={`testimonial-edit-${t.id}`} className="btn-pill flex-1 justify-center" style={{ padding: "0.55rem 0.8rem" }}><Edit3 size={12}/> Edit</button>
                    <button onClick={() => onDeleteTestimonial(t.id)} data-testid={`testimonial-delete-${t.id}`} className="btn-pill flex-1 justify-center" style={{ padding: "0.55rem 0.8rem", borderColor: "rgba(180,60,60,0.4)", color: "#a33" }}><Trash2 size={12}/> Delete</button>
                  </div>
                </div>
              ))}
              {testimonials.length === 0 && (
                <div className="col-span-full text-center py-16 border border-dashed border-[color:var(--ink)]/20">
                  <p className="font-serif text-2xl">No testimonials yet.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {modal?.kind === "album" && (
          <AlbumModal initial={modal.item} mode={modal.mode} onCancel={() => setModal(null)} onSave={onSaveAlbum} />
        )}
        {modal?.kind === "media" && (
          <MediaModal
            initial={modal.item} mode={modal.mode}
            albumOptions={albums.filter((a) => a.category === (modal.item.category || tab))}
            onCancel={() => setModal(null)} onSave={onSaveMedia}
          />
        )}
        {modal?.kind === "testimonial" && (
          <TestimonialModal initial={modal.item} mode={modal.mode} onCancel={() => setModal(null)} onSave={onSaveTestimonial} />
        )}
      </AnimatePresence>
    </div>
  );
}

function SectionCard({ active, onClick, icon: Icon, label, count, testid }) {
  return (
    <button
      onClick={onClick}
      data-testid={testid}
      className={`text-left border p-3 md:p-4 transition-colors min-w-0 ${
        active
          ? "border-[color:var(--copper)] bg-[color:var(--surface)]"
          : "border-[color:var(--ink)]/10 hover:border-[color:var(--ink)]/30"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="text-[10px] tracking-[0.28em] uppercase text-[color:var(--ink)]/60">{label}</div>
        <Icon size={14} className={active ? "text-[color:var(--copper)]" : "text-[color:var(--ink)]/40"} />
      </div>
      <div className="font-serif text-4xl mt-1">{count}</div>
    </button>
  );
}

function StudioMetric({ icon: Icon, label, value, spin = false, alert = false }) {
  return (
    <div className="p-4 md:p-5 border-r border-b lg:border-b-0 border-white/10 last:border-r-0">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[9px] md:text-[10px] font-mono tracking-wider uppercase text-white/55">{label}</span>
        <Icon size={14} className={`${alert ? "text-[color:var(--copper)]" : "text-white/45"} ${spin ? "animate-spin" : ""}`} />
      </div>
      <div className={`font-serif text-2xl md:text-3xl mt-2 ${alert ? "text-[color:var(--copper)]" : ""}`}>{value}</div>
    </div>
  );
}

function ModalShell({ onCancel, children }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onCancel}
      className="fixed inset-0 z-[100] bg-[color:var(--ink)]/70 backdrop-blur-sm flex items-center justify-center p-4"
      data-testid="admin-modal"
    >
      <motion.form
        initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-[color:var(--surface)] p-8 border border-[color:var(--ink)]/10 max-h-[90vh] overflow-y-auto"
        onSubmit={(e) => e.preventDefault()}
      >
        {children}
        <style>{`.input{width:100%;border:1px solid rgba(26,26,24,0.15);background:transparent;padding:0.6rem 0.8rem;outline:none;font-family:var(--font-sans);font-size:0.9rem}.input:focus{border-color:var(--copper)}`}</style>
      </motion.form>
    </motion.div>
  );
}

function Field({ label, full, children }) {
  return (
    <label className={full ? "col-span-2" : "col-span-1"}>
      <span className="eyebrow block mb-2">{label}</span>
      {children}
    </label>
  );
}

function AlbumModal({ initial, mode, onCancel, onSave }) {
  const [form, setForm] = useState({
    category: initial.category || "wedding",
    name: initial.name || "",
    cover: initial.cover || "",
    description: initial.description || "",
    location: initial.location || "",
    date: initial.date || "",
    order: initial.order || 0,
    cover_fit: initial.cover_fit || "cover",
    cover_position: initial.cover_position || "center",
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <ModalShell onCancel={onCancel}>
      <div className="eyebrow text-[color:var(--copper)]">{mode === "edit" ? "Edit album" : "New album"}</div>
      <h3 className="font-serif italic text-3xl mt-1">{form.name || "Untitled album"}</h3>

      <div className="grid grid-cols-2 gap-4 mt-6">
        {form.cover && (
          <div className="col-span-2 aspect-[16/7] overflow-hidden bg-[color:var(--cream-2)] border border-[color:var(--ink)]/10">
            <img src={form.cover} alt="Album cover preview" className="w-full h-full" style={{ objectFit: form.cover_fit, objectPosition: form.cover_position }} />
          </div>
        )}
        <Field label="Category">
          <select value={form.category} onChange={(e) => set("category", e.target.value)} data-testid="album-modal-category" className="input">
            <option value="wedding">Wedding</option>
            <option value="pre-wedding">Pre-Wedding</option>
            <option value="cinematic">Cinematic</option>
          </select>
        </Field>
        <Field label="Order">
          <input type="number" value={form.order} onChange={(e) => set("order", parseInt(e.target.value || "0", 10))} data-testid="album-modal-order" className="input" />
        </Field>
        <Field label="Couple / film name" full>
          <input value={form.name} onChange={(e) => set("name", e.target.value)} required data-testid="album-modal-name" className="input" placeholder="Aarav & Meera" />
        </Field>
        <Field label="Cover image URL" full>
          <input value={form.cover} onChange={(e) => set("cover", e.target.value)} data-testid="album-modal-cover" className="input" placeholder="https://…" />
          <UploadPicker onUploaded={(url) => set("cover", url)} label="Choose cover from device" />
        </Field>
        <Field label="How should the cover fit?">
          <select value={form.cover_fit} onChange={(e) => set("cover_fit", e.target.value)} className="input"><option value="cover">Fill the frame</option><option value="contain">Show the whole photo</option></select>
        </Field>
        <Field label="Where is the subject?">
          <select value={form.cover_position} onChange={(e) => set("cover_position", e.target.value)} disabled={form.cover_fit === "contain"} className="input disabled:opacity-40"><option value="center">Center</option><option value="top">Near the top</option><option value="bottom">Near the bottom</option><option value="left">On the left</option><option value="right">On the right</option></select>
        </Field>
        <Field label="Location">
          <input value={form.location} onChange={(e) => set("location", e.target.value)} data-testid="album-modal-location" className="input" placeholder="Udaipur, RJ" />
        </Field>
        <Field label="Date">
          <input value={form.date} onChange={(e) => set("date", e.target.value)} data-testid="album-modal-date" className="input" placeholder="Feb 2025" />
        </Field>
        <Field label="Short description" full>
          <textarea rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} data-testid="album-modal-description" className="input" />
        </Field>
      </div>

      <div className="mt-8 flex gap-3 justify-end">
        <button type="button" onClick={onCancel} data-testid="album-modal-cancel" className="btn-pill">Cancel</button>
        <button
          type="button"
          onClick={() => onSave(form, mode === "edit" ? initial.id : null)}
          data-testid="album-modal-save"
          className="btn-pill filled"
        >Save</button>
      </div>
    </ModalShell>
  );
}

function MediaModal({ initial, mode, albumOptions, onCancel, onSave }) {
  const [form, setForm] = useState({
    category: initial.category || "wedding",
    kind: initial.kind || "image",
    url: initial.url || "",
    poster: initial.poster || "",
    title: initial.title || "",
    caption: initial.caption || "",
    order: initial.order || 0,
    album_id: initial.album_id || (albumOptions[0]?.id || ""),
    fit: initial.fit || "cover",
    position: initial.position || "center",
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <ModalShell onCancel={onCancel}>
      <div className="eyebrow text-[color:var(--copper)]">{mode === "edit" ? "Edit media" : "New media"}</div>
      <h3 className="font-serif italic text-3xl mt-1">{form.title || "Untitled item"}</h3>

      <div className="grid grid-cols-2 gap-4 mt-6">
        {(form.kind === "image" ? form.url : form.poster) && (
          <div className="col-span-2 relative aspect-video overflow-hidden bg-[color:var(--ink)]">
            <img src={form.kind === "image" ? form.url : form.poster} alt="Media preview" className="w-full h-full" style={{ objectFit: form.fit, objectPosition: form.position }} />
            <span className="absolute top-3 left-3 bg-[color:var(--copper)] text-white text-[9px] font-mono tracking-wider uppercase px-2 py-1">Live preview</span>
          </div>
        )}
        <Field label="Category">
          <select value={form.category} onChange={(e) => set("category", e.target.value)} data-testid="modal-category" className="input">
            <option value="wedding">Wedding</option>
            <option value="pre-wedding">Pre-Wedding</option>
            <option value="cinematic">Cinematic</option>
          </select>
        </Field>
        <Field label="Kind">
          <select value={form.kind} onChange={(e) => set("kind", e.target.value)} data-testid="modal-kind" className="input">
            <option value="image">Image</option>
            <option value="video">Video</option>
          </select>
        </Field>
        <Field label="Album (folder)" full>
          <select value={form.album_id || ""} onChange={(e) => set("album_id", e.target.value)} data-testid="modal-album" className="input">
            <option value="">— none —</option>
            {albumOptions.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </Field>
        <Field label="Media URL" full>
          <input value={form.url} onChange={(e) => set("url", e.target.value)} required data-testid="modal-url" className="input" placeholder="https://…" />
          {form.kind === "image" && <UploadPicker onUploaded={(url) => set("url", url)} label="Choose photograph from device" />}
        </Field>
        {form.kind === "video" && (
          <Field label="Poster (thumbnail URL)" full>
            <input value={form.poster} onChange={(e) => set("poster", e.target.value)} data-testid="modal-poster" className="input" placeholder="https://…" />
            <UploadPicker onUploaded={(url) => set("poster", url)} label="Choose film cover from device" />
          </Field>
        )}
        <Field label="How should it fit?">
          <select value={form.fit} onChange={(e) => set("fit", e.target.value)} className="input"><option value="cover">Fill the frame</option><option value="contain">Show the whole photo</option></select>
        </Field>
        <Field label="Where is the subject?">
          <select value={form.position} onChange={(e) => set("position", e.target.value)} disabled={form.fit === "contain"} className="input disabled:opacity-40"><option value="center">Center</option><option value="top">Near the top</option><option value="bottom">Near the bottom</option><option value="left">On the left</option><option value="right">On the right</option></select>
        </Field>
        <Field label="Title" full>
          <input value={form.title} onChange={(e) => set("title", e.target.value)} data-testid="modal-title" className="input" />
        </Field>
        <Field label="Caption" full>
          <input value={form.caption} onChange={(e) => set("caption", e.target.value)} data-testid="modal-caption" className="input" />
        </Field>
        <Field label="Order">
          <input type="number" value={form.order} onChange={(e) => set("order", parseInt(e.target.value || "0", 10))} data-testid="modal-order" className="input" />
        </Field>
      </div>

      <div className="mt-8 flex gap-3 justify-end">
        <button type="button" onClick={onCancel} data-testid="modal-cancel" className="btn-pill">Cancel</button>
        <button type="button" onClick={() => onSave(form, mode === "edit" ? initial.id : null)} data-testid="modal-save" className="btn-pill filled">Save</button>
      </div>
    </ModalShell>
  );
}

function UploadPicker({ onUploaded, label }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const choose = async (file) => {
    if (!file) return;
    setUploading(true); setProgress(0);
    try {
      onUploaded(await uploadImage(file, setProgress));
      toast.success("Photograph uploaded");
    } catch (error) {
      toast.error(error?.response?.data?.detail || "Upload failed");
    } finally {
      setUploading(false); setProgress(0);
    }
  };

  return (
    <label className="mt-3 upload-dropzone min-h-[6rem]">
      {uploading ? <RefreshCw size={18} className="animate-spin" /> : <ImageIcon size={18} />}
      <span className="text-sm font-medium">{uploading ? `Uploading ${progress}%` : label}</span>
      <span className="text-[10px] text-[color:var(--ink)]/50">JPG, PNG or WebP · maximum 12 MB</span>
      <input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading} className="sr-only" onChange={(event) => choose(event.target.files?.[0])} />
    </label>
  );
}

function TestimonialModal({ initial, mode, onCancel, onSave }) {
  const [form, setForm] = useState({
    author: initial.author || "",
    role: initial.role || "",
    quote: initial.quote || "",
    rating: initial.rating || 5,
    order: initial.order || 0,
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <ModalShell onCancel={onCancel}>
      <div className="eyebrow text-[color:var(--copper)]">{mode === "edit" ? "Edit testimonial" : "New testimonial"}</div>
      <h3 className="font-serif italic text-3xl mt-1">{form.author || "—"}</h3>

      <div className="grid grid-cols-2 gap-4 mt-6">
        <Field label="Author" full>
          <input value={form.author} onChange={(e) => set("author", e.target.value)} required data-testid="t-modal-author" className="input" placeholder="Aarav & Meera" />
        </Field>
        <Field label="Role / where" full>
          <input value={form.role} onChange={(e) => set("role", e.target.value)} data-testid="t-modal-role" className="input" placeholder="Wedding, Udaipur" />
        </Field>
        <Field label="Quote" full>
          <textarea rows={4} value={form.quote} onChange={(e) => set("quote", e.target.value)} required data-testid="t-modal-quote" className="input" />
        </Field>
        <Field label="Rating (1–5)">
          <input type="number" min={1} max={5} value={form.rating} onChange={(e) => set("rating", parseInt(e.target.value || "5", 10))} data-testid="t-modal-rating" className="input" />
        </Field>
        <Field label="Order">
          <input type="number" value={form.order} onChange={(e) => set("order", parseInt(e.target.value || "0", 10))} data-testid="t-modal-order" className="input" />
        </Field>
      </div>

      <div className="mt-8 flex gap-3 justify-end">
        <button type="button" onClick={onCancel} data-testid="t-modal-cancel" className="btn-pill">Cancel</button>
        <button type="button" onClick={() => onSave(form, mode === "edit" ? initial.id : null)} data-testid="t-modal-save" className="btn-pill filled">Save</button>
      </div>
    </ModalShell>
  );
}
