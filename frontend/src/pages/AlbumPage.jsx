import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, Play } from "lucide-react";
import { fetchAlbumBySlug } from "../lib/api";
import RevealHeading from "../components/site/RevealHeading";
import { FadeUp } from "../components/site/Reveal";
import Lightbox from "../components/site/Lightbox";
import { fallbackAlbum } from "../data/fallbackContent";

const catLabels = { "wedding": "Weddings", "pre-wedding": "Pre-Wedding", "cinematic": "Cinematic" };

export default function AlbumPage({ category }) {
  const { slug } = useParams();
  const nav = useNavigate();
  const [data, setData] = useState(null);
  const [active, setActive] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fallback = fallbackAlbum(category, slug);
    setData(fallback); setNotFound(false); setActive(null);
    fetchAlbumBySlug(category, slug)
      .then(setData)
      .catch(() => { if (!fallback) setNotFound(true); });
  }, [category, slug]);

  if (notFound) {
    return (
      <div className="pt-40 pb-24 text-center" data-testid="album-not-found">
        <div className="eyebrow">404 · Album</div>
        <h1 className="font-serif italic text-6xl mt-3">We couldn&rsquo;t find that folder.</h1>
        <button onClick={() => nav(`/${category}`)} className="btn-pill mt-10">
          <ArrowLeft size={14} /> Back to {catLabels[category]}
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center" data-testid="album-loading">
        <div className="eyebrow text-[color:var(--ink)]/50">Loading album…</div>
      </div>
    );
  }

  const album = data.album;
  const items = data.media || [];
  const isVideo = category === "cinematic";

  // asymmetric spans for photos
  const spans = [
    "col-span-12 md:col-span-8 aspect-[16/10]",
    "col-span-12 md:col-span-4 aspect-[4/5]",
    "col-span-6 md:col-span-5 aspect-[4/5]",
    "col-span-6 md:col-span-7 aspect-[16/11]",
    "col-span-12 md:col-span-12 aspect-[21/9]",
    "col-span-6 md:col-span-6 aspect-[3/4]",
    "col-span-6 md:col-span-6 aspect-[3/4]",
  ];

  return (
    <div className="pt-28 md:pt-40 pb-20 md:pb-24" data-testid={`album-${album.slug}`}>
      {/* Header */}
      <section className="mx-auto max-w-[1600px] px-5 md:px-10">
        <Link to={`/${category}`} className="eyebrow inline-flex items-center gap-2 hover:text-[color:var(--copper)]">
          <ArrowLeft size={12} /> {catLabels[category]} contact sheet
        </Link>
        <div className="grid grid-cols-12 gap-6 mt-6">
          <div className="col-span-12 md:col-span-9">
            <RevealHeading
              lines={[album.name]}
              className="font-serif italic text-[color:var(--ink)] leading-[0.9] tracking-tight block"
              style={{ fontSize: "clamp(2.75rem, 10vw, 7.5rem)" }}
            />
          </div>
          <div className="col-span-12 md:col-span-3 md:pt-6 md:text-right">
            <div className="text-[10px] tracking-[0.28em] uppercase text-[color:var(--ink)]/60">
              {album.location}
            </div>
            {album.date && (
              <div className="mt-1 eyebrow text-[color:var(--copper)]">{album.date}</div>
            )}
          </div>
        </div>
        {album.description && (
          <FadeUp delay={0.4}>
            <p className="mt-8 md:mt-14 max-w-2xl text-lg leading-relaxed text-[color:var(--ink)]/75">
              {album.description}
            </p>
          </FadeUp>
        )}
      </section>

      {/* Media */}
      <section className="mx-auto max-w-[1600px] px-5 md:px-10 mt-12 md:mt-24">
        {items.length === 0 ? (
          <div className="py-32 text-center text-[color:var(--ink)]/50 border-y border-[color:var(--ink)]/10">
            <p className="font-serif italic text-3xl">This roll is in the darkroom.</p>
          </div>
        ) : isVideo ? (
          <div className="grid grid-cols-12 gap-4 md:gap-8">
            {items.map((v, i) => (
              <FadeUp key={v.id} delay={(i % 3) * 0.06} className={i === 0 ? "col-span-12" : "col-span-12 md:col-span-6"}>
                <button
                  onClick={() => setActive(v)}
                  data-testid={`album-video-${i + 1}`}
                  className="img-frame w-full block group"
                  style={{ aspectRatio: i === 0 ? "21 / 9" : "16 / 9" }}
                >
                  {v.poster && <img src={v.poster} alt={v.title} />}
                  <div className="absolute inset-0 bg-[color:var(--ink)]/25 group-hover:bg-[color:var(--ink)]/10 transition-colors flex items-center justify-center">
                    <span className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-[color:var(--copper)]/95 flex items-center justify-center text-[color:var(--cream)] transition-transform group-hover:scale-105">
                      <Play size={26} fill="currentColor" />
                    </span>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4 flex justify-between text-[color:var(--cream)]">
                    <span className="font-serif italic text-2xl md:text-3xl">{v.title}</span>
                    {v.caption && <span className="text-[10px] tracking-[0.3em] uppercase self-end">{v.caption}</span>}
                  </div>
                </button>
              </FadeUp>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-3 md:gap-5">
            {items.map((it, i) => (
              <FadeUp key={it.id} delay={(i % 4) * 0.05} className={spans[i % spans.length]}>
                <button
                  onClick={() => setActive(it)}
                  data-testid={`album-img-${i + 1}`}
                  className="img-frame w-full h-full block"
                >
                  <img src={it.url} alt={it.title || album.name} loading="lazy" style={{ objectFit: it.fit || "cover", objectPosition: it.position || "center" }} />
                </button>
                {it.title && (
                  <div className="mt-2 flex items-center justify-between text-[10px] tracking-[0.3em] uppercase text-[color:var(--ink)]/60">
                    <span>{it.title}</span>
                    <span className="text-[color:var(--copper)]">{String(i + 1).padStart(2, "0")}</span>
                  </div>
                )}
              </FadeUp>
            ))}
          </div>
        )}
      </section>

      {/* Back to folder */}
      <section className="mx-auto max-w-[1600px] px-6 md:px-10 mt-32 md:mt-40">
        <FadeUp>
          <div className="border-t border-[color:var(--ink)]/15 pt-10 flex items-end justify-between">
            <div>
              <div className="eyebrow">Back to contact sheet</div>
              <Link
                to={`/${category}`}
                data-testid="back-to-folder"
                className="font-serif italic text-5xl md:text-7xl block mt-3 hover:text-[color:var(--copper)] transition-colors"
              >
                All {catLabels[category]} →
              </Link>
            </div>
            <ArrowUpRight size={40} className="text-[color:var(--copper)]" />
          </div>
        </FadeUp>
      </section>

      <Lightbox open={!!active} onClose={() => setActive(null)}>
        {active && (
          active.kind === "video"
            ? <video src={active.url} controls autoPlay className="max-w-[92vw] max-h-[86vh]" data-testid="lightbox-video" />
            : <img src={active.url} alt={active.title || album.name} className="max-w-full max-h-[88vh] object-contain" />
        )}
      </Lightbox>
    </div>
  );
}
