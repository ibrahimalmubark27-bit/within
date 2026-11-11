import { useLang } from "../lib/i18n";
import { waHref } from "../lib/booking";
import { useStore } from "../lib/store";
import { Line, Reveal, WhatsAppIcon } from "./ui";

export function Visit() {
  const { t, lang } = useLang();
  const { settings } = useStore();

  return (
    <section id="visit" className="relative bg-alabaster py-24 md:py-32 border-t-[0.5px] border-line">
      <div className="mx-auto max-w-[1440px] px-5 md:px-10">
        <div className="grid grid-cols-12 gap-x-6 gap-y-12">
          <div className="col-span-12 lg:col-span-5">
            <Reveal>
              <p className="eyebrow text-espresso/60">{t.visit.eyebrow}</p>
            </Reveal>
            <h2 className="mt-6 font-display font-light text-espresso text-[clamp(2.6rem,5.4vw,5rem)] leading-[0.95] tracking-[-0.03em]">
              <Line>{t.visit.title1}</Line>
              <Line delay={0.1}>
                <span className="accent">{t.visit.accent}</span>
              </Line>
            </h2>

            <Reveal delay={0.15}>
              <div className="mt-8 max-w-[380px] border-t-[0.5px] border-line pt-6">
                <p className="eyebrow text-espresso/50 !text-[9.5px]">{lang === "ar" ? "الحجز" : "Reservations"}</p>
                <p className="mt-3 text-[14px] leading-[1.8] text-espresso/70">
                  {lang === "ar"
                    ? "الحجز عبر الموقع مباشرة — تُحفظ ساعتكِ فوراً، ويتواصل معكِ الكونسيرج للتأكيد."
                    : "Book directly on the site — your hour is held instantly and our concierge confirms with you."}
                </p>
              </div>
            </Reveal>
          </div>

          {/* Location details temporarily removed — concierge only */}
          <div className="col-span-12 lg:col-span-6 lg:col-start-7">
            <Reveal delay={0.1}>
              <div className="relative overflow-hidden rounded-[24px] bg-powder p-8 md:p-10">
                <svg className="absolute -top-10 end-[-40px] w-[320px] h-[320px] text-espresso/10" viewBox="0 0 200 200" fill="none" aria-hidden>
                  {[90, 70, 50, 30].map((r) => (
                    <circle key={r} cx="100" cy="100" r={r} stroke="currentColor" strokeWidth="0.5" />
                  ))}
                  <path d="M0 100H200M100 0V200" stroke="currentColor" strokeWidth="0.5" />
                </svg>

                <div className="relative">
                  <p className="eyebrow text-espresso/60">{t.visit.concierge}</p>
                  <p className="mt-4 font-display text-[clamp(2.2rem,5vw,3.4rem)] text-espresso leading-none tabular-nums" dir="ltr">
                    {settings.whatsappDisplay}
                  </p>
                  <p className="mt-5 max-w-[420px] text-[14px] leading-[1.75] text-espresso/70">
                    {t.hero.sub}
                  </p>

                  <a
                    href={waHref(settings.whatsapp)}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-8 inline-flex h-12 items-center gap-3 rounded-full bg-espresso text-alabaster px-6 text-[13.5px] transition-shadow duration-700 hover:shadow-[0_0_0_4px_rgba(250,235,166,0.95)]"
                  >
                    <WhatsAppIcon />
                    {t.visit.whatsapp}
                  </a>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
