import { useLang } from "../lib/i18n";
import { SALON } from "../lib/data";
import { useStore } from "../lib/store";
import { waHref } from "../lib/booking";
import { ArrowIcon, InstagramIcon, LangToggle, Magnetic, Reveal, WhatsAppIcon } from "./ui";

export function Footer({ onBook, onNav }: { onBook: () => void; onNav: (id: string) => void }) {
  const { t } = useLang();
  const { settings } = useStore();
  return (
    <footer className="relative bg-espresso text-alabaster overflow-hidden">
      <div className="mx-auto max-w-[1440px] px-5 md:px-10 pt-24 md:pt-32 pb-10">
        <div className="grid grid-cols-12 gap-6 items-end">
          <div className="col-span-12 md:col-span-7">
            <p className="eyebrow text-alabaster/50">{t.drawer.title}</p>
            <p className="mt-6 font-display font-light text-[clamp(2.4rem,5vw,4.8rem)] leading-[1] tracking-[-0.02em]">
              <span className="accent text-butter">{t.footer.line}</span>
            </p>
          </div>
          <div className="col-span-12 md:col-span-5 md:justify-self-end">
            <Magnetic strength={0.4}>
              <button
                onClick={onBook}
                className="group h-14 ps-7 pe-2 rounded-full bg-alabaster text-espresso text-[14px] flex items-center gap-5 transition-shadow duration-700 hover:shadow-[0_0_0_5px_rgba(250,235,166,0.9)]"
              >
                {t.book}
                <span className="w-10 h-10 rounded-full bg-butter grid place-items-center transition-transform duration-700 group-hover:rotate-[-45deg] rtl:group-hover:rotate-[45deg]">
                  <ArrowIcon />
                </span>
              </button>
            </Magnetic>
          </div>
        </div>

        <div className="mt-20 grid grid-cols-2 md:grid-cols-3 gap-8 border-t-[0.5px] border-alabaster/15 pt-10">
          <div>
            <p className="eyebrow text-alabaster/40">{t.nav.services}</p>
            <ul className="mt-4 space-y-2 text-[13.5px] text-alabaster/80">
              {(["services", "atelier", "visit"] as const).map((id) => (
                <li key={id}>
                  <button onClick={() => onNav(id)} className="hover:text-butter transition-colors duration-500 rounded-sm">
                    {t.nav[id]}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="eyebrow text-alabaster/40">{t.footer.follow}</p>
            <ul className="mt-4 space-y-2 text-[13.5px] text-alabaster/80">
              <li>
                <a href={SALON.instagram} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-butter transition-colors duration-500 rounded-sm">
                  <InstagramIcon /> Instagram
                </a>
              </li>
              <li>
                <a href={waHref(settings.whatsapp)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-butter transition-colors duration-500 rounded-sm">
                  <WhatsAppIcon /> <span dir="ltr">{settings.whatsappDisplay}</span>
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className="eyebrow text-alabaster/40">{t.footer.language}</p>
            <LangToggle dark className="mt-4" />
          </div>
        </div>

        <Reveal y={60} className="mt-24 flex justify-center">
          <img
            src="https://i.postimg.cc/9M2tgrgG/IMG-4209.png"
            alt="within BEAUTY SALON AND SPA"
            style={{ width: "240px", height: "auto", minWidth: "200px" }}
            className="object-contain mix-blend-multiply opacity-90 mb-4"
            loading="eager"
            decoding="async"
          />
        </Reveal>

        <div className="mt-16 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-alabaster/40 border-t-[0.5px] border-alabaster/15 pt-6">
          <span>© {new Date().getFullYear()} within Beauty Salon and Spa — Doha, Qatar. {t.footer.rights}</span>
          <span className="flex items-center gap-5">
            <span dir="ltr">Women-only sanctuary</span>
            <a
              href="/admin"
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey) return;
                e.preventDefault();
                window.history.pushState({}, "", "/admin");
                window.dispatchEvent(new Event("popstate"));
              }}
              className="group inline-flex items-center gap-1.5 text-alabaster/55 hover:text-butter transition-colors duration-500 rounded-sm"
              aria-label="Admin console"
            >
              <span className="w-3.5 h-3.5 rounded-[3px] border-[0.5px] border-current grid place-items-center text-[7px] leading-none">◆</span>
              <span className="tracking-[0.2em] uppercase keep-tracking text-[10px]">Admin</span>
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
