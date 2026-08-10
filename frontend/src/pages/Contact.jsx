import { Instagram, Phone, Mail, MessageCircle } from "lucide-react";
import RevealHeading from "../components/site/RevealHeading";
import { FadeUp } from "../components/site/Reveal";
import { useSettings } from "../lib/settings";
import { FALLBACK_SETTINGS } from "../data/fallbackContent";

function digits(s = "") { return s.replace(/[^\d]/g, ""); }

export default function Contact() {
  const { settings } = useSettings();
  const s = settings || {};
  const phone = s.phone || "";
  const wa = digits(s.whatsapp || s.phone || "");
  const email = s.email || "";
  const ig = (s.instagram || "").replace(/^@/, "");
  const contacts = [
    phone && { icon: Phone, label: "Phone", value: phone, href: `tel:+${digits(phone)}`, testid: "contact-phone" },
    wa && { icon: MessageCircle, label: "WhatsApp", value: "Chat on WhatsApp", href: `https://wa.me/${wa}`, testid: "contact-whatsapp" },
    email && { icon: Mail, label: "Email", value: email, href: `mailto:${email}`, testid: "contact-email" },
    ig && { icon: Instagram, label: "Instagram", value: `@${ig}`, href: `https://instagram.com/${ig}`, testid: "contact-instagram" },
  ].filter(Boolean);

  return (
    <div className="pt-28 md:pt-40 pb-24 md:pb-32" data-testid="contact-page">
      <section className="mx-auto max-w-[1400px] px-5 md:px-10">
        <div className="eyebrow">Chapter 04 · Bookings &amp; commissions</div>
        <RevealHeading
          lines={["Let's talk about", "your wedding."]}
          className="font-serif italic text-[color:var(--ink)] leading-[0.9] mt-5 md:mt-6 tracking-tight block"
          style={{ fontSize: "clamp(2.5rem, 9vw, 7rem)" }}
        />
        <FadeUp delay={0.6}>
          <p className="mt-10 max-w-xl text-lg leading-relaxed text-[color:var(--ink)]/75">
            The nicest enquiries begin with a phone call or a note. Reach out on any
            of the channels below — I typically reply within a day.
          </p>
        </FadeUp>
      </section>

      <section className="mx-auto max-w-[1400px] px-5 md:px-10 mt-14 md:mt-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {contacts.map((c, i) => {
            const Icon = c.icon;
            return (
              <FadeUp key={c.label} delay={i * 0.08}>
                <a
                  href={c.href}
                  target={c.href.startsWith("http") ? "_blank" : undefined}
                  rel="noreferrer"
                  data-testid={c.testid}
                  data-cursor="Open"
                  className="group block border border-[color:var(--ink)]/12 bg-[color:var(--surface)] px-8 py-10 md:px-12 md:py-14 hover:border-[color:var(--copper)] transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="eyebrow text-[color:var(--copper)]">{c.label}</div>
                      <div className="mt-3 font-serif text-3xl md:text-5xl group-hover:text-[color:var(--copper)] transition-colors">{c.value}</div>
                    </div>
                    <Icon size={32} className="text-[color:var(--ink)]/40 group-hover:text-[color:var(--copper)]" />
                  </div>
                </a>
              </FadeUp>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-5 md:px-10 mt-20 md:mt-32">
        <FadeUp>
          <div className="border-t border-[color:var(--sage-deep)]/15 pt-10 bg-[color:var(--sage-soft)] p-8 md:p-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="eyebrow">Studio</div>
              <p className="mt-3 font-serif text-2xl text-[color:var(--sage-deep)]">{s.location || FALLBACK_SETTINGS.location}</p>
            </div>
            <div>
              <div className="eyebrow">Available for</div>
              <p className="mt-3 font-serif text-2xl text-[color:var(--sage-deep)]">Weddings · Pre-Wedding · Cinematic Films</p>
            </div>
            <div>
              <div className="eyebrow">Travels</div>
              <p className="mt-3 font-serif text-2xl text-[color:var(--sage-deep)]">Worldwide, on request</p>
            </div>
          </div>
        </FadeUp>
      </section>
    </div>
  );
}
