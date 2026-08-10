import { Link, NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import Logo from "./Logo";

const links = [
  { to: "/", label: "Index" },
  { to: "/wedding", label: "Weddings" },
  { to: "/pre-wedding", label: "Pre-Wedding" },
  { to: "/cinematic", label: "Cinematic" },
  { to: "/contact", label: "Contact" },
];

export default function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const loc = useLocation();

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40);
    on();
    window.addEventListener("scroll", on);
    return () => window.removeEventListener("scroll", on);
  }, []);

  useEffect(() => setOpen(false), [loc.pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (event) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", onKey); };
  }, [open]);

  const isHome = loc.pathname === "/";
  const onDark = isHome && !scrolled;
  const brandColor = onDark ? "var(--cream)" : "var(--ink)";

  return (
    <>
      <a href="#main-content" className="sr-only focus:not-sr-only fixed top-3 left-3 z-[100] bg-[color:var(--cream)] text-[color:var(--ink)] px-4 py-2">Skip to content</a>
      <motion.header
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1.1, delay: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
        className={`fixed top-0 left-0 right-0 z-[60] transition-colors duration-500 ${
          open ? "bg-[color:var(--ink)]" : scrolled
            ? "bg-[color:var(--cream)]/90 backdrop-blur-md border-b border-[color:var(--ink)]/10"
            : "bg-transparent"
        }`}
        data-testid="site-nav"
      >
        <div className="mx-auto max-w-[1600px] px-6 md:px-10 py-4 flex items-center justify-between">
          <Link to="/" data-testid="nav-logo" className="block" style={{ color: open ? "var(--cream)" : brandColor }}>
            <Logo className="h-9 md:h-11 w-auto" />
          </Link>

          <nav className="hidden md:flex items-center gap-7 xl:gap-10 border-l pl-8" style={{ borderColor: onDark ? "rgba(242,238,229,.22)" : "rgba(23,23,20,.16)" }} aria-label="Primary navigation">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === "/"}
                data-testid={`nav-link-${l.label.toLowerCase().replace(/\s+/g, "-")}`}
                className={({ isActive }) =>
                  `text-[11px] uppercase tracking-[0.28em] font-semibold transition-colors ${
                    onDark ? "text-[color:var(--cream)]" : "text-[color:var(--ink)]"
                  } hover:text-[color:var(--copper)] ${isActive ? "text-[color:var(--copper)]" : ""}`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            <span className="text-[10px] tracking-[0.28em] uppercase" style={{ color: onDark ? "rgba(242,238,229,.8)" : "rgba(23,23,20,.6)" }}>
              Sambhaji Nagar · IN
            </span>
          </div>

          <button
            className="md:hidden"
            style={{ color: open || onDark ? "var(--cream)" : "var(--ink)" }}
            onClick={() => setOpen((s) => !s)}
            data-testid="nav-menu-toggle"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-navigation"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            id="mobile-navigation"
            className="fixed inset-0 z-50 bg-[color:var(--ink)] text-[color:var(--cream)] md:hidden pt-24"
          >
            <div className="px-7 py-8 flex flex-col gap-3">
              {links.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.to === "/"}
                  data-testid={`nav-mobile-${l.label.toLowerCase()}`}
                  className="font-serif text-5xl text-[color:var(--cream)] border-b border-[color:var(--cream)]/15 py-3"
                >
                  {l.label}
                </NavLink>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
