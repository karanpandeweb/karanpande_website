import { Link } from "react-router-dom";
import { Instagram, Phone, Mail } from "lucide-react";
import Logo from "./Logo";
import { useSettings } from "../../lib/settings";

export default function Footer() {
  const { settings } = useSettings();
  const s = settings || {};
  return (
    <footer className="bg-[color:var(--sage-deep)] text-[color:var(--cream)] pt-24 pb-10" data-testid="site-footer">
      <div className="mx-auto max-w-[1500px] px-6 md:px-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-16 items-start">
          <div className="md:col-span-5">
            <Link to="/" className="block" style={{ color: "var(--cream)" }}>
              <Logo className="h-14 md:h-16 w-auto" />
            </Link>
            <p className="mt-8 font-serif italic text-3xl md:text-4xl max-w-md leading-[1.15]">
              Observed quietly. Developed honestly. Kept for a lifetime.
            </p>
          </div>

          <div className="md:col-span-3">
            <div className="eyebrow text-[color:var(--copper)]">Contact sheets</div>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link to="/wedding" className="hover:text-[color:var(--copper)]">Weddings</Link></li>
              <li><Link to="/pre-wedding" className="hover:text-[color:var(--copper)]">Pre-Wedding</Link></li>
              <li><Link to="/cinematic" className="hover:text-[color:var(--copper)]">Cinematic</Link></li>
              <li><Link to="/contact" className="hover:text-[color:var(--copper)]">Contact</Link></li>
            </ul>
          </div>

          <div className="md:col-span-4">
            <div className="eyebrow text-[color:var(--copper)]">Commission a story</div>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex items-center gap-3"><Phone size={14} /> {s.phone || "+91 98000 00000"}</li>
              <li className="flex items-center gap-3"><Mail size={14} /> {s.email || "hello@karanpande.in"}</li>
              <li className="flex items-center gap-3"><Instagram size={14} /> @{(s.instagram || "karanpande").replace(/^@/, "")}</li>
            </ul>
            <Link
              to="/admin/login"
              data-testid="footer-admin-link"
              className="mt-8 inline-block text-[10px] tracking-[0.3em] uppercase text-[color:var(--cream)]/60 hover:text-[color:var(--copper)]"
            >
              Studio Access
            </Link>
          </div>
        </div>

        <div className="mt-16 border-t border-[color:var(--cream)]/15 pt-6 flex flex-col md:flex-row justify-between text-[10px] tracking-[0.3em] uppercase text-[color:var(--cream)]/60">
          <span>© {new Date().getFullYear()} Shutter Shots by KP · All rights reserved</span>
          <span>Est. 2019 · Sambhaji Nagar</span>
        </div>
      </div>
    </footer>
  );
}
