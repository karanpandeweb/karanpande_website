import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Play } from "lucide-react";
import { fetchAlbums } from "../lib/api";
import RevealHeading from "../components/site/RevealHeading";
import { FadeUp } from "../components/site/Reveal";
import { fallbackAlbums } from "../data/fallbackContent";

/**
 * Album grid — used for /wedding, /pre-wedding, /cinematic.
 * Renders one card per album (couple name / film title) linking to the album page.
 */
export default function GalleryPage({ category, title, chapter, subtitle, next }) {
  const [albums, setAlbums] = useState(() => fallbackAlbums(category));

  useEffect(() => {
    setAlbums(fallbackAlbums(category));
    fetchAlbums(category).then((items) => setAlbums(items.length ? items : fallbackAlbums(category))).catch(() => {});
  }, [category]);

  // asymmetric col-span pattern
  const spans = [
    "col-span-12 md:col-span-8",
    "col-span-12 md:col-span-4",
    "col-span-6 md:col-span-6",
    "col-span-6 md:col-span-6",
    "col-span-12 md:col-span-5",
    "col-span-12 md:col-span-7",
  ];
  const ratios = ["aspect-[16/10]", "aspect-[4/5]", "aspect-[4/5]", "aspect-[4/5]", "aspect-[4/5]", "aspect-[16/10]"];

  const isCinematic = category === "cinematic";
  const basePath = `/${category}`;

  return (
    <div className="pt-28 md:pt-40 pb-20 md:pb-24" data-testid={`gallery-${category}`}>
      {/* Header */}
      <section className="mx-auto max-w-[1600px] px-5 md:px-10">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 md:col-span-9">
            <div className="eyebrow">{chapter} · Contact sheet</div>
            <RevealHeading
              lines={[title]}
              className="font-serif italic text-[color:var(--ink)] leading-[0.9] mt-5 md:mt-6 tracking-tight block"
              style={{ fontSize: "clamp(3rem, 11vw, 8rem)" }}
            />
          </div>
          <div className="col-span-12 md:col-span-3 md:pt-6 md:text-right">
            <span className="eyebrow text-[color:var(--copper)]">{String(albums.length).padStart(2, "0")} story rolls</span>
          </div>
        </div>
        <FadeUp delay={0.4}>
          <p className="mt-8 md:mt-14 max-w-2xl text-lg leading-relaxed text-[color:var(--ink)]/75">
            {subtitle}
          </p>
        </FadeUp>
      </section>

      {/* Albums */}
      {/* Grid */}
      <section className="mx-auto max-w-[1600px] px-5 md:px-10 mt-14 md:mt-20">
        {albums.length === 0 ? (
          <div className="py-32 text-center text-[color:var(--ink)]/50 border-y border-[color:var(--ink)]/10">
            <p className="font-serif italic text-3xl">Albums coming soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-4 md:gap-6">
            {albums.map((a, i) => (
              <FadeUp key={a.id} delay={(i % 3) * 0.06} className={spans[i % spans.length]}>
                <Link
                  to={`${basePath}/${a.slug}`}
                  data-testid={`album-card-${a.slug}`}
                  className="group block"
                >
                  <div className={`img-frame ${ratios[i % ratios.length]} relative`}>
                    {a.cover && <img src={a.cover} alt={a.name} style={{ objectFit: a.cover_fit || "cover", objectPosition: a.cover_position || "center" }} />}
                    {isCinematic && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-[color:var(--copper)]/95 flex items-center justify-center text-[color:var(--cream)] transition-transform group-hover:scale-105">
                          <Play size={22} fill="currentColor" />
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex items-start justify-between">
                    <div>
                      <h3 className="font-serif text-3xl md:text-4xl italic">{a.name}</h3>
                      <div className="mt-1 flex items-center gap-3 text-[10px] tracking-[0.28em] uppercase text-[color:var(--ink)]/60">
                        {a.location && <span>{a.location}</span>}
                        {a.date && <><span className="text-[color:var(--copper)]">·</span><span>{a.date}</span></>}
                      </div>
                    </div>
                    <span className="font-serif text-[color:var(--copper)] text-xl">{String(i + 1).padStart(2, "0")}</span>
                  </div>
                  {a.description && (
                    <p className="mt-3 max-w-lg text-[color:var(--ink)]/70 text-sm leading-relaxed">
                      {a.description}
                    </p>
                  )}
                  <div className="mt-3 flex items-center gap-2 text-[10px] tracking-[0.3em] uppercase text-[color:var(--ink)]/60 group-hover:text-[color:var(--copper)] transition-colors">
                    View contact sheet <ArrowUpRight size={12} />
                  </div>
                </Link>
              </FadeUp>
            ))}
          </div>
        )}
      </section>

      {/* Next chapter */}
      {next && (
        <section className="mx-auto max-w-[1600px] px-5 md:px-10 mt-24 md:mt-48">
          <FadeUp>
            <div className="border-t border-[color:var(--ink)]/15 pt-10 flex items-end justify-between">
              <div>
                <div className="eyebrow">Next chapter</div>
                <Link to={next.to} data-testid="next-chapter" className="font-serif italic text-6xl md:text-8xl block mt-3 hover:text-[color:var(--copper)] transition-colors">
                  {next.title}
                </Link>
              </div>
              <ArrowUpRight size={40} className="text-[color:var(--copper)]" />
            </div>
          </FadeUp>
        </section>
      )}
    </div>
  );
}
